var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var attributes_origin = require("./attributes/e_media_notification.json");
var associations = require("./options/e_media_notification.json");
var socket;
var models;

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_media_notification',
        classMethods: {
            associate: builder.buildAssociation('E_media_notification', associations)
        },
        instanceMethods: {
            execute: function(resolve, reject, dataInstance) {
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
                        }
                        else
                            return object[depths[idx]];
                    }

                    var newString = self[property];
                    var regex = new RegExp(/{([^}]*)}/g), matches = null;
                    while ((matches = regex.exec(self[property])) != null)
                        newString = newString.replace(matches[0], diveData(dataInstance, matches[1].split('.'), 0));

                    return newString || "";
                }

                // Find all target users id
                var targetIds = [];var groupsIds = [];
                // User list
                for (var i = 0; i < self.r_target_users.length; i++)
                    targetIds.push(self.r_target_users[i].id);
                // Group list
                for (var i = 0; i < self.r_target_groups.length; i++)
                    groupsIds.push(self.r_target_groups[i].id);
                // Find all with group
                models.E_user.findAll({
                    attributes: ['id'],
                    include: [{
                        model: models.E_group,
                        as: 'r_group',
                        where: {id: {$in: groupsIds}}
                    }],
                    raw: true
                }).then(function(groupUsers) {
                    for (var i = 0; i < groupUsers.length; i++)
                        targetIds.push(groupUsers[i].id);

                    // Remove duplicate id from array
                    targetIds = targetIds.filter(function(item, pos) {
                        return targetIds.indexOf(item) == pos;
                    });

                    var notificationObj = {
                        f_color: self.f_color,
                        f_icon: insertVariablesValue('f_icon'),
                        f_title: insertVariablesValue('f_title'),
                        f_description: insertVariablesValue('f_description'),
                        f_url: '/'+dataInstance.$modelOptions.name.singular.substring(2)+'/show?id='+dataInstance.id
                    };
                    models.E_notification.create(notificationObj).then(function(notification) {
                        notification.setR_user(targetIds);
                        if (!socket)
                             socket = require('../services/socket')();
                        socket.sendNotification(notification, targetIds);
                        resolve();
                    }).catch(reject);
                });
            }
        },
        timestamps: true
    };

    var Model = sequelize.define('E_media_notification', attributes, options);

    builder.addHooks(Model, 'e_media_notification', attributes_origin);

    return Model;
};