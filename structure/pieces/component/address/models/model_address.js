var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/COMPONENT_NAME_LOWER.json");
var associations = require("./options/COMPONENT_NAME_LOWER.json");

module.exports = function(sequelize, DataTypes) {
	var attributes = builder.buildForModel(attributes_origin, DataTypes);
	var options = {
		tableName: 'TABLE_NAME',
		classMethods: {
			associate: builder.buildAssociation('COMPONENT_NAME', associations)
		}
	};

    var Model = sequelize.define('COMPONENT_NAME', attributes, options);

    builder.addHooks(Model, 'COMPONENT_NAME_LOWER', attributes_origin);

    return Model;
};