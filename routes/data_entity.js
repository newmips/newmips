// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

//Sequelize
var models = require('../models/');

// ===========================================
// Redirection data_entity =====================
// ===========================================
// List
router.get('/list', block_access.isLoggedIn, function(req, res) {
    var data = {};
    models.DataEntity.findAll({
        include: [{
            model: models.Module,
            include: [{
                model: models.Application
            }]
        }]
    }).then(function(data_entities){
        data.data_entities = data_entities;
        res.render('back/data_entity/list.jade', data);
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

// Show
router.get('/show', block_access.isLoggedIn, function(req, res) {
    var id_data_entity = req.param('id_data_entity');
    var data = {};
    models.DataEntity.findOne({
        where: {
            id: id_data_entity
        },
        include: [{
            model: models.DataField
        }, {
            model: models.Module,
            include: [{
                model: models.Application
            }]
        }]
    }).then(function(data_entity){
        data.data_entity = data_entity;
        res.render('back/data_entity/show.jade', data);
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

module.exports = router;