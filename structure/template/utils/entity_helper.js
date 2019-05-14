/*
 * Update local Entity Data before show or any
 */
var file_helper = require('./file_helper');
var status_helper = require('./status_helper');
var model_builder = require('./model_builder');
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
        });
    },
    synchro: {
        writeJournal: function(line) {
            if (globalConfig.env != "tablet")
                return;
            var journal = JSON.parse(fs.readFileSync(__dirname+'/../sync/journal.json', 'utf8'));
            if (!journal.transactions instanceof Array)
                journal.transactions = [];
            journal.transactions.push(line);
            fs.writeFileSync(__dirname+'/../sync/journal.json', JSON.stringify(journal, null, 4), 'utf8');
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
                        opt.include = {model: models.E_status, as: 'r_children', include: [{model: models.E_group, as: "r_accepted_group"}]};
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
    getLoadOnStartData: function(data, options) {
        // Check in given options if there is associations data (loadOnStart param) that we need to push in our data object
        return new Promise(function(resolve, reject){
            var todoPromises = [];
            for (var i = 0; i < options.length; i++){
                if (typeof options[i].loadOnStart !== "undefined" && options[i].loadOnStart){
                    (function(alias){
                        todoPromises.push(new Promise(function(resolve1, reject1){
                            models[funcs.capitalizeFirstLetter(options[i].target)].findAll({raw:true}).then(function(results){
                                // Change alias name to avoid conflict
                                data[alias+"_all"] = results;
                                resolve1();
                            }).catch(reject1);
                        }))
                    })(options[i].as)
                }
            }

            Promise.all(todoPromises).then(function(){
                resolve(data);
            }).catch(reject)
        });
    },
    error: function(err, req, res, redirect, entity) {
        var isKnownError = false;
        var ajax = req.query.ajax || false;
        var data = {
            code: 500,
            message: err.message || null
        };

        try {
            var lang = "fr-FR";
            if(typeof req.session.lang_user !== "undefined")
                lang = req.session.lang_user;

            var __ = language(lang).__;

            //Sequelize validation error
            if (err.name == "SequelizeValidationError") {
                for (const validationError of err.errors) {
                    const fieldTrad = __(`entity.${entity}.${validationError.path}`);
                    const message = __(validationError.message, [fieldTrad]);
                    req.session.toastr.push({level: 'error', message: message});
                }
                data.code = 400;
                isKnownError = true;
            }

            // Unique value constraint error
            if (typeof err.parent !== "undefined" && (err.parent.errno == 1062 || err.parent.code == 23505)) {
                var message = __('message.unique') + " " + __("entity."+entity+"."+err.errors[0].path);
                req.session.toastr.push({level: 'error', message: message});
                data.code = 400;
                isKnownError = true;
            }

        } finally {
            if (ajax){
                return res.status(data.code).send(req.session.toastr);
            }
            if (isKnownError) {
                return res.redirect(redirect || '/');
            }
            else
                console.error(err);

            logger.debug(err);
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
    removeFiles: function(entityName, entity, attributes) {
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
    findInclude: function(includes, searchType, toFind) {
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