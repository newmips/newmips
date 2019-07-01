var sequelize = require('../models/').sequelize;
var fs = require('fs-extra');

function pushToSyncQuery(id_application, query) {
    try {
        var toSync = JSON.parse(fs.readFileSync('workspace/' + id_application + '/models/toSync.json'));
        if (!toSync.queries)
            toSync.queries = [];
        toSync.queries.push(query);
        fs.writeFileSync('workspace/' + id_application + '/models/toSync.json', JSON.stringify(toSync, null, 4), 'utf8');
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}

// DataEntity
exports.dropDataEntity = function (id_application, name_data_entity, callback) {
    var query = "";
    if(sequelize.options.dialect == "mysql")
        query = "SET FOREIGN_KEY_CHECKS=0;DROP TABLE IF EXISTS " + id_application + "_" + name_data_entity.toLowerCase() + ";SET FOREIGN_KEY_CHECKS=1;";
    else if(sequelize.options.dialect == "postgres")
        query = "DROP TABLE IF EXISTS \"" + id_application + "_" + name_data_entity.toLowerCase() + "\" CASCADE;";
    if (!pushToSyncQuery(id_application, query))
        return callback("ERROR: Can't delete in database");
    callback();
}

exports.addConstraintDeleteUpdate = function (attr, callback) {
    var query = '';
    if(sequelize.options.dialect == "mysql"){
        if (attr.dropForeignKey)
            query += "ALTER TABLE " + attr.id_application + "_" + attr.sourceEntity + " DROP FOREIGN KEY " + attr.foreignKey + "; ";
        query += " ALTER TABLE " + attr.id_application + "_" + attr.sourceEntity + " ADD CONSTRAINT " + attr.foreignKey
            + " FOREIGN KEY (" + attr.foreignKey + ") REFERENCES " + attr.id_application + "_" + attr.targetEntity
            + "(" + attr.targetKey + ") ON DELETE " + attr.constraintDelete + " ON UDPATE " + attr.constraintUpdate + " ;";
    } else if(sequelize.options.dialect == "postgres"){
        if (attr.dropForeignKey)
            query += "ALTER TABLE \"" + attr.id_application + "_" + attr.sourceEntity + "\" DROP FOREIGN KEY " + attr.foreignKey + "; ";
        query += " ALTER TABLE \"" + attr.id_application + "_" + attr.sourceEntity + "\" ADD CONSTRAINT " + attr.foreignKey
            + " FOREIGN KEY (" + attr.foreignKey + ") REFERENCES " + attr.id_application + "_" + attr.targetEntity
            + "(" + attr.targetKey + ") ON DELETE " + attr.constraintDelete + " ON UDPATE " + attr.constraintUpdate + " ;";
    }
    if (!pushToSyncQuery(attr.id_application, query))
        return callback("ERROR: Can't set constraint");
    callback();
}

// Drop DataField
exports.dropDataField = function (attr, callback) {

    var name_data_entity = attr.name_data_entity;
    var query = "";
    if(sequelize.options.dialect == "mysql")
        query = "ALTER TABLE " + attr.id_application + "_" + name_data_entity.toLowerCase() + " DROP " + attr.fieldToDrop.toLowerCase() + ";";
    if(sequelize.options.dialect == "postgres")
        query = "ALTER TABLE \"" + attr.id_application + "_" + name_data_entity.toLowerCase() + "\" DROP " + attr.fieldToDrop.toLowerCase() + ";";

    if (!pushToSyncQuery(attr.id_application, query))
        return callback("ERROR: Can't delete in database");
    callback();
}

exports.dropFKDataField = function (attr, callback) {

    // *** 1 - Initialize variables according to options ***
    var name_data_entity = attr.name_data_entity;
    var table_name = attr.id_application + "_" + name_data_entity.toLowerCase();

    var query = "";
    if(sequelize.options.dialect == "mysql")
        query = "SELECT constraint_name FROM `information_schema`.`KEY_COLUMN_USAGE` where `COLUMN_NAME` = '" + attr.fieldToDrop + "' && `TABLE_NAME` = '" + table_name + "';";
    else(sequelize.options.dialect == "postgres")
        query = "SELECT constraint_name FROM information_schema.KEY_COLUMN_USAGE where column_name = '" + attr.fieldToDrop + "' AND table_name = '" + table_name + "';";

    sequelize.query(query).then(function (constraintName) {
        if (typeof constraintName[0][0] === "undefined")
            return callback();

        query = "ALTER TABLE " + table_name + " DROP FOREIGN KEY " + constraintName[0][0].constraint_name + "; ALTER TABLE " + table_name + " DROP " + attr.fieldToDrop.toLowerCase() +";";
        if (!pushToSyncQuery(attr.id_application, query))
            return callback("ERROR: Can't delete in database");
        callback();
    }).catch(function (err) {
        callback(err);
    });
}

// Delete field related to multiple
exports.dropFKMultipleDataField = function (attr, callback) {
    // *** 1 - Initialize variables according to options ***
    var name_data_entity = attr.name_data_entity;
    var table_name = attr.id_application + "_" + attr.target.toLowerCase();

    var query = "";
    if(sequelize.options.dialect == "mysql")
        query = "SELECT constraint_name FROM `information_schema`.`KEY_COLUMN_USAGE` where `COLUMN_NAME` = '" + attr.fieldToDrop + "' && `TABLE_NAME` = '" + table_name + "';";
    else(sequelize.options.dialect == "postgres")
        query = "SELECT constraint_name FROM information_schema.KEY_COLUMN_USAGE where column_name = '" + attr.fieldToDrop + "' AND table_name = '" + table_name + "';";

    sequelize.query(query).then(function (constraintName) {
        if (typeof constraintName[0][0] === "undefined")
            return callback();
        query = "ALTER TABLE " + table_name + " DROP FOREIGN KEY " + constraintName[0][0].constraint_name + "; ALTER TABLE " + table_name + " DROP " + attr.fieldToDrop.toLowerCase() +";";
        if (!pushToSyncQuery(attr.id_application, query))
            return callback("ERROR: Can't delete in database");
        callback();
    }).catch(function (err) {
        callback(err);
    });
}

exports.dropTable = function(table_name, callback) {
    sequelize.query(`DROP TABLE ${table_name};`).then(_ =>{
        callback();
    }).catch(err => {
        console.error(err);
        callback(err);
    })
}