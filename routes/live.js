// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var message = "";
var multer = require('multer');
var readline = require('readline');
var fs = require('fs');
var pourcent_generation = {};

// Parser
var designer = require('../services/designer.js');

var fs = require("fs");
/* OLD PARSER
var jison = require("jison");
var bnf = fs.readFileSync("./config/grammar.jison", "utf8");
var parser = new jison.Parser(bnf); */

var parser = require('../services/bot.js');

// Attr helper needed to format value in instuction
var attrHelper = require('../utils/attr_helper');

// ===========================================
// Redirection Live =====================
// ===========================================

// Index
router.get('/index', block_access.isLoggedIn, function(req, res) {
    var data = {};
    res.render('front/live', data);
});

// Index
router.post('/index', block_access.isLoggedIn, function(req, res) {

    var instruction = req.body.instruction || '';

    var data = {};

    data.instruction = instruction;

    instruction = instruction.split(';');

    var done = 0
    for (var i = 0; i < instruction.length; i++) {
        execute(req, instruction[i]).then(function() {
            data.answers = req.session.answers.join('<br><br>');
            if (++done == instruction.length) {
                data.id_application = req.session.id_application;
                res.render('front/live', data);
            }
        }).catch(function() {
            data.answers = req.session.answers.join('<br><br>');
            if (++done == instruction.length) {
                data.id_application = req.session.id_application;
                res.render('front/live', data);
            }
        });
    }
});

router.post('/initiate', block_access.isLoggedIn, function(req, res) {

    pourcent_generation[req.session.data.id] = 5;

    // var instruction = req.body.instruction || '';
    var name_project = req.body.project || '';
    var name_application = req.body.application || '';
    var select_project = req.body.selectProject || '';

    if(select_project == "" && (name_project == "" || name_application == "")){
        console.log("Une erreur est survenue. Projet et/ou application non renseigné.");
        req.session.toastr = [{
            message: "Une erreur est survenue. Projet et/ou application non renseigné.",
            level: "error"
        }];
        return res.redirect('/default/home');
    }
    else if(name_application == ""){
        console.log("Une erreur est survenue. Nom d'application non renseigné.");
        req.session.toastr = [{
            message: "Une erreur est survenue. Nom d'application non renseigné.",
            level: "error"
        }];
        return res.redirect('/default/home');
    }
    var data = {
        "error": 1,
        "profile": req.session.data,
        "menu": "live",
        "msg": message,
        "answers": "",
        "instruction": instructions
    };

    var done = 0;

    var instructions = [];
    if(select_project != "")
        instructions.push("select project " + select_project);
    else
        instructions.push("create project " + name_project);

    instructions.push("create application " + name_application);
    instructions.push("create module home");

    instructions.push("create module Authentication");
    instructions.push("create entity User");
    instructions.push("add field login");
    instructions.push("add field password");
    instructions.push("add field email with type email");
    instructions.push("add field token_password_reset");
    instructions.push("add field enabled with type number");
    instructions.push("create entity Role");
    instructions.push("add field label");
    instructions.push("create entity Group");
    instructions.push("add field label");
    instructions.push("select entity User");
    instructions.push("add field role related to Role using label");
    instructions.push("add field group related to Group using label");
    instructions.push("select module home");

    function finishApplicationInitialization() {
        require(__dirname+'/../structure/structure_application').initializeApplication(req.session.id_application).then(function() {
            data.answers = req.session.answers.join('<br><br>');
            return res.redirect('/application/preview?id_application=' + req.session.id_application);
        });
    }

    function recursiveExecute(recurInstructions, idx) {
        // All instructions executed
        if (recurInstructions.length == idx)
            return finishApplicationInitialization();

        execute(req, recurInstructions[idx]).then(function(){
            pourcent_generation[req.session.data.id] += 5;
            recursiveExecute(recurInstructions, ++idx);
        });
    }
    recursiveExecute(instructions, 0);
});

function execute(req, instruction) {
    return new Promise(function(resolve, reject) {
        req.session.answers = (typeof req.session.answers === 'undefined') ? [] : req.session.answers;
        try {

            /* Lower the first word for the basic parser jison */
            instruction = attrHelper.lowerFirstWord(instruction);

            // Instruction to be executed
            var attr = parser.parse(instruction);

            /* Rework the attr to get value for the code / url / show */
            attr = attrHelper.reworkAttr(attr);

            attr.id_project = req.session.id_project;
            attr.id_application = req.session.id_application;
            attr.id_module = req.session.id_module;
            attr.id_data_entity = req.session.id_data_entity;
            attr.googleTranslate = req.session.toTranslate || false;
            attr.lang_user = req.session.lang_user;

            if (typeof attr.error !== 'undefined')
                throw new Error(attr.error);

            // Function is finally executed as "global()" using the static dialog designer
            // "Options" and "Session values" are sent using the attr attribute
            return designer[attr["function"]](attr, function(err, info) {

                if (err) {
                    // Error handling code goes here
                    console.log("ERROR : ", err);
                    req.session.answers.unshift(instruction + " :<br>" + err);
                    reject();
                } else {

                    // Store key entities in session (id_project for instance) for future instruction
                    if ((attr["function"] == "createNewProject") || (attr["function"] == "selectProject")) {
                        req.session.id_project = info.insertId;
                        req.session.id_application = null;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                    }
                    else if (attr["function"] == "createNewApplication" || attr["function"] == "selectApplication") {
                        req.session.id_application = info.insertId;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                    }
                    else if ((attr["function"] == "createNewModule") || (attr["function"] == "selectModule")) {
                        req.session.id_module = info.insertId;
                        req.session.id_data_entity = null;
                    }
                    else if ((attr["function"] == "createNewDataEntity")
                        || (attr["function"] == "selectDataEntity")
                        || (attr["function"] == "createNewEntityWithBelongsTo")
                        || (attr["function"] == "createNewEntityWithHasMany")
                        || (attr["function"] == "createNewBelongsTo")
                        || (attr["function"] == "createNewHasMany")
                        || (attr.function == "createNewFieldRelatedTo")){
                        req.session.id_data_entity = info.insertId;
                    }
                    else if (attr["function"] == "deleteProject") {
                        req.session.id_project = null;
                        req.session.id_application = null;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                    }
                    else if (attr["function"] == "deleteApplication") {
                        req.session.id_application = null;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                    }
                    else if (attr.function == 'deleteModule') {
                        req.session.id_module = info.homeID;
                        req.session.id_data_entity = null;
                    }

                    req.session.answers.unshift(instruction + " :<br>" + info.message);
                    resolve();
                }

            });
        } catch (e) {
            req.session.answers.unshift(instruction + " :<br>" + e.message);
            reject();
        }
    });
}

// Get pourcent generation
router.get('/get_pourcent_generation', block_access.isLoggedIn, function(req, res) {
    var data = {};
    data.pourcent = pourcent_generation[req.session.data.id];
    res.json(data);
});

module.exports = router;