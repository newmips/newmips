"use strict";

module.exports = function(sequelize, DataTypes) {
	var DataEntity = sequelize.define("DataEntity", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		description: DataTypes.STRING,
		icon: DataTypes.STRING,
		listable: DataTypes.BOOLEAN,
		version: DataTypes.INTEGER
	}, {
		tableName: "data_entity",
		classMethods: {
			associate: function(models) {
				DataEntity.belongsTo(models.Module, {
                    foreignKey: {
                        name: 'id_module'
                    }
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