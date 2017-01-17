// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var message = "";
var multer = require('multer');
var readline = require('readline');
var fs = require('fs');

// Parser
var designer = require('../services/designer.js');
var fs = require("fs");
var jison = require("jison");
var bnf = fs.readFileSync("./config/grammar.jison", "utf8");
var parser = new jison.Parser(bnf);

var scriptData = [];

// Attr helper needed to format value in instuction
var attrHelper = require('../utils/attr_helper');

function execute(req, instruction) {
    return new Promise(function(resolve, reject) {
        var userId = req.session.data.id_user;
        try {
            var attr = parser.parse(instruction);

            console.log(attr);

            /* If the instruction create something there is obligatory a value. We have to clean this value for the code */
            if(typeof attr.options.value !== "undefined" && attr.options.processValue){
                /* Keep the value for the trad file */
                attr.options.showValue = attr.options.value;
                /* Clean the name of the value */
                attr.options.value = attrHelper.clearString(attr.options.value);
                /* Value that will be used in url */
                attr.options.urlValue = attr.options.value;
                /* Create a prefix depending the type of the created value (project, app, module, entity, field) */
                attr.options.value = attrHelper.addPrefix(attr.options.value, attr.function);
            }

            console.log("\n\n");
            console.log(attr);

            attr.id_project = scriptData[userId].ids.id_project;
            attr.id_application = scriptData[userId].ids.id_application;
            attr.id_module = scriptData[userId].ids.id_module;
            attr.id_data_entity = scriptData[userId].ids.id_data_entity;
            attr.googleTranslate = req.session.toTranslate || false;
            attr.lang_user = req.session.lang_user;

            return designer[attr["function"]](attr, function(err, info) {

                if (err) {
                    scriptData[userId].answers.unshift(instruction + " :<br>" + err + "<br><br>");
                    reject();
                } else {

                    if ((attr["function"] == "createNewProject") || (attr["function"] == "selectProject")) {
                        scriptData[userId].ids.id_project = info.insertId;
                        scriptData[userId].ids.id_application = null;
                        scriptData[userId].ids.id_module = null;
                        scriptData[userId].ids.id_data_entity = null;
                    }

                    if (attr["function"] == "createNewApplication") {
                        scriptData[userId].ids.id_application = info.insertId;
                        scriptData[userId].ids.id_module = null;
                        scriptData[userId].ids.id_data_entity = null;
                    }

                    if (attr["function"] == "selectApplication") {
                        scriptData[userId].ids.id_application = info.insertId;
                        scriptData[userId].ids.id_module = null;
                        scriptData[userId].ids.id_data_entity = null;
                    }

                    if ((attr["function"] == "createNewModule") || (attr["function"] == "selectModule")) {
                        scriptData[userId].ids.id_module = info.insertId;
                        scriptData[userId].ids.id_data_entity = null;
                    }

                    if ((attr["function"] == "createNewDataEntity")
                        || (attr["function"] == "selectDataEntity")
                        || (attr["function"] == "createNewEntityWithBelongsTo")
                        || (attr["function"] == "createNewEntityWithHasMany")
                        || (attr["function"] == "createNewBelongsTo")
                        || (attr["function"] == "createNewHasMany")) {
                        scriptData[userId].ids.id_data_entity = info.insertId;
                    }

                    if (attr["function"] == "createNewFieldRelatedTo") {
                        scriptData[userId].ids.id_data_entity = info.insertId;
                    }

                    if (attr["function"] == "deleteProject") {
                        scriptData[userId].ids.id_project = null;
                        scriptData[userId].ids.id_application = null;
                        scriptData[userId].ids.id_module = null;
                        scriptData[userId].ids.id_data_entity = null;
                    }

                    if (attr["function"] == "deleteApplication") {
                        scriptData[userId].ids.id_application = null;
                        scriptData[userId].ids.id_module = null;
                        scriptData[userId].ids.id_data_entity = null;
                    }

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

function recursiveExecute(req, instructions, idx) {
    return new Promise(function(resolve, reject) {
        if (instructions.length == idx){
            /* Reset toSync.json because in this situation it's the sequelize sync() that will do the job, not our custom sync */
            var idApplication = scriptData[req.session.data.id_user].ids.id_application;

            var toSyncFileName = './workspace/'+idApplication+'/models/toSync.json';
            var writeStream = fs.createWriteStream(toSyncFileName);
            var toSyncObject = {};
            writeStream.write(JSON.stringify(toSyncObject, null, 4));
            writeStream.end();
            writeStream.on('finish', function() {
                resolve();
            });
        }
        else {
            execute(req, instructions[idx]).then(function() {
                scriptData[req.session.data.id_user].doneInstruction++;
                resolve(recursiveExecute(req, instructions, idx + 1));
            }).catch(function() {
                reject();
            });
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
    var userId = req.session.data.id_user;

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
        commenting = false;
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
            var pos = line.indexOf('//');
            // Line comment
            if (pos == 0)
                return;
            // Line comment after instruction
            if (pos != -1)
                line = line.substring(0, line.indexOf('//'));
            fileLines.push(line);
        }
    });

    // All lines read, execute instructions
    rl.on('close', function() {
        scriptData[userId].totalInstruction = fileLines.length;
        recursiveExecute(req, fileLines, 0).then(function() {
            // Success
            scriptData[userId].over = true;
        }).catch(function() {
            // Error
            scriptData[userId].over = true;
        })

        // Delete instructions file
        fs.unlink(req.file.path);
    });
    res.end();
});

// Script execution status
router.get('/status', function(req, res) {
    var userId = req.session.data.id_user;
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
