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

	const user = await models.User.findOne({
		where: {
			login: login.toLowerCase()
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

	const dataColumnName = models.sequelize.options.dialect == 'postgres' ? 'sess' : 'data';
	const sessionIDCol = models.sequelize.options.dialect == 'postgres' ? 'sid' : 'session_id';
	// Check if current user is already connected
	const sessions = await models.sequelize.query("SELECT "+sessionIDCol+", "+dataColumnName+" FROM sessions", {type: models.sequelize.QueryTypes.SELECT});
	let currentSession, sessionID;
	for (var i = 0; i < sessions.length; i++) {
		sessionID = sessions[i][sessionIDCol];
		currentSession = sessions[i][dataColumnName];

		if(typeof sessions[i][dataColumnName] === "string")
			currentSession = JSON.parse(sessions[i][dataColumnName]);

		if(typeof currentSession.passport !== "undefined"
				&& typeof currentSession.passport.user !== "undefined"
				&& currentSession.cookie.expires
				&& moment().isBefore(currentSession.cookie.expires) // Not counting expired session
				&& currentSession.passport.user.id == user.id
				&& currentSession.isgenerator){
			console.log("USER ALREADY LOGGED IN:", currentSession.passport.user.login);
			await models.sequelize.query("DELETE FROM sessions WHERE "+sessionIDCol+" = '"+sessionID+"';", {type: models.sequelize.QueryTypes.DELETE});
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