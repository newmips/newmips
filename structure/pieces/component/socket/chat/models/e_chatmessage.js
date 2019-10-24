var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/e_chatmessage.json");
var associations = require("./options/e_chatmessage.json");

module.exports = (sequelize, DataTypes) => {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'e_chat_chatmessage',
        timestamps: true
    };

    var Model = sequelize.define('E_chatmessage', attributes, options);
    Model.associate = builder.buildAssociation('E_chatmessage', associations);
    builder.addHooks(Model, "e_chatmessage", attributes_origin);

    return Model;
};