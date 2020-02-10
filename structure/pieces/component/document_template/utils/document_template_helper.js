const moment = require('moment');
const fs = require('fs-extra');
const dust = require('dustjs-linkedin');
const pdf = require('html-pdf');
const enums_radios = require('../locales/enum_radio');
const globalConf = require('../config/global');
const JSZip = require('jszip');
const Docxtemplater = require('docxtemplater');
const pdfFiller = require('fill-pdf');
const language = require('../services/language');
const langMessage = require('../locales/document_template_locales');
const lang = "fr-FR";

function buildPDFJSON(entityRoot, data) {
	const result = {};
	const relationsOptions = require('../models/options/' + entityRoot.toLowerCase() + '.json'); // eslint-disable-line
	for (const item in data) {
		result[item] = data[item];
		for (let i = 0; i < relationsOptions.length; i++) {
			const relation = relationsOptions[i];
			if (item === relation.as && relation.relation === "belongsTo") {
				for (const item2 in data[item])
					result[relation.as + '.' + item2] = data[item][item2];
				delete result[relation.as];
			}
		}
	}
	return result;
}

// Get value in json object
function getValue(itemPath /*array*/, data, scope /*where value is expected*/) {
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
			if (data != null && typeof data !== "undefined" && typeof data[key] !== 'undefined')
				data = data[key];
			else
				return '';
			i++;
			key = itemPath[i];
		} while (i < itemPath.length);
		if (data == null)
			data = "";

		// Formatting date directly in the output, usefull for 3 and more level include data
		// TODO: FR / EN Differenciation
		if (typeof data === "object" && moment(new Date(data)).isValid())
			data = moment(new Date(data)).format("DD/MM/YYYY");

		return data;
	} catch (e) {
		console.log(e);
		return '';
	}
}

function generateHtmlToPDF(options) {
	return new Promise(function (resolve, reject) {
		options.data.staticImagePath = __dirname + '/../public/img';

		let dustSrc = fs.readFileSync(options.file, 'utf8');
		// Add Bootstrap to template
		// See Docs on => https://simplegrid.io/
		const simpleGridCss = fs.readFileSync(__dirname + '/../public/css/simple-grid.min.css', 'utf8');
		dustSrc = dustSrc.replace("<!-- INSERT SIMPLE GRID HERE - DO NOT REMOVE -->", "<style>" + simpleGridCss + "</style>");
		dust.insertLocalsFn(options.data ? options.data : {}, options.req);
		dust.renderSource(dustSrc, options.data, function(err, html) {
			if (err)
				return reject(err);

			const tmpFileName = __dirname + '/../' + new Date().getTime() + '' + Math.floor(Math.random() * Math.floor(100)) + '.pdf';

			const headerStartIdx = html.indexOf('<!--HEADER-->');
			const headerEndIdx = html.indexOf('<!--HEADER-->', headerStartIdx + '<!--HEADER-->'.length) + '<!--HEADER-->'.length;
			const header = html.substring(headerStartIdx, headerEndIdx);

			const footerStartIdx = html.indexOf('<!--FOOTER-->');
			const footerEndIdx = html.indexOf('<!--FOOTER-->', footerStartIdx + '<!--FOOTER-->'.length) + '<!--FOOTER-->'.length;
			let footer = html.substring(footerStartIdx, footerEndIdx);

			html = html.replace(header, '');
			html = html.replace(footer, '');

			footer = footer.replace('**page**', '{{page}}');
			footer = footer.replace('**pages**', '{{pages}}');

			pdf.create(html, {
				orientation: "portrait",
				format: "A4",
				border: {
					top: "0px",
					right: "15px",
					bottom: "0px",
					left: "15px"
				},
				header: {
					height: "50px",
					contents: header
				},
				footer: {
					height: "50px",
					contents: footer
				}
			}).toFile(tmpFileName, err => {
				if (err)
					return reject(err);

				fs.readFile(tmpFileName, (err, data) => {
					if (err) {
						fs.unlinkSync(tmpFileName, _ => {
							console.error('Unable to delete file ' + tmpFileName + ' after pdf generation');
						});
						return reject(err);
					}
					return resolve({
						buffer: data,
						contentType: "application/pdf",
						ext: '.pdf'
					});
				});
			});
		});
	});
}

