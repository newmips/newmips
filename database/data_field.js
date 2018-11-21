// **** Database Generator Field ****
var models = require('../models/');

// Create new field in entity
exports.createNewDataField = function(attr, callback) {

    if (attr.id_data_entity == null) {
        var err = new Error();
        err.message = "database.field.error.selectOrCreateBefore";
        return callback(err, null);
    }
    var version = 1;

    if (typeof attr !== 'undefined' && typeof attr.options !== "undefined") {

        // Set id_data_entity of future data_field according to session value transmitted in attributes
        var id_data_entity = attr.id_data_entity;

        // Set options variable using the attribute array
        var options = attr.options;
        var name_field = options.value;
        var showNameField = options.showValue;

        var type_field = (typeof options.type !== "undefined") ? options.type : "string";

        if (typeof options !== 'undefined' && name_field != "" && id_data_entity != "") {

            models.DataField.findOne({
                where: {
                    id_data_entity: id_data_entity,
                    $or: [{
                        name: showNameField
                    }, {
                        codeName: name_field
                    }]
                }
            }).then(function(dataField) {
                if (dataField) {
                    var err = new Error();
                    err.message = "database.field.error.alreadyExist";
                    err.messageParams = [showNameField];
                    return callback(err, null);
                }

                models.DataField.create({
                    name: showNameField,
                    codeName: name_field,
                    type: type_field,
                    id_data_entity: id_data_entity,
                    version: version
                }).then(function(dataField) {
                    models.DataEntity.findById(id_data_entity).then(function(dataEntity) {
                        var info = {
                            insertId: dataField.id,
                            message: "database.field.create.created",
                            messageParams: [showNameField, dataField.id, dataEntity.name, showNameField, showNameField, showNameField]
                        };
                        callback(null, info);
                    });
                }).catch(function(err) {
                    callback(err, null);
                });
            }).catch(function(err) {
                callback(err, null);
            });
        } else {
            var err = new Error();
            err.message = "Attributes are not properly defined.";
            callback(err, null);
        }
    } else {
        var err = new Error();
        err.message = "Attributes are not properly defined.";
        callback(err, null);
    }
}

// Create a foreign key in an entity
exports.createNewForeignKey = function(attr, callback) {

    if (attr.id_data_entity == null) {
        var err = new Error();
        err.message = "database.field.error.selectOrCreateBefore";
        return callback(err, null);
    }

    var name = attr.options.showForeignKey;
    var codeName = attr.options.foreignKey;

    models.DataEntity.findOne({
        where: {
            codeName: attr.options.source
        },
        include: [{
            model: models.Module,
            required: true,
            include: [{
                model: models.Application,
                where: {
                    id: attr.id_application
                }
            }]
        }]
    }).then(function(dataEntity) {
        models.DataField.create({
            name: name,
            codeName: codeName,
            type: "INTEGER",
            version: 1,
            id_data_entity: dataEntity.id
        }).then(function(createdForeignKey) {
            var info = {};
            info.insertId = createdForeignKey.id;
            info.message = "database.field.create.foreignKeyCreated";
            info.messageParams = [createdForeignKey.id, createdForeignKey.name];
            callback(null, info);
        }).catch(function(err) {
            callback(err, null);
        });
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.listDataField = function(attr, callback) {
    models.DataField.findAll({
        order: [["id", "DESC"]],
        include: [{
            model: models.DataEntity,
            required: true,
            include: [{
                model: models.Module,
                required: true,
                include: [{
                    model: models.Application,
                    where: {
                        id: attr.id_application
                    }
                }]
            }]
        }]
    }).then(function(fields) {

        var info = {};
        info.message = "<br><ul>";
        if (!fields)
            info.message = info.message + "-\n";
        else
            for (var i = 0; i < fields.length; i++)
                info.message += "<li>" + fields[i].DataEntity.Module.name + " | " + fields[i].DataEntity.name + " | " + fields[i].name + "(" + fields[i].id + ")</li>";
        info.message += "</ul>";
        info.rows = fields;
        callback(null, info);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.getNameDataFieldById = function(idField, callback) {

    models.DataField.findOne({
        where: {
            id: idField
        }
    }).then(function(dataField) {
        if (!dataField) {
            var err = new Error();
            err.message = "database.field.notFound.withThisID";
            err.message = [idField];
            return callback(err, null);
        }

        callback(null, dataField);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.getCodeNameByNameArray = function(names, idEntity, callback) {
    var columns = [];
    for (var i = 0; i < names.length; i++)
        columns.push({
            name: names[i].toLowerCase()
        });
    models.DataField.findAll({
        attributes: ['codeName', 'name'],
        where: {
            $or: columns,
            id_data_entity: idEntity
        },
        raw: true
    }).then(function(results) {
        callback(null, results);
    }).catch(function(err) {
        callback(err);
    });
}

exports.getFieldByCodeName = function(params, callback) {
    models.DataField.findOne({
        where: {
            codeName: params.codeName,
            id_data_entity: params.idEntity
        }
    }).then(function(field) {
        if (!field) {
            var err = new Error();
            err.message = "database.field.notFound.withThisName";
            err.messageParams = [params.showValue, params.showEntity];
            return callback(err, null);
        }

        callback(null, field);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.deleteDataField = function(attr, callback) {

    if (attr.id_data_entity == null) {
        var err = new Error();
        err.message = "database.field.error.selectOrCreateBefore";
        return callback(err, null);
    }

    var idEntity = attr.id_data_entity;
    var nameField = attr.options.value;

    models.DataField.destroy({
        where: {
            codeName: nameField,
            id_data_entity: idEntity
        }
    }).then(function() {
        var info = {};
        info.message = "database.field.delete.deleted";
        info.messageParams = [attr.options.showValue];
        callback(null, info);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.deleteDataFieldById = function(id, callback) {
    models.DataField.destroy({
        where: {
            id: id
        }
    }).then(function() {
        callback(null, true);
    }).catch(function(err) {
        callback(err, null);
    });
}

// Get real SQL type in DB, not sequelize datatype
// Params:
// {
//     table: yourTableName,
//     column: yourColumnName
// }
exports.getDatabaseSQLType = function(params, callback) {
    var request = "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '"+params.table+"' AND COLUMN_NAME = '"+params.column+"';"
    models.sequelize.query(request, {type: models.sequelize.QueryTypes.SELECT}).then(function(result){
        if(result.length > 0)
            return callback(result[0].DATA_TYPE, result[0].CHARACTER_MAXIMUM_LENGTH);
        callback(false, false)
    })
}