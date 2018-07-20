var models = null;
function getModels() {
	if (!models)
		models = require('./');
	return models;
}

module.exports = function(model_name, attributes) {
	var model_urlvalue = model_name.substring(2);

	return {
		afterCreate: [{
			name: 'initializeEntityStatus',
			func: function(model, options) {
		        var initStatusPromise = [];
		        for (var field in attributes) {
		            if (field.indexOf('s_') != 0)
		                continue;

		            // Create history object with initial status related to new entity
		            initStatusPromise.push(new Promise(function(resolve, reject) {
		                (function(fieldIn) {
		                    var historyModel = 'E_history_'+model_name+'_'+fieldIn;
		                    getModels().E_status.findOrCreate({
		                        where: {f_entity: model_name, f_field: fieldIn, f_default: true},
		                        defaults: {f_entity: model_name, f_field: fieldIn, f_name: 'Initial', f_default: true},
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
                                        }]
                                    }]
                                }]
                            }).spread(function(status, created) {
		                        var historyObject = {
		                            version:1,
		                            f_comment: 'Creation'
		                        };
		                        historyObject["fk_id_status_"+fieldIn.substring(2)] = status.id;
		                        historyObject["fk_id_"+model_urlvalue+"_history_"+fieldIn.substring(2)] = model.id;
		                        getModels()[historyModel].create(historyObject).then(function() {
									model['setR_'+fieldIn.substring(2)](status.id);
									if (!created) {
										// Load options of entity to look for relatedTo associations
										var associationProm = [];
										var modelOptions = require(__dirname+'/options/e_'+model_urlvalue);
										for (var i = 0; i < modelOptions.length; i++) {
											var func = 'getR_'+modelOptions[i].as.substring(2);
											// If relatedTo association is found, execute the association getter so actions can use associations values
											if (model[func] && modelOptions[i].structureType == 'relatedTo')
												(function(alias) {
													associationProm.push(new Promise(function(assoReso, assoReje) {
														model[func]().then(function(asso) {
															model[alias] = asso;
															assoReso();
														}).catch(assoReje);
													}));
												})(modelOptions[i].as);
										}
										Promise.all(associationProm).then(function() {
											status.executeActions(model).then(resolve).catch(function(err){
												console.error("Unable to execute actions");
												console.error(err);
												resolve();
											});
										}).catch(function(err){
											console.error("Unable to execute actions");
											console.error(err);
											resolve();
										});
									}
									else
		                            	resolve();
		                        });
		                    }).catch(function(e){reject(e);});
		                })(field);
		            }));
		        }

		        if (initStatusPromise.length > 0) {
		            return new Promise(function(finishResolve, finishReject) {
		                Promise.all(initStatusPromise).then(function() {
		                    finishResolve();
		                });
		            });
		        }
		    }
		}],
		afterUpdate: [],
		afterDelete: []
	}
}