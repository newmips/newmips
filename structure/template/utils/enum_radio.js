const locales = require('../locales/enum_radio.json');

exports.translateFieldValue = function(entity, field, value, lang) {
	try {
		for (let i = 0; i < locales[entity][field].length; i++)
			if (locales[entity][field][i].value == value)
				return locales[entity][field][i].translations[lang];
	} catch(e) {
		console.error("Something wrong in enum_radio.js - translateFieldValue");
		console.error(e);
	}
	return value;
}

exports.translated = function (entity, lang, options) {
	const data = {};
	data[entity] = {};
	for (const fieldName in locales[entity]) {
		data[entity][fieldName] = [];
		// Attributes
		for (let i = 0; i < locales[entity][fieldName].length; i++) {
			data[entity][fieldName].push({
				translation: locales[entity][fieldName][i].translations[lang],
				value: locales[entity][fieldName][i].value
			});
		}
	}

	// Options attributes
	if(typeof options !== "undefined"){
		for(let j=0; j<options.length; j++){
			data[options[j].target] = {};
			for (const fieldName in locales[options[j].target]) {
				data[options[j].target][fieldName] = [];
				if(typeof locales[options[j].target][fieldName] !== "undefined"){
					for (let k = 0; k < locales[options[j].target][fieldName].length; k++) {
						data[options[j].target][fieldName].push({
							translation: locales[options[j].target][fieldName][k].translations[lang],
							value: locales[options[j].target][fieldName][k].value
						});
					}
				}
			}
		}
	}
	return data;
}

// Looking for using field in row entity association to translate it based on locales/enum_radio.json
// Useful in related to field that using an enum or radio field
exports.translateUsingField = function (entity, options, translate, forDatalist = false) {
	for (let i = 0; i < options.length; i++) {
		const target = translate[options[i].target];
		const aliasRow = entity[options[i].as];
		if(target && aliasRow && options[i].usingField && options[i].usingField.length > 0) {
			for (let j = 0; j < options[i].usingField.length; j++) {
				const field = options[i].usingField[j].value;

				// Not a field that need translation (not in locales)
				if(!target[field])
					continue;

				if(Array.isArray(aliasRow)) {
					// Related to many
					for (let k = 0; k < aliasRow.length; k++) {
						const translateValue = target[field].filter(x => x.value == aliasRow[k][field])[0];
						aliasRow[k][field] = forDatalist ? translateValue.translation : translateValue;
					}
				} else {
					// Related to
					const translateValue = target[field].filter(x => x.value == aliasRow[field])[0];
					aliasRow[field] = forDatalist ? translateValue.translation : translateValue;
				}
			}
		}
	}
}