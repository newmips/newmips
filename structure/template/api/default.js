// router/routes.js
var express = require('express');
var router = express.Router();
var moment = require('moment');
var hat = require('hat');
var models = require('../models/');

router.get('/getToken', function(req, res) {
    var authorization = req.headers.authorization;
    // No authorization header
    if (!authorization)
        return res.status(500).end();

    var parts = authorization.split(' ');
    // Bad authorization header
    if (parts.length < 2)
        return res.status(500).end();

    var sheme = parts[0];
    var credentials = new Buffer(parts[1], 'base64').toString().split(':');
    // Bad authorization header
    if (!/Basic/i.test(sheme))
        return res.status(500).end();

    // Bad authorization header
    if (credentials.length < 2)
        return res.status(500).end();

    // Bad authorization header
    if (!credentials[0] || !credentials[1])
        return res.status(500).end();

    var client_key = credentials[0];
    var client_secret = credentials[1];
    models.E_api_credentials.findOne({where: {f_client_key: client_key, f_client_secret: client_secret}}).then(function(credentialsObj) {
        // Authentication failed
        if (!credentialsObj)
            return res.status(401).end();

        // Authentication success, create token and set token timeout
        var token = hat();
        // timeout is one day
        token_timeout_tmsp = new Date().getTime() + 86400000;
        credentialsObj.update({f_token_timeout_tmsp: token_timeout_tmsp, f_token: token}).then(function() {
            // Send back new token
            console.log(credentialsObj);
            res.status(200).json({token: credentialsObj.f_token});
        }).catch(function(err) {
            console.log(err);
            res.status(500).end();
        });
    }).catch(function(err) {
        res.status(500).json(err);
    });
});

module.exports = router;