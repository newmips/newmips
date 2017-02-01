"use strict";

module.exports = function(sequelize, DataTypes) {
	var DataField = sequelize.define("DataField", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		codeName: DataTypes.STRING,
		type: DataTypes.STRING,
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

	DataField.hook('beforeFindAfterOptions', function(field, callback) {
        if(typeof field.where !== "undefined"){
            if(typeof field.where.name !== "undefined")
                field.where.name = field.where.name.toLowerCase();
            if(typeof field.where.codeName !== "undefined")
                field.where.codeName = field.where.codeName.toLowerCase();
        }
        callback();
    });

    DataField.hook('beforeCreate', function(field, callback) {
        field.name = field.name?field.name.toLowerCase():null;
        field.codeName = field.codeName?field.codeName.toLowerCase():null;
    });

    DataField.hook('beforeUpdate', function(field, callback) {
        field.name = field.name?field.name.toLowerCase():null;
        field.codeName = field.codeName?field.codeName.toLowerCase():null;
    });

	return DataField;
};