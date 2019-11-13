const express = require('express');
const router = express.Router();
const fs = require('fs-extra');
const moment = require('moment');
const request = require('request');
const models = require('../models/');
const readline = require('readline');
const multer = require('multer');
const upload = multer().single('file');
const Jimp = require("jimp");
const math = require('math');

// Config
const globalConf = require('../config/global.js');
const gitlabConf = require('../config/gitlab.js');

// Services
const process_manager = require('../services/process_manager.js');
const process_server_per_app = process_manager.process_server_per_app;
const session_manager = require('../services/session.js');
const designer = require('../services/designer.js');
const parser = require('../services/bot.js');
const gitlab = require('../services/gitlab_api');

// Utils
const block_access = require('../utils/block_access');
const docBuilder = require('../utils/api_doc_builder');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');
const dataHelper = require('../utils/data_helper');
const gitHelper = require('../utils/git_helper');

// Metadata
const metadata = require('../database/metadata')();

const structure_application = require('../structure/structure_application');

let pourcent_generation = {};

// Exclude from Editor
let excludeFolder = ["node_modules", "sql", "services", "upload", ".git"];
let excludeFile = [".git_keep", "application.json", "database.js", "global.js", "icon_list.json", "webdav.js"];

function initPreviewData(appName, data){
    // Editor
    let workspacePath = __dirname + "/../workspace/" + appName + "/";
    let folder = helpers.readdirSyncRecursive(workspacePath, excludeFolder, excludeFile);
    /* Sort folder first, file after */
    data.workspaceFolder = helpers.sortEditorFolder(folder);

    let application = metadata.getApplication(appName);
    let modules = application.modules;
    // UI designer entity list

    data.entities = [];
    for (let i = 0; i < modules.length; i++) {
        for (let j = 0; j < modules[i].entities.length; j++)
            data.entities.push(modules[i].entities[j]);
    }
    function sortEntities(entities, idx) {
        if (entities.length == 0 || !entities[idx+1])
            return entities;
        if (entities[idx].name > entities[idx+1].name) {
            let swap = entities[idx];
            entities[idx] = entities[idx+1];
            entities[idx+1] = swap;
            return sortEntities(entities, idx == 0 ? 0 : idx-1);
        }
        return sortEntities(entities, idx+1);
    }
    data.entities = sortEntities(data.entities, 0);
    return data;
}

let chats = {};
function setChat(req, app_name, userID, user, content, params, isError){

    // Init if necessary
    if(!chats[app_name])
        chats[app_name] = {};
    if(!chats[app_name][userID])
        chats[app_name][userID] = {items: []};

    // Add chat
    if(content != "chat.welcome" || chats[app_name][userID].items.length < 1){
        chats[app_name][userID].items.push({
            user: user,
            dateEmission: req.moment().format("DD MMM HH:mm"),
            content: content,
            params: params || [],
            isError: isError || false
        });
    }
}

async function execute(req, instruction, __, data = {}, saveMetadata = true) {

    // Lower the first word for the basic parser json
    instruction = dataHelper.lowerFirstWord(instruction);

    // Instruction to be executed
    data = {
        ...data,
        ...parser.parse(instruction)
    };

    // Rework the data to get value for the code / url / show
    data = dataHelper.reworkData(data);

    if (typeof data.error !== 'undefined')
        throw data.error;

    data.app_name = req.session.app_name;
    data.module_name = req.session.module_name;
    data.entity_name = req.session.entity_name;
    data.googleTranslate = req.session.toTranslate || false;
    data.lang_user = req.session.lang_user;
    data.currentUser = req.session.passport.user;
    data.gitlabUser = null;

    if(typeof req.session.gitlab !== 'undefined'
        && typeof req.session.gitlab.user !== 'undefined'
        && !isNaN(req.session.gitlab.user.id))
        data.gitlabUser = req.session.gitlab.user;

    if(data.function != 'createNewApplication' && data.function != 'deleteApplication')
        data.application = metadata.getApplication(data.app_name);

    let info;
    try {
        info = await designer[data.function](data);
    } catch (err) {
        console.error(err);
        throw __(err.message ? err.message : err, err.messageParams || []);
    }

    data = session_manager.setSession(data.function, req, info, data);

    // Save metadata
    if(data.application && data.function != 'deleteApplication' && saveMetadata)
        data.application.save();

    data.message = info.message;
    data.messageParams = info.messageParams;
    data.restartServer = typeof info.restartServer === 'undefined' ? true : false;

    return data;
}

