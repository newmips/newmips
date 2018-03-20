// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var multer = require('multer');
var moment = require('moment');
var request = require('request');
var docBuilder = require('../utils/api_doc_builder');

var upload = multer().single('file');
var Jimp = require("jimp");

// Winston logger
var logger = require('../utils/logger');

// Process spawn
var process_manager = require('../services/process_manager.js');
var process_server_per_app = process_manager.process_server_per_app;

// Session
var session_manager = require('../services/session.js');

// Parser
var designer = require('../services/designer.js');
var fs = require("fs");
var fse = require('fs-extra');
var parser = require('../services/bot.js');

var globalConf = require('../config/global.js');
var helpers = require('../utils/helpers');

// Attr helper needed to format value in instuction
var attrHelper = require('../utils/attr_helper');

// Use to connect workspaces with gitlab or other repo
var gitHelper = require('../utils/git_helper');

// Sequelize
var models = require('../models/');

// Exclude from Editor
var excludeFolder = ["node_modules", "sql", "services", "utils", "upload", ".git"];
var excludeFile = [".git_keep", "access.json", "application.json", "database.js", "global.js", "icon_list.json", "language.json", "webdav.js"];

// ====================================================
// Redirection application =====================
// ====================================================

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
            console.log(err);
            reject(err);
        });
    });
}

var chats = {};
function setChat(req, idApp, idUser, user, content, params){

    // Init if necessary
    if(!chats[idApp])
        chats[idApp] = {};
    if(!chats[idApp][idUser])
        chats[idApp][idUser] = {items: []};

    // Add chat
    if(content != "chat.welcome" || chats[idApp][idUser].items.length < 1){
        chats[idApp][idUser].items.push({
            user: user,
            dateEmission: moment().format("DD MMM HH:mm"),
            content: content,
            params: params || []
        });
    }
}

