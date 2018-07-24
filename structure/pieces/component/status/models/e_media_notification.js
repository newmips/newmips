var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var attributes_origin = require("./attributes/e_media_notification.json");
var associations = require("./options/e_media_notification.json");
var socket;
var models;
var moment = require('moment');

module.exports = (sequelize, DataTypes) => {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_media_notification',
        timestamps: true
    };

    var Model = sequelize.define('E_media_notification', attributes, options);
    Model.associate = builder.buildAssociation('E_media_notification', associations);
    Model.prototype.execute = function(resolve, reject, dataInstance) {
        var self = this;
        if (!models)
            models = require('./index');

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
            var regex = new RegExp(/{field\|([^}]*)}/g),
                matches = null;
            while ((matches = regex.exec(self[property])) != null)
                newString = newString.replace(matches[0], diveData(dataInstance, matches[1].split('.'), 0));

            return newString || "";
        }

        async function getGroupAndUserID() {
            property = 'f_targets';
            var userIds = [];

            // FETCH GROUP USERS
            {
                var groupIds = [];
                // Exctract all group IDs from property to find them all at once
                var groupRegex = new RegExp(/{(group\|[^}]*)}/g);
                while ((match = groupRegex.exec(self[property])) != null) {
                    var placeholderParts = match[1].split('|');
                    var groupId = parseInt(placeholderParts[placeholderParts.length-1]);
                    groupIds.push(groupId);
                }

                // Fetch all groups found and their users
                var groups = await sequelize.models.E_group.findAll({
                    where: {id: {$in: groupIds}},
                    include: {model: sequelize.models.E_user, as: 'r_user'}
                });

                // Exctract email and build intermediateData object used to replace placeholders
                for (var i = 0; i < groups.length; i++) {
                    for (var j = 0; j < groups[i].r_user.length; j++)
                        userIds.push(groups[i].r_user[j].id);
                }
            }

            // FETCH USERS
            {
                // Exctract all user IDs from property to find them all at once
                var userRegex = new RegExp(/{(user\|[^}]*)}/g);
                while ((match = userRegex.exec(self[property])) != null) {
                    var placeholderParts = match[1].split('|');
                    var userId = parseInt(placeholderParts[placeholderParts.length-1]);
                    userIds.push(userId);
                }
            }

            // FETCH USER TARGETED THROUGH RELATION
            {
                function findAndPushUser(object, path, depth) {
                    if (depth < path.length && (!path[depth] || !object[path[depth]]))
                        return null;
                    if (depth < path.length)
                        return findAndPushUser(object[path[depth]], path, ++depth);

                    var targetedUser = object;
                    if (targetedUser instanceof Array)
                        for (var i = 0; i < targetedUser.length; i++)
                            userIds.push(targetedUser[i].id);
                    else
                        userIds.push(targetedUser.id)
                }
                // Exctract all user IDs from property to find them all at once
                var userRegex = new RegExp(/{(user_target\|[^}]*)}/g);
                while ((match = userRegex.exec(self[property])) != null) {
                    var placeholderParts = match[1].split('|');
                    var userFieldPath = placeholderParts[placeholderParts.length-1];
                    // Dive in dataInstance to find targeted user
                    findAndPushUser(dataInstance, userFieldPath.split('.'), 0);
                }
            }
            // Remove duplicate id from array
            userIds = userIds.filter(function(item, pos) {
                return userIds.indexOf(item) == pos;
            });

            return userIds;
        }

        getGroupAndUserID().then(function(targetIds) {
            var entityUrl;
            try {
                try {
                    // Build show url of targeted entity
                    entityUrl = dataInstance.$modelOptions.tableName;
                    entityUrl = entityUrl.substring(entityUrl.indexOf('e_') + 2, entityUrl.length);
                    entityUrl = '/' + entityUrl + '/show?id=' + dataInstance.id;
                } catch(e) {
                    // Will redirect to current page
                    entityUrl = '#';
                }
                var notificationObj = {
                    f_color: self.f_color,
                    f_icon: insertVariablesValue('f_icon'),
                    f_title: insertVariablesValue('f_title'),
                    f_description: insertVariablesValue('f_description'),
                    f_url: entityUrl
                };
            } catch (e) {
                return reject(e);
            }

            models.E_notification.create(notificationObj).then(function(notification) {
                notification.setR_user(targetIds);
                if (!socket)
                    socket = require('../services/socket')();
                socket.sendNotification(notification, targetIds);
                resolve();
            }).catch(reject);
        });
    }
    builder.addHooks(Model, 'e_media_notification', attributes_origin);

    return Model;
};