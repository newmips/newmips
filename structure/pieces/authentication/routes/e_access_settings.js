var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var access_helper = require('../utils/access_helper');
var dust = require('dustjs-linkedin');

// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Winston logger
var logger = require('../utils/logger');

function error500(err, res) {
    console.error(err);
    logger.debug(err);
    var data = {};
    data.error = 500;
    res.render('common/error', data);
}

router.get('/show', block_access.isLoggedIn, function(req, res) {
    var id_e_user = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_settings",
        sub_menu: "list_e_settings",
        tab: tab
    };

    access_helper.getPreviewData().then(function(values) {
        data.allGroups = values.groups;
        data.allRoles = values.roles;
        data.modules = values.modules;

        dust.helpers.isGroupChecked = function(chunk, context, bodies, params) {
            var currentSource = params.source;
            var currentTarget = params.target;
            if (currentSource.groups.indexOf(currentTarget) == -1)
                return true;
            return false;
        }
        dust.helpers.isActionChecked = function(chunk, context, bodies, params) {
            var currentSource = params.source;
            var currentTarget = params.target;
            var action = params.action;
            if (currentSource.actions[action].indexOf(currentTarget) == -1)
                return true;
            return false;
        }

        res.render('e_access_settings/show', data);
    });
});

router.post('/set_group_access', block_access.isLoggedIn, function(req, res) {
    var form = req.body;
    var newModuleAccess = {}, newEntityAccess = {};
    for (var inputName in form) {
        // Add each not checked input to groups list
        var parts = inputName.split('.');
        if (parts[0] == 'module') {
            if (typeof newModuleAccess[parts[1]] === 'undefined')
                newModuleAccess[parts[1]] = [];
            if (form[inputName] != 'true')
                newModuleAccess[parts[1]].push(parts[2]);
        }
        else if (parts[0] == 'entity') {
            if (typeof newEntityAccess[parts[1]] === 'undefined')
                newEntityAccess[parts[1]] = [];
            if (form[inputName] != 'true')
                newEntityAccess[parts[1]].push(parts[2]);
        }
    }

    access_helper.setGroupAccess(newModuleAccess, newEntityAccess);
    res.redirect('/access_settings/show');
});

router.post('/set_role_access', block_access.isLoggedIn, function(req, res) {
    var form = req.body;
    var newActionRoles = {};
    for (var inputName in form) {
        var parts = inputName.split('.');
        if (typeof newActionRoles[parts[0]] === 'undefined')
            newActionRoles[parts[0]] = {read: [], write: [], delete: []};
        if (form[inputName] != 'true')
            newActionRoles[parts[0]][parts[2]].push(parts[1]);
    }

    access_helper.setRoleAccess(req.session.id_application, newActionRoles);
    res.redirect('/access_settings/show');
});

module.exports = router;