function generateDocxDoc (options) {
	return new Promise(function (resolve, reject) {
		fs.readFile(options.file, function (err, content) {
			if (err)
				return reject({message: langMessage[options.lang || lang].template.notFound});

			try {
				const zip = new JSZip(content);
				const doc = new Docxtemplater();
				const templateOptions = {
					nullGetter: function (part, scope) {
						if (!part || !part.value)
							return "";
						const parts = part.value.split('.');
						if (parts.length)
							return getValue(parts, options.data, scope);
						return "";
					}
				};
				doc.setOptions(templateOptions);
				doc.loadZip(zip);
				doc.setData(options.data);
				doc.render();
				const buf = doc.getZip().generate({
					type: 'nodebuffer',
					compression: "DEFLATE"
				});
				resolve({
					buffer: buf,
					contentType: "application/msword",
					ext: '.docx'
				});
			} catch (e) {
				reject(e);
			}
		});
	});
}

function generatePDFDoc(options) {
	return new Promise(function (resolve, reject) {
		const sourcePDF = options.file;
		const pdfData = buildPDFJSON(options.entity, options.data);
		pdfFiller.generatePdf(pdfData, sourcePDF, ["flatten"], function (err, out) {
			if (err)
				return reject({
					message: langMessage[options.lang || lang].failToFillPDF
				});
			resolve({
				buffer: out,
				contentType: "application/pdf",
				ext: '.pdf'
			});
		});
	});
}

function formatTel(tel, separator) {
	const formats = {
		"0": [2, 2, 2, 2, 2, 2],
		"33": [3, 1, 2, 2, 2, 2],
		"0033": [4, 1, 2, 2, 2, 2]
	};
	let format = [];
	const newstr = [];
	let str = tel + '', i = 0;
	str = str.split(' ').join('');
	const _separator = typeof separator === "undefined" ? " " : separator;
	if (str.length === 10 || str.startsWith("0") && !str.startsWith("00"))
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
	}
	return str;
}

function setEnumValue(object, enumItem, entityName, fileType, userLang) {
	const values = enums_radios[entityName][enumItem];
	if (typeof values === "undefined")
		return;
	for (let i = 0; i < values.length; i++) {
		const entry = values[i];
		if (object[enumItem].toLowerCase() === entry.value.toLowerCase()) {
			if (fileType === "application/pdf") {
				object[enumItem] = i + 1 + '';
				object[enumItem + '_value'] = entry.value;
			}
			else
				object[enumItem] = entry.value;
			object[enumItem + '_translation'] = entry.translations[userLang];
			break;
		}
	}
}

