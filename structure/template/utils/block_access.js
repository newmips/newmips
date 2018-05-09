var models = require('../models/');
var dbconfig = require('../config/database');
var fs = require('fs-extra');

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
    else
        res.redirect('/login');
};

//If the user is already identified, he can't access the login page
exports.loginAccess = function(req, res, next) {
    // if user is not authenticated in the session, carry on
    if (!req.isAuthenticated())
        return next();

    res.redirect('/default/home');
};

function getAccess() {
    var access;
    try {
        access = JSON.parse(fs.readFileSync(__dirname+'/../config/access.json', 'utf8'));
    } catch(e) {console.error(e);return {};}
    return access;
}

function isInBothArray(stringArray, objectArray) {
    if (stringArray.length == 0)
        return false;
    var allowedCount = 0;
    for (var j = 0; j < objectArray.length; j++) {
        var isAllowed = true;
        for (var i = 0; i < stringArray.length; i++) {
            if (stringArray[i] == objectArray[j].f_label)
                isAllowed = false;
        }
        if (isAllowed == true)
            allowedCount++;
    }

    if (allowedCount > 0)
        return false
    return true;
}
// Check if user's group have access to module
function moduleAccess(userGroups, moduleName) {
    try {
        var access = getAccess();
        for (var module in access)
            if (module == moduleName)
                if (!isInBothArray(access[module].groups, userGroups))
                    return true;
        return false;
    } catch (e) {
        return false;
    }
}
exports.moduleAccess = moduleAccess;

exports.moduleAccessMiddleware = function(moduleName) {
    return function(req, res, next) {
        if (!req.isAuthenticated())
            return res.redirect('/login');
        if (moduleAccess(req.session.passport.user.r_group, moduleName))
            return next();
        req.session.toastr = [{
            level: 'error',
            'message': "Your Group(s) doesn't have access to this module"
        }];
    }
}

// Check if user's group have access to entity
function entityAccess(userGroups, entityName) {
    try {
        var access = getAccess();
        for (var module in access) {
            var moduleEntities = access[module].entities;
            for (var i = 0; i < moduleEntities.length; i++)
                if (moduleEntities[i].name == entityName) {
                    // Check if group can access entity AND module to which the entity belongs
                    if (!isInBothArray(moduleEntities[i].groups, userGroups)
                    && !isInBothArray(access[module].groups, userGroups)) {
                        return true;
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
        var userGroups = req.session.passport.user.r_group;
        if (entityAccess(userGroups, entityName))
            return next();
        req.session.toastr = [{
            level: 'error',
            'message': "Your Group(s) doesn't have access to this entity"
        }];
        res.redirect('/default/home');
    }
}

// Check if user's role can do `action` on entity
function actionAccess(userRoles, entityName, action) {
    try {
        var access = getAccess();
        for (var module in access) {
            var moduleEntities = access[module].entities;
            for (var i = 0; i < moduleEntities.length; i++)
                if (moduleEntities[i].name == entityName)
                    return !isInBothArray(moduleEntities[i].actions[action], userRoles)
        }
        return false;
    } catch (e) {
        return false;
    }
}
exports.actionAccess = actionAccess;

exports.actionAccessMiddleware = function(entityName, action) {
    return function(req, res, next) {
        var userRoles = req.session.passport.user.r_role;
        if (actionAccess(userRoles, entityName, action))
            return next();
        req.session.toastr = [{
            level: 'error',
            'message': "Your Role(s) doesn't have access to action " + action + ' on entity ' + entityName
        }];
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
            return res.status(401).end('Bad Bearer Token');

        var currentTmsp = new Date().getTime();
        if (parseInt(credentialsObj.f_token_timeout_tmsp) < currentTmsp)
            return res.status(403).json('Bearer Token expired');

        next();
    });
}