// **** Database Generator Entity ****
var models = require('../models/');

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

// DataEntity
exports.selectEntity = function(attr, callback) {

	var options = attr.options;
	var optionType;

	// Check if only space
    if (!options.value.replace(/\s/g, '').length) {
        // string only contained whitespace (ie. spaces, tabs or line breaks)
        options.value = "";
    }

	if(options.value != ""){
		// If params is a string, look for information_system with specific Name
		// Else if param is a number, look for information_system with its ID
		var where = {};
		if (!isNaN(options.value)){
			where = {
				where: {
					id: options.value
				},
				include: [{
					model: models.Module,
					include: [{
						model: models.Application,
						where: {
							id: attr.id_application
						}
					}]
				}]
			};
			optionType = "ID";
		}
		else {
			where = {
				where: {
					name: options.value
				},
				include: [{
					model: models.Module,
					include: [{
						model: models.Application,
						where: {
							id: attr.id_application
						}
					}]
				}]
			};
			optionType = "Name";
		}

		models.DataEntity.findOne(where).then(function(entity) {
			if (!entity) {
				var err = new Error();
				err.message = "database.entity.notFound.withThis" + optionType;
				err.messageParams = [options.value];
				return callback(err,null);
			}

			var info = {
				insertId: entity.id,
				moduleId: entity.Module.id,
				urlEntity: entity.codeName.substring(2),
				message: "database.entity.select.selected",
				messageParams: [entity.name, entity.id]
			};

			callback(null, info);
		}).catch(function(err) {
			callback(err, null);
		});
	} else {
		var err = new Error();
		err.message = "database.entity.select.valid";
		callback(err, null);
	}
}

// DataEntity with just a name
exports.selectEntityTarget = function(attr, callback) {

	models.DataEntity.findOne({
		where: {
			name: attr.options.showTarget
		},
		include: [{
			model: models.Module,
			include: [{
				model: models.Application,
				where: {
					id: attr.id_application
				}
			}]
		}]
	}).then(function(dataEntity) {
		if (!dataEntity) {
			var err = new Error();
			err.level = 0;
			err.message = "database.entity.notFound.targetNoExist";
			return callback(err, null);
		}
		callback(null, dataEntity);
	}).catch(function(err) {
		callback(err, null);
	});
}

exports.createNewEntity = function(attr, callback) {

	// Set id_information_system of future data_entity according to session value transmitted in attributes
	var id_module = attr.id_module;

	// Set options variable using the attribute array
	var options = attr.options;

	// Value is the value used in the code
	var name_entity = options.value;
	// showValue is the value without cleaning function
	var show_name_entity = options.showValue;

	models.DataEntity.findOne({
		where: {
			$or: [{name: show_name_entity}, {codeName: name_entity}]
		},
		include: [{
			model: models.Module,
			include: [{
				model: models.Application,
				where: {
					id: attr.id_application
				}
			}]
		}]
	}).then(function(dataEntity) {
		if(dataEntity) {
			var err = new Error();
			err.message = "database.entity.create.alreadyExist";
			err.messageParams = [name_entity];
			return callback(err, null);
		}

		models.DataEntity.create({
			name: show_name_entity,
			codeName: name_entity,
			id_module: id_module,
			version: 1
		}).then(function(newEntity) {
			models.Module.findById(id_module).then(function(module){
				var info = {
					insertId: newEntity.id,
					urlEntity: newEntity.codeName.substring(2),
					message: "database.entity.create.success",
					messageParams: [newEntity.name, newEntity.id, module.name, newEntity.name]
				};
				callback(null,info);
			});
		});
	}).catch(function(err){
		callback(err, null);
	});
}

