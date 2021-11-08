"use strict";

module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define("User", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		email: DataTypes.STRING,
		enabled: DataTypes.BOOLEAN,
		firstname: DataTypes.STRING,
		lastname: DataTypes.STRING,
		login: DataTypes.STRING,
		password: DataTypes.STRING,
		phone: DataTypes.STRING,
		token_password_reset: DataTypes.STRING,
		token_first_connection: DataTypes.STRING, // In case of signup
		repo_access_token: DataTypes.STRING, // Access token for git commands with code platform
		version: DataTypes.INTEGER
	}, {
		tableName: "user",
		timestamps: true
	})

	User.associate = (models) => {
		User.belongsTo(models.Role, {
			foreignKey: {
				name: 'id_role'
			}
		})
		User.belongsToMany(models.Application, {
			foreignKey: 'id_user',
			through: "application_user"
		})
	}

	return User;
};