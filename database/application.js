// **** Database Generator Application ****

//Sequelize
var models = require('../models/');

// Select
exports.selectApplication = function(attr, callback) {

    // If params is a string, look for application with specific Name
    // Else if param is a number, look for application with its ID
    if (typeof attr !== 'undefined' && attr) {

        // Set options variable using the attribute array
        var options = attr['options'];
        var where = {};
        var type_option;

        if (typeof options !== 'undefined' && options) {

            if (isNaN(options[0].value)) {
                // Value is the name of application
                name_application = options[0].value;
                where = {
                    where: {
                        name: name_application
                    }
                }
                type_option = "name";
            }
            else{
                // Value is the ID of application
                var id_application = options[0].value;
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

// Create
exports.createNewApplication = function(attr, callback) {

    var name_application = "";
    var id_project = -1;
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {

        // Set id_project of future application according to session value transmitted in attributes
        id_project = attr['id_project'];

        // Set options variable using the attribute array
        var options = attr['options'];

        if (typeof options !== 'undefined' && options && id_project != "") {

            // Check each options variable to set properties
            i = 0;
            while (i < options.length) {
                if (typeof options[i] !== 'undefined' && options[i]) {
                    if (options[i].property == "entity") name_application = options[i].value;
                }
                i++;
            }

            models.Application.create({
                name: name_application,
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
        info.message = info.message + "</ul>";
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