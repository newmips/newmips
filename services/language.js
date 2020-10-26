const languages = [];

function fetchText(key, params, lang) {

	if(typeof lang === "undefined")
		lang = "fr-FR";

	if(typeof key !== "string"){
		try{
			console.warn("Logging translate key that is not a string");
			console.warn(key);
			return key.toString();
		} catch(err) {
			console.error(err)
			return "Sorry, I can't handle the error message.";
		}
	}

	const keys = key.split('.');
	if (typeof languages[lang] === 'undefined') {
		try {
			languages[lang] = require(__dirname + '/../locales/'+lang); // eslint-disable-line
		} catch (e) {
			console.log(e);
			return key;
		}
	}

	let depth = languages[lang];
	for (let i = 0; i < keys.length; i++) {
		depth = depth[keys[i]];
		if (typeof depth === 'undefined')
			return key;
	}

	if(typeof depth !== "string"){
		console.log("WARNING: Key found for translation is not a valid locales key: ", key)
		return key;
	}

	let i = 0;
	while (depth.match(/%s/) != null)
		depth = depth.replace(/%s/, params[i++] || '[missing_param]')

	return depth;
}

function capitalizeFirstLetters(key, params, lang) {
	const msg = fetchText(key, params, lang);
	const words = msg.split(' ');
	let res = '';
	for (let i =0; i < words.length; i++) {
		const word = words[i];
		const wordParts = word.split('\'');
		if (wordParts.length > 1)
			res += wordParts[0] + '\'' + wordParts[1].charAt(0).toUpperCase() + word.slice(3);
		else
			res += word.charAt(0).toUpperCase() + word.slice(1);
		if (i < words.length)
			res += ' ';
	}
	return res != '' ? res : key;
}

module.exports = function(lang) {
	return {
		__: function (key, params) {
			if(typeof params === "undefined")
				params = [];
			return fetchText(key, params, lang);
		},
		M_: function(key, params) {
			if(typeof params === "undefined")
				params = [];
			return capitalizeFirstLetters(key, params, lang);
		},
		getLang: function(){
			return lang;
		}
	}
}