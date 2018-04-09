var fs = require("fs-extra");
var spawn = require('cross-spawn');
var helpers = require('../utils/helpers');
var domHelper = require('../utils/jsDomHelper');
var translateHelper = require("../utils/translate");

// Global conf
var globalConf = require('../config/global.js');
var gitlabConf = require('../config/gitlab.js');

var dns_manager;
if (globalConf.env == 'cloud' || globalConf.env == 'cloud_recette')
    dns_manager = require('../services/dns_manager');

try {
    if (gitlabConf.doGit) {
        // Gitlab connection
        var gitlab = require('gitlab')({
            url: gitlabConf.protocol + "://" + gitlabConf.url,
            token: gitlabConf.privateToken
        });
    }
} catch (err) {
    console.log("Error connection Gitlab repository: " + err);
    console.log("Please set doGit in config/gitlab.js to false");
}

//Sequelize
var models = require('../models/');

var exec = require('child_process').exec;

function installAppModules() {
    return new Promise(function(resolve, reject) {
        var dir = __dirname;

        // Mandatory workspace folder
        if (!fs.existsSync(dir + '/../workspace'))
            fs.mkdirSync(dir + '/../workspace');

        if (fs.existsSync(dir + '/../workspace/node_modules')) {
            console.log("Everything's ok about workspaces node modules.");
            resolve();
        } else {
            if (fs.existsSync(dir + '/../structure/template/node_modules')) {
                // Node modules are already in structure/template, need to move them to workspace
                console.log("Moving workspaces node modules...");

                exec("mv structure/template/node_modules workspace/", {
                    cwd: dir + '/../'
                }, function(error, stdout, stderr) {
                    if (error) {
                        reject(error);
                    }
                    console.log('Workspaces node modules successfully initialized.');
                    resolve();
                });

            } else {
                // We need to reinstall node modules properly
                console.log("Workspaces node modules initialization...");
                var cmd = 'cp ' + dir + '/../structure/template/package.json ' + dir + '/../workspace/';

                exec(cmd, {
                    cwd: process.cwd()
                }, function(error, stdout, stderr) {
                    if (error) {
                        reject(error);
                    }

                    cmd = 'npm -s install';
                    exec(cmd, {
                        cwd: dir + '/../workspace/'
                    }, function(error, stdout, stderr) {
                        if (error) {
                            reject(error);
                        }
                        console.log('Workspaces node modules successfuly initialized.');
                        resolve();
                    });
                });
            }
        }
    });
};
exports.installAppModules = installAppModules;

// Application
exports.setupApplication = function(attr, callback) {

    var id_application = attr.id_application;

    // Check each options variable to set properties
    var options = attr.options;
    var name_application = options.value;
    var show_name_application = options.showValue;

    installAppModules().then(function() {
        // *** Copy template folder to new workspace ***
        fs.copy(__dirname + '/template/', __dirname + '/../workspace/' + id_application, function(err) {
            if (err) {
                var err = new Error();
                err.message = "An error occurred while copying template folder.";
                return callback(err, null);
            }

            /* --------------- New translation --------------- */
            translateHelper.writeLocales(id_application, "application", null, show_name_application, attr.googleTranslate, function() {
                // Write the config/language.json file in the workspace with the language in the generator session -> lang_user
                var languageConfig = require(__dirname + '/../workspace/' + id_application + '/config/language');
                languageConfig.lang = attr.lang_user;
                fs.writeFile(__dirname + '/../workspace/' + id_application + '/config/language.json', JSON.stringify(languageConfig, null, 4), function(err) {

                    if (err) {
                        var err = new Error();
                        err.message = "An error occurred while creating language.json.";
                        return callback(err, null);
                    }

                    var nameAppWithoutPrefix = name_application.substring(2);
                    // Create the application repository in gitlab
                    if (gitlabConf.doGit) {

                        var idUserGitlab;

                        function createGitlabProject() {
                            var newGitlabProject = {
                                user_id: idUserGitlab,
                                name: globalConf.host + "-" + nameAppWithoutPrefix,
                                description: "A generated Newmips workspace.",
                                issues_enabled: false,
                                merge_requests_enabled: false,
                                wiki_enabled: false,
                                snippets_enabled: false,
                                public: false
                            };

                            try {
                                gitlab.projects.create_for_user(newGitlabProject, function(result) {
                                    if (typeof result === "object") {
                                        gitlab.projects.members.add(result.id, 1, 40, function(answer) {
                                            callback();
                                        });
                                    } else {
                                        callback();
                                    }
                                });
                            } catch (err) {
                                console.log("Error connection Gitlab repository: " + err);
                                console.log("Please set doGit in config/gitlab.js to false");
                                callback(err);
                            }
                        }

                        if (attr.gitlabUser != null) {
                            idUserGitlab = attr.gitlabUser.id;
                            createGitlabProject();
                        } else {
                            gitlab.users.all(function(gitlabUsers) {
                                var exist = false;
                                for (var i = 0; i < gitlabUsers.length; i++) {
                                    if (gitlabUsers[i].email == attr.currentUser.email) {
                                        exist = true;
                                        idUserGitlab = gitlabUsers[i].id;
                                    }
                                }
                                if (exist)
                                    createGitlabProject();
                                else {
                                    var err = new Error();
                                    err.message = "Cannot find your Gitlab account to create the project!";
                                    return callback(err, null);
                                }
                            });
                        }
                    } else {
                        // Direct callback as application has been installed in template folder
                        callback();
                    }
                });
            });
        });
    }).catch(function(err) {
        console.log(err);
        var err = new Error();
        err.message = "An error occurred while initializing the node modules.";
        return callback(err, null);
    });
}

