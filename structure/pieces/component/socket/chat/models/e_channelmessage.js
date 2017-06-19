var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/e_channelmessage.json");
var associations = require("./options/e_channelmessage.json");

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_chat_channelmessage',
        classMethods: {
            associate: builder.buildAssociation('E_channelmessage', associations)
        },
        timestamps: true
    };

    var Model = sequelize.define('E_channelmessage', attributes, options);
    return Model;
};