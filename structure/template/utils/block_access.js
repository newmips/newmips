var models = require('../models/');
var dbconfig = require('../config/database');

// route middleware to make sure
exports.isLoggedIn = function(req, res, next) {
    // Autologin for newmips's "iframe" live preview context
    if (AUTO_LOGIN == true){
        AUTO_LOGIN = false;
        models.E_user.findOne({
            where: {
                id: 1
            },
            include: [{
                model: models.E_group,
                as: 'r_group'
            }, {
                model: models.E_role,
                as: 'r_role'
            }]
        }).then(function(user) {
            req.login(user,function() {
                return next();
            });
        });
    }
    else if (req.isAuthenticated())
        return next();
    else {
        req.session.rejectedUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        res.redirect('/login');
    }
};

//If the user is already identified, he can't access the login page
exports.loginAccess = function(req, res, next) {
    // if user is not authenticated in the session, carry on
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/default/home');
};

function getAccess() {
    delete require.cache[require.resolve('../config/access.json')]
    return require('../config/access.json');
}
// Check if user's group have access to module
function moduleAccess(userGroup, moduleName) {
    try {
        var access = getAccess();
        for (var module in access) {
            if (module == moduleName) {
                if (access[module].groups.indexOf(userGroup) == -1)
                    return true;
                return false;
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}
exports.moduleAccess = moduleAccess;

exports.moduleAccessMiddleware = function(moduleName) {
    return function(req, res, next) {
        var userGroup = req.session.passport.user.r_group.f_label;
        if (moduleAccess(userGroup, moduleName))
            return next();
        req.session.toastr.push({
            level: 'error',
            'message': "Your Group doesn't have access to this module"
        });
        res.redirect('/default/home');
    }
}

// Check if user's group have access to entity
function entityAccess(userGroup, entityName) {
    try {
        var access = getAccess();
        for (var module in access) {
            var moduleEntities = access[module].entities;
            for (var i = 0; i < moduleEntities.length; i++) {
                if (moduleEntities[i].name == entityName) {
                    // Check if group can access entity AND module to which the entity belongs
                    if (moduleEntities[i].groups.indexOf(userGroup) == -1 &&
                        access[module].groups.indexOf(userGroup) == -1)
                        return true;
                    return false;
                }
            }
        }
        return false;
    } catch (e) {
        return false;
    }
}
exports.entityAccess = entityAccess;

exports.entityAccessMiddleware = function(entityName) {
    return function(req, res, next) {
        var userGroup = req.session.passport.user.r_group.f_label;
        if (entityAccess(userGroup, entityName))
            return next();
        req.session.toastr.push({
            level: 'error',
            'message': "Your Group doesn't have access to this entity"
        });
        res.redirect('/default/home');
    }
}

// Check if user's role can do `action` on entity
function actionAccess(userRole, entityName, action) {
    try {
        var access = getAccess();
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
    } catch (e) {
        return false;
    }
}
exports.actionAccess = actionAccess;

exports.actionAccessMiddleware = function(entityName, action) {
    return function(req, res, next) {
        var userRole = req.session.passport.user.r_role.f_label;
        if (actionAccess(userRole, entityName, action))
            return next();
        req.session.toastr.push({
            level: 'error',
            'message': "Your Role doesn't have access to action " + action + ' on entity ' + entityName
        });
        res.redirect('/default/home');
    }
}

exports.apiAuthentication = function(req, res, next) {
    var token = req.query.token;

    models.E_api_credentials.findOne({
        where: {
            f_token: token
        }
    }).then(function(credentialsObj) {
        if (!credentialsObj)
            return res.status(401).end({
                error: 'Bad Bearer Token'
            });

        var currentTmsp = new Date().getTime();
        if (parseInt(credentialsObj.f_token_timeout_tmsp) < currentTmsp)
            return res.status(403).json({
                error: 'Bearer Token expired'
            });

        next();
    });
}