// Preview Get
router.get('/preview/:app_name', block_access.hasAccessApplication, (req, res) => {

    let appName = req.params.app_name;

    // Application starting timeout
    let timeoutServer = 30000;
    if(typeof req.query.timeout !== "undefined")
        timeoutServer = req.query.timeout;

    let currentUserID = req.session.passport.user.id;

    req.session.app_name = appName;
    req.session.module_name = 'm_home';
    req.session.entity_name = null;

    let data = {
        application: metadata.getApplication(appName),
        currentUser: req.session.passport.user,
        gitlabUser: null
    };

    if ((!appName || appName == '') && typeof process_server_per_app[appName] === 'undefined') {
        req.session.toastr.push({level: "warning", message: "application.not_started"});
        return res.redirect('/default/home');
    }

    setChat(req, appName, currentUserID, "Mipsy", "chat.welcome", []);

    models.Application.findOne({where: {name: appName}}).then(db_app => {

        let env = Object.create(process.env);
        let port = math.add(9000, db_app.id);
        env.PORT = port;

        if (process_server_per_app[appName] == null || typeof process_server_per_app[appName] === "undefined")
            process_server_per_app[appName] = process_manager.launchChildProcess(req, appName, env);

        if(typeof req.session.gitlab !== "undefined" && typeof req.session.gitlab.user !== "undefined" && !isNaN(req.session.gitlab.user.id))
            data.gitlabUser = req.session.gitlab.user;

        data.session = session_manager.getSession(req)

        let initialTimestamp = new Date().getTime();
        let iframe_url = globalConf.protocol_iframe + '://';

        if (globalConf.env == 'cloud')
            iframe_url += globalConf.sub_domain + '-' + data.application.name.substring(2) + "." + globalConf.dns + '/default/status';
        else
            iframe_url += globalConf.host + ":" + port + "/default/status";

        data = initPreviewData(appName, data);
        data.chat = chats[appName][currentUserID];

        // Check server has started every 50 ms
        console.log('Starting server...');
        process_manager.checkServer(iframe_url, initialTimestamp, timeoutServer).then(_ => {
            data.iframe_url = iframe_url.split("/default/status")[0]+"/default/home";
            // Let's do git init or commit depending the env (only on cloud env for now)
            gitHelper.doGit(data);
            res.render('front/preview', data);
        }).catch(err => {
            console.error(err);
            let chatKey = err.message;
            let chatParams = err.messageParams;
            let lastError = helpers.getLastLoggedError(appName);
            // If missing module error
            if(typeof lastError === "string" && lastError.indexOf("Cannot find module") != -1){
                chatKey = "structure.global.restart.missing_module";
                lastError = lastError.split("Cannot find module")[1].replace(/'/g, "").trim();
                chatParams = [lastError, lastError];
            }

            setChat(req, appName, currentUserID, "Mipsy", chatKey, chatParams, true);
            data.iframe_url = -1;
            res.render('front/preview', data);

        });
    }).catch(err => {
        data = initPreviewData(appName, data);
        data.code = 500;
        console.error(err);
        res.render('common/error', data);
    });
});

// AJAX Preview Post
router.post('/fastpreview', block_access.hasAccessApplication, (req, res) => {

    let appName = req.session.app_name;
    /* Lower the first word for the basic parser json */
    let instruction = dataHelper.lowerFirstWord(req.body.instruction.trim());
    let currentUserID = req.session.passport.user.id;
    let data = {};

    (async () => {
        let db_app = await models.Application.findOne({where: {name: appName}});

        let port = math.add(9000, db_app.id);
        let env = Object.create(process.env);
        env.PORT = port;

        let protocol_iframe = globalConf.protocol_iframe;
        let host = globalConf.host;
        let timeoutServer = 30000;

        // Current application url
        data.iframe_url = process_manager.childUrl(req, db_app.id);

        /* Add instruction in chat */
        setChat(req, appName, currentUserID, req.session.passport.user.login, instruction, []);

        let __ = require("../services/language")(req.session.lang_user).__;

        // Executing instruction
        data = await execute(req, instruction, __, data);

        // On entity delete, reset child_url to avoid 404
        if (data.function == 'deleteDataEntity') {
            data.iframe_url = protocol_iframe + '://' + host + ":" + port + "/default/home";
            process_manager.setChildUrl(req.sessionID, appName, "/default/home");
        }

        /* Save an instruction history in the history script in workspace folder */
        if (data.function != 'restart') {
            let historyScriptPath = __dirname + '/../workspace/' + appName + '/history_script.nps';
            let historyScript = fs.readFileSync(historyScriptPath, 'utf8');
            historyScript += "\n" + instruction;
            fs.writeFileSync(historyScriptPath, historyScript);
        }

        if (data.function == "deleteApplication"){
            data.toRedirect = true;
            data.url = "/default/home";
            return data;
        }

        // Generator answer
        setChat(req, appName, currentUserID, "Mipsy", data.message, data.messageParams);

        // If we stop the server manually we loose some stored data, so we just need to redirect.
        if(typeof process_server_per_app[appName] === "undefined"){
            data.toRedirect = true;
            data.url = "/application/preview/" + appName;
            return data;
        }

        if(data.restartServer) {
            // Kill server first
            await process_manager.killChildProcess(process_server_per_app[appName].pid)

            // Launch a new server instance to reload resources
            process_server_per_app[appName] = process_manager.launchChildProcess(req, appName, env);

            let initialTimestamp = new Date().getTime();
            let iframe_url = protocol_iframe + '://';

            if (globalConf.env == 'cloud')
                iframe_url += globalConf.sub_domain + '-' + req.session.app_name + "." + globalConf.dns + '/default/status';
            else
                iframe_url += host + ":" + port + "/default/status";

            console.log('Starting server...');
            await process_manager.checkServer(iframe_url, initialTimestamp, timeoutServer);
        }

        data.session = session_manager.getSession(req);
        data = initPreviewData(appName, data);
        data.chat = chats[appName][currentUserID];

        // Let's do git init or commit depending the situation
        if (data.function != 'restart' && data.function != 'installNodePackage')
            gitHelper.doGit(data);

        return data;

    })().then(data => {
        if(data.application)
            docBuilder.build(data.application).catch(err => {
                console.error(err);
            });
        res.send(data);
    }).catch(err => {

        // Error handling code goes here
        console.error(err);

        // Server timed out handling
        if(err.message == 'preview.server_timeout') {

            // Get last error from app logs
            let lastError = helpers.getLastLoggedError(appName);
            let chatKey = "structure.global.restart.error";
            let chatParams = [lastError];

            // If missing module error
            if(typeof lastError === "string" && lastError.indexOf("Cannot find module") != -1){
                chatKey = "structure.global.restart.missing_module";
                lastError = lastError.split("Cannot find module")[1].replace(/'/g, "").trim();
                chatParams = [lastError, lastError];
            }
            data.iframe_url = -1;
            setChat(req, appName, currentUserID, "Mipsy", chatKey, chatParams, true);
        } else {
            setChat(req, appName, currentUserID, "Mipsy", err.message ? err.message : err, err.messageParams, true);
        }

        /* Save ERROR an instruction history in the history script in workspace folder */
        if (data.function != 'restart') {
            let historyScriptPath = __dirname + '/../workspace/' + appName + '/history_script.nps';
            let historyScript = fs.readFileSync(historyScriptPath, 'utf8');
            historyScript += "\n//ERROR: " + instruction + " (" + err.message + ")";
            fs.writeFileSync(historyScriptPath, historyScript);
        }

        // Load session values
        data = initPreviewData(appName, data);
        data.session = session_manager.getSession(req);
        data.chat = chats[appName][currentUserID];
        res.send(data);
    });
});

// Dropzone FIELD ajax upload file
router.post('/set_logo', block_access.hasAccessApplication, (req, res) => {
    upload(req, res, function(err) {
        if (err) {
            console.error(err);
            return res.status(500).end(err);
        }

        let configLogo = {
            folder: 'thumbnail/',
            height: 30,
            width: 30,
            quality: 60
        };

        let entity = req.body.entity;

        if (!entity)
            return res.status(500).end(new Error('Internal error, entity not found.'));

        let basePath = __dirname + "/../workspace/" + req.body.appName + "/public/img/" + entity + '/';
        fs.mkdirs(basePath, err => {
            if (err) {
                console.error(err);
                return res.status(500).end(err);
            }

            let uploadPath = basePath + req.file.originalname;
            fs.writeFileSync(uploadPath, req.file.buffer);

            // Thumbnail creation
            basePath = __dirname + "/../workspace/" + req.body.appName + "/public/img/" + entity + '/' + configLogo.folder;
            fs.mkdirs(basePath, err => {
                if (err) {
                    console.error(err);
                    return res.status(500).end(err);
                }

                Jimp.read(uploadPath, (err, imgThumb) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).end(err);
                    }

                    imgThumb.resize(configLogo.height, configLogo.width).quality(configLogo.quality).write(basePath + req.file.originalname);
                    res.json({
                        success: true
                    });
                });
            });
        });
    });
});

