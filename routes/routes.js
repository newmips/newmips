var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var auth = require('../utils/authStrategies');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mail = require('../utils/mailer');

// Gitlab
var globalConf = require('../config/global.js');
var gitlabConf = require('../config/gitlab.json');

try{
    if(gitlabConf.doGit){
        // Gitlab connection
        var gitlab = require('gitlab')({
            url:   gitlabConf.url,
            token: gitlabConf.privateToken
        });
    }
} catch(err){
    console.log("Error connection Gitlab repository: "+err);
    console.log("Please set doGit in config/gitlab.json to false");
}

//Sequelize
var models = require('../models/');

// =====================================
// HOME PAGE (with login links) ========
// =====================================
// =====================================
// LOGIN ===============================
// =====================================

/* GET home page. */
router.get('/', block_access.loginAccess, function(req, res) {
    res.redirect('/login');
});

router.get('/first_connection', block_access.loginAccess, function(req, res) {
    res.render('login/first_connection');
});

router.post('/first_connection', block_access.loginAccess, function(req, res, done) {
    var login_user = req.body.login_user;
    var email_user = req.body.email_user;

    if(req.body.password_user == req.body.password_user2){

        var password = bcrypt.hashSync(req.body.password_user2, null, null);

        models.User.findOne({
            where: {
                login: login_user,
                $or: [{password: ""}, {password: null}]
            }
        }).then(function(user){
            if(user){
                if(user.password == "" || user.password == null){

                    // Create user in gitlab
                    if(gitlabConf.doGit){

                        try{
                            gitlab.users.all(function(gitlabUsers){
                                console.log(gitlabUsers);
                                var exist = false;
                                for(var i=0; i<gitlabUsers.length; i++){
                                    if(gitlabUsers[i].email == email_user){
                                        exist = true;
                                        req.session.gitlab.user = gitlabUsers[i];
                                    }
                                }
                                console.log("Exist:", exist);
                                if(!exist){
                                    var userToCreate = {
                                        email: email_user,
                                        password: req.body.password_user2,
                                        username: email_user,
                                        name: email_user,
                                        website_url: globalConf.host,
                                        admin: false,
                                        confirm: false
                                    };
                                    console.log(userToCreate);

                                    gitlab.users.create(userToCreate, function(result){
                                        console.log(result);
                                    });
                                }
                            });
                        } catch(err){
                            console.log("Error connection Gitlab repository: "+err);
                            console.log("Please set doGit in config/gitlab.json to false");
                        }
                    }

                    models.User.update({
                        password: password,
                        email: email_user
                    }, {
                        where: {
                            login: login_user
                        }
                    }).then(function(){
                        req.session.toastr = [{
                            message: "login.first_connection.success",
                            level: "success"
                        }];
                        res.redirect('/login');
                    });
                }
                else{
                    req.session.toastr = [{
                        message: "login.first_connection.hasAlreadyPassword",
                        level: "error"
                    }];
                }
            }
            else{
                req.session.toastr = [{
                    message: "login.first_connection.userNotExist",
                    level: "error"
                }];

                res.redirect('/login');
            }
        }).catch(function(err){
            req.session.toastr = [{
                message: err.message,
                level: "error"
            }];
            res.redirect('/login');
        });

    } else{
        req.session.toastr = [{
            message: "login.first_connection.passwordNotMatch",
            level: "error"
        }];
        res.redirect('/first_connection');
    }
});

// Affichage de la page reset_password
router.get('/reset_password', block_access.loginAccess, function(req, res) {
    res.render('login/reset_password');
});

// Reset password
// Generate token, insert into DB, send email
router.post('/reset_password', block_access.loginAccess, function(req, res) {
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
                res.render('login/reset_password');
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
                    res.render('login/reset_password');
                });
            });
        }).catch(function(err){
            req.session.toastr = [{
                message: err.message,
                level: "error"
            }];
            res.render('login/reset_password');
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
        }
        else{
            req.session.toastr = [{
                message: "login.first_connection.userNotExist",
                level: "error"
            }];
            res.render('login/reset_password');
        }
    }).catch(function(err){
        req.session.toastr = [{
            message: err.message,
            level: "error"
        }];
        res.render('login/reset_password');
    });
});

// Trigger password reset
router.get('/reset_password/:token', block_access.loginAccess, function(req, res) {

    models.User.findOne({
        where: {
            token_password_reset: req.params.token
        }
    }).then(function(user){
        if(!user){
            req.session.toastr = [{
                message: "login.tokenNotFound",
                level: "error"
            }];
            res.render('login/reset_password');
        }
        else{
            models.User.update({
                password: null,
                token_password_reset: null
            }, {
                where: {
                    id: user.id
                }
            }).then(function(){
                req.session.toastr = [{
                    message: "login.passwordReset",
                    level: "success"
                }];
                res.render('login/first_connection');
            });
        }
    }).catch(function(err){
        req.session.toastr = [{
            message: err.message,
            level: "error"
        }];
        res.render('login/reset_password');
    });
});

router.get('/login', block_access.loginAccess, function(req, res) {

    var redirect = req.params.redirect;
    if (typeof redirect === 'undefined') {
        redirect = "/default/home";
    }

    res.render('login/login', {
        redirect: redirect
    });
});

// process the login form
router.post('/login', auth.isLoggedIn, function(req, res) {

    var redirect_to = req.session.redirect_to ? req.session.redirect_to : '/default/home';
    delete req.session.redirect_to;

    if (req.body.remember) {
        req.session.cookie.maxAge = 1000 * 60 * 3;
    } else {
        req.session.cookie.expires = false;
    }
    req.session.message = "";
    req.session.error = 0;

    res.redirect(redirect_to);
});

// =====================================
// LOGOUT ==============================
// =====================================
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});

module.exports = router;