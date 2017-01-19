"use strict";

module.exports = function(sequelize, DataTypes) {
	var Module = sequelize.define("Module", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		codeName: DataTypes.STRING,
		version: DataTypes.INTEGER
	}, {
		tableName: "module",
		classMethods: {
			associate: function(models) {
				Module.belongsTo(models.Application, {
                    foreignKey: {
                        name: 'id_application'
                    },
                    onDelete: 'cascade'
                });
                Module.hasMany(models.DataEntity, {
                    foreignKey: {
                        name: 'id_module'
                    }
                });
                Module.hasMany(models.Component, {
                    foreignKey: {
                        name: 'id_module'
                    }
                });
			}
		},
		instanceMethods: {
		}
	});

	return Module;
};