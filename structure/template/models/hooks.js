const fs = require('fs-extra');
const globalConf = require('../config/global');
const model_builder = require('../utils/model_builder');

let ignoreList = globalConf.synchronization.ignore_list;
// Use function to require/get models and status_helper to avoid diamond inclusion problem
var status_helper
function getStatusHelper(){
	if (!status_helper)
		status_helper = require("../utils/status_helper");
	return status_helper;
}

var models = null;
function getModels() {
	if (!models)
		models = require('./');
	return models;
}

function writeJournalLine(line) {
    var journalData;
    try {
    	journalData = JSON.parse(fs.readFileSync(__dirname + '/../sync/journal.json', 'utf8'));
    }
    catch(e) {
    	journalData = {"transactions":[]};
    }
    journalData.transactions.push(line);
    fs.writeFileSync(__dirname + '/../sync/journal.json', JSON.stringify(journalData, null, 4), 'utf8');
}

module.exports = function(model_name, attributes) {
	var model_urlvalue = model_name.substring(2);

	return {
		// CREATE HOOKS
		afterCreate: [{
			name: 'initializeEntityStatus',
			func: function(model, options) {
				return new Promise((finalResolve, finalReject)=> {
					// Look for s_status fields. If none, resolve
					var statusFields = [];
			        for (var field in attributes)
			            if (field.indexOf('s_') == 0)
			                statusFields.push(field);
			        if (statusFields.length == 0)
			        	return finalResolve();

			        // Special object, no status available
					if (!getModels()['E_'+model_name.substring(2)])
						return finalResolve();

			        var initStatusPromise = [];
			        for (var i = 0; i < statusFields.length; i++) {
			        	var field = statusFields[i];

			            initStatusPromise.push(new Promise(function(resolve, reject) {
			                (function(fieldIn) {
			                    var historyModel = 'E_history_'+model_name+'_'+fieldIn;
			                    getModels().E_status.findOrCreate({
			                        where: {f_entity: model_name, f_field: fieldIn, f_default: true},
			                        defaults: {f_entity: model_name, f_field: fieldIn, f_name: 'Initial', f_default: true, f_color: '#999999'},
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
	                            }).spread(function(status, created) {
					                var include = [];
					                if (!created) {
						                var fieldsToInclude = [];
						                for (var i = 0; i < status.r_actions.length; i++)
						                    fieldsToInclude = fieldsToInclude.concat(status.r_actions[i].r_media.getFieldsToInclude());
						                include = model_builder.getIncludeFromFields(models, model_name, fieldsToInclude);
						            }

									getModels()['E_'+model_name.substring(2)].findOne({
										where: {id: model.id},
										include: include
									}).then((modelWithRelations)=> {
							            // Create history object with initial status related to new entity
				                        var historyObject = {
				                            version:1,
				                            f_comment: ''
				                        };
				                        historyObject["fk_id_status_"+fieldIn.substring(2)] = status.id;
				                        historyObject["fk_id_"+model_urlvalue+"_history_"+fieldIn.substring(2)] = modelWithRelations.id;

				                        getModels()[historyModel].create(historyObject).then(function() {
											modelWithRelations['setR_'+fieldIn.substring(2)](status.id).then(_ => {
												if (!created) {
													status.executeActions(modelWithRelations).then(resolve).catch(function(err){
														console.error("Unable to execute actions");
														console.error(err);
														resolve();
													});
												}
												else
													resolve();
											})
				                        });
			                       	});
			                    }).catch(function(e){reject(e);});
			                })(field);
			            }));
		        	}

			        if (initStatusPromise.length > 0)
			            return Promise.all(initStatusPromise).then(finalResolve).catch(finalReject);
			        else
			        	finalResolve();
				});
		    }
		}, {
			name: 'synchroJournalCreate',
			func: function(model, options) {
				if (globalConf.env != "tablet" || ignoreList.indexOf(model_name) != -1)
					return;
		        let line = model.dataValues;
		        line.verb = 'create';
		        line.createdAt = new Date();
		        line.updatedAt = new Date();
		        line.entityTable = model._modelOptions.tableName;
		        line.entityName = model_name.toLowerCase();
				writeJournalLine(line);
			}
		}],
		// UPDATE HOOKS
		afterUpdate: [{
			name: 'synchroJournalUpdate',
			func: function(model, options) {
				if (globalConf.env != "tablet" || ignoreList.indexOf(model_name) != -1)
					return;
		        var line = model.dataValues;
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
			func: function(model, options) {
				if (globalConf.env != "tablet" || ignoreList.indexOf(model_name) != -1)
					return;
		        var line = model.dataValues;
		        line.verb = 'delete';
		        line.entityTable = model._modelOptions.tableName;
		        line.entityName = model_name.toLowerCase();
				writeJournalLine(line);
			}
		}]
	}
}