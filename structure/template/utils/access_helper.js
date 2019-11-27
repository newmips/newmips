const models = require('../models/');
const fs = require('fs-extra');
const block_access = require('./block_access');

// Get workspace modules and entities list
// Also get workspace's groups and roles
exports.getPreviewData = async function() {
	const values = {};
	const promises = [models.E_group.findAll(), models.E_role.findAll()];

	const [groups, roles] = await Promise.all(promises);
	values.groups = groups || [];
	values.roles = roles || [];

	// Get access configuration
	const access = JSON.parse(fs.readFileSync(__dirname+'/../config/access.json', 'utf8'));

	// Restructure access object for dustjs
	const modules = [];
	for (const accessModule in access) {
		access[accessModule].name = accessModule;
		modules.push(access[accessModule]);
	}

	values.modules = modules;
	return values;
}

exports.setGroupAccess = function(modules, entities) {
	const accessFileName = __dirname+'/../config/access.json';
	const access = JSON.parse(fs.readFileSync(accessFileName, 'utf8'));

	// Loop through access.json modules
	for (const accessModule in access) {
		// Set new groups to module if needed
		if (typeof modules[accessModule] !== 'undefined' && accessModule != 'home')
			access[accessModule].groups = modules[accessModule];

		// Loop through access.json entities
		for (let i = 0; i < access[accessModule].entities.length; i++) {
			const entity = access[accessModule].entities[i];
			// Set new groups to entity if needed
			if (typeof entities[entity.name] !== 'undefined')
				access[accessModule].entities[i].groups = entities[entity.name];
		}
	}

	// Write back new data to file
	fs.writeFileSync(accessFileName, JSON.stringify(access, null, 4), 'utf8');

	block_access.reloadAccess();
	return 1;
}

exports.setRoleAccess = function(entities) {
	const accessFileName = __dirname+'/../config/access.json';
	const access = JSON.parse(fs.readFileSync(accessFileName, 'utf8'));

	for (const accessModule in access) {
		for (let i = 0; i < access[accessModule].entities.length; i++) {
			if (typeof entities[access[accessModule].entities[i].name] !== 'undefined')
				access[accessModule].entities[i].actions = entities[access[accessModule].entities[i].name];
		}
	}

	// Write back new data to file
	fs.writeFileSync(accessFileName, JSON.stringify(access, null, 4), 'utf8');

	block_access.reloadAccess();
	return 1;
}
