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

    Model.hook('afterCreate', function(model, options) {
        var initStatusPromise = [];
        for (var field in attributes_origin) {
            if (field.indexOf('s_') != 0)
                continue;

            initStatusPromise.push(new Promise(function(resolve, reject) {
                var historyModel = 'E_history_'+model_name+'_'+field;
                sequelize.models.E_status.findOrCreate({
                    where: {f_entity: model_name, f_field: field, f_label: 'Initial'},
                    defaults: {f_entity: model_name, f_field: field, f_label: 'Initial'}
                }).spread(function(status, created) {
                    var historyObject = {
                        version:1,
                        fk_id_status_status: status.id,
                        f_comment: 'Creation'
                    };
                    historyObject["fk_id_"+model_urlvalue+"_history_"+field.substring(2)] = model.id;
                    sequelize.models[historyModel].create(historyObject).then(function() {
                        resolve();
                    });
                }).catch(function(e){reject(e);});
            }));
        }

        if (initStatusPromise.length > 0) {
            console.log('model : INIT status');
            return new Promise(function(finishResolve, finishReject) {
                Promise.all(initStatusPromise).then(function() {
                    console.log('model : INIT STATUS OVER. RESOLVING');
                    finishResolve();
                });
            });
        }
        console.log('model : NO INIT status');
    });

    return Model;
};