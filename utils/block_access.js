// Route middleware to make sure if user is identified
exports.isLoggedIn = function(req, res, next) {
    // If user is authenticated in the session, carry on
    if (req.isAuthenticated()){
        return next();
    }
    else {
        //req.session.redirect_to = req.protocol + '://' + req.get('host') + req.originalUrl;
        // if they aren't redirect them to the home page
        res.redirect('/login');
    }
};

// If the user is already identified, he can't access the login page
exports.loginAccess = function(req, res, next) {
    // If user is not authenticated in the session, carry on
    if (!req.isAuthenticated())
    	return next();

    res.redirect('/default/home');
};