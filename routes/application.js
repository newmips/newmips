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

function initPreviewData(idApplication, data){
    return new Promise(function(resolve, reject) {
        var innerPromises = [];

        // Editor
        var workspacePath = __dirname + "/../workspace/" + idApplication + "/";
        var folder = helpers.readdirSyncRecursive(workspacePath, excludeFolder, excludeFile);
        /* Sort folder first, file after */
        data.workspaceFolder = helpers.sortEditorFolder(folder);

        // UI designer entity list
        innerPromises.push(new Promise(function(innerResolve, innerReject) {
            models.Module.findAll({where: {id_application: idApplication}, include: [{model: models.DataEntity}]}).then(function(modules) {
                data.entities = [];
                for (var i = 0; i < modules.length; i++) {
                    for (var j = 0; j < modules[i].DataEntities.length; j++)
                        data.entities.push(modules[i].DataEntities[j]);
                }
                function sortEntities(entities, idx) {
                    if (entities.length == 0 || !entities[idx+1])
                        return entities;
                    if (entities[idx].dataValues.name > entities[idx+1].dataValues.name) {
                        var swap = entities[idx];
                        entities[idx] = entities[idx+1];
                        entities[idx+1] = swap;
                        return sortEntities(entities, idx == 0 ? 0 : idx-1);
                    }
                    return sortEntities(entities, idx+1);
                }
                data.entities = sortEntities(data.entities, 0);
                innerResolve();
            });
        }));

        Promise.all(innerPromises).then(function() {
            return resolve(data);
        }).catch(function(err) {
            console.error(err);
            reject(err);
        });
    });
}

var chats = {};
function setChat(req, idApp, idUser, user, content, params, isError){

    // Init if necessary
    if(!chats[idApp])
        chats[idApp] = {};
    if(!chats[idApp][idUser])
        chats[idApp][idUser] = {items: []};

    // Add chat
    if(content != "chat.welcome" || chats[idApp][idUser].items.length < 1){
        chats[idApp][idUser].items.push({
            user: user,
            dateEmission: req.moment().format("DD MMM HH:mm"),
            content: content,
            params: params || [],
            isError: isError || false
        });
    }
}

function execute(req, instruction, __) {
    return new Promise((resolve, reject) => {
        try {

            // Lower the first word for the basic parser json
            instruction = dataHelper.lowerFirstWord(instruction);

            // Instruction to be executed
            let data = parser.parse(instruction);

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

            if(data.function != 'createNewApplication')
                data.application = metadata.getApplication(data.app_name);

            console.log("---------");
            console.log(instruction);
            console.log(data.function);

            designer[data.function](data).then(info => {

                session_manager.setSession(data.function, req, info);

                // Save metadata
                if(data.application)
                    data.application.save();

                return resolve();
            }).catch(err => {
                console.error(err);
                let msgErr = __(err.message, err.messageParams || []);
                return reject(msgErr);
            });
        } catch (err) {
            reject(err);
        }
    });
}

