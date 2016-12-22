"use strict";

module.exports = function(sequelize, DataTypes) {
	var Component = sequelize.define("Component", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		version: DataTypes.INTEGER
	}, {
		tableName: "component",
		classMethods: {
			associate: function(models) {
				Component.belongsTo(models.DataEntity, {
                    foreignKey: {
                        name: 'id_data_entity'
                    }
                });
			}
		},
		instanceMethods: {

		}
	});

	return Component;
};