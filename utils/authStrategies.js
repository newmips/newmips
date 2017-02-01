var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

// load up the user model
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var login = "";

//Sequelize
var models = require('../models/');

// Default authentication strategy : passport.authenticate('local')
// =========================================================================
// IS LOGGED IN ============================================================
// =========================================================================
passport.use(new LocalStrategy({
        usernameField: 'login_user',
        passwordField: 'password_user',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, login_user, password_user, done) {

        models.User.findOne({
            where: {
                login: login_user
            }
        }).then(function(user) {

            // if the user doesn't exist
            if (!user) {
                return done(null, false, req.flash('loginMessage', 'Nom d\'utilisateur inexistant.'));
            }

            // if the user has no password
            if (user.password == "") {
                return done(null, false, req.flash('loginMessage', 'Compte non activé'));
            }

            // if the user is found but the password is wrong
            if (!bcrypt.compareSync(password_user, user.password)) {
                return done(null, false, req.flash('loginMessage', 'Mauvais mot de passe.'));
            }
            else{
                req.session.data = user;
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
    failureFlash: true
});

exports.passwordChangeCheck = passport.authenticate('new-password-check', {
    failureRedirect: '/profile/update_password_form',
    failureFlash: true
});