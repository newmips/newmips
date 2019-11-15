// router/routes.js
const express = require('express');
const request = require('request');
const router = express.Router();
const block_access = require('../utils/block_access');
const auth = require('../utils/authStrategies');
const fs = require("fs-extra");
const language = require("../services/language");
const readLastLines = require('read-last-lines');

// Bot completion
const bot = require('../services/bot.js');

//Sequelize
const models = require('../models/');

router.get('/home', block_access.isLoggedIn, function(req, res) {

    (async () => {
        // Set ReturnTo URL in cas of unauthenticated users trying to reach a page
        req.session.returnTo = req.protocol + '://' + req.get('host') + req.originalUrl;

        const applications = await models.Application.findAll({
            include: [{
                model: models.User,
                as: "users",
                where: {
                    id: req.session.passport.user.id
                }
            }]
        });

        // Count number of available Applications
        // Get application module
        const lastThreeApp = await models.Application.findAll({
            order: [['id', 'DESC']],
            limit: 3,
            include: [{
                model: models.User,
                as: "users",
                where: {
                    id: req.session.passport.user.id
                }
            }]
        });

        let data = {};
        data.applications = applications;
        data.lastThreeApp = lastThreeApp;
        data.nb_application = applications.length;
        data.showytpopup = false;
        // Check if we have to show the You Tube popup
        if(req.session.showytpopup){
            data.showytpopup = true;
            req.session.showytpopup = false;
        }

        data.version;
        if(fs.existsSync(__dirname+"/../public/version.txt"))
            data.version = fs.readFileSync(__dirname+"/../public/version.txt", "utf-8").split("\n")[0];

        return data;
    })().then(data => {
        res.render('front/home', data);
    }).catch(err => {
        res.render('common/error', {code: 500});
    });
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
        if (req.body.appName && typeof req.body.appName === 'string') {
            readLastLines.read(__dirname + "/../workspace/logs/app_" + req.body.appName + ".log", 1000).then(lines => {
                res.status(200).send(lines);
            });
        } else {
            readLastLines.read(__dirname + "/../all.log", 1000).then(lines => {
                res.status(200).send(lines);
            });
        }
    } catch (e) {
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
