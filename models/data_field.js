"use strict";

module.exports = function(sequelize, DataTypes) {
	var DataField = sequelize.define("DataField", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		type: DataTypes.STRING,
		nillable: DataTypes.BOOLEAN,
		min_length: DataTypes.INTEGER,
		max_length: DataTypes.INTEGER,
		class_object: DataTypes.STRING,
		version: DataTypes.INTEGER
	}, {
		tableName: "data_field",
		classMethods: {
			associate: function(models) {
				DataField.belongsTo(models.DataEntity, {
                    foreignKey: {
                        name: 'id_data_entity'
                    },
                    onDelete: 'cascade'
                });
			}
		},
		instanceMethods: {

		}
	});

	return DataField;
};