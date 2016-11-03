var fs = require("fs-extra");
var spawn = require('cross-spawn');
var helpers = require('../utils/helpers');

// Application
exports.setupApplication = function(attr, callback) {

    var id_application = attr['id_application'];
    var name_application = "";

    // Check each options variable to set properties
    var options = attr.options;
    for (var i = 0;i < options.length; i++)
        if (typeof options[i] !== 'undefined' && options[i])
            if (options[i].property == "entity") name_application = options[i].value;

    // *** Copy template folder to new workspace ***
    fs.copy(__dirname + '/template/', __dirname + '/../workspace/' + id_application, function(err) {
        if (err) return console.error(err)

        // *** Update translation file ***
        file = __dirname + '/../workspace/' + id_application + '/locales/fr-FR.json';
        data = require(file);
        data.app.name = name_application;

        fs.writeFile(file, JSON.stringify(data, null, 2), function(err) {
            if (err) return console.log(err);

            // Direct callback as application has been installed in template folder
            callback();
        });
    });
}

exports.deleteApplication = function(id_application, callback) {

    // Kill spawned child process by preview
    var process_manager = require('../services/process_manager.js');
    var process_server = process_manager.process_server;
    var path = __dirname + '/../workspace/' + id_application;

    if (process_server != null) {
        process_server = process_manager.killChildProcess(process_server.pid, function() {
            helpers.rmdirSyncRecursive(path);
            callback();
        });
    }
    else {
        helpers.rmdirSyncRecursive(path);
        callback();
    }
}