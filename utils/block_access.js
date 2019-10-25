var models = require('../models/');
// Route middleware to make sure if user is identified
exports.isLoggedIn = function(req, res, next) {
    // If user is authenticated in the session, carry on
    if (req.isAuthenticated()){
        return next();
    } else {
        res.redirect('/login');
    }
};

// Route middleware to make sure if user is identified
exports.isAdmin = function(req, res, next) {
    // If user is authenticated in the session, carry on
    if (req.isAuthenticated()){
        if(req.session.passport.user.id_role == 1)
            return next();
        else {
            req.session.toastr = [{
                message: "action.no_access_admin",
                level: "error"
            }];
            return res.redirect('/');
        }
    } else {
        res.redirect('/login');
    }
};

// Check access to specific application
exports.hasAccessApplication = function(req, res, next) {
    let app_name = null;
    if(req.params.app_name)
        app_name = req.params.app_name
    else
        app_name = req.session.app_name ? req.session.app_name : null;

    if (req.isAuthenticated()){
        models.User.findOne({
            where: {
                id: req.session.passport.user.id
            },
            include: [{
                model: models.Application,
                required: true,
                where: {
                    name: app_name
                }
            }]
        }).then(user => {
            if(!user){
                req.session.toastr = [{
                    message: "application.no_access",
                    level: "error"
                }];
                return res.redirect('/');
            }
            return next();
        })
    } else {
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