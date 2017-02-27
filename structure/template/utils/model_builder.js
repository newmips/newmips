var bcrypt = require('bcrypt-nodejs');

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
        } else if (typeof currentValue === 'string')
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
        if (prop !== 'id' && typeof body[prop] !== 'undefined') {
            if (body[prop] == "")
                body[prop] = null;
            object[prop] = body[prop];
            //we encryt all password attributes
            if (body[prop] != null
                    && !!attributes[prop].newmipsType
                    && attributes[prop].newmipsType === "password")
                object[prop] = bcrypt.hashSync(body[prop], null, null);
        }
    }

    // Association Field
    for (var i = 0; i < options.length; i++) {
        var association = options[i].as;
        var foreignKey = options[i].foreignKey.toLowerCase();
        var associationLower = association.toLowerCase();

        if (options[i].relation === 'belongsTo') {
            if (typeof body[association] !== 'undefined') {
                if (body[association] == "")
                    body[association] = null;
                object[foreignKey] = body[association];
            } else if (typeof body[associationLower] !== 'undefined') {
                if (body[associationLower] == "")
                    body[associationLower] = null;
                object[foreignKey] = body[associationLower];
            }
        }

    }
    return object;
}

// Register associations between sequelize models from options.json file.
// ex: {target: 'entityT', relation: 'hasMany'} -> models.SelfModel.hasMany(entityT);
exports.buildAssociation = function buildAssociation(selfModel, associations) {
    return function (models) {
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
    var foundAssociations = [];
    for (var i = 0; i < options.length; i++) {
        foundAssociations.push(new Promise(function (resolve, reject) {
            var asso = options[i];
            (function (option) {
                var modelName = option.target.charAt(0).toUpperCase() + option.target.slice(1).toLowerCase();
                var target = option.target;

                if (typeof option.as != "undefined") {
                    target = option.as.toLowerCase();
                }

                models[modelName].findAll().then(function (entities) {
                    resolve({model: target, rows: entities || []});
                }).catch(function (err) {
                    reject(err);
                });
            })(asso);
        }));
    }
    return foundAssociations;
}

// Find list of associations to create the datalist structure
exports.getDatalistStructure = function getDatalistStructure(options, attributes, mainEntity) {
    var structureDatalist = [];

    /* Get first attributes from the main entity */
    for (var attr in attributes) {
        if (attributes[attr].showValueInList) {
            structureDatalist.push({
                field: attr,
                type: attributes[attr].newmipsType,
                traductionKey: "entity." + mainEntity + "." + attr,
                associated: false
            });
        }
    }

    /* Then get attributes from other entity associated to main entity */
    for (var j = 0; j < options.length; j++) {
        if (options[j].relation.toLowerCase() == "hasone" || options[j].relation.toLowerCase() == "belongsto") {
            var currentAttributes = require('../models/attributes/' + options[j].target);
            for (var currentAttr in currentAttributes) {
                if (currentAttributes[currentAttr].showValueInList) {
                    structureDatalist.push({
                        field: currentAttr,
                        type: currentAttributes[currentAttr].newmipsType,
                        entity: options[j].as,
                        traductionKey: "entity." + options[j].target + "." + currentAttr,
                        associated: true
                    });
                }
            }
        }
    }
    return structureDatalist;
}

exports.getDatalistInclude = function getDatalistInclude(models, options) {
    var structureDatalist = [];

    /* Then get attributes from other entity associated to main entity */
    for (var i = 0; i < options.length; i++) {
        if (options[i].relation.toLowerCase() == "hasone" || options[i].relation.toLowerCase() == "belongsto") {
            var target = capitalizeFirstLetter(options[i].target.toLowerCase());
            structureDatalist.push({
                model: models[target],
                as: options[i].as
            });
        }
    }
    return structureDatalist;
}

exports.getTwoLevelIncludeAll = function getDatalistInclude(models, options) {
    var structureDatalist = [];

    /* Two level of all inclusion */
    for (var i = 0; i < options.length; i++) {
        var target = capitalizeFirstLetter(options[i].target.toLowerCase());

        var toPush = {
            model: models[target],
            as: options[i].as
        };

        /* Go deeper in second level include */
        var optionsSecondLevel = require('../models/options/' + options[i].target.toLowerCase());
        var includeSecondLevel = [];
        for (var j = 0; j < optionsSecondLevel.length; j++) {
            var targetSecondLevel = capitalizeFirstLetter(optionsSecondLevel[j].target.toLowerCase());
            includeSecondLevel.push({
                model: models[targetSecondLevel],
                as: optionsSecondLevel[j].as
            });
        }

        toPush.include = includeSecondLevel;
        structureDatalist.push(toPush);
    }
    return structureDatalist;
}