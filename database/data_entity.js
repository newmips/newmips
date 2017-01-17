// **** Database Generator Entity ****
var models = require('../models/');

// DataEntity
exports.selectDataEntity = function(attr, callback) {

	// If params is a string, look for information_system with specific Name
	// Else if param is a number, look for information_system with its ID
	if ( typeof attr !== 'undefined' && attr ) {

		// Set options variable using the attribute array
		var options = attr.options;
		var type_option;

		if ( typeof options !== 'undefined' && options ) {

			var where = {};
			var message = '';
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
				type_option = "ID";
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
				type_option = "name";
			}

			models.DataEntity.findOne(where).then(function(model) {
				if (!model) {
					var err = new Error();
					err.message = "Sorry, but there is no data entity with this " + type_option;
					return callback(err,null);
				}

				var info = { "insertId" : model.id, "message" : "Data entity " + model.id + " - " + model.name + " selected." };
				callback(null,info);
			}).catch(function(err) {
				callback(err, null);
			});
		}
		else {
			var err = new Error();
			err.message = "Please indicate the name of the data entity you would like to select";
			callback(err, null);
		}
	}
}

// DataEntity with just a name
exports.selectDataEntityTarget = function(attr, callback) {

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
			var err = {};
			err.level = 0;
			return callback(err,null);
		}
		callback(null, dataEntity);
	}).catch(function(err) {
		callback(err, null);
	});
}

exports.createNewDataEntity = function(attr, callback) {

	var name_entity;
	var id_module = -1;

	if(typeof attr !== 'undefined' && typeof attr.options !== "undefined"){

		// Set id_information_system of future data_entity according to session value transmitted in attributes
		id_module = attr.id_module;

		// Set options variable using the attribute array
		var options = attr.options;

		// Value is the value used in the code
		name_entity = options.value;
		// showValue is the value without cleaning function
		var show_name_entity = options.showValue;

		if(typeof options !== 'undefined' && name_entity != "" && id_module > 0){

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
					err.message = "Entity with the same or similar name '"+name_entity+"' already exists";
					return callback(err, null);
				}

				models.DataEntity.create({
					name: show_name_entity,
					codeName: name_entity,
					id_module: id_module,
					version: 1
				}).then(function(newEntity) {
					var info = {};
					info.insertId = newEntity.id;
					info.message = "New data entity "+ newEntity.id +" | "+ newEntity.name +" created.";
					callback(null,info);
				});
			}).catch(function(err){
				callback(err, null);
			});
		}
		else {
			var err = new Error();
			err.message = "Application module seems not to be yet set";
			callback(err, null);
		}
	}
	else {
		var err = new Error();
		err.message = "Attributes are not properly defined";
		callback(err, null);
	}
}

exports.createNewDataEntitySource = function(attr, callback) {
	models.DataEntity.findOne({
		where: {
			name: attr.options.source
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
			err.message = "Entity "+ attr.options.source +" already exists";
			return callback(err, null);
		}
		models.DataEntity.create({
			name: attr.options.source,
			id_module: attr.id_module,
			version: 1
		}).then(function(created_dataEntity) {
			var info = {};
			info.insertId = created_dataEntity.id;
			info.message = "New data entity "+ created_dataEntity.id +" | "+ created_dataEntity.name +" created.";
			callback(null, info);
		});
	}).catch(function(err){
		callback(err, null);
	});
}

exports.createNewDataEntityTarget = function(attr, callback) {
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
			err.message = "Entity "+attr.options.target+" already exists.";
			return callback(err, null);
		}
		models.DataEntity.create({
			name: attr.options.showTarget,
			codeName: attr.options.target,
			id_module: attr.id_module,
			version: 1
		}).then(function(created_dataEntity) {
			var info = {};
			info.insertId = created_dataEntity.id;
			info.name = created_dataEntity.name;
			info.codeName = created_dataEntity.codeName;
			info.message = "New data entity "+created_dataEntity.id+" | "+created_dataEntity.name+" created.";
			callback(null, info);
		});
	}).catch(function(err){
		callback(err, null);
	});
}

// List
exports.listDataEntity = function(attr, callback) {

	if(typeof attr.id_application == "undefined" || attr.id_application == null){
        err = new Error();
        err.message = "Please, select an application before.";
        callback(err,null);
    }
    else{

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
			info.message = "List of data entities (module | id entity | name entity): <br><ul>";
			if (!dataEntities || dataEntities.length == 0)
				info.message += 'None<br>';
			else
				for (var i = 0; i < dataEntities.length; i++)
					info.message += "<li>"+ dataEntities[i].Module.name + " | " + dataEntities[i].id + " | " + dataEntities[i].name + "</li>";

			info.message += "</ul>";
			info.rows = dataEntities;
			callback(null, info);
		}).catch(function(err) {
			callback(err, null);
		});
	}
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
exports.getNameDataEntityById = function(id_data_entity, callback) {

	if (typeof(id_data_entity) !== 'number') {
		var err = new Error();
		err.message = "ID data entity is not defined. You should select or create a data entity before.";
		return callback(err, null);
	}

	models.DataEntity.findOne({where: {id: id_data_entity}}).then(function(dataEntity) {
		if (!dataEntity) {
			var err = new Error();
			err.message = "No data entity with ID "+id_data_entity+" found.";
			return callback(err, null);
		}

		callback(null, dataEntity.name);
	}).catch(function(err){
		return callback(err, null);
	});
}