function setCreatedAtAndUpdatedAtValues(resultToReturn, object, userLang) {
	const defaultDateFormat = userLang === 'fr-FR' ? 'DD/MM/YYYY HH:mm:ss' : 'YYYY-MM-DD HH:mm:ss';
	if (object.createdAt)
		resultToReturn.createdAt = moment(new Date(object.createdAt)).format(defaultDateFormat);
	if (object.updatedAt)
		resultToReturn.updatedAt = moment(new Date(object.updatedAt)).format(defaultDateFormat);
}

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
		const result = {};
		const options = reworkOptions || {};
		const self = this;
		function cleanIncludeLevels(relationsOptions, obj) {
			for (let i = 0; i < relationsOptions.length; i++) {
				const relation = relationsOptions[i];
				if (!obj[relation.as])
					continue;
				const relationAttributes = JSON.parse(fs.readFileSync(__dirname + '/../models/attributes/' + relation.target + '.json'));
				const relationsOptions2 = JSON.parse(fs.readFileSync(__dirname + '/../models/options/' + relation.target + '.json'));

				const entityModelData = {
					entityName: relation.target,
					attributes: relationAttributes,
					options: options[relation.target]
				};

				if (relation.relation === "belongsTo" || relation.relation === "hasOne") {
					result[relation.as] = obj[relation.as].dataValues;
					self.cleanData(result[relation.as], entityModelData, userLang, fileType);
					setCreatedAtAndUpdatedAtValues(result[relation.as], obj[relation.as].dataValues, userLang);

					cleanIncludeLevels(relationsOptions2, obj[relation.as]);
				}
				else if (relation.relation === "hasMany" || relation.relation === "belongsToMany") {
					result[relation.as] = [];
					// Be carefull if we have a lot lot lot lot of data.
					for (let j = 0; j < obj[relation.as].length; j++) {
						result[relation.as].push(obj[relation.as][j].dataValues);
						self.cleanData(result[relation.as][j], entityModelData, userLang, fileType);
						setCreatedAtAndUpdatedAtValues(result[relation.as][j], obj[relation.as][j].dataValues, userLang);
					}

					cleanIncludeLevels(relationsOptions2, obj[relation.as]);
				}
			}
		}

		try {
			const relationsOptions = require('../models/options/' + entityName.toLowerCase() + '.json'); // eslint-disable-line
			const attributes = require('../models/attributes/' + entityName.toLowerCase() + '.json'); // eslint-disable-line
			for (const item in object.dataValues)
				result[item] = object.dataValues[item];

			/** Add createdAt and updatedAt who are not in attributes **/
			setCreatedAtAndUpdatedAtValues(result, object, userLang);

			const entityModelData = {
				entityName: entityName,
				attributes: attributes,
				options: options[entityName]
			}
			this.cleanData(result, entityModelData, userLang, fileType);

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

			for (const attr in attributes) {
				const attribute = attributes[attr];
				if (attr !== item)
					continue;

				switch(attribute.newmipsType) {
					case 'date':
					case 'datetime':
						if(object[item] && object[item] != ''){
							const format = this.getDateFormatUsingLang(userLang, attribute.newmipsType);
							object[item] = moment(new Date(object[item])).format(format);
						}
						break;
					case 'password':
						if(object[item] && object[item] != '')
							object[item] = '•••••••••';
						break;
					case 'boolean':
						if (fileType === "application/pdf")
							object[item+ '_translation'] = object[item] == true ? "Yes" : "No";
						else
							object[item+ '_translation'] = langMessage[userLang || lang].fields.boolean[(object[item] + '').toLowerCase()];
						break;
					case 'text':
					case 'regular text':
						if(fileType != 'text/html') {
							object[item] = object[item].replace(/<[^>]+>/g, ' '); //tag
							object[item] = object[item].replace(/&[^;]+;/g, ' '); //&nbsp
						}
						break;
					case 'phone':
					case 'fax':
						object[item] = formatTel(object[item], ' ');
						break;
					case 'picture':
						if (object[item].split('-').length > 1) {
							try {
								object[item] = "data:image/*;base64, " + fs.readFileSync(globalConf.localstorage + entityName + '/' + object[item].split('-')[0] + '/' + object[item]).toString('base64');
							} catch (err) {
								console.log("IMG NOT FOUND: ", object[item]);
								object[item] = "IMG NOT FOUND: " + object[item];
							}
						}
						break;
					default:
						break;
				}

				if (attribute.type === "ENUM")
					setEnumValue(object, item, entityName, fileType, userLang);

				break;
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
		const modelOptions = require('../models/options/e_' + entity.toLowerCase() + '.json'); // eslint-disable-line
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
		let attributes = require('../models/attributes/e_' + entityRoot.toLowerCase() + '.json'); // eslint-disable-line
		const options = require('../models/options/e_' + entityRoot.toLowerCase() + '.json'); // eslint-disable-line
		let entityRootTranslated = language(userLang).__('entity.e_' + entityRoot.toLowerCase() + '.label_entity');
		entityRootTranslated = entityRootTranslated.charAt(0).toUpperCase() + entityRootTranslated.slice(1);
		result.push({
			id: 0,
			message: '',
			attributes: this.getAttributes(attributes),
			entity: entityRootTranslated,
			relation: 'root',
			color: "#b2b2b2"
		});
		//now get options entities and there attributes
		for (let i = 0; i < options.length; i++) {
			const relation = options[i];
			const target = relation.target.charAt(0).toUpperCase() + relation.target.slice(1);
			if (target && this.entities_to_exclude.indexOf(target) < 0) {
				let attributes = require('../models/attributes/' + relation.target + '.json'); // eslint-disable-line
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
		const options = require('../models/options/' + entity.toLowerCase() + '.json'); // eslint-disable-line
		const parts_of_exclude_relations = (f_exclude_relations || '').split(',');
		for (let i = 0; i < options.length; i++) {
			let found = false;
			const target = options[i].target.toLowerCase();
			for (let j = 0; j < parts_of_exclude_relations.length; j++)
				if (parts_of_exclude_relations[j] && target.replace('e_', '') === parts_of_exclude_relations[j].toLowerCase())
					found = true;
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
				if (err)
					return reject(err);
				resolve(out);
			});
		});
	},
	buildHTMLGlobalVariables: function (userLang) {
		const globalVariables = this.globalVariables;
		return new Promise((resolve, reject) => {
			const template = fs.readFileSync(__dirname + '/../views/e_document_template/global_variable_template.dust', 'utf8');

			dust.renderSource(template, {globalVariables: globalVariables, locales: langMessage[userLang || lang]}, function (err, out) {
				if (err)
					return reject(err);
				resolve(out);
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
			let promise;
			switch (options.mimeType) {
				case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
					promise = generateDocxDoc(options);
					break;
				case "application/pdf":
					promise = generatePDFDoc(options);
					break;
				case "text/html":
					promise = generateHtmlToPDF(options);
					break;
				default:
					return reject({
						message: langMessage[options.lang || lang].fileTypeNotValid
					});
			}
			promise.then(resolve).catch(reject);
		});
	}
};
