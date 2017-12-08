var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var attributes_origin = require("./attributes/MODEL_NAME_LOWER.json");
var associations = require("./options/MODEL_NAME_LOWER.json");
var model_name = 'MODEL_NAME_LOWER';
var model_urlvalue = model_name.substring(2);

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'TABLE_NAME',
        classMethods: {
            associate: builder.buildAssociation('MODEL_NAME', associations)
        },
        timestamps: true
    };

    var Model = sequelize.define('MODEL_NAME', attributes, options);

    Model.addHook('afterCreate', 'initializeEntityStatus', function(model, options) {
        var initStatusPromise = [];
        for (var field in attributes_origin) {
            if (field.indexOf('s_') != 0)
                continue;

            // Create history object with initial status related to new entity
            initStatusPromise.push(new Promise(function(resolve, reject) {
                (function(fieldIn) {
                    var historyModel = 'E_history_'+model_name+'_'+fieldIn;
                    sequelize.models.E_status.findOrCreate({
                        where: {f_entity: model_name, f_field: fieldIn, f_default: true},
                        defaults: {f_entity: model_name, f_field: fieldIn, f_name: 'Initial', f_default: true}
                    }).spread(function(status, created) {
                        var historyObject = {
                            version:1,
                            f_comment: 'Creation'
                        };
                        historyObject["fk_id_status_"+fieldIn.substring(2)] = status.id;
                        historyObject["fk_id_"+model_urlvalue+"_history_"+fieldIn.substring(2)] = model.id;
                        sequelize.models[historyModel].create(historyObject).then(function() {
                            model['setR_'+fieldIn.substring(2)](status.id);
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
    });

    return Model;
};