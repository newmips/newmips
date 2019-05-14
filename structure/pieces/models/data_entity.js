var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var attributes_origin = require("./attributes/MODEL_NAME_LOWER.json");
var associations = require("./options/MODEL_NAME_LOWER.json");

module.exports = (sequelize, DataTypes) => {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    builder.attributesValidation(attributes);
    var options = {
        tableName: 'TABLE_NAME',
        timestamps: true
    };

    var Model = sequelize.define('MODEL_NAME', attributes, options);
    Model.associate = builder.buildAssociation('MODEL_NAME', associations);
    builder.addHooks(Model, 'MODEL_NAME_LOWER', attributes_origin);

    return Model;
};