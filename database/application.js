// **** Database Generator Application ****

//Sequelize
var models = require('../models/');

// Select
exports.selectApplication = function(attr, callback) {

    // If params is a string, look for application with specific Name
    // Else if param is a number, look for application with its ID
    if (typeof attr !== 'undefined' && attr) {

        // Set options variable using the attribute array
        var options = attr.options;
        var where = {};
        var type_option;

        if (typeof options !== 'undefined' && options) {

            if (isNaN(options.value)) {
                // Value is the name of application
                var name_application = options.value;
                where = {
                    where: {
                        name: name_application
                    }
                }
                type_option = "name";
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
                    err.message = "Sorry, but there is no application with this " + type_option;
                    return callback(err, null);
                }

                // Assign new application to work on
                var info = {
                    "insertId": application.id,
                    "message": "Application " + application.id + " - " + application.name + " selected."
                };
                callback(null, info);
            }).catch(function(err){
                callback(err, null);
            });

        } else {
            var err = new Error();
            err.message = "Please indicate the name of the application you would like to select";
            callback(err, null);
        }
    }
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

    if (typeof attr !== 'undefined' && typeof attr.options !== "undefined") {

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
            }).then(function(created_application){
                var info = {
                    insertId: created_application.id,
                    message: "New application " + created_application.id + " created."
                }
                callback(null, info);
            }).catch(function(err){
                callback(err, null);
            });

        } else {
            var err = new Error();
            err.message = "Project seems not to be yet set.";
            callback(err, null);
        }
    }
}

// Delete
exports.deleteApplication = function(id_application, callback) {
    models.Application.destroy({where: {id: id_application}}).then(function() {
        var info = {
            "message": "Application "+id_application+" deleted."
        };
        callback(null, info);
    }).catch(function(err) {
        callback(err, null);
    });
}

// List
exports.listApplication = function(attr, callback) {

    models.Application.findAll({
        order: "id DESC"
    }).then(function(applications){
        var info = new Array();
        info.message = "List of applications (id | name): <br><ul>";

        if(!applications){
            info.message = info.message + "None<br>";
        }
        else {
            i = 0;
            while (i < applications.length) {
                info.message = info.message + "<li>" + applications[i].id + " | " + applications[i].name + "</li>";
                i++;
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
exports.getNameApplicationById = function(id_application, callback) {

    models.Application.findById(id_application).then(function(application){
        if(!application){
            var err = new Error();
            err.message = "No application module found";
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
            err.message = "No application with name "+name+" found.";
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
            err.message = "No application with name "+showName+" found.";
            return callback(err, null);
        }
        callback(null, application.id);
    }).catch(function(err){
        callback(err, null);
    });
}

exports.getCodeNameApplicationById = function(id_app, callback) {
    models.Application.findOne({where: {id: id_app}}).then(function(application) {
        if (!application)
            return callback("Application not found");
        return application.codeName;
    })
}