// List all applications
router.get('/list', block_access.isLoggedIn, (req, res) => {
    (async () => {
        let applications = await models.Application.findAll({
            include: [{
                model: models.User,
                as: "users",
                where: {
                    id: req.session.passport.user.id
                },
                required: true
            }],
            order: [
                ['id', 'DESC']
            ]
        });

        let app_url, port, appName, data = {};
        let host = globalConf.host;

        // Get user project for clone url generation
        let gitlabProjects = [];
        if(gitlabConf.doGit)
            gitlabProjects = await gitlab.getAllProjects(req.session.gitlab.user.id);

        for (var i = 0; i < applications.length; i++) {

            app_url = globalConf.protocol_iframe + '://';
            port = 9000 + parseInt(applications[i].id);
            appName = applications[i].name.substring(2);
            app_url += host + ":" + port + "/";

            if (globalConf.env == 'cloud')
                app_url += globalConf.sub_domain + '-' + appName + "." + globalConf.dns + '/';

            if(gitlabConf.doGit){
                let project = gitlabProjects.filter(x => x.name == globalConf.host + "-" + appName)[0];
                if(project) {
                    // applications[i].dataValues.repo_url = gitlabConf.protocol + "://" + gitlabConf.url + "/" + req.session.gitlab.user.username + "/" + globalConf.host.replace(/\./g, "-") + "-" + appName + ".git"
                    applications[i].dataValues.repo_url = project.http_url_to_repo;
                    data.gitlabUser = req.session.gitlab.user;
                }
            }
            applications[i].dataValues.url = app_url;
        }

        data.applications = applications
        return data;
    })().then(data => {
        res.render('front/application', data);
    }).catch(err => {
        console.error(err);
        data.code = 500;
        res.render('common/error', data);
    })
});

