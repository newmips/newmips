// **** Database Generator Field ****
var models = require('../models/');

// Create new Data Field in Data Entity
exports.createNewDataField = function(attr, callback) {

	if(attr.id_data_entity == null){
		var err = new Error();
		err.message = "You have to select or create a data entity before.";
		return callback(err, null);
	}

	var type_field = "string";
	var version = 1;

	if(typeof attr !== 'undefined' && typeof attr.options !== "undefined"){

        // Set id_data_entity of future data_field according to session value transmitted in attributes
        var id_data_entity = attr.id_data_entity;

        // Set options variable using the attribute array
        var options = attr.options;
        var name_field = options.value;
        var show_name_field = options.showValue;

        if(typeof options.type !== "undefined")
        	type_field = options.type

        if (typeof options !== 'undefined' && name_field != "" && id_data_entity != "") {

            models.DataField.findOne({
            	where: {
            		id_data_entity: id_data_entity,
            		$or: [{name: show_name_field}, {codeName: name_field}]
            	}
            }).then(function(dataField) {
            	if (dataField) {
            		var err = new Error();
            		err.message = "Sorry, a field with the same or similar name already exists.";
            		return callback(err, null);
            	}

            	models.DataField.create({
            		name: show_name_field,
            		codeName: name_field,
            		type: type_field,
            		id_data_entity: id_data_entity,
            		version: version
            	}).then(function(dataField) {
            		var info = {
            			insertId: dataField.id,
            			message: "New data field "+dataField.id+" | "+show_name_field+" created."
            		};
            		callback(null, info);
            	}).catch(function(err) {
            		callback(err, null);
            	})
            }).catch(function(err){
            	callback(err, null);
            })
        } else {
        	var err = new Error();
        	err.message = "Attributes are not properly defined.";
        	callback(err, null);
        }
    } else {
    	var err = new Error();
    	err.message = "Attributes are not properly defined.";
    	callback(err, null);
    }
}

//Create a foreign key in an Entity
exports.createNewForeignKey = function(attr, callback) {

	if(attr.id_data_entity == null){
		var err = new Error();
		err.message = "You need to select or create a Data Entity before.";
		return callback(err, null);
	}

	var name = attr.options.showForeignKey;
	var codeName = attr.options.foreignKey;
	var version = 1;

	models.DataEntity.findOne({
		where: {
			codeName: attr.options.source
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
		models.DataField.create({
			name: name,
			codeName: codeName,
			type: "INTEGER",
			version: version,
			id_data_entity: dataEntity.id
		}).then(function(created_foreignKey) {
			var info = {};
			info.insertId = created_foreignKey.id;
			info.message = "New foreign key "+created_foreignKey.id+" | "+created_foreignKey.name+" created.";
			callback(null, info);
		}).catch(function(err) {
			callback(err, null);
		});
	}).catch(function(err) {
		callback(err, null);
	});
}

// Delete
exports.deleteDataField = function(attr, callback) {

	if(attr.id_data_entity == null){
		var err = new Error();
		err.message = "You have to select or create a Data Entity before.";
		return callback(err, null);
	}

	var id_data_entity = attr.id_data_entity;
	var options = attr.options;
	var name_data_field = options.value;

	models.DataField.destroy({
		where: {
			codeName: name_data_field,
			id_data_entity: id_data_entity
		}
	}).then(function() {
		var info = {};
		info.message = "Data field "+options.showValue+" deleted.";
		callback(null, info);
	}).catch(function(err) {
		callback(err, null);
	});
}

// List
exports.listDataField = function(attr, callback) {

	if(typeof attr.id_data_entity == "undefined" || attr.id_data_entity == null) {
		var err = new Error();
		err.message = "Please select a data entity before.";
		callback(err, null);
	} else {

		models.DataField.findAll({
			order: 'id DESC',
			include: [{
				model: models.DataEntity,
				include: [{
					model: models.Module,
					include: [{
						model: models.Application,
						where: {
							id: attr.id_application
						}
					}]
				}]
			}]
		}).then(function(dataFields) {

			var info = {};
			info.message = "List of data fields (module | entity | id field | name field): <br><ul>";
			if (!dataFields)
				info.message = info.message + "None\n";
			else
				for (var i=0; i<dataFields.length; i++)
					info.message += "<li>" + dataFields[i].DataEntity.Module.name + " | " + dataFields[i].DataEntity.name + " | " + dataFields[i].id + " | " + dataFields[i].name + "</li>";
				info.message += "</ul>";
				info.rows = dataFields;
				callback(null, info);
			}).catch(function(err){
				callback(err, null);
			});
		}
	}

// GetById
exports.getNameDataFieldById = function(id_data_field, callback) {
	if (typeof(id_data_field) !== 'number') {
		var err = new Error();
		err.message = "Id data field is not defined";
		return callback(err, null);
	}

	models.DataField.findOne({
		where: {
			id: id_data_field
		}
	}).then(function(dataField) {
		if (!dataField) {
			var err = new Error();
			err.message = "No data field found";
			return callback(err, null);
		}
		callback(null, dataField.name);
	}).catch(function(err) {
		callback(err, null);
	});
}

// GetTypeById
exports.getTypeDataFieldByEntityIdAndFieldName = function(id_data_entity, name_data_field, callback) {

	if (typeof(id_data_entity) !== 'number') {
		var err = new Error();
		err.message = "ID data field is not defined";
		return callback(err, null);
	}

	models.DataField.findOne({
		where: {
			id: id_data_entity,
			name: name_data_entity
		}
	}).then(function(dataField) {
		if (!dataField) {
			var err = new Error();
			err.message = "No data field found";
			return callback(err, null);
		}
		callback(null, dataField.type);
	}).catch(function(err){
		callback(err, null);
	});
}

// GetByName
exports.getDataFieldByID = function(idField, idEntity, callback) {

	models.DataField.findOne({
		where: {
			id: idField,
			id_data_entity: idEntity
		}
	}).then(function(dataField) {
		if (!dataField) {
			var err = new Error();
			err.message = "No data field with ID "+idField+" found in current entity.";
			return callback(err, null);
		}
		callback(null, dataField);
	}).catch(function(err){
		callback(err, null);
	});
}

// GetByName
exports.getIdDataFieldByName = function(attr, callback) {

	var id_data_entity = attr.id_data_entity;
	var options = attr.options;
	var name_data_field = options.value;
	var show_name_data_field = options.showValue;

	models.DataField.findOne({
		where: {
			codeName: name_data_field,
			id_data_entity: id_data_entity
		}
	}).then(function(dataField) {
		if (!dataField) {
			var err = new Error();
			err.message = "No data field with name "+show_name_data_field+" found in current entity.";
			return callback(err, null);
		}
		callback(null, dataField.id);
	}).catch(function(err){
		callback(err, null);
	});
}
