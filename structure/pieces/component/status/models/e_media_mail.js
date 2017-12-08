var builder = require('../utils/model_builder');
var fs = require('fs-extra');
var mailer = require('../utils/mailer_newage.js');

var attributes_origin = require("./attributes/e_media_mail.json");
var associations = require("./options/e_media_mail.json");
var model_name = 'e_media_mail';
var model_urlvalue = model_name.substring(2);

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_media_mail',
        classMethods: {
            associate: builder.buildAssociation('E_media_mail', associations)
        },
        instanceMethods: {
            execute: function(resolve, reject, dataInstance) {
                var self = this;
                function insertVariables(property) {
                    function diveData(object, depths, idx) {
                        if (object[depths[idx]] && typeof object[depths[idx]] === 'object')
                            return diveData(object[depths[idx]], depths, ++idx);
                        else if (object[depths[idx]] && typeof object[depths[idx]] === 'string')
                            return object[depths[idx]];
                        return "";
                    }

                    var regex = new RegExp(/{([^}]*)}/g), matches = null, newString;
                    while ((matches = regex.exec(self[property])) != null)
                        newString = self[property].replace(matches[0], diveData(dataInstance, matches[1].split('.'), 0));

                    return newString;
                }

                var options = {
                    from: insertVariables('f_from'),
                    to: insertVariables('f_to'),
                    cc: insertVariables('f_cc'),
                    cci: insertVariables('f_cci'),
                    subject: insertVariables('f_subject'),
                    data: dataInstance
                };
                mailer.sendHtml(self.f_content, options).then(resolve).catch(reject);
            }
        },
        timestamps: true
    };

    var Model = sequelize.define('E_media_mail', attributes, options);

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