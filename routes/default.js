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

router.get('/home', block_access.isLoggedIn, function(req, res) {
    var data = {};
    // Set ReturnTo URL in cas of unauthenticated users trying to reach a page
    req.session.returnTo = req.protocol + '://' + req.get('host') + req.originalUrl;

    models.Project.findAll({
        include: [{
            model: models.Application
        }]
    }).then(function(projects) {
        // Count number of available Applications
        // Get application module
        models.Application.findAll({order: [['id', 'DESC']], limit: 3}).then(function(lastThreeApp){
            models.Application.count().then(function(nbApp){
                data.projects = projects;
                data.lastThreeApp = lastThreeApp;
                data.nb_application = nbApp;
                data.showytpopup = false;
                // Check if we have to show the You Tube popup
                if(req.session.showytpopup){
                    data.showytpopup = true;
                    req.session.showytpopup = false;
                }

                data.version = "";
                if(fs.existsSync(__dirname+"/../public/version.txt"))
                    data.version = fs.readFileSync(__dirname+"/../public/version.txt", "utf-8").split("\n")[0];

                res.render('front/home', data);
            }).catch(function(err){
                res.render('common/error', {code: 500});
            })
        }).catch(function(err){
            res.render('common/error', {code: 500});
        })
    }).catch(function(err){
        res.render('common/error', {code: 500});
    })
})

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
            res.status(500).send("Oups, something's broken.");
        }
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
