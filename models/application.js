"use strict";

module.exports = (sequelize, DataTypes) => {
    var Application = sequelize.define("Application", {
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
        tableName: "application"
    })

    Application.associate = (models) => {
        Application.belongsTo(models.Project, {
            foreignKey: {
                name: 'id_project'
            },
            onDelete: 'cascade'
        })
        Application.hasMany(models.Module, {
            foreignKey: {
                name: 'id_application'
            },
            onDelete: 'cascade'
        })
    }

    Application.hook('beforeFindAfterOptions', (application) => {
        if(typeof application.where !== "undefined"){
            if(typeof application.where.name !== "undefined")
                application.where.name = application.where.name.toLowerCase();
            if(typeof application.where.codeName !== "undefined")
                application.where.codeName = application.where.codeName.toLowerCase();
        }
    })

    Application.hook('beforeCreate', (application) => {
        application.name = application.name?application.name.toLowerCase():null;
        application.codeName = application.codeName?application.codeName.toLowerCase():null;
    })

    Application.hook('beforeUpdate', (application) => {
        application.name = application.name?application.name.toLowerCase():null;
        application.codeName = application.codeName?application.codeName.toLowerCase():null;
    })

    return Application;
};