var bcrypt = require('bcrypt-nodejs');
var fs = require('fs-extra');
var Sequelize = require('sequelize');

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

exports.addHooks = function (Model, model_name, attributes) {
    var hooks = require('../models/hooks')(model_name, attributes);
    for (var hookType in hooks) {
        for (var i = 0; i < hooks[hookType].length; i++) {
            var hook = hooks[hookType][i];
            if (hook.name)
                Model.addHook(hookType, hook.name, hook.func);
            else
                Model.addHook(hookType, hook.func);
        }
    }
}

// Build the attribute object for sequelize model's initialization
// It convert simple attribute.json file to correct sequelize model descriptor
exports.buildForModel = function objectify(attributes, DataTypes, addTimestamp) {
    addTimestamp = typeof addTimestamp === 'undefined' ? true : addTimestamp;
    var object = {};
    for (var prop in attributes) {
        var currentValue = attributes[prop];
        if (typeof currentValue === 'object' && currentValue != null) {
            if (currentValue.type == 'ENUM')
                object[prop] = DataTypes.ENUM(currentValue.values);
            else
                object[prop] = objectify(currentValue, DataTypes);
        } else if (typeof currentValue === 'string')
            object[prop] = DataTypes[currentValue];
        else
            object[prop] = currentValue;
    }
    if (addTimestamp) {
        object["createdAt"] = {"type": DataTypes.DATE(), "defaultValue": Sequelize.fn('NOW')};
        object["updatedAt"] = {"type": DataTypes.DATE(), "defaultValue": Sequelize.fn('NOW')};
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
            if (association.relation === 'belongsToMany'){
                options.otherKey = association.otherKey;
                options.through = association.through;
            }
            options.allowNull = true;

            models[selfModel][association['relation']](models[target], options);
        }
    }
}

// Find list of associations to display into list on create_form and update_form
exports.associationsFinder = function associationsFinder(models, options, attributes) {
    var foundAssociations = [];

    /* Example limitAttr, set just the needed fields instead of load them all
    var limitAttr = {
        r_collectivite: ["id", "f_code_gestion", "f_nom"],
        r_dechetteries_a_visiter: ["id", "f_code_gestion", "f_nom"],
        r_intervenant_ecodds: ["id", "f_email"]
    };*/

    var limitAttr = [];
    if(typeof attributes !== "undefined")
        limitAttr = attributes;

    for (var i = 0; i < options.length; i++) {
        foundAssociations.push(new Promise(function (resolve, reject) {
            var asso = options[i];
            (function (option) {
                var modelName = option.target.charAt(0).toUpperCase() + option.target.slice(1).toLowerCase();
                var target = option.target;

                if (typeof option.as != "undefined") {
                    target = option.as.toLowerCase();
                }

                if(typeof limitAttr[target] !== "undefined"){
                    models[modelName].findAll({
                        attributes: limitAttr[target]
                    }).then(function (entities) {
                        resolve({model: target, rows: entities || []});
                    }).catch(function (err) {
                        reject(err);
                    });
                } else {
                    models[modelName].findAll().then(function (entities) {
                        resolve({model: target, rows: entities || []});
                    }).catch(function (err) {
                        reject(err);
                    });
                }
            })(asso);
        }));
    }
    return foundAssociations;
}

