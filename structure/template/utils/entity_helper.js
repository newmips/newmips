/*
 * Update local Entity Data before show or any
 */
var file_helper = require('./file_helper');

module.exports = {
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