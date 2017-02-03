// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var access_helper = require('../utils/access_helper');
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
    data.toTranslate = req.session.toTranslate || false;
    res.render('front/settings', data);
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

router.post('/set_group_access', block_access.isLoggedIn, function(req, res) {
    var form = req.body;
    var newModuleAccess = {}, newEntityAccess = {};
    for (var inputName in form) {
        // Add each not checked input to groups list
        var parts = inputName.split('.');
        if (parts[0] == 'module') {
            if (typeof newModuleAccess[parts[1]] === 'undefined')
                newModuleAccess[parts[1]] = [];
            if (form[inputName] != 'true')
                newModuleAccess[parts[1]].push(parts[2]);
        }
        else if (parts[0] == 'entity') {
            if (typeof newEntityAccess[parts[1]] === 'undefined')
                newEntityAccess[parts[1]] = [];
            if (form[inputName] != 'true')
                newEntityAccess[parts[1]].push(parts[2]);
        }
    }

    access_helper.setGroupAccess(req.session.id_application, newModuleAccess, newEntityAccess);
    res.redirect('/application/preview?id_application='+req.session.id_application);
});

router.post('/set_role_access', block_access.isLoggedIn, function(req, res) {
    var form = req.body;
    var newActionRoles = {};
    for (var inputName in form) {
        var parts = inputName.split('.');
        if (typeof newActionRoles[parts[0]] === 'undefined')
            newActionRoles[parts[0]] = {read: [], write: [], delete: []};
        if (form[inputName] != 'true')
            newActionRoles[parts[0]][parts[2]].push(parts[1]);
    }

    access_helper.setRoleAccess(req.session.id_application, newActionRoles);
    res.redirect('/application/preview?id_application='+req.session.id_application);
});

module.exports = router;