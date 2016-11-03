// **** API Project ****

//Sequelize
var models = require('../models/');

// Select
exports.selectProject = function(attr, callback) {

    // If params is a string, look for plateau with specific Name
    // Else if param is a number, look for plateau with its ID
    if (typeof attr !== 'undefined' && attr) {

        // Set options variable using the attribute array
        options = attr['options'];

        if (typeof options !== 'undefined' && options) {

            if (isNaN(options[0].value)) {
                // Value is the name of project
                name_project = options[0].value;
                where = {
                    where: {
                        name: name_project
                    }
                }
                type_option = "name"
            } else {
                // Value is the ID of project
                id_project = options[0].value;
                where = {
                    where: {
                        id: id_project
                    }
                }
                type_option = "ID"
            }

            models.Project.findOne(where).then(function(project) {
                if (!project) {
                    err = new Error();
                    err.message = "Sorry, but there is no project with this " + type_option;
                    return callback(err, null);
                }

                info = {
                    "insertId": project.id,
                    "message": "Project " + project.id + " - " + project.name + " selected."
                };
                callback(null, info);

            }).catch(function(err) {
                callback(err, null);
            })
        } else {
            err = new Error();
            err.message = "Please indicate the ID of the project you would like to select";
            callback(err, null);
        }
    }
}

// Create
exports.createNewProject = function(attr, callback) {

    var name_project = "";
    var description_project = "";
    var type_project = "TARGET";
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {

        // Set options variable using the attribute array
        options = attr['options'];

        if (typeof options !== 'undefined' && options) {

            // Check each options variable to set properties
            i = 0;
            while (i < options.length) {

                if (typeof options[i] !== 'undefined' && options[i]) {
                    if (options[i].property == "entity") name_project = options[i].value;
                    if (options[i].property == "description") description_project = options[i].value;
                    if (options[i].property == "type") type_project = options[i].value;
                }
                i++;
            }

            models.Project.create({
                name: name_project,
                description: description_project,
                type: type_project,
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
            err = new Error();
            err.message = "Sorry, an error occured.";
            callback(err, null);
        }
    }
}

// List
exports.listProject = function(attr, callback) {

    models.Project.findAll({
        order: "id DESC"
    }).then(function(projects) {
        info = new Array();
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
        info.message = info.message + "</ul>";
        info.rows = projects;
        callback(null, info);

    }).catch(function(err) {
        callback(err, null);
    });
}

// Delete
exports.deleteProject = function(attr, callback) {

try {
    var options = attr['options'];
    // Check each options variable to set properties
    var project;
    var i = 0;
    for (var i = 0; i < options.length; i++)
        if (typeof options[i] !== 'undefined' && options[i])
            if (options[i].property == "entity")
                project = options[i].value;

    var where = {where: {}};
    if (isNaN(project))
        where.where = {name: project};
    else
        where.where = {id: project};

    models.Project.destroy(where).then(function(){
        var info = {
            message: "Project " + project + " deleted."
        }
        callback(null, info);
    }).catch(function(err){
        callback(err, null);
    });
} catch(e) {
    console.error(e);
}
}

// GetById
exports.getNameProjectById = function(id_project, callback) {

    if (typeof id_project == "undefined") {
        err = new Error();
        err.message = "Id project is not defined";
        return callback(err, null);
    }

    models.Project.findById(id_project).then(function(project){
        if(!project){
            err = new Error();
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
    if (isNaN(project))
        where.where = {name: project};
    else
        where.where = {id: project};
    models.Project.findOne(where).then(function(project){
        if(!project){
            err = new Error();
            err.message = "No project found";
            return callback(err, null);
        }

        callback(null, project.Applications);

    }).catch(function(err){
        callback(err, null);
    });
}