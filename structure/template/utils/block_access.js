var models = require('../models/');
var dbconfig = require('../config/database');

// route middleware to make sure
exports.isLoggedIn = function(req, res, next) {

	if (req.isAuthenticated()) {
		if (req.params.iframe != 'true')
			if (req.headers["x-requested-with"] != 'XMLHttpRequest')
				req.session.iframe_url = req.protocol + '://' + req.get('host') + req.originalUrl;
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