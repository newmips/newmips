"use strict";

module.exports = (sequelize, DataTypes) => {
	const Application = sequelize.define("Application", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		displayName: DataTypes.STRING
	}, {
		tableName: "application"
	})

	Application.associate = (models) => {
		Application.belongsToMany(models.User, {
			foreignKey: 'id_application',
			through: "application_user",
			as: "users"
		})
	}

	Application.addHook('beforeFindAfterOptions', (application) => {
		if (typeof application.where !== "undefined")
			if (typeof application.where.name !== "undefined")
				application.where.name = application.where.name.toLowerCase();
	})

	Application.addHook('beforeCreate', (application) => {
		application.name = application.name ? application.name.toLowerCase() : null;
	})

	Application.addHook('beforeUpdate', (application) => {
		application.name = application.name ? application.name.toLowerCase() : null;
	})

	return Application;
};