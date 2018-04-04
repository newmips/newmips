var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/e_document_template.json");
var associations = require("./options/e_document_template.json");

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'TABLE_NAME',
        classMethods: {
            associate: builder.buildAssociation('E_document_template', associations)
        }
    };

    var Model = sequelize.define('E_document_template', attributes, options);

    builder.addHooks(Model, 'MODEL_CODE_NAME', attributes_origin);

    return Model;
};