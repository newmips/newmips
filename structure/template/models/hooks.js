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
                                            as: 'r_media_notification',
                                            include: [{
                                                model: getModels().E_group,
                                                as: 'r_target_groups'
                                            }, {
                                                model: getModels().E_user,
                                                as: 'r_target_users'
                                            }]
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
									if (!created)
										status.executeActions(model).then(resolve).catch(function(err){
											console.error("Unable to execute actions");
											console.error(err);
											resolve();
										});
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