function finalizeApplication(id_application, name_application) {
    return new Promise(function(resolve, reject) {
        var piecesPath = __dirname + '/pieces';
        var workspacePath = __dirname + '/../workspace/' + id_application;

        // Reset toSync file
        fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify({}, null, 4), 'utf8');

        var workspaceSequelize = require(__dirname + '/../workspace/' + id_application + '/models/');
        workspaceSequelize.sequelize.sync({
            logging: false,
            hooks: false
        }).then(function() {
            // Create application's DNS through dns_manager
            if (globalConf.env == 'cloud' || globalConf.env == 'cloud_recette')
                dns_manager.createApplicationDns(globalConf.host, name_application, id_application).then(function() {
                    resolve();
                });
            else
                resolve();
        });
    });
}

function initializeWorkflow(id_application, name_application) {
    return new Promise(function(resolve, reject) {
        var piecesPath = __dirname + '/pieces/component/status';
        var workspacePath = __dirname + '/../workspace/' + id_application;

        // Remove existing has many from Status, the instruction is only used to generate the tab and views
        var statusModel = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_status.json'));
        for (var i = 0; i < statusModel.length; i++)
            if (statusModel[i].target == 'e_status') {
                statusModel.splice(i, 1);
                break;
            }

        // Create Status belongsToMany with itself as target
        statusModel.push({
            relation: 'belongsToMany',
            target: 'e_status',
            through: id_application + '_status_children',
            foreignKey: 'fk_id_parent_status',
            otherKey: 'fk_id_child_status',
            as: 'r_children'
        });
        fs.writeFileSync(workspacePath + '/models/options/e_status.json', JSON.stringify(statusModel, null, 4), 'utf8');

        // Copy e_status pieces
        fs.copySync(piecesPath + '/views/e_status/', workspacePath + '/views/e_status/');
        var modelStatus = fs.readFileSync(piecesPath + '/models/e_status.js', 'utf8');
        modelStatus = modelStatus.replace(/ID_APPLICATION/g, id_application);
        fs.writeFileSync(workspacePath + '/models/e_status.js', modelStatus, 'utf8');

        // Copy views pieces
        // media
        fs.copySync(piecesPath + '/views/e_media/', workspacePath + '/views/e_media/');
        // media mail
        fs.copySync(piecesPath + '/views/e_media_mail/', workspacePath + '/views/e_media_mail/');
        // media notification
        fs.copySync(piecesPath + '/views/e_media_notification/', workspacePath + '/views/e_media_notification/');
        // translation
        fs.copySync(piecesPath + '/views/e_translation/', workspacePath + '/views/e_translation/');
        // action
        fs.copySync(piecesPath + '/views/e_action/', workspacePath + '/views/e_action/');

        // Copy routes
        fs.copySync(piecesPath + '/routes/', workspacePath + '/routes/');

        // Remove notification from administration sidebar
        domHelper.read(workspacePath + '/views/layout_m_administration.dust').then(function($) {
            $("#notification_menu_item").remove();
            domHelper.write(workspacePath + '/views/layout_m_administration.dust', $).then(function() {
                // Media pieces
                var modelMedia = fs.readFileSync(piecesPath + '/models/e_media.js', 'utf8');
                modelMedia = modelMedia.replace(/ID_APPLICATION/g, id_application);
                fs.writeFileSync(workspacePath + '/models/e_media.js', modelMedia, 'utf8');
                // Media mail
                modelMedia = fs.readFileSync(piecesPath + '/models/e_media_mail.js', 'utf8');
                modelMedia = modelMedia.replace(/ID_APPLICATION/g, id_application);
                fs.writeFileSync(workspacePath + '/models/e_media_mail.js', modelMedia, 'utf8');
                // Media notification
                modelMedia = fs.readFileSync(piecesPath + '/models/e_media_notification.js', 'utf8');
                modelMedia = modelMedia.replace(/ID_APPLICATION/g, id_application);
                fs.writeFileSync(workspacePath + '/models/e_media_notification.js', modelMedia, 'utf8');

                // Write new locales trees
                var newLocalesEN = JSON.parse(fs.readFileSync(piecesPath + '/locales/global_locales_EN.json'));
                translateHelper.writeTree(id_application, newLocalesEN, 'en-EN');
                var newLocalesFR = JSON.parse(fs.readFileSync(piecesPath + '/locales/global_locales_FR.json'));
                translateHelper.writeTree(id_application, newLocalesFR, 'fr-FR');
                finalizeApplication(id_application, name_application).then(resolve).catch(reject);
            });
        });
    });
}

