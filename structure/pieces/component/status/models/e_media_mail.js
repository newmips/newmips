var builder = require('../utils/model_builder');
var fs = require('fs-extra');
var mailer = require('../utils/mailer.js');

var attributes_origin = require("./attributes/e_media_mail.json");
var associations = require("./options/e_media_mail.json");
var moment = require('moment');

var INSERT_USER_GROUP_FIELDS = ['f_from','f_to','f_cc','f_cci'];

module.exports = (sequelize, DataTypes) => {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_media_mail',
        timestamps: true
    };
// console.log(sequelize);
    var Model = sequelize.define('E_media_mail', attributes, options);

    Model.associate = builder.buildAssociation('E_media_mail', associations);
    builder.addHooks(Model, 'e_media_mail', attributes_origin);

    Model.prototype.execute = function(resolve, reject, dataInstance) {
        var self = this;

        async function insertGroupAndUserEmail() {
            for (var fieldIdx = 0; fieldIdx < INSERT_USER_GROUP_FIELDS.length; fieldIdx++) {
                property = INSERT_USER_GROUP_FIELDS[fieldIdx];
                var groupIds = [],
                    userIds = [],
                    userMails = [],
                    intermediateData = {};

                // FETCH GROUP EMAIL
                {
                    // Exctract all group IDs from property to find them all at once
                    var groupRegex = new RegExp(/{(group\|[^}]*)}/g);
                    while ((match = groupRegex.exec(self[property])) != null) {
                        var placeholderParts = match[1].split('|');
                        var groupId = parseInt(placeholderParts[placeholderParts.length-1]);
                        intermediateData['group'+groupId] = {placeholder: match[0], emails: []};
                        groupIds.push(groupId);
                    }

                    // Fetch all groups found and their users
                    var groups = await sequelize.models.E_group.findAll({
                        where: {id: {$in: groupIds}},
                        include: {model: sequelize.models.E_user, as: 'r_user'}
                    });

                    // Exctract email and build intermediateData object used to replace placeholders
                    for (var i = 0; i < groups.length; i++) {
                        var intermediateKey = 'group'+groups[i].id;
                        for (var j = 0; j < groups[i].r_user.length; j++)
                            if (groups[i].r_user[j].f_email && groups[i].r_user[j].f_email != '') {
                                intermediateData[intermediateKey].emails.push(groups[i].r_user[j].f_email);
                                userMails.push(groups[i].r_user[j].f_email);
                            }
                    }
                }

                // FETCH USER EMAIL
                {
                    // Exctract all user IDs from property to find them all at once
                    var userRegex = new RegExp(/{(user\|[^}]*)}/g);
                    while ((match = userRegex.exec(self[property])) != null) {
                        var placeholderParts = match[1].split('|');
                        var userId = parseInt(placeholderParts[placeholderParts.length-1]);
                        intermediateData['user'+userId] = {placeholder: match[0], emails: []};
                        userIds.push(userId);
                    }

                    // Fetch all users found
                    var users = await sequelize.models.E_user.findAll({
                        where: {id: {$in: userIds}}
                    });

                    // Exctract email and build intermediateData object used to replace placeholders
                    for (var i = 0; i < users.length; i++) {
                        var intermediateKey = 'user'+users[i].id;
                        if (users[i].f_email && users[i].f_email != '') {
                            intermediateData[intermediateKey].emails.push(users[i].f_email);
                            userMails.push(users[i].f_email);
                        }
                    }
                }

                // Replace each occurence of {group|label|id} and {user|label|id} placeholders by their built emails list
                for (var prop in intermediateData) {
                    // Escape placeholder and use it as a regex key to execute the replace on self[property]
                    var regKey = intermediateData[prop].placeholder.replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&')
                    // Replace globaly
                    var reg = new RegExp(regKey, 'g');
                    self[property] = self[property].replace(reg, intermediateData[prop].emails.join(', '));
                }
            }
        }

        function insertVariablesValue(property) {
            // Recursive function to dive into relations object until matching field or nothing is found
            function diveData(object, depths, idx) {
                if (!object[depths[idx]])
                    return "";
                else if (typeof object[depths[idx]] === 'object') {
                    if (object[depths[idx]] instanceof Date)
                        return moment(object[depths[idx]]).format("DD/MM/YYYY");
                    return diveData(object[depths[idx]], depths, ++idx);
                }
                else
                    return object[depths[idx]];
            }

            var newString = self[property];
            var regex = new RegExp(/{field\|([^}]*)}/g),
                matches = null;
            while ((matches = regex.exec(self[property])) != null)
                newString = newString.replace(matches[0], diveData(dataInstance, matches[1].split('.'), 0));

            self[property] = newString || "";
            return self[property];
        }

        // Replace {group|id} and {user|id} placeholders before inserting variables
        // to avoid trying to replace placeholders as entity's fields
        insertGroupAndUserEmail().then(function() {
            // Build mail options and replace entity's fields
            var options = {
                from: insertVariablesValue('f_from'),
                to: insertVariablesValue('f_to'),
                cc: insertVariablesValue('f_cc'),
                cci: insertVariablesValue('f_cci'),
                subject: insertVariablesValue('f_subject'),
                data: dataInstance
            };

            // Send mail
            mailer.sendHtml(insertVariablesValue('f_content'), options).then(resolve).catch(reject);
        });
    };

    return Model;
};