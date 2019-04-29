const passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt-nodejs');
const models = require('../models/');
const moment = require('moment');

// Default authentication strategy : passport.authenticate('local')
passport.use(new LocalStrategy({
        usernameField: 'login_user',
        passwordField: 'password_user',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    async (req, login, password, done) => {

        let user = await models.User.findOne({
            where: {
                login: login
            }
        })

        // If the user doesn't exist
        if (!user) {
            req.session.toastr = [{
                message: "Cet utilisateur n'existe pas.",
                level: "error"
            }];
            return done(null, false);
        }

        // If the user has no password
        if (user.password == "" || user.password == null) {
            req.session.toastr = [{
                message: "Compte non activé.",
                level: "error"
            }];
            return done(null, false);
        }

        // If the user is found but the password is wrong
        if (!bcrypt.compareSync(password, user.password)) {
            req.session.toastr = [{
                message: "Mauvais mot de passe.",
                level: "error"
            }];
            return done(null, false);
        }

        // Check if current user is already connected
        let sessions = await models.sequelize.query("SELECT session_id, data FROM sessions", {type: models.sequelize.QueryTypes.SELECT});
        let currentSession;
        for (var i = 0; i < sessions.length; i++) {
            currentSession = JSON.parse(sessions[i].data);

            if(typeof currentSession.passport !== "undefined"
                && typeof currentSession.passport.user !== "undefined"
                && moment(currentSession.cookie.expires).diff(moment()) > 0 // Not counting expired session
                && currentSession.passport.user.id == user.id){
                req.session.toastr = [{
                    message: "Cet utilisateur est déjà connecté.",
                    level: "error"
                }];
                return done(null, false);
            }
        }

        return done(null, user);
    }
));

passport.serializeUser(function(user_id, done) {
    done(null, user_id);
});

passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});

exports.isLoggedIn = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
});

exports.passwordChangeCheck = passport.authenticate('new-password-check', {
    failureRedirect: '/profile/update_password_form',
    failureFlash: true
});