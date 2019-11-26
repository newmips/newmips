const builder = require('../utils/model_builder');

const attributes_origin = require("./attributes/e_document_template.json");
const associations = require("./options/e_document_template.json");

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes);
	const options = {
		tableName: 'TABLE_NAME'
	};

	const Model = sequelize.define('E_document_template', attributes, options);
	Model.associate = builder.buildAssociation('E_document_template', associations);
	builder.addHooks(Model, 'MODEL_CODE_NAME', attributes_origin);

	return Model;
};