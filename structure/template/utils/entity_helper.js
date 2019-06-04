/*
 * Update local Entity Data before show or any
 */
const file_helper = require('./file_helper');
const status_helper = require('./status_helper');
const model_builder = require('./model_builder');
const logger = require('./logger');
const fs = require('fs-extra');
const language = require('../services/language');
const models = require('../models/');
const enums_radios = require('../utils/enum_radio.js');
const globalConfig = require('../config/global');

const funcs = {
    capitalizeFirstLetter: function(word) {
        return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
    },
    prepareDatalistResult: async function(entityName, data, lang_user) {
        const attributes = require('../models/attributes/'+entityName);
        const options = require('../models/options/'+entityName);
        const thumbnailFolder = globalConfig.thumbnail.folder;
        const thumbnailPromises = [];

        // Replace data enum value by translated value for datalist
        const enumsTranslation = enums_radios.translated(entityName, lang_user, options);
        for (let i = 0; i < data.data.length; i++) {
            fieldLoop:for (const field in data.data[i]) {
                // Look for enum translation
                enumHeadLoop:for (const enumEntity in enumsTranslation) {
                    enumFieldsLoop:for (const enumField in enumsTranslation[enumEntity])
                        if (enumField == field)
                            for (let j = 0; j < enumsTranslation[enumEntity][enumField].length; j++)
                                if (enumsTranslation[enumEntity][enumField][j].value == data.data[i][field]) {
                                    data.data[i][field] = enumsTranslation[enumEntity][enumField][j].translation;
                                    // Field is confirmed enum, continue with next field loop
                                    continue fieldLoop;
                                }
                }

                // Fetch thumbnails buffers
                // Get attribute value
                let value = data.data[i][field];
                if (typeof attributes[field] != 'undefined' && attributes[field].newmipsType == 'picture' && value != null) {
                    const partOfFile = value.split('-');
                    if (partOfFile.length > 1) {
                        const filePath = `${thumbnailFolder}${entityName}/${partOfFile[0]}/${value}`;

                        (thumbnailTask => {
                            thumbnailPromises.push(new Promise((resolve, reject) => {
                                file_helper.getFileBuffer64(thumbnailTask.file, function (success, buffer) {
                                    data.data[thumbnailTask.i][thumbnailTask.field] = {
                                        value: thumbnailTask.value,
                                        buffer: buffer
                                    };
                                    resolve();
                                });
                            }));
                        })({value, field, i, file: filePath});
                    }
                }
            }
        }

        await Promise.all(thumbnailPromises);

        return data;
    },
    synchro: {
        writeJournal: function(line) {
            if (globalConfig.env != "tablet")
                return;
            const journal = JSON.parse(fs.readFileSync(__dirname+'/../sync/journal.json', 'utf8'));
            if (!journal.transactions instanceof Array)
                journal.transactions = [];
            journal.transactions.push(line);
            fs.writeFileSync(__dirname+'/../sync/journal.json', JSON.stringify(journal, null, 4), 'utf8');
        }
    },
    // Split SQL request if too many inclusion
    optimizedFindOne: async function(modelName, idObj, options, forceOptions = []) {
        const includePromises = [], includes = forceOptions, includeMaxlength = 5;
        for (var i = 0; i < options.length; i++)
            if (options[i].structureType == 'relatedTo' || options[i].structureType == 'relatedToMultiple') {
                var opt = {
                    model: models[funcs.capitalizeFirstLetter(options[i].target)],
                    as: options[i].as
                };
                // Include status children
                if (options[i].target == 'e_status')
                    opt.include = {model: models.E_status, as: 'r_children', include: [{model: models.E_group, as: "r_accepted_group"}]};
                includes.push(opt);
            }

        // Do a first query to get entity with all its fields and first `includeMaxLength`'nth includes
        includePromises.push(models[modelName].findOne({where: {id: idObj}, include: includes.splice(0, includeMaxlength)}));

        // While `includes` array isn't empty, query for `includeMaxLength` and delete from array
        // Fetch only attribute `id` since attributes doesn't change from one query to another
        while (includes.length > 0) {
            const limitedInclude = includes.splice(0, includeMaxlength);
            includePromises.push(models[modelName].findOne({where: {id: idObj}, attributes: ['id'], include: limitedInclude}));
        }

        const resolvedData = await Promise.all(includePromises);

        // Build final object by copying all 'r_' || 'c_' relations
        const mainObject = resolvedData[0];
        for (let i = 1; i < resolvedData.length; i++)
            for (const alias in resolvedData[i])
                if(alias.substring(0, 2) == "r_" || alias.substring(0, 2) == "c_"){
                    mainObject[alias] = resolvedData[i][alias];
                    mainObject.dataValues[alias] = resolvedData[i].dataValues[alias];
                }
        return mainObject;
    },
    getLoadOnStartData: async function(data, options) {
        // Check in given options if there is associations data (loadOnStart param) that we need to push in our data object
        var todoPromises = [];
        for (var i = 0; i < options.length; i++){
            if (typeof options[i].loadOnStart !== "undefined" && options[i].loadOnStart){
                (alias => {
                    todoPromises.push(new Promise(function(resolve, reject){
                        models[funcs.capitalizeFirstLetter(options[i].target)].findAll({raw:true}).then(function(results){
                            // Change alias name to avoid conflict
                            data[alias+"_all"] = results;
                            resolve();
                        }).catch(reject);
                    }))
                })(options[i].as)
            }
        }

        await Promise.all(todoPromises);
        return data;
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