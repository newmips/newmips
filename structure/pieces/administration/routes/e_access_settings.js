const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const access_helper = require('../utils/access_helper');
const dust = require('dustjs-linkedin');
const fs = require('fs');
const language = require('../services/language')('fr-FR');

// Entity that shall be ignored to build group/role menu
const ignoreEntityList = ['notification'];

router.get('/show_api', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "read"), function(req, res) {
	const data = {};
	try {
		const appConf = JSON.parse(fs.readFileSync(__dirname+'/../config/application.json', 'utf8'));
		data.api_enabled = appConf.api_enabled;
	} catch (err) {
		console.error("Coudn't read config/application.json - API disabled")
		console.error(err);
		data.api_enabled = false;
	}
	res.render('e_access_settings/show_api', data);
});

router.get('/show_group', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "read"), function(req, res) {
	const data = {};
	access_helper.getPreviewData().then(function(values) {
		data.allGroups = values.groups;

		// Build traduction key for modules and entities
		for(let i=0; i<values.modules.length; i++){
			values.modules[i].tradKeyModule = "module.m_"+values.modules[i].name;
			for(let j=0; j<values.modules[i].entities.length; j++){
				if (ignoreEntityList.includes(values.modules[i].entities[j]))
					continue;

				// Access_settings isn't an entity
				if(values.modules[i].entities[j].name == "access_settings")
					values.modules[i].entities[j].tradKeyEntity = "settings.title";
				else {
					let key = "entity.e_"+values.modules[i].entities[j].name+".label_entity";
					if (language.__(key) == key)
						key = "component.c_"+values.modules[i].entities[j].name+".label_component";
					values.modules[i].entities[j].tradKeyEntity = key;
				}
			}
		}

		data.modules = values.modules;
		dust.helpers.isGroupChecked = function(chunk, context, bodies, params) {
			const currentSource = params.source;
			const currentTarget = params.target;
			if (currentSource.groups.indexOf(currentTarget) == -1)
				return true;
			return false;
		}
		res.render('e_access_settings/show_group', data);
	});
});

router.get('/show_role', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "read"), function(req, res) {
	const data = {};
	access_helper.getPreviewData().then(function(values) {
		data.allRoles = values.roles;

		// Build traduction key for modules and entities
		for(let i=0; i<values.modules.length; i++){
			values.modules[i].tradKeyModule = "module.m_"+values.modules[i].name;
			for(let j=0; j<values.modules[i].entities.length; j++){
				if (ignoreEntityList.includes(values.modules[i].entities[j]))
					continue;

				// Access_settings isn't an entity
				if(values.modules[i].entities[j].name == "access_settings")
					values.modules[i].entities[j].tradKeyEntity = "settings.title";
				else {
					let key = "entity.e_"+values.modules[i].entities[j].name+".label_entity";
					if (language.__(key) == key)
						key = "component.c_"+values.modules[i].entities[j].name+".label_component";
					values.modules[i].entities[j].tradKeyEntity = key;
				}
			}
		}

		data.modules = values.modules;
		dust.helpers.isActionChecked = function(chunk, context, bodies, params) {
			const currentSource = params.source;
			const currentTarget = params.target;
			const action = params.action;
			if (currentSource.actions[action] && currentSource.actions[action].indexOf(currentTarget) == -1)
				return true;
			return false;
		}
		res.render('e_access_settings/show_role', data);
	});
});

router.post('/enable_disable_api', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "create"), function(req, res) {
	const enable = req.body.enable;
	const applicationConfigPath = __dirname + '/../config/application.json';
	const applicationConfig = JSON.parse(fs.readFileSync(applicationConfigPath, 'utf8'));
	applicationConfig.api_enabled = enable == 'true';
	fs.writeFileSync(applicationConfigPath, JSON.stringify(applicationConfig, null, 4), 'utf8');
	res.status(200).end();
});

router.post('/set_group_access', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_settings", "create"), function(req, res) {
	const form = req.body;
	const newModuleAccess = {}, newEntityAccess = {};
	for (const inputName in form) {
		// Add each not checked input to groups list
		const parts = inputName.split('.');
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
	const form = req.body;
	const newActionRoles = {};
	for (const inputName in form) {
		const parts = inputName.split('.');
		if (typeof newActionRoles[parts[0]] === 'undefined')
			newActionRoles[parts[0]] = {read: [], create: [], update: [], delete: []};
		if (form[inputName] != 'true')
			newActionRoles[parts[0]][parts[2]].push(parts[1]);
	}

	access_helper.setRoleAccess(newActionRoles);
	res.redirect('/access_settings/show_role');
});

module.exports = router;