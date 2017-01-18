// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var multer = require('multer');
var moment = require('moment');

// Winston logger
var logger = require('../utils/logger');

// Process spawn
// var spawn = require('cross-spawn');
var process_server = new Array();
var process_manager = require('../services/process_manager.js');

// Session
var session_manager = require('../services/session.js');

// Parser
var designer = require('../services/designer.js');
var fs = require("fs");
var jison = require("jison");
var bnf = fs.readFileSync("./config/grammar.jison", "utf8");
var parser = new jison.Parser(bnf);

var global = require('../config/global.js');
var logoPath = './public/img/';
var helpers = require('../utils/helpers');

// Attr helper needed to format value in instuction
var attrHelper = require('../utils/attr_helper');

//Sequelize
var models = require('../models/');

// Exclude from Editor
var exclude = ["node_modules", "config", "sql", "services", "models", "api", "utils", "upload", "public"];

// ====================================================
// Redirection application =====================
// ====================================================

// Preview
router.get('/preview', block_access.isLoggedIn, function(req, res) {

    var id_application = req.query.id_application;
    req.session.id_application = id_application;

    var data = {
        "error": 1,
        "profile": req.session.data,
        "menu": "project",
        "sub_menu": "list_project",
        "application": "",
        "sessionID": req.sessionID,
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

            timer = 50;
            if (process_server[application.id] == null) {
                // Launch server for preview
                process_server[application.id] = process_manager.launchChildProcess(application.id, env);
                timer = 2000;
            }

            //Load the request module
            var request = require('request');

            // var protocol = global.protocol;
            var protocol_iframe = global.protocol_iframe;
            var host = global.host;

            var sessionID = req.sessionID;

            function checkServer() {

                //Lets try to make a HTTPS GET request to modulus.io's website.
                //All we did here to make HTTPS call is changed the `http` to `https` in URL.
                // request("http://127.0.0.1:" + port + "/status", function (error, response, body) {
                // request(protocol + "://" + host + ":" + port + "/status", function (error, response, body) {
                request({
                    "rejectUnauthorized": false,
                    "url": protocol_iframe + "://" + host + ":" + port + "/status",
                    "method": "GET"
                }, function(error, response, body) {
                    //Check for error
                    if (error) {
                        //console.log('Waiting for server to start');
                        //console.log(protocol + "://" + host + ":" + port + "/status");
                        //console.log(error);
                        return checkServer();
                    }

                    //Check for right status code
                    if (response.statusCode !== 200) {
                        console.log('Server not ready - Invalid Status Code Returned:', response.statusCode);
                        return checkServer();
                    }

                    //All is good. Print the body
                    console.log("Server status is OK"); // Show the HTML for the Modulus homepage.

                    var attr = new Array();
                    attr['id_project'] = req.session.id_project;
                    attr['id_application'] = req.session.id_application;
                    attr['id_module'] = req.session.id_module;
                    attr['id_data_entity'] = req.session.id_data_entity;
                    session_manager.getSession(attr, function(err, info) {

                        data["session"] = info;

                        // Call preview page
                        data["error"] = 0;
                        data["application"] = module;
                        data["iframe_url"] = protocol_iframe + "://" + host + ":" + port + "/default/home?sessionID=" + sessionID;

                        // Editor
                        var workspacePath = __dirname + "/../workspace/" + req.session.id_application + "/";
                        var folder = helpers.readdirSyncRecursive(workspacePath, exclude);
                        data.workspaceFolder = folder;

                        res.render('front/preview', data);
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

var timeOut = require('connect-timeout')(1000000);

// Preview
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
        "iframe_url": req.session.iframe_url,
        "session": ""
    };

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
        var historyScriptPath = __dirname + '/../workspace/' + req.session.id_application + '/history_script.nps';
        var historyScript = fs.readFileSync(historyScriptPath, 'utf8');
        historyScript += "\n"+instruction;
        fs.writeFileSync(historyScriptPath, historyScript);

        // Todo : Resolve instruction using bot talkify
        // parser = require('../services/bot.js');
        // End of Todo

        /* Lower the first word for the basic parser jison */
        instruction = attrHelper.lowerFirstWord(instruction);

        /* Parse the instruction to get an object for the designer */
        var attr = parser.parse(instruction);

        console.log(attr);

        /* If the instruction create something there is inevitably a value. We have to clean this value for the code */
        if(typeof attr.options.value !== "undefined" && attr.options.processValue){

            /* Keep the value for the trad file */
            attr.options.showValue = attr.options.value;
            /* Clean the name of the value */
            attr.options.value = attrHelper.clearString(attr.options.value);
            /* Value that will be used in url */
            attr.options.urlValue = attr.options.value.toLowerCase();
            /* Create a prefix depending the type of the created value (project, app, module, entity, field) */
            attr.options.value = attrHelper.addPrefix(attr.options.value, attr.function);
            /* Always lower the code value */
            attr.options.value = attr.options.value.toLowerCase();
        }
        /* In case of instruction about Association / Relation there is a target instead of a value */
        else if(typeof attr.options.target !== "undefined" && attr.options.processValue){

            attr.options.showTarget = attr.options.target;
            attr.options.target = attrHelper.clearString(attr.options.target);
            attr.options.urlTarget = attr.options.target.toLowerCase();
            attr.options.target = attrHelper.addPrefix(attr.options.target, attr.function);
            attr.options.target = attr.options.target.toLowerCase();

            if(typeof attr.options.source !== "undefined"){
                attr.options.showSource = attr.options.source;
                attr.options.source = attrHelper.clearString(attr.options.source);
                attr.options.urlSource = attr.options.source;
                attr.options.source = attrHelper.addPrefix(attr.options.source, attr.function);
                attr.options.source = attr.options.source.toLowerCase();
            }

            if(typeof attr.options.foreignKey !== "undefined"){
                attr.options.showForeignKey = attr.options.foreignKey;
                attr.options.foreignKey = attrHelper.clearString(attr.options.foreignKey);
                attr.options.foreignKey = attrHelper.addPrefix(attr.options.foreignKey, "foreignKey");
                attr.options.foreignKey = attr.options.foreignKey.toLowerCase();
            }

            if(typeof attr.options.as !== "undefined"){
                attr.options.showAs = attr.options.as;
                attr.options.as = attrHelper.clearString(attr.options.as);
                attr.options.urlAs = attr.options.as;
                attr.options.as = attrHelper.addPrefix(attr.options.as, "alias");
                attr.options.as = attr.options.as.toLowerCase();
            }

            if(typeof attr.options.usingField !== "undefined"){
                attr.options.showUsingField = attr.options.usingField;
                attr.options.usingField = attrHelper.clearString(attr.options.usingField);
                attr.options.usingField = attrHelper.addPrefix(attr.options.usingField, "using");
                attr.options.usingField = attr.options.usingField.toLowerCase();
            }
        }

        console.log("\n");
        console.log(attr);

        // We simply add session values in attributes array
        attr.instruction = instruction;
        attr.id_project = req.session.id_project;
        attr.id_application = req.session.id_application;
        attr.id_module = req.session.id_module;
        attr.id_data_entity = req.session.id_data_entity;
        attr.googleTranslate = req.session.toTranslate || false;
        attr.lang_user = req.session.lang_user;

        // Function is finally executed as "global()" using the static dialog designer
        // "Options" and "Session values" are sent using the attr attribute
        designer[attr.function](attr, function(err, info) {
            var answer;
            if (err) {
                // Error handling code goes here
                console.log("ERROR : ", err);
                answer = "Error: " + err.message;
                data.answers = answer + "\n\n" + answers + "\n\n";

                // Winton log file
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

                // Store key entities in session for future instruction
                if ((attr.function == "createNewProject") || (attr.function == "selectProject")) {
                    req.session.id_project = info.insertId;
                    req.session.id_application = null;
                    req.session.id_module = null;
                    req.session.id_data_entity = null;
                }
                else if (attr.function == "createNewApplication") {
                    req.session.id_application = info.insertId;
                    req.session.id_module = null;
                    req.session.id_data_entity = null;
                }
                else if (attr.function == "selectApplication") {
                    req.session.id_application = info.insertId;
                    req.session.id_module = null;
                    req.session.id_data_entity = null;
                }
                else if ((attr.function == "createNewModule") || (attr.function == "selectModule")) {
                    req.session.id_module = info.insertId;
                    req.session.id_data_entity = null;

                    // Redirect iframe to new module
                    var math = require('math');
                    var port = math.add(9000, req.session.id_application);
                    var env = Object.create(process.env);
                    env.PORT = port;
                    // var protocol = global.protocol;
                    var protocol_iframe = global.protocol_iframe;
                    var host = global.host;
                    data.iframe_url = protocol_iframe + "://" + host + ":" + port + "/default/"+info.moduleName.toLowerCase();
                    req.session.iframe_url = data.iframe_url;
                }
                else if ((attr.function == "createNewDataEntity")
                    || (attr.function == "selectDataEntity")
                    || (attr.function == "createNewEntityWithBelongsTo")
                    || (attr.function == "createNewEntityWithHasMany")
                    || (attr.function == "createNewBelongsTo")
                    || (attr.function == "createNewHasMany")) {
                    req.session.id_data_entity = info.insertId;
                }
                else if (attr.function == "createNewFieldRelatedTo") {
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
                    }]
                    return res.redirect("/default/home");
                }
                else if (attr.function == 'deleteModule') {
                    // Redirect iframe to new module
                    var math = require('math');
                    var port = math.add(9000, req.session.id_application);
                    var env = Object.create(process.env);
                    env.PORT = port;
                    // var protocol = global.protocol;
                    var protocol_iframe = global.protocol_iframe;
                    var host = global.host;
                    data.iframe_url = protocol_iframe + "://" + host + ":" + port + "/default/home";
                    req.session.iframe_url = data.iframe_url;
                }

                answer = info.message;
                data.answers = answer + "\n\n" + answers + "\n\n";

                chat.items.push({
                    user: "Newmips",
                    dateEmission: moment().format("DD MMM HH:mm"),
                    content: answer
                });
                data.chat = chat;

                //Load the request module
                var request = require('request');
                // var protocol = global.protocol;
                var protocol_iframe = global.protocol_iframe;
                var host = global.host;
                var math = require('math');
                var port = math.add(9000, req.session.id_application);
                var sessionID = req.sessionID;
                timer = 50;

                // Relaunch server
                var env = Object.create(process.env);
                env.PORT = port;

                // Kill server first
                process_manager.killChildProcess(process_server[req.session.id_application].pid, function() {

                    // Launch a new server instance to reload resources
                    process_server[req.session.id_application] = process_manager.launchChildProcess(req.session.id_application, env);

                    function checkServer() {

                        //Lets try to make a HTTPS GET request to modulus.io's website.
                        //All we did here to make HTTPS call is changed the `http` to `https` in URL.
                        // request("http://127.0.0.1:" + port + "/status", function (error, response, body) {
                        // request(protocol + "://" + host + ":" + port + "/status", function (error, response, body) {
                        request({
                            "rejectUnauthorized": false,
                            "url": protocol_iframe + "://" + host + ":" + port + "/status",
                            "method": "GET"
                        }, function(error, response, body) {
                            //Check for error
                            if (error)
                                return checkServer();

                            //Check for right status code
                            if (response.statusCode !== 200) {
                                console.log('Server not ready - Invalid Status Code Returned:', response.statusCode);
                                return checkServer();
                            }

                            //All is good. Print the body
                            console.log("Server status is OK");

                            // Load session values
                            var attr = new Array();
                            attr.id_project = req.session.id_project;
                            attr.id_application = req.session.id_application;
                            attr.id_module = req.session.id_module;
                            attr.id_data_entity = req.session.id_data_entity;
                            session_manager.getSession(attr, function(err, info) {
                                data.session = info;
                                // Editor
                                var workspacePath = __dirname + "/../workspace/" + req.session.id_application + "/";
                                var folder = helpers.readdirSyncRecursive(workspacePath, exclude);
                                data.workspaceFolder = folder;

                                // Call preview page
                                res.render('front/preview.jade', data);
                            });
                        });
                    }

                    // Check server has started
                    console.log('Waiting for server to start');
                    setTimeout(checkServer, timer);

                });
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
