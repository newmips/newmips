var models = require('../models/');
var dbconfig = require('../config/database');

// route middleware to make sure
exports.isLoggedIn = function(req, res, next) {
	// Autologin for newmips's "iframe" live preview context
	if (req.session.autologin == true)
		return next();

	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/login');
};

//If the user is already identified, he can't access the login page
exports.loginAccess = function(req, res, next) {
	// if user is not authenticated in the session, carry on
	if (!req.isAuthenticated()){
		return next();
	}
	res.redirect('/default/home');
};