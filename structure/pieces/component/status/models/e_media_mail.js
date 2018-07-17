var builder = require('../utils/model_builder');
var fs = require('fs-extra');
var mailer = require('../utils/mailer.js');

var attributes_origin = require("./attributes/e_media_mail.json");
var associations = require("./options/e_media_mail.json");
var moment = require('moment');

module.exports = (sequelize, DataTypes) => {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_media_mail',
        timestamps: true
    };

    var Model = sequelize.define('E_media_mail', attributes, options);
    Model.associate = builder.buildAssociation('E_media_mail', associations);
    Model.prototype.execute = function(resolve, reject, dataInstance) {
        var self = this;

        async function insertValues(property) {
            var groupIds = [],
                userIds = [],
                userMails = [],
                newString = self[property];

            var groupRegex = new RegExp(/{(group\|[^])}/g);
            while ((match = groupRegex.exec(self[property])) != null) {
                var groupId = parseInt(match[1].split('|')[1]);
                groupIds.push(groupId);
                newString = newString.replace(match[0], "");
            }
            var groups = await models.E_group.findAll({
                where: {id: {$in: groupIds}},
                include: {model: models.E_user, as: 'r_user'}
            });
            for (var i = 0; i < groups.length; i++)
                for (var j = 0; j < groups[i].r_user.length; j++)
                    if (groups[i].r_user[j].f_email && groups[i].r_user[j].f_email != '')
                        userMails.push(groups[i].r_user[j].f_email);

            var userRegex = new RegExp(/{(user\|[^])}/g);
            while ((match = userRegex.exec(self[property])) != null) {
                var userId = parseInt(match[1].split('|')[1]);
                userIds.push(userId);
                newString = newString.replace(match[0], "");
            }
            var users = await models.E_user.findAll({
                where: {id: {$in: userIds}}
            });
            for (var i = 0; i < users.length; i++)
                if (users[i].f_email && users[i].f_email != '')
                    userMails.push(users[i].f_email);
        }





        function insertVariablesValue(property) {
            function diveData(object, depths, idx) {
                if (!object[depths[idx]])
                    return "";
                else if (typeof object[depths[idx]] === 'object') {
                    if (object[depths[idx]] instanceof Date)
                        return moment(object[depths[idx]]).format("DD/MM/YYYY");
                    return diveData(object[depths[idx]], depths, ++idx);
                } else
                    return object[depths[idx]];
            }

            var newString = self[property];
            var regex = new RegExp(/{([^}]*)}/g),
                matches = null;
            while ((matches = regex.exec(self[property])) != null)
                newString = newString.replace(matches[0], diveData(dataInstance, matches[1].split('.'), 0));

            return newString || "";
        }
        var options = {
            from: insertVariablesValue('f_from'),
            to: insertVariablesValue('f_to'),
            cc: insertVariablesValue('f_cc'),
            cci: insertVariablesValue('f_cci'),
            subject: insertVariablesValue('f_subject'),
            data: dataInstance
        };
        mailer.sendHtml(insertVariablesValue('f_content'), options).then(resolve).catch(reject);
    };
    builder.addHooks(Model, 'e_media_mail', attributes_origin);

    return Model;
};