router.post('/delete', block_access.isLoggedIn, (req, res) => {
    let __ = require("../services/language")(req.session.lang_user).__;
    execute(req, "delete application " + req.body.appName, __).then(_ => {
        res.status(200).send(true);
    }).catch(err => {
        console.error(err);
        res.status(500).send(err);
    });
});

router.post('/initiate', block_access.isLoggedIn, (req, res) => {

    pourcent_generation[req.session.passport.user.id] = 1;
    if (req.body.application == "") {
        req.session.toastr = [{
            message: "Missing application name.",
            level: "error"
        }];
        return res.redirect('/default/home');
    }

    let instructions = [];
    instructions.push("create application " + req.body.application);
    instructions.push("create module home");

    // Authentication module
    instructions.push("create module Administration");
    instructions.push("create entity User");
    instructions.push("add field login");
    instructions.push("set field login required");
    instructions.push("set field login unique");
    instructions.push("add field password");
    instructions.push("add field email with type email");
    instructions.push("add field token_password_reset");
    instructions.push("add field enabled with type number");
    instructions.push("set icon user");
    instructions.push("create entity Role");
    instructions.push("add field label");
    instructions.push("set field label required");
    instructions.push("set field label unique");
    instructions.push("set icon asterisk");
    instructions.push("create entity Group");
    instructions.push("add field label");
    instructions.push("set field label required");
    instructions.push("set field label unique");
    instructions.push("set icon users");
    instructions.push("select entity User");
    instructions.push("add field Role related to many Role using label");
    instructions.push("add field Group related to many Group using label");
    instructions.push("set field Role required");
    instructions.push("set field Group required");
    instructions.push("entity Role has many user");
    instructions.push("entity Group has many user");
    instructions.push("add entity API credentials");
    instructions.push("add field Client Name");
    instructions.push("add field Client Key");
    instructions.push("add field Client Secret");
    instructions.push("set icon key");
    instructions.push("add field role related to many Role using label");
    instructions.push("add field group related to many Group using label");
    instructions.push("add field Token");
    instructions.push("add field Token timeout TMSP");
    instructions.push("add entity Synchronization");
    instructions.push("entity Synchronization has one API credentials");
    instructions.push("add field Journal backup file");
    instructions.push("add entity Synchro credentials");
    instructions.push("add field Cloud host with type url");
    instructions.push("add field Client key");
    instructions.push("add field Client secret");
    instructions.push("set icon unlink");
    instructions.push("add widget stat on entity User");

    // Component status base
    instructions.push("add entity Status");
    instructions.push("set icon tags");
    instructions.push("add field Entity");
    instructions.push("add field Field");
    instructions.push("add field Name");
    instructions.push("add field Color with type color");
    instructions.push("add field Accepted group related to many Group using Label");
    instructions.push("add field Button label");
    instructions.push("add field Position with type number");
    instructions.push("add field Default with type boolean");
    instructions.push("add field Comment with type boolean");
    instructions.push("entity Status has many Status called Children");
    instructions.push("entity status has many Translation called Translations");
    instructions.push("select entity translation");
    instructions.push("add field Language");
    instructions.push("add field Value");
    instructions.push("create entity Robot");
    instructions.push("set icon android");
    instructions.push("add field Current status with type enum and values CONNECTED, DISCONNECTED, WORKING");
    instructions.push("add field Name");
    instructions.push("add field Api credentials related to api credentials using client name");
    instructions.push("add field Comment with type regular text");
    instructions.push("create entity Task");
    instructions.push("set icon cogs");
    instructions.push("add component status with name State");
    instructions.push("add field Title");
    instructions.push("set field Title required");
    instructions.push("add field Type with type enum and values Manual, Automatic and default value Manual");
    instructions.push("add field Planned date with type date");
    instructions.push("add field Execution start date with type date");
    instructions.push("add field Execution finish date with type date");
    instructions.push("add field Duration with type decimal");
    instructions.push("add field Data flow with type regular text");
    instructions.push("add field Robot related to Robot using Name");
    instructions.push("add field Program file with type file");
    instructions.push("add field Procedure with type regular text");
    instructions.push("add component localfilestorage with name Documents");
    instructions.push("create entity Media");
    instructions.push("set icon envelope");
    instructions.push("add field Type with type enum and values Mail, Notification, SMS, Task");
    instructions.push("add field Name");
    instructions.push("set field Name required");
    instructions.push("add field Target entity");
    instructions.push("entity Media has one Media Mail");
    instructions.push("entity Media has one Media Notification");
    instructions.push("entity Media has one Media SMS");
    instructions.push("entity Media has one Media Task");
    instructions.push("select entity media task");
    instructions.push("add field Task name");
    instructions.push("add field Task type with type enum and values Manual, Automatic and default value Manual");
    instructions.push("add field Assignment logic");
    instructions.push("add field Program file with type file");
    instructions.push("add field Data flow with type text");

    instructions.push("entity status has many Action called Actions");
    instructions.push("select entity action");
    instructions.push("add field Media related to Media using name");
    instructions.push("add field Order with type number");
    instructions.push("add field Execution with type enum and values Immédiate, Différée with default value Immédiate");
    instructions.push("select entity media mail");
    instructions.push("add field To");
    instructions.push("add field Cc");
    instructions.push("add field Cci");
    instructions.push("add field From");
    instructions.push("add field Attachments");
    instructions.push("add field Subject");
    instructions.push("add field Content with type text");
    instructions.push("select entity media notification");
    instructions.push("add field Title");
    instructions.push("add field Description");
    instructions.push("add field Icon");
    instructions.push("add field Color with type color");
    instructions.push("add field targets");
    instructions.push("add entity Notification");
    instructions.push("add field Title");
    instructions.push("add field Description");
    instructions.push("add field URL");
    instructions.push("add field Color with type color");
    instructions.push("add field Icon");
    instructions.push("select entity media SMS");
    instructions.push("add field Message with type text");
    instructions.push("add field Phone numbers");
    instructions.push("entity user has many notification");
    instructions.push("entity notification has many user");

    // Inline help
    instructions.push("add entity Inline Help");
    instructions.push("set icon question-circle-o");
    instructions.push("add field Entity");
    instructions.push("add field Field");
    instructions.push("add field Content with type text");

    // Set default theme if different than blue-light
    if(typeof req.session.defaultTheme !== "undefined" && req.session.defaultTheme != "blue-light")
        instructions.push("set theme "+req.session.defaultTheme);

    // Set home module selected
    instructions.push("select module home");

    // Needed for translation purpose
    let __ = require("../services/language")(req.session.lang_user).__;

    (async () => {
        for (let i = 0; i < instructions.length; i++) {
            await execute(req, instructions[i], __, {}, false);
            pourcent_generation[req.session.passport.user.id] = i == 0 ? 1 : Math.floor(i * 100 / instructions.length);
        }
        metadata.getApplication(req.session.app_name).save();
        await structure_application.initializeApplication(metadata.getApplication(req.session.app_name));
        return;
    })().then(_ => {
        // Build API documentation
        docBuilder.build(metadata.getApplication(req.session.app_name));
        res.redirect('/application/preview/' + req.session.app_name);
    }).catch(err => {
        console.error(err);
        req.session.toastr = [{
            message: err.message,
            level: "error"
        }];
        return res.redirect('/default/home');
    });
});

router.get('/get_pourcent_generation', (req, res) => {
    res.json({
        pourcent: pourcent_generation[req.session.passport.user.id]
    });
});

module.exports = router;
