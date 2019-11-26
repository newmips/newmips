const builder = require('../utils/model_builder');

const attributes_origin = require("./attributes/COMPONENT_NAME_LOWER.json");
const associations = require("./options/COMPONENT_NAME_LOWER.json");

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes);
	const options = {
		tableName: 'TABLE_NAME',
		timestamps: true
	};

	const Model = sequelize.define('COMPONENT_NAME', attributes, options);
	Model.associate = builder.buildAssociation('COMPONENT_NAME', associations);
	builder.addHooks(Model, 'COMPONENT_NAME_LOWER', attributes_origin);

	return Model;
};