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

        // *** Update translation fileFR ***
        fileFR = __dirname + '/../workspace/' + id_application + '/locales/fr-FR.json';
        dataFR = require(fileFR);
        dataFR.app.name = name_application;

        fs.writeFile(fileFR, JSON.stringify(dataFR, null, 2), function(err) {
            if (err) return console.log(err);

            fileEN = __dirname + '/../workspace/' + id_application + '/locales/en-EN.json';
            dataEN = require(fileEN);
            dataEN.app.name = name_application;

            fs.writeFile(fileEN, JSON.stringify(dataEN, null, 2), function(err) {
                if(err){
                    return console.log(err);
                }

                // Write the config/language.json file in the workspace with the language in the generator session -> lang_user
                var languageConfig = require(__dirname+'/../workspace/'+id_application+'/config/language');
                languageConfig.lang = attr.lang_user;
                fs.writeFile(__dirname+'/../workspace/'+id_application+'/config/language.json', JSON.stringify(languageConfig, null, 2), function(err) {
                    if(err){
                        return console.log(err);
                    }
                    // Direct callback as application has been installed in template folder
                    callback();
                });
            });
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