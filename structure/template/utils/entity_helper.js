/* 
 * Update local Entity Data before show or any
 */
var file_helper = require('./file_helper');

module.exports = {
    update_local_data: function (entity, attributes, modelName) {
        for (var key in entity.dataValues) {
            for (var attribute in attributes) {
                if (attributes[attribute].newmipsType === 'picture'
                        && attribute == key) {
                    (function (keyCopy) {
                        var value = entity.dataValues[keyCopy] || '';
                        var partOfValue = value.split('-');
                        if (partOfValue.length>1) {
                            var path = modelName.toLowerCase() + '/' + partOfValue[0] + '/' + entity.dataValues[keyCopy];
                            file_helper.getFileBuffer64(path, function (success, buffer) {
//                                entity.dataValues[keyCopy] = buffer;
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
        }
        return entity;
    },
    remove_files: function (entityName, entity, attributes) {
        for (var key in entity.dataValues) {
            for (var attribute in attributes) {
                if ((attributes[attribute].newmipsType === 'file'
                        || attributes[attribute].newmipsType === "cloudfile"
                        || attributes[attribute].newmipsType === "picture")
                        && attribute == key) {
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
    }

};

