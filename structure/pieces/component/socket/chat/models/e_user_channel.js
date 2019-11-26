const builder = require('../utils/model_builder');

const attributes_origin = require("./attributes/e_user_channel.json");
const associations = require("./options/e_user_channel.json");

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes, false);
	const options = {
		tableName: 'chat_user_channel'
	};

	const Model = sequelize.define('E_user_channel', attributes, options);
	Model.associate = builder.buildAssociation('E_user_channel', associations);
	builder.addHooks(Model, "e_user_channel", attributes_origin);

	return Model;
};