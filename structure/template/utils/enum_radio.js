var locales = require('../locales/enum_radio.json');

// OLD
/*exports.translated = function(entity, lang) {
 var data = {};
 for (var fieldName in enums[entity]) {
 data[fieldName] = [];
 for (var i = 0; i < enums[entity][fieldName].length; i++)
 data[fieldName].push(enums[entity][fieldName][i].translations[lang]);
 }
 return data;
 }*/

exports.translated = function (entity, lang, options) {
    var data = {};
    for (var fieldName in locales[entity]) {
        data[fieldName] = [];
        // Attributes
        for (var i = 0; i < locales[entity][fieldName].length; i++) {
            data[fieldName].push({
                translation: locales[entity][fieldName][i].translations[lang],
                value: locales[entity][fieldName][i].value
            });
        }
    }
    // Options attributes
    if(typeof options !== "undefined"){
        for(var j=0; j<options.length; j++){
            for (var fieldName in locales[options[j].target]) {
                data[fieldName] = [];
                if(typeof locales[options[j].target][fieldName] !== "undefined"){
                    for (var k = 0; k < locales[options[j].target][fieldName].length; k++) {
                        data[fieldName].push({
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

/*exports.values = function (entity, formObject, body) {
    for (var prop in body) {
        if (typeof enums[entity] === 'undefined' || typeof enums[entity][prop] === 'undefined')
            continue;
        for (var i = 0; i < enums[entity][prop].length; i++) {
            var currentEnum = enums[entity][prop][i];
            if (currentEnum.translations['fr-FR'] == body[prop] || currentEnum.translations['en-EN'] == body[prop])
                formObject[prop] = currentEnum.value;
        }
    }
    return formObject;
}*/