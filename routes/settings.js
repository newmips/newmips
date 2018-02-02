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

// ===========================================
// Redirection Settings =====================
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
router.post('/change_language', block_access.isLoggedIn, function(req, res) {
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

router.post('/activate_translation', block_access.isLoggedIn, function(req, res) {
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

// Reset password
// Generate token, insert into DB, send email
router.post('/reset_password', block_access.isLoggedIn, function(req, res) {
    var login_user = req.body.login;
    var given_mail = req.body.mail;

    function resetPasswordProcess(idUser, email) {
        // Create unique token and insert into user
        var token = crypto.randomBytes(64).toString('hex');

        models.User.update({
            token_password_reset: token
        }, {
            where: {
                id: idUser
            }
        }).then(function(){
            // Send email with generated token
            mail.sendMail_Reset_Password({
                mail_user: email,
                token: token
            }).then(function(success) {
                req.session.toastr = [{
                    message: "login.emailResetSent",
                    level: "success"
                }];
                res.send(true);
            }).catch(function(err) {
                // Remove inserted value in user to avoid zombies
                models.User.update({
                    token_password_reset: null
                }, {
                    where: {
                        id: idUser
                    }
                }).then(function(){
                    req.session.toastr = [{
                        message: err.message,
                        level: "error"
                    }];
                    res.status(500).send(false);
                });
            });
        }).catch(function(err){
            req.session.toastr = [{
                message: err.message,
                level: "error"
            }];
            res.status(500).send(false);
        });
    }

    models.User.findOne({
        where: {
            login: login_user,
            email: given_mail
        }
    }).then(function(user){
        if(user){
            resetPasswordProcess(user.id, user.email);
        } else {
            req.session.toastr = [{
                message: "login.first_connection.userNotExist",
                level: "error"
            }];
            res.status(500).send(false);
        }
    }).catch(function(err){
        req.session.toastr = [{
            message: err.message,
            level: "error"
        }];
        res.status(500).send(false);
    });
});


module.exports = router;