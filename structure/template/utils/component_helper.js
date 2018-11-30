var models = require('../models/');
var entity_helper = require('../utils/entity_helper');
var model_builder = require('../utils/model_builder');
var fs = require('fs-extra');

module.exports = {
    setAddressIfComponentExist: function (entityObject, options, data/*req.body*/) {
        return new Promise(function (resolve, reject) {
            var option = entity_helper.findInclude(options, 'as', "c_address");
            if (option && option.targetType === "component") {
                var componentAttributes = require('../models/attributes/' + option.target + '.json');
                var componentOptions = require('../models/options/' + option.target + '.json');
                var objectToCreate = model_builder.buildForRoute(componentAttributes, componentOptions, data);
                var componentModelName = option.target.charAt(0).toUpperCase() + option.target.slice(1);
                models[componentModelName].create(objectToCreate).then(function (e_created) {
                    var func = 'set' + option.as.charAt(0).toUpperCase() + option.as.slice(1);
                    entityObject[func](e_created).then(function () {
                    }).catch(function () {
                    }).then(function () {
                        resolve();
                    });
                }).catch(function (e) {
                    resolve();
                });
            } else
                resolve();
        });
    },
    updateAddressIfComponentExist: function (entityObject, options, data/*req.body*/) {
        if (entityObject.fk_id_c_address) {
            return new Promise(function (resolve, reject) {
                var option = entity_helper.findInclude(options, 'as', "c_address");
                if (option && option.targetType === "component" && data.c_address_id) {
                    var componentAttributes = require('../models/attributes/' + option.target + '.json');
                    var componentOptions = require('../models/options/' + option.target + '.json');
                    var objectToCreate = model_builder.buildForRoute(componentAttributes, componentOptions, data || {});
                    var componentModelName = option.target.charAt(0).toUpperCase() + option.target.slice(1);
                    models[componentModelName].update(objectToCreate, {where: {id: data.c_address_id}}).then(function (e_created) {
                        resolve();
                    }).catch(function (e) {
                        resolve();
                    });
                } else
                    resolve();
            });
        } else
            return this.setAddressIfComponentExist(entityObject, options, data);
    },
    buildComponentAddressConfig: function () {
        var result = [];
        try {
            var config = JSON.parse(fs.readFileSync(__dirname + '/../config/c_address_settings.json'));
            if (config && config.entities) {
                for (var item in config.entities) {
                    var entity = item.replace('e_', '');
                    entity = entity.charAt(0).toUpperCase() + entity.slice(1);
                    config.entities[item].entity = entity;
                    result.push(config.entities[item]);
                }
                return result;
            } else
                return result;
        } catch (e) {
            return result;
        }
    },
    getMapsConfigIfComponentAddressExist: function (entity) {
        var result = {enableMaps: false};
        try {
            var config = JSON.parse(fs.readFileSync(__dirname + '/../config/c_address_settings.json'));
            if (config && config.entities && config.entities[entity]) {
                result = config.entities[entity];
                for (var item in config.entities[entity].mapsPosition)
                    if (config.entities[entity].mapsPosition[item] === true) {
                        result.mapsPosition = item;
                        break;
                    }
                return result;
            } else
                return result;
        } catch (e) {
            return result;
        }
    }
};
