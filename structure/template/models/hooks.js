const fs = require('fs-extra');
const globalConf = require('../config/global');
const model_builder = require('../utils/model_builder');

const ignoreList = globalConf.synchronization.ignore_list;

function getModels() {
	/* eslint-disable */
	if (!this.models)
		this.models = require('./');
	/* eslint-enable */
	return this.models;
}

function writeJournalLine(line) {
	let journalData;
	try {
		journalData = JSON.parse(fs.readFileSync(__dirname + '/../sync/journal.json', 'utf8'));
	} catch(e) {
		journalData = {"transactions":[]};
	}
	journalData.transactions.push(line);
	fs.writeFileSync(__dirname + '/../sync/journal.json', JSON.stringify(journalData, null, 4), 'utf8');
}

module.exports = function(model_name, attributes) {
	const model_urlvalue = model_name.substring(2);

	return {
		// CREATE HOOKS
		beforeCreate: [{
			name: 'insertCreatedBy',
			func: (model, args) => new Promise((resolve, reject) => {
				try {
					if(!args.req)
						throw 'Missing req';
					model.createdBy = args.req.session.passport.user.f_login;
				} catch (err) {
					console.warn('Missing user for createdBy on table -> ' + model.constructor.tableName)
				}
				resolve();
			})
		}],
		afterCreate: [{
			name: 'initializeEntityStatus',
			func: model => new Promise((finalResolve, finalReject) => {
				// Look for s_status fields. If none, resolve
				const statusFields = [];
				for (const field in attributes)
					if (field.indexOf('s_') == 0)
						statusFields.push(field);
				if (statusFields.length == 0)
					return finalResolve();

				// Special object, no status available
				if (!getModels()['E_' + model_name.substring(2)])
					return finalResolve();

				const initStatusPromise = [];
				let field;
				for (let i = 0; i < statusFields.length; i++) {
					field = statusFields[i];

					initStatusPromise.push(new Promise((resolve, reject) => {
						((fieldIn) => {
							const historyModel = 'E_history_' + model_name.substring(2) + '_' + fieldIn.substring(2);
							getModels().E_status.findOrCreate({
								where: {
									f_entity: model_name,
									f_field: fieldIn,
									f_default: true
								},
								defaults: {
									f_entity: model_name,
									f_field: fieldIn,
									f_name: 'Initial',
									f_default: true,
									f_color: '#999999'
								},
								include: [{
									model: getModels().E_action,
									as: 'r_actions',
									include: [{
										model: getModels().E_media,
										as: 'r_media',
										include: [{
											model: getModels().E_media_mail,
											as: 'r_media_mail'
										}, {
											model: getModels().E_media_notification,
											as: 'r_media_notification'
										}, {
											model: getModels().E_media_sms,
											as: 'r_media_sms'
										}, {
											model: getModels().E_media_task,
											as: 'r_media_task'
										}]
									}]
								}]
							}).spread((status, created) => {
								let includeArray = [];
								if (!created) {
									let fieldsToInclude = [];
									for (let i = 0; i < status.r_actions.length; i++)
										fieldsToInclude = [...fieldsToInclude, ...status.r_actions[i].r_media.getFieldsToInclude()];
									includeArray = model_builder.getIncludeFromFields(getModels(), model_name, fieldsToInclude);
								}

								getModels()['E_' + model_name.substring(2)].findOne({
									where: {
										id: model.id
									},
									include: includeArray
								}).then(modelWithRelations => {
									// Create history object with initial status related to new entity
									const historyObject = {
										version: 1,
										f_comment: ''
									};
									historyObject["fk_id_status_" + fieldIn.substring(2)] = status.id;
									historyObject["fk_id_" + model_urlvalue + "_history_" + fieldIn.substring(2)] = modelWithRelations.id;

									getModels()[historyModel].create(historyObject).then(_ => {
										modelWithRelations['setR_' + fieldIn.substring(2)](status.id).then(_ => {
											if (!created)
												status.executeActions(modelWithRelations).then(resolve).catch(err => {
													console.error("Unable to execute actions");
													console.error(err);
													resolve();
												});
											else
												resolve();
										})
									});
								});
							}).catch(err => {
								reject(err);
							});
						})(field);
					}));
				}

				if (initStatusPromise.length > 0)
					return Promise.all(initStatusPromise).then(finalResolve).catch(finalReject);
				finalResolve();
			})
		}, {
			name: 'synchroJournalCreate',
			func: function(model) {
				if (globalConf.env != "tablet" || ignoreList.indexOf(model_name) != -1)
					return;
				const line = model.dataValues;
				line.verb = 'create';
				line.createdAt = new Date();
				line.updatedAt = new Date();
				line.entityTable = model._modelOptions.tableName;
				line.entityName = model_name.toLowerCase();
				writeJournalLine(line);
			}
		}],
		// UPDATE HOOKS
		beforeUpdate: [{
			name: 'insertUpdatedBy',
			func: (model, args) => new Promise((resolve, reject) => {
				if(args.user)
					model.updatedBy = args.user.f_login;
				else
					console.warn('Missing user for updatedBy on table -> ' + model.constructor.tableName)
				resolve();
			})
		}],
		afterUpdate: [{
			name: 'synchroJournalUpdate',
			func: function(model) {
				if (globalConf.env != "tablet" || ignoreList.indexOf(model_name) != -1)
					return;
				const line = model.dataValues;
				line.verb = 'update';
				line.updatedAt = new Date();
				line.entityTable = model._modelOptions.tableName;
				line.entityName = model_name.toLowerCase();
				writeJournalLine(line);
			}
		}],
		// DELETE HOOKS
		afterDestroy: [{
			name: 'synchroJournalDelete',
			func: function(model) {
				if (globalConf.env != "tablet" || ignoreList.indexOf(model_name) != -1)
					return;
				const line = model.dataValues;
				line.verb = 'delete';
				line.entityTable = model._modelOptions.tableName;
				line.entityName = model_name.toLowerCase();
				writeJournalLine(line);
			}
		}]
	}
}