var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var attributes_origin = require("./attributes/e_media_sms.json");
var associations = require("./options/e_media_sms.json");

module.exports = (sequelize, DataTypes) => {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_media_sms',
        timestamps: true
    };

    var Model = sequelize.define('E_media_sms', attributes, options);
    Model.associate = builder.buildAssociation('E_media_sms', associations);
    builder.addHooks(Model, 'e_media_sms', attributes_origin);

    return Model;
};