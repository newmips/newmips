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
var jison = require("jison");
var bnf = fs.readFileSync("./config/grammar.jison", "utf8");
var parser = new jison.Parser(bnf);

// ===========================================
// Redirection Live =====================
// ===========================================

// Index
router.get('/index', block_access.isLoggedIn, function(req, res) {
    res.render('front/live');
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

    pourcent_generation[req.session.data.id] = 10;

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
        res.redirect('/default/home');
    }
    else if(name_application == ""){
        console.log("Une erreur est survenue. Nom d'application non renseigné.");
        req.session.toastr = [{
            message: "Une erreur est survenue. Nom d'application non renseigné.",
            level: "error"
        }];
        res.redirect('/default/home');

    }
    else{
        var data = {
            "error": 1,
            "profile": req.session.data,
            "menu": "live",
            "msg": message,
            "answers": "",
            "instruction": instruction
        };

        var done = 0;

        var instruction = [];
        if(select_project != ""){
            instruction[0] = "select project " + select_project;
        }
        else{
            instruction[0] = "create project " + name_project;
        }
        instruction[1] = "create application " + name_application;
        instruction[2] = "create module home";

        execute(req, instruction[0]).then(function() {
            data.answers = req.session.answers.join('<br><br>');

            var cpt = 0;

            setInterval(function(){
                if (cpt < 2){
                    pourcent_generation[req.session.data.id] += Math.floor((Math.random() * 15) + 1);
                    cpt++;
                }
            }, 1000);

            execute(req, instruction[1]).then(function() {
                data.answers = req.session.answers.join('<br><br>');
                pourcent_generation[req.session.data.id] = 75;

                execute(req, instruction[2]).then(function() {
                    data.answers = req.session.answers.join('<br><br>');
                    pourcent_generation[req.session.data.id] = 99;
                    res.redirect('/application/preview?id_application=' + req.session.id_application);
                });
            });
        }).catch(function(e) {
            console.log("ERROR");
            console.log(e);
            data.answers = req.session.answers.join('<br><br>');
            res.render('front/live', data);
        });
    }
});

function execute(req, instruction) {
    return new Promise(function(resolve, reject) {
        req.session.answers = (typeof req.session.answers === 'undefined') ? [] : req.session.answers;
        try {
            // Instruction to be executed
            var attr = parser.parse(instruction);

            attr.id_project = req.session.id_project;
            attr.id_application = req.session.id_application;
            attr.id_module = req.session.id_module;
            attr.id_data_entity = req.session.id_data_entity;
            attr.googleTranslate = req.session.toTranslate || false;
            attr.lang_user = req.session.lang_user;

            pourcent_generation[req.session.data.id] += Math.floor((Math.random() * 15) + 1);

            // Function is finally executed as "global()" using the static dialog designer
            // "Options" and "Session values" are sent using the attr attribute
            return designer[attr["function"]](attr, function(err, info) {

                if (err) {
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

                    if (attr["function"] == "createNewApplication") {
                        req.session.id_application = info.insertId;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                    }

                    if (attr["function"] == "selectApplication") {
                        req.session.id_application = info.insertId;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                    }

                    if ((attr["function"] == "createNewModule") || (attr["function"] == "selectModule")) {
                        req.session.id_module = info.insertId;
                        req.session.id_data_entity = null;
                    }

                    if ((attr["function"] == "createNewDataEntity")
                        || (attr["function"] == "selectDataEntity")
                        || (attr["function"] == "createNewEntityWithBelongsTo")
                        || (attr["function"] == "createNewEntityWithHasMany")
                        || (attr["function"] == "createNewBelongsTo")
                        || (attr["function"] == "createNewHasMany")){
                        req.session.id_data_entity = info.insertId;
                    }

                    if (attr["function"] == "deleteProject") {
                        req.session.id_project = null;
                        req.session.id_application = null;
                        req.session.id_module = null;
                        req.session.id_data_entity = null;
                    }

                    if (attr["function"] == "deleteApplication") {
                        req.session.id_application = null;
                        req.session.id_module = null;
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