"use strict";

module.exports = function(sequelize, DataTypes) {
	var DataEntity = sequelize.define("DataEntity", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		codeName: DataTypes.STRING,
		version: DataTypes.INTEGER
	}, {
		tableName: "data_entity",
		classMethods: {
			associate: function(models) {
				DataEntity.belongsTo(models.Module, {
                    foreignKey: {
                        name: 'id_module'
                    },
                    onDelete: 'cascade'
                });
                DataEntity.hasMany(models.DataField, {
                    foreignKey: {
                        name: 'id_data_entity'
                    }
                });
                DataEntity.hasMany(models.Component, {
                    foreignKey: {
                        name: 'id_data_entity'
                    }
                });
			}
		},
		instanceMethods: {

		}
	});

	return DataEntity;
};