// GetById
exports.getDataEntityById = function(id_data_entity, callback) {

	if (typeof(id_data_entity) !== 'number') {
		var err = new Error();
		err.message = "ID data entity is not defined. You should select or create a data entity before.";
		return callback(err, null);
	}

	models.DataEntity.findOne({where: {id: id_data_entity}}).then(function(dataEntity) {
		if (!dataEntity) {
			var err = new Error();
			err.message = "No data entity with ID "+id_data_entity+" found.";
			return callback(err, null);
		}

		callback(null, dataEntity);
	}).catch(function(err){
		return callback(err, null);
	});
}

exports.getIdDataEntityByName = function(name_data_entity, callback) {
	models.DataEntity.findOne({where: {name: name_data_entity}}).then(function(entity) {
		if (!entity) {
			var err = new Error();
			err.message = "No data entity with the name '"+name_data_entity+"' found.";
			return callback(err, null);
		}
		callback(null, entity.id);
	}).catch(function(err) {
		return callback(err, null);
	});
}

// Association
exports.createNewAssociation = function(attr, callback) {

	var name_data_entity = "";
	var type_data_entity = "string";
	var id_module = -1;
	var version = 1;

	if(typeof attr !== 'undefined' && typeof attr.options !== "undefined"){

		// Set id_information_system of future data_entity according to session value transmitted in attributes
		id_module = attr.id_module;

		// Set options variable using the attribute array
		var options = attr.options;
		name_data_entity = options.value;

		if(typeof options !== 'undefined' && options && id_module != ""){

			// Set Association name variables
			var association = name_data_entity + "_" + type_data_entity;

			models.DataEntity.findOne({where: {name: association}}).then(function(dataEntity) {
				if(dataEntity){
					var err = new Error();
					err.message = "Association already exists";
					return callback(err, null);
				}

				models.DataEntity.create({
					name: association,
					id_module: id_module,
					version: version
				}).then(function(newEntity) {
					var info = {};
					info.message = "New data entity " + newEntity.id + " created.";
					info.insertId = newEntity.id;
					callback(null,info);
				})
			}).catch(function(err) {
				var err = new Error();
				err.message = "Error while creating association in database";
				callback(err, null);
			})
		}
		else {
			var err = new Error();
			err.message = "Application module seems not to be yet set";
			callback(err, null);
		}
	}
	else {
		var err = new Error();
		err.message = "Attributes are not properly defined";
		callback(err, null);
	}
}

// Delete
exports.deleteDataEntity = function(attr, callback) {
	var id_module = attr.id_module;
	var show_name_data_entity = attr.show_name_data_entity;

	models.DataEntity.destroy({where: {name: show_name_data_entity, id_module: id_module}}).then(function(){
		var info = {};
		info.message = "Entity "+show_name_data_entity+" deleted.";
		callback(null, info);
	}).catch(function(err){
		callback(err, null);
	});
}

// Get a DataEntity with a given name
exports.getDataEntityByName = function(attr, callback) {

    var id_application = 0;
    var version = 1;

    if (typeof attr !== 'undefined' && typeof attr.options != "undefined") {
        id_application = attr.id_application;
        var options = attr.options;

        if (typeof options !== 'undefined' && options && id_application != 0) {

            models.DataEntity.findOne({
            	where: {
	                name: options.showValue,
	                id_application: id_application
            	}
            }).then(function(dataEntity) {
                if (!dataEntity) {
                    var err = new Error();
                    err.message = "Sorry, no data entity with this name exist.";
                    return callback(err, null);
                }
                callback(null, dataEntity);
            }).catch(function(err) {
                callback(err, null);
            });
        }
    }
}

exports.getModuleNameByEntityName = function(entity_name, callback){
	models.DataEntity.findOne({where: {name: entity_name.toLowerCase()}, include: [models.Module]}).then(function(entity){
		if (!entity){
			var err = new Error();
            err.message = "Sorry, no data entity with name '"+entity_name+"' exist.";
			return callback(err, null);
		}
		callback(null, entity.Module.name);
	}).catch(function(err){
		callback(err, null);
	});
}

exports.getModuleCodeNameByEntityName = function(entity_name, callback){
	models.DataEntity.findOne({where: {name: entity_name.toLowerCase()}, include: [models.Module]}).then(function(entity){
		if (!entity){
			var err = new Error();
            err.message = "Sorry, no data entity with name '"+entity_name+"' exist.";
			return callback(err, null);
		}
		callback(null, entity.Module.codeName);
	}).catch(function(err){
		callback(err, null);
	});
}

