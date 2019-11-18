var builder = require('../utils/model_builder');

var attributes_origin = require("./attributes/e_user_chat.json");
var associations = require("./options/e_user_chat.json");

module.exports = (sequelize, DataTypes) => {
	var attributes = builder.buildForModel(attributes_origin, DataTypes, false);
	var options = {
		tableName: 'chat_user_chat'
	};

	var Model = sequelize.define('E_user_chat', attributes, options);
	Model.associate = builder.buildAssociation('E_user_chat', associations);
	builder.addHooks(Model, "e_user_chat", attributes_origin);

	return Model;
};