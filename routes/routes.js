var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var auth = require('../utils/authStrategies');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mail = require('../utils/mailer');
var slack_conf = require('../config/slack');
var Slack = require('slack');
var slackbot = new Slack({token: slack_conf.SLACK_API_USER_TOKEN})

// Winston logger
var logger = require('../utils/logger');

// Gitlab
var globalConf = require('../config/global.js');
var gitlabConf = require('../config/gitlab.js');
try{
    if(gitlabConf.doGit){
        // Gitlab connection
        var gitlab = require('gitlab')({
            url:   gitlabConf.protocol+"://"+gitlabConf.url,
            token: gitlabConf.privateToken
        });
    }
} catch(err){
    console.log("Error connection Gitlab repository: "+err);
    console.log("Please set doGit in config/gitlab.js to false");
}

//Sequelize
var models = require('../models/');

router.get('/', block_access.loginAccess, function(req, res) {
    res.redirect('/login');
});

router.get('/first_connection', block_access.loginAccess, function(req, res) {
    var params = {
        login: "",
        email: ""
    };
    if(typeof req.query.login !== "undefined")
        params.login = req.query.login;
    if(typeof req.query.email !== "undefined")
        params.email = req.query.email;
    res.render('login/first_connection', params);
});

router.post('/first_connection', block_access.loginAccess, function(req, res, done) {
    var login_user = req.body.login_user;
    var email_user = req.body.email_user;
    var usernameGitlab = email_user.replace(/\@/g, "").replace(/\./g, "").trim();

    if(req.body.password_user == req.body.password_user2 && req.body.password_user.length >= 8){

        var password = bcrypt.hashSync(req.body.password_user2, null, null);

        models.User.findOne({
            where: {
                login: login_user,
                $or: [{password: ""}, {password: null}],
                enabled: false
            }
        }).then(function(user){
            if(user){
                if(user.password == "" || user.password == null){

                    var gitlabError = {
                        status : false
                    };

                    function done(){
                        if(gitlabError.status){
                            req.session.toastr = [{
                                message: gitlabError.message,
                                level: "error"
                            }];
                            res.redirect('/first_connection?login='+login_user+'&email='+email_user);
                        } else{
                            models.User.update({
                                password: password,
                                email: email_user,
                                enabled: 1
                            }, {
                                where: {
                                    id: user.id
                                }
                            }).then(function(){
                                // Autologin after first connection form done
                                models.User.findOne({
                                    where: {
                                        id: user.id
                                    }
                                }).then(function(connectedUser){
                                    req.login(connectedUser, function(err) {
                                        if (err) {
                                            console.log(err);
                                            res.redirect('/login');
                                        } else{
                                            req.session.showytpopup = true;
                                            res.redirect('/default/home');
                                        }
                                    });
                                });
                            });
                        }
                    }

                    // Create user in gitlab
                    if(gitlabConf.doGit){
                        try{
                            gitlab.users.all(function(gitlabUsers){
                                var exist = false;
                                for(var i=0; i<gitlabUsers.length; i++){
                                    if(gitlabUsers[i].email == email_user){
                                        exist = true;
                                    }
                                }

                                var userToCreate = {
                                    email: email_user,
                                    password: req.body.password_user2,
                                    username: usernameGitlab,
                                    name: email_user,
                                    website_url: globalConf.host,
                                    admin: false,
                                    confirm: false
                                };

                                if(!exist){
                                    gitlab.users.create(userToCreate, function(result){
                                        if(typeof result === "object"){
                                            req.session.gitlab = {};
                                            req.session.gitlab.user = result;
                                        } else{
                                            console.log(userToCreate);
                                            console.log("Error while creating the user on gitlab.");
                                            // Winston log file
                                            logger.debug("Error while creating the user on gitlab.");

                                            gitlabError = {
                                                status : true,
                                                message: "Error while creating the user on gitlab."
                                            };
                                        }
                                        done();
                                    });
                                } else{
                                    gitlabError = {
                                        status : true,
                                        message: "User already exist on gitlab: " + userToCreate.email
                                    };
                                    // Winston log file
                                    logger.debug("User already exist on gitlab: " + userToCreate.email);
                                    console.log("User already exist on gitlab: " + userToCreate.email);
                                    done();
                                }
                            });
                        } catch(err){
                            gitlabError = {
                                status : true,
                                message: "Error connection Gitlab repository: " + err
                            };
                            console.log("Error connection Gitlab repository: "+err);
                            console.log("Please set doGit in config/gitlab.js to false");
                            done();
                        }
                    } else{
                        done();
                    }
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
            console.log(err);
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
        res.redirect('/first_connection?login='+login_user+'&email='+email_user);
    }
});

router.get('/reset_password', block_access.loginAccess, function(req, res) {
    res.render('login/reset_password');
});

// Reset password - Generate token, insert into DB, send email
router.post('/reset_password', block_access.loginAccess, function(req, res) {
    // Check if user with login + email exist in DB
    models.User.findOne({
        where: {
            login: req.body.login,
            email: req.body.mail
        }
    }).then(function(user){
        if(!user){
            req.session.toastr = [{
                message: "login.first_connection.userNotExist",
                level: "error"
            }];
            return res.render('login/reset_password');
        }

        // Create unique token and insert into user
        var token = crypto.randomBytes(64).toString('hex');

        models.User.update({
            token_password_reset: token
        }, {
            where: {
                id: user.id
            }
        }).then(function(){
            // Send email with generated token
            mail.sendMail_Reset_Password({
                mail_user: user.email,
                token: token
            }).then(function(success) {
                req.session.toastr = [{
                    message: "login.emailResetSent",
                    level: "success"
                }];
                res.redirect('/');
            }).catch(function(err) {
                // Remove inserted value in user to avoid zombies
                models.User.update({
                    token_password_reset: null
                }, {
                    where: {
                        id: user.id
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
    }).catch(function(err){
        req.session.toastr = [{
            message: err.message,
            level: "error"
        }];
        res.render('login/reset_password');
    })
})

router.get('/reset_password_form/:token', block_access.loginAccess, function(req, res) {

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
                password: null
            }, {
                where: {
                    id: user.id
                }
            }).then(function(){
                var params = {
                    resetUser: user
                };
                res.render('login/reset_password_form', params);
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

router.post('/reset_password_form', block_access.loginAccess, function(req, res) {

    var login_user = req.body.login_user;
    var email_user = req.body.email_user;

    models.User.findOne({
        where: {
            login: login_user,
            email: email_user,
            $or: [{password: ""}, {password: null}]
        }
    }).then(function(user){
        if(req.body.password_user == req.body.password_user2 && req.body.password_user.length >= 8){
            var password = bcrypt.hashSync(req.body.password_user2, null, null);
            if(user){
                if(user.password == "" || user.password == null){
                    models.User.update({
                        password: password,
                        token_password_reset: null
                    }, {
                        where: {
                            id: user.id
                        }
                    }).then(function(){
                        // Autologin after first connection form done
                        models.User.findOne({
                            where: {
                                id: user.id
                            }
                        }).then(function(connectedUser){
                            req.login(connectedUser, function(err) {
                                if (err) {
                                    console.log(err);
                                    req.session.toastr = [{
                                        message: err.message,
                                        level: "error"
                                    }];
                                    res.redirect('/login');
                                } else{
                                    req.session.toastr = [{
                                        message: "login.passwordReset",
                                        level: "success"
                                    }];
                                    res.redirect('/default/home');
                                }
                            });
                        });
                    });
                } else{
                    req.session.toastr = [{
                        message: "login.first_connection.hasAlreadyPassword",
                        level: "error"
                    }];
                    res.redirect('/login');
                }
            } else{
                req.session.toastr = [{
                    message: "login.first_connection.userNotExist",
                    level: "error"
                }];
                res.redirect('/login');
            }
        } else{
            req.session.toastr = [{
                message: "login.first_connection.passwordNotMatch",
                level: "error"
            }];
            res.redirect('/reset_password_form/'+user.token_password_reset);
        }
    }).catch(function(err){
        req.session.toastr = [{
            message: err.message,
            level: "error"
        }];
        res.redirect('/login');
    });
});

router.get('/login', block_access.loginAccess, function(req, res) {
    res.render('login/login');
});

// Process the login form
router.post('/login', auth.isLoggedIn, function(req, res) {

    if (req.body.remember)
        req.session.cookie.maxAge = 1000 * 60 * 3;
    else
        req.session.cookie.expires = false;

    var email_user = req.session.passport.user.email;

    // Get gitlab instance
    if(gitlabConf.doGit){
        if(typeof req.session.gitlab === "undefined"){
            try{
                gitlab.users.all(function(gitlabUsers){
                    var exist = false;
                    for(var i=0; i<gitlabUsers.length; i++){
                        if(gitlabUsers[i].email == email_user){
                            exist = true;
                            req.session.gitlab = {};
                            req.session.gitlab.user = gitlabUsers[i];
                        }
                    }

                    if(!exist){
                        req.session.toastr = [{
                            message: "Erreur, impossible de se connecter au compte Gitlab. Veuillez desactiver doGit dans config/gitlab.js si vous ne souhaitez pas utiliser Gitlab.",
                            level: "error"
                        }];
                        res.redirect('/logout');
                    } else{
                        res.redirect('/default/home');
                    }
                });
            } catch(err){
                req.session.toastr = [{
                    message: err.message,
                    level: "error"
                }];
                res.redirect('/logout');
            }
        } else{
            res.redirect('/default/home');
        }
    } else{
        res.redirect('/default/home');
    }
});

// Logout
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});

router.post('/set_slack', block_access.isLoggedIn, function(req, res) {
    try {
        var slackData = {};
        var invitedUsers = [];
        if (req.body.invitedUsers != null) {
            invitedUsers = JSON.parse(req.body.invitedUsers);
        }
        async function doSlackInvite() {
            slackData = await slackbot.channels.join({
                name: req.body.channelName
            });
            /* Invite users to join the #Slack channel created */
            for (var i = 0; i < invitedUsers.length; i++) {
                await slackbot.channels.invite({
                    channel: slackData.channel.id,
                    user: invitedUsers[i]
                });
            }
        }

        doSlackInvite().then(function() {
            res.json({
                ok: true,
                data: {
                    id: slackData.channel.id
                }
            });
        }).catch(function(err) {
            console.log(err);
            res.json({
                ok: false
            });
        })
    } catch (err) {
        console.log(err);
        res.json({
            ok: false
        });
    }
});

module.exports = router;