exports.createNewEntityTarget = function(attr, callback) {
	models.DataEntity.findOne({
		where: {
			$or: [{name: attr.options.showTarget}, {codeName: attr.options.target}]
		},
		include: [{
			model: models.Module,
			include: [{
				model: models.Application,
				where: {
					id: attr.id_application
				}
			}]
		}]
	}).then(function(dataEntity) {
		if (dataEntity) {
			var err = new Error();
			err.message = "database.entity.create.alreadyExist";
			err.messageParams = [dataEntity.name];
			return callback(err, null);
		}
		models.DataEntity.create({
			name: attr.options.showTarget,
			codeName: attr.options.target,
			id_module: attr.id_module,
			version: 1
		}).then(function(createdEntity) {
			var info = {};
			info.insertId = createdEntity.id;
			info.name = createdEntity.name;
			info.codeName = createdEntity.codeName;
			info.message = "database.entity.create.success";
			models.Module.findById(attr.id_module).then(function(module){
				info.messageParams = [createdEntity.name, createdEntity.id, module.name, createdEntity.name];
				callback(null, info);
			});
		});
	}).catch(function(err){
		callback(err, null);
	});
}

// List Entity
exports.listDataEntity = function(attr, callback) {

	models.DataEntity.findAll({
		order: 'id DESC',
		include: [{
			model: models.Module,
			include: [{
				model: models.Application,
				where: {
					id: attr.id_application
				}
			}]
		}]
	}).then(function(dataEntities) {
		var info = {};
		info.message = "<br><ul>";
		if (!dataEntities || dataEntities.length == 0)
			info.message += ' - <br>';
		else
			for (var i = 0; i < dataEntities.length; i++)
				info.message += "<li>"+ dataEntities[i].Module.name + " | " + dataEntities[i].name + "("+dataEntities[i].id+")</li>";

		info.message += "</ul>";
		info.rows = dataEntities;
		callback(null, info);
	}).catch(function(err) {
		callback(err, null);
	});
}

// List data entity names by application id
exports.listDataEntityNameByApplicationId = function(id_application, callback) {
	models.Application.findOne({
		where: {id: id_application},
		include: [{
			model: models.Module,
			include: models.DataEntity
		}]
	}).then(function(app) {
		callback(null, app);
	}).catch(function(err) {
		callback(err, null);
	});
}

// GetById
exports.getNameDataEntityById = function(idEntity, callback) {

	if(idEntity == null){
		var err = new Error();
        err.message = "database.field.error.selectOrCreateBefore";
        return callback(err, null);
	}

	models.DataEntity.findOne({where: {id: idEntity}}).then(function(dataEntity) {
		if (!dataEntity) {
			var err = new Error();
			err.message = "database.entity.notFound.withThisID";
			err.messageParams = [idEntity];
			return callback(err, null);
		}

		callback(null, dataEntity.name);
	}).catch(function(err){
		return callback(err, null);
	});
}

// GetById
exports.getDataEntityById = function(idEntity, callback) {

	if(idEntity == null){
		var err = new Error();
        err.message = "database.field.error.selectOrCreateBefore";
        return callback(err, null);
	}

	models.DataEntity.findOne({where: {id: idEntity}}).then(function(dataEntity) {
		if (!dataEntity) {
			var err = new Error();
			err.message = "database.entity.notFound.withThisID";
			err.messageParams = [idEntity];
			return callback(err, null);
		}

		callback(null, dataEntity);
	}).catch(function(err){
		return callback(err, null);
	});
}

exports.getIdDataEntityByCodeName = function(idModule, codeNameEntity, callback) {
	models.DataEntity.findOne({where: {codeName: codeNameEntity, id_module: idModule}}).then(function(entity) {
		if (!entity) {
			var err = new Error();
			err.message = "database.entity.notFound.withThisCodeNameAndModule";
			err.messageParams = [codeNameEntity, idModule];
			return callback(err, null);
		}
		callback(null, entity.id);
	}).catch(function(err) {
		return callback(err, null);
	});
}

