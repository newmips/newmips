// **** API Data Entity ****
var models = require('../models/');

// DataEntity
exports.selectDataEntity = function(attr, callback) {

	// If params is a string, look for information_system with specific Name
	// Else if param is a number, look for information_system with its ID
	if ( typeof attr !== 'undefined' && attr ) {

		// Set options variable using the attribute array
		options = attr['options'];

		if ( typeof options !== 'undefined' && options ) {

			var where, message = '';
			if (!isNaN(options[0].value)){
				where = {
					where: {
						id: options[0].value
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
						name: options[0].value
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
					err = new Error();
					err.message = "Sorry, but there is no data entity with this " + type_option;
					return callback(err,null);
				}

				info = { "insertId" : model.id, "message" : "Data entity " + model.id + " - " + model.name + " selected." };
				callback(null,info);
			}).catch(function() {
				err = new Error();
				err.message = "Sorry, I have not well understood your request";
				callback(err,null);
			});
		}
		else {
			err = new Error();
			err.message = "Please indicate the name of the data entity you would like to select";
			callback(err,null);
		}
	}
}

// DataEntity with just a name
exports.selectDataEntityTarget = function(attr, callback) {

	models.DataEntity.findOne({
		where: {
			name: attr.options.target
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
			err = {};
			err.message = "Sorry, but there is no data entity with the name " + attr.options.target;
			err.level = 0;
			return callback(err,null);
		}
		callback(null, dataEntity);
	}).catch(function(err) {
		err = new Error();
		err.message = "Sorry, I have not well understood your request";
		err.level = 1;
		callback(err,null);
	});
}

exports.createNewDataEntity = function(attr, callback) {

	var name_= "";
	var description = "";
	var icon = "";
	var listable = 0;
	var id_module = -1;
	var version = 1;

	if ( typeof attr !== 'undefined' && attr ) {

		// Set id_information_system of future data_entity according to session value transmitted in attributes
		id_module = attr['id_module'];

		// Set options variable using the attribute array
		options = attr['options'];

		if ( typeof options !== 'undefined' && options && id_module != "") {

			// Check each options variable to set properties
			i = 0;
			while (i < options.length) {
				if ( typeof options[i] !== 'undefined' && options[i] ) {
					if ( options[i].property == "entity" ) name = options[i].value;
					if ( options[i].property == "description" ) description = options[i].value;
					if ( options[i].property == "icon" ) icon = options[i].value;
					if ( options[i].property == "listable" ) listable = options[i].value;
				}
				i++;
			}

			models.DataEntity.findOne({
				where: {
					name: name
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
					err = new Error();
					err.message = "Entity already exists";
					return callback(err, null);
				}

				models.DataEntity.create({
					name: name,
					description: description,
					icon: icon,
					listable: listable,
					id_module: id_module,
					version: version
				}).then(function(newModel) {
					var info = {};
					info.insertId = newModel.id;
					info.message = "New data entity "+ newModel.id +" | "+ newModel.name +" created.";
					callback(null,info);
				});
			}).catch(function(){
				err = new Error();
				err.message = "Issue when creating data entity : Error while creating entity in database";
				callback(err,null);
			});
		}
		else {
			err = new Error();
			err.message = "Issue when creating data entity : Application module seems not to be yet set";
			callback(err,null);
		}
	}
	else {
		err = new Error();
		err.message = "Issue when creating data entity : Attributes are not properly defined";
		callback(err,null);
	}
}

exports.createNewDataEntitySource = function(attr, callback) {
	var version = 1;
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
			err = new Error();
			err.message = "Entity "+ attr.options.source +" already exists";
			return callback(err, null);
		}
		models.DataEntity.create({
			name: attr.options.source,
			id_module: attr.id_module,
			version: version
		}).then(function(created_dataEntity) {
			var info = {};
			info.insertId = created_dataEntity.id;
			info.message = "New data entity "+ created_dataEntity.id +" | "+ created_dataEntity.name +" created.";
			callback(null, info);
		});
	}).catch(function(){
		err = new Error();
		err.message = "Issue when creating data entity source : Error while creating entity in database";
		callback(err,null);
	});
}

exports.createNewDataEntityTarget = function(attr, callback) {
	var version = 1;
	models.DataEntity.findOne({
		where: {
			name: attr.options.target
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
			err = new Error();
			err.message = "Entity "+ attr.options.target +" already exists";
			return callback(err, null);
		}
		models.DataEntity.create({
			name: attr.options.target,
			id_module: attr.id_module,
			version: version
		}).then(function(created_dataEntity) {
			var info = {};
			info.insertId = created_dataEntity.id;
			info.name = created_dataEntity.name;
			info.message = "New data entity "+ created_dataEntity.id +" | "+ created_dataEntity.name +" created.";
			callback(null, info);
		});
	}).catch(function(){
		err = new Error();
		err.message = "Issue when creating data entity target : Error while creating entity in database";
		callback(err,null);
	});
}

