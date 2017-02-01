"use strict";

module.exports = function(sequelize, DataTypes) {
	var Project = sequelize.define("Project", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		codeName: DataTypes.STRING,
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

	Project.hook('beforeFindAfterOptions', function(project, callback) {
        if(typeof project.where !== "undefined"){
            if(typeof project.where.name !== "undefined")
                project.where.name = project.where.name.toLowerCase();
            if(typeof project.where.codeName !== "undefined")
                project.where.codeName = project.where.codeName.toLowerCase();
        }
        callback();
    });

    Project.hook('beforeCreate', function(project, callback) {
        project.name = project.name?project.name.toLowerCase():null;
        project.codeName = project.codeName?project.codeName.toLowerCase():null;
    });

    Project.hook('beforeUpdate', function(project, callback) {
        project.name = project.name?project.name.toLowerCase():null;
        project.codeName = project.codeName?project.codeName.toLowerCase():null;
    });

	return Project;
};