exports.initializeApplication = function(id_application, id_user, name_application) {
    return new Promise(function(resolve, reject) {
        var piecesPath = __dirname + '/pieces';
        var workspacePath = __dirname + '/../workspace/' + id_application;

        fs.copy(piecesPath + '/administration/views/e_user/settings.dust', workspacePath + '/views/e_user/settings.dust', function(err) {
            if (err)
                console.log(err);

            // Clean user list fields
            domHelper.read(workspacePath + '/views/e_user/list_fields.dust').then(function($) {
                $("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();

                domHelper.write(workspacePath + '/views/e_user/list_fields.dust', $).then(function() {
                    // Clean user show fields
                    domHelper.read(workspacePath + '/views/e_user/show_fields.dust').then(function($) {
                        $("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();
                        $("#r_notification-click").parents('li').remove();
                        $("#r_notification").remove();

                        domHelper.write(workspacePath + '/views/e_user/show_fields.dust', $).then(function() {
                            // Clean user create fields
                            domHelper.read(workspacePath + '/views/e_user/create_fields.dust').then(function($) {
                                $("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();

                                domHelper.write(workspacePath + '/views/e_user/create_fields.dust', $).then(function() {
                                    // Clean user update fields
                                    domHelper.read(workspacePath + '/views/e_user/update_fields.dust').then(function($) {
                                        $("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();
                                        domHelper.write(workspacePath + '/views/e_user/update_fields.dust', $).then(function() {
                                            // Copy inline-help route and views
                                            fs.copySync(piecesPath + '/routes/e_inline_help.js', workspacePath + '/routes/e_inline_help.js');
                                            fs.copySync(piecesPath + '/views/e_inline_help/', workspacePath + '/views/e_inline_help/');

                                            // Copy api entities views
                                            fs.copy(piecesPath + '/api/views/e_api_credentials', workspacePath + '/views/e_api_credentials', function(err) {
                                                if (err)
                                                    console.log(err);
                                                // Copy js file for access settings
                                                fs.copy(piecesPath + '/administration/js/', workspacePath + '/public/js/Newmips/', function(err) {
                                                    if (err)
                                                        console.log(err);
                                                    // Copy authentication user entity route
                                                    fs.copy(piecesPath + '/administration/routes/e_user.js', workspacePath + '/routes/e_user.js', function(err) {
                                                        if (err)
                                                            console.log(err);

                                                        // Make fields unique
                                                        function uniqueField(entity, field) {
                                                            var model = JSON.parse(fs.readFileSync(workspacePath + '/models/attributes/' + entity + '.json', 'utf8'));
                                                            model[field].unique = true;
                                                            fs.writeFileSync(workspacePath + '/models/attributes/' + entity + '.json', JSON.stringify(model, null, 4), 'utf8');
                                                        }
                                                        uniqueField('e_user', 'f_login');
                                                        uniqueField('e_role', 'f_label');
                                                        uniqueField('e_group', 'f_label');

                                                        // Manualy add settings to access file because it's not a real entity
                                                        var access = require(workspacePath + '/config/access.json');
                                                        access.administration.entities.push({
                                                            name: 'access_settings',
                                                            groups: [],
                                                            actions: {
                                                                read: [],
                                                                create: [],
                                                                update: [],
                                                                delete: []
                                                            }
                                                        });
                                                        fs.writeFileSync(workspacePath + '/config/access.json', JSON.stringify(access, null, 4), 'utf8');

                                                        domHelper.read(workspacePath + '/views/layout_m_administration.dust').then(function($) {
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
                                                            domHelper.write(workspacePath + '/views/layout_m_administration.dust', $).then(function() {

                                                                // Copy routes settings pieces
                                                                fs.copy(piecesPath + '/administration/routes/e_access_settings.js', workspacePath + '/routes/e_access_settings.js', function(err) {
                                                                    if (err)
                                                                        console.log(err);

                                                                    // Copy view settings pieces
                                                                    fs.copy(piecesPath + '/administration/views/e_access_settings/show.dust', workspacePath + '/views/e_access_settings/show.dust', function(err) {
                                                                        if (err)
                                                                            console.log(err);

                                                                        // Copy route e_api_credentials piece
                                                                        fs.copy(piecesPath + '/api/routes/e_api_credentials.js', workspacePath + '/routes/e_api_credentials.js', function(err) {
                                                                            if (err)
                                                                                console.log(err);

                                                                            // Copy api e_user piece
                                                                            fs.copy(piecesPath + '/api/routes/e_user.js', workspacePath + '/api/e_user.js', function(err) {
                                                                                if (err)
                                                                                    console.log(err);

                                                                                // API credentials must not be available to API calls, delete the file
                                                                                fs.unlink(workspacePath + '/api/e_api_credentials.js', function() {
                                                                                    // Set french translation about API credentials
                                                                                    translateHelper.updateLocales(id_application, "fr-FR", ["entity", "e_api_credentials", "label_entity"], "Identifiant d'API");
                                                                                    translateHelper.updateLocales(id_application, "fr-FR", ["entity", "e_api_credentials", "name_entity"], "Identifiant d'API");
                                                                                    translateHelper.updateLocales(id_application, "fr-FR", ["entity", "e_api_credentials", "plural_entity"], "Identifiant d'API");

                                                                                    initializeWorkflow(id_application, name_application).then(resolve).catch(reject);
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        }).catch(reject);
                                    }).catch(reject);
                                }).catch(reject);
                            }).catch(reject);
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        });
    });
}

exports.deleteApplication = function(id_application, callback) {
    // Kill spawned child process by preview
    var process_manager = require('../services/process_manager.js');
    var process_server = process_manager.process_server;
    var pathToWorkspace = __dirname + '/../workspace/' + id_application;

    if (gitlabConf.doGit) {
        // Async delete repo in our gitlab in cloud env
        models.Application.findById(id_application).then(function(app) {
            try {
                gitlab.projects.all(function(projects) {

                    var nameAppWithoutPrefix = app.codeName.substring(2);
                    var cleanHost = globalConf.host;
                    var nameRepo = cleanHost + "-" + nameAppWithoutPrefix;

                    var idRepoToDelete = null;

                    for (var i = 0; i < projects.length; i++) {
                        if (nameRepo == projects[i].name) {
                            idRepoToDelete = projects[i].id;
                        }
                    }

                    if (idRepoToDelete != null) {
                        gitlab.projects["remove"](idRepoToDelete, function(result) {
                            console.log("Delete Gitlab repository: " + nameRepo);
                            console.log("Result:", result);
                        });
                    }
                });
            } catch (err) {
                console.log("Error connection Gitlab repository: " + err);
                console.log("Please set doGit in config/gitlab.js to false");
                callback();
            }
        });
    }

    if (process_server != null) {
        process_server = process_manager.killChildProcess(process_server.pid, function(err) {
            try {
                helpers.rmdirSyncRecursive(pathToWorkspace);
                callback();
            } catch (err) {
                callback(err, null);
            }
        });
    } else {
        try {
            helpers.rmdirSyncRecursive(pathToWorkspace);
            callback();
        } catch (err) {
            callback(err, null);
        }
    }
}