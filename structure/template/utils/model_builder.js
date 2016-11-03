function capitalizeFirstLetter(word) {
	return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

// Build the attribute object for sequelize model's initialization
// It convert simple attribute.json file to correct sequelize model descriptor
exports.buildForModel = function objectify(attributes, DataTypes) {
	var object = {};
	for (var prop in attributes) {
		var currentValue = attributes[prop];
		if (typeof currentValue === 'object') {
			if (currentValue.type == 'ENUM')
				object[prop] = DataTypes.ENUM(currentValue.values);
			else
				object[prop] = objectify(currentValue, DataTypes);
		}
		else if (typeof currentValue === 'string')
			object[prop] = DataTypes[currentValue];
		else
			object[prop] = currentValue;
	}
	return object;
}

// Build create / update object for routes /create and /update
// It find correspondances between req.body and attributes.
exports.buildForRoute = function buildForRoute(attributes, options, body) {
	var object = {};

	// Simple field
	for (var prop in attributes) {
		if (prop !== 'id' && typeof body[prop] !== 'undefined')
			object[prop] = body[prop];
	}

	// Association Field
	for (var i = 0; i < options.length; i++) {
		var association = options[i].as;

		if (options[i].relation === 'belongsTo' && typeof body[association] !== 'undefined')
			object[association] = body[association];
	}

	return object;
}

// Register associations between sequelize models from options.json file.
// ex: {target: 'entityT', relation: 'hasMany'} -> models.SelfModel.hasMany(entityT);
exports.buildAssociation = function buildAssociation(selfModel, associations) {
	return function(models) {
		for (var i = 0; i < associations.length; i++) {
			var association = associations[i];
			var options = {};
			var target = capitalizeFirstLetter(association.target.toLowerCase());

			options.foreignKey = association.foreignKey.toLowerCase();
			options.as = association.as.toLowerCase();
			if (association.relation === 'belongsToMany')
				options.through = association.through;
			options.allowNull = true;

			models[selfModel][association['relation']](models[target], options);
		}
	}
}

// Find list of associations to display into list on create_form and update_form
exports.associationsFinder = function associationsFinder(models, options) {
	var foundAssociations = []
    for (var i = 0; i < options.length; i++) {
        foundAssociations.push(new Promise(function(resolve, reject) {
            var asso = options[i];
            (function(option) {
            	var modelName = option.target.charAt(0).toUpperCase() + option.target.slice(1).toLowerCase();
            	var target = option.target;

            	if(typeof option.as != "undefined"){
            		target = option.as.toLowerCase();
            	}

                models[modelName].findAll().then(function(entities) {
                    resolve({model: target, rows: entities || []});
                }).catch(function(err) {
                    reject(err);
                });
            })(asso);
        }));
    }
    return foundAssociations;
}

