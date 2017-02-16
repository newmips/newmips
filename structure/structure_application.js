var fs = require("fs-extra");
var spawn = require('cross-spawn');
var helpers = require('../utils/helpers');
var domHelper = require('../utils/jsDomHelper');
var models = require('../models/');

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

        fs.writeFile(fileFR, JSON.stringify(dataFR, null, 4), function(err) {
            if(err){
                var err = new Error();
                err.message = "An error occurred while updating fr-FR translation file.";
                return callback(err, null);
            }

            var fileEN = __dirname + '/../workspace/' + id_application + '/locales/en-EN.json';
            var dataEN = require(fileEN);
            dataEN.app.name = show_name_application;

            fs.writeFile(fileEN, JSON.stringify(dataEN, null, 4), function(err) {
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

exports.initializeApplication = function(id_application, id_user) {
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
                fs.writeFileSync(workspacePath+'/models/attributes/e_user.json', JSON.stringify(userModel, null, 4), 'utf8');

                // Make role label field unique
                var roleModel = require(workspacePath+'/models/attributes/e_role.json');
                roleModel.f_label.unique = true;
                fs.writeFileSync(workspacePath+'/models/attributes/e_role.json', JSON.stringify(roleModel, null, 4), 'utf8');

                // Make group label field unique
                var groupModel = require(workspacePath+'/models/attributes/e_group.json');
                groupModel.f_label.unique = true;
                fs.writeFileSync(workspacePath+'/models/attributes/e_group.json', JSON.stringify(groupModel, null, 4), 'utf8');

                // Reset toSync to avoid double alter table resulting in error
                var toSyncFileName = workspacePath+'/models/toSync.json';
                fs.writeFileSync(workspacePath+'/models/toSync.json', JSON.stringify({}, null, 4), 'utf8');

                // Manualy add settings to access file because it's not a real entity
                var access = require(workspacePath+'/config/access.json');
                access.authentication.entities.push({
                    name: 'access_settings',
                    groups: [],
                    actions: {read: [], write: [], delete: []}
                });
                fs.writeFileSync(workspacePath+'/config/access.json', JSON.stringify(access, null, 4), 'utf8');

                domHelper.read(workspacePath+'/views/layout_m_authentication.dust').then(function($) {
                    var li = '';
                    li += '{@entityAccess entity="access_settings"}\n';
                    li += '     {@actionAccess entity="access_settings" action="read"}\n';
                    li += '         <li>\n';
                    li += '             <a href="/access_settings/show">\n';
                    li += '                 <i class="fa fa-cog"></i>\n';
                    li += '                 <span>{@__ key="settings.title" /}</span>\n';
                    li += '                 <i class="fa fa-angle-right pull-right"></i>\n';
                    li += '             </a>\n';
                    li += '         </li>\n';
                    li += '     {/actionAccess}\n';
                    li += '{/entityAccess}\n';

                    $("#sortable").append(li);

                    // Add settings entry into authentication module layout
                    domHelper.write(workspacePath+'/views/layout_m_authentication.dust', $).then(function() {

                        // Copy routes settings pieces
                        fs.copy(piecesPath+'/routes/e_access_settings.js', workspacePath+'/routes/e_access_settings.js', function(err) {
                            if (err)
                                console.log(err);

                            // Copy view settings pieces
                            fs.copy(piecesPath+'/views/e_access_settings/show.dust', workspacePath+'/views/e_access_settings/show.dust', function(err) {
                                if (err)
                                    console.log(err);

                                models.User.findOne({where: {id: id_user}}).then(function(user) {
                                    // Sync workspace's database and insert admin user
                                    var workspaceSequelize = require(__dirname+ '/../workspace/'+id_application+'/models/');
                                    workspaceSequelize.sequelize.sync({ logging: console.log, hooks: false }).then(function(){
                                        workspaceSequelize.E_group.create({f_label: 'admin'}).then(function(){
                                            workspaceSequelize.E_role.create({f_label: 'admin'}).then(function(){
                                                workspaceSequelize.E_user.create({
                                                    f_login: 'adminWorkspace',
                                                    f_password: user.password || '$2a$10$TclfBauyT/N0CDjCjKOG/.YSHiO0RLqWO2dOMfNKTNH3D5EaDIpr.',
                                                    f_id_role: 1,
                                                    f_id_group: 1,
                                                    f_enabled: 1
                                                }).then(function() {
                                                    resolve();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    })
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