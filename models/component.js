"use strict";

module.exports = function(sequelize, DataTypes) {
	var Component = sequelize.define("Component", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true
		},
		name: DataTypes.STRING,
		codeName: DataTypes.STRING,
		version: DataTypes.INTEGER
	}, {
		tableName: "component",
		classMethods: {
			associate: function(models) {
				Component.belongsTo(models.DataEntity, {
                    foreignKey: {
                        name: 'id_data_entity'
                    },
                    onDelete: 'cascade'
                });
                Component.belongsTo(models.Module, {
                    foreignKey: {
                        name: 'id_module'
                    },
                    onDelete: 'cascade'
                });
			}
		},
		instanceMethods: {

		}
	});

	Component.hook('beforeFindAfterOptions', function(component, callback) {
        if(typeof component.where !== "undefined"){
            if(typeof component.where.name !== "undefined")
                component.where.name = component.where.name.toLowerCase();
            if(typeof component.where.codeName !== "undefined")
                component.where.codeName = component.where.codeName.toLowerCase();
        }
        callback();
    });

    Component.hook('beforeCreate', function(component, callback) {
        component.name = component.name?component.name.toLowerCase():null;
        component.codeName = component.codeName?component.codeName.toLowerCase():null;
    });

    Component.hook('beforeUpdate', function(component, callback) {
        component.name = component.name?component.name.toLowerCase():null;
        component.codeName = component.codeName?component.codeName.toLowerCase():null;
    });

	return Component;
};