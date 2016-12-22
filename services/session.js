var api_project = require("../api/project");
var api_application = require("../api/application");
var api_module = require("../api/module");
var api_data_entity = require("../api/data_entity");
var global = require("../config/global.js");

//Sequelize
var models = require('../models/');

// Help
exports.help = function(attr, callback) {

    id_project = null;
    id_application = null;
    id_module = null;
    id_data_entity = null;

    if (typeof(attr['id_project']) != 'undefined') id_project = attr['id_project'];
    if (typeof(attr['id_application']) != 'undefined') id_application = attr['id_application'];
    if (typeof(attr['id_module']) != 'undefined') id_module = attr['id_module'];
    if (typeof(attr['id_data_entity']) != 'undefined') id_data_entity = attr['id_data_entity'];

    info = new Array();

    if (id_data_entity == null) {
        info.message = "You are not yet working on any entity... Please select one or create a new data entity using instruction: 'select data entity NameOrIdOfYourEntity' or 'create data entity NameOfYourEntity'";
    } else {
        info.message = "Please refer to documentation: <a href='http://docs.newmips.com/' target='_blank'>http://docs.newmips.com/</a> to know more about basic instructions";
    }

    callback(null, info);
}

// Show
exports.showSession = function(attr, callback) {

    id_project = null;
    id_application = null;
    id_module = null;
    id_data_entity = null;

    if (typeof(attr['id_project']) != 'undefined') id_project = attr['id_project'];
    if (typeof(attr['id_application']) != 'undefined') id_application = attr['id_application'];
    if (typeof(attr['id_module']) != 'undefined') id_module = attr['id_module'];
    if (typeof(attr['id_data_entity']) != 'undefined') id_data_entity = attr['id_data_entity'];

    api_project.getNameProjectById(id_project, function(err, info) {

        if (err) {
            name_project = "None";
        } else {
            name_project = info;
        }

        api_application.getNameApplicationById(id_application, function(err, info) {

            if (err) {
                name_application = "None";
            } else {
                name_application = info;
            }
            console.log("getNameApplicationById : " + name_application);

            api_module.getNameModuleById(id_module, function(err, info) {

                if (err) {
                    name_module = "None";
                } else {
                    name_module = info;
                }

                api_data_entity.getNameDataEntityById(id_data_entity, function(err, info) {

                    if (err) {
                        name_data_entity = "None";
                    } else {
                        name_data_entity = info;
                    }

                    info = new Array();
                    info.message = "Session values (entity | id) :<br><ul>";
                    info.message = info.message + "<li>Project : " + id_project + " | " + name_project + "</li>";
                    info.message = info.message + "<li>Application : " + id_application + " | " + name_application + "</li>";
                    info.message = info.message + "<li>Module : " + id_module + " | " + name_module + "</li>";
                    info.message = info.message + "<li>Data entity : " + id_data_entity + " | " + name_data_entity + "</li></ul>";

                    callback(null, info);
                });
            });
        });

    });
}

// Deploy
exports.deploy = function(attr, callback) {

  if (typeof(attr['id_application']) != 'undefined') id_application = attr['id_application'];

  var protocol = global.protocol;
  var host = global.host;
  var math = require('math');
  var port = math.add(9000, id_application);
  var url = protocol + "://" + host + ":" + port;

  info = new Array();
  info.message = "Application is now available on: <br>";
  info.message = info.message + "<a href='" + url + "'  target='_blank'>" + url + "</a>";

  callback(null, info);
}

// Get
exports.getSession = function(attr, callback) {

    id_project = null;
    id_application = null;
    id_module = null;
    id_data_entity = null;

    if (typeof(attr['id_project']) != 'undefined') id_project = attr['id_project'];
    if (typeof(attr['id_application']) != 'undefined') id_application = attr['id_application'];
    if (typeof(attr['id_module']) != 'undefined') id_module = attr['id_module'];
    if (typeof(attr['id_data_entity']) != 'undefined') id_data_entity = attr['id_data_entity'];

    api_project.getNameProjectById(id_project, function(err, info) {

        if (err) {
            name_project = "None";
        } else {
            name_project = info;
        }

        api_application.getNameApplicationById(id_application, function(err, info) {

            if (err) {
                name_application = "None";
            } else {
                name_application  = info;
            }
            // console.log("getNameApplicationById : " + name_application);

            api_module.getNameModuleById(id_module, function(err, info) {

                if (err) {
                    name_module = "None";
                } else {
                    name_module = info;
                }

                api_data_entity.getNameDataEntityById(id_data_entity, function(err, info) {

                    if (err) {
                        name_data_entity = "None";
                    } else {
                        name_data_entity = info;
                    }

                    // info = new Array();
                    // info.message = "Session values (entity | id):\n";
                    // info.message = info.message + "> Project | " + id_project + " | " + name_project + "\n";
                    // info.message = info.message + "> Application | " + id_application + " | " + name_application + "\n";
                    // info.message = info.message + "> Module | " + id_module + " | " + name_module + "\n";
                    // info.message = info.message + "> Data entity | " + id_data_entity + " | " + name_data_entity + "\n";

                    info = {
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
                    callback(null, info);
                });
            });
        });

    });
}
