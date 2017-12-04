// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var language = require('../services/language');
var extend = require('util')._extend;
// Sequelize
var models = require('../models/');

// ===========================================
// Redirection Live =====================
// ===========================================

// Index
router.get('/', block_access.isLoggedIn, function(req, res) {
    var data = {};
    // Récupération des toastr en session
    data.toastr = req.session.toastr;
    // Nettoyage de la session
    req.session.toastr = [];
    data.toTranslate = req.session.toTranslate || false;
    data.user = req.session.passport.user;
    models.Role.findById(data.user.id_role).then(function(userRole){
        data.user.role = userRole;
        res.render('front/settings', data);
    });
});

/* Fonction de changement du language */
router.post('/change_language', function(req, res) {
    if (typeof req.body !== 'undefined' && typeof req.body.lang !== 'undefined') {
        req.session.lang_user = req.body.lang;
        res.locals = extend(res.locals, language(req.body.lang));
        res.json({
            success: true
        });
    }
    else{
        res.json({
            success: false
        });
    }
});

router.post('/activate_translation', function(req, res) {
    if (typeof req.body !== 'undefined' && typeof req.body.activate !== 'undefined') {
        req.session.toTranslate = req.body.activate;
        res.json({
            success: true
        });
    }
    else{
        res.json({
            success: false
        });
    }
});

module.exports = router;