var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/e_chat.json");
var associations = require("./options/e_chat.json");

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_chat_chat',
        classMethods: {
            associate: builder.buildAssociation('E_chat', associations)
        },
        timestamps: true
    };

    var Model = sequelize.define('E_chat', attributes, options);

    builder.addHooks(Model, "e_chat", attributes_origin);

    return Model;
};