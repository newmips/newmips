// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var multer = require('multer');
var moment = require('moment');
var request = require('request');

// Winston logger
var logger = require('../utils/logger');

// Process spawn
var process_server = new Array();
var process_manager = require('../services/process_manager.js');

// Session
var session_manager = require('../services/session.js');

// Parser
var designer = require('../services/designer.js');
var fs = require("fs");
var parser = require('../services/bot.js');

var globalConf = require('../config/global.js');
var logoPath = './public/img/';
var helpers = require('../utils/helpers');

// Attr helper needed to format value in instuction
var attrHelper = require('../utils/attr_helper');

// Use to connect workspaces with gitlab or other repo
// Only working on our cloud ENV for now.
var gitHelper = require('../utils/git_helper');

// Sequelize
var models = require('../models/');

// Exclude from Editor
var exclude = ["node_modules", "config", "sql", "services", "models", "api", "utils", "upload"];

// ====================================================
// Redirection application =====================
// ====================================================

// Preview Get
router.get('/preview', block_access.isLoggedIn, function(req, res) {

    var id_application = req.query.id_application;
    req.session.id_application = id_application;

    var data = {
        "error": 1,
        "profile": req.session.data,
        "menu": "project",
        "sub_menu": "list_project",
        "application": "",
        "answers": "",
        "chat": {
            items: [{
                user: "Newmips",
                dateEmission: moment().format("DD MMM HH:mm"),
                content: "Welcome ! Please type your instructions in input field below or type 'help' if you need any support."
            }]
        },
        "instruction": "",
        "iframe_url": "",
        "session": ""
    };

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
            if (process_server[application.id] == null) {
                // Launch server for preview
                process_server[application.id] = process_manager.launchChildProcess(application.id, env);
                timer = 2000;
            }

            // var protocol = globalConf.protocol;
            var protocol_iframe = globalConf.protocol_iframe;
            var host = globalConf.host;

            function checkServer() {
                if (++serverCheckCount == 150)
                    throw new Error("Server couldn't start");
                //Lets try to make a HTTPS GET request to modulus.io's website.
                //All we did here to make HTTPS call is changed the `http` to `https` in URL.
                // request("http://127.0.0.1:" + port + "/status", function (error, response, body) {
                // request(protocol + "://" + host + ":" + port + "/status", function (error, response, body) {
                var iframe_status_url = protocol_iframe + '://';
                if (globalConf.env == 'cloud')
                    iframe_status_url += globalConf.host + '-' + application.codeName.substring(2) + globalConf.dns + '/status';
                else
                    iframe_status_url += host + ":" + port + "/status";
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

                    var attr = new Array();
                    attr.id_project = req.session.id_project;
                    attr.id_application = req.session.id_application;
                    attr.id_module = req.session.id_module;
                    attr.id_data_entity = req.session.id_data_entity;
                    session_manager.getSession(attr, function(err, info) {

                        data.session = info;
                        // Call preview page
                        data.error = 0;
                        data.application = module;
                        var iframe_home_url = protocol_iframe + '://';
                        if (globalConf.env == 'cloud')
                            iframe_home_url += globalConf.host + '-' + application.codeName.substring(2) + globalConf.dns + "/default/home";
                        else
                            iframe_home_url += host + ":" + port + "/default/home";
                        data.iframe_url = iframe_home_url;

                        // Editor
                        var workspacePath = __dirname + "/../workspace/" + req.session.id_application + "/";
                        var folder = helpers.readdirSyncRecursive(workspacePath, exclude);
                        /* Sort folder first, file after */
                        folder = helpers.sortEditorFolder(folder);
                        data.workspaceFolder = folder;

                        // Let's do git init or commit depending the env (only on cloud env for now)
                        gitHelper.doGit(attr, function(){
                            res.render('front/preview', data);
                        });
                    });
                });
            }

            // Check server has started every 50 ms
            console.log('Waiting for server to start');
            setTimeout(checkServer, timer);
        });
    }).catch(function(err) {
        data.code = 500;
        console.log(err);
        res.render('common/error', data);
    });
});

