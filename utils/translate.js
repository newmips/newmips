const fs = require('fs');
const helpers = require("./helpers");

// Google translate
const translateKey = require("../config/googleAPI").translate;
const googleTranslate = require('google-translate')(translateKey);

module.exports = {
	writeTree: function(appName, object, language, replaceBoolean = true) {
		const localesObj = JSON.parse(helpers.readFileSyncWithCatch(__dirname + '/../workspace/' + appName + '/locales/' + language + '.json'));

		function dive(locales, newLocales) {
			for (const newLocale in newLocales) {
				let found = false;
				for (const locale in locales) {
					if (locale == newLocale && typeof newLocales[newLocale] === 'object') {
						found = true;
						dive(locales[locale], newLocales[newLocale])
					} else if (!replaceBoolean && locale == newLocale)
						found = true;
				}
				if (!found)
					locales[newLocale] = newLocales[newLocale];
			}
		}
		dive(localesObj, object);
		fs.writeFileSync(__dirname + '/../workspace/' + appName + '/locales/' + language + '.json', JSON.stringify(localesObj, null, 4), 'utf8');
	},
	writeEnumTrad: function (app_name, entity, field, value, traduction, lang = 'fr-FR') {
		const enumTrads = JSON.parse(helpers.readFileSyncWithCatch(__dirname + '/../workspace/' + app_name + '/locales/enum_radio.json'));
		let success = false;
		mainLoop:for (const enumEntity in enumTrads)
			// Find entity's entry
			if (entity == enumEntity)
				// Find field's entry
				for (const enumField in enumTrads[enumEntity])
					if (field == enumField)
						// Find enum value entry
						for (let i = 0; i < enumTrads[enumEntity][enumField].length; i++)
							if (enumTrads[enumEntity][enumField][i].value == value) {
								enumTrads[enumEntity][enumField][i].translations[lang] = traduction;
								success = true;
								break mainLoop;
							}

		if (success == true)
			fs.writeFileSync(__dirname+'/../workspace/'+app_name+'/locales/enum_radio.json', JSON.stringify(enumTrads, null, 4), 'utf8');

		return success;
	},
	writeLocales: async (appName, type, keyValue, value, toTranslate) => {

		// If field value is an array
		let keyValueField, alias;
		if (type == "field") {
			keyValueField = value[0];
			value = value[1];
		} else if (type == "aliasfield") {
			alias = value[0];
			value = value[1];
		}

		// Replace euro sign from char code since javascript can't read `€`
		value = value.replace(String.fromCharCode(65533), "€");

		// Current application language
		const languageFileData = helpers.readFileSyncWithCatch(__dirname + '/../workspace/' + appName + '/config/application.json');
		const appLang = JSON.parse(languageFileData).lang;

		// Google won't fr-FR, it just want fr
		const appLang4Google = appLang.slice(0, -3);

		// Get all the differents languages to handle
		const localesDir = fs.readdirSync(__dirname + '/../workspace/' + appName + '/locales').filter(file => file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file != "enum_radio.json");

		function addLocal(type, data, lang, value) {
			switch(type) {
				case 'application':
					data.app.name = value;
					break;
				case 'module':
					if(value == 'home')
						value = lang == "fr-FR" ? "Accueil" : "Home";
					data.module[keyValue] = value;
					break;
				case 'entity':
					switch(value.toLowerCase()) {
						case 'user':
							value = lang == 'fr-FR' ? 'Utilisateur' : 'User';
							break;
						case 'role':
							value = lang == 'fr-FR' ? 'Rôle' : 'Role';
							break;
						case 'group':
							value = lang == 'fr-FR' ? 'Groupe' : 'Group';
							break;
						default:
							break;
					}
					data.entity[keyValue] = {
						label_entity: value,
						name_entity: value,
						plural_entity: value,
						id_entity: "ID"
					};
					break;
				case 'component':
					data.component[keyValue] = {
						label_component: value,
						name_component: value,
						plural_component: value
					}
					break;
				case 'field':
					switch(value.toLowerCase()) {
						case 'login':
							value = lang == "fr-FR" ? "Identifiant" : "Login";
							break;
						case 'role':
							value = lang == "fr-FR" ? "Rôle" : "Role";
							break;
						case 'email':
							value = "Email";
							break;
						case 'group':
							value = lang == "fr-FR" ? "Groupe" : "Group";
							break;
						case 'label':
							value = lang == "fr-FR" ? "Libellé" : "Label";
							break;
						default:
							break;
					}
					data.entity[keyValue][keyValueField] = value;
					break;
				case 'aliasfield':
					switch(value.toLowerCase()) {
						case 'login':
							value = lang == "fr-FR" ? "Identifiant" : "Login";
							break;
						case 'role':
							value = lang == "fr-FR" ? "Rôle" : "Role";
							break;
						case 'email':
							value = "Email";
							break;
						case 'group':
							value = lang == "fr-FR" ? "Groupe" : "Group";
							break;
						case 'label':
							value = lang == "fr-FR" ? "Libellé" : "Label";
							break;
						default:
							break;
					}
					data.entity[keyValue][alias] = value;
					break;
				default:
					break;
			}
			return data;
		}

		const promises = [];
		for (let i = 0; i < localesDir.length; i++) {
			promises.push(new Promise(resolve => {
				const file = localesDir[i];
				const urlFile = __dirname + '/../workspace/' + appName + '/locales/' + file;
				let dataLocales;
				try {
					dataLocales = JSON.parse(fs.readFileSync(urlFile));
				} catch(err) {
					console.error(err);
					console.log("Concerned file => " + urlFile);
				}
				const workingLocales = file.slice(0, -5);
				const workingLocales4Google = workingLocales.slice(0, -3);

				// Google translate
				if (workingLocales != appLang && (translateKey != "" && toTranslate)) {
					((fileURL, data, lang) => {
						googleTranslate.translate(value, appLang4Google, workingLocales4Google, (err, translations) => {
							if (err)
								console.error(err);
							else
								value = translations.translatedText;

							data = addLocal(type, data, lang, value);
							fs.writeFileSync(fileURL, JSON.stringify(data, null, 4));
							resolve();
						});
					})(urlFile, dataLocales, workingLocales);
				} else {
					dataLocales = addLocal(type, dataLocales, workingLocales, value);
					if(!dataLocales || typeof dataLocales === 'undefined') {
						console.log("WAZA");
						console.log(type);
						console.log(dataLocales);
						console.log(workingLocales);
						console.log(value);
					}
					fs.writeFileSync(urlFile, JSON.stringify(dataLocales, null, 4));
					resolve();
				}
			}));
		}

		await Promise.all(promises);
		return;
	},
	removeLocales: (appName, type, value) => {
		// Get all the differents languages to handle
		const localesDir = fs.readdirSync(__dirname + '/../workspace/' + appName + '/locales').filter(file => file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file != "enum_radio.json");

		localesDir.forEach(file => {
			const urlFile = __dirname + '/../workspace/' + appName + '/locales/' + file;
			delete require.cache[require.resolve(urlFile)];
			const dataLocales = require(urlFile); // eslint-disable-line

			if (type == "field")
				delete dataLocales.entity[value[0]][value[1]];
			else if (type == "entity")
				delete dataLocales.entity[value];
			else if (type == "module")
				delete dataLocales.module[value];

			fs.writeFileSync(urlFile, JSON.stringify(dataLocales, null, 4));
		});

		return;
	},
	updateLocales: function(appName, lang, keys, value) {
		const urlFile = __dirname + '/../workspace/' + appName + '/locales/' + lang + ".json";
		const dataLocales = JSON.parse(fs.readFileSync(urlFile))

		let depth = dataLocales;
		for (let i = 0; i < keys.length; i++) {
			if (typeof depth[keys[i]] !== 'undefined') {
				if (i + 1 == keys.length)
					depth[keys[i]] = value;
				else
					depth = depth[keys[i]];
			} else if (i + 1 == keys.length)
				depth[keys[i]] = value;
		}
		fs.writeFileSync(urlFile, JSON.stringify(dataLocales, null, 4));
	}
}