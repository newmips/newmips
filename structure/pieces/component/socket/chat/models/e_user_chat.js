const builder = require('../utils/model_builder');

const attributes_origin = require("./attributes/e_user_chat.json");
const associations = require("./options/e_user_chat.json");

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes, false);
	const options = {
		tableName: 'chat_user_chat'
	};

	const Model = sequelize.define('E_user_chat', attributes, options);
	Model.associate = builder.buildAssociation('E_user_chat', associations);
	builder.addHooks(Model, "e_user_chat", attributes_origin);

	return Model;
};