var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/e_channel.json");
var associations = require("./options/e_channel.json");

module.exports = (sequelize, DataTypes) => {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'e_chat_channel',
        timestamps: true
    };

    var Model = sequelize.define('E_channel', attributes, options);
    Model.associate = builder.buildAssociation('E_channel', associations);
    builder.addHooks(Model, "e_channel", attributes_origin);

    return Model;
};