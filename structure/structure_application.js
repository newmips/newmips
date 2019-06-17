const fs = require("fs-extra");
const spawn = require('cross-spawn');
const helpers = require('../utils/helpers');
const domHelper = require('../utils/jsDomHelper');
const translateHelper = require("../utils/translate");
const path = require("path");
const mysql = require('promise-mysql');

// Gitlab
const globalConf = require('../config/global.js');
const gitlabConf = require('../config/gitlab.js');
const gitlab = require('../services/gitlab_api');

const dbConf = require('../config/database.js');
const studio_manager = require('../services/studio_manager');
const models = require('../models/');
const exec = require('child_process').exec;

function installAppModules(attr) {
    return new Promise(function(resolve, reject) {
        var dir = __dirname;

        // Mandatory workspace folder
        if (!fs.existsSync(dir + '/../workspace'))
            fs.mkdirSync(dir + '/../workspace');

        if (fs.existsSync(dir + '/../workspace/node_modules')) {
            console.log("Everything's ok about global workspaces node modules.");

            if(typeof attr !== "undefined"){
                /* When we are in the "npm install" instruction from preview */
                let command = "npm install";
                console.log(attr.specificModule)
                if(attr.specificModule)
                    command += " "+attr.specificModule;

                console.log("Executing "+command+" in application: "+attr.id_application+"...");

                exec(command, {
                    cwd: dir + '/../workspace/'+attr.id_application+'/'
                }, function(error, stdout, stderr) {
                    if (error) {
                        reject(error);
                    }
                    console.log('Application '+attr.id_application+' node modules successfully installed !');
                    resolve();
                });
            } else {
                resolve();
            }
        } else {
            // We need to reinstall node modules properly
            console.log("Workspaces node modules initialization...");
            fs.copySync(path.join(dir, 'template', 'package.json'), path.join(dir, '..', 'workspace', 'package.json'))

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
        }
    });
};
exports.installAppModules = installAppModules;

// Application
exports.setupApplication = function(attr, callback) {

    var appID = attr.id_application;

    // Check each options variable to set properties
    var options = attr.options;
    var name_application = options.value;
    var show_name_application = options.showValue;
    var repoFile = options.repoFile;

    installAppModules().then(function() {
        // *** Copy template folder to new workspace ***
        fs.copy(__dirname + '/template/', __dirname + '/../workspace/' + appID, function(err) {
            if (err) {
                var err = new Error();
                err.message = "An error occurred while copying template folder.";
                return callback(err, null);
            }

            /* --------------- New translation --------------- */
            translateHelper.writeLocales(appID, "application", null, show_name_application, attr.googleTranslate, function() {

                async function workspace_db(){
                    if(!globalConf.separate_workspace_db)
                        return;

                    // Create database instance for application
                    let db_requests = [
                        "CREATE DATABASE IF NOT EXISTS workspace_" + appID + " DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;",
                        "CREATE USER IF NOT EXISTS 'workspace_" + appID + "'@'127.0.0.1' IDENTIFIED BY 'workspace_" + appID + "';",
                        "CREATE USER IF NOT EXISTS 'workspace_" + appID + "'@'%' IDENTIFIED BY 'workspace_" + appID + "';",
                        "GRANT ALL PRIVILEGES ON workspace_" + appID + ".* TO 'workspace_" + appID + "'@'127.0.0.1';",
                        "GRANT ALL PRIVILEGES ON workspace_" + appID + ".* TO 'workspace_" + appID + "'@'%';"
                    ];

                    let conn = await mysql.createConnection({
                        host: globalConf.env == "cloud" ? process.env.DATABASE_IP : dbConf.host,
                        user: globalConf.env == "cloud" ? "root" : dbConf.user,
                        password: globalConf.env == "cloud" ? "P@ssw0rd+" : dbConf.password
                    });

                    for (var i = 0; i < db_requests.length; i++) {
                        await conn.query(db_requests[i]);
                    }

                    conn.end();
                }

                workspace_db().then(_ => {
                    if(globalConf.separate_workspace_db){
                        try {
                            // Change config file to point on database instance
                            var appDatabaseConfig = fs.readFileSync(__dirname + '/../workspace/' + appID + '/config/database.js', 'utf8');
                            appDatabaseConfig = appDatabaseConfig.replace(/newmips/g, 'workspace_' + appID, 'utf8');
                            fs.writeFileSync(__dirname + '/../workspace/' + appID + '/config/database.js', appDatabaseConfig);
                        } catch (err) {
                            console.log(err);
                            return callback(err, null);
                        }
                    }

                    let nameAppWithoutPrefix = name_application.substring(2);

                    // Create the application repository on gitlab
                    if (!gitlabConf.doGit)
                        return callback();

                    (async () => {

                        if (!attr.gitlabUser)
                            attr.gitlabUser = await gitlab.getUser(attr.currentUser.email);

                        let idUserGitlab = attr.gitlabUser.id;

                        let newGitlabProject = {
                            user_id: idUserGitlab,
                            name: globalConf.host + "-" + nameAppWithoutPrefix,
                            description: "A generated Newmips workspace.",
                            issues_enabled: false,
                            merge_requests_enabled: false,
                            wiki_enabled: false,
                            snippets_enabled: false,
                            public: false
                        };

                        let newRepo = await gitlab.createProjectForUser(newGitlabProject);
                        await gitlab.addMemberToProject({
                            id: newRepo.id,
                            user_id: 1, // Admin
                            access_level: 40
                        })

                        return;

                    })().then(_ => {
                        callback();
                    }).catch(err => {
                        console.error(err);
                    })
                }).catch(err => {
                    console.error(err);
                    var err = new Error();
                    err.message = "An error occurred while initializing the workspace database. Does the mysql user have the privileges to create a database ?";
                    return callback(err);
                })
            })
        })
    }).catch(function(err) {
        console.error(err);
        var err = new Error();
        err.message = "An error occurred while initializing the node modules.";
        return callback(err);
    })
}

