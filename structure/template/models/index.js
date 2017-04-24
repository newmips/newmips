'use strict';

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(module.filename);
var env = require('../config/global');
var config = require('../config/database');
var db = {};
var allModels = [];
var exec = require('child_process').exec;
var cmd = "";

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

        var promises = [];

        /* This hook is called before the Sequelize sync */
        /* Sequelize sync can't alter table to create new foreign key */
        /* Sequelize just drop and create tables IF NOT EXISTS */
        /* So to create new associations on existing tables we need to drop those tables */
        /* And then the Sequelize Sync will create the table with the new foreign key and references in it */
        var optionsFileName;
        var optionsFile;
        var optionsObject;
        var attributFileName;
        var attributFile;
        var attributObject;
        var toSyncFileName;
        var toSyncFile;
        var toSyncObject;
        var promises = [];
        var request = "";
        var request2 = "";

        /* ----------------- Récupération du toSync.json -----------------*/
        toSyncFileName = __dirname + '/toSync.json';
        toSyncFile = fs.readFileSync(toSyncFileName);
        toSyncObject = JSON.parse(toSyncFile);

        for (var i = 0; i < allModels.length; i++) {
            var sourceName = db[allModels[i]].getTableName();

            /* ----------------- MISE A JOUR DES ATTRIBUTS -----------------*/
            attributFileName = __dirname + '/attributes/' + allModels[i].toLowerCase() + '.json';
            attributFile = fs.readFileSync(attributFileName);
            attributObject = JSON.parse(attributFile);

            for (var item in attributObject) {
                (function(sourceAttr, itemAttr) {
                    promises.push(new Promise(function(resolve0, reject0) {
                        /* Check if field already exist - New version */
                        if(typeof toSyncObject[sourceAttr] !== "undefined" &&
                            typeof toSyncObject[sourceAttr].attributes !== "undefined" &&
                            typeof toSyncObject[sourceAttr].attributes[itemAttr] !== "undefined"){
                            var type = "";
                            switch (attributObject[itemAttr]) {
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
                                case "DECIMAL":
                                    type = "VARCHAR(255)";
                                    break;
                                default:
                                    type = "VARCHAR(255)";
                                    break;
                            }

                            request = "ALTER TABLE ";
                            request += sourceAttr;
                            request += " ADD COLUMN `" + itemAttr + "` " + type + " DEFAULT NULL;";

                            sequelize.query(request).then(function() {
                                var writeStream = fs.createWriteStream(toSyncFileName);
                                delete toSyncObject[sourceAttr].attributes[itemAttr];
                                writeStream.write(JSON.stringify(toSyncObject, null, 4));
                                writeStream.end();
                                writeStream.on('finish', function() {
                                    resolve0();
                                });
                            }).catch(function(err) {
                                reject0(err);
                            });
                        }
                        else{
                            resolve0();
                        }
                    }));
                })(sourceName, item);
            }

            /* ----------------- MISE A JOUR DES ASSOCIATIONS -----------------*/
            optionsFileName = __dirname + '/options/' + allModels[i].toLowerCase() + '.json';
            optionsFile = fs.readFileSync(optionsFileName);
            optionsObject = JSON.parse(optionsFile);

            for (var j=0; j < optionsObject.length; j++) {
                if (optionsObject[j].relation == "belongsTo") {

                    var targetName = db[optionsObject[j].target.charAt(0).toUpperCase() + optionsObject[j].target.slice(1)].getTableName();

                    if (typeof optionsObject[j].foreignKey != "undefined") {
                        var foreignKey = optionsObject[j].foreignKey.toLowerCase();
                    } else {
                        var foreignKey = "id_" + optionsObject[j].target.toLowerCase();
                    }

                    (function(sourceBelongsTo, targetBelongsTo, foreignBelongsTo) {

                        promises.push(new Promise(function(resolve2, reject2) {

                            var toSync = false;
                            var indexToRemove = -1;

                            if(typeof toSyncObject[sourceBelongsTo] !== "undefined" && typeof toSyncObject[sourceBelongsTo].options !== "undefined"){

                                /* Check if field already exist - New version */
                                for(var k=0; k < toSyncObject[sourceBelongsTo].options.length; k++){
                                    var currentItem = toSyncObject[sourceBelongsTo].options[k];
                                    if(currentItem.foreignKey.toLowerCase() == foreignBelongsTo.toLowerCase()){
                                        toSync = true;
                                        indexToRemove = k;
                                    }
                                }
                            }

                            if(toSync){
                                request = "ALTER TABLE ";
                                request += sourceBelongsTo;
                                request += " ADD COLUMN `" +foreignBelongsTo+ "` INT DEFAULT NULL;";
                                request2 = "ALTER TABLE `" +sourceBelongsTo+ "` ADD FOREIGN KEY (" +foreignBelongsTo+ ") REFERENCES `" +targetBelongsTo+ "` (id);";
                                sequelize.query(request).then(function() {
                                    sequelize.query(request2).then(function() {
                                        var writeStream = fs.createWriteStream(toSyncFileName);
                                        toSyncObject[sourceBelongsTo].options.splice(indexToRemove, 1);
                                        writeStream.write(JSON.stringify(toSyncObject, null, 4));
                                        writeStream.end();
                                        writeStream.on('finish', function() {
                                            resolve2();
                                        });
                                    });
                                }).catch(function(err) {
                                    reject2(err);
                                });
                            }
                            else{
                                resolve2();
                            }
                        }));
                    })(sourceName, targetName, foreignKey);
                } else if (optionsObject[j].relation == "hasMany") {

                    var targetName = db[optionsObject[j].target.charAt(0).toUpperCase() + optionsObject[j].target.slice(1)].getTableName();

                    if (typeof optionsObject[j].foreignKey != "undefined") {
                        var foreignKey = optionsObject[j].foreignKey.toLowerCase();
                    } else {
                        var foreignKey = "id_" + allModels[i].toLowerCase();
                    }

                    (function(sourceHasMany, targetHasMany, foreignHasMany) {
                        promises.push(new Promise(function(resolve3, reject3) {

                            var toSync = false;
                            var indexToRemove = -1;

                            if(typeof toSyncObject[sourceHasMany] !== "undefined" && typeof toSyncObject[sourceHasMany].options !== "undefined"){

                                /* Check if field already exist - New version */
                                for(var k=0; k < toSyncObject[sourceHasMany].options.length; k++){
                                    var currentItem = toSyncObject[sourceHasMany].options[k];
                                    if(currentItem.foreignKey.toLowerCase() == foreignHasMany.toLowerCase()){
                                        toSync = true;
                                        indexToRemove = k;
                                    }
                                }
                            }

                            if(toSync){
                                request = "ALTER TABLE ";
                                request += targetHasMany;
                                request += " ADD COLUMN `"+foreignHasMany+"` INT DEFAULT NULL;";
                                request2 = "ALTER TABLE `"+targetHasMany+"` ADD FOREIGN KEY ("+foreignHasMany+") REFERENCES `"+sourceHasMany+"` (id);";
                                sequelize.query(request).then(function() {
                                    sequelize.query(request2).then(function() {
                                        var writeStream = fs.createWriteStream(toSyncFileName);
                                        toSyncObject[sourceHasMany].options.splice(indexToRemove, 1);
                                        writeStream.write(JSON.stringify(toSyncObject, null, 4));
                                        writeStream.end();
                                        writeStream.on('finish', function() {
                                            resolve3();
                                        });
                                    })
                                }).catch(function(err) {
                                    reject3(err);
                                });
                            }
                            else{
                                resolve3();
                            }
                        }));
                    })(sourceName, targetName, foreignKey);
                }
            }

            /* ----------------- CUSTOM QUERY -----------------*/
            (function(currentEntity) {
                promises.push(new Promise(function(resolveQuery, rejectQuery) {
                    if(typeof toSyncObject[currentEntity] !== "undefined" &&
                        typeof toSyncObject[currentEntity].queries !== "undefined" &&
                        toSyncObject[currentEntity].queries.length > 0){

                        var cptDone = 0;
                        var arrayQueryLength = toSyncObject[currentEntity].queries.length;

                        function doneQuery(){
                            if(cptDone == arrayQueryLength){
                                resolveQuery();
                            }
                        }

                        for(var i=0; i<toSyncObject[currentEntity].queries.length; i++){
                            (function(ibis) {
                                sequelize.query(toSyncObject[currentEntity].queries[ibis]).then(function() {
                                    var writeStream = fs.createWriteStream(toSyncFileName);
                                    toSyncObject[currentEntity].queries.splice(ibis, 1);
                                    writeStream.write(JSON.stringify(toSyncObject, null, 4));
                                    writeStream.end();
                                    writeStream.on('finish', function() {
                                        cptDone++;
                                        doneQuery();
                                    });
                                }).catch(function(err){
                                    rejectQuery(err);
                                });
                            })(i);
                        }
                    } else{
                        resolveQuery();
                    }
                }));
            })(sourceName);
        }

        Promise.all(promises).then(function() {
            resolve();
        }).catch(function(err){
            reject(err);
        });
    });
}

fs.readdirSync(__dirname).filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
}).forEach(function(file) {
    var model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
    allModels.push(model.name);
});

Object.keys(db).forEach(function(modelName) {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;