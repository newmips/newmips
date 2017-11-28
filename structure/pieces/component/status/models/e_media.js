var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var attributes_origin = require("./attributes/e_media.json");
var associations = require("./options/e_media.json");
var model_name = 'e_media';
var model_urlvalue = model_name.substring(2);

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_media',
        classMethods: {
            associate: builder.buildAssociation('E_media', associations)
        },
        instanceMethods: {
            execute: function(data) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    if (!self['r_media_'+self.f_type.toLowerCase()])
                        return reject("No media with type "+self.f_type.toLowerCase());
                    self['r_media_'+self.f_type.toLowerCase()].execute(data, resolve, reject);
                });
            }
        }
        timestamps: true
    };

    var Model = sequelize.define('E_media', attributes, options);

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
                        where: {f_entity: model_name, f_field: fieldIn, f_label: 'Initial'},
                        defaults: {f_entity: model_name, f_field: fieldIn, f_label: 'Initial'}
                    }).spread(function(status, created) {
                        var historyObject = {
                            version:1,
                            f_comment: 'Creation'
                        };
                        historyObject["fk_id_status_"+fieldIn.substring(2)] = status.id;
                        historyObject["fk_id_"+model_urlvalue+"_history_"+fieldIn.substring(2)] = model.id;
                        sequelize.models[historyModel].create(historyObject).then(function() {
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