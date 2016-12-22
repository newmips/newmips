// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

//Sequelize
var models = require('../models/');

// ===========================================
// Redirection application_module =====================
// ===========================================
// List
router.get('/list', block_access.isLoggedIn, function(req, res) {
    var data = {};
    models.Module.findAll({
        include: [{
            model: models.Application
        }]
    }).then(function(modules){
        data.modules = modules;
        res.render('back/module/list.jade', data);
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

// Show
router.get('/show', block_access.isLoggedIn, function(req, res) {
    var id_module = req.param('id_module');
    var data = {};

    models.Module.findOne({
        where: {
            id: id_module
        },
        include: [{
            model: models.Application
        }]
    }).then(function(module){
        data.module = module;
        res.render('back/module/show.jade', data);
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});
module.exports = router;