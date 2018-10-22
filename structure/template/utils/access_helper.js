var models = require('../models/');
var fs = require('fs-extra');
var block_access = require('./block_access');

// Get workspace modules and entities list
// Also get workspace's groups and roles
exports.getPreviewData = function() {
	return new Promise(function(resolve, reject) {
		var values = {};
		// Get groups from workspace
		models.E_group.findAll().then(function(groups) {
			values.groups = groups || [];
			// Get roles from workspace
			models.E_role.findAll().then(function(roles) {
				values.roles = roles || [];

				// Get access configuration
				var access = JSON.parse(fs.readFileSync(__dirname+'/../config/access.json', 'utf8'));

				// Restructure access object for dustjs
				var modules = [];
				for (var module in access) {
					access[module].name = module;
					modules.push(access[module]);
				}

				values.modules = modules;
				resolve(values);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}

exports.setGroupAccess = function(modules, entities) {
	var accessFileName = __dirname+'/../config/access.json';
	var access = JSON.parse(fs.readFileSync(accessFileName, 'utf8'));

	// Loop through access.json modules
	for (var module in access) {
		// Set new groups to module if needed
		if (typeof modules[module] !== 'undefined' && module != 'home')
			access[module].groups = modules[module];

		// Loop through access.json entities
		for (var i = 0; i < access[module].entities.length; i++) {
			var entity = access[module].entities[i];
			// Set new groups to entity if needed
			if (typeof entities[entity.name] !== 'undefined')
				access[module].entities[i].groups = entities[entity.name];
		}
	}

	// Write back new data to file
	fs.writeFileSync(accessFileName, JSON.stringify(access, null, 4), 'utf8');

	block_access.reloadAccess();
	return 1;
}

exports.setRoleAccess = function(entities) {
	var accessFileName = __dirname+'/../config/access.json';
	var access = JSON.parse(fs.readFileSync(accessFileName, 'utf8'));

	for (var module in access) {
		for (var i = 0; i < access[module].entities.length; i++) {
			if (typeof entities[access[module].entities[i].name] !== 'undefined')
				access[module].entities[i].actions = entities[access[module].entities[i].name];
		}
	}

	// Write back new data to file
	fs.writeFileSync(accessFileName, JSON.stringify(access, null, 4), 'utf8');

	block_access.reloadAccess();
	return 1;
}
