/*
 * Update local Entity Data before show or any
 */
var file_helper = require('./file_helper');
var logger = require('./logger');
var fs = require('fs-extra');
var language = require('../services/language');

// Winston logger
var logger = require('./logger');

var funcs = {
    capitalizeFirstLetter: function(word) {
        return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
    },
    status: {
        entityFieldTree: function (entity, alias) {
            var fieldTree = {
                entity: entity,
                alias: alias || entity,
                fields: [],
                children: []
            }

            try {
                var entityFields = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+entity+'.json'));
                var entityAssociations = JSON.parse(fs.readFileSync(__dirname+'/../models/options/'+entity+'.json'));
            } catch (e) {
                console.error(e);
                return fieldTree;
            }

            // Building field array
            for (var field in entityFields)
                fieldTree.fields.push(field);

            // Building children array
            for (var i = 0; i < entityAssociations.length; i++)
                if (entityAssociations[i].relation == 'belongsTo')
                    fieldTree.children.push(this.entityFieldTree(entityAssociations[i].target, entityAssociations[i].as));

            return fieldTree;
        },
        generateEntityInclude: function(models, entity) {
            var entityTree = this.entityFieldTree(entity);

            function includeBuilder(obj) {
                var includes = [];
                for (var i = 0; obj.children && i < obj.children.length; i++) {
                    var include = {};
                    var child = obj.children[i];
                    include.as = child.alias;
                    include.model = models[funcs.capitalizeFirstLetter(child.entity)];
                    if (child.children && child.children.length != 0) {
                        include.include = includeBuilder(child);
                    }
                    includes.push(include);
                }
                return includes;
            }
            return includeBuilder(this.entityFieldTree(entity));
        },
        entityFieldForSelect: function(entity, lang) {
            var mainTree = this.entityFieldTree(entity);
            var __ = language(lang).__;
            var separator = ' > ';
            var options = [];
            function dive(obj, codename) {
                for (var j = 0; j < obj.fields.length; j++) {
                    if (obj.fields[j].indexOf('f_') != 0)
                        continue;
                    var traduction = __('entity.'+obj.entity+'.label_entity') + separator +__('entity.'+obj.entity+'.'+obj.fields[j]);
                    options.push({
                        codename: !codename ? obj.fields[j] : codename+'.'+obj.fields[j],
                        traduction: traduction
                    });
                }

                for (var i = 0; i < obj.children.length; i++)
                    dive(obj.children[i], !codename ? obj.children[i].alias : codename+'.'+obj.children[i].alias);
            }

            // Build options array
            dive(mainTree);

            // Sort options array
            function sort(optsArray, i) {
                if (!optsArray[i+1])
                    return;
                var firstParts = optsArray[i].traduction.split(separator);
                var secondParts = optsArray[i+1].traduction.split(separator);
                if (firstParts[0].toLowerCase() > secondParts[0].toLowerCase()) {
                    var swap = optsArray[i+1];
                    optsArray[i+1] = optsArray[i];
                    optsArray[i] = swap;
                    return sort(optsArray, i == 0 ? i : i-1);
                }
                else if (firstParts[0].toLowerCase() == secondParts[0].toLowerCase()
                    && firstParts[1].toLowerCase() > secondParts[1].toLowerCase()) {
                    var swap = optsArray[i+1];
                    optsArray[i+1] = optsArray[i];
                    optsArray[i] = swap;
                    return sort(optsArray, i == 0 ? i : i-1);
                }
                return sort(optsArray, i+1);
            }
            sort(options, 0);

            return options;
        },
        entityStatusFieldList: function() {
            var self = this;
            var entities = [];
            fs.readdirSync(__dirname+'/../models/attributes').filter(function(file){
                return (file.indexOf('.') !== 0) && (file.slice(-5) === '.json');
            }).forEach(function(file){
                var entityName = file.slice(0, -5);
                var attributesObj = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+file));
                var statuses = self.statusFieldList(attributesObj);
                if (statuses.length > 0) {
                    for (var i = 0; i < statuses.length; i++)
                        statuses[i] = {status: statuses[i], statusTrad: 'entity.'+entityName+'.'+statuses[i]};
                    entities.push({entity: entityName, entityTrad: 'entity.'+entityName+'.label_entity', statuses: statuses});
                }
            });

            // return value example: [{
            //     entity: 'e_test',
            //     entityTrad: 'entity.e_test.label_entity',
            //     statuses: [{
            //         status: 's_status',
            //         statusTrad: 'entity.e_test.s_status'
            //     }]
            // }];
            return entities;
        },
        statusFieldList: function(attributes) {
            var list = [];
            for (var prop in attributes)
                if (prop.indexOf('s_') == 0)
                    list.push(prop);
            return list;
        },
        translate: function(entity, attributes, lang) {
            var self = this;
            var statusList = self.statusFieldList(attributes);

            for (var i = 0; i < statusList.length; i++) {
                var statusAlias = 'r_'+statusList[i].substring(2);
                if (!entity[statusAlias] || !entity[statusAlias].r_translations)
                    continue;
                for (var j = 0; j < entity[statusAlias].r_translations.length; j++) {
                    if (entity[statusAlias].r_translations[j].f_language == lang) {
                        entity[statusAlias].f_name = entity[statusAlias].r_translations[j].f_value;
                        break;
                    }
                }
            }
        },
        currentStatus: function(models, entityName, entity, attributes, lang) {
            var self = this;
            return new Promise(function(resolve, reject) {
                var statusList = self.statusFieldList(attributes);
                if (statusList.length == 0)
                    return resolve([]);

                var nextStatusPromises = [];
                // Get the last history of each status field
                // Include r_children to have next status
                for (var i = 0; i < statusList.length; i++) {
                    var model = 'E_history_'+entityName+'_'+statusList[i];
                    var where = {};
                    where['fk_id_'+entityName.substring(2)+'_history_'+statusList[i].substring(2)] = entity.id;
                    (function(status, Model, whereCls) {
                        nextStatusPromises.push(Model.findAll({
                            limit: 1,
                            order: 'createdAt DESC',
                            where: whereCls,
                            include: [{
                                model: models.E_status,
                                as: 'r_'+status.substring(2),
                                include: [{
                                    model: models.E_translation,
                                    as: 'r_translations'
                                }]
                            }]
                        }));
                    })(statusList[i], models[model], where);
                }

                Promise.all(nextStatusPromises).then(function(histories) {
                    // Queries have limit 1, we know there's only one row in each array
                    // Remove useless array and assign current R_status (r_[alias])
                    for (var i = 0; i < statusList.length; i++)
                        if (histories[i][0] && histories[i][0]['r_'+statusList[i].substring(2)]) {
                            histories[i] = histories[i][0]['r_'+statusList[i].substring(2)];
                            histories[i].translate(lang);
                            entity[statusList[i]] = histories[i].f_name;
                        }

                    resolve();
                }).catch(function(err){
                    console.log(err);
                    reject(err);
                });
            });
        }
    },
    error500: function(err, req, res, redirect) {
        var isKnownError = false;
        try {
            var lang = "fr-FR";
            if(typeof req.session.lang_user !== "undefined")
                lang = req.session.lang_user;

            var __ = language(lang).__;

            //Sequelize validation error
            if (err.name == "SequelizeValidationError") {
                req.session.toastr.push({level: 'error', message: err.errors[0].message});
                isKnownError = true;
            }

            // Unique value constraint error
            if (typeof err.parent !== "undefined" && err.parent.errno == 1062) {
                var message = __('message.unique') + " " + err.errors[0].path;
                req.session.toastr.push({level: 'error', message: message});
                isKnownError = true;
            }

        } finally {
            if (isKnownError)
                return res.redirect(redirect || '/');
            else
                console.error(err);
            logger.debug(err);
            var data = {};
            data.code = 500;
            data.message = err.message || null;
            res.render('common/error', data);
        }
    },
    getPicturesBuffers: function(entity, attributes, options, modelName)  {
        try{
            for (var key in entity.dataValues) {
                // Image managment in standard fields
                for (var attribute in attributes) {
                    if (attributes[attribute].newmipsType === 'picture' &&
                        attribute == key) {
                        (function(keyCopy) {
                            var value = entity.dataValues[keyCopy] || '';
                            var partOfValue = value.split('-');
                            if (partOfValue.length > 1) {
                                var path = modelName.toLowerCase() + '/' + partOfValue[0] + '/' + entity.dataValues[keyCopy];
                                file_helper.getFileBuffer64(path, function(success, buffer) {
                                    // entity.dataValues[keyCopy] = buffer;
                                    entity.dataValues[keyCopy] = {
                                        value: value,
                                        buffer: buffer
                                    };
                                });
                            }
                        }(key));
                        break;
                    }
                }

                // Image managment in relation fields
                if(entity.dataValues[key] != null && typeof entity.dataValues[key].dataValues !== "undefined"){
                    for(var i=0; i<options.length; i++){
                        if(options[i].as == key){
                            var optionAttributes = require('../models/attributes/'+options[i].target);
                            for (var optionKey in entity.dataValues[key].dataValues) {
                                for (var optionAttribute in optionAttributes) {
                                    if (optionAttributes[optionAttribute].newmipsType === 'picture' &&
                                        optionAttribute == optionKey) {
                                        (function(keyCopy, optionKeyCopy) {
                                            var value = entity.dataValues[keyCopy].dataValues[optionKeyCopy] || '';
                                            var partOfValue = value.split('-');
                                            if (partOfValue.length > 1) {
                                                var path = options[i].target.toLowerCase() + '/' + partOfValue[0] + '/' + entity.dataValues[keyCopy].dataValues[optionKeyCopy];
                                                file_helper.getFileBuffer64(path, function(success, buffer) {
                                                    // entity.dataValues[optionKeyCopy] = buffer;
                                                    entity.dataValues[keyCopy].dataValues[optionKeyCopy] = {
                                                        value: value,
                                                        buffer: buffer
                                                    };
                                                });
                                            }
                                        }(key, optionKey));
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return entity;
        } catch(e){
            console.log(e);
        }
    },
    remove_files: function(entityName, entity, attributes) {
        for (var key in entity.dataValues) {
            for (var attribute in attributes) {
                if ((attributes[attribute].newmipsType === 'file' ||
                        attributes[attribute].newmipsType === "cloudfile" ||
                        attributes[attribute].newmipsType === "picture") &&
                    attribute == key) {
                    var value = entity.dataValues[key] || '';
                    if (value != '' && !!entityName) {
                        var options = {
                            entityName: entityName,
                            value: value,
                            type: attributes[attribute].newmipsType,
                        };
                        file_helper.deleteEntityFile(options);
                    }
                    break;
                }
            }
        }
    },
    find_include: function(includes, searchType, toFind) {
        var type = '';
        switch (searchType) {
            case "model":
                type = 'model';
                break;
            case "as":
                type = 'as';
                break;
            default:
                type = 'model';
                break;
        }
        for (var i = 0; i < includes.length; i++) {
            var include = includes[i];
            var name = (type == 'model' ? include[type].name : include.as);
            if (name == toFind) {
                return include;
            }
        }
    }
};

module.exports = funcs;