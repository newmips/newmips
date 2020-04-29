const models = require('../models/');
const entity_helper = require('../utils/entity_helper');
const model_builder = require('../utils/model_builder');
const fs = require('fs-extra');
const language = require('../services/language');

module.exports = {
	address: {
		setAddressIfComponentExists: async function(entityObject, options, data) {
			const option = entity_helper.findInclude(options, 'as', "r_address");
			if (!option || option.targetType != "component")
				return;

			const componentAttributes = require('../models/attributes/' + option.target + '.json'); // eslint-disable-line
			const componentOptions = require('../models/options/' + option.target + '.json'); // eslint-disable-line
			const objectToCreate = model_builder.buildForRoute(componentAttributes, componentOptions, data);
			const componentModelName = option.target.charAt(0).toUpperCase() + option.target.slice(1);
			const e_created = await models[componentModelName].create(objectToCreate);
			const func = 'set' + option.as.charAt(0).toUpperCase() + option.as.slice(1);
			await entityObject[func](e_created);
		},
		updateAddressIfComponentExists: async function(entityObject, options, data) {
			if (!entityObject.fk_id_address)
				return this.setAddressIfComponentExists(entityObject, options, data);

			const option = entity_helper.findInclude(options, 'as', "r_address");
			if (option && option.targetType === "component" && data.address_id) {
				const componentAttributes = require('../models/attributes/' + option.target + '.json'); // eslint-disable-line
				const componentOptions = require('../models/options/' + option.target + '.json'); // eslint-disable-line
				const objectToCreate = model_builder.buildForRoute(componentAttributes, componentOptions, data || {});
				const componentModelName = option.target.charAt(0).toUpperCase() + option.target.slice(1);
				await models[componentModelName].update(objectToCreate, {where: {id: data.address_id}});
			}
		},
		buildComponentAddressConfig: lang => {
			const result = [];
			const trads = language(lang);
			try {
				const config = JSON.parse(fs.readFileSync(__dirname + '/../config/address_settings.json'));
				if (config && config.entities) {
					for (const item in config.entities) {
						const entityTrad = trads.__('entity.'+item+'.label_entity');
						let entity = item.replace('e_', '');
						entity = entity.charAt(0).toUpperCase() + entity.slice(1);
						config.entities[item].entity = entity;
						config.entities[item].entityTrad = entityTrad;
						result.push(config.entities[item]);
					}
					return result;
				} return result;
			} catch (e) {
				console.error(e);
				return result;
			}
		},
		getMapsConfigIfComponentAddressExists: entity => {
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
