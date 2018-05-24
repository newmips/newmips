/*
 * Update local Entity Data before show or any
 */
var file_helper = require('./file_helper');
var logger = require('./logger');
var fs = require('fs-extra');
var language = require('../services/language');
var models = require('../models/');
var enums_radios = require('../utils/enum_radio.js');
var globalConfig = require('../config/global');

// Winston logger
var logger = require('./logger');

var funcs = {
    capitalizeFirstLetter: function(word) {
        return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
    },
    prepareDatalistResult: function(entityName, data, lang_user) {
        return new Promise(function(resolve, reject) {
            var attributes = require('../models/attributes/'+entityName);
            var options = require('../models/options/'+entityName);
            var statusPromises = [];
            if (funcs.status.statusFieldList(attributes).length > 0)
                for (var i = 0; i < data.data.length; i++)
                    statusPromises.push(funcs.status.currentStatus(models, entityName, data.data[i], attributes, lang_user));

            Promise.all(statusPromises).then(function () {
                // Replace data enum value by translated value for datalist
                var enumsTranslation = enums_radios.translated(entityName, lang_user, options);
                var todo = [];
                for (var i = 0; i < data.data.length; i++) {
                    for (var field in data.data[i]) {
                        // Look for enum translation
                        for (var enumEntity in enumsTranslation)
                            for (var enumField in enumsTranslation[enumEntity])
                                if (enumField == field)
                                    for (var j = 0; j < enumsTranslation[enumEntity][enumField].length; j++)
                                        if (enumsTranslation[enumEntity][enumField][j].value == data.data[i][field]) {
                                            data.data[i][field] = enumsTranslation[enumEntity][enumField][j].translation;
                                            break;
                                        }

                        //get attribute value
                        var value = data.data[i][field];
                        //for type picture, get thumbnail picture
                        if (typeof attributes[field] != 'undefined' && attributes[field].newmipsType == 'picture' && value != null) {
                            var partOfFile = value.split('-');
                            if (partOfFile.length > 1) {
                                //if field value have valide picture name, add new task in todo list
                                //we will use todo list to get all pictures binary
                                var thumbnailFolder = globalConfig.thumbnail.folder;
                                var filePath = thumbnailFolder + entityName+'/' + partOfFile[0] + '/' + value;
                                todo.push({
                                    value: value,
                                    file: filePath,
                                    field: field,
                                    dataIndex: i
                                });
                            }
                        }
                    }
                }
                //check if we have to get some picture buffer before send data
                if (todo.length) {
                    var counter = 0;
                    for (var i = 0; i < todo.length; i++) {
                        (function (task) {
                            file_helper.getFileBuffer64(task.file, function (success, buffer) {
                                counter++;
                                data.data[task.dataIndex][task.field] = {
                                    value: task.value,
                                    buffer: buffer
                                };
                                if (counter === todo.length)
                                    resolve(data)

                            });
                        }(todo[i]));
                    }
                } else
                    resolve(data)
            }).catch(reject);
        });
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
    optimizedFindOne: function(modelName, idObj, options, forceOptions) {
        // Split SQL request if too many inclusion
        return new Promise(function(resolve, reject){
            var include = [];
            for (var i = 0; i < options.length; i++)
                if (options[i].structureType == 'relatedTo' || options[i].structureType == 'relatedToMultiple') {
                    var opt = {
                        model: models[funcs.capitalizeFirstLetter(options[i].target)],
                        as: options[i].as
                    };
                    // Include status children
                    if (options[i].target == 'e_status')
                        opt.include = {model: models.E_status, as: 'r_children'};
                    include.push(opt);
                }

            if (forceOptions && forceOptions.length)
                include = include.concat(forceOptions);

            if(include.length >= 6) {
                var firstLength = Math.floor(include.length / 2);
                var secondLength = include.length - firstLength;

                var firstInclude = include.slice(0, firstLength);
                var secondInclude = include.slice(firstLength, include.length);

                models[modelName].findOne({where: {id: idObj}, include: firstInclude}).then(function (entity1) {
                    models[modelName].findOne({where: {id: idObj}, include: secondInclude}).then(function (entity2) {
                        for(var item in entity2)
                            if(item.substring(0, 2) == "r_" || item.substring(0, 2) == "c_"){
                                entity1[item] = entity2[item];
                                entity1.dataValues[item] = entity2.dataValues[item];
                            }
                        resolve(entity1);
                    }).catch(function (err) {
                        reject(err);
                    });
                }).catch(reject);
            }
            else
                models[modelName].findOne({where: {id: idObj}, include: include}).then(function (entity1) {
                    resolve(entity1);
                }).catch(reject);
        });
    },
    error500: function(err, req, res, redirect) {
        var isKnownError = false;
        var ajax = req.query.ajax || false;

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
            if (ajax){
                console.log(err);
                return res.status(500).send(req.session.toastr);
            }
            if (isKnownError)
                return res.redirect(redirect || '/');
            else
                console.error(err);
            logger.debug(err);
            var data = {};
            data.code = 500;
            data.message = err.message || null;
            res.status(data.code).render('common/error', data);
        }
    },
    getPicturesBuffers: function(entity, modelName, isThumbnail)  {
        return new Promise(function(resolve, reject) {
            if (!entity)
                resolve();
            var attributes;
            try {
                attributes = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+modelName+'.json'));
            } catch(e) {resolve();}

            var bufferPromises = [];
            for (var key in entity.dataValues)
                if (attributes[key] && attributes[key].newmipsType == 'picture') {
                    (function(keyCopy) {
                        bufferPromises.push(new Promise(function(resolveBuf, rejectBuf) {
                            var value = entity.dataValues[keyCopy] || '';
                            var partOfValue = value.split('-');
                            if (partOfValue.length <= 1)
                                return resolveBuf();
                            var path = modelName.toLowerCase() + '/' + partOfValue[0] + '/' + entity.dataValues[keyCopy];
                            if (isThumbnail)
                                path = 'thumbnail/'+path;
                            file_helper.getFileBuffer64(path, function(success, buffer) {
                                entity.dataValues[keyCopy] = {
                                    value: value,
                                    buffer: buffer
                                };
                                resolveBuf();
                            });
                        }));
                    }(key));
                }

            Promise.all(bufferPromises).then(function() {
                resolve();
            });
        });
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