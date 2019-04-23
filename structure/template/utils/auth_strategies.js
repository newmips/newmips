const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt-nodejs');
const models = require('../models/');

// Default authentication strategy : passport.authenticate('local')
// =========================================================================
// IS LOGGED IN ============================================================
// =========================================================================
passport.use(new LocalStrategy({
        usernameField: 'login_user',
        passwordField: 'password_user',
        passReqToCallback: true // Allows us to pass back the entire request to the callback
    },
    function(req, login_user, password_user, done) {

        models.E_user.findOne({
            where: {f_login: login_user},
            include: [{
                model: models.E_group,
                as: 'r_group'
            }, {
                model: models.E_role,
                as: 'r_role'
            }]
        }).then(function(user) {

            function accessForbidden(msg){
                if(!req.session.loginAttempt)
                    req.session.loginAttempt = 0;
                req.session.loginAttempt++;
                return done(null, false, req.flash('error', msg));
            }

            // Wrong captcha
            if(typeof req.session.loginCaptcha !== "undefined" && req.session.loginCaptcha != req.body.captcha)
                return accessForbidden("Le captcha saisi n'est pas correct.");

            // If the user doesn't exist
            if (!user)
                return accessForbidden("Nom d'utilisateur inexistant.");

            // If the user has no password
            if (user.f_password == "" || user.f_password == null)
                return accessForbidden('Compte non activé - Mot de passe manquant');

            // If the user has no password
            if (user.f_enabled == 0 || user.f_enabled == null)
                return accessForbidden('Compte non activé');

            // If the user is found but the password is wrong
            if (!bcrypt.compareSync(password_user, user.f_password))
                return accessForbidden('Mauvais mot de passe.');
            else {
                // Access authorized
                delete req.session.loginAttempt;
                return done(null, user);
            }
        });
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
    badRequestMessage: "Des informations sont manquantes.",
    failureFlash: true
});

exports.passport = passport;