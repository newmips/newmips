"use strict";

module.exports = (sequelize, DataTypes) => {
    var DataEntity = sequelize.define("DataEntity", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: DataTypes.STRING
    }, {
        tableName: "data_entity"
    })

    DataEntity.associate = (models) => {
        DataEntity.belongsTo(models.Module, {
            foreignKey: {
                name: 'id_module'
            },
            onDelete: 'cascade'
        })
        DataEntity.hasMany(models.DataField, {
            foreignKey: {
                name: 'id_data_entity'
            },
            onDelete: 'cascade'
        })
        DataEntity.belongsToMany(models.Component, {
            foreignKey: 'id_entity',
            through: "component_data_entity",
            onDelete: 'cascade'
        })
    }

    DataEntity.addHook('beforeFindAfterOptions', (entity) => {
        if (typeof entity.where !== "undefined") {
            if (typeof entity.where.name !== "undefined")
                entity.where.name = entity.where.name.toLowerCase();
        }
    })

    DataEntity.addHook('beforeCreate', (entity) => {
        entity.name = entity.name ? entity.name.toLowerCase() : null;
    })

    DataEntity.addHook('beforeUpdate', (entity) => {
        entity.name = entity.name ? entity.name.toLowerCase() : null;
    })

    return DataEntity;
};