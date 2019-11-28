const fs = require('fs-extra');
const globalConf = require('../config/global');

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
				try {
					if(!args.req)
						throw 'Missing req';
					model.updatedBy = args.req.session.passport.user.f_login;
				} catch (err) {
					console.warn('Missing user for updatedBy on table -> ' + model.constructor.tableName)
				}
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