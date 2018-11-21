"use strict";

module.exports = (sequelize, DataTypes) => {
    var DataEntity = sequelize.define("DataEntity", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: DataTypes.STRING,
        codeName: DataTypes.STRING,
        version: DataTypes.INTEGER
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
            if (typeof entity.where.codeName !== "undefined")
                entity.where.codeName = entity.where.codeName.toLowerCase();
        }
    })

    DataEntity.addHook('beforeCreate', (entity) => {
        entity.name = entity.name ? entity.name.toLowerCase() : null;
        entity.codeName = entity.codeName ? entity.codeName.toLowerCase() : null;
    })

    DataEntity.addHook('beforeUpdate', (entity) => {
        entity.name = entity.name ? entity.name.toLowerCase() : null;
        entity.codeName = entity.codeName ? entity.codeName.toLowerCase() : null;
    })

    return DataEntity;
};