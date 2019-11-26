const builder = require('../utils/model_builder');

const attributes_origin = require("./attributes/e_chatmessage.json");
const associations = require("./options/e_chatmessage.json");

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes);
	const options = {
		tableName: 'e_chat_chatmessage',
		timestamps: true
	};

	const Model = sequelize.define('E_chatmessage', attributes, options);
	Model.associate = builder.buildAssociation('E_chatmessage', associations);
	builder.addHooks(Model, "e_chatmessage", attributes_origin);

	return Model;
};