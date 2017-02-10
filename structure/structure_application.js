var fs = require("fs-extra");
var spawn = require('cross-spawn');
var helpers = require('../utils/helpers');
var translateHelper = require("../utils/translate");

// Global conf
var globalConf = require('../config/global.js');

var gitlabConf = require('../config/gitlab.json');

try{
    // Gitlab connection
    var gitlab = require('gitlab')({
        url:   gitlabConf.url,
        token: gitlabConf.privateToken
    });
} catch(err){
    console.log("Error connection Gitlab repository: "+err);
    console.log("Please set doGit in config/gitlab.json to false");
}


//Sequelize
var models = require('../models/');

// Application
exports.setupApplication = function(attr, callback) {

    var id_application = attr.id_application;

    // Check each options variable to set properties
    var options = attr.options;
    var name_application = options.value;
    var show_name_application = options.showValue;

    // *** Copy template folder to new workspace ***
    fs.copy(__dirname+'/template/', __dirname+'/../workspace/'+id_application, function(err) {
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

        /* --------------- New translation --------------- */
        translateHelper.writeLocales(id_application, "application", null, show_name_application, attr.googleTranslate, function(){
            // Write the config/language.json file in the workspace with the language in the generator session -> lang_user
            var languageConfig = require(__dirname+'/../workspace/'+id_application+'/config/language');
            languageConfig.lang = attr.lang_user;
            fs.writeFile(__dirname+'/../workspace/'+id_application+'/config/language.json', JSON.stringify(languageConfig, null, 2), function(err) {
                if(err){
                    var err = new Error();
                    err.message = "An error occurred while creating language.json.";
                    return callback(err, null);
                }

                var nameAppWithoutPrefix = name_application.substring(2);
                // Create the application repository in gitlab
                if(gitlabConf.doGit){
                    var newGitlabProject = {
                        user_id : 1,
                        name: globalConf.host+"-"+nameAppWithoutPrefix,
                        description: "A generated Newmips workspace.",
                        issues_enabled: false,
                        merge_requests_enabled: false,
                        wiki_enabled: false,
                        snippets_enabled: false,
                        public: false
                    };

                    try{
                        gitlab.projects.create(newGitlabProject, function(result){
                            // Direct callback as application has been installed in template folder
                            callback();
                        });
                    } catch(err){
                        console.log("Error connection Gitlab repository: "+err);
                        console.log("Please set doGit in config/gitlab.json to false");
                        callback();
                    }
                }
                else{
                    // Direct callback as application has been installed in template folder
                    callback();
                }
            });
        });
    });
}

exports.initializeApplication = function(id_application) {
    return new Promise(function(resolve, reject) {
        // Copy authentication entities views
        var piecesPath = __dirname+'/pieces/authentication';
        var workspacePath = __dirname+'/../workspace/'+id_application;
        fs.copy(piecesPath+'/views/e_user', workspacePath+'/views/e_user', function(err) {
            if (err)
                console.log(err);

            // Copy authentication user entity route
            fs.copy(piecesPath+'/routes/e_user.js', workspacePath+'/routes/e_user.js', function(err) {
                if (err)
                    console.log(err);

                // Make user login field unique
                var userModel = require(workspacePath+'/models/attributes/e_user.json');
                userModel.f_login.unique = true;
                var writeStream = fs.createWriteStream(workspacePath+'/models/attributes/e_user.json')
                writeStream.write(JSON.stringify(userModel), null, 4);
                writeStream.end();
                writeStream.on('finish', function(){

                    // Make role label field unique
                    var roleModel = require(workspacePath+'/models/attributes/e_role.json');
                    roleModel.f_label.unique = true;
                    var writeStream = fs.createWriteStream(workspacePath+'/models/attributes/e_role.json')
                    writeStream.write(JSON.stringify(roleModel), null, 4);
                    writeStream.end();
                    writeStream.on('finish', function(){

                        // Make group label field unique
                        var groupModel = require(workspacePath+'/models/attributes/e_group.json');
                        groupModel.f_label.unique = true;
                        var writeStream = fs.createWriteStream(workspacePath+'/models/attributes/e_group.json')
                        writeStream.write(JSON.stringify(groupModel), null, 4);
                        writeStream.end();
                        writeStream.on('finish', function(){

                            // Reset toSync to avoid double alter table resulting in error
                            var toSyncFileName = workspacePath+'/models/toSync.json';
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

            });
        });
    });
}

exports.deleteApplication = function(id_application, callback) {

    // Kill spawned child process by preview
    var process_manager = require('../services/process_manager.js');
    var process_server = process_manager.process_server;
    var pathToWorkspace = __dirname+'/../workspace/'+id_application;

    if(gitlabConf.doGit){
        // Async delete repo in our gitlab in cloud env
        models.Application.findById(id_application).then(function(app){
            try{
                gitlab.projects.all(function(projects){

                    var nameAppWithoutPrefix = app.codeName.substring(2);
                    var cleanHost = globalConf.host;
                    var nameRepo = cleanHost+"-"+nameAppWithoutPrefix;

                    var idRepoToDelete = null;

                    for(var i=0; i<projects.length; i++){
                        if(nameRepo == projects[i].name){
                            idRepoToDelete = projects[i].id;
                        }
                    }

                    if(idRepoToDelete != null){
                        gitlab.projects["remove"](idRepoToDelete, function(result){
                            console.log("Delete Gitlab repository: "+ nameRepo);
                            console.log(result);
                        });
                    }
                });
            } catch(err){
                console.log("Error connection Gitlab repository: "+err);
                console.log("Please set doGit in config/gitlab.json to false");
                callback();
            }
        });
    }

    if (process_server != null) {
        process_server = process_manager.killChildProcess(process_server.pid, function(err) {
            try{
                helpers.rmdirSyncRecursive(pathToWorkspace);
                callback();
            } catch(err){
                callback(err, null);
            }
        });
    }
    else {
        try{
            helpers.rmdirSyncRecursive(pathToWorkspace);
            callback();
        } catch(err){
            callback(err, null);
        }
    }
}