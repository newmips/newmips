var moment = require('moment');
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var auth = require('../utils/authStrategies');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mail = require('../utils/mailer');

//Sequelize
var models = require('../models/');

// =====================================
// HOME PAGE (with login links) ========
// =====================================

/* GET status page to check if workspace is ready. */
router.get('/status', function(req, res) {
    res.render('status');
});

/* GET home page. */
router.get('/', function(req, res) {
    res.redirect('/login');
});

// =====================================
// LOGIN ===============================
// =====================================

router.get('/login', block_access.loginAccess, function(req, res) {
    var redirect = req.params.redirect;
    if (typeof redirect === 'undefined')
        redirect = "/default/home";

    res.render('login/login', {
        message: req.flash('loginMessage'),
        redirect: redirect
    });
});

router.post('/login', auth.isLoggedIn, function(req, res) {

    if (req.body.remember)
        req.session.cookie.maxAge = 30 * 60 * 1000; // 30min
    else
        req.session.cookie.expires = false;

    res.redirect("/default/home");
});

router.get('/first_connection', block_access.loginAccess, function(req, res) {
    res.render('login/first_connection');
});

router.post('/first_connection', block_access.loginAccess, function(req, res, done) {
    var login_user = req.body.login_user;

    models.E_user.findOne({
        where: {
            f_login: login_user,
            $or: [{f_password: ""}, {f_password: null}],
            f_enabled: 0
        }
    }).then(function(user){
        if(!user){
            req.flash('loginMessage', "login.first_connection.userNotExist");
            res.redirect('/login');
        }
        else if(user.f_password != "" && user.f_password != null){
            req.flash('loginMessage', "login.first_connection.alreadyHavePassword");
            res.redirect('/login');
        }
        else{
            var password = bcrypt.hashSync(req.body.password_user2, null, null);

            models.E_user.update({
                f_password: password,
                f_enabled: 1
            }, {
                where: {
                    id: user.id
                }
            }).then(function(){
                req.flash('loginMessage', "login.first_connection.success");
                res.redirect('/login');
            });
        }

    }).catch(function(err){
        req.flash('loginMessage', err.message);
        res.redirect('/login');
    });
});

// Affichage de la page reset_password
router.get('/reset_password', block_access.loginAccess, function(req, res) {
    res.render('login/reset_password', {
        message: req.flash('loginMessage')
    });
});

// Reset password, Generate token, insert into DB, send email
router.post('/reset_password', block_access.loginAccess, function(req, res) {
    var login_user = req.body.login;
    var given_mail = req.body.mail;

    function resetPasswordProcess(idUser, email) {
        // Create unique token and insert into user
        var token = crypto.randomBytes(64).toString('hex');

        models.E_user.update({
            f_token_password_reset: token
        }, {
            where: {
                id: idUser
            }
        }).then(function(){
            // Send email with generated token
            mail.sendMailResetPassword({
                email: given_mail,
                token: token
            }).then(function(success) {
                res.render('login/reset_password', {
                    message: "login.reset_password.successMail"
                });
            }).catch(function(err) {
                // Remove inserted value in user to avoid zombies
                models.E_user.update({
                    f_token_password_reset: null
                }, {
                    where: {
                        id: idUser
                    }
                }).then(function(){
                    res.render('login/reset_password', {
                        message: err.message
                    });
                });
            });
        }).catch(function(err){
            res.render('login/reset_password', {
                message: err.message
            });
        });
    }

    models.E_user.findOne({
        where: {
            f_login: login_user,
            f_email: given_mail
        }
    }).then(function(user){
        if(user){
            resetPasswordProcess(user.id, user.email);
        }
        else{
            res.render('login/reset_password', {
                message: "login.reset_password.userNotExist"
            });
        }
    }).catch(function(err){
        res.render('login/reset_password', {
            message: err.message
        });
    });
});

// Trigger password reset
router.get('/reset_password/:token', block_access.loginAccess, function(req, res) {

    models.E_user.findOne({
        where: {
            f_token_password_reset: req.params.token
        }
    }).then(function(user){
        if(!user){
            res.render('login/reset_password', {
                message: "login.reset_password.cannotFindToken"
            });
        }
        else{
            models.E_user.update({
                f_password: null,
                f_token_password_reset: null,
                f_enabled: 0
            }, {
                where: {
                    id: user.id
                }
            }).then(function(){
                // Redirect to firt connection page
                res.render('login/first_connection', {
                    message: "login.reset_password.success"
                });
            });
        }
    }).catch(function(err){
        res.render('login/reset_password', {
            message: err.message
        });
    });
});

// =====================================
// LOGOUT ==============================
// =====================================
router.get('/logout', function(req, res) {
    req.session.autologin = false;
    req.logout();
    res.redirect('/login');
});

module.exports = router;