// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var message = "";
var multer = require('multer');
var readline = require('readline');
var fs = require('fs');
var docBuilder = require('../utils/api_doc_builder');

// Parser
var designer = require('../services/designer.js');
var structure_application = require('../structure/structure_application');
var fs = require("fs");

// Session
var session_manager = require('../services/session.js');

var parser = require('../services/bot.js');

var scriptData = [];

// Attr helper needed to format value in instuction
var attrHelper = require('../utils/attr_helper');

function execute(req, instruction) {
    return new Promise(function(resolve, reject) {
        var userId = req.session.passport.user.id;
        try {

            /* Lower the first word for the basic parser jison */
            instruction = attrHelper.lowerFirstWord(instruction);

            var attr = parser.parse(instruction);

            /* Rework the attr to get value for the code / url / show */
            attr = attrHelper.reworkAttr(attr);

            attr.id_project = scriptData[userId].ids.id_project;
            attr.id_application = scriptData[userId].ids.id_application;
            attr.id_module = scriptData[userId].ids.id_module;
            attr.id_data_entity = scriptData[userId].ids.id_data_entity;
            attr.googleTranslate = req.session.toTranslate || false;
            attr.lang_user = req.session.lang_user;

            if (typeof attr.error !== 'undefined')
                throw new Error(attr.error);

            return designer[attr["function"]](attr, function(err, info) {

                if (err) {
                    // Error handling code goes here
                    console.log("ERROR : ", err);
                    scriptData[userId].answers.unshift(instruction + " :<br>" + err + "<br><br>");
                    reject();
                } else {

                    // Store key entities in session for futur instruction
                    session_manager.setSessionForInstructionScript(attr.function, scriptData[userId], info);

                    scriptData[userId].answers.unshift(instruction + " :<br>" + info.message + "<br><br>");
                    resolve();
                }

            });
        } catch (e) {
            scriptData[userId].answers.unshift(instruction + " :<br>" + e.message + "<br><br>");
            reject();
        }
    });
}

var mandatoryInstructions = [
    "create module home",
    "create module Authentication",
    "create entity User",
    "add field login",
    "add field password",
    "add field email with type email",
    "add field token_password_reset",
    "add field enabled with type number",
    "create entity Role",
    "add field label",
    "create entity Group",
    "add field label",
    "select entity User",
    "add field role related to Role using label",
    "add field group related to Group using label",
    "add entity API credentials",
    "add field Client Key",
    "add field Client Secret",
    "add field Token",
    "add field Token timeout TMSP",
    "add field role related to Role using label",
    "add field group related to Group using label",
    "select module home"
];
var idxAtMandatoryInstructionStart = -1;

function recursiveExecute(req, instructions, idx) {
    return new Promise(function(resolve, reject) {
        // All instructions executed
        if (instructions.length == idx){
            /* Reset toSync.json because in this situation it's the sequelize sync() that will do the job, not our custom sync */
            var idApplication = scriptData[req.session.passport.user.id].ids.id_application;

            // Api documentation
            docBuilder.build(req.session.id_application);

            var toSyncFileName = './workspace/'+idApplication+'/models/toSync.json';
            var writeStream = fs.createWriteStream(toSyncFileName);
            var toSyncObject = {};
            writeStream.write(JSON.stringify(toSyncObject, null, 4));
            writeStream.end();
            writeStream.on('finish', function() {
                resolve(idApplication);
            });
        }
        else {
            // If project and application are created and we're at the instruction that
            // follows create application, insert mandatory instructions to instruction array
            if (scriptData[req.session.passport.user.id].ids.id_project > 0 && scriptData[req.session.passport.user.id].ids.id_application > 0 && parser.parse(instructions[idx-1].toLowerCase())["function"] == "createNewApplication") {
                instructions.splice.apply(instructions, [idx, 0].concat(mandatoryInstructions));
                idxAtMandatoryInstructionStart = idx;
            }
            // When all mandatory instructions are executed, initializeApplication then continue recursiveExecute
            if (idx - idxAtMandatoryInstructionStart == mandatoryInstructions.length) {
                structure_application.initializeApplication(scriptData[req.session.passport.user.id].ids.id_application, req.session.passport.user.id, scriptData[req.session.passport.user.id].name_application).then(function(){
                    execute(req, instructions[idx]).then(function() {
                        scriptData[req.session.passport.user.id].doneInstruction++;
                        resolve(recursiveExecute(req, instructions, idx + 1));
                    }).catch(function() {
                        reject();
                    });
                });
            }
            // Nothing specific to do, execute instruction
            else {
                execute(req, instructions[idx]).then(function() {
                    scriptData[req.session.passport.user.id].doneInstruction++;
                    resolve(recursiveExecute(req, instructions, idx + 1));
                }).catch(function() {
                    reject();
                });
            }
        }
    });
}

// Index
router.get('/index', block_access.isLoggedIn, function(req, res) {

    var data = {
        "error": 1,
        "profile": req.session.data,
        "menu": "script",
        "msg": message,
        "answers": "",
        "instruction": ""
    };

    res.render('front/instruction_script', data);
});

