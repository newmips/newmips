var models = require('../models/');
var SessionStore = require('express-mysql-session');
var dbconfig = require('../config/database');
var options = {
	host: dbconfig.connection.host,
	port: dbconfig.connection.port,
	user: dbconfig.connection.user,
	password: dbconfig.connection.password,
	database: dbconfig.connection.database
};
var sessionStore = new SessionStore(options);

// route middleware to make sure
exports.isLoggedIn = function(req, res, next) {

	var sessionID = req.params.sessionID;
	sessionStore.get(req.sessionID, function(err, info) {
		models.User.findOne({
			where: {
				id: info.passport.user.id
			},
			include: [{
				model: models.Role
			}]
		}).then(function(user) {
			req.session.data = user ;
			// Store url in case of internal navigation in iframe
			if (req.params.iframe != 'true') {
				if (req.headers["x-requested-with"] != 'XMLHttpRequest') {
				    //is not ajax request
						req.session.iframe_url = req.protocol + '://' + req.get('host') + req.originalUrl;
				}
			}
			return next();
		});
	});

};

//If the user is already identified, he can't access the login page
exports.loginAccess = function(req, res, next) {
	// if user is not authenticated in the session, carry on
	if (!req.isAuthenticated()){
		return next();
	}
	res.redirect('/default/home');
};

// test if connected user is admin
exports.isAdmin = function(req, res, next) {
  var id_role = req.session.data.id_role;
	if (id_role == 1 ){
		return next();
	}
  res.redirect("/default/unauthorized");
};
