// Route middleware to make sure
exports.isLoggedIn = function(req, res, next) {
	// If user is authenticated in the session, carry on
	if (req.isAuthenticated()){
		return next();
	}
	req.session.redirect_to = req.protocol + '://' + req.get('host') + req.originalUrl;
	// If they aren't redirect them to the home page
	res.redirect('/login');
};

//If the user is already identified, he can't access the login page
exports.loginAccess = function(req, res, next) {
	// If user is not authenticated in the session, carry on
	if (!req.isAuthenticated()){
		return next();
	}
	res.redirect('/default/home');
};

// Test if connected user is admin
exports.isAdmin = function(req, res, next) {
  var id_profile = req.session.data["id_profile"];
	if (id_profile == 1 ){
		return next();
	}
  res.redirect("/default/unauthorized");
};