// Check for value in req.body that corresponding on hasMany or belongsToMany association in create or update form of an entity
exports.setAssocationManyValues = function setAssocationManyValues(model, body, buildForRouteObj, options) {
    return new Promise(function(resolve, reject) {
        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now

        // List unsed value in req.body for now
        var unusedValueFromReqBody = [];

        for(var propBody in body){
            var toAdd = true;
            for(var propObj in buildForRouteObj){
                if(propBody == "id" || propBody == propObj)
                    toAdd = false;
            }
            if(toAdd)
                unusedValueFromReqBody.push(propBody);
        }

        var cpt = 0;
        if(unusedValueFromReqBody.length == 0)
            return resolve();

        var promises = [];
        // Loop on option to match the alias and to verify alias that are linked to hasMany or belongsToMany association
        for (var i=0; i<options.length; i++) {
            // Loop on the unused (for now) values in body
            for (var j=0; j<unusedValueFromReqBody.length; j++) {
                promises.push(new Promise(function(resolveBis, rejectBis){
                    // if the alias match between the option and the body
                    if (typeof options[i].as != "undefined" && options[i].as.toLowerCase() == unusedValueFromReqBody[j].toLowerCase()){
                        // BelongsTo association have been already done before
                        if(options[i].relation != "belongsTo"){
                            var target = options[i].as.charAt(0).toUpperCase() + options[i].as.toLowerCase().slice(1);
                            var value = [];

                            if(body[unusedValueFromReqBody[j]].length > 0)
                                value = body[unusedValueFromReqBody[j]];

                            model['set' + target](value).then(function(){
                                resolveBis();
                            });
                        } else {
                            resolveBis();
                        }
                    } else {
                        resolveBis();
                    }
                }));
            }
        }

        Promise.all(promises).then(function(){
            resolve();
        });
    });
}

exports.getDatalistInclude = function getDatalistInclude(models, options, columns) {
    var structureDatalist = [];

    /* Then get attributes from other entity associated to main entity */
    for (var i = 0; i < options.length; i++) {
        if (options[i].relation.toLowerCase() == "hasone" || options[i].relation.toLowerCase() == "belongsto") {
            var target = capitalizeFirstLetter(options[i].target.toLowerCase());

            var include = {
                model: models[target],
                as: options[i].as
            };
            // Add include's attributes for performance
            var attributes = [];
            for (var j = 0; j < columns.length; j++) {
                if (columns[j].data.indexOf('.') == -1)
                    continue;
                var parts = columns[j].data.split('.');
                if (parts[0] == options[i].as)
                    attributes.push(parts[1]);
            }
            if (attributes.length && target != "E_status")
                include.attributes = attributes;
            structureDatalist.push(include);
        }
    }
    return structureDatalist;
}

exports.getTwoLevelIncludeAll = function getTwoLevelIncludeAll(models, options) {
    var structureDatalist = [];

    /* Two level of all inclusion */
    for (var i = 0; i < options.length; i++) {
        var target = capitalizeFirstLetter(options[i].target.toLowerCase());

        var toPush = {
            model: models[target],
            as: options[i].as
        };

        /* Go deeper in second level include */
        var optionsSecondLevel = JSON.parse(fs.readFileSync(__dirname+'/../models/options/' + options[i].target.toLowerCase()+'.json', 'utf8'));
        var includeSecondLevel = [];
        for (var j = 0; j < optionsSecondLevel.length; j++) {
            var targetSecondLevel = capitalizeFirstLetter(optionsSecondLevel[j].target.toLowerCase());

            var include = {
                model: models[targetSecondLevel],
                as: optionsSecondLevel[j].as,
                include: []
            };

            if (optionsSecondLevel[j].target.indexOf('e_history_e_') != 0) {
                try {
                    // Check if second level entity has a status component
                    // If so, add thrid include level to fetch status's children and be able to display next buttons
                    var optionsThirdLevel = JSON.parse(fs.readFileSync(__dirname+'/../models/options/'+optionsSecondLevel[j].target+'.json', 'utf8'));
                    for (var k = 0; k < optionsThirdLevel.length; k++) {
                        if (optionsThirdLevel[k].target == 'e_status') {
                            include.include.push({
                                model: models.E_status,
                                as: optionsThirdLevel[k].as
                            });
                            break;
                        }
                    }
                } catch (e){console.error("Problem fetching 3rd level include for subentity status display");}
            }
            includeSecondLevel.push(include);
        }

        toPush.include = includeSecondLevel;
        structureDatalist.push(toPush);
    }
    return structureDatalist;
}