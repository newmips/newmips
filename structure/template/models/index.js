'use strict';

var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var basename = path.basename(module.filename);
var dbConfig = require('../config/database');
var globalConf = require('../config/global');
var moment = require('moment');
var moment_timezone = require('moment-timezone');
var db = {};

const Op = Sequelize.Op;
const operatorsAliases = {
    $eq: Op.eq,
    $ne: Op.ne,
    $gte: Op.gte,
    $gt: Op.gt,
    $lte: Op.lte,
    $lt: Op.lt,
    $not: Op.not,
    $in: Op.in,
    $notIn: Op.notIn,
    $is: Op.is,
    $like: Op.like,
    $notLike: Op.notLike,
    $iLike: Op.iLike,
    $notILike: Op.notILike,
    $regexp: Op.regexp,
    $notRegexp: Op.notRegexp,
    $iRegexp: Op.iRegexp,
    $notIRegexp: Op.notIRegexp,
    $between: Op.between,
    $notBetween: Op.notBetween,
    $overlap: Op.overlap,
    $contains: Op.contains,
    $contained: Op.contained,
    $adjacent: Op.adjacent,
    $strictLeft: Op.strictLeft,
    $strictRight: Op.strictRight,
    $noExtendRight: Op.noExtendRight,
    $noExtendLeft: Op.noExtendLeft,
    $and: Op.and,
    $or: Op.or,
    $any: Op.any,
    $all: Op.all,
    $values: Op.values,
    $col: Op.col
};

let sequelizeOptions;
if (dbConfig.dialect == 'sqlite'){
    sequelizeOptions = {
        dialect: dbConfig.dialect,
        storage: dbConfig.storage,
        logging: false,
        operatorsAliases
    }
} else {
    sequelizeOptions = {
        host: dbConfig.host,
        logging: false,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        dialectOptions: {
            multipleStatements: true
        },
        define: {
            timestamps: false
        },
        charset: 'utf8',
        collate: 'utf8_general_ci',
        timezone: moment_timezone.tz.guess(),
        operatorsAliases
    }
}

var sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, sequelizeOptions);

sequelize.customAfterSync = function() {
    return new Promise(function(resolve, reject) {
        if (globalConf.env == "tablet")
            return resolve();

        var toSyncProdObject = JSON.parse(fs.readFileSync(__dirname + '/toSyncProd.json'));

        var promises = [];

        /* ----------------- Récupération du toSync.json -----------------*/
        var toSyncFileName = __dirname + '/toSync.json';
        var toSyncObject = JSON.parse(fs.readFileSync(toSyncFileName));

        var dialect = sequelize.options.dialect;

        for (var entity in toSyncObject) {
            // Sync attributes
            if (toSyncObject[entity].attributes)
                for (var attribute in toSyncObject[entity].attributes) {
                    var type;
                    var request = "";
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
                            if(dialect == "postgres")
                                type = "timestamp with time zone";
                            else
                                type = "DATETIME";
                            break;
                        case "DECIMAL":
                            type = "DECIMAL(10,3)";
                            break;
                        case "ENUM":
                            if(dialect == "postgres"){
                                var postgresEnumType = attribute+"_enum_"+moment();
                                request += "CREATE TYPE "+postgresEnumType+" as ENUM (";
                                for(var i=0; i<toSyncObject[entity].attributes[attribute].values.length; i++){
                                    request += "'"+toSyncObject[entity].attributes[attribute].values[i]+"'";
                                    if(i != toSyncObject[entity].attributes[attribute].values.length-1)
                                        request += ",";
                                }
                                request += ");"
                                type = postgresEnumType;
                            }
                            else {
                                type = "ENUM(";
                                for(var i=0; i<toSyncObject[entity].attributes[attribute].values.length; i++){
                                    type += "'"+toSyncObject[entity].attributes[attribute].values[i]+"'";
                                    if(i != toSyncObject[entity].attributes[attribute].values.length-1)
                                        type += ",";
                                }
                                type += ")";
                            }
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

                    request += "ALTER TABLE ";
                    if(dialect == "mysql"){
                        request += entity;
                        request += " ADD COLUMN `" + attribute + "` " + type + " DEFAULT "+toSyncObject[entity].attributes[attribute].defaultValue+";";
                    } else if(dialect == "postgres"){
                        request += '"'+entity+'"';
                        request += " ADD COLUMN " + attribute + " " + type + " DEFAULT "+toSyncObject[entity].attributes[attribute].defaultValue+";";
                    }

                    (function(query, entityB, attributeB) {
                        promises.push(new Promise(function(resolve0, reject0) {
                            sequelize.query(query).then(function() {
                                toSyncProdObject.queries.push(query);
                                resolve0();
                            }).catch(function(err) {
                                if(typeof err.parent !== "undefined"){
                                    if(err.parent.errno == 1060 || err.parent.code == 42701){
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
                                    if(dialect == "mysql"){
                                        request += sourceName;
                                        request += " ADD COLUMN `" +option.foreignKey+ "` INT DEFAULT NULL;";
                                        request += "ALTER TABLE `" +sourceName+ "` ADD FOREIGN KEY (" +option.foreignKey+ ") REFERENCES `" +targetName+ "` (id) ON DELETE SET NULL ON UPDATE CASCADE;";
                                    } else if(dialect == "postgres"){
                                        request += '"'+sourceName+'"';
                                        request += " ADD COLUMN " +option.foreignKey+ " INT DEFAULT NULL;";
                                        request += "ALTER TABLE \"" +sourceName+ "\" ADD FOREIGN KEY (" +option.foreignKey+ ") REFERENCES \"" +targetName+ "\" (id) ON DELETE SET NULL ON UPDATE CASCADE;";
                                    }
                                }
                                else if (option.relation == 'hasMany') {
                                    if(dialect == "mysql"){
                                        request = "ALTER TABLE ";
                                        request += targetName;
                                        request += " ADD COLUMN `"+option.foreignKey+"` INT DEFAULT NULL;";
                                        request += "ALTER TABLE `"+targetName+"` ADD FOREIGN KEY ("+option.foreignKey+") REFERENCES `"+sourceName+"` (id);";
                                    } else if(dialect == "postgres"){
                                        request = "ALTER TABLE ";
                                        request += '"'+targetName+'"';
                                        request += " ADD COLUMN "+option.foreignKey+" INT DEFAULT NULL;";
                                        request += "ALTER TABLE \""+targetName+"\" ADD FOREIGN KEY ("+option.foreignKey+") REFERENCES \""+sourceName+"\" (id);";

                                    }
                                }

                                sequelize.query(request).then(function() {
                                    toSyncProdObject.queries.push(request);
                                    resolve0();
                                }).catch(function(err) {
                                    if(typeof err.parent !== "undefined"){
                                        if(err.parent.errno == 1060 || err.parent.code == 42701){
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
                    console.log(queries[idx])
                    sequelize.query(queries[idx]).then(function() {
                        toSyncProdObject.queries.push(queries[idx]);
                        execQuery(queries, idx+1);
                    }).catch(function(err){
                        console.error(err);
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
    var excludeFiles = ['hooks.js', 'validators.js'];
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