function finalizeApplication(id_application, name_application) {
    return new Promise((resolve, reject) => {
        var piecesPath = __dirname + '/pieces';
        var workspacePath = __dirname + '/../workspace/' + id_application;

        // Reset toSync file
        fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify({}, null, 4), 'utf8');

        var workspaceSequelize = require(__dirname + '/../workspace/' + id_application + '/models/');
        workspaceSequelize.sequelize.sync({
            logging: false,
            hooks: false
        }).then(function() {
            // Create application's DNS through studio_manager
            if (globalConf.env == 'cloud') {
                studio_manager.createApplicationDns(name_application, id_application).then(_ => {
                    resolve();
                }).catch(err => {
                    console.error(err);
                    reject(err);
                })
            } else {
                resolve();
            }
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
        // media sms
        fs.copySync(piecesPath + '/views/e_media_sms/', workspacePath + '/views/e_media_sms/');
        // media taskk
        fs.copySync(piecesPath + '/views/e_media_task/', workspacePath + '/views/e_media_task/');
        // translation
        fs.copySync(piecesPath + '/views/e_translation/', workspacePath + '/views/e_translation/');
        // action
        fs.copySync(piecesPath + '/views/e_action/', workspacePath + '/views/e_action/');

        // Copy routes
        fs.copySync(piecesPath + '/routes/', workspacePath + '/routes/');
        // Copy API routes
        fs.copySync(piecesPath + '/api/', workspacePath + '/api/');

        // Remove notification from administration sidebar
        domHelper.read(workspacePath + '/views/layout_m_administration.dust').then(function($) {
            $("#notification_menu_item").remove();
            var diagramMenuLink = '{#actionAccess entity="status" action="read"}\n';
            diagramMenuLink += '<li>\n';
            diagramMenuLink += '    <a href="/status/diagram">\n';
            diagramMenuLink += '        <i class="fa fa-sitemap"></i>\n';
            diagramMenuLink += '        {@__ key="component.status.diagram" /}\n';
            diagramMenuLink += '    </a>\n';
            diagramMenuLink += '</li>\n';
            diagramMenuLink += '{/actionAccess}\n';
            $("#status_menu_item ul").append(diagramMenuLink);
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
                // Media sms
                modelMedia = fs.readFileSync(piecesPath + '/models/e_media_sms.js', 'utf8');
                modelMedia = modelMedia.replace(/ID_APPLICATION/g, id_application);
                fs.writeFileSync(workspacePath + '/models/e_media_sms.js', modelMedia, 'utf8');
                // Media task
                modelMedia = fs.readFileSync(piecesPath + '/models/e_media_task.js', 'utf8');
                modelMedia = modelMedia.replace(/ID_APPLICATION/g, id_application);
                fs.writeFileSync(workspacePath + '/models/e_media_task.js', modelMedia, 'utf8');
                // Task
                modelMedia = fs.readFileSync(piecesPath + '/models/e_task.js', 'utf8');
                modelMedia = modelMedia.replace(/ID_APPLICATION/g, id_application);
                fs.writeFileSync(workspacePath + '/models/e_task.js.js', modelMedia, 'utf8');
                // Write new locales trees
                var newLocalesEN = JSON.parse(fs.readFileSync(piecesPath + '/locales/global_locales_EN.json'));
                translateHelper.writeTree(id_application, newLocalesEN, 'en-EN');
                var newLocalesFR = JSON.parse(fs.readFileSync(piecesPath + '/locales/global_locales_FR.json'));
                translateHelper.writeTree(id_application, newLocalesFR, 'fr-FR');

                // Write enum traductions
                console.log("Translate enum :");
                console.log(translateHelper.writeEnumTrad(id_application, 'e_media', 'f_type', 'task', 'Tâche', 'fr-FR'));

                finalizeApplication(id_application, name_application).then(resolve).catch(reject);
            });
        });
    });
}

