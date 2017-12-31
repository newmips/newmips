// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var message = "";
var multer = require('multer');
var readline = require('readline');
var fs = require('fs');
var pourcent_generation = {};
var models = require('../models');
var structure_application = require('../structure/structure_application');
var docBuilder = require('../utils/api_doc_builder');

// Parser
var designer = require('../services/designer.js');

var fs = require("fs");

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
            //data.answers = req.session.answers.join('<br><br>');
            if (++done == instruction.length) {
                data.id_application = req.session.id_application;
                res.render('front/live', data);
            }
        }).catch(function() {
            //data.answers = req.session.answers.join('<br><br>');
            if (++done == instruction.length) {
                data.id_application = req.session.id_application;
                res.render('front/live', data);
            }
        });
    }
});

router.post('/initiate', block_access.isLoggedIn, function(req, res) {

    pourcent_generation[req.session.passport.user.id] = 1;

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

    // Authentication module
    instructions.push("create module Administration");
    instructions.push("create entity User");
    instructions.push("add field login");
    instructions.push("add field password");
    instructions.push("add field email with type email");
    instructions.push("add field token_password_reset");
    instructions.push("add field enabled with type number");
    instructions.push("set icon user");
    instructions.push("create entity Role");
    instructions.push("add field label");
    instructions.push("set icon asterisk");
    instructions.push("create entity Group");
    instructions.push("add field label");
    instructions.push("set icon users");
    instructions.push("select entity User");
    instructions.push("add field role related to Role using label");
    instructions.push("add field group related to Group using label");
    instructions.push("add entity API credentials");
    instructions.push("add field Client Name");
    instructions.push("add field Client Key");
    instructions.push("add field Client Secret");
    instructions.push("set icon unlink");
    instructions.push("add field role related to Role using label");
    instructions.push("add field group related to Group using label");
    instructions.push("add field Token");
    instructions.push("add field Token timeout TMSP");

    // Component status base
    instructions.push("add entity Status");
    instructions.push("set icon tags");
    instructions.push("add field Entity");
    instructions.push("add field Field");
    instructions.push("add field Name");
    instructions.push("add field Color with type color");
    instructions.push("add field Position with type number");
    instructions.push("add field Default with type boolean");
    instructions.push("entity Status has many Status called Children");
    instructions.push("entity status has many Translation called Translations");
    instructions.push("select entity translation");
    instructions.push("add field Language");
    instructions.push("add field Value");
    instructions.push("create entity Media");
    instructions.push("add field Type with type enum and values Mail, Notification, Function");
    instructions.push("add field Name");
    instructions.push("add field Target entity");
    instructions.push("entity Media has one Media Mail");
    instructions.push("entity Media has one Media Notification");
    instructions.push("entity Media has one Media Function");
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
    instructions.push("add field Subject");
    instructions.push("add field Content with type text");
    instructions.push("select entity media notification");
    instructions.push("add field Title");
    instructions.push("add field Content with type text");
    instructions.push("select entity media function");
    instructions.push("add field Title");
    instructions.push("add field Function with type text");

    // Inline help
    instructions.push("add entity Inline Help");
    instructions.push("set icon question");
    instructions.push("add field Entity");
    instructions.push("add field Field");
    instructions.push("add field Content with type text");
    instructions.push("select module home");

    function recursiveExecute(recurInstructions, idx) {
        // All instructions executed
        if (recurInstructions.length == idx) {
            structure_application.initializeApplication(req.session.id_application, req.session.passport.user.id, req.session.name_application).then(function() {
                docBuilder.build(req.session.id_application);
                res.redirect('/application/preview?id_application=' + req.session.id_application);
            });
            return;
        }

        execute(req, recurInstructions[idx]).then(function(){
            pourcent_generation[req.session.passport.user.id] = idx == 0 ? 1 : Math.floor(idx * 100 / recurInstructions.length);
            recursiveExecute(recurInstructions, ++idx);
        }).catch(function(err){
            req.session.toastr = [{
                message: err,
                level: "error"
            }];
            return res.redirect('/default/home');
        });
    }
    recursiveExecute(instructions, 0);
});

function execute(req, instruction) {
    return new Promise(function(resolve, reject) {
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
            attr.currentUser = req.session.passport.user;

            if(typeof req.session.gitlab !== "undefined" && typeof req.session.gitlab.user !== "undefined" && !isNaN(req.session.gitlab.user.id))
                attr.gitlabUser = req.session.gitlab.user;
            else
                attr.gitlabUser = null;

            var __ = require("../services/language")(req.session.lang_user).__;

            if (typeof attr.error !== 'undefined')
                throw attr.error;

            // Function is finally executed as "global()" using the static dialog designer
            // "Options" and "Session values" are sent using the attr attribute
            return designer[attr.function](attr, function(err, info) {
                if (err) {
                    var msgErr = __(err.message, err.messageParams || []);
                    // Error handling code goes here
                    console.log("ERROR : ", msgErr);
                    reject(msgErr);
                } else {

                    switch(attr.function){
                        case "selectProject":
                        case "createNewProject":
                            req.session.id_project = info.insertId;
                            req.session.id_application = null;
                            req.session.id_module = null;
                            req.session.id_data_entity = null;
                            break;
                        case "selectApplication":
                        case "createNewApplication":
                            req.session.id_application = info.insertId;
                            req.session.name_application = info.name_application;
                            req.session.id_module = null;
                            req.session.id_data_entity = null;
                            break;
                        case "selectModule":
                        case "createNewModule":
                            req.session.id_module = info.insertId;
                            req.session.id_data_entity = null;
                            break;
                        case "createNewEntity":
                        case "selectEntity":
                        case "createNewEntityWithBelongsTo":
                        case "createNewEntityWithHasMany":
                        case "createNewBelongsTo":
                        case "createNewHasMany":
                        case "createNewFieldRelatedTo":
                            req.session.id_data_entity = info.insertId;
                            break;
                        case "deleteProject":
                            req.session.id_project = null;
                            req.session.id_application = null;
                            req.session.id_module = null;
                            req.session.id_data_entity = null;
                            break;
                        case "deleteApplication":
                            req.session.id_application = null;
                            req.session.id_module = null;
                            req.session.id_data_entity = null;
                            break;
                        case "deleteModule":
                            req.session.id_module = info.homeID;
                            req.session.id_data_entity = null;
                            break;
                    }

                    var msgInfo = __(info.message, info.messageParams || []);
                    resolve();
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

// Get pourcent generation
router.get('/get_pourcent_generation', block_access.isLoggedIn, function(req, res) {
    var data = {};
    data.pourcent = pourcent_generation[req.session.passport.user.id];
    res.json(data);
});

module.exports = router;