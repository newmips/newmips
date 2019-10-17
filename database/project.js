// **** Database Generator Project ****

//Sequelize
const models = require('../models/');

// Select
exports.selectProject = (attr, callback) => {
    // Set options variable using the attribute array
    let options = attr.options;
    let type_option;
    let where = {
        where: {}
    };

    if (isNaN(options.value)) {
        // Value is the displayName of project
        where.where.displayName = options.value;
        type_option = "Name"
    } else {
        // Value is the ID of project
        where.where.id = options.value;
        type_option = "ID"
    }

    models.Project.findOne(where).then(project => {
        if (!project) {
            let err = new Error();
            err.message = "database.project.notFound.withThis" + type_option;
            err.messageParams = [options.value];
            return callback(err, null);
        }

        callback(null, {
            insertId: project.id,
            message: "database.project.select.selected",
            messageParams: [project.displayName, project.id]
        });
    }).catch(err => {
        callback(err, null);
    });
}

// Create
exports.createNewProject = (attr, callback) => {
    let options = attr.options;
    models.Project.create({
        displayName: options.showValue,
        codeName: options.value,
        version: 1
    }).then(created_project => {
        callback(null, {
            insertId: created_project.id,
            message: "database.project.create.success",
            messageParams: [options.showValue, created_project.id]
        });
    }).catch(err => {
        callback(err, null);
    });
}

// List
exports.listProject = (attr, callback) => {

    models.Project.findAll({
        order: [
            ["id", "DESC"]
        ]
    }).then(projects => {
        let info = new Array();
        info.message = "<br><ul>";
        if (projects.length == 0) {
            info.message += " - <br>";
        } else {
            for (let i = 0; i < projects.length; i++) {
                info.message += "<li>" + projects[i].id + " | " + projects[i].displayName + "</li>";
            }
        }
        info.message += "</ul>";
        info.rows = projects;
        callback(null, info);

    }).catch(err => {
        callback(err, null);
    });
}

// Delete
exports.deleteProject = (value, callback) => {

    let where = {
        where: {}
    };

    if (isNaN(value))
        where.where.displayName = value;
    else
        where.where.id = value;

    models.Project.destroy(where).then(_ => {
        return callback(null, {
            message: "database.project.delete.deleted",
            messageParams: [value]
        });
    }).catch(err => {
        callback(err, null);
    });

}

// GetById
exports.getNameProjectById = (idProject, callback) => {

    models.Project.findById(idProject).then(project => {
        if (!project) {
            let err = new Error();
            err.message = "database.project.notFound.withThisID";
            err.messageParams = [idProject];
            return callback(err, null);
        }
        callback(null, project.displayName);
    }).catch(err => {
        callback(err, null);
    });
}

exports.getProjectApplications = (project, callback) => {
    let where = {
        where: {},
        include: [models.Application]
    };

    let type = "";
    if (isNaN(project)) {
        where.where.displayName = project;
        type = "Name";
    } else {
        where.where.id = project;
        type = "ID";
    }

    models.Project.findOne(where).then(project => {
        if (!project) {
            var err = new Error();
            err.message = "database.project.notFound.withThis" + type;
            err.messageParams = [project];
            return callback(err, null);
        }

        callback(null, project.Applications);
    }).catch(err => {
        callback(err, null);
    });
}

// Check if current user has all the application access in the project
exports.checkAccessAllApplication = async(attr, callback) => {

    let project = await models.Project.findOne({
        where: {
            id: attr.options.showValue
        },
        include: [{
            model: models.Application,
            include: [{
                model: models.User,
                as: "users"
            }]
        }]
    });

    let hasAccess;
    for (var i = 0; i < project.Applications.length; i++) {
        hasAccess = false;
        for (var j = 0; j < project.Applications[i].users.length; j++)
            if (project.Applications[i].users[j].id == attr.currentUser.id)
                hasAccess = true;
        if (!hasAccess)
            return false;
    }
    return true;
}