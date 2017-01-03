// **** Database Generator Component ****

//Sequelize
var models = require('../models/');

// Insert a new component link to an entity
exports.createNewComponentOnEntity = function(attr, callback) {

    var name = "";
    var id_data_entity = 0;
    var id_module = 0;
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {

        id_data_entity = attr.id_data_entity;
        id_module = attr.id_module;
        var options = attr.options;

        if (typeof options !== 'undefined' && options && id_data_entity != 0 && id_module != 0) {

            models.Component.create({
                name: options.name,
                id_data_entity: id_data_entity,
                id_module: id_module,
                version: version
            }).then(function(created_component) {
                if (!created_component) {
                    var err = new Error();
                    err.message = "Sorry, an error occured while creation the component.";
                    return callback(err, null);
                }
                var info = {
                    insertId: created_component.id,
                    message: "New component " + created_component.id + " | "+created_component.name+" created."
                }
                callback(null, info);
            }).catch(function(err) {
                callback(err, null);
            });
        }
    }
}

// Insert a new component link to a module
exports.createNewComponentOnModule = function(attr, callback) {

    var name = "";
    var id_module = 0;
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {

        id_module = attr.id_module;
        var options = attr.options;

        if (typeof options !== 'undefined' && options && id_module != 0) {

            models.Component.create({
                name: options.name,
                id_module: id_module,
                version: version
            }).then(function(created_component) {
                if (!created_component) {
                    var err = new Error();
                    err.message = "Sorry, an error occured while creating the component.";
                    return callback(err, null);
                }
                var info = {
                    insertId: created_component.id,
                    message: "New component " + created_component.id + " | "+created_component.name+" created."
                }
                callback(null, info);
            }).catch(function(err) {
                callback(err, null);
            });
        }
    }
}

// Get a component with a given name in an entity
exports.getComponentByNameInEntity = function(attr, callback) {

    var name = "";
    var id_data_entity = 0;
    var id_module = 0;
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {
        id_data_entity = attr.id_data_entity;
        id_module = attr.id_module;
        var options = attr.options;

        if (typeof options !== 'undefined' && options && id_data_entity != 0 && id_module != 0) {

            models.Component.findOne({
                where:{
                    name: options.name,
                    id_data_entity: id_data_entity,
                    id_module: id_module
                }
            }).then(function(component) {
                if (!component) {
                    var err = new Error();
                    err.message = "Sorry, no component with this name exist.";
                    return callback(err, null);
                }
                callback(null, component);
            }).catch(function(err) {
                callback(err, null);
            });
        }
    }
}

// Get a component with a given name in a module
exports.getComponentByNameInModule = function(attr, callback) {

    var name = "";
    var id_module = 0;
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {
        id_module = attr.id_module;
        options = attr.options;

        if (typeof options !== 'undefined' && options && id_module != 0) {

            models.Component.findOne({
                where:{
                    name: options.name,
                    id_module: id_module
                }
            }).then(function(component) {
                if (!component) {
                    err = new Error();
                    err.message = "Sorry, no component with this name exist.";
                    return callback(err, null);
                }
                callback(null, component);
            }).catch(function(err) {
                callback(err, null);
            });
        }
    }
}

