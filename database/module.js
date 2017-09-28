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
                type_option = "Name"
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

            models.Module.findOne(where).then(function(foundModule) {
                if (!foundModule) {
                    var err = new Error();
                    err.message = "database.module.notFound.withThis"+type_option;
                    err.messageParams = [options.value];
                    return callback(err, null);
                }

                /* Need to remove the prefix to get the url value to redirect to default/MODULE */
                var urlModule = foundModule.codeName.substring(2);

                var info = {
                    insertId: foundModule.id,
                    moduleName: urlModule,
                    message: "database.module.select.selected",
                    messageParams: [foundModule.name, foundModule.id]
                };
                callback(null, info);
            }).catch(function(err) {
                callback(err, null);
            });
        } else {
            var err = new Error();
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
                        var info = {
                            insertId: created_module.id,
                            message: "database.module.create.success",
                            messageParams: [show_name_module, created_module.id, show_name_module]
                        };
                        callback(null, info);
                    }).catch(function(err) {
                        callback(err, null);
                    });
                }
                else{
                    var err = new Error();
                    err.message = "database.module.create.alreadyExist";
                    err.messageParams = [show_name_module];
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
        err.message = "database.module.list.selectAppBefore";
        return callback(err, null);
    }

    models.Module.findAll({
        order: "id DESC",
        include: [{
            model: models.Application,
            where: {
                id: attr.id_application
            }
        }]
    }).then(function(modules) {
        var info = {};
        info.message = "<br><ul>";
        if (!modules) {
            info.message += " - <br>";
        } else {
            for(var i=0; i<modules.length; i++){
                info.message += "<li>" + modules[i].name + "("+modules[i].id+")</li>";
            }
        }
        info.message += "</ul>";
        info.rows = modules;
        callback(null, info);
    }).catch(function(err) {
        callback(err, null);
    });
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
                err.message = "database.module.notFound.noModuleInApp";
                return callback(err, null);
            }
            callback(null, modules);
        }).catch(function(err) {
            callback(err, null);
        });
    }
}

exports.getNameModuleById = function(idModule, callback) {

    models.Module.findById(idModule).then(function(foundModule) {
        if (!foundModule) {
            var err = new Error();
            err.message = "database.module.notFound.withThisID";
            err.messageParams = [idModule];
            return callback(err, null);
        }
        callback(null, foundModule.name);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.getModuleById = function(id_module, callback) {

    models.Module.findById(id_module).then(function(module) {
        if (!module) {
            var err = new Error();
            err.message = "database.module.notFound.withThisID";
            err.messageParams = [idModule];
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
            err.message = "database.module.notFound.notFoundHomeModule";
            err.messageParams = [idApplication];
            return callback(err, null);
        }
        callback(null, homeModule.id);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.getEntityListByModuleName = function(id_application, moduleName, callback) {
    models.Module.findOne({where: {name: moduleName, id_application: id_application}, include: [models.DataEntity]}).then(function(module){
        if (!module){
            var err = new Error();
            err.message = "database.module.notFound.notFounded";
            err.messageParams = [moduleName];
            return callback(err, null);
        }
        callback(null, module.DataEntities);
    }).catch(function(err){
        callback(err, null);
    });
}

exports.getModuleByCodename = function(idApplication, codeName, callback) {
    models.Module.findOne({where: {codeName: codeName, id_application: idApplication}}).then(function(module) {
        callback(null, module);
    }).catch(function(err){
        callback(err, null);
    });
}

exports.deleteModule = function(idApplication, moduleName, moduleShowName, callback) {
    models.Module.destroy({where: {codeName: moduleName, id_application: idApplication}}).then(function(){
        var info = {
            message: "database.module.delete.deleted",
            messageParams: [moduleShowName]
        };
        callback(null, info);
    }).catch(function(err){
        callback(err, null);
    });
}