var sequelize = require('../models/').sequelize;

// DataEntity
exports.dropDataEntity = function(id_application, name_data_entity, callback) {

    query = "SET FOREIGN_KEY_CHECKS = 0;DROP TABLE "+id_application+"_"+name_data_entity.toLowerCase()+";";
    sequelize.query(query).spread(function(result) {
        callback();
    });
}

// Drop DataField
exports.dropDataField = function(attr, callback) {
    var name_data_entity = "";

    // *** 1 - Initialize variables according to options ***
    var name_data_entity = attr.name_data_entity;

    // *** 2 - Delete data field from table entity ***
    var query = "ALTER TABLE "+attr.id_application+"_"+name_data_entity.toLowerCase()+" DROP "+attr.fieldToDrop.toLowerCase()+";";
    sequelize.query(query).then(function(result) {
        callback();
    }).catch(function(err){
        callback(err, null);
    });
}

exports.dropFKDataField = function(attr, callback) {
    var name_data_entity = "";

    // *** 1 - Initialize variables according to options ***
    var name_data_entity = attr.name_data_entity;

    var table_name = attr.id_application+"_"+name_data_entity.toLowerCase();
    var query = "SELECT constraint_name FROM `information_schema`.`KEY_COLUMN_USAGE` where `COLUMN_NAME` = '"+attr.fieldToDrop+"' && `TABLE_NAME` = '"+table_name+"'";

    sequelize.query(query).then(function(constraintName) {
        query = "ALTER TABLE "+table_name + " DROP FOREIGN KEY "+constraintName[0][0].constraint_name+"; ALTER TABLE "+table_name+" DROP "+attr.fieldToDrop.toLowerCase();
        sequelize.query(query).then(function(result) {
            callback();
        }).catch(function(err){
            callback(err, null);
        });
    }).catch(function(err){
        callback(err, null);
    });
}
