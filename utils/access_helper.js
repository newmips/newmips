var models = require('../models/');
var fs = require('fs-extra');

// Get workspace modules and entities list
// Also get workspace's groups and roles
exports.getPreviewData = function(id_application) {
	return new Promise(function(resolve, reject) {
		var values = {};
		var workspaceModels = require(__dirname+'/../workspace/'+id_application+'/models/');
		// Get groups from workspace
		workspaceModels.E_group.findAll().then(function(groups) {
			values.groups = groups || [];
			// Get roles from workspace
			workspaceModels.E_role.findAll().then(function(roles) {
				values.roles = roles || [];

				// Get access configuration
				delete require.cache[require.resolve(__dirname+'/../workspace/'+id_application+'/config/access.json')]
				var access = require(__dirname+'/../workspace/'+id_application+'/config/access.json');

				// Add module name to module definition
				for (var module in access)
					access[module].name = module;

				values.modules = access;
				resolve(values);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}

exports.setGroupAccess = function(id_application, modules, entities) {
	var accessFileName = __dirname+'/../workspace/'+id_application+'/config/access.json';
	var access = require(accessFileName);

	// Loop through access.json modules
	for (var module in access) {
		// Set new groups to module if needed
		if (typeof modules[module] !== 'undefined')
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
	fs.writeFileSync(accessFileName, JSON.stringify(access, null, 4));

	return 1;
}

exports.setRoleAccess = function(id_application, entities) {
	var accessFileName = __dirname+'/../workspace/'+id_application+'/config/access.json';
	var access = require(accessFileName);

	for (var module in access) {
		for (var i = 0; i < access[module].entities.length; i++) {
			if (typeof entities[access[module].entities[i].name] !== 'undefined')
				access[module].entities[i].actions = entities[access[module].entities[i].name];
		}
	}

	// Write back new data to file
	fs.writeFileSync(accessFileName, JSON.stringify(access, null, 4));

	return 1;
}