exports.getIdDataEntityByCodeNameWithoutModuleCheck = function(idModule, codeNameEntity, callback) {
	models.DataEntity.findOne({where: {codeName: codeNameEntity}}).then(function(entity) {
		if (!entity) {
			var err = new Error();
			err.message = "database.entity.notFound.withThisCodeNameAndModule";
			err.messageParams = [codeNameEntity, idModule];
			return callback(err, null);
		}
		callback(null, entity.id);
	}).catch(function(err) {
		return callback(err, null);
	});
}

// Delete
exports.deleteDataEntity = function(attr, callback) {
	var idModule = attr.id_module;
	var showNameEntity = attr.show_name_data_entity;
	var nameEntity = attr.name_data_entity;

	models.DataEntity.destroy({where: {codeName: nameEntity, id_module: idModule}}).then(function(){
		var info = {};
		info.message = "database.entity.delete.deleted";
		info.messageParams = [showNameEntity];
		callback(null, info);
	}).catch(function(err){
		callback(err, null);
	});
}

// Get a DataEntity with a given codename
exports.getDataEntityByCodeName = function(idApplication, nameEntity, callback) {

    models.DataEntity.findOne({
    	where: {
            codeName: nameEntity
    	},
    	include: [{
			model: models.Module,
			include: [{
				model: models.Application,
				where: {
					id: idApplication
				}
			}]
		}]
    }).then(function(entity) {
        if (!entity) {
            var err = new Error();
            err.message = "database.entity.notFound.withThisName";
            err.messageParams = [nameEntity];
            return callback(err, null);
        }
        callback(null, entity);
    }).catch(function(err) {
        callback(err, null);
    });
}

// Get a DataEntity with a given name
exports.getDataEntityByName = function(nameEntity, idModule, callback) {
    models.DataEntity.findOne({
    	where: {
    		name: nameEntity,
    		id_module: idModule
    	}
    }).then(function(dataEntity) {
        if (!dataEntity) {
            var err = new Error();
            err.message = "database.entity.notFound.withThisName";
            err.messageParams = [nameEntity];
            return callback(err, null);
        }
        callback(null, dataEntity);
    }).catch(function(err) {
        callback(err, null);
    });
}

exports.getModuleCodeNameByEntityCodeName = function(nameEntity, idModule, callback){
	models.DataEntity.findOne({where: {codeName: nameEntity, id_module: idModule}, include: [models.Module]}).then(function(entity){
		if (!entity){
			var err = new Error();
            err.message = "database.entity.notFound.withThisName";
            err.messageParams = [nameEntity];
			return callback(err, null);
		}
		callback(null, entity.Module.codeName);
	}).catch(function(err){
		callback(err, null);
	});
}

exports.retrieveWorkspaceHasManyData = function(idApp, codeNameEntity, foreignKey, callback){
	delete require.cache[require.resolve('../workspace/'+idApp+'/models/')];
	var workspaceModels = require('../workspace/'+idApp+'/models/');
	var where = {};
	where[foreignKey] = {
		$ne: null
	};

	workspaceModels[capitalizeFirstLetter(codeNameEntity)].findAll({
		attributes: ["id", foreignKey],
		where: where
	}).then(function(result){
		callback(result, null);
	}).catch(function(err){
		callback([]);
	});
}

/* --- COMPONENT LINK --- */

// Add a component ID on an already created entity found with a codeName
exports.addComponentOnEntityByCodeName = function(codeName, idComponent, idModule, callback){
	models.DataEntity.findOne({
		where: {
			codeName: codeName,
			id_module: idModule
		}
	}).then(function(foundEntity){
		if(!foundEntity){
			var err = new Error();
			err.message = "database.entity.create.addComponent";
			err.messageParams = [codeName];
			callback(err);
		} else {
			foundEntity.addComponent(idComponent).then(function(){
				callback(null, null);
			}).catch(function(err){
				callback(err, null);
			});
		}
	}).catch(function(err){
		callback(err, null);
	});
}