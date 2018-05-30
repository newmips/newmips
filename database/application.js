// **** Database Generator Application ****

//Sequelize
var models = require('../models/');

// Select
exports.selectApplication = function(attr, callback) {

    // Set options variable using the attribute array
    var options = attr.options;
    var where = {};
    var type_option;

    if (isNaN(options.value)) {
        // Value is the name of application
        var name_application = options.value;
        where = {
            where: {
                name: name_application
            }
        }
        type_option = "Name";
    }
    else{
        // Value is the ID of application
        var id_application = options.value;
        where = {
            where: {
                id: id_application
            }
        }
        type_option = "ID";
    }

    models.Application.findOne(where).then(function(application){
        if(!application){
            var err = new Error();
            err.message = "database.application.notFound.withThis"+type_option;
            err.messageParams = [options.value];
            return callback(err, null);
        }

        // Assign new application to work on
        var info = {
            insertId: application.id,
            message: "database.application.select.selected",
            messageParams: [application.name, application.id]
        };
        callback(null, info);
    }).catch(function(err){
        callback(err, null);
    });
}

// Check if application already
exports.exist = function(attr, callback) {

    var options = attr.options;
    var value = options.value.toLowerCase();

    // Value is the name of application
    var name_application = options.value;
    var where = {
        where: {
            codeName: value
        }
    };

    models.Application.findOne(where).then(function(application){
        if(!application){
            callback(null, false);
        }
        else{
            callback(null, application);
        }
    }).catch(function(err){
        callback(err, null);
    });
}

// Create
exports.createNewApplication = function(attr, callback) {

    var name_application;
    var id_project = -1;
    var version = 1;

    // Set id_project of future application according to session value transmitted in attributes
    id_project = attr.id_project;

    // Set options variable using the attribute array
    var options = attr.options;
    name_application = options.value;
    var show_name_application = options.showValue;

    if (typeof name_application !== 'undefined' && name_application != "" && id_project != "") {

        models.Application.create({
            name: show_name_application,
            displayName: show_name_application,
            codeName: name_application,
            id_project: id_project,
            version: version
        }).then(function(createdApp){
            var info = {
                insertId: createdApp.id,
                message: "database.application.create.success",
                messageParams: [createdApp.name, createdApp.id]
            }
            callback(null, info);
        }).catch(function(err){
            callback(err, null);
        });
    }
}

// Delete
exports.deleteApplication = function(idApp, callback) {
    models.Application.destroy({where: {id: idApp}}).then(function() {
        var info = {
            message: "database.application.delete.deleted",
            messageParams: [idApp]
        };
        callback(null, info);
    }).catch(function(err) {
        callback(err, null);
    });
}

// List
exports.listApplication = function(attr, callback) {

    models.Application.findAll({
        order: [["id", "DESC"]]
    }).then(function(applications){
        var info = {};
        info.message = "<br><ul>";

        if(!applications){
            info.message += " - <br>";
        }
        else {
            for(var i=0; i<applications.length; i++){
                info.message += "<li>" + applications[i].name + "("+applications[i].id+")</li>";
            }
        }
        info.message += "</ul>";
        info.rows = applications;

        callback(null, info);
    }).catch(function(err){
        callback(err, null);
    });
}

// GetById
exports.getNameApplicationById = function(idApp, callback) {

    models.Application.findById(idApp).then(function(application){
        if(!application){
            var err = new Error();
            err.message = "database.application.notFound.withThisID";
            err.messageParams = [idApp];
            return callback(err, null);
        }
        callback(null, application.name);
    }).catch(function(err){
        callback(err, null);
    });
}

// GetByName
exports.getIdApplicationByName = function(name, callback) {
    models.Application.findOne({where: {name: name}}).then(function(application){
        if(!application){
            var err = new Error();
            err.message = "database.application.notFound.withThisCodeName";
            err.messageParams = [name];
            return callback(err, null);
        }
        callback(null, application.id);
    }).catch(function(err){
        callback(err, null);
    });
}

exports.getIdApplicationByCodeName = function(codeName, showName, callback) {
    models.Application.findOne({where: {codeName: codeName}}).then(function(application){
        if(!application){
            var err = new Error();
            err.message = "database.application.notFound.withThisName";
            err.messageParams = [showName];
            return callback(err, null);
        }
        callback(null, application.id);
    }).catch(function(err){
        callback(err, null);
    });
}

exports.getCodeNameApplicationById = function(idApp, callback) {
    models.Application.findOne({where: {id: idApp}}).then(function(application) {
        if (!application){
            var err = new Error();
            err.message = "database.application.notFound.withThisID";
            err.messageParams = [idApp];
            return callback(err);
        }
        callback(null, application.codeName);
    })
}
