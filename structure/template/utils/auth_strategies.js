var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');

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
            // if the user doesn't exist
            if (!user)
                return done(null, false, req.flash('loginMessage', 'Nom d\'utilisateur inexistant.'));

            // if the user has no password
            if (user.f_password == "" || user.f_password == null)
                return done(null, false, req.flash('loginMessage', 'Compte non activé - Mot de passe manquant'));

            // if the user has no password
            if (user.f_enabled == 0 || user.f_enabled == null)
                return done(null, false, req.flash('loginMessage', 'Compte non activé'));

            // if the user is found but the password is wrong
            if (!bcrypt.compareSync(password_user, user.f_password))
                return done(null, false, req.flash('loginMessage', 'Mauvais mot de passe.'));
            else {
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

exports.passport = passport;