var fs = require("fs-extra");
var spawn = require('cross-spawn');
var helpers = require('../utils/helpers');

// Application
exports.setupApplication = function(attr, callback) {

    var id_application = attr.id_application;

    // Check each options variable to set properties
    var options = attr.options;
    var name_application = options.value;
    var show_name_application = options.showValue;

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
        historyScript += "create application "+show_name_application;
        historyScript += "\ncreate module home\n";
        fs.writeFileSync(historyScriptPath, historyScript);

        // *** Update translation fileFR ***
        var fileFR = __dirname + '/../workspace/' + id_application + '/locales/fr-FR.json';
        var dataFR = require(fileFR);
        dataFR.app.name = show_name_application;

        fs.writeFile(fileFR, JSON.stringify(dataFR, null, 2), function(err) {
            if(err){
                var err = new Error();
                err.message = "An error occurred while updating fr-FR translation file.";
                return callback(err, null);
            }

            var fileEN = __dirname + '/../workspace/' + id_application + '/locales/en-EN.json';
            var dataEN = require(fileEN);
            dataEN.app.name = show_name_application;

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

exports.initializeApplication = function(id_application) {
    return new Promise(function(resolve, reject) {
        // Copy authentication entities views
        var piecesPath = __dirname+'/pieces/authentication/';
        var workspacePath = __dirname+'/../workspace/'+id_application+'/';
        fs.copy(piecesPath+'/views/e_user', workspacePath+'/views/e_user', function(err) {
            if (err)
                console.log(err);

            // Copy authentication user entity route
            fs.copy(piecesPath+'/routes/e_user.js', workspacePath+'/routes/e_user.js', function(err) {
                if (err)
                    console.log(err);

                // Reset toSync to avoid double alter table
                var toSyncFileName = __dirname+'/../workspace/'+id_application+'/models/toSync.json';
                var writeStream = fs.createWriteStream(toSyncFileName)
                writeStream.write(JSON.stringify({}), null, 4);
                writeStream.end();
                writeStream.on('finish', function(){

                    // Sync workspace's database and insert admin user
                    var workspaceSequelize = require(__dirname+ '/../workspace/'+id_application+'/models/');
                    workspaceSequelize.sequelize.sync({ logging: console.log, hooks: false }).then(function(){
                        workspaceSequelize.E_user.create({f_login: 'adminWorkspace', f_password: '$2a$10$TclfBauyT/N0CDjCjKOG/.YSHiO0RLqWO2dOMfNKTNH3D5EaDIpr.', f_enabled: 1}).then(function() {
                            resolve();
                        });
                    });

                });
            });
        });
    });
}

exports.deleteApplication = function(id_application, callback) {

    // Kill spawned child process by preview
    var process_manager = require('../services/process_manager.js');
    var process_server = process_manager.process_server;
    var path = __dirname+'/../workspace/'+id_application;

    if (process_server != null) {
        try{
            process_server = process_manager.killChildProcess(process_server.pid, function() {
                helpers.rmdirSyncRecursive(path);
                callback();
            });
        } catch(err){
            callback(err, null);
        }
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