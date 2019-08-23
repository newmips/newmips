const builder = require('../utils/model_builder');
const fs = require('fs-extra');

const attributes_origin = require("./attributes/MODEL_NAME_LOWER.json");
const associations = require("./options/MODEL_NAME_LOWER.json");

module.exports = (sequelize, DataTypes) => {
    const attributes = builder.buildForModel(attributes_origin, DataTypes);
    builder.attributesValidation(attributes);
    const options = {
        tableName: 'TABLE_NAME',
        timestamps: true
    };

    const Model = sequelize.define('MODEL_NAME', attributes, options);
    Model.associate = builder.buildAssociation('MODEL_NAME', associations);
    builder.addHooks(Model, 'MODEL_NAME_LOWER', attributes_origin);

    return Model;
};