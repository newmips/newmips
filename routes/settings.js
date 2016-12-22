// router/routes.js
var express = require('express');
var router = express.Router();
var connection = require('../utils/db_utils');
var block_access = require('../utils/block_access');
var language = require('../services/language');
var extend = require('util')._extend;

// ===========================================
// Redirection Live =====================
// ===========================================

// Index
router.get('/index', block_access.isLoggedIn, function(req, res) {
    var data = {};
    // Récupération des toastr en session
    data.toastr = req.session.toastr;
    // Nettoyage de la session
    req.session.toastr = [];
    res.render('front/settings', data);
});

// Index
router.post('/index', block_access.isLoggedIn, function(req, res) {

    var data = {};
    if (typeof req.body !== 'undefined' && typeof req.body.display_language != 'undefined') {
        req.session.lang_user = req.body.display_language;
        res.locals = extend(res.locals, language(req.body.display_language));
    }
    else{
        req.session.toastr = [{
            message: "Une erreur est survenue.",
            level: "error"
        }];
    }

    res.redirect("/settings/index");
});

module.exports = router;