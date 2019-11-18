"use strict";

module.exports = (sequelize, DataTypes) => {
	const Role = sequelize.define("Role", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING
	}, {
		tableName: "role"
	})

	return Role;
};