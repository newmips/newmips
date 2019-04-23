const moment = require('moment');
const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const auth = require('../utils/auth_strategies');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mailer = require('../utils/mailer');
const svgCaptcha = require('svg-captcha');
const models = require('../models/');

// =====================================
// HOME PAGE (with login links) ========
// =====================================

/* GET home page. */
router.get('/', function(req, res) {
    res.redirect('/login');
});

// Route used to redirect to set_status when submitting comment modal
router.post('/status_comment', block_access.isLoggedIn, function(req, res) {
    res.redirect('/'+req.body.parentName+'/set_status/'+req.body.parentId+'/'+req.body.field+'/'+req.body.statusId+'?comment='+encodeURIComponent(req.body.comment));
});

// =====================================
// LOGIN ===============================
// =====================================
router.get('/login', block_access.loginAccess, function(req, res) {

    let message, captcha;
    if(typeof req.session.flash !== "undefined"
        && typeof req.session.flash.error !== "undefined"
        && req.session.flash.error.length != 0)
        message = req.session.flash.error[0];

    delete req.session.flash;

    if(req.session.loginAttempt >= 5){
        let loginCaptcha = svgCaptcha.create({
            size: 4, // size of random string
            ignoreChars: '0oO1iIlL', // filter out some characters
            noise: 1, // number of noise lines
            color: false,
            width: 500
        });
        req.session.loginCaptcha = loginCaptcha.text;
        captcha = loginCaptcha.data;
    }

    res.render('login/login', {
        message: message,
        captcha: captcha
    });
});

router.post('/login', auth.isLoggedIn, function(req, res) {

    if (req.body.remember)
        req.session.cookie.expires = false; // Unlimited
    else
        req.session.cookie.expires = 120 * 60 * 1000; // 2h

    res.redirect("/default/home");
});

router.get('/refresh_login_captcha', function(req, res) {
    let captcha = svgCaptcha.create({
        size: 4,
        ignoreChars: '0oO1iIlL',
        noise: 1,
        color: false,
        width: "500"
    });
    req.session.loginCaptcha = captcha.text;
    res.status(200).send(captcha.data);
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
        } else if (user.f_password != "" && user.f_password != null){
            req.flash('loginMessage', "login.first_connection.alreadyHavePassword");
            res.redirect('/login');
        } else {
            var password = bcrypt.hashSync(req.body.password_user2, null, null);

            user.update({
                f_password: password,
                f_enabled: 1
            }).then(() => {
                models.E_user.findOne({
                    where: {id: user.id},
                    include: [{
                        model: models.E_group,
                        as: 'r_group'
                    }, {
                        model: models.E_role,
                        as: 'r_role'
                    }]
                }).then(function(user) {
                    req.login(user, (err) => {
                        if (err) {
                            console.error(err);
                            req.flash('loginMessage', "login.first_connection.success");
                            return res.redirect('/login');
                        }
                        req.session.toastr = [{
                            message: "login.first_connection.success2",
                            level: "success"
                        }];
                        res.redirect('/default/home');
                    })
                })
            })
        }
    }).catch(function(err){
        req.flash('loginMessage', err.message);
        res.redirect('/login');
    })
})

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

    function resetPasswordProcess(user) {
        // Create unique token and insert into user
        var token = crypto.randomBytes(64).toString('hex');

        models.E_user.update({
            f_token_password_reset: token
        }, {
            where: {
                id: user.id
            }
        }).then(function(){
            // Send email with generated token
            var mailOptions = {
                data: {
                    href: mailer.config.host + '/reset_password/' + token,
                    user: user
                },
                from: mailer.config.expediteur,
                to: given_mail,
                subject: 'Newmips, modification de mot de passe'
            }
            mailer.sendTemplate('mail_reset_password', mailOptions).then(function() {
                res.render('login/reset_password', {
                    message: "login.reset_password.successMail"
                });
            }).catch(function(err) {
                // Remove inserted value in user to avoid zombies
                models.E_user.update({f_token_password_reset: null}, {where: {id: user.id}}).then(function(){
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
            resetPasswordProcess(user);
        } else {
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
