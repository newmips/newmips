// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var language = require('../services/language');
var extend = require('util')._extend;
// Sequelize
var models = require('../models/');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mail = require('../utils/mailer');

router.get('/', block_access.isLoggedIn, function(req, res) {
    var data = {};
    // Récupération des toastr en session
    data.toastr = req.session.toastr;
    // Nettoyage de la session
    req.session.toastr = [];
    data.user = req.session.passport.user;
    models.Role.findByPk(data.user.id_role).then(function(userRole){
        data.user.role = userRole;
        res.render('front/account', data);
    });
});

module.exports = router;