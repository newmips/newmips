var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var attributes_origin = require("./attributes/e_status.json");
var associations = require("./options/e_status.json");
var model_name = 'e_status';
var model_urlvalue = model_name.substring(2);

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_status',
        classMethods: {
            associate: builder.buildAssociation('E_status', associations)
        },
        instanceMethods: {
            translate: function(lang) {
                var self = this;
                if (!self.r_translations)
                    return;
                for (var i = 0; i < self.r_translations.length; i++)
                    if (self.r_translations[i].f_language == lang) {
                        self.f_name = self.r_translations[i].f_value;
                        break;
                    }
            }
        },
        timestamps: true
    };

    var Model = sequelize.define('E_status', attributes, options);

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