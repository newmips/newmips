var builder = require('../utils/model_builder');
var fs = require('fs-extra');
var mailer = require('../utils/mailer.js');

var attributes_origin = require("./attributes/e_media_mail.json");
var associations = require("./options/e_media_mail.json");

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

                    var newString = self[property];
                    var regex = new RegExp(/{([^}]*)}/g), matches = null;
                    while ((matches = regex.exec(self[property])) != null) {
                        newString = self[property].replace(matches[0], diveData(dataInstance, matches[1].split('.'), 0));
                    }

                    return newString || "";
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

    builder.addHooks(Model, 'e_media_mail', attributes_origin);

    return Model;
};