var models = require('../models/');
var dbconfig = require('../config/database');
var access = require('../config/access.json');

// route middleware to make sure
exports.isLoggedIn = function(req, res, next) {
	// Autologin for newmips's "iframe" live preview context
	if (req.session.autologin == true)
		models.E_user.findById(1).then(function(user) {
			req.session.passport = {user: user};
			return next();
		});
	else if (req.isAuthenticated())
		return next();
	else
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

// Check if user's group have access to module
exports.moduleAccess = function(userGroup, moduleName) {
	try {
		for (var module in access) {
			if (module == moduleName) {
				if (access[module].groups.indexOf(userGroup) == -1)
					return true;
				return false;
			}
		}
		return false;
	} catch(e) {
		return false;
	}
}

// Check if user's group have access to entity
exports.entityAccess = function(userGroup, entityName) {
	try {
		for (var module in access) {
			var moduleEntities = access[module].entities;
			for (var i = 0; i < moduleEntities.length; i++) {
				if (moduleEntities[i].name == entityName) {
					if (moduleEntities[i].groups.indexOf(userGroup) == -1)
						return true;
					return false;
				}
			}
		}
		return false;
	} catch(e) {
		return false;
	}
}

// Check if user's role can do `action` on entity
exports.actionAccess = function(userRole, entityName, action) {
	try {
		for (var module in access) {
			var moduleEntities = access[module].entities;
			for (var i = 0; i < moduleEntities.length; i++) {
				if (moduleEntities[i].name == entityName) {
					if (moduleEntities[i].actions[action].indexOf(userRole) == -1)
						return true;
					return false;
				}
			}
		}
		return false;
	} catch(e) {
		return false;
	}
}