exports.initializeApplication = function(id_application, id_user, name_application) {
    return new Promise(function(resolve, reject) {
        var piecesPath = __dirname + '/pieces';
        var workspacePath = __dirname + '/../workspace/' + id_application;

        fs.copy(piecesPath + '/administration/views/e_user/', workspacePath + '/views/e_user/', function(err) {
            if (err)
                console.error(err);

            // Clean user list fields
            domHelper.read(workspacePath + '/views/e_user/list_fields.dust').then(function($) {
                $("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();

                domHelper.write(workspacePath + '/views/e_user/list_fields.dust', $).then(function() {
                    // Clean user show fields and remove tab view
                    domHelper.read(workspacePath + '/views/e_user/show_fields.dust').then(function($) {
                        $("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();
                        let homeHtml = $("#home").html();
                        $("#home").remove();
                        $("#tabs").removeClass('.nav-tabs-custom').attr('id', 'home');
                        $("#home").html(homeHtml);
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
                                            fs.copySync(piecesPath + '/api/views/e_api_credentials', workspacePath + '/views/e_api_credentials');
                                            // Copy js file for access settings
                                            fs.copySync(piecesPath + '/administration/js/', workspacePath + '/public/js/Newmips/');
                                            // Copy authentication user entity route
                                            fs.copySync(piecesPath + '/administration/routes/e_user.js', workspacePath + '/routes/e_user.js');

                                            // Make fields unique
                                            function uniqueField(entity, field) {
                                                var model = JSON.parse(fs.readFileSync(workspacePath + '/models/attributes/' + entity + '.json', 'utf8'));
                                                model[field].unique = true;
                                                fs.writeFileSync(workspacePath + '/models/attributes/' + entity + '.json', JSON.stringify(model, null, 4), 'utf8');
                                            }
                                            uniqueField('e_user', 'f_login');
                                            uniqueField('e_role', 'f_label');
                                            uniqueField('e_group', 'f_label');

                                            // Manualy add custom menus to access file because it's not a real entity
                                            var access = JSON.parse(fs.readFileSync(workspacePath + '/config/access.json', 'utf8'));
                                            let arrayKey = [
                                                "access_settings",
                                                "db_tool",
                                                "import_export",
                                                "access_tool",
                                                "access_settings_role",
                                                "access_settings_group",
                                                "access_settings_api"
                                            ];
                                            for (var i = 0; i < arrayKey.length; i++) {
                                                access.administration.entities.push({
                                                    name: arrayKey[i],
                                                    groups: [],
                                                    actions: {
                                                        read: [],
                                                        create: [],
                                                        update: [],
                                                        delete: []
                                                    }
                                                });
                                            }
                                            fs.writeFileSync(workspacePath + '/config/access.json', JSON.stringify(access, null, 4), 'utf8');

                                            // Set role-group/user structureType to hasManyPreset to be used by ajax
                                            var opts = JSON.parse(fs.readFileSync(workspacePath+'/models/options/e_role.json', 'utf8'));
                                            opts[0].structureType = "hasManyPreset";
                                            opts[0].usingField = [{value: 'f_login', type: 'string'}];
                                            fs.writeFileSync(workspacePath+'/models/options/e_role.json', JSON.stringify(opts, null, 4), 'utf8');
                                            var opts = JSON.parse(fs.readFileSync(workspacePath+'/models/options/e_group.json', 'utf8'));
                                            opts[0].structureType = "hasManyPreset";
                                            opts[0].usingField = [{value: 'f_login', type: 'string'}];
                                            fs.writeFileSync(workspacePath+'/models/options/e_group.json', JSON.stringify(opts, null, 4), 'utf8');

                                            domHelper.read(workspacePath + '/views/layout_m_administration.dust').then(function($) {
                                                var li = '';

                                                // Delete generated synchro in sidebar
                                                $("#synchronization_menu_item").remove();
                                                $("#synchro_credentials_menu_item").remove();
                                                // Put back Synchro in sidebar
                                                li += '{#entityAccess entity="synchro"}\n';
                                                li += '     <li id="synchro_menu_item" style="display:block;" class="treeview">\n';
                                                li += '         <a href="#">\n';
                                                li += '             <i class="fa fa-refresh"></i>\n';
                                                li += '             <span>{#__ key="synchro.title" /}</span>\n';
                                                li += '             <i class="fa fa-angle-left pull-right"></i>\n';
                                                li += '         </a>\n';
                                                li += '         <ul class="treeview-menu">\n';
                                                li += '             {@ne key=config.env value="tablet"}\n';
                                                li += '                 <li>\n';
                                                li += '                     <a href="/synchronization/show">\n';
                                                li += '                         <i class="fa fa-angle-double-right"></i>\n';
                                                li += '                         {#__ key="synchro.configure" /}\n';
                                                li += '                     </a>\n';
                                                li += '                 </li>\n';
                                                li += '                 <li>\n';
                                                li += '                     <a href="/synchronization/list_dump">\n';
                                                li += '                         <i class="fa fa-angle-double-right"></i>\n';
                                                li += '                         {#__ key="synchro.list" /}\n';
                                                li += '                     </a>\n';
                                                li += '                 </li>\n';
                                                li += '             {/ne}\n';
                                                li += '             {@eq key=config.env value="tablet"}\n';
                                                li += '                 <li>\n';
                                                li += '                     <a href="/synchronization/show">\n';
                                                li += '                         <i class="fa fa-angle-double-right"></i>\n';
                                                li += '                         {#__ key="synchro.process.synchronize" /}\n';
                                                li += '                     </a>\n';
                                                li += '                 </li>\n';
                                                li += '             {/eq}\n';
                                                li += '         </ul>\n';
                                                li += '     </li>\n';
                                                li += '{/entityAccess}\n';

                                                li += '{@eq key=config.env value="tablet"}\n';
                                                li += '     {#entityAccess entity="synchro_credentials"}\n';
                                                li += '     <li id="synchro_credentials_menu_item" style="display:block;" class="treeview">\n';
                                                li += '         <a href="#">\n';
                                                li += '             <i class="fa fa-unlink"></i>\n';
                                                li += '             <span>{#__ key="entity.e_synchro_credentials.label_entity" /}</span>\n';
                                                li += '             <i class="fa fa-angle-left pull-right"></i>\n';
                                                li += '         </a>\n';
                                                li += '         <ul class="treeview-menu">\n';
                                                li += '             {#actionAccess entity="synchro_credentials" action="create"}\n';
                                                li += '                 <li>\n';
                                                li += '                     <a href="/synchro_credentials/create_form">\n';
                                                li += '                         <i class="fa fa-angle-double-right"></i>\n';
                                                li += '                         {#__ key="operation.create" /}\n';
                                                li += '                     </a>\n';
                                                li += '                 </li>\n';
                                                li += '             {/actionAccess}\n';
                                                li += '             {#actionAccess entity="synchro_credentials" action="read"}\n';
                                                li += '                 <li>\n';
                                                li += '                     <a href="/synchro_credentials/list">\n';
                                                li += '                         <i class="fa fa-angle-double-right"></i>\n';
                                                li += '                         {#__ key="operation.list" /}\n';
                                                li += '                     </a>\n';
                                                li += '                 </li>\n';
                                                li += '             {/actionAccess}\n';
                                                li += '         </ul>\n';
                                                li += '     </li>\n';
                                                li += '     {/entityAccess}\n';
                                                li += '{/eq}\n';

                                                li += '{#entityAccess entity="import_export"}\n';
                                                li += '     <li id="import_export_menu_item" class="treeview">\n';
                                                li += '         <a href="#">\n';
                                                li += '             <i class="fa fa-arrows-v"></i>\n';
                                                li += '             <span>{#__ key="settings.import_export.title" /}</span>\n';
                                                li += '             <i class="fa fa-angle-left pull-right"></i>\n';
                                                li += '         </a>\n';
                                                li += '         <ul class="treeview-menu">\n';
                                                li += '             {#actionAccess entity="db_tool" action="read"}\n';
                                                li += '             <li>\n';
                                                li += '                 <a href="/import_export/db_show">\n';
                                                li += '                     <i class="fa fa-angle-double-right"></i>\n';
                                                li += '                     {#__ key="settings.db_tool.title" /}\n';
                                                li += '                 </a>\n';
                                                li += '             </li>\n';
                                                li += '             {/actionAccess}\n';
                                                li += '             {#actionAccess entity="access_tool" action="read"}\n';
                                                li += '             <li>\n';
                                                li += '                 <a href="/import_export/access_show">\n';
                                                li += '                     <i class="fa fa-angle-double-right"></i>\n';
                                                li += '                     {#__ key="settings.tool_menu" /}\n';
                                                li += '                 </a>\n';
                                                li += '             </li>\n';
                                                li += '             {/actionAccess}\n';
                                                li += '         </ul>\n';
                                                li += '     </li>\n';
                                                li += '{/entityAccess}\n';

                                                li += '{#entityAccess entity="access_settings"}\n';
                                                li += '     <li id="access_settings_menu_item" class="treeview">\n';
                                                li += '         <a href="#">\n';
                                                li += '             <i class="fa fa-cog"></i>\n';
                                                li += '             <span>{#__ key="settings.title" /}</span>\n';
                                                li += '             <i class="fa fa-angle-left pull-right"></i>\n';
                                                li += '         </a>\n';
                                                li += '         <ul class="treeview-menu">\n';
                                                li += '             {#actionAccess entity="access_settings_role" action="read"}\n';
                                                li += '             <li>\n';
                                                li += '                 <a href="/access_settings/show_role">\n';
                                                li += '                     <i class="fa fa-angle-double-right"></i>\n';
                                                li += '                     {#__ key="entity.e_role.label_entity" /}\n';
                                                li += '                 </a>\n';
                                                li += '             </li>\n';
                                                li += '             {/actionAccess}\n';
                                                li += '             {#actionAccess entity="access_settings_group" action="read"}\n';
                                                li += '             <li>\n';
                                                li += '                 <a href="/access_settings/show_group">\n';
                                                li += '                     <i class="fa fa-angle-double-right"></i>\n';
                                                li += '                     {#__ key="entity.e_group.label_entity" /}\n';
                                                li += '                 </a>\n';
                                                li += '             </li>\n';
                                                li += '             {/actionAccess}\n';
                                                li += '             {#actionAccess entity="access_settings_api" action="read"}\n';
                                                li += '             <li>\n';
                                                li += '                 <a href="/access_settings/show_api">\n';
                                                li += '                     <i class="fa fa-angle-double-right"></i>\n';
                                                li += '                     API\n';
                                                li += '                 </a>\n';
                                                li += '             </li>\n';
                                                li += '             {/actionAccess}\n';
                                                li += '         </ul>\n';
                                                li += '     </li>\n';
                                                li += '{/entityAccess}\n';

                                                $("#sortable").append(li);

                                                // Add settings entry into authentication module layout
                                                domHelper.write(workspacePath + '/views/layout_m_administration.dust', $).then(function() {
                                                    // Copy routes settings pieces
                                                    fs.copySync(piecesPath + '/administration/routes/e_access_settings.js', workspacePath + '/routes/e_access_settings.js');
                                                    // Copy view settings pieces
                                                    fs.copySync(piecesPath + '/administration/views/e_access_settings', workspacePath + '/views/e_access_settings');
                                                    // Copy route e_api_credentials piece
                                                    fs.copySync(piecesPath + '/api/routes/e_api_credentials.js', workspacePath + '/routes/e_api_credentials.js');
                                                    // Copy api e_user piece
                                                    fs.copySync(piecesPath + '/api/routes/e_user.js', workspacePath + '/api/e_user.js');

                                                    // Delete and copy synchronization files/pieces
                                                    var synchroViews = fs.readdirSync(workspacePath+'/views/e_synchronization');
                                                    for (var i = 0; i < synchroViews.length; i++)
                                                        fs.unlink(workspacePath+'/views/e_synchronization/'+synchroViews[i], (err) => {if (err)console.error(err);});
                                                    fs.copySync(piecesPath+'/component/synchronization/views/', workspacePath+'/views/e_synchronization/');
                                                    fs.copySync(piecesPath+'/component/synchronization/routes/e_synchronization.js', workspacePath+'/routes/e_synchronization.js');
                                                    fs.copySync(piecesPath+'/component/synchronization/api/e_synchronization.js', workspacePath+'/api/e_synchronization.js');

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

exports.deleteApplication = function(appID, callback) {
    // Kill spawned child process by preview
    let process_manager = require('../services/process_manager.js');
    let process_server = process_manager.process_server;
    let pathToWorkspace = __dirname + '/../workspace/' + appID;
    let pathToAppLogs = __dirname + '/../workspace/logs/app_' + appID + '.log';

    models.Application.findById(appID).then(app => {

        let nameAppWithoutPrefix = app.codeName.substring(2);
        let nameRepo = globalConf.host + "-" + nameAppWithoutPrefix;

        // Removing .toml file in traefik rules folder
        if(globalConf.env == "cloud" || globalConf.env == "docker"){
            try {
                fs.unlinkSync(__dirname + "/../workspace/rules/"+globalConf.sub_domain + "-" + nameAppWithoutPrefix+".toml");
            } catch(err) {
                console.log(err);
            }
        }

        if (gitlabConf.doGit) {
            gitlab.getProject(nameRepo).then(project => {
                if(!project)
                    console.error("Unable to find gitlab project to delete.");
                else
                    gitlab.deleteProject(project.id).then(answer => {
                        console.log("Delete Gitlab repository: " + nameRepo + " => " + JSON.stringify(answer));
                    }).catch(err => {
                        console.error("Failed to delete gitlab repository:");
                        console.error(err);
                    })
            })
        }

        // If separate database, then delete the workspace database
        if(globalConf.separate_workspace_db){
            (async () => {
                let conn = await mysql.createConnection({
                    host: globalConf.env == "cloud" ? process.env.DATABASE_IP : dbConf.host,
                    user: globalConf.env == "cloud" ? "root" : dbConf.user,
                    password: globalConf.env == "cloud" ? "P@ssw0rd+" : dbConf.password
                });
                await conn.query("DROP DATABASE IF EXISTS workspace_"+appID+";");
                conn.end();
            })()
        }

        if (process_server != null) {
            process_server = process_manager.killChildProcess(process_server.pid, function(err) {
                try {
                    helpers.rmdirSyncRecursive(pathToWorkspace);
                    // Delete application log file
                    if (fs.existsSync(pathToAppLogs))
                        fs.unlinkSync(pathToAppLogs);
                    callback();
                } catch (err) {
                    callback(err, null);
                }
            });
        } else {
            try {
                helpers.rmdirSyncRecursive(pathToWorkspace);
                // Delete application log file
                if (fs.existsSync(pathToAppLogs))
                    fs.unlinkSync(pathToAppLogs);
                callback();
            } catch (err) {
                callback(err, null);
            }
        }
    });
}