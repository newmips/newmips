"use strict";

module.exports = (sequelize, DataTypes) => {
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
        tableName: "module"
    })

    Module.associate = (models) => {
        Module.belongsTo(models.Application, {
            foreignKey: {
                name: 'id_application'
            },
            onDelete: 'cascade'
        })
        Module.hasMany(models.DataEntity, {
            foreignKey: {
                name: 'id_module'
            }
        })
        Module.hasMany(models.Component, {
            foreignKey: {
                name: 'id_module'
            }
        })
    }

    Module.hook('beforeFindAfterOptions', (module) => {
        if (typeof module.where !== "undefined") {
            if (typeof module.where.name !== "undefined")
                module.where.name = module.where.name.toLowerCase();
            if (typeof module.where.codeName !== "undefined")
                module.where.codeName = module.where.codeName.toLowerCase();
        }
    })

    Module.hook('beforeCreate', (module) => {
        module.name = module.name ? module.name.toLowerCase() : null;
        module.codeName = module.codeName ? module.codeName.toLowerCase() : null;
    })

    Module.hook('beforeUpdate', (module) => {
        module.name = module.name ? module.name.toLowerCase() : null;
        module.codeName = module.codeName ? module.codeName.toLowerCase() : null;
    })

    return Module;
};