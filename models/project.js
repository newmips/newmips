"use strict";

module.exports = (sequelize, DataTypes) => {
	var Project = sequelize.define("Project", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		displayName: DataTypes.STRING,
		codeName: DataTypes.STRING,
		version: DataTypes.INTEGER
	}, {
		tableName: "project"
	})

    Project.associate = (models) => {
        Project.hasMany(models.Application, {
            foreignKey: {
                name: 'id_project'
            },
            onDelete: 'cascade'
        })
    }

	Project.hook('beforeFindAfterOptions', (project) => {
        if(typeof project.where !== "undefined"){
            if(typeof project.where.name !== "undefined")
                project.where.name = project.where.name.toLowerCase();
            if(typeof project.where.codeName !== "undefined")
                project.where.codeName = project.where.codeName.toLowerCase();
        }
    })

    Project.hook('beforeCreate', (project) => {
        project.name = project.name?project.name.toLowerCase():null;
        project.codeName = project.codeName?project.codeName.toLowerCase():null;
    })

    Project.hook('beforeUpdate', (project) => {
        project.name = project.name?project.name.toLowerCase():null;
        project.codeName = project.codeName?project.codeName.toLowerCase():null;
    })

	return Project;
};