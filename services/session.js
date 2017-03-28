var db_project = require("../database/project");
var db_application = require("../database/application");
var db_module = require("../database/module");
var db_entity = require("../database/data_entity");
var globalConf = require("../config/global.js");
var gitHelper = require("../utils/git_helper");

var manager;
if (globalConf.env == 'cloud')
    manager = require('../services/dns_manager');

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

    if (id_data_entity == null) {
        info.message = "You are not yet working on any entity. Please select one or create a new entity using instruction: <br>'select entity Name_Or_ID_Of_Your_Entity' <br>or<br> 'add entity Name_Of_Your_Entity'. <br><br> You can also refer to our documentation: <a href='http://docs.newmips.com/' target='_blank'>http://docs.newmips.com/</a> to know more about basic instructions.";
    } else {
        info.message = "Please refer to documentation: <a href='http://docs.newmips.com/' target='_blank'>http://docs.newmips.com/</a> to know more about basic instructions.";
    }

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
        if (!err) {
            name_project = info;
        }
        db_application.getNameApplicationById(id_application, function(err, info) {
            if (!err) {
                name_application = info;
            }
            db_module.getNameModuleById(id_module, function(err, info) {
                if (!err) {
                    name_module = info;
                }
                db_entity.getNameDataEntityById(id_data_entity, function(err, info) {
                    if (!err) {
                        name_data_entity = info;
                    }

                    var info = new Array();
                    info.message = "Session values (entity | id) :<br><ul>";
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

// Deploy
exports.deploy = function(attr, callback) {

    var id_application;

    if (typeof(attr.id_application) !== 'undefined')
        id_application = attr.id_application;

    console.log("ID App:", id_application)

    if (globalConf.env == 'cloud') {
            console.log("ENV: ", globalConf.env);
            // Push on git before deploy
            gitHelper.gitPush(attr, function(err, infoGit){
                if(err){
                    console.log(err);
                    return callback(err, null);
                }

                console.log("Git push done!");

                db_application.getCodeNameApplicationById(id_application, function(err, codeName) {
                    if (err){
                        console.log(err);
                        return callback(err);
                    }
                    var subdomain = globalConf.host + '-' + codeName.substring(2);
                    console.log("subdomain: ", subdomain);
                    var url = globalConf.protocol + '://' + subdomain + globalConf.dns;
                    console.log("url; ", url);
                    manager.createCloudDns(subdomain).then(function(data) {
                        console.log("CREATE DNS CLOUD FINISH");
                        console.log(data);
                        var url = data.body.url;
                        var info = {
                            message: "We're deploying your application...<br>\
                                    Wait for its initialization on :<br>\
                                    <a href='"+url+"' target='_blank'>"+url+"</a>"
                        }

                        callback(null, info);
                    }).catch(function(err) {
                        console.log(err);
                        callback(err, null);
                    });
                });
            });
    }
    else {
        console.log("ELSE");
        var protocol = globalConf.protocol;
        var host = globalConf.host;
        var math = require('math');
        var port = math.add(9000, id_application);
        var url = protocol + "://" + host + ":" + port;
        var info = new Array();
        info.message = "Application is now available on: <br>";
        info.message += "<a href='"+url+"' target='_blank'>"+url+"</a>";

        callback(null, info);
    }
}

// Get
exports.getSession = function(attr, callback) {

    var id_project = null;
    var id_application = null;
    var id_module = null;
    var id_data_entity = null;

    var name_project = "None";
    var name_application = "None";
    var name_module = "None";
    var name_data_entity = "None";

    if(typeof(attr['id_project']) != 'undefined') id_project = attr['id_project'];
    if(typeof(attr['id_application']) != 'undefined') id_application = attr['id_application'];
    if(typeof(attr['id_module']) != 'undefined') id_module = attr['id_module'];
    if(typeof(attr['id_data_entity']) != 'undefined') id_data_entity = attr['id_data_entity'];

    db_project.getNameProjectById(id_project, function(err, info) {
        if (!err) {
            name_project = info;
        }
        db_application.getNameApplicationById(id_application, function(err, info) {
            if (!err) {
                name_application  = info;
            }
            db_module.getNameModuleById(id_module, function(err, info) {
                if(!err){
                    name_module = info;
                }
                db_entity.getNameDataEntityById(id_data_entity, function(err, info) {
                    if(!err){
                        name_data_entity = info;
                    }

                    var returnInfo = {
                        "project": {
                            "id_project": id_project,
                            "name_project": name_project
                        },
                        "application": {
                            "id_application": id_application,
                            "name_application": name_application
                        },
                        "module": {
                            "id_module": id_module,
                            "name_module": name_module
                        },
                        "data_entity": {
                            "id_data_entity": id_data_entity,
                            "name_data_entity": name_data_entity
                        }
                    };
                    // console.log(info);
                    callback(null, returnInfo);
                });
            });
        });

    });
}

// Set session in POST application
exports.setSession = function(attrFunction, req, info, data) {

    switch(attrFunction){
        case "selectProject":
        case "createNewProject":
            req.session.id_project = info.insertId;
            req.session.id_application = null;
            req.session.id_module = null;
            req.session.id_data_entity = null;
            break;
        case "selectApplication":
        case "createNewApplication":
            req.session.id_application = info.insertId;
            req.session.id_module = null;
            req.session.id_data_entity = null;
            break;
        case "selectModule":
        case "createNewModule":
            req.session.id_module = info.insertId;
            req.session.id_data_entity = null;

            // Redirect iframe to new module
            var iframeUrl = data.iframe_url.split("/default/");
            data.iframe_url = iframeUrl[0]+"/default/"+info.moduleName.toLowerCase();
            break;
        case "createNewDataEntity":
        case "selectDataEntity":
        case "createNewEntityWithBelongsTo":
        case "createNewEntityWithHasMany":
        case "createNewBelongsTo":
        case "createNewHasMany":
        case "createNewFieldRelatedTo":
            req.session.id_data_entity = info.insertId;
            break;
        case "deleteProject":
            req.session.id_project = null;
            req.session.id_application = null;
            req.session.id_module = null;
            req.session.id_data_entity = null;
            break;
        case "deleteApplication":
            req.session.id_application = null;
            req.session.id_module = null;
            req.session.id_data_entity = null;
            req.session.toastr = [{
                message: 'actions.delete.application',
                level: "success"
            }];
            break;
        case "deleteModule":
            req.session.id_module = info.homeID;
            req.session.id_data_entity = null;
            // Redirect iframe to new module
            var iframeUrl = data.iframe_url.split("/default/");
            data.iframe_url = iframeUrl[0]+"/default/home";
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
        case "createNewDataEntity":
        case "selectDataEntity":
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
        case "createNewDataEntity":
        case "selectDataEntity":
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
