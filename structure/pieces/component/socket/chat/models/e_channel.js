var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/e_channel.json");
var associations = require("./options/e_channel.json");

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_chat_channel',
        classMethods: {
            associate: builder.buildAssociation('E_channel', associations)
        },
        timestamps: true
    };

    var Model = sequelize.define('E_channel', attributes, options);

    builder.addHooks(Model, "e_channel", attributes_origin);

    return Model;
};