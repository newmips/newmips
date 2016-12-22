"use strict";

module.exports = function(sequelize, DataTypes) {
    var Application = sequelize.define("Application", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: DataTypes.STRING,
        version: DataTypes.INTEGER
    }, {
        tableName: "application",
        classMethods: {
            associate: function(models) {
                Application.belongsTo(models.Project, {
                    foreignKey: {
                        name: 'id_project'
                    }
                });
                Application.hasMany(models.Module, {
                    foreignKey: {
                        name: 'id_application'
                    }
                });
            }
        },
        instanceMethods: {

        }
    });

    return Application;
};