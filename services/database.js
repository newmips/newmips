var sequelize = require('../models/').sequelize;

// DataEntity
exports.dropDataEntity = function(id_application, name_data_entity, callback) {

    query = "SET FOREIGN_KEY_CHECKS = 0;DROP TABLE "+id_application+"_" + name_data_entity.toLowerCase() + ";";
    sequelize.query(query).spread(function(result) {
        callback();
    });
}

// Drop DataField
exports.dropDataField = function(attr, callback) {
    var name_data_entity = "";
    var name_data_field = "";

    // *** 1 - Initialize variables according to options ***
    var options = attr.options;
    for (var i = 0; i < options.length; i++)
        if (options[i].property == "name_data_entity") name_data_entity = options[i].value;

    // *** 2 - Delete data field from table entity ***
    var query = "ALTER TABLE "+attr.id_application+"_" + name_data_entity.toLowerCase() + " DROP " + attr.fieldToDrop.toLowerCase()+";";
    sequelize.query(query).then(function(result) {
        callback();
    }).catch(callback);
}

exports.dropFKDataField = function(attr, callback) {
    var name_data_entity = "";
    var name_data_field = "";

    // *** 1 - Initialize variables according to options ***
    var options = attr.options;
    for (var i = 0; i < options.length; i++)
        if (options[i].property == "name_data_entity") name_data_entity = options[i].value;
    var table_name = attr.id_application+"_" + name_data_entity.toLowerCase();

    var query = "SELECT constraint_name FROM `information_schema`.`KEY_COLUMN_USAGE` where `COLUMN_NAME` = '"+attr.fieldToDrop+"' && `TABLE_NAME` = '"+table_name+"'";
    sequelize.query(query).then(function(constraintName) {
        query = "ALTER TABLE "+table_name + " DROP FOREIGN KEY "+constraintName[0][0].constraint_name+"; ALTER TABLE "+table_name + " DROP " + attr.fieldToDrop.toLowerCase();
        sequelize.query(query).then(function(result) {
            callback();
        }).catch(callback);
    }).catch(callback)
}
