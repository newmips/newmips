"use strict";

module.exports = (sequelize, DataTypes) => {
    var Module = sequelize.define("Module", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: DataTypes.STRING
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
            },
            onDelete: 'cascade'
        })
        Module.hasMany(models.Component, {
            foreignKey: {
                name: 'id_module'
            },
            onDelete: 'cascade'
        })
    }

    Module.addHook('beforeFindAfterOptions', (np_module) => {
        if (typeof np_module.where !== "undefined") {
            if (typeof np_module.where.name !== "undefined")
                np_module.where.name = np_module.where.name.toLowerCase();
        }
    })

    Module.addHook('beforeCreate', (np_module) => {
        np_module.name = np_module.name ? np_module.name.toLowerCase() : null;
    })

    Module.addHook('beforeUpdate', (np_module) => {
        np_module.name = np_module.name ? np_module.name.toLowerCase() : null;
    })

    return Module;
};