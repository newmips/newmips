"use strict";

module.exports = (sequelize, DataTypes) => {
    var User = sequelize.define("User", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        email: DataTypes.STRING,
        enabled: DataTypes.BOOLEAN,
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        login: DataTypes.STRING,
        password: DataTypes.STRING,
        phone: DataTypes.STRING,
        token_password_reset: DataTypes.STRING,
        version: DataTypes.INTEGER
    }, {
        tableName: "user"
    })

    User.associate = (models) => {
        User.belongsTo(models.Role, {
            foreignKey: {
                name: 'id_role'
            }
        })
    }

    return User;
};