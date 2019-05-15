const bcrypt = require('bcrypt-nodejs');
const fs = require('fs-extra');
const Sequelize = require('sequelize');
const dbConfig = require('../config/database');
const validators = require('../models/validators')
let entity_helper;

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

// Parse each entity's fields and check if validation is required
// Get validator and modify attributes object so sequelize can handle validation
exports.attributesValidation = function (attributes) {
    for (let field in attributes) {
        field = attributes[field];
        let validation;
        if (field.validate == true && (validation = validators.getValidator(field)))
            field.validate = validation;
        else
            delete field.validate;
    }
}

// PARAMETERS:
//  models: require('models/')
//  headEntity: The entity on which include will be used.
//              Ex: 'e_user'
//  fieldsArray: An array of the fields that will be used and need to be included.
//              Ex: ['r_project.r_ticket.f_name', 'r_user.r_children.r_parent.f_name', 'r_user.r_children.r_grandparent']
// RETURNS:
//  Returns a sequelize valid include object.
//              Ex: [{model: E_project, as:'r_project'}, {model: E_user, as:'r_user', include: [{model: E_user, as:'r_children'}]}}]
exports.getIncludeFromFields = function(models, headEntity, fieldsArray) {
    var globalInclude = [];
    function buildInclude(currentEntity, includeObject, depths, idx = 0) {
        if (depths.length-1 == idx)
            return ;
        var entityOptions = require('../models/options/'+currentEntity);

        for (var j = 0; j < entityOptions.length; j++) {
            if (entityOptions[j].as == depths[idx]) {
                // If include for current depth exists, fill the same object
                for (var i = 0; i < includeObject.length; i++)
                    if (includeObject[i].as == depths[idx])
                        return buildInclude(entityOptions[j].target, includeObject[i].include, depths, ++idx);

                // Uppercase target's first letter to build model name. This is necessary because of component `C`_adresse
                var modelPrefix = entityOptions[j].target.charAt(0).toUpperCase()+'_';
                // If include for current depth doesn't exists, create it and send include array to recursive buildInclude
                var depthInclude = {
                    model: models[modelPrefix+entityOptions[j].target.slice(2)],
                    as: depths[idx],
                    include: [],
                    duplicating: false
                }
                buildInclude(entityOptions[j].target, depthInclude.include, depths, ++idx);
                return includeObject.push(depthInclude)
            }
        }
    }

    for (var field = 0; fieldsArray[field] && field < fieldsArray.length; field++)
        buildInclude(headEntity, globalInclude, fieldsArray[field].split('.'));

    return globalInclude;
}

// Used by filter_datatable and `/subdatalist` to build search query object
exports.formatSearch = function (column, searchValue, type) {
    var formatedSearch = {};

    switch(type){
        case 'datetime':
            if (searchValue.indexOf(' ') != -1)
                formatedSearch['$between'] = [searchValue, searchValue];
            else
                formatedSearch['$between'] = [searchValue + ' 00:00:00', searchValue + ' 23:59:59'];
            break;
        case 'date':
            formatedSearch['$between'] = [searchValue + ' 00:00:00', searchValue + ' 23:59:59'];
            break;
        case 'boolean':
            switch(searchValue){
                case 'null':
                    formatedSearch = null;
                    break;
                case 'checked':
                    formatedSearch = true;
                    break;
                case 'unchecked':
                    formatedSearch = false;
                    break;
            }
            break;
        case 'currency':
            formatedSearch = models.Sequelize.where(models.Sequelize.col(column), {
                like: `${searchValue}%`
            });
            break;
        default:
            formatedSearch = {
                $like: '%' + searchValue + '%'
            };
            break;
    }

    var field = column, searchLine = {};
    if (field.indexOf('.') != -1)
        field = `$${field}$`;

    searchLine[field] = formatedSearch;
    return searchLine;
}

// Build the attribute object for sequelize model's initialization
// It convert simple attribute.json file to correct sequelize model descriptor
exports.buildForModel = function objectify(attributes, DataTypes, addTimestamp = true, recursionLevel = 0) {
    var object = {};
    for (var prop in attributes) {
        var currentValue = attributes[prop];
        if (typeof currentValue === 'object' && currentValue != null) {
            if (currentValue.type == 'ENUM')
                object[prop] = DataTypes.ENUM(currentValue.values);
            else
                object[prop] = objectify(currentValue, DataTypes, addTimestamp, recursionLevel+1);
        } else if (typeof currentValue === 'string' && prop != 'newmipsType')
            object[prop] = DataTypes[currentValue];
        else
            object[prop] = currentValue;
    }
    if (addTimestamp && recursionLevel == 0) {
        if (dbConfig.dialect == 'sqlite') {
            // SQLite3 dialect
            object["createdAt"] = {"type": DataTypes.DATE(), "defaultValue": Sequelize.NOW};
            object["updatedAt"] = {"type": DataTypes.DATE(), "defaultValue": Sequelize.NOW};
        } else {
            object["createdAt"] = {"type": DataTypes.DATE(), "defaultValue": Sequelize.fn('NOW')};
            object["updatedAt"] = {"type": DataTypes.DATE(), "defaultValue": Sequelize.fn('NOW')};
        }
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

            if(association.constraints != null)
                options.constraints = association.constraints;

            models[selfModel][association['relation']](models[target], options);
        }
    }
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

        async function setAssociationMany(){
            // Loop on option to match the alias and to verify alias that are linked to hasMany or belongsToMany association
            for (var i=0; i<options.length; i++) {
                // Loop on the unused (for now) values in body
                for (var j=0; j<unusedValueFromReqBody.length; j++) {
                    // If the alias match between the option and the body
                    if (typeof options[i].as != "undefined" && options[i].as.toLowerCase() == unusedValueFromReqBody[j].toLowerCase()){
                        // BelongsTo association have been already done before
                        if(options[i].relation != "belongsTo"){
                            var target = options[i].as.charAt(0).toUpperCase() + options[i].as.toLowerCase().slice(1);
                            var value = [];

                            // Empty string is not accepted by postgres, clean array to avoid error
                            if(body[unusedValueFromReqBody[j]].length > 0){
                                // If just one value in select2, then it give a string, not an array
                                if(typeof body[unusedValueFromReqBody[j]] == "string"){
                                    if(body[unusedValueFromReqBody[j]] != "")
                                        value.push(parseInt(body[unusedValueFromReqBody[j]]))
                                } else if(typeof body[unusedValueFromReqBody[j]] == "object") {
                                    for(var val in body[unusedValueFromReqBody[j]])
                                        if(body[unusedValueFromReqBody[j]][val] != "")
                                            value.push(parseInt(body[unusedValueFromReqBody[j]][val]))
                                }
                            }
                            try {
                                await model['set' + target](value);
                                if (!entity_helper)
                                    entity_helper = require('./entity_helper');

                                // Log association in Journal
                                entity_helper.synchro.writeJournal({
                                    verb: "associate",
                                    id: model.id,
                                    target: options[i].target,
                                    entityName: model._modelOptions.name.singular.toLowerCase(),
                                    func: 'set' + target,
                                    ids: value
                                });
                            } catch(err){
                                throw err
                            }
                        }
                    }
                }
            }
        }

        setAssociationMany().then(function(){
            resolve();
        }).catch(function(err){
            reject(err);
        })
    })
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