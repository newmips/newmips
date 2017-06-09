var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

// Sequelize
var models = require('../models/');
// Winston logger
var logger = require('../utils/logger');

router.post('/user_search', block_access.isLoggedIn, function(req, res) {
    models.E_user.findAll({
        where: {f_login: {$like: '%'+req.body.search+'%'}}
    }).then(function(results) {
        var data = [];
        for (var i = 0; i < results.length; i++)
            data.push({
                id: results[i].id,
                text: results[i].f_login
            });
        res.status(200).send(data);
    });
});

router.post('/channel_search', block_access.isLoggedIn, function(req, res) {
    models.E_channel.findAll({
        where: {
            f_type: 'public',
            f_name: {$like: '%'+req.body.search+'%'}
        }
    }).then(function(results) {
        var data = [];
        for (var i = 0; i < results.length; i++)
            data.push({
                id: results[i].id,
                text: results[i].f_name
            });
        res.status(200).send(data);
    });
});

module.exports = router;
