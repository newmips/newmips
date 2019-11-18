const moment = require('moment');
const globalConfig = require('../config/global');
const fs = require('fs');
const dust = require('dustjs-linkedin');
const pdf = require('html-pdf');
const enums_radios = require('../locales/enum_radio');
const JSZip = require('jszip');
const Docxtemplater = require('docxtemplater');
const pdfFiller = require('fill-pdf');
const language = require('../services/language');
const langMessage = require('../locales/document_template_locales');
const lang = "fr-FR";

module.exports = {
	entities_to_exclude: [
		'E_action', 'E_api_credentials', 'E_inline_help', 'E_media', 'E_media_sms', 'E_media_mail',
		'E_notification', 'E_status', 'E_document_template', 'E_media_notification', 'E_translation'
	],
	globalVariables: [
		{name: 'g_today', description: 'Current date', type: 'date'},
		{name: 'g_date', description: 'Current date', type: 'date'},
		{name: 'g_time', description: 'Current time', type: 'time'},
		{name: 'g_datetime', description: 'Current datetime', type: 'datetime'},
		{name: 'g_login', description: 'Current user login', type: 'string'},
		{name: 'g_email', description: 'Current user email', type: 'email'}
	],
	get_entities: function (models) {
		/**Get all models**/
		const entities = models.sequelize.models;
		const document_template_entities = [];
		if (entities) {
			for (const item in entities) {
				if (item.startsWith('E_') && this.entities_to_exclude.indexOf(item) < 0) {
					let entity_to_show = item.replace('E_', '');
					entity_to_show = entity_to_show.charAt(0).toUpperCase() + entity_to_show.slice(1); //uc first
					document_template_entities.push({
						value: entity_to_show,
						item: language('fr-FR').__('entity.' + item.toLowerCase() + '.label_entity') || entity_to_show
					});
				}
			}
		}
		return document_template_entities;
	},
	rework: function (object, entityName, reworkOptions, userLang, fileType) {
		try {
			const result = {};
			const options = typeof reworkOptions === 'undefined' ? {} : reworkOptions;
			const relationsOptions = require('../models/options/' + entityName.toLowerCase() + '.json');
			const attributes = require('../models/attributes/' + entityName.toLowerCase() + '.json');
			for (const item in object.dataValues) {
				result[item] = object.dataValues[item];
			}
			/** Add createdAt and updatedAt who are not in attributes **/
			setCreatedAtAndUpdatedAtValues(result, object, userLang);

			const entityModelData = {
				entityName: entityName,
				attributes: attributes,
				options: options[entityName]
			};
			this.cleanData(result, entityModelData, userLang, fileType);

			const that = this;
			function cleanIncludeLevels(relationsOptions, obj) {
				for (let i = 0; i < relationsOptions.length; i++) {
					const relation = relationsOptions[i];
					if (obj[relation.as]) {
						const relationAttributes = JSON.parse(fs.readFileSync(__dirname + '/../models/attributes/' + relation.target + '.json'));
						const relationsOptions2 = JSON.parse(fs.readFileSync(__dirname + '/../models/options/' + relation.target + '.json'));

						const entityModelData = {
							entityName: relation.target,
							attributes: relationAttributes,
							options: options[relation.target]
						};

						if (relation.relation === "belongsTo" || relation.relation === "hasOne") {
							result[relation.as] = obj[relation.as].dataValues;
							that.cleanData(result[relation.as], entityModelData, userLang, fileType);
							setCreatedAtAndUpdatedAtValues(result[relation.as], obj[relation.as].dataValues, userLang);

							cleanIncludeLevels(relationsOptions2, obj[relation.as]);
						} else if (relation.relation === "hasMany" || relation.relation === "belongsToMany") {
							result[relation.as] = [];
							// Be carefull if we have a lot lot lot lot of data.
							for (let j = 0; j < obj[relation.as].length; j++) {
								result[relation.as].push(obj[relation.as][j].dataValues);
								that.cleanData(result[relation.as][j], entityModelData, userLang, fileType);
								setCreatedAtAndUpdatedAtValues(result[relation.as][j], obj[relation.as][j].dataValues, userLang);
							}

							cleanIncludeLevels(relationsOptions2, obj[relation.as]);
						}
					}
				}
			}

			// Now clean relation in each levels, recursive function
			cleanIncludeLevels(relationsOptions, object);
			return result;
		} catch (e) {
			console.log(e);
			return {};
		}
	},
	cleanData: function (object, entityModelData, userLang, fileType) {
		const attributes = entityModelData.attributes;
		const reworkOptions = entityModelData.options;
		const entityName = entityModelData.entityName;
		for (const item in object) {
			if (object[item] == 'null' || object[item] == null || typeof object[item] === "undefined")
				object[item] = '';
			//clean all date
			for (const attr in attributes) {
				const attribute = attributes[attr];
				if (attr === item) {
					//clean all date
					if ((attribute.newmipsType === "date" || attribute.newmipsType === "datetime") && object[item] !== '') {
						const format = this.getDateFormatUsingLang(userLang, attribute.newmipsType);
						object[item] = moment(new Date(object[item])).format(format);
					}
					if ((attribute.newmipsType === "password")) {
						object[item] = '';
					}
					//translate boolean values
					if (attribute.newmipsType === "boolean") {
						object[item + '_value'] = object[item]; //true value
						if (fileType === "application/pdf") {
							object[item] = object[item] == true ? "Yes" : "No";
						} else
							object[item] = langMessage[userLang || lang].fields.boolean[(object[item] + '').toLowerCase()];
					}
					//text area field, docxtemplater(free) doesn't support html tag so we replace all
					if (attribute.newmipsType === "text") {
						object[item] = object[item].replace(/<[^>]+>/g, ' '); //tag
						object[item] = object[item].replace(/&[^;]+;/g, ' '); //&nbsp
					}
					if (attribute.newmipsType === "phone" || attribute.newmipsType === "fax") {
						object[item] = format_tel(object[item], ' ');
					}
					if (attribute.type === "ENUM") {
						setEnumValue(object, item, entityName, fileType, userLang);
					}
					break;
					// if (attribute.newmipsType === "picture" && attr === item && object[item].split('-').length > 1) {
					//	 try{
					//		 object[item] = "data:image/*;base64, " + fs.readFileSync(globalConfig.localstorage + entityName + '/' + object[item].split('-')[0] + '/' + object[item]).toString('base64');
					//	 } catch(err){
					//		 console.log("IMG NOT FOUND: ", object[item]);
					//		 object[item] = "NOT FOUND";
					//	 }
					//	 break;
					// }
				}
			}
			if (reworkOptions) {
				for (let i = 0; i < reworkOptions.length; i++) {
					const reworkOption = reworkOptions[i];
					if (item === reworkOption.item) {
						if ((reworkOption.type === 'date' || reworkOption.type === 'datetime') && object[item] !== '' && reworkOption.newFormat)
							object[item] = moment(object[item], this.getDateFormatUsingLang(userLang, reworkOption.type)).format(reworkOption.newFormat);
						// Add others types as need
						break;
					}
				}
			}
		}
	},
	getRelations: function (entity, options = {lang:lang}) {
		const result = [];
		const modelOptions = require('../models/options/e_' + entity.toLowerCase() + '.json');
		for (let i = 0; i < modelOptions.length; i++) {
			const modelOption = modelOptions[i];
			let target = modelOption.target.charAt(0).toUpperCase() + modelOption.target.slice(1);
			if (target && this.entities_to_exclude.indexOf(target) < 0) {
				target = modelOption.target.replace('e_', '');
				target = target.charAt(0).toUpperCase() + target.slice(1); //uc first
				result.push({
					value: target,
					item: language(options.lang).__('entity.' + modelOption.target + '.label_entity')
				});
			}
		}
		return result;
	},
	getDateFormatUsingLang: function (userLang, type) {
		const l = typeof userLang === 'undefined' ? 'fr-FR' : userLang;
		switch (type) {
			case 'datetime':
				return l === 'fr-FR' ? 'DD/MM/YYYY HH:mm:ss' : 'YYYY-MM-DD HH:mm:ss';
			case 'date':
				return l === 'fr-FR' ? 'DD/MM/YYYY' : 'YYYY-MM-DD';
			case 'time':
				return 'HH:mm:ss';
			default:
				return l === 'fr-FR' ? 'DD/MM/YYYY' : 'YYYY-MM-DD';
		}
	},
	getSubEntitiesHelp: function (userLang) {
		const l = typeof userLang === 'undefined' ? 'fr-FR' : userLang;
		return langMessage[l].subEntities.help;
	},
	getAttributes: function (attributes) {
		const result = [];
		if (attributes)
			for (const item in attributes)
				result.push(item);
		return result;
	},
	getReadmeMessages: function (userLang) {
		return langMessage[userLang || lang].readme;
	},
	build_help: function (entityRoot, userLang) {
		const result = [];
		var attributes = require('../models/attributes/e_' + entityRoot.toLowerCase() + '.json');
		const options = require('../models/options/e_' + entityRoot.toLowerCase() + '.json');
		let entityRootTranslated = language(userLang).__('entity.e_' + entityRoot.toLowerCase() + '.label_entity');
		entityRootTranslated = entityRootTranslated.charAt(0).toUpperCase() + entityRootTranslated.slice(1);
		result.push({
			id: 0,
			message: '',
			attributes: this.getAttributes(attributes),
			entity: entityRootTranslated,
			relation: 'root',
			color: "#ffffff"
		});
		//now get options entities and there attributes
		for (let i = 0; i < options.length; i++) {
			const relation = options[i];
			const target = relation.target.charAt(0).toUpperCase() + relation.target.slice(1);
			if (target && this.entities_to_exclude.indexOf(target) < 0) {
				var attributes = require('../models/attributes/' + relation.target + '.json');
				let message = '';
				if (relation.relation === "belongsTo")
					message = "";
				else if (relation.relation === "belongsToMany" || relation.relation === "hasMany")
					message = langMessage[userLang || lang].useVariable +
						"<p> " + langMessage[userLang || lang].example + ":<br>" +
						"<pre>{#" + relation.as + "}<br>" +
						"	{variable}<br>" +
						"{/" + relation.as + "}" +
						"</p></pre><hr>" +
						"<i class='fa fa-exclamation-circle' style='color:orange'></i> " + langMessage[userLang || lang].whereIsNL + ": <br>" +
						" <pre>" +
						"{<br>" +
						langMessage[userLang || lang].one + ": [{" + langMessage[userLang || lang].name + ": 'New'}]<br>" +
						langMessage[userLang || lang].two + ": [{" + langMessage[userLang || lang].name + ": 'Mips'}]<br>" +
						"}</pre><br>" +
						langMessage[userLang || lang].output + ": " +
						" <pre>" +
						"NL<br>" +
						"  <b>New</b> <br>" +
						"NL <br>" +
						"NL <br>" +
						"  <b>Mips</b> <br>" +
						"NL<br>" +
						"</pre><br>" +
						"<b> " + langMessage[userLang || lang].nl + "</b> <br>" +
						langMessage[userLang || lang].empty + ": <br>" +
						"<pre>{#" + relation.as + "}<b>{variable}</b><br>" +
						"{/" + relation.as + "}</pre><br><br>";
				const entity = language(userLang).__('entity.' + relation.target + '.label_entity');
				result.push({
					id: i + 1,
					message: message,
					attributes: this.getAttributes(attributes),
					entity: entity.charAt(0).toUpperCase() + entity.slice(1),
					as: relation.as,
					relation: relation.relation,
					color: "#" + this.randomColor(6)
				});
			}
		}
		return result;
	},
	buildInclude: function (entity, f_exclude_relations, models) {
		const result = [];
		const options = require('../models/options/' + entity.toLowerCase() + '.json');
		const parts_of_exclude_relations = (f_exclude_relations || '').split(',');
		for (let i = 0; i < options.length; i++) {
			let found = false;
			const target = options[i].target.toLowerCase();
			for (let j = 0; j < parts_of_exclude_relations.length; j++) {
				if (parts_of_exclude_relations[j] && target.replace('e_', '') === parts_of_exclude_relations[j].toLowerCase())
					found = true;
			}
			if (!found) {
				const subEntity = target.charAt(0).toUpperCase() + target.slice(1);
				result.push({
					model: models[subEntity],
					as: options[i].as
				});
			}
		}
		return result;
	},
	buildHTML_EntitiesHelperAjax: function (entities, userLang) {
		return new Promise((resolve, reject) => {
			const template = fs.readFileSync(__dirname + '/../views/e_document_template/entity_helper_template.dust', 'utf8');

			dust.renderSource(template, {entities: entities, locales: langMessage[userLang || lang]}, function (err, out) {
				if (!err)
					return resolve(out);
				reject(err);
			});
		});

	},
	buildHTMLGlobalVariables: function (userLang) {
		const globalVariables = this.globalVariables;
		return new Promise((resolve, reject) => {
			const template = fs.readFileSync(__dirname + '/../views/e_document_template/global_variable_template.dust', 'utf8');

			dust.renderSource(template, {globalVariables: globalVariables, locales: langMessage[userLang || lang]}, function (err, out) {
				if (!err)
					return resolve(out);
				reject(err);
			});
		});
	},
	randomColor: function (size) {
		let text = "";
		const possible = "abcdef0123456789";
		for (let i = 0; i < size; i++)
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	},
	generateDoc: function (options) {
		return new Promise(function (resolve, reject) {
			switch (options.mimeType) {
				case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
					resolve(generateDocxDoc(options));
					break;
				case "application/pdf":
					resolve(generatePDFDoc(options));
					break;
				case "text/html":
					resolve(generateHtmlToPDF(options));
					break;
				default:
					reject({
						message: langMessage[options.lang || lang].fileTypeNotValid
					});
			}
		});
	}
};
function generateHtmlToPDF(options) {
	return new Promise(function (resolve, reject) {
		options.data.staticImagePath = __dirname + '/../public/img';

		const dustSrc = fs.readFileSync(options.file, 'utf8');
		dust.insertLocalsFn(options.data ? options.data : {}, options.req);
		dust.renderSource(dustSrc, options.data, function (err, html) {
			if (err)
				return reject(err);

			const tmpFileName = __dirname + '/../' + new Date().getTime() + '' + (Math.floor(Math.random() * Math.floor(100))) + '.pdf';

			const headerStartIdx = html.indexOf('<!--HEADER-->');
			const headerEndIdx = html.indexOf('<!--HEADER-->', headerStartIdx + ('<!--HEADER-->'.length)) + ('<!--HEADER-->'.length);
			const header = html.substring(headerStartIdx, headerEndIdx);

			const footerStartIdx = html.indexOf('<!--FOOTER-->');
			const footerEndIdx = html.indexOf('<!--FOOTER-->', footerStartIdx + ('<!--FOOTER-->'.length)) + ('<!--FOOTER-->'.length);
			const footer = html.substring(footerStartIdx, footerEndIdx);

			pdf.create(html, {
				orientation: "portrait",
				format: "A4",
				border: {
					top: "10px",
					right: "15px",
					bottom: "10px",
					left: "15px"
				},
				header: {
					contents: header
				},
				footer: {
					contents: footer
				}
			}).toFile(tmpFileName, function (err, data) {
				if (err)
					return reject(err);

				fs.readFile(tmpFileName, function (err, data) {
					if (!err)
						resolve({
							buffer: data,
							contentType: "application/pdf",
							ext: '.pdf'
						});

					fs.unlinkSync(tmpFileName, function (err) {
						console.error('Unable to delete file ' + tmpFileName + ' after pdf generation');
					});
					return reject(err);
				});
			});
		});
	});
}
var generateDocxDoc = function (options) {
	return new Promise(function (resolve, reject) {
		fs.readFile(options.file, function (err, content) {
			if (!err) {
				try {
					const zip = new JSZip(content);
					const doc = new Docxtemplater();
					const templateOptions = {
						nullGetter: function (part, scope) {
							if (part && part.value) {
								const parts = part.value.split('.');
								if (parts.length)
									return getValue(parts, options.data, scope);
								return "";
							}
							return "";
						}
					};
					doc.setOptions(templateOptions);
					doc.loadZip(zip);
					doc.setData(options.data);
					try {
						doc.render();
						const buf = doc.getZip()
							.generate({
								type: 'nodebuffer',
								compression: "DEFLATE"
							});
						resolve({
							buffer: buf,
							contentType: "application/msword",
							ext: '.docx'
						});
					} catch (error) {
						reject(error);
					}
				} catch (e) {
					reject(e);
				}
			} else
				reject({
					message: langMessage[options.lang || lang].template.notFound
				});
		});
	});
};
var generatePDFDoc = function (options) {
	return new Promise(function (resolve, reject) {
		const sourcePDF = options.file;
		const pdfData = buildPDFJSON(options.entity, options.data);
		pdfFiller.generatePdf(pdfData, sourcePDF, ["flatten"], function (err, out) {
			if (err)
				reject({
					message: langMessage[options.lang || lang].failToFillPDF
				});
			else {
				resolve({
					buffer: out,
					contentType: "application/pdf",
					ext: '.pdf'
				});
			}
		});
	});
};
var buildPDFJSON = function (entityRoot, data) {
	const result = {};
	const relationsOptions = require('../models/options/' + entityRoot.toLowerCase() + '.json');
	for (const item in data) {
		result[item] = data[item];
		for (let i = 0; i < relationsOptions.length; i++) {
			const relation = relationsOptions[i];
			//				if (item === relation.as && relation.relation === "hasMany")
			//					result[item] = data[item];
			if (item === relation.as && relation.relation === "belongsTo") {
				for (const item2 in data[item])
					result[relation.as + '.' + item2] = data[item][item2];
				delete result[relation.as];
			}
		}
	}
	return result;
};