// Preview Post
router.post('/preview', block_access.isLoggedIn, function(req, res) {

    var instruction = "";
    var answers = "";
    var chat = {
        items: []
    };

    if (typeof req.body.instruction !== 'undefined' && req.body.instruction)
        instruction = req.body.instruction;
    if (typeof req.body.answers !== 'undefined' && req.body.answers)
        answers = req.body.answers;
    if (typeof req.body.chat !== 'undefined' && req.body.chat)
        chat = JSON.parse(req.body.chat);
    var data = {
        "error": 1,
        "profile": req.session.data,
        "menu": "live",
        "answers": "",
        "chat": "",
        "instruction": instruction,
        "session": ""
    };

    var math = require('math');
    var port = math.add(9000, req.session.id_application);
    var env = Object.create(process.env);
    env.PORT = port;
    var protocol_iframe = globalConf.protocol_iframe;
    var host = globalConf.host;

    models.Application.findById(req.session.id_application).then(function(application) {
        req.session.name_application = application.codeName.substring(2);
        data.iframe_url = process_manager.childUrl(req);

        // Parse instruction and set results
        try {

            /* Add instruction in chat */
            chat.items.push({
                user: "User",
                dateEmission: moment().format("DD MMM HH:mm"),
                content: instruction
            });
            data.chat = chat;

            // Enable session values display
            data.session = {
                "id_project": req.session.id_project,
                "id_application": req.session.id_application,
                "id_module": req.session.id_module,
                "id_data_entity": req.session.id_data_entity
            };

            /* Save an instruction history in the history script in workspace folder */
            var historyScriptPath = __dirname+'/../workspace/'+req.session.id_application+'/history_script.nps';
            var historyScript = fs.readFileSync(historyScriptPath, 'utf8');
            historyScript += "\n"+instruction;
            fs.writeFileSync(historyScriptPath, historyScript);

            /* Lower the first word for the basic parser jison */
            instruction = attrHelper.lowerFirstWord(instruction);

            /* Parse the instruction to get an object for the designer */
            var attr = parser.parse(instruction);

            /* Rework the attr to get value for the code / url / show */
            attr = attrHelper.reworkAttr(attr);

            // We simply add session values in attributes array
            attr.instruction = instruction;
            attr.id_project = req.session.id_project;
            attr.id_application = req.session.id_application;
            attr.id_module = req.session.id_module;
            attr.id_data_entity = req.session.id_data_entity;
            attr.googleTranslate = req.session.toTranslate || false;
            attr.lang_user = req.session.lang_user;

            if (typeof attr.error !== 'undefined')
                throw new Error(attr.error);

            // Function is finally executed as "globalConf()" using the static dialog designer
            // "Options" and "Session values" are sent using the attr attribute
            designer[attr.function](attr, function(err, info) {
                var answer;

                /* If restart server then redirect to /application/preview?id_application=? */
                var toRedirectRestart = false;
                if (err) {
                    // Error handling code goes here
                    console.log("ERROR : ", err);
                    answer = "Error: " + err.message;
                    data.answers = answer + "\n\n" + answers + "\n\n";

                    // Winston log file
                    logger.debug(err.message);

                    chat.items.push({
                        user: "Newmips",
                        dateEmission: moment().format("DD MMM HH:mm"),
                        content: answer
                    });
                    data.chat = chat;

                    // Load session values
                    session_manager.getSession(attr, function(err, info) {
                        data.session = info;
                        res.render('front/preview', data);
                    });
                } else {

                    // Store key entities in session for futur instruction
                    session_manager.setSession(attr.function, req, info, data);

                    if (attr.function == "deleteApplication")
                        return res.redirect("/default/home");

                    if (attr.function == 'restart')
                        toRedirectRestart = true;

                    // OLD WAY
                    /*if ((attr.function == "createNewProject") || (attr.function == "selectProject")) {
                        req.session.id_project = info.insertId;
                        req.session.id_application = null;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                    }
                    else if (attr.function == "createNewApplication" || attr.function == "selectApplication") {
                        req.session.id_application = info.insertId;
                        req.session.name_application = info.name_application;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                    }
                    else if ((attr.function == "createNewModule") || (attr.function == "selectModule")) {
                        req.session.id_module = info.insertId;
                        req.session.id_data_entity = null;

                        // Redirect iframe to new module
                        var iframeUrl = data.iframe_url.split("/default/");
                        data.iframe_url = iframeUrl[0]+"/default/"+info.moduleName.toLowerCase();
                    }
                    else if ((attr.function == "createNewDataEntity")
                        || (attr.function == "selectDataEntity")
                        || (attr.function == "createNewEntityWithBelongsTo")
                        || (attr.function == "createNewEntityWithHasMany")
                        || (attr.function == "createNewBelongsTo")
                        || (attr.function == "createNewHasMany")
                        || (attr.function == "createNewFieldRelatedTo")) {
                        req.session.id_data_entity = info.insertId;
                    }
                    else if (attr.function == "deleteProject") {
                        req.session.id_project = null;
                        req.session.id_application = null;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                    }
                    else if (attr.function == "deleteApplication") {
                        req.session.id_application = null;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                        req.session.toastr = [{
                            message: 'actions.delete.application',
                            level: "success"
                        }];
                        return res.redirect("/default/home");
                    }
                    else if (attr.function == 'deleteModule') {
                        req.session.id_module = info.homeID;
                        req.session.id_data_entity = null;
                        // Redirect iframe to new module
                        var iframeUrl = data.iframe_url.split("/default/");
                        data.iframe_url = iframeUrl[0]+"/default/home";
                    }
                    else if (attr.function == 'restart') {
                        toRedirectRestart = true;
                    }*/

                    answer = info.message;
                    data.answers = answer + "\n\n" + answers + "\n\n";

                    chat.items.push({
                        user: "Newmips",
                        dateEmission: moment().format("DD MMM HH:mm"),
                        content: answer
                    });
                    data.chat = chat;

                    var sessionID = req.sessionID;
                    var timer = 50;
                    var serverCheckCount = 0;

                    // Relaunch server
                    var env = Object.create(process.env);
                    env.PORT = port;

                    // If we stop the server manually we loose some stored data, so we just need to redirect.
                    if(typeof process_server[req.session.id_application] !== "undefined"){
                        // Kill server first
                        process_manager.killChildProcess(process_server[req.session.id_application].pid, function() {

                            // Launch a new server instance to reload resources
                            process_server[req.session.id_application] = process_manager.launchChildProcess(req.session.id_application, env);

                            function checkServer() {
                                if (++serverCheckCount == 150) {
                                    req.session.toastr = [{level: 'error', message: 'Server couldn\'t start'}];
                                    return res.redirect('/default/home');
                                }

                                var iframe_status_url = protocol_iframe + '://';
                                if (globalConf.env == 'cloud')
                                    iframe_status_url += globalConf.host + '-' + req.session.name_application + globalConf.dns + '/status';
                                else
                                    iframe_status_url += host + ":" + port + "/status";
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

                                    // Load session values
                                    var newAttr = {};
                                    newAttr.id_project = req.session.id_project;
                                    newAttr.id_application = req.session.id_application;
                                    newAttr.id_module = req.session.id_module;
                                    newAttr.id_data_entity = req.session.id_data_entity;
                                    session_manager.getSession(newAttr, function(err, info) {
                                        data.session = info;
                                        // Editor
                                        var workspacePath = __dirname + "/../workspace/" + req.session.id_application + "/";
                                        var folder = helpers.readdirSyncRecursive(workspacePath, exclude);
                                        /* Sort folder first, file after */
                                        folder = helpers.sortEditorFolder(folder);
                                        data.workspaceFolder = folder;

                                        if(toRedirectRestart){
                                            return res.redirect("/application/preview?id_application="+newAttr.id_application);
                                        }
                                        else{
                                            // Let's do git init or commit depending the env (only on cloud env for now)
                                            gitHelper.doGit(attr, function(){
                                                // Call preview page
                                                res.render('front/preview.jade', data);
                                            });
                                        }
                                    });
                                });
                            }

                            // Check server has started
                            console.log('Waiting for server to start');
                            setTimeout(checkServer, timer);
                        });
                    }
                    else{
                        res.redirect("/application/preview?id_application="+req.session.id_application);
                    }
                }
            });
        } catch(e){

            data["answers"] = e.message + "\n\n" + answers;
            console.log(e.message);

            // Analyze instruction more deeply
            var answer = "Sorry, your instruction has not been executed properly.<br><br>";
            answer += "Machine said: " + e.message + "<br><br>";
            chat["items"].push({
                user: "Newmips",
                dateEmission: moment().format("DD MMM HH:mm"),
                content: answer
            });
            data["chat"] = chat;

            // Load session values
            var attr = {};
            attr.id_project = req.session.id_project;
            attr.id_application = req.session.id_application;
            attr.id_module = req.session.id_module;
            attr.id_data_entity = req.session.id_data_entity;
            session_manager.getSession(attr, function(err, info) {
                data.session = info;
                res.render('front/preview', data);
            });
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
        }]
    }).then(function(projects) {
        var data = {};
        data.projects = projects;
        res.render('front/application', data);
    }).catch(function(error) {
        data.code = 500;
        res.render('error', data);
    });
});

// Show
router.get('/show', block_access.isLoggedIn, function(req, res) {
    var id_application = req.param('id_application');
    var data = {};
    models.Application.findOne({
        where: {
            id: id_application
        }
    }).then(function(application) {
        if (!application) {
            data.code = 404;
            return res.render('common/error', data);
        }
        data.application = application;
        res.render('application/show.jade', data);
    }).catch(function(err) {
        data.code = 500;
        res.render('common/error', data);
    });
});

module.exports = router;
