// router/routes.js
var express = require('express');
var router = express.Router();
var connection = require('../utils/db_utils');
var block_access = require('../utils/block_access');
var message = "";

//Sequelize
var models = require('../models/');

// ===========================================
// Redirection Utilisateur =====================
// ===========================================
// List
router.get('/list', block_access.isLoggedIn, function(req, res) {
    var data = {};

    models.User.findAll({
        include: [{
            model: models.Role
        }]
    }).then(function(users){
        data.users = users;
        res.render('back/user/list.jade', data);
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

// Show
router.get('/show', block_access.isLoggedIn, function(req, res) {
    var id_user = req.param('id_user');
    var data = {};

    models.User.findOne({
        where: {
            id: id_user
        },
        include: [{
            model: models.Role
        }]
    }).then(function(user){
        data.user = user;
        res.render('back/user/show.jade', data);
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

module.exports = router;