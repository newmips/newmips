var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var auth = require('../utils/authStrategies');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mail = require('../utils/mailer');
var slack_conf = require('../config/slack');
var Curl = require('node-libcurl').Curl;
var slack = require('slack');
var querystring = require('querystring');

// Winston logger
var logger = require('../utils/logger');

// Gitlab
var globalConf = require('../config/global.js');
var gitlabConf = require('../config/gitlab.json');

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
    console.log("Please set doGit in config/gitlab.json to false");
}

//Sequelize
var models = require('../models/');

/* GET home page. */
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
                $or: [{password: ""}, {password: null}]
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
                            res.redirect('/first_connection');
                        } else{
                            models.User.update({
                                password: password,
                                email: email_user
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
                            console.log("Please set doGit in config/gitlab.json to false");
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
                res.redirect('/');
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

// Trigger password reset
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

    var redirect = req.params.redirect;
    if (typeof redirect === 'undefined') {
        redirect = "/default/home";
    }

    res.render('login/login', {
        redirect: redirect
    });
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
                            message: "Erreur, impossible de se connecter au compte Gitlab. Veuillez desactiver doGit dans config/gitlab.json si vous ne souhaitez pas utiliser Gitlab.",
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

/****
 * Code for creating a channel when private channels are used in SlackChat.
 * The API Token used must be that of a user with Create permissions.
 */
router.post('/set_slack', block_access.isLoggedIn, function (req, res) {

    var curl = new Curl(),
        close = curl.close.bind(curl);

    var channelName = req.body.channelName;
    var invitedUsers = [];

    if (req.body.invitedUsers != null) {
        invitedUsers = JSON.parse(req.body.invitedUsers);
    }

    /* Define the payload to be sent to Slack to create the channel */
    var payLoad = {
        "token": slack_conf.SLACK_API_USER_TOKEN,
        "name": channelName
    };

    /* The return array to be sent to slackChat client */
    var returnArr = {
        "ok": false,
        "data": "",
        "err": ""
    };

    var cpt = 0;

    function done() {
        cpt++;
        if (cpt == invitedUsers.length + 1) {
            res.json(returnArr);
        }
    }

    payLoad = querystring.stringify(payLoad);

    try {
        /* Send the request to Slack API */
        curl.setOpt(Curl.option.URL, slack_conf.SLACK_API_URL);
        curl.setOpt(Curl.option.HEADER, "0");
        curl.setOpt(Curl.option.POSTFIELDS, payLoad);
        curl.setOpt(Curl.option.SSL_VERIFYPEER, false);

        curl.perform();

        curl.on('end', function (statusCode, slackData) {
            slackData = JSON.parse(slackData);
            if (slackData.ok == true) {
                console.log("Channel Slack created : " + slackData.channel.name);
                /* Channel created or joined. Return the channel ID */
                returnArr.data = {"id": slackData.channel.id};

                var user;
                /* Invite users to join the #Slack channel created */
                for (var i = 0; i < invitedUsers.length; i++) {
                    user = invitedUsers[i];

                    var payLoadInvite = {
                        "token": slack_conf.SLACK_API_USER_TOKEN,
                        "channel": slackData.channel.id,
                        "user": user
                    };

                    payLoadInvite = querystring.stringify(payLoadInvite);

                    var curl = new Curl(),
                            close = curl.close.bind(curl);

                    curl.setOpt(Curl.option.URL, slack_conf.SLACK_API_INVITE_URL);
                    curl.setOpt(Curl.option.HEADER, "0");
                    curl.setOpt(Curl.option.POSTFIELDS, payLoadInvite);
                    curl.setOpt(Curl.option.SSL_VERIFYPEER, false);

                    curl.perform();

                    curl.on('end', function (statusCode, slackDataInvite) {
                        slackDataInvite = JSON.parse(slackDataInvite);
                        if (!slackDataInvite.ok) {
                            console.log("Failed to invite user: " + user);
                            console.log(slackDataInvite);
                        }
                        this.close();
                        done();
                    });
                }
                returnArr.ok = true;
                this.close();
            }
            done();
        });
    } catch (e) {
        console.log(e);
        res.json(returnArr);
    }
});

module.exports = router;