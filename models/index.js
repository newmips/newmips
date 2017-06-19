'use strict';

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(module.filename);
var env = require('../config/global');
var config = require('../config/database');
var db = {};
var moment_timezone = require('moment-timezone');

var sequelize = new Sequelize(config.connection.database, config.connection.user, config.connection.password, {
    host: config.connection.host,
    logging: false,
    port: config.connection.port,
    dialectOptions: {
        multipleStatements: true
    },
    define: {
        timestamps: false
    },
    timezone: moment_timezone.tz.guess()
});

fs.readdirSync(__dirname).filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
}).forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
});

Object.keys(db).forEach(function(modelName) {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;