var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/e_group.json");
var associations = require("./options/e_group.json");

module.exports = function(sequelize, DataTypes) {
	var attributes = builder.buildForModel(attributes_origin, DataTypes);
	var options = {
		tableName: 'TABLE_NAME',
		classMethods: {
			associate: builder.buildAssociation('E_group', associations)
		},
		timestamps: true
	};

    var Model = sequelize.define('E_group', attributes, options);
    return Model;
};