// List
exports.listDataEntity = function(attr, callback) {

	if(typeof attr.id_application == "undefined" || attr.id_application == null){
        err = new Error();
        err.message = "Please select a Application before.";
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
			info = new Array();
			info.message = "List of data entities (module | id entity | name entity): <br><ul>";
			if (!dataEntities || dataEntities.length == 0)
				info.message += 'None<br>';
			else
				for (var i = 0; i < dataEntities.length; i++)
					info.message = info.message + "<li>:"+ dataEntities[i].Module.name + " | " + dataEntities[i].id + " | " + dataEntities[i].name + "</li>";

			info.message = info.message + "</ul>";
			info.rows = dataEntities;
			callback(null, info);
		}).catch(function() {
			err = new Error();
			err.message = "Sorry, an error occured while executing the request";
			callback(err,null);
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
		err = new Error();
		err.message = "Id data entity is not defined";
		return callback(err,null);
	}

	models.DataEntity.findOne({where: {id: id_data_entity}}).then(function(dataEntity) {
		if (!dataEntity) {
			err = new Error();
			err.message = "No data entity found";
			return callback(err,null);
		}

		callback(null, dataEntity.name);
	}).catch(function(err){
		console.error(err);
		err = new Error();
		err.message = "An error occured";
		return callback(err,null);
	});
}

exports.getIdDataEntityByName = function(name_data_entity, callback) {
	models.DataEntity.findOne({where: {name: name_data_entity}}).then(function(entity) {
		if (!entity) {
			err = new Error();
			err.message = "No data entity found";
			return callback(err,null);
		}
		callback(null, entity.id);
	}).catch(function(err) {
		err = new Error();
		err.message = err;
		return callback(err,null);
	})
}

// Association
exports.createNewAssociation = function(attr, callback) {

	var name_data_entity = "";
	var description_data_entity = "";
	var icon_data_entity = "";
	var listable_data_entity = 0;
	var type_data_entity = "";
	var id_module = -1;
	var version = 1;

	if ( typeof attr !== 'undefined' && attr ) {

		// Set id_information_system of future data_entity according to session value transmitted in attributes
		id_module = attr['id_module'];

		// Set options variable using the attribute array
		options = attr['options'];

		if ( typeof options !== 'undefined' && options && id_module != "") {

			// Check each options variable to set properties
			i = 0;
			while (i < options.length) {
				if ( typeof options[i] !== 'undefined' && options[i] ) {
					if ( options[i].property == "name_data_entity" ) name_data_entity = options[i].value;
					if ( options[i].property == "description" ) description_data_entity = options[i].value;
					if ( options[i].property == "icon" ) icon_data_entity = options[i].value;
					if ( options[i].property == "listable" ) listable_data_entity = options[i].value;
					if ( options[i].property == "type" ) type_data_entity = options[i].value;
				}
				i++;
			}

			// Set Association name variables
			var association = name_data_entity + "_" + type_data_entity;

			models.DataEntity.findOne({where: {name: association}}).then(function(dataEntity) {
				if (dataEntity) {
					err = new Error();
					err.message = "Association already exists";
					return callback(err, null);
				}

				models.DataEntity.create({
					name: association,
					description: description_data_entity,
					icon: icon_data_entity,
					listable: listable_data_entity,
					id_module: id_module,
					version: version
				}).then(function(newEntity) {
					var info = {};
					info.message = "New data entity " + newEntity.id + " created.";
					info.insertId = newEntity.id;
					callback(null,info);
				})
			}).catch(function(err) {
				err = new Error();
				err.message = "Issue when creating data entity : Error while creating association in database";
				callback(err,null);
			})
		}
		else {
			err = new Error();
			err.message = "Issue when creating data entity : Application module seems not to be yet set";
			callback(err,null);
		}
	}
	else {
		err = new Error();
		err.message = "Issue when creating data entity : Attributes are not properly defined";
		callback(err,null);
	}
}

// Delete
exports.deleteDataEntity = function(attr, callback) {
	var id_module = attr.id_module;
	var name_data_entity = attr.name_data_entity;

	models.DataEntity.destroy({where: {name: name_data_entity, id_module: id_module}}).then(function(){
		callback();
	}).catch(function(err){
		callback(err);
	})
}

// Get a DataEntity with a given name
exports.getDataEntityByName = function(attr, callback) {

    var name = "";
    var id_application = 0;
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {
        id_application = attr.id_application;
        options = attr.options;

        if (typeof options !== 'undefined' && options && id_application != 0) {

            models.DataEntity.findOne({
            	where: {
	                name: options.name,
	                id_application: id_application
            	}
            }).then(function(dataEntity) {
                if (!dataEntity) {
                    err = new Error();
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
		if (!entity)
			return callback("Unable to find entity's module", null);
		callback(null, entity.Module.name);
	}).catch(callback);
}