// Execute script file
router.post('/execute', block_access.isLoggedIn, multer({
    dest: './upload/'
}).single('instructions'), function(req, res) {

    var extensionFile = req.file.originalname.split(".");
    extensionFile = extensionFile[extensionFile.length -1];

    var userId = req.session.passport.user.id;

    // Init scriptData object for user. (session simulation)
    scriptData[userId] = {
        over: false,
        answers: [],
        doneInstruction: 0,
        totalInstruction: 0,
        ids: {
            id_project: -1,
            id_application: -1,
            id_module: -1,
            id_data_entity: -1
        }
    };

    // Open file descriptor
    var rl = readline.createInterface({
        input: fs.createReadStream(req.file.path)
    });

    // Read file line by line, check for empty line, line comment, scope comment
    var fileLines = [],
        commenting = false,
        authInstructions = false,
        invalidScript = false;

    /* If one of theses value is to 2 after readings all lines then there is an error,
    line to 1 are set because they are mandatory lines added by the generator */
    var exception = {
        createNewProject : {
            value: 0,
            errorMessage: "You can't create more than one project in the same script."
        },
        createNewApplication : {
            value: 0,
            errorMessage: "You can't create more than one application in the same script."
        },
        createModuleHome: {
            value: 1,
            errorMessage: "You can't create a module home, because it's a default module in the application."
        },
        createModuleAuthentication: {
            value: 1,
            errorMessage: "You can't create a module authentication, because it's a default module in the application."
        },
        createEntityUser: {
            value: 1,
            errorMessage: "You can't create a entity user, because it's a default entity in the application."
        },
        createEntityRole: {
            value: 1,
            errorMessage: "You can't create a entity role, because it's a default entity in the application."
        },
        createEntityGroup: {
            value: 1,
            errorMessage: "You can't create a entity group, because it's a default entity in the application."
        },
    };

    rl.on('line', function(line) {
        // Empty line || One line comment scope
        if (line.trim() == '' || (line.indexOf('/*') != -1 && line.indexOf('*/') != -1))
            return;
        // Comment scope start
        if (line.indexOf('/*') != -1 && !commenting)
            commenting = true;
        // Comment scope end
        else if (line.indexOf('*/') != -1 && commenting)
            commenting = false;
        else if (!commenting) {
            var positionComment = line.indexOf('//');
            // Line start with comment
            if (positionComment == 0)
                return;
            // Line comment is after or in the instruction
            if (positionComment != -1){
                line = line.substring(0, line.indexOf('//'));
            }
            // Get the wanted function given by the bot to do some checks
            var designerFunction = parser.parse(line)["function"];
            var designerValue = null;
            if(typeof parser.parse(line)["options"] !== "undefined")
                designerValue = parser.parse(line)["options"]["value"]?parser.parse(line)["options"]["value"]:null;

            if (designerFunction == "createNewProject"){
                exception.createNewProject.value += 1;
            }
            if (designerFunction == "createNewApplication"){
                authInstructions = true;
                exception.createNewApplication.value += 1;
            }
            if(designerFunction == "createNewModule" && designerValue.toLowerCase() == "home"){
                exception.createModuleHome.value += 1;
            }
            if(designerFunction == "createNewModule" && designerValue.toLowerCase() == "authentication"){
                exception.createModuleAuthentication.value += 1;
            }
            if(designerFunction == "createNewDataEntity" && designerValue.toLowerCase() == "user"){
                exception.createEntityUser.value += 1;
            }
            if(designerFunction == "createNewDataEntity" && designerValue.toLowerCase() == "role"){
                exception.createEntityRole.value += 1;
            }
            if(designerFunction == "createNewDataEntity" && designerValue.toLowerCase() == "group"){
                exception.createEntityGroup.value += 1;
            }
            fileLines.push(line);
        }
    });

    // All lines read, execute instructions
    rl.on('close', function() {
        var isError = false;
        var stringError = "";
        for(var item in exception){
            if(exception[item].value > 1){
                stringError += exception[item].errorMessage + '<br><br>';
                isError = true;
            } else if(item == "createNewProject" && exception[item].value == 0){
                stringError += 'You have to create or select a project in your script.<br><br>';
                isError = true;
            } else if(item == "createNewApplication" && exception[item].value == 0){
                stringError += 'You have to create or select an application in your script.<br><br>';
                isError = true;
            }
        }

        if(extensionFile != "txt" && extensionFile != "nps"){
            stringError += 'Invalid file extension, please use .txt or .nps file.<br><br>';
            isError = true;
        }

        if(isError){
            scriptData[userId].answers = [];
            scriptData[userId].answers.push(stringError);
            scriptData[userId].over = true;
        } else{
            scriptData[userId].totalInstruction = authInstructions ? fileLines.length + mandatoryInstructions.length : fileLines.length;
            recursiveExecute(req, fileLines, 0).then(function(idApplication) {
                // Success
                scriptData[userId].over = true;
            }).catch(function() {
                // Error
                scriptData[userId].over = true;
            });
        }

        // Delete instructions file
        fs.unlinkSync(req.file.path);
    });

    res.end();
});

// Script execution status
router.get('/status', function(req, res) {
    var userId = req.session.passport.user.id;
    var stats = {
        totalInstruction: scriptData[userId].totalInstruction,
        doneInstruction: scriptData[userId].doneInstruction,
        over: scriptData[userId].over,
        text: scriptData[userId].answers.join('<br><br>')
    };
    scriptData[userId].answers = [];

    // Script over, remove data from array
    if (stats.over) {
        stats.id_application = scriptData[userId].ids.id_application;
        req.session.id_application = scriptData[userId].ids.id_application;
        req.session.id_project = scriptData[userId].ids.id_project;
        req.session.id_data_entity = scriptData[userId].ids.id_data_entity;
        req.session.id_module = scriptData[userId].ids.id_module;
        scriptData.splice(scriptData.indexOf(userId), 1);
    }

    res.send(stats).end();
});

module.exports = router;
