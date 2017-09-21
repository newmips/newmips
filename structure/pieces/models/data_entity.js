var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var appConf = JSON.parse(fs.readFileSync(__dirname + '/../config/application.json'));
var attributes_origin = appConf.hideModelInfo == true ? {id: {type: "INTEGER",autoIncrement: true,primaryKey: true},version: {type: "INTEGER"}} : require("./attributes/MODEL_NAME_LOWER.json");
var associations = appConf.hideModelInfo == true ? [] : require("./options/MODEL_NAME_LOWER.json");

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'TABLE_NAME',
        classMethods: {
            associate: builder.buildAssociation('MODEL_NAME', associations)
        },
        timestamps: true
    };

    var Model = sequelize.define('MODEL_NAME', attributes, options);
    return Model;
};