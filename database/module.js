// **** Database Generator Module ****

//Sequelize
var models = require('../models/');

// Select a module
exports.selectModule = function(attr, callback) {

    // If params is a string, look for information_system with specific Name
    // Else if param is a number, look for information_system with its ID
    if (typeof attr !== 'undefined' && attr) {

        // Set options variable using the attribute array
        var options = attr.options;
        var type_option = "";
        var where = {};

        if (typeof options !== 'undefined' && options) {

            if (isNaN(options.value)) {
                // Value is the name of module
                var name_module = options.value;
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
                var id_module = options.value;
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
                    err.message = "Sorry, but there is no application module with this " + type_option + ".";
                    return callback(err, null);
                }

                /* Need to remove the prefix to get the url value to redirect to default/MODULE */
                var urlModule = module.codeName.substring(2);

                var info = {
                    "insertId": module.id,
                    "moduleName": urlModule,
                    "message": "Module " + module.id + " - " + module.name + " selected."
                };
                callback(null, info);

            }).catch(function(err) {
                callback(err, null);
            });
        } else {
            err = new Error();
            err.message = "Please indicate the name/ID of the module you would like to select.";
            callback(err, null);
        }
    }
}

// Create a module
exports.createNewModule = function(attr, callback) {

    var name_module;
    var id_application = -1;

    if(typeof attr !== 'undefined' && typeof attr.options !== "undefined" ) {

        // Set id_information_system of future application_module according to session value transmitted in attributes
        id_application = attr.id_application;

        // Set options variable using the attribute array
        var options = attr.options;
        name_module = options.value;
        var show_name_module = options.showValue;

        if(typeof options !== 'undefined' && id_application > 0){

            models.Module.findOne({
                where: {
                    $or: [{name: show_name_module}, {codeName: name_module}],
                    id_application: id_application
                }
            }).then(function(existingModule){
                if(!existingModule){
                    models.Module.create({
                        name: show_name_module,
                        codeName: name_module,
                        id_application: id_application,
                        version: 1
                    }).then(function(created_module) {
                        if(!created_module){
                            var err = new Error();
                            err.message = "Sorry, an error occured during the createNewModule in the Database.";
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
                else{
                    var err = new Error();
                    err.message = "Sorry, an existing module with the same or similar name already exist.";
                    return callback(err, null);
                }
            }).catch(function(err) {
                callback(err, null);
            });
        }
    }
}

// List all module
exports.listModule = function(attr, callback) {

    if(typeof attr.id_application == "undefined" || attr.id_application == null){
        var err = new Error();
        err.message = "Please select a Application before.";
        return callback(err, null);
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
                info.message += "None<br>";
            } else {
                i = 0;
                while (i < modules.length) {
                    info.message += "<li>" + modules[i].id + " | " + modules[i].name + "</li>";
                    i++;
                }
            }
            info.message += "</ul>";
            info.rows = modules;
            callback(null, info);
        }).catch(function(err) {
            callback(err, null);
        });
    }
}

exports.listModuleByApplication = function(attr, callback) {

    var id_application = 0;

    if(typeof attr !== 'undefined' && attr){

        // Set filter on id_application
        id_application = attr.id_application;

        models.Module.findAll({
            where: {
                id_application: id_application
            },
            order: "id ASC"
        }).then(function(modules) {
            if (!modules) {
                var err = new Error();
                err.message = "Sorry, an error occured while executing listModuleByApplication in the Database.";
                return callback(err, null);
            }
            callback(null, modules);
        }).catch(function(err) {
            callback(err, null);
        });
    }
}

exports.getNameModuleById = function(id_module, callback) {

    if (typeof id_module == 'undefined') {
        var err = new Error();
        err.message = "ID module is not defined.";
        return callback(err, null);
    }

    models.Module.findById(id_module).then(function(module) {
        if (!module) {
            var err = new Error();
            err.message = "No module with ID "+id_module+" found.";
            return callback(err, null);
        }
        callback(null, module.name);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.getModuleById = function(id_module, callback) {

    if (typeof id_module == 'undefined') {
        var err = new Error();
        err.message = "ID module is not defined.";
        return callback(err, null);
    }

    models.Module.findById(id_module).then(function(module) {
        if (!module) {
            var err = new Error();
            err.message = "No module with ID "+id_module+" found.";
            return callback(err, null);
        }
        callback(null, module);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.getHomeModuleId = function(idApplication, callback) {

    models.Module.findOne({
        where: {
            id_application: idApplication,
            name: "home",
            codeName: "m_home"
        }
    }).then(function(homeModule) {
        if (!module) {
            var err = new Error();
            err.message = "Cannot find home module in the application with ID "+idApplication+".";
            return callback(err, null);
        }
        callback(null, homeModule.id);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.getEntityListByModuleName = function(id_application, module_name, callback) {
    models.Module.findOne({where: {name: module_name, id_application: id_application}, include: [models.DataEntity]}).then(function(module){
        if (!module){
            var err = new Error();
            err.message = "Unable to find module "+module_name+".";
            return callback(err, null);
        }
        callback(null, module.DataEntities);
    }).catch(function(err){
        callback(err, null);
    });
}

exports.deleteModule = function(idApplication, moduleName, moduleShowName, callback) {
    models.Module.destroy({where: {codeName: moduleName, id_application: idApplication}}).then(function(){
        var info = {
            message: "Module '"+moduleShowName+"' deleted."
        }
        callback(null, info);
    }).catch(function(err){
        callback(err, null);
    });
}