const models = require('../models/');
const entity_helper = require('../utils/entity_helper');
const model_builder = require('../utils/model_builder');
const fs = require('fs-extra');

module.exports = {
	address: {
		setAddressIfComponentExists: function (entityObject, options, data/*req.body*/) {
			return new Promise(function (resolve, reject) {
				const option = entity_helper.findInclude(options, 'as', "r_address");
				if (option && option.targetType === "component") {
					const componentAttributes = require('../models/attributes/' + option.target + '.json');
					const componentOptions = require('../models/options/' + option.target + '.json');
					const objectToCreate = model_builder.buildForRoute(componentAttributes, componentOptions, data);
					const componentModelName = option.target.charAt(0).toUpperCase() + option.target.slice(1);
					models[componentModelName].create(objectToCreate).then(function (e_created) {
						const func = 'set' + option.as.charAt(0).toUpperCase() + option.as.slice(1);
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
		updateAddressIfComponentExists: function (entityObject, options, data/*req.body*/) {
			if (entityObject.fk_id_address) {
				return new Promise(function (resolve, reject) {
					const option = entity_helper.findInclude(options, 'as', "r_address");
					if (option && option.targetType === "component" && data.address_id) {
						const componentAttributes = require('../models/attributes/' + option.target + '.json');
						const componentOptions = require('../models/options/' + option.target + '.json');
						const objectToCreate = model_builder.buildForRoute(componentAttributes, componentOptions, data || {});
						const componentModelName = option.target.charAt(0).toUpperCase() + option.target.slice(1);
						models[componentModelName].update(objectToCreate, {where: {id: data.address_id}}).then(function (e_created) {
							resolve();
						}).catch(function (e) {
							resolve();
						});
					} else
						resolve();
				});
			} return this.setAddressIfComponentExists(entityObject, options, data);
		},
		buildComponentAddressConfig: function () {
			const result = [];
			try {
				const config = JSON.parse(fs.readFileSync(__dirname + '/../config/address_settings.json'));
				if (config && config.entities) {
					for (const item in config.entities) {
						let entity = item.replace('e_', '');
						entity = entity.charAt(0).toUpperCase() + entity.slice(1);
						config.entities[item].entity = entity;
						result.push(config.entities[item]);
					}
					return result;
				} return result;
			} catch (e) {
				return result;
			}
		},
		getMapsConfigIfComponentAddressExists: function (entity) {
			let result = {enableMaps: false};
			try {
				const config = JSON.parse(fs.readFileSync(__dirname + '/../config/address_settings.json'));
				if (config && config.entities && config.entities[entity]) {
					result = config.entities[entity];
					for (const item in config.entities[entity].mapsPosition)
						if (config.entities[entity].mapsPosition[item] === true) {
							result.mapsPosition = item;
							break;
						}
					return result;
				} return result;
			} catch (e) {
				return result;
			}
		}
	}

};
