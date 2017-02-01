var models = require('../models/');

// Get workspace modules and entities list
// Also get workspace's groups and roles
exports.getPreviewData = function(id_application) {
	return new Promise(function(resolve, reject) {
		var values = {};
		var workspaceModels = require(__dirname+'/../workspace/'+id_application+'/models/');
		workspaceModels.E_group.findAll().then(function(groups) {
			values.groups = groups || [];
			workspaceModels.E_role.findAll().then(function(roles) {
				values.roles = roles || [];
				models.Module.findAll({
					where: {id_application: id_application},
					include: [{model: models.DataEntity}]
				}).then(function(modules) {
					values.modules = modules || [];
					resolve(values);
				});
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}