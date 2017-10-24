// router/routes.js
var express = require('express');
var request = require('request');
var router = express.Router();
var block_access = require('../utils/block_access');
var auth = require('../utils/authStrategies');
var helper = require('../utils/helpers');
var fs = require("fs");
var language = require("../services/language");

// Bot completion
var bot = require('../services/bot.js');

//Sequelize
var models = require('../models/');

// ===========================================
// Redirection Home =====================
// ===========================================

// Homepage
router.get('/home', block_access.isLoggedIn, function(req, res) {
    var data = {};
    // Set ReturnTo URL in cas of unauthenticated users trying to reach a page
    req.session.returnTo = req.protocol + '://' + req.get('host') + req.originalUrl;

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
        // Count number of available Applications
        // Get application module
        models.Application.count().then(function(nbApplication){
            data.nb_application = nbApplication;
            data.projects = projects;
            data.showytpopup = false;
            // Check if we have to show the You Tube popup
            if(req.session.showytpopup){
                data.showytpopup = true;
                req.session.showytpopup = false;
            }
            res.render('front/home', data);
        }).catch(function(err){
            data.code = 500;
            res.render('common/error', data);
        });
    });
});

// AJAX loading applications from a choosen project ( To fill select in home )
router.post('/get_applications_by_project', block_access.isLoggedIn, function(req, res){

    models.Application.findAll({
        where: {
            id_project: req.body.idProject
        }
    }).then(function(applications){
        if(applications){
            res.json({
                applications: applications
            });
        }
        else{
            res.status(500).send("Oups, something broken");
        }
    });
});

router.get('/update_instruction_cpt', function(req, res) {
    helper.getNbInstruction(function(totalInstruction){
        var data = {};
        // Get nbInstruction
        var cptInstruction = totalInstruction;
        // Pourcent for progress bar
        var pourcentInstruction = (cptInstruction*100)/300;
        res.json({
            cptInstruction: cptInstruction,
            pourcentInstruction: pourcentInstruction
        });
    });
});

router.get('/update_logs', function(req, res) {
    try{
        res.send(fs.readFileSync(__dirname + "/../all.log"));
    } catch(e){
        console.log(e);
        res.send(false);
    }
});

router.get('/completion', function(req, res) {
    try{
        var str = req.query.str;
        res.send(bot.complete(str));

    } catch(e){
        console.log(e);
        res.send(false);
    }
});

router.post('/ajaxtranslate', function(req, res) {
    res.json({
        value: language(req.body.lang).__(req.body.key, req.body.params)
    });
});
module.exports = router;
