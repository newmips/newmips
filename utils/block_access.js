// route middleware to make sure if user is identified
exports.isLoggedIn = function(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated()){
		return next();
	}
	else{
		req.session.redirect_to = req.protocol + '://' + req.get('host') + req.originalUrl;
		// if they aren't redirect them to the home page
		res.redirect('/login');
	}
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
  var id_profile = req.session.data["id_profile"];
	if (id_profile == 1 ){
		return next();
	}
  res.redirect("/default/unauthorized");
};