// Preview Get
router.get('/preview', block_access.isLoggedIn, function(req, res) {

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

        models.Module.findAll({where: {id_application: application.id}, order: 'id_application ASC'}).then(function(modules) {
            var module = modules[0];
            req.session.id_module = module.id;
            var math = require('math');
            var port = math.add(9000, application.id);
            var env = Object.create(process.env);
            env.PORT = port;

            var timer = 50;
            var serverCheckCount = 0;
            if (process_server_per_app[application.id] == null || typeof process_server_per_app[application.id] === "undefined") {
                // Launch server for preview
                process_server_per_app[application.id] = process_manager.launchChildProcess(application.id, env);
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
                docBuilder.build(req.session.id_application).catch(function(err){
                    console.log(err);
                });

                data.session = info;

                initPreviewData(req.session.id_application, data).then(function(data) {
                    var initialTimestamp = new Date().getTime();
                    function checkServer() {
                        if (new Date().getTime() - initialTimestamp > timeoutServer) {
                            setChat(req, id_application, currentUserID, "Mipsy", "structure.global.restart.error");
                            data.iframe_url = -1;
                            data.chat = chats[id_application][currentUserID];
                            return res.render('front/preview', data);
                        }

                        var iframe_status_url = protocol_iframe + '://';
                        if (globalConf.env == 'cloud' || globalConf.env == 'cloud_recette')
                            iframe_status_url += globalConf.host + '-' + application.codeName.substring(2) + globalConf.dns + '/default/status';
                        else
                            iframe_status_url += host + ":" + port + "/default/status";
                        request({
                            "rejectUnauthorized": false,
                            "url": iframe_status_url,
                            "method": "GET"
                        }, function(error, response, body) {
                            if (error)
                                return setTimeout(checkServer, 100);

                            //Check for right status code
                            if (response.statusCode !== 200) {
                                console.log('Server not ready - Invalid Status Code Returned:', response.statusCode);
                                return setTimeout(checkServer, 100);
                            }

                            //All is good. Print the body
                            console.log("Server status is OK"); // Show the HTML for the Modulus homepage.

                            data.error = 0;
                            data.application = module;

                            var iframe_home_url = protocol_iframe + '://';
                            if (globalConf.env == 'cloud' || globalConf.env == 'cloud_recette')
                                iframe_home_url += globalConf.host + '-' + application.codeName.substring(2) + globalConf.dns + "/default/home";
                            else
                                iframe_home_url += host + ":" + port + "/default/home";

                            data.iframe_url = iframe_home_url;
                            data.idApp = application.id;

                            // Let's do git init or commit depending the env (only on cloud env for now)
                            gitHelper.doGit(attr, function(err){
                                if(err)
                                    setChat(req, id_application, currentUserID, "Mipsy", err.message, []);
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
            console.log(err);
            res.render('common/error', data);
        }).catch(function(err) {
            data.code = 500;
            console.log(err);
            res.render('common/error', data);
        });
    });
});

// Preview Post
router.post('/preview', block_access.isLoggedIn, function(req, res) {

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

        var instruction = req.body.instruction || "";
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

            /* Lower the first word for the basic parser jison */
            instruction = attrHelper.lowerFirstWord(instruction);

            /* Parse the instruction to get an object for the designer */
            var attr = parser.parse(instruction);
            /* Rework the attr to get value for the code / url / show */
            attr = attrHelper.reworkAttr(attr);

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

            if(typeof req.session.gitlab !== "undefined" && typeof req.session.gitlab.user !== "undefined" && !isNaN(req.session.gitlab.user.id))
                attr.gitlabUser = req.session.gitlab.user;
            else
                attr.gitlabUser = null;

            if (typeof attr.error !== 'undefined')
                throw new Error(attr.error);
            if (typeof designer[attr.function] !== 'function')
                throw new Error("Designer doesn't have function "+attr.function);

            // Function is finally executed as "globalConf()" using the static dialog designer
            // "Options" and "Session values" are sent using the attr attribute
            designer[attr.function](attr, function(err, info) {
                var answer;
                /* If restart server then redirect to /application/preview?id_application=? */
                var toRedirectRestart = false;
                if (err) {
                    // Error handling code goes here
                    console.log(err);
                    answer = err.message;

                    // Winston log file
                    logger.debug(answer);

                    //Generator answer
                    setChat(req, currentAppID, currentUserID, "Mipsy", answer, err.messageParams);

                    /* Save ERROR an instruction history in the history script in workspace folder */
                    if(instruction != "restart server"){
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
                            res.render('front/preview', data);
                        });
                    });
                } else {
                    /* Save an instruction history in the history script in workspace folder */
                    if(instruction != "restart server"){
                        var historyScriptPath = __dirname+'/../workspace/'+req.session.id_application+'/history_script.nps';
                        var historyScript = fs.readFileSync(historyScriptPath, 'utf8');
                        historyScript += "\n"+instruction;
                        fs.writeFileSync(historyScriptPath, historyScript);
                    }
                    // Store key entities in session for futur instruction
                    session_manager.setSession(attr.function, req, info, data);

                    if (attr.function == "deleteApplication")
                        return res.redirect("/default/home");

                    if (attr.function == 'restart')
                        toRedirectRestart = true;
                    else {
                        // Generator answer
                        setChat(req, currentAppID, currentUserID, "Mipsy", info.message, info.messageParams);
                    }

                    var sessionID = req.sessionID;
                    var timer = 50;
                    var serverCheckCount = 0;

                    // Relaunch server
                    var env = Object.create(process.env);
                    env.PORT = port;

                    // If we stop the server manually we loose some stored data, so we just need to redirect.
                    if(typeof process_server_per_app[req.session.id_application] === "undefined")
                        return res.redirect("/application/preview?id_application="+req.session.id_application);
                    // Kill server first
                    process_manager.killChildProcess(process_server_per_app[req.session.id_application].pid, function() {

                        // Launch a new server instance to reload resources
                        process_server_per_app[req.session.id_application] = process_manager.launchChildProcess(req.session.id_application, env);

                        // Load session values
                        var newAttr = {};
                        newAttr.id_project = req.session.id_project;
                        newAttr.id_application = req.session.id_application;
                        newAttr.id_module = req.session.id_module;
                        newAttr.id_data_entity = req.session.id_data_entity;

                        session_manager.getSession(newAttr, req, function(err, info) {

                            docBuilder.build(req.session.id_application).catch(function(err){
                                console.log(err);
                            });
                            data.session = info;

                            initPreviewData(req.session.id_application, data).then(function(data) {

                                var initialTimestamp = new Date().getTime();
                                function checkServer() {
                                    if (new Date().getTime() - initialTimestamp > timeoutServer) {
                                        // req.session.toastr = [{level: 'error', message: 'Server couldn\'t start'}];
                                        // return res.redirect('/default/home');
                                        data.iframe_url = -1;
                                        setChat(req, currentAppID, currentUserID, "Mipsy", "structure.global.restart.error");
                                        data.chat = chats[currentAppID][currentUserID];
                                        return res.render('front/preview', data);
                                    }

                                    var iframe_status_url = protocol_iframe + '://';
                                    if (globalConf.env == 'cloud' || globalConf.env == 'cloud_recette')
                                        iframe_status_url += globalConf.host + '-' + req.session.name_application + globalConf.dns + '/default/status';
                                    else
                                        iframe_status_url += host + ":" + port + "/default/status";
                                    request({
                                        "rejectUnauthorized": false,
                                        "url": iframe_status_url,
                                        "method": "GET"
                                    }, function(error, response, body) {
                                        //Check for error
                                        if (error)
                                            return setTimeout(checkServer, 100);

                                        //Check for right status code
                                        if (response.statusCode !== 200) {
                                            console.log('Server not ready - Invalid Status Code Returned:', response.statusCode);
                                            return setTimeout(checkServer, 100);
                                        }

                                        //All is good. Print the body
                                        console.log("Server status is OK");

                                        if(toRedirectRestart){
                                            return res.redirect("/application/preview?id_application="+newAttr.id_application);
                                        } else {
                                            // Let's do git init or commit depending the env (only on cloud env for now)
                                            gitHelper.doGit(attr, function(err){
                                                if(err)
                                                    setChat(req, currentAppID, currentUserID, "Mipsy", err.message, []);
                                                // Call preview page
                                                data.chat = chats[currentAppID][currentUserID];

                                                res.render('front/preview', data);
                                            });
                                        }
                                    });
                                }
                                // Check server has started
                                console.log('Waiting for server to start');

                                checkServer();
                            });
                        });
                    });
                }
            });
        } catch(e){

            //data.answers = e.message + "\n\n" + answers;
            console.log(e.message);

            // Analyze instruction more deeply
            var answer = "Sorry, your instruction has not been executed properly.<br><br>";
            answer += "Error: " + e.message + "<br><br>";

            setChat(req, currentAppID, currentUserID, "Mipsy", answer, []);

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
                    res.render('front/preview', data);
                });
            });
        }
    });
});

