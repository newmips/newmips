"use strict";

module.exports = (sequelize, DataTypes) => {
    var Role = sequelize.define("Role", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: DataTypes.STRING,
        version: DataTypes.INTEGER
    }, {
        tableName: "role"
    })

    return Role;
};