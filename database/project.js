// **** Database Generator Project ****

//Sequelize
var models = require('../models/');

// Select
exports.selectProject = function(attr, callback) {

    // If params is a string, look for plateau with specific Name
    // Else if param is a number, look for plateau with its ID
    if (typeof attr !== 'undefined' && attr) {

        // Set options variable using the attribute array
        var options = attr.options;
        var type_option;

        if (typeof options !== 'undefined' && options) {

            if (isNaN(options.value)) {
                // Value is the name of project
                var name_project = options.value;
                where = {
                    where: {
                        name: name_project
                    }
                }
                type_option = "name"
            } else {
                // Value is the ID of project
                var id_project = options.value;
                where = {
                    where: {
                        id: id_project
                    }
                }
                type_option = "ID"
            }

            models.Project.findOne(where).then(function(project) {
                if (!project) {
                    var err = new Error();
                    err.message = "Sorry, but there is no project with this " + type_option;
                    return callback(err, null);
                }

                var info = {
                    "insertId": project.id,
                    "message": "Project " + project.id + " - " + project.name + " selected."
                };
                callback(null, info);

            }).catch(function(err) {
                callback(err, null);
            });
        } else {
            var err = new Error();
            err.message = "Please indicate the ID of the project you would like to select";
            callback(err, null);
        }
    }
}

// Create
exports.createNewProject = function(attr, callback) {

    var name_project;
    var version = 1;

    if (typeof attr !== 'undefined' && typeof attr.options !== "undefined") {

        // Set options variable using the attribute array
        var options = attr.options;
        name_project = options.value;
        var show_name_project = options.showValue;

        if (typeof name_project !== 'undefined' && name_project != "") {

            models.Project.create({
                name: show_name_project,
                codeName: name_project,
                version: version
            }).then(function(created_project) {
                var info = {
                    insertId: created_project.id,
                    message: "New project " + created_project.id + " created."
                }
                callback(null, info);
            }).catch(function(err) {
                callback(err, null);
            });

        } else {
            var err = new Error();
            err.message = "Sorry, an error occured with the project creation.";
            callback(err, null);
        }
    }
}

// List
exports.listProject = function(attr, callback) {

    models.Project.findAll({
        order: "id DESC"
    }).then(function(projects) {
        var info = new Array();
        info.message = "List of projects (id | name): <br><ul>";

        if (projects.length == 0) {
            info.message = info.message + "None<br>";
        } else {
            i = 0;
            while (i < projects.length) {
                info.message = info.message + "<li>" + projects[i].id + " | " + projects[i].name + "</li>";
                i++;
            }
        }
        info.message += "</ul>";
        info.rows = projects;
        callback(null, info);

    }).catch(function(err) {
        callback(err, null);
    });
}

// Delete
exports.deleteProject = function(attr, callback) {

    try {
        var options = attr.options;
        var project = attr.options.showValue;

        var where = {
            where: {}
        };

        if(isNaN(project)){
            where.where = {
                name: project
            };
        }
        else{
            where.where = {
                id: project
            };
        }

        models.Project.destroy(where).then(function() {
            var info = {
                message: "Project "+project+" deleted."
            }
            callback(null, info);
        }).catch(function(err) {
            callback(err, null);
        });
    } catch(err) {
        callback(err, null);
    }
}

// GetById
exports.getNameProjectById = function(id_project, callback) {

    if (typeof id_project == "undefined") {
        var err = new Error();
        err.message = "ID project is not defined";
        return callback(err, null);
    }

    models.Project.findById(id_project).then(function(project){
        if(!project){
            var err = new Error();
            err.message = "No project found";
            return callback(err, null);
        }
        callback(null, project.name);
    }).catch(function(err){
        callback(err, null);
    });
}

exports.getProjectApplications = function(project, callback){
    var where = {where: {}, include: [models.Application]};
    if (isNaN(project)){
        where.where = {name: project};
    }
    else{
        where.where = {id: project};
    }
    models.Project.findOne(where).then(function(project){
        if(!project){
            var err = new Error();
            err.message = "No project found";
            return callback(err, null);
        }

        callback(null, project.Applications);
    }).catch(function(err){
        callback(err, null);
    });
}