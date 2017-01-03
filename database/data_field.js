// **** Database Generator Field ****
var models = require('../models/');

// Create new Data Field in Data Entity
exports.createNewDataField = function(attr, callback) {

	if(attr.id_data_entity == null){
		var err = new Error();
		err.message = "You have to select or create a data entity before.";
		return callback(err, null);
	}

	var name = "";
	var type = "string";
	var nillable = 0;
	var min_length = -1;
	var max_length = -1;
	var class_object = "";
	var id = -1;
	var version = 1;

	if(typeof attr !== 'undefined' && attr){

        // Set id_data_entity of future data_field according to session value transmitted in attributes
        id_data_entity = attr['id_data_entity'];

        // Set options variable using the attribute array
        options = attr['options'];

        if (typeof options !== 'undefined' && options && id_data_entity != "") {

            // Check each options variable to set properties
            i = 0;
            while (i < options.length) {
            	if (typeof options[i] !== 'undefined' && options[i]) {
            		if (options[i].property == "entity") name = options[i].value;
            		if (options[i].property == "name") name = options[i].value;
            		if (options[i].property == "type") type = options[i].value;
            		if (options[i].property == "nillable") nillable = options[i].value;
            		if (options[i].property == "minimum length") min_length = options[i].value;
            		if (options[i].property == "maximum length") max_length = options[i].value;
            		if (options[i].property == "class") class_object = options[i].value;
            	}
            	i++;
            }

            models.DataField.findOne({
            	where: {
            		id_data_entity: id_data_entity,
            		name: name
            	}
            }).then(function(dataField) {
            	if (dataField) {
            		var err = new Error();
            		err.message = "Field already exists";
            		return callback(err, null);
            	}

            	models.DataField.create({
            		name: name,
            		type: type,
            		nillable: nillable,
            		min_length: min_length,
            		max_length: max_length,
            		class_object: class_object,
            		id_data_entity: id_data_entity,
            		version: version
            	}).then(function(dataField) {
            		var info = {
            			insertId: dataField.id,
            			message: "New data field " + dataField.id + " | " + name + " created."
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

	var name = attr.options.foreignKey;
	var nillable = 0;
	var min_length = -1;
	var max_length = -1;
	var class_object = "";
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
		models.DataField.create({
			name: name,
			type: "INTEGER",
			nillable: nillable,
			min_length: min_length,
			max_length: max_length,
			class_object: class_object,
			version: version,
			id_data_entity: dataEntity.id
		}).then(function(created_foreignKey) {
			var info = {};
			info.insertId = created_foreignKey.id;
			info.message = "New foreign key " + created_foreignKey.id + " | " + created_foreignKey.name + " created.";
			callback(null, info);
		});
	}).catch(function(err) {
		callback(err, null);
	})
}

// Delete
exports.deleteDataField = function(attr, callback) {

	if(attr.id_data_entity == null){
		var err = new Error();
		err.message = "You have to select or create a Data Entity before.";
		return callback(err, null);
	}

	var id_data_entity = attr['id_data_entity'];
	options = attr['options'];

	for (var i = 0; i < options.length; i++)
		if (options[i].property == 'entity')
			name_data_field = options[i].value;

		models.DataField.destroy({
			where: {
				name: name_data_field,
				id_data_entity: id_data_entity
			}
		}).then(function() {
			var info = {};
			info.message = "Data field " + name_data_field + " deleted.";
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
				where: {
					id: attr.id_data_entity
				}
			}]
		}).then(function(dataFields) {
			var info = new Array();
			info.message = "List of data fields (id | name): \n";
			if (!dataFields)
				info.message = info.message + "None\n";
			else
				for (var i = 0; i < dataFields.length; i++)
					info.message += dataFields[i].id + " | " + dataFields[i].name + "\n";
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
exports.getIdDataFieldByName = function(name_data_field, callback) {

	if (typeof(name_data_field) !== 'string') {
		varerr = new Error();
		err.message = "Name of data field is not defined";
		return callback(err, null);
	}

	models.DataField.findOne({
		where: {
			name: name_data_field
		}
	}).then(function(dataField) {
		if (!dataField) {
			var err = new Error();
			err.message = "No data field found";
			return callback(err, null);
		}
		callback(null, dataField.id);
	}).catch(function(err){
		callback(err, null);
	});
}
