// **** API Module ****

//Sequelize
var models = require('../models/');

// Module
exports.selectModule = function(attr, callback) {

    // If params is a string, look for information_system with specific Name
    // Else if param is a number, look for information_system with its ID
    if (typeof attr !== 'undefined' && attr) {

        // Set options variable using the attribute array
        options = attr['options'];

        if (typeof options !== 'undefined' && options) {

            if (isNaN(options[0].value)) {
                // Value is the name of module
                name_module = options[0].value;
                where = {
                    where: {
                        name: name_module
                    },
                    include: [{
                        model: models.Application,
                        where: {
                            id: attr.id_application
                        }
                    }]
                }
                type_option = "name"
            } else {
                // Value is the ID of module
                id_module = options[0].value;
                where = {
                    where: {
                        id: id_module
                    },
                    include: [{
                        model: models.Application,
                        where: {
                            id: attr.id_application
                        }
                    }]
                }
                type_option = "ID"
            }


            models.Module.findOne(where).then(function(module) {
                if (!module) {
                    err = new Error();
                    err.message = "Sorry, but there is no application module with this " + type_option;
                    return callback(err, null);
                }

                var info = {
                    "insertId": module.id,
                    "moduleName": module.name,
                    "message": "Module " + module.id + " - " + module.name + " selected."
                };
                callback(null, info);

            }).catch(function(err) {
                callback(err, null);
            })

        } else {
            err = new Error();
            err.message = "Please indicate the name of the application module you would like to select";
            callback(err, null);
        }

    }
}

exports.createNewModule = function(attr, callback) {

    var name_module = "";
    var id_application = 0;
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {

        // Set id_information_system of future application_module according to session value transmitted in attributes
        id_application = attr['id_application'];

        // Set options variable using the attribute array
        options = attr['options'];

        if (typeof options !== 'undefined' && options && id_application != 0) {

            // Check each options variable to set properties
            i = 0;
            while (i < options.length) {
                if (typeof options[i] !== 'undefined' && options[i]) {
                    if (options[i].property == "entity") name_module = options[i].value;
                }
                i++;
            }

            models.Module.create({
                name: name_module,
                id_application: id_application,
                version: version
            }).then(function(created_module) {
                if (!created_module) {
                    err = new Error();
                    err.message = "Sorry, an error occured.";
                    return callback(err, null);
                }
                var info = {
                    insertId: created_module.id,
                    message: "New module " + created_module.id + " | " + name_module + " created."
                }
                callback(null, info);

            }).catch(function(err) {
                callback(err, null);
            });
        }
    }
}

// List
exports.listModule = function(attr, callback) {

    if(typeof attr.id_application == "undefined" || attr.id_application == null){
        err = new Error();
        err.message = "Please select a Application before.";
        callback(err,null);
    }
    else{
        models.Module.findAll({
            order: "id DESC",
            include: [{
                model: models.Application,
                where: {
                    id: attr.id_application
                }
            }]
        }).then(function(modules) {
            var info = new Array();
            info.message = "List of modules (id | name): <br><ul>";
            if (!modules) {
                info.message = info.message + "None<br>";
            } else {
                i = 0;
                while (i < modules.length) {
                    info.message = info.message + "<li>" + modules[i].id + " | " + modules[i].name + "</li>";
                    i++;
                }
            }
            info.message = info.message + "</ul>";
            info.rows = modules;
            callback(null, info);
        }).catch(function(err) {
            callback(err, null);
        });
    }
}

// listModuleByApplication
exports.listModuleByApplication = function(attr, callback) {

    var id_application = 0;

    if (typeof attr !== 'undefined' && attr) {

        // Set filter on id_application
        id_application = attr.id_application;

        models.Module.findAll({
            where: {
                id_application: id_application
            },
            order: "id ASC"
        }).then(function(modules) {
            if (!modules) {
                err = new Error();
                err.message = "Sorry, an error occured while executing the request";
                return callback(err, null);
            }
            callback(null, modules);

        }).catch(function(err) {
            callback(err, null);
        });
    }
}

// GetById
exports.getNameModuleById = function(id_module, callback) {

    if (typeof id_module == 'undefined') {
        err = new Error();
        err.message = "Id module is not defined";
        return callback(err, null);
    }

    models.Module.findById(id_module).then(function(module) {
        if (!module) {
            err = new Error();
            err.message = "No module found";
            return callback(err, null);
        }
        callback(null, module.name);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.getEntityListByModuleName = function(id_application, module_name, callback) {
    models.Module.findOne({where: {name: module_name, id_application: id_application}, include: [models.DataEntity]}).then(function(module){
        if (!module)
            return callback("Unable to find module "+module_name);
        callback(null, module.DataEntities);
    }).catch(callback);
}

exports.deleteModule = function(module_name, callback) {
    models.Module.destroy({where: {name: module_name}}).then(function() {
        callback();
    }).catch(callback);
}
