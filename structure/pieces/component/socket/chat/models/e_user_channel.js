var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/e_user_channel.json");
var associations = require("./options/e_user_channel.json");

module.exports = (sequelize, DataTypes) => {
    var attributes = builder.buildForModel(attributes_origin, DataTypes, false);
    var options = {
        tableName: 'ID_APPLICATION_chat_user_channel'
    };

    var Model = sequelize.define('E_user_channel', attributes, options);
    Model.associate: builder.buildAssociation('E_user_channel', associations);
    builder.addHooks(Model, "e_user_channel", attributes_origin);

    return Model;
};