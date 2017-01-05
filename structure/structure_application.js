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
        if(err){
            var err = new Error();
            err.message = "An error occurred while copying template folder.";
            return callback(err, null);
        }

        /* Save an instruction history in the history script in workspace folder */
        var historyScriptPath = __dirname + '/../workspace/' + id_application + '/history_script.nps';
        var historyScript = fs.readFileSync(historyScriptPath, 'utf8');
        historyScript += "create application "+name_application;
        historyScript += "\ncreate module home\n";
        fs.writeFileSync(historyScriptPath, historyScript);

        // *** Update translation fileFR ***
        var fileFR = __dirname + '/../workspace/' + id_application + '/locales/fr-FR.json';
        var dataFR = require(fileFR);
        dataFR.app.name = name_application;

        fs.writeFile(fileFR, JSON.stringify(dataFR, null, 2), function(err) {
            if(err){
                var err = new Error();
                err.message = "An error occurred while updating fr-FR translation file.";
                return callback(err, null);
            }

            var fileEN = __dirname + '/../workspace/' + id_application + '/locales/en-EN.json';
            var dataEN = require(fileEN);
            dataEN.app.name = name_application;

            fs.writeFile(fileEN, JSON.stringify(dataEN, null, 2), function(err) {
                if(err){
                    var err = new Error();
                    err.message = "An error occurred while updating en-EN translation file.";
                    return callback(err, null);
                }

                // Write the config/language.json file in the workspace with the language in the generator session -> lang_user
                var languageConfig = require(__dirname+'/../workspace/'+id_application+'/config/language');
                languageConfig.lang = attr.lang_user;
                fs.writeFile(__dirname+'/../workspace/'+id_application+'/config/language.json', JSON.stringify(languageConfig, null, 2), function(err) {
                    if(err){
                        var err = new Error();
                        err.message = "An error occurred while creating language.json.";
                        return callback(err, null);
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
        }).catch(function(err){
            callback(err, null);
        });
    }
    else {
        try{
            helpers.rmdirSyncRecursive(path);
            callback();
        } catch(err){
            callback(err, null);
        }
    }
}