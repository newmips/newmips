var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var access_helper = require('../utils/access_helper');
var dust = require('dustjs-linkedin');
var fs = require('fs');
var language = require('../services/language')('fr-FR');
var moment = require("moment");
var globalConf = require('../config/global');

// Datalist
var filterDataTable = require('../utils/filter_datatable');

// Winston logger
var logger = require('../utils/logger');

router.get('/show_api', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "read"), function(req, res) {
    var data = {};
    data.api_enabled = require('../config/application.json').api_enabled;
    res.render('e_access_settings/show_api', data);
});

router.get('/show_group', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "read"), function(req, res) {
    var data = {};
    access_helper.getPreviewData().then(function(values) {
        data.allGroups = values.groups;

        // Build traduction key for modules and entities
        for(var i=0; i<values.modules.length; i++){
            values.modules[i].tradKeyModule = "module.m_"+values.modules[i].name;
            for(var j=0; j<values.modules[i].entities.length; j++){
                // Access_settings isn't an entity
                if(values.modules[i].entities[j].name == "access_settings")
                    values.modules[i].entities[j].tradKeyEntity = "settings.title";
                else {
                    var key = "entity.e_"+values.modules[i].entities[j].name+".label_entity";
                    if (language.__(key) == key)
                        key = "component.c_"+values.modules[i].entities[j].name+".label_component";
                    values.modules[i].entities[j].tradKeyEntity = key;
                }
            }
        }

        data.modules = values.modules;
        dust.helpers.isGroupChecked = function(chunk, context, bodies, params) {
            var currentSource = params.source;
            var currentTarget = params.target;
            if (currentSource.groups.indexOf(currentTarget) == -1)
                return true;
            return false;
        }
        res.render('e_access_settings/show_group', data);
    });
});

router.get('/show_role', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "read"), function(req, res) {
    var data = {};
    access_helper.getPreviewData().then(function(values) {
        data.allRoles = values.roles;

        // Build traduction key for modules and entities
        for(var i=0; i<values.modules.length; i++){
            values.modules[i].tradKeyModule = "module.m_"+values.modules[i].name;
            for(var j=0; j<values.modules[i].entities.length; j++){
                // Access_settings isn't an entity
                if(values.modules[i].entities[j].name == "access_settings")
                    values.modules[i].entities[j].tradKeyEntity = "settings.title";
                else {
                    var key = "entity.e_"+values.modules[i].entities[j].name+".label_entity";
                    if (language.__(key) == key)
                        key = "component.c_"+values.modules[i].entities[j].name+".label_component";
                    values.modules[i].entities[j].tradKeyEntity = key;
                }
            }
        }

        data.modules = values.modules;
        dust.helpers.isActionChecked = function(chunk, context, bodies, params) {
            var currentSource = params.source;
            var currentTarget = params.target;
            var action = params.action;
            if (currentSource.actions[action] && currentSource.actions[action].indexOf(currentTarget) == -1)
                return true;
            return false;
        }
        res.render('e_access_settings/show_role', data);
    });
});

router.post('/enable_disable_api', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "create"), function(req, res) {
    var enable = req.body.enable;
    var applicationConfig = require(__dirname+'/../config/application.json');
    applicationConfig.api_enabled = enable == 'true' ? true : false;
    fs.writeFileSync(__dirname+'/../config/application.json', JSON.stringify(applicationConfig, null, 4), 'utf8');
    res.status(200).end();
});

router.post('/set_group_access', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "create"), function(req, res) {
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
    res.redirect('/access_settings/show_group');
});

router.post('/set_role_access', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "create"), function(req, res) {
    var form = req.body;
    var newActionRoles = {};
    for (var inputName in form) {
        var parts = inputName.split('.');
        if (typeof newActionRoles[parts[0]] === 'undefined')
            newActionRoles[parts[0]] = {read: [], create: [], update: [], delete: []};
        if (form[inputName] != 'true')
            newActionRoles[parts[0]][parts[2]].push(parts[1]);
    }

    access_helper.setRoleAccess(newActionRoles);
    res.redirect('/access_settings/show_role');
});

module.exports = router;