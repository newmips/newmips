// router/routes.js
var express = require('express');
var request = require('request');
var router = express.Router();
var block_access = require('../utils/block_access');
var auth = require('../utils/authStrategies');
var helper = require('../utils/helpers');
var fs = require("fs");
var language = require("../services/language");
const readLastLines = require('read-last-lines');

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
            model: models.Application,
            required: true,
            include: [{
                model: models.User,
                as: "users",
                where: {
                    id: req.session.passport.user.id
                }
            }]
        }]
    }).then(function(projects) {
        // Count number of available Applications
        // Get application module
        models.Application.findAll({
            order: [['id', 'DESC']],
            limit: 3,
            include: [{
                model: models.User,
                as: "users",
                where: {
                    id: req.session.passport.user.id
                }
            }]
        }).then(function(lastThreeApp){
            models.Application.count({
                include: [{
                    model: models.User,
                    as: "users",
                    where: {
                        id: req.session.passport.user.id
                    }
                }]
            }).then(function(nbApp){
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
        },
        include: [{
            model: models.User,
            as: "users",
            where: {
                id: req.session.passport.user.id
            }
        }]
    }).then((applications) => {
        if(applications){
            res.json({applications: applications});
        } else {
            res.status(500).send("Oups, something's broken.");
        }
    });
});

router.post('/update_logs', block_access.isLoggedIn, function(req, res) {
    try {
        if(!isNaN(req.body.idApp)){
            readLastLines.read(__dirname + "/../workspace/logs/app_"+req.body.idApp+".log", 1000).then((lines) => {
                res.status(200).send(lines);
            });
        } else {
            readLastLines.read(__dirname + "/../all.log", 1000).then((lines) => {
                res.status(200).send(lines);
            });
        }
    } catch(e) {
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