// Preview Get
router.get('/preview', block_access.hasAccessApplication, function(req, res) {

    var id_application = req.query.id_application;
    var timeoutServer = 30000;
    if(typeof req.query.timeout !== "undefined")
        timeoutServer = req.query.timeout;
    var currentUserID = req.session.passport.user.id;
    req.session.id_application = id_application;
    req.session.id_data_entity = null;

    var data = {
        error: 1,
        profile: req.session.passport.user,
        menu: "project",
        sub_menu: "list_project",
        application: "",
        answers: "",
        instruction: "",
        iframe_url: "",
        session: ""
    };

    if (!id_application && typeof process_server_per_app[req.session.id_application] === 'undefined') {
        req.session.toastr.push({level: "warning", message: "application.not_started"});
        return res.redirect('/application/list');
    }

    setChat(req, id_application, currentUserID, "Mipsy", "chat.welcome", []);

    models.Application.findOne({where: {id: id_application}}).then(function(application) {
        req.session.id_project = application.id_project;

        models.Module.findAll({where: {id_application: application.id}, order: [["id_application", "ASC"]]}).then(function(modules) {
            let currentModule = modules[0];
            req.session.id_module = currentModule.id;
            var math = require('math');
            var port = math.add(9000, application.id);
            var env = Object.create(process.env);
            env.PORT = port;

            var timer = 50;
            var serverCheckCount = 0;
            if (process_server_per_app[application.id] == null || typeof process_server_per_app[application.id] === "undefined") {
                // Launch server for preview
                process_server_per_app[application.id] = process_manager.launchChildProcess(req, application.id, env);
                timer = 500;
            }

            // var protocol = globalConf.protocol;
            var protocol_iframe = globalConf.protocol_iframe;
            var host = globalConf.host;

            var attr = new Array();
            attr.id_project = req.session.id_project;
            attr.id_application = req.session.id_application;
            attr.id_module = req.session.id_module;
            attr.id_data_entity = req.session.id_data_entity;
            attr.currentUser = req.session.passport.user;

            if(typeof req.session.gitlab !== "undefined" && typeof req.session.gitlab.user !== "undefined" && !isNaN(req.session.gitlab.user.id))
                attr.gitlabUser = req.session.gitlab.user;
            else
                attr.gitlabUser = null;

            session_manager.getSession(attr, req, function(err, info) {
                data.session = info;

                initPreviewData(req.session.id_application, data).then(function(data) {
                    let initialTimestamp = new Date().getTime();
                    let iframe_status_url;
                    function checkServer() {
                        if (new Date().getTime() - initialTimestamp > timeoutServer) {

                            // Get last error from app logs
                            let lastError = helpers.getLastLoggedError(id_application);
                            let chatKey = "structure.global.restart.error";
                            let chatParams = [lastError];

                            // If missing module error
                            if(typeof lastError === "string" && lastError.indexOf("Cannot find module") != -1){
                                chatKey = "structure.global.restart.missing_module";
                                lastError = lastError.split("Cannot find module")[1].replace(/'/g, "").trim();
                                chatParams = [lastError, lastError];
                            }

                            setChat(req, id_application, currentUserID, "Mipsy", chatKey, chatParams, true);
                            data.iframe_url = -1;
                            data.chat = chats[id_application][currentUserID];
                            return res.render('front/preview', data);
                        }

                        iframe_status_url = protocol_iframe + '://';
                        if (globalConf.env == 'cloud')
                            iframe_status_url += globalConf.sub_domain + '-' + application.codeName.substring(2) + "." + globalConf.dns + '/default/status';
                        else
                            iframe_status_url += host + ":" + port + "/default/status";

                        let rejectUnauthorized = globalConf.env == 'cloud' ? true : false;

                        request({
                            rejectUnauthorized: rejectUnauthorized,
                            url: iframe_status_url,
                            method: "GET"
                        }, function(error, response, body) {
                            if (error)
                                return setTimeout(checkServer, 100);

                            //Check for right status code
                            if (response.statusCode !== 200) {
                                console.warn('Server not ready - Invalid Status Code Returned:', response.statusCode);
                                return setTimeout(checkServer, 100);
                            }

                            //All is good. Print the body
                            console.log("Server status is OK"); // Show the HTML for the Modulus homepage.

                            data.error = 0;
                            data.application = currentModule;
                            data.iframe_url = iframe_status_url.split("/default/status")[0]+"/default/home";
                            data.idApp = application.id;

                            // Let's do git init or commit depending the env (only on cloud env for now)
                            gitHelper.doGit(attr, function(err){
                                if(err)
                                    setChat(req, id_application, currentUserID, "Mipsy", err.message, [], true);
                                data.chat = chats[id_application][currentUserID];
                                res.render('front/preview', data);
                            });
                        });
                    }
                    // Check server has started every 50 ms
                    console.log('Waiting for server to start');
                    checkServer();
                });
            });
        });
    }).catch(function(err) {
        initPreviewData(req.session.id_application, data).then(function(data) {
            data.code = 500;
            console.error(err);
            res.render('common/error', data);
        }).catch(function(err) {
            data.code = 500;
            console.error(err);
            res.render('common/error', data);
        });
    });
});

// AJAX Preview Post
router.post('/fastpreview', block_access.hasAccessApplication, function(req, res) {

    var math = require('math');
    var port = math.add(9000, req.session.id_application);
    var env = Object.create(process.env);
    env.PORT = port;
    var protocol_iframe = globalConf.protocol_iframe;
    var host = globalConf.host;
    var timeoutServer = 30000;

    // Parse instruction and set results
    models.Application.findById(req.session.id_application).then(function(application) {

        req.session.name_application = application.codeName.substring(2);

        var instruction = req.body.instruction.trim() || "";
        var currentUserID = req.session.passport.user.id;
        var currentAppID = application.id;

        var data = {
            error: 1,
            profile: req.session.passport.user,
            instruction: instruction,
            session: {
                id_project: req.session.id_project,
                id_application: req.session.id_application,
                id_module: req.session.id_module,
                id_data_entity: req.session.id_data_entity
            }
        };

        try {
            /* Add instruction in chat */
            setChat(req, currentAppID, currentUserID, req.session.passport.user.login, instruction, []);

            /* Lower the first word for the basic parser json */
            instruction = dataHelper.lowerFirstWord(instruction);

            /* Parse the instruction to get an object for the designer */
            var attr = parser.parse(instruction);
            /* Rework the attr to get value for the code / url / show */
            attr = dataHelper.reworkData(attr);
            data.iframe_url = process_manager.childUrl(req, attr.function);
            // We simply add session values in attributes array
            attr.instruction = instruction;
            attr.id_project = req.session.id_project;
            attr.id_application = req.session.id_application;
            attr.id_module = req.session.id_module;
            attr.id_data_entity = req.session.id_data_entity;
            attr.googleTranslate = req.session.toTranslate || false;
            attr.lang_user = req.session.lang_user;
            attr.currentUser = req.session.passport.user;
            attr.gitlabUser = null;

            if(typeof req.session.gitlab !== "undefined" && typeof req.session.gitlab.user !== "undefined" && !isNaN(req.session.gitlab.user.id))
                attr.gitlabUser = req.session.gitlab.user;

            if (typeof attr.error !== 'undefined'){
                var err = new Error();
                err.message = attr.error;
                err.messageParams = attr.errorParams;
                throw err;
            }

            if (typeof designer[attr.function] !== 'function')
                throw new Error("Designer doesn't have function "+attr.function);

            // Function is finally executed as "globalConf()" using the static dialog designer
            // "Options" and "Session values" are sent using the attr attribute
            designer[attr.function](attr, function(err, info) {
                var answer;
                /* If restart server then redirect to /application/preview?id_application=? */
                var toRestart = false;
                if (err) {
                    // Error handling code goes here
                    console.error(err);

                    if(typeof err.message === "undefined")
                        answer = err;
                    else
                        answer = err.message;

                    // Winston log file
                    logger.debug(answer);

                    //Generator answer
                    setChat(req, currentAppID, currentUserID, "Mipsy", answer, err.messageParams, true);

                    /* Save ERROR an instruction history in the history script in workspace folder */
                    if(attr.function != 'restart'){
                        var historyScriptPath = __dirname+'/../workspace/'+req.session.id_application+'/history_script.nps';
                        var historyScript = fs.readFileSync(historyScriptPath, 'utf8');
                        historyScript += "\n//ERROR: "+instruction+" ("+answer+")";
                        fs.writeFileSync(historyScriptPath, historyScript);
                    }

                    // Load session values
                    session_manager.getSession(attr, req, function(err, infoSession) {
                        data.session = infoSession;
                        data.chat = chats[currentAppID][currentUserID];
                        initPreviewData(req.session.id_application, data).then(function(data) {
                            //res.render('front/preview', data);
                            res.send(data);
                        });
                    });
                } else {

                    /* Save an instruction history in the history script in workspace folder */
                    if(attr.function != 'restart'){
                        var historyScriptPath = __dirname+'/../workspace/'+req.session.id_application+'/history_script.nps';
                        var historyScript = fs.readFileSync(historyScriptPath, 'utf8');
                        historyScript += "\n"+instruction;
                        fs.writeFileSync(historyScriptPath, historyScript);
                    }

                    // Store key entities in session for futur instruction
                    session_manager.setSession(attr.function, req, info, data);
                    if (attr.function == "deleteApplication"){
                        return res.send({
                            toRedirect: true,
                            url: "/default/home"
                        });
                    } else if (attr.function == 'restart' || attr.function == 'installNodePackage'){
                        toRestart = true;
                    }

                    // Generator answer
                    setChat(req, currentAppID, currentUserID, "Mipsy", info.message, info.messageParams);

                    var sessionID = req.sessionID;
                    var timer = 50;
                    var serverCheckCount = 0;

                    // Relaunch server
                    var env = Object.create(process.env);
                    env.PORT = port;

                    // If we stop the server manually we loose some stored data, so we just need to redirect.
                    if(typeof process_server_per_app[req.session.id_application] === "undefined"){
                        return res.send({
                            toRedirect: true,
                            url: "/application/preview?id_application="+req.session.id_application
                        });
                    }
                    // Kill server first
                    process_manager.killChildProcess(process_server_per_app[req.session.id_application].pid, function() {

                        // Launch a new server instance to reload resources
                        process_server_per_app[req.session.id_application] = process_manager.launchChildProcess(req, req.session.id_application, env);

                        // Load session values
                        var newAttr = {};
                        newAttr.id_project = req.session.id_project;
                        newAttr.id_application = req.session.id_application;
                        newAttr.id_module = req.session.id_module;
                        newAttr.id_data_entity = req.session.id_data_entity;

                        session_manager.getSession(newAttr, req, function(err, info) {

                            docBuilder.build(req.session.id_application).catch(function(err){
                                console.error(err);
                            });
                            data.session = info;

                            initPreviewData(req.session.id_application, data).then(function(data) {
                                let initialTimestamp = new Date().getTime();
                                let iframe_status_url;

                                function checkServer() {
                                    // Server Timeout
                                    if (new Date().getTime() - initialTimestamp > timeoutServer) {

                                        // Get last error from app logs
                                        let lastError = helpers.getLastLoggedError(currentAppID);
                                        let chatKey = "structure.global.restart.error";
                                        let chatParams = [lastError];

                                        // If missing module error
                                        if(typeof lastError === "string" && lastError.indexOf("Cannot find module") != -1){
                                            chatKey = "structure.global.restart.missing_module";
                                            lastError = lastError.split("Cannot find module")[1].replace(/'/g, "").trim();
                                            chatParams = [lastError, lastError];
                                        }

                                        setChat(req, currentAppID, currentUserID, "Mipsy", chatKey, chatParams, true);
                                        data.iframe_url = -1;
                                        data.chat = chats[currentAppID][currentUserID];
                                        return res.send(data);
                                    }

                                    iframe_status_url = protocol_iframe + '://';
                                    if (globalConf.env == 'cloud')
                                        iframe_status_url += globalConf.sub_domain + '-' + req.session.name_application + "." + globalConf.dns + '/default/status';
                                    else
                                        iframe_status_url += host + ":" + port + "/default/status";

                                    let rejectUnauthorized = globalConf.env == 'cloud' ? true : false;

                                    request({
                                        rejectUnauthorized: rejectUnauthorized,
                                        url: iframe_status_url,
                                        method: "GET"
                                    }, function(error, response, body) {
                                        // Check for error
                                        if (error)
                                            return setTimeout(checkServer, 100);

                                        // Check for right status code
                                        if (response.statusCode !== 200) {
                                            console.warn('Server not ready - Invalid Status Code Returned:', response.statusCode);
                                            return setTimeout(checkServer, 100);
                                        }

                                        // Everything's ok
                                        console.log("Server status is OK");

                                        if(toRestart) {
                                            data.chat = chats[currentAppID][currentUserID];
                                            data.isRestart = true;
                                            return res.send(data);
                                        } else {
                                            // Let's do git init or commit depending the env (only on cloud env for now)
                                            gitHelper.doGit(attr, function(err){
                                                if(err)
                                                    setChat(req, currentAppID, currentUserID, "Mipsy", err.message, [], true);
                                                // Call preview page
                                                data.chat = chats[currentAppID][currentUserID];
                                                res.send(data);
                                            });
                                        }
                                    });
                                }
                                // Check if the server has started
                                console.log('Waiting for server to start');
                                checkServer();
                            });
                        });
                    });
                }
            });
        } catch(error){
            setChat(req, currentAppID, currentUserID, "Mipsy", error.message, error.messageParams, true);
            // Load session values
            var attr = {};
            attr.id_project = req.session.id_project;
            attr.id_application = req.session.id_application;
            attr.id_module = req.session.id_module;
            attr.id_data_entity = req.session.id_data_entity;

            session_manager.getSession(attr, req, function(err, info) {
                data.chat = chats[currentAppID][currentUserID];
                data.session = info;

                initPreviewData(req.session.id_application, data).then(function(data) {
                    res.send(data);
                });
            });
        }
    });
});

// Dropzone FIELD ajax upload file
router.post('/set_logo', block_access.hasAccessApplication, function (req, res) {
    upload(req, res, function (err) {
        if (!err) {
            if (req.body.storageType == 'local') {
                var configLogo = {
                    folder: 'thumbnail/',
                    height: 30,
                    width: 30,
                    quality: 60
                };
                var dataEntity = req.body.dataEntity;
                if (!!dataEntity) {
                    var basePath = __dirname + "/../workspace/" + req.body.idApp + "/public/img/" + dataEntity + '/';
                    fs.mkdirs(basePath, function (err) {
                        if (!err) {
                            var uploadPath = basePath + req.file.originalname;
                            var outStream = fs.createWriteStream(uploadPath);
                            outStream.write(req.file.buffer);
                            outStream.end();
                            outStream.on('finish', function (err) {
                                res.json({
                                    success: true
                                });
                            });
                            if (req.body.dataType == 'picture') {
                                //We make thumbnail and reuse it in datalist
                                basePath = __dirname + "/../workspace/"+req.body.idApp+"/public/img/"+ dataEntity + '/' +  configLogo.folder ;
                                fs.mkdirs(basePath, function (err) {
                                    if (!err) {
                                        Jimp.read(uploadPath, function (err, imgThumb) {
                                            if (!err) {
                                                imgThumb.resize(configLogo.height, configLogo.width)
                                                        .quality(configLogo.quality)  // set JPEG quality
                                                        .write(basePath + req.file.originalname);
                                            } else {
                                                console.error(err);
                                            }
                                        });
                                    } else {
                                        console.error(err);
                                    }
                                });
                            }
                        } else{
                            console.error(err);
                            res.status(500).end(err);
                        }
                    });
                } else{
                    var err = new Error();
                    err.message = 'Internal error, entity not found.';
                    res.status(500).end(err);
                }
            } else{
                var err = new Error();
                err.message = 'Storage type not found.';
                res.status(500).end(err);
            }
        } else{
            console.error(err);
            res.status(500).end(err);
        }
    });
});

// List all applications
router.get('/list', block_access.isLoggedIn, function(req, res) {
    (async () => {
        let projects = await models.Project.findAll({
            include: [{
                model: models.Application,
                required: true,
                include: [{
                    model: models.User,
                    as: "users",
                    where: {
                        id: req.session.passport.user.id
                    },
                    required: true
                }]
            }],
            order: [
                [models.Application, 'id', 'DESC']
            ]
        });

        let iframe_status_url;
        let host = globalConf.host;
        let port;
        let appName;
        let data = {};

        // Get user project for clone url generation
        let gitlabProjects = [];
        if(gitlabConf.doGit)
            gitlabProjects = await gitlab.getAllProjects(req.session.gitlab.user.id);

        for (var i = 0; i < projects.length; i++) {
            for (var j = 0; j < projects[i].Applications.length; j++) {

                iframe_status_url = globalConf.protocol_iframe + '://';
                port = 9000 + parseInt(projects[i].Applications[j].id);
                appName = projects[i].Applications[j].codeName.substring(2);

                if (globalConf.env == 'cloud'){
                    iframe_status_url += globalConf.sub_domain + '-' + appName + "." + globalConf.dns + '/';
                } else {
                    iframe_status_url += host + ":" + port + "/";
                }

                if(gitlabConf.doGit){
                    let project = gitlabProjects.filter(x => x.name == globalConf.host + "-" + appName)[0];
                    if(project) {
                        // projects[i].dataValues.Applications[j].dataValues.repo_url = gitlabConf.protocol + "://" + gitlabConf.url + "/" + req.session.gitlab.user.username + "/" + globalConf.host.replace(/\./g, "-") + "-" + appName + ".git"
                        projects[i].dataValues.Applications[j].dataValues.repo_url = project.http_url_to_repo;
                        data.gitlabUser = req.session.gitlab.user;
                    }
                }
                projects[i].dataValues.Applications[j].dataValues.url = iframe_status_url;
            }
        }

        data.projects = projects
        return data;
    })().then(data => {
        res.render('front/application', data);
    }).catch(err => {
        console.error(err);
        data.code = 500;
        res.render('common/error', data);
    })
});

router.post('/delete', block_access.isLoggedIn, function(req, res) {
    execute(req, "delete application " + req.body.appName).then(_ => {
        res.status(200).send(data);
    }).catch(err => {
        console.error(err);
        res.status(500).send(err);
    });
});

router.post('/initiate', block_access.isLoggedIn, function(req, res) {

    pourcent_generation[req.session.passport.user.id] = 1;
    if (req.body.application == "") {
        req.session.toastr = [{
            message: "Merci de renseigner un nom d'application.",
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
            await execute(req, instructions[i], __);
            pourcent_generation[req.session.passport.user.id] = i == 0 ? 1 : Math.floor(i * 100 / instructions.length);
        }
        await structure_application.initializeApplication(req.session.id_application, req.session.passport.user.id, req.session.app_name)
        return;
    })().then(_ => {
        // Build API documentation
        docBuilder.build(req.session.id_application);
        res.redirect('/application/preview/' + req.session.id_application);
    }).catch(err => {
        console.error(err);
        req.session.toastr = [{
            message: err.message,
            level: "error"
        }];
        return res.redirect('/default/home');
    });
});

router.get('/get_pourcent_generation', block_access.isLoggedIn, function(req, res) {
    var data = {};
    data.pourcent = pourcent_generation[req.session.passport.user.id];
    res.json(data);
});

module.exports = router;
