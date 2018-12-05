var locales = require('../locales/enum_radio.json');

exports.translateFieldValue = function(entity, field, value, lang) {
    try {
        for (var i = 0; i < locales[entity][field].length; i++)
            if (locales[entity][field][i].value == value)
                return locales[entity][field][i].translations[lang];
    } catch(e) {
        console.error("Something wrong in enum_radio.js - translateFieldValue");
        console.error(e);
    }
    return value;
}

exports.translated = function (entity, lang, options) {
    var data = {};
    data[entity] = {};
    for (var fieldName in locales[entity]) {
        data[entity][fieldName] = [];
        // Attributes
        for (var i = 0; i < locales[entity][fieldName].length; i++) {
            data[entity][fieldName].push({
                translation: locales[entity][fieldName][i].translations[lang],
                value: locales[entity][fieldName][i].value
            });
        }
    }

    // Options attributes
    if(typeof options !== "undefined"){
        for(var j=0; j<options.length; j++){
            data[options[j].target] = {};
            for (var fieldName in locales[options[j].target]) {
                data[options[j].target][fieldName] = [];
                if(typeof locales[options[j].target][fieldName] !== "undefined"){
                    for (var k = 0; k < locales[options[j].target][fieldName].length; k++) {
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