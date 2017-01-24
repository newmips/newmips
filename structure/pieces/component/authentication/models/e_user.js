var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/e_user.json");
var associations = require("./options/e_user.json");

module.exports = function(sequelize, DataTypes) {
	var attributes = builder.buildForModel(attributes_origin, DataTypes);
	var options = {
		tableName: 'TABLE_NAME',
		classMethods: {
			associate: builder.buildAssociation('E_user', associations)
		},
		timestamps: true
	};

    var Model = sequelize.define('E_user', attributes, options);
    return Model;
};