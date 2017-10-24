'use strict';

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(module.filename);
var config = require('../config/database');
var globalConf = require('../config/global');
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

sequelize.customAfterSync = function() {
    return new Promise(function(resolve, reject) {
        var toSyncProdObject = JSON.parse(fs.readFileSync(__dirname + '/toSyncProd.json'));

        var promises = [];

        /* ----------------- Récupération du toSync.json -----------------*/
        var toSyncFileName = globalConf.env == 'cloud' || globalConf.env == 'cloud_recette' ? __dirname + '/toSyncProd.lock.json' : __dirname + '/toSync.json';
        var toSyncObject = JSON.parse(fs.readFileSync(toSyncFileName));

        for (var entity in toSyncObject) {
            // Sync attributes
            if (toSyncObject[entity].attributes)
                for (var attribute in toSyncObject[entity].attributes) {
                    var type;
                    switch (toSyncObject[entity].attributes[attribute].type) {
                        case "STRING":
                            type = "VARCHAR(255)";
                            break;
                        case "TEXT":
                            type = "TEXT";
                            break;
                        case "INTEGER":
                            type = "INT";
                            break;
                        case "BOOLEAN":
                            type = "BOOLEAN";
                            break;
                        case "TIME":
                            type = "TIME";
                            break;
                        case "DATE":
                            type = "DATETIME";
                            break;
                        case "FLOAT":
                            type = "FLOAT";
                            break;
                        case "DOUBLE":
                            type = "DOUBLE";
                            break;
                        case "DECIMAL":
                            type = "DECIMAL(10,3)";
                            break;
                        case "ENUM":
                            type = "ENUM(";
                            for(var i=0; i<toSyncObject[entity].attributes[attribute].values.length; i++){
                                type += "'"+toSyncObject[entity].attributes[attribute].values[i]+"'";
                                if(i != toSyncObject[entity].attributes[attribute].values.length-1)
                                    type += ",";
                            }
                            type += ")";
                            break;
                        default:
                            type = "VARCHAR(255)";
                            break;
                    }

                    var request = "ALTER TABLE ";
                    request += entity;
                    request += " ADD COLUMN `" + attribute + "` " + type + " DEFAULT NULL;";
                    (function(query, entityB, attributeB) {
                        promises.push(new Promise(function(resolve0, reject0) {
                            sequelize.query(query).then(function() {
                                toSyncProdObject.queries.push(query);
                                resolve0();
                            }).catch(function(err) {
                                if(err.parent.errno == 1060){
                                    console.log("WARNING - Duplicate column attempt in BDD - Request: "+ query);
                                    resolve0();
                                }
                                else
                                    reject0(err);
                            });
                        }));
                    })(request, entity, attribute);
                }

            // Sync options
            if (toSyncObject[entity].options)
                for (var j = 0; j < toSyncObject[entity].options.length; j++) {
                    (function(sourceEntity, option) {
                        promises.push(new Promise(function(resolve0, reject0) {
                            var tableName = sourceEntity.substring(sourceEntity.indexOf('_')+1);
                            var sourceName = db[tableName.charAt(0).toUpperCase() + tableName.slice(1)].getTableName();
                            var targetName = db[option.target.charAt(0).toUpperCase() + option.target.slice(1)].getTableName();

                            var request;
                            if (option.relation == "belongsTo") {
                                request = "ALTER TABLE ";
                                request += sourceName;
                                request += " ADD COLUMN `" +option.foreignKey+ "` INT DEFAULT NULL;";
                                request += "ALTER TABLE `" +sourceName+ "` ADD FOREIGN KEY (" +option.foreignKey+ ") REFERENCES `" +targetName+ "` (id) ON DELETE SET NULL ON UPDATE CASCADE;";
                            }
                            else if (option.relation == 'hasMany') {
                                request = "ALTER TABLE ";
                                request += targetName;
                                request += " ADD COLUMN `"+option.foreignKey+"` INT DEFAULT NULL;";
                                request += "ALTER TABLE `"+targetName+"` ADD FOREIGN KEY ("+option.foreignKey+") REFERENCES `"+sourceName+"` (id);";
                            }

                            sequelize.query(request).then(function() {
                                toSyncProdObject.queries.push(request);
                                resolve0();
                            }).catch(function(err) {
                                if(err.parent.errno == 1060)
                                    resolve0();
                                else
                                    reject0(err);
                            });
                        }));
                    })(entity, toSyncObject[entity].options[j]);
                }
        }

        // Recursive execute raw sql queries to save queries order
        function recursiveQueries(srcQueries) {
            return new Promise(function(resolve, reject) {
                function execQuery(queries, idx) {
                    if (!queries[idx])
                        return resolve();
                    sequelize.query(queries[idx]).then(function() {
                        toSyncProdObject.queries.push(queries[idx]);
                        execQuery(queries, idx+1);
                    }).catch(function(err){
                        console.log(err);
                        execQuery(queries, idx+1);
                    });
                }
                execQuery(srcQueries, 0);
            });
        }
        if (toSyncObject.queries)
            promises.push(recursiveQueries(toSyncObject.queries));

        Promise.all(promises).then(function() {
            var writeStream = fs.createWriteStream(__dirname + '/toSyncProd.json');
            writeStream.write(JSON.stringify(toSyncProdObject, null, 4));
            writeStream.end();
            writeStream.on('finish', function() {
                fs.writefileSync(__dirname+'/toSync.json', '{}', 'utf8');
                resolve();
            });
        }).catch(function(err){
            var writeStream = fs.createWriteStream(__dirname + '/toSyncProd.json');
            writeStream.write(JSON.stringify(toSyncProdObject, null, 4));
            writeStream.end();
            writeStream.on('finish', function() {
                fs.writefileSync(__dirname+'/toSync.json', '{}', 'utf8');
                reject(err);
            });
        });
    });
}

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