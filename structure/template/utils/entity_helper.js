/*
 * Update local Entity Data before show or any
 */
var file_helper = require('./file_helper');
var logger = require('./logger');

module.exports = {
    capitalizeFirstLetter: function(word) {
        return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
    },
    status: {
        getStatusFieldList: function(attributes) {
            var list = [];
            for (var prop in attributes)
                if (prop.indexOf('s_') == 0)
                    list.push(prop);
            return list;
        },
        getNextStatus: function(models, entityName, entityId, attributes) {
            var self = this;
            return new Promise(function(resolve, reject) {
                var statusList = self.getStatusFieldList(attributes);
                if (statusList.length == 0)
                    return resolve([]);

                var nextStatusPromises = [];
                // Get the last history of each status field
                // Include r_children to have next status
                for (var i = 0; i < statusList.length; i++) {
                    var model = 'E_history_'+entityName+'_'+statusList[i];
                    var where = {};
                    where['fk_id_'+entityName.substring(2)+'_history_status'] = entityId;
                    nextStatusPromises.push(models[model].findAll({
                        limit: 1,
                        order: 'createdAt DESC',
                        where: where,
                        include: [{
                            model: models.E_status,
                            as: 'r_status',
                            include: [{
                                model: models.E_translation,
                                as: 'r_translations'
                            }, {
                                model: models.E_status,
                                as: 'r_children',
                                include: [{
                                    model: models.E_translation,
                                    as: 'r_translations'
                                }]
                            }]
                        }]
                    }));
                }

                Promise.all(nextStatusPromises).then(function(histories) {
                    // Queries have limit 1, we know there's only one row in each array
                    // Remove useless array and assign current R_status
                    for (var i = 0; i < histories.length; i++)
                        histories[i] = histories[i][0].r_status;
                    resolve(histories);
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

            //Sequelize validation error
            if (err.name == "SequelizeValidationError") {
                req.session.toastr.push({level: 'error', message: err.errors[0].message});
                isKnownError = true;
            }

            // Unique value constraint error
            if (typeof err.parent !== "undefined" && err.parent.errno == 1062) {
                req.session.toastr.push({level: 'error', message: err.errors[0].message});
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