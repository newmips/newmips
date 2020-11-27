const builder = require('../utils/model_builder');

const attributes_origin = require("./attributes/e_channel.json");
const associations = require("./options/e_channel.json");

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes);
	const options = {
		tableName: 'e_chat_channel',
		timestamps: true
	};

	const Model = sequelize.define('E_channel', attributes, options);
	Model.associate = builder.buildAssociation('E_channel', associations);
	builder.addHooks(Model, "e_channel", attributes_origin);

	return Model;
};