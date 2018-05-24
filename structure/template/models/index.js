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
                        case "INTEGER":
                            type = "INT";
                            break;
                        case "BIGINT":
                            type = "BIGINT";
                            break;
                        case "DATE":
                            type = "DATETIME";
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
                        case "TEXT":
                        case "BOOLEAN":
                        case "TIME":
                        case "FLOAT":
                        case "DOUBLE":
                            // Same type as the switch parameter
                            type = toSyncObject[entity].attributes[attribute].type;
                            break;
                        default:
                            type = "VARCHAR(255)";
                            break;
                    }

                    if(typeof toSyncObject[entity].attributes[attribute].defaultValue === "undefined")
                        toSyncObject[entity].attributes[attribute].defaultValue = null;
                    if(toSyncObject[entity].attributes[attribute].defaultValue != null)
                        toSyncObject[entity].attributes[attribute].defaultValue = "'" + toSyncObject[entity].attributes[attribute].defaultValue + "'";

                    var request = "ALTER TABLE ";
                    request += entity;
                    request += " ADD COLUMN `" + attribute + "` " + type + " DEFAULT "+toSyncObject[entity].attributes[attribute].defaultValue+";";

                    (function(query, entityB, attributeB) {
                        promises.push(new Promise(function(resolve0, reject0) {
                            sequelize.query(query).then(function() {
                                toSyncProdObject.queries.push(query);
                                resolve0();
                            }).catch(function(err) {
                                if(typeof err.parent !== "undefined"){
                                    if(err.parent.errno == 1060){
                                        console.log("WARNING - Duplicate column attempt in BDD - Request: "+ query);
                                        resolve0();
                                    } else{
                                        reject0(err);
                                    }
                                } else{
                                    reject0(err);
                                }
                            });
                        }));
                    })(request, entity, attribute);
                }

            // Sync options
            if (toSyncObject[entity].options)
                for (var j = 0; j < toSyncObject[entity].options.length; j++) {
                    if(toSyncObject[entity].options[j].relation != "belongsToMany"){
                        (function(sourceEntity, option) {
                            promises.push(new Promise(function(resolve0, reject0) {
                                var tableName = sourceEntity.substring(sourceEntity.indexOf('_')+1);
                                var sourceName = db[tableName.charAt(0).toUpperCase() + tableName.slice(1)].getTableName();
                                var targetName;
                                // Status specific target. Get real history table name from attributes
                                if (option.target.indexOf('e_history_') == 0) {
                                    var attris = JSON.parse(fs.readFileSync(__dirname+'/attributes/'+sourceEntity.substring(sourceEntity.indexOf('e_'), sourceEntity.length)+'.json', 'utf8'));
                                    for (var attri in attris)
                                        if (attris[attri].history_table && attris[attri].history_table == option.target)
                                            targetName = attris[attri].history_model;
                                }
                                // Regular target
                                if (!targetName)
                                    targetName = option.target;
                                targetName = db[targetName.charAt(0).toUpperCase() + targetName.slice(1)].getTableName();

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
                                    if(typeof err.parent !== "undefined"){
                                        if(err.parent.errno == 1060){
                                            console.log("WARNING - Duplicate column attempt in BDD - Request: "+ request);
                                            resolve0();
                                        } else{
                                            reject0(err);
                                        }
                                    } else{
                                        reject0(err);
                                    }
                                });
                            }));
                        })(entity, toSyncObject[entity].options[j]);
                    }
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
                fs.writeFileSync(__dirname+'/toSync.json', '{}', 'utf8');
                resolve();
            });
        }).catch(function(err){
            var writeStream = fs.createWriteStream(__dirname + '/toSyncProd.json');
            writeStream.write(JSON.stringify(toSyncProdObject, null, 4));
            writeStream.end();
            writeStream.on('finish', function() {
                fs.writeFileSync(__dirname+'/toSync.json', '{}', 'utf8');
                reject(err);
            });
        });
    });
}

fs.readdirSync(__dirname).filter(function(file) {
    var excludeFiles = ['hooks.js'];
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js') && excludeFiles.indexOf(file) == -1;
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