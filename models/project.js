"use strict";

module.exports = function(sequelize, DataTypes) {
	var Project = sequelize.define("Project", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		description: DataTypes.STRING,
		type: DataTypes.STRING,
		version: DataTypes.INTEGER
	}, {
		tableName: "project",
		classMethods: {
			associate: function(models) {
				Project.hasMany(models.Application, {
                    foreignKey: {
                        name: 'id_project'
                    },
                    onDelete: 'cascade'
                });
			}
		},
		instanceMethods: {

		}
	});

	return Project;
};