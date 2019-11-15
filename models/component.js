"use strict";

module.exports = (sequelize, DataTypes) => {
    var Component = sequelize.define("Component", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: DataTypes.STRING
    }, {
        tableName: "component"
    })

    Component.associate = (models) => {
        Component.belongsToMany(models.DataEntity, {
            foreignKey: 'id_component',
            through: "component_data_entity",
            onDelete: 'cascade'
        })
        Component.belongsTo(models.Module, {
            foreignKey: {
                name: 'id_module'
            },
            onDelete: 'cascade'
        })
    }

    Component.addHook('beforeFindAfterOptions', (component) => {
        if (typeof component.where !== "undefined") {
            if (typeof component.where.name !== "undefined")
                component.where.name = component.where.name.toLowerCase();
        }
    })

    Component.addHook('beforeCreate', (component) => {
        component.name = component.name ? component.name.toLowerCase() : null;
    })

    Component.addHook('beforeUpdate', (component) => {
        component.name = component.name ? component.name.toLowerCase() : null;
    })

    return Component;
};