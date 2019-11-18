const builder = require('../utils/model_builder');

const attributes_origin = require("./attributes/e_channelmessage.json");
const associations = require("./options/e_channelmessage.json");

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes);
	const options = {
		tableName: 'e_chat_channelmessage',
		timestamps: true
	};

	const Model = sequelize.define('E_channelmessage', attributes, options);
	Model.associate = builder.buildAssociation('E_channelmessage', associations);
	builder.addHooks(Model, "e_channelmessage", attributes_origin);

	return Model;
};