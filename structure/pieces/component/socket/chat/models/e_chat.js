const builder = require('../utils/model_builder');

const attributes_origin = require("./attributes/e_chat.json");
const associations = require("./options/e_chat.json");

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes);
	const options = {
		tableName: 'e_chat_chat',
		timestamps: true
	};

	const Model = sequelize.define('E_chat', attributes, options);
	Model.associate = builder.buildAssociation('E_chat', associations);
	builder.addHooks(Model, "e_chat", attributes_origin);

	return Model;
};