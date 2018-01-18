
var languages = [];

function fetchText(key, lang) {
	if (!key)
		return "";
	var keys;
	try {
		keys = key.split('.');
	} catch(e) {
		return key;
	}

	if (typeof languages[lang] === 'undefined') {
		try {
			languages[lang] = require(__dirname + '/../locales/'+lang);
		} catch (e) {
			console.log(e);
			return key;
		}
	}

	var depth = languages[lang];
	for (var i = 0; i < keys.length; i++) {
		depth = depth[keys[i]];
		if (typeof depth === 'undefined')
			return key;
	}
	return depth;
}

function capitalizeFirstLetters(key, lang) {
	var msg = fetchText(key, lang);
	words = msg.split(' ');
	var res = '';
	for (var i =0; i < words.length; i++) {
		var word = words[i];
		var wordParts = word.split('\'');
		if (wordParts.length > 1)
			// d'information -> d'Information
			res += wordParts[0] + '\'' + wordParts[1].charAt(0).toUpperCase() + word.slice(3);
		else
			// information -> Information
			res += word.charAt(0).toUpperCase() + word.slice(1);
		if (i < words.length)
			res += ' ';
	}
	return res != '' ? res : key;
}

module.exports = function(lang) {
	return {
		__: function (key) {
			return fetchText(key,lang);
		},
		M_: function(key) {
			return capitalizeFirstLetters(key, lang);
		},
		getLang: function(){
			return lang;
		}
	}
}