// AJAX Preview Post
router.post('/fastpreview', block_access.isLoggedIn, function(req, res) {

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

        var instruction = req.body.instruction || "";
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

            /* Lower the first word for the basic parser jison */
            instruction = attrHelper.lowerFirstWord(instruction);

            /* Parse the instruction to get an object for the designer */
            var attr = parser.parse(instruction);
            /* Rework the attr to get value for the code / url / show */
            attr = attrHelper.reworkAttr(attr);
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

            if(typeof req.session.gitlab !== "undefined" && typeof req.session.gitlab.user !== "undefined" && !isNaN(req.session.gitlab.user.id))
                attr.gitlabUser = req.session.gitlab.user;
            else
                attr.gitlabUser = null;

            if (typeof attr.error !== 'undefined')
                throw new Error(attr.error);
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
                    console.log(err);
                    answer = err.message;

                    // Winston log file
                    logger.debug(answer);

                    //Generator answer
                    setChat(req, currentAppID, currentUserID, "Mipsy", answer, err.messageParams);

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
                    } else if (attr.function == 'restart'){
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
                        process_server_per_app[req.session.id_application] = process_manager.launchChildProcess(req.session.id_application, env);

                        // Load session values
                        var newAttr = {};
                        newAttr.id_project = req.session.id_project;
                        newAttr.id_application = req.session.id_application;
                        newAttr.id_module = req.session.id_module;
                        newAttr.id_data_entity = req.session.id_data_entity;

                        session_manager.getSession(newAttr, req, function(err, info) {

                            docBuilder.build(req.session.id_application).catch(function(err){
                                console.log(err);
                            });
                            data.session = info;

                            initPreviewData(req.session.id_application, data).then(function(data) {

                                var initialTimestamp = new Date().getTime();
                                function checkServer() {
                                    if (new Date().getTime() - initialTimestamp > timeoutServer) {
                                        // Timeout
                                        data.iframe_url = -1;
                                        setChat(req, currentAppID, currentUserID, "Mipsy", "structure.global.restart.error");
                                        data.chat = chats[currentAppID][currentUserID];
                                        return res.send(data);
                                    }

                                    var iframe_status_url = protocol_iframe + '://';
                                    if (globalConf.env == 'cloud' || globalConf.env == 'cloud_recette')
                                        iframe_status_url += globalConf.host + '-' + req.session.name_application + globalConf.dns + '/default/status';
                                    else
                                        iframe_status_url += host + ":" + port + "/default/status";

                                    request({
                                        "rejectUnauthorized": false,
                                        "url": iframe_status_url,
                                        "method": "GET"
                                    }, function(error, response, body) {
                                        // Check for error
                                        if (error)
                                            return setTimeout(checkServer, 100);

                                        // Check for right status code
                                        if (response.statusCode !== 200) {
                                            console.log('Server not ready - Invalid Status Code Returned:', response.statusCode);
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
                                                    setChat(req, currentAppID, currentUserID, "Mipsy", err.message, []);
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
        } catch(e){

            console.log(e);
            setChat(req, currentAppID, currentUserID, "Mipsy", e.message, []);

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

/* Dropzone FIELD ajax upload file */
router.post('/set_logo', block_access.isLoggedIn, function (req, res) {
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
                    fse.mkdirs(basePath, function (err) {
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
                                fse.mkdirs(basePath, function (err) {
                                    if (!err) {
                                        Jimp.read(uploadPath, function (err, imgThumb) {
                                            if (!err) {
                                                imgThumb.resize(configLogo.height, configLogo.width)
                                                        .quality(configLogo.quality)  // set JPEG quality
                                                        .write(basePath + req.file.originalname);
                                            } else {
                                                console.log(err);
                                            }
                                        });
                                    } else {
                                        console.log(err);
                                    }
                                });
                            }
                        } else{
                            console.log(err);
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
            console.log(err);
            res.status(500).end(err);
        }
    });
});

// ====================================================
// Back Application =====================
// ====================================================

// List
router.get('/list', block_access.isLoggedIn, function(req, res) {
    var data = {};

    models.Project.findAll({
        include: [{
            model: models.Application,
            include: [{
                model: models.Module,
                include: [{
                    model: models.DataEntity
                }]
            }]
        }],
        order: [
            [models.Application, 'id', 'DESC']
        ]
    }).then(function(projects) {
        var data = {};

        var iframe_status_url;
        var host = globalConf.host;
        var port;

        for(var i=0; i<projects.length; i++){
            for(var j=0; j<projects[i].Applications.length; j++){
                iframe_status_url = globalConf.protocol_iframe + '://';
                port = 9000 + parseInt(projects[i].Applications[j].id);
                if (globalConf.env == 'cloud' || globalConf.env == 'cloud_recette')
                    iframe_status_url += host + '-' + projects[i].Applications[j].codeName.substring(2) + globalConf.dns + '/';
                else
                    iframe_status_url += host + ":" + port + "/";

                projects[i].dataValues.Applications[j].dataValues.url = iframe_status_url;
            }
        }
        data.projects = projects;
        res.render('front/application', data);
    }).catch(function(error) {
        console.log(error);
        data.code = 500;
        res.render('common/error', data);
    });
});

module.exports = router;
