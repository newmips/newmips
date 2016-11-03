"use strict";

module.exports = function(sequelize, DataTypes) {
	var Role = sequelize.define("Role", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		version: DataTypes.INTEGER
	}, {
		tableName: "role",
		classMethods: {
			associate: function(models) {

			}
		},
		instanceMethods: {

		}
	});

	return Role;
};