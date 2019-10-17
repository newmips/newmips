var db_project = require("../database/project");
var db_application = require("../database/application");
var db_module = require("../database/module");
var db_entity = require("../database/data_entity");
var globalConf = require("../config/global.js");
var gitHelper = require("../utils/git_helper");
var fs = require('fs-extra');
var language = require("../services/language");

//Sequelize
var models = require('../models/');

// Help
exports.help = function(attr, callback) {

    var id_project = null;
    var id_application = null;
    var id_module = null;
    var id_data_entity = null;

    if(typeof(attr['id_project']) != 'undefined') id_project = attr['id_project'];
    if(typeof(attr['id_application']) != 'undefined') id_application = attr['id_application'];
    if(typeof(attr['id_module']) != 'undefined') id_module = attr['id_module'];
    if(typeof(attr['id_data_entity']) != 'undefined') id_data_entity = attr['id_data_entity'];

    var info = new Array();

    info.message = "botresponse.help";

    callback(null, info);
}

// Show
exports.showSession = function(attr, callback) {

    var id_project = null;
    var id_application = null;
    var id_module = null;
    var id_data_entity = null;

    var name_project = "None";
    var name_application = "None";
    var name_module = "None";
    var name_data_entity = "None";

    if (typeof(attr['id_project']) != 'undefined') id_project = attr['id_project'];
    if (typeof(attr['id_application']) != 'undefined') id_application = attr['id_application'];
    if (typeof(attr['id_module']) != 'undefined') id_module = attr['id_module'];
    if (typeof(attr['id_data_entity']) != 'undefined') id_data_entity = attr['id_data_entity'];

    db_project.getNameProjectById(id_project, function(err, info) {
        if (!err)
            name_project = info;
        db_application.getNameApplicationById(id_application, function(err, info) {
            if (!err)
                name_application = info;
            db_module.getNameModuleById(id_module, function(err, info) {
                if (!err)
                    name_module = info;
                db_entity.getNameDataEntityById(id_data_entity, function(err, info) {
                    if (!err)
                        name_data_entity = info;

                    var info = new Array();
                    info.message = "Session :<br><ul>";
                    info.message += "<li>Project : " + id_project + " | " + name_project + "</li>";
                    info.message += "<li>Application : " + id_application + " | " + name_application + "</li>";
                    info.message += "<li>Module : " + id_module + " | " + name_module + "</li>";
                    info.message += "<li>Data entity : " + id_data_entity + " | " + name_data_entity + "</li></ul>";

                    callback(null, info);
                });
            });
        });
    });
}

// Get
exports.getSession = function(attr, req, callback) {

    var id_project = null;
    var id_application = null;
    var id_module = null;
    var id_data_entity = null;

    var name_project = null;
    var name_application = null;
    var name_module = null;
    var name_data_entity = null;

    if(typeof(attr.id_project) != 'undefined') id_project = attr.id_project;
    if(typeof(attr.id_application) != 'undefined') id_application = attr.id_application;
    if(typeof(attr.id_module) != 'undefined') id_module = attr.id_module;
    if(typeof(attr.id_data_entity) != 'undefined') id_data_entity = attr.id_data_entity;

    db_project.getNameProjectById(id_project, function(err, info) {
        if (!err)
            name_project = info;
        db_application.getNameApplicationById(id_application, function(err, info) {
            if (!err)
                name_application  = info;
            db_module.getNameModuleById(id_module, function(err, info) {
                if(!err)
                    name_module = info;
                db_entity.getNameDataEntityById(id_data_entity, function(err, info) {
                    if(!err)
                        name_data_entity = info;

                    var returnInfo = {
                        "project": {
                            "id_project": id_project,
                            "name_project": name_project,
                            "noProject": language(req.session.lang_user).__("preview.session.noProject")
                        },
                        "application": {
                            "id_application": id_application,
                            "name_application": name_application,
                            "noApplication": language(req.session.lang_user).__("preview.session.noApplication")
                        },
                        "module": {
                            "id_module": id_module,
                            "name_module": name_module,
                            "noModule": language(req.session.lang_user).__("preview.session.noModule")
                        },
                        "data_entity": {
                            "id_data_entity": id_data_entity,
                            "name_data_entity": name_data_entity,
                            "noEntity": language(req.session.lang_user).__("preview.session.noEntity")
                        }
                    };
                    callback(null, returnInfo);
                });
            });
        });

    });
}

// Set session in POST application
exports.setSession = function(npFunction, req, info, data) {

    let iframeUrl;
    switch(npFunction){
        case "selectApplication":
        case "createNewApplication":
            req.session.app_name = info.application.name;
            req.session.module_name = null;
            req.session.entity_name = null;
            break;
        case "selectModule":
        case "createNewModule":
            req.session.module_name = info.module.name;
            req.session.entity_name = null;
            if (data && data.iframe_url) {
                // Redirect iframe to new module
                iframeUrl = data.iframe_url.split("/");
                data.iframe_url = iframeUrl[0] + "//" + iframeUrl[2] + "/default/" + info.module.name;
            }
            break;
        case "selectEntity":
            req.session.entity_name = info.insertId;
            req.session.module_name = info.moduleId;
            if (data && data.iframe_url && info.doRedirect) {
                iframeUrl = data.iframe_url.split("/");
                data.iframe_url = iframeUrl[0] + "//" + iframeUrl[2] + "/" + info.urlEntity + "/list";
            }
            break;
        case "createNewEntity":
            req.session.entity_name = info.entity.name;
            if (data && data.iframe_url) {
                iframeUrl = data.iframe_url.split("/");
                data.iframe_url = iframeUrl[0] + "//" + iframeUrl[2] + "/" + info.entity.name.substring(2) + "/create_form";
            }
            break;
        case "createNewEntityWithBelongsTo":
        case "createNewEntityWithHasMany":
        case "createNewBelongsTo":
        case "createNewHasMany":
        case "createNewFieldRelatedTo":
            req.session.entity_name = info.insertId;
            break;
        case "deleteProject":
            req.session.id_project = null;
            req.session.id_application = null;
            req.session.id_module = null;
            req.session.entity_name = null;
            break;
        case "deleteApplication":
            req.session.id_application = null;
            req.session.id_module = null;
            req.session.entity_name = null;
            req.session.toastr = [{
                message: 'actions.delete.application',
                level: "success"
            }];
            break;
        case "deleteModule":
            req.session.id_module = info.homeID;
            req.session.entity_name = null;
            // Redirect iframe to new module
            iframeUrl = data.iframe_url.split("/default/");
            data.iframe_url = iframeUrl[0]+"/default/home";
            break;
        case "deleteDataEntity":
            // If we were on the deleted entity we has to reset the entity session
            if(data.session.entity_name == info.deletedEntityId)
                req.session.entity_name = null;
            break;
    }
}

// Set session for the instruction script
exports.setSessionForInstructionScript = function(attrFunction, userArray, info) {

    switch(attrFunction){
        case "selectProject":
        case "createNewProject":
            userArray.ids.id_project = info.insertId;
            userArray.ids.id_application = null;
            userArray.ids.id_module = null;
            userArray.ids.id_data_entity = null;
            break;
        case "selectApplication":
        case "createNewApplication":
            userArray.ids.id_application = info.insertId;
            userArray.name_application = info.name_application;
            userArray.ids.id_module = null;
            userArray.ids.id_data_entity = null;
            break;
        case "selectModule":
        case "createNewModule":
            userArray.ids.id_module = info.insertId;
            userArray.ids.id_data_entity = null;
            break;
        case "selectEntity":
            userArray.ids.id_data_entity = info.insertId;
            userArray.ids.id_module = info.moduleId;
            break;
        case "createNewEntity":
        case "selectEntity":
        case "createNewEntityWithBelongsTo":
        case "createNewEntityWithHasMany":
        case "createNewBelongsTo":
        case "createNewHasMany":
        case "createNewFieldRelatedTo":
            userArray.ids.id_data_entity = info.insertId;
            break;
        case "deleteProject":
            userArray.ids.id_project = null;
            userArray.ids.id_application = null;
            userArray.ids.id_module = null;
            userArray.ids.id_data_entity = null;
            break;
        case "deleteApplication":
            userArray.ids.id_application = null;
            userArray.ids.id_module = null;
            userArray.ids.id_data_entity = null;
            break;
        case "deleteModule":
            userArray.ids.id_module = info.homeID;
            userArray.ids.id_data_entity = null;
            break;
    }
}

// Set session in an given attr obj
exports.setSessionInAttr = function(attr, info) {

    switch(attr.function){
        case "selectProject":
        case "createNewProject":
            attr.id_project = info.insertId;
            attr.id_application = null;
            attr.id_module = null;
            attr.id_data_entity = null;
            break;
        case "selectApplication":
        case "createNewApplication":
            attr.id_application = info.insertId;
            attr.id_module = null;
            attr.id_data_entity = null;
            break;
        case "selectModule":
        case "createNewModule":
            attr.id_module = info.insertId;
            attr.id_data_entity = null;
            break;
        case "createNewEntity":
        case "selectEntity":
        case "createNewEntityWithBelongsTo":
        case "createNewEntityWithHasMany":
        case "createNewBelongsTo":
        case "createNewHasMany":
        case "createNewFieldRelatedTo":
            attr.id_data_entity = info.insertId;
            break;
        case "deleteProject":
            attr.id_project = null;
            attr.id_application = null;
            attr.id_module = null;
            attr.id_data_entity = null;
            break;
        case "deleteApplication":
            attr.id_application = null;
            attr.id_module = null;
            attr.id_data_entity = null;
            break;
        case "deleteModule":
            attr.id_module = info.homeID;
            attr.id_data_entity = null;
            break;
    }
}
