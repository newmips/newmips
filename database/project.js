// **** Database Generator Project ****

//Sequelize
var models = require('../models/');

// Select
exports.selectProject = function(attr, callback) {

    // Set options variable using the attribute array
    var options = attr.options;
    var type_option;
    var where = {};

    if (isNaN(options.value)) {
        // Value is the name of project
        var nameProject = options.value;
        where = {
            where: {
                name: nameProject
            }
        }
        type_option = "Name"
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
            err.message = "database.project.notFound.withThis"+type_option;
            err.messageParams = [options.value];
            return callback(err, null);
        }

        var info = {
            insertId: project.id,
            message: "database.project.select.selected",
            messageParams: [project.name, project.id]
        };
        callback(null, info);
    }).catch(function(err) {
        callback(err, null);
    });
}

// Create
exports.createNewProject = function(attr, callback) {

    // Set options variable using the attribute array
    var options = attr.options;
    var name_project = options.value;
    var show_name_project = options.showValue;

    models.Project.create({
        name: show_name_project,
        displayName: show_name_project,
        codeName: name_project,
        version: 1
    }).then(function(created_project) {
        var info = {
            insertId: created_project.id,
            message: "database.project.create.success",
            messageParams: [show_name_project, created_project.id]
        }
        callback(null, info);
    }).catch(function(err) {
        callback(err, null);
    });
}

// List
exports.listProject = function(attr, callback) {

    models.Project.findAll({
        order: [["id", "DESC"]]
    }).then(function(projects) {
        var info = new Array();
        info.message = "<br><ul>";
        if (projects.length == 0) {
            info.message += " - <br>";
        } else {
            for(var i=0; i<projects.length; i++){
                info.message += "<li>" + projects[i].id + " | " + projects[i].name + "</li>";
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
exports.deleteProject = function(value, callback) {

    try {
        var where = {
            where: {}
        };

        if(isNaN(value)){
            where.where = {
                name: value
            };
        }
        else{
            where.where = {
                id: value
            };
        }

        models.Project.destroy(where).then(function() {
            var info = {
                message: "database.project.delete.deleted",
                messageParams: [value]
            };
            callback(null, info);
        }).catch(function(err) {
            callback(err, null);
        });
    } catch(err) {
        callback(err, null);
    }
}

// GetById
exports.getNameProjectById = function(idProject, callback) {

    models.Project.findById(idProject).then(function(project){
        if(!project){
            var err = new Error();
            err.message = "database.project.notFound.withThisID";
            err.messageParams = [idProject];
            return callback(err, null);
        }
        callback(null, project.name);
    }).catch(function(err){
        callback(err, null);
    });
}

exports.getProjectApplications = function(project, callback){
    var where = {where: {}, include: [models.Application]};
    var type = "";

    if (isNaN(project)){
        where.where = {name: project};
        type = "Name";
    }
    else{
        where.where = {id: project};
        type = "ID";
    }
    models.Project.findOne(where).then(function(project){
        if(!project){
            var err = new Error();
            err.message = "database.project.notFound.withThis"+type_option;
            err.messageParams = [project];
            return callback(err, null);
        }

        callback(null, project.Applications);
    }).catch(function(err){
        callback(err, null);
    });
}