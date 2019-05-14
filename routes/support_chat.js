const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const request = require('request');
const mattermost = require('../services/mattermost_api.js');
const models = require('../models/');

router.post('/init', block_access.isLoggedIn, async (req, res) => {
    try {
        let currentApp = await models.Application.findOne({
            where: {
                id: req.session.id_application
            }
        });
        await mattermost.init(currentApp.name);
        res.status(200).send(true);
    } catch(err){
        if(typeof err.error !== "undefined" && typeof err.error.message !== "undefined")
            console.error(err.error.message);
        else if(typeof err.message !== "undefined")
            console.error(err.message);
        else
            console.error(err);
        res.status(503).send(err);
    }
});

router.post('/send', block_access.isLoggedIn, async (req, res) => {
    try {
        let currentApp = await models.Application.findOne({
            where: {
                id: req.session.id_application
            }
        });
        let newPost = await mattermost.send(currentApp.name, req.session.passport.user.login + ": " + req.body.text);
        newPost.login = req.session.passport.user.login;
        res.status(200).send(newPost);
    } catch(err){
        if(typeof err.error !== "undefined" && typeof err.error.message !== "undefined")
            console.error(err.error.message);
        else if(typeof err.message !== "undefined")
            console.error(err.message);
        else
            console.error(err);
        res.status(503).send(err);
    }
});

router.post('/watch', block_access.isLoggedIn, async (req, res) => {
    try {
        let currentApp = await models.Application.findOne({
            where: {
                id: req.session.id_application
            }
        });
        let results = await mattermost.watch(currentApp.name);
        res.status(200).send(results);
    } catch(err){
        if(typeof err.error !== "undefined" && typeof err.error.message !== "undefined")
            console.error(err.error.message);
        else if(typeof err.message !== "undefined")
            console.error(err.message);
        else
            console.error(err);
        res.status(503).send(err);
    }
});

module.exports = router;