// Get value in json object
var getValue = function (itemPath /*array*/, data, scope /*where value is expected*/) {
	try {
		let i = 0;
		let key = itemPath[i];
		if (scope && scope.scopePath &&
			scope.scopePathItem &&
			scope.scopePath.length &&
			scope.scopePath.length === scope.scopePathItem.length) {
			//Go to data scope  before search value
			for (let j = 0; j < scope.scopePath.length; j++)
				data = data[scope.scopePath[j]][scope.scopePathItem[j]];
		}
		do {
			if (data != null && typeof data !== "undefined" && typeof data[key] !== 'undefined') {
				data = data[key];
			} else
				return '';
			i++;
			key = itemPath[i];
		} while (i < itemPath.length);
		if (data == null)
			data = "";

		// Formatting date directly in the output, usefull for 3 and more level include data
		// TODO: FR / EN Differenciation
		if (typeof data === "object" && moment(new Date(data)).isValid()) {
			data = moment(new Date(data)).format("DD/MM/YYYY");
		}

		return data;
	} catch (e) {
		console.log(e);
		return '';
	}
};

var format_tel = function (tel, separator) {
	const formats = {
		"0": [2, 2, 2, 2, 2, 2],
		"33": [3, 1, 2, 2, 2, 2],
		"0033": [4, 1, 2, 2, 2, 2]
	};
	let format = [];
	const newstr = [];
	let str = tel + '';
	str = str.split(' ').join('');
	const _separator = typeof separator === "undefined" ? " " : separator;
	let i = 0;
	if ((str.startsWith("0") && !str.startsWith("00")) || str.length === 10)
		format = formats["0"];
	if (str.startsWith("+33"))
		format = formats["33"];
	if (str.startsWith("00"))
		format = formats["0033"];
	if (format.length) {
		format.forEach(function (jump) {
			newstr.push(str.substring(i, jump + i));
			i += jump;
		});
		return newstr.join(_separator);
	} return str;
};

var setEnumValue = function (object, enumItem, entityName, fileType, userLang) {
	const values = enums_radios[entityName][enumItem];
	if (typeof values !== "undefined") {
		for (let i = 0; i < values.length; i++) {
			const entry = values[i];
			if (object[enumItem].toLowerCase() === entry.value.toLowerCase()) {
				if (fileType === "application/pdf") {
					object[enumItem] = (i + 1) + '';
					object[enumItem + '_value'] = entry.value;
				} else
					object[enumItem] = entry.value;
				object[enumItem + '_translation'] = entry.translations[userLang];
				break;
			}
		}
	}
};

var setCreatedAtAndUpdatedAtValues = function (resultToReturn, object, userLang) {
	const defaultDateFormat = userLang === 'fr-FR' ? 'DD/MM/YYYY HH:mm:ss' : 'YYYY-MM-DD HH:mm:ss';
	if (object.createdAt)
		resultToReturn.createdAt = moment(new Date(object.createdAt)).format(defaultDateFormat);
	if (object.updatedAt)
		resultToReturn.updatedAt = moment(new Date(object.updatedAt)).format(defaultDateFormat);
};