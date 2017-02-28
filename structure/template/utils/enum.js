var enums = require('../locales/enum.json');

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

exports.translated = function (entity, lang) {
    var data = {};
    for (var fieldName in enums[entity]) {
        data[fieldName] = [];
        for (var i = 0; i < enums[entity][fieldName].length; i++) {
            data[fieldName].push({
                translation: enums[entity][fieldName][i].translations[lang],
                value: enums[entity][fieldName][i].value
            });
        }
    }
    return data;
}

exports.values = function (entity, formObject, body) {
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
}