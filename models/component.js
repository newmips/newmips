"use strict";

module.exports = (sequelize, DataTypes) => {
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
        tableName: "component"
    })

    Component.associate = (models) => {
        Component.belongsToMany(models.DataEntity, {
            foreignKey: 'id_component',
            through: "component_data_entity"
        })
        Component.belongsTo(models.Module, {
            foreignKey: {
                name: 'id_module'
            },
            onDelete: 'cascade'
        })
    }

    Component.hook('beforeFindAfterOptions', (component) => {
        if (typeof component.where !== "undefined") {
            if (typeof component.where.name !== "undefined")
                component.where.name = component.where.name.toLowerCase();
            if (typeof component.where.codeName !== "undefined")
                component.where.codeName = component.where.codeName.toLowerCase();
        }
    })

    Component.hook('beforeCreate', (component) => {
        component.name = component.name ? component.name.toLowerCase() : null;
        component.codeName = component.codeName ? component.codeName.toLowerCase() : null;
    })

    Component.hook('beforeUpdate', (component) => {
        component.name = component.name ? component.name.toLowerCase() : null;
        component.codeName = component.codeName ? component.codeName.toLowerCase() : null;
    })

    return Component;
};