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

	Module.hook('beforeFindAfterOptions', function(module, callback) {
        if(typeof module.where !== "undefined"){
            if(typeof module.where.name !== "undefined")
                module.where.name = module.where.name.toLowerCase();
            if(typeof module.where.codeName !== "undefined")
                module.where.codeName = module.where.codeName.toLowerCase();
        }
        callback();
    });

    Module.hook('beforeCreate', function(module, callback) {
        module.name = module.name?module.name.toLowerCase():null;
        module.codeName = module.codeName?module.codeName.toLowerCase():null;
    });

    Module.hook('beforeUpdate', function(module, callback) {
        module.name = module.name?module.name.toLowerCase():null;
        module.codeName = module.codeName?module.codeName.toLowerCase():null;
    });

	return Module;
};