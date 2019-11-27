const router = require('express').Router();
const block_access = require('../utils/block_access');
const filterDataTable = require('../utils/filter_datatable');
const models = require('../models/');
const attributes = require('../models/attributes/e_document_template');
const options = require('../models/options/e_document_template');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../utils/entity_helper');
const globalConfig = require('../config/global');
const document_template_helper = require('../utils/document_template_helper');
const status_helper = require('../utils/status_helper.js');
const enums_radios = require('../utils/enum_radio.js');
const moment = require('moment');
const mimeTypes = require('mime-types');

const SELECT_PAGE_SIZE = 10;

router.get('/list', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
	res.render('e_document_template/list');
});

router.post('/datalist', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
	filterDataTable("E_document_template", req.body).then(function (rawData) {
		entity_helper.prepareDatalistResult('e_document_template', rawData, req.session.lang_user).then(function (preparedData) {
			res.send(preparedData).end();
		});
	}).catch(function (err) {
		console.error(err);
		res.end();
	});
});

router.get('/show', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
	const id_e_document_template = req.query.id;
	const tab = req.query.tab;
	const data = {
		menu: "e_document_template",
		sub_menu: "list_e_document_template",
		tab: tab,
		enum_radio: enums_radios.translated("e_document_template", req.session.lang_user, options)
	};

	/* If we arrive from an associated tab, hide the create and the list button */
	if (typeof req.query.hideButton !== 'undefined')
		data.hideButton = req.query.hideButton;

	/* Looking for two level of include to get all associated data in show tab list */

	models.E_document_template.findOne({
		where: {
			id: id_e_document_template
		}
	}).then(function (e_document_template) {
		if (!e_document_template) {
			data.error = 404;
			return res.render('common/error', data);
		}

		data.e_document_template = e_document_template;
		const relations = document_template_helper.getRelations(e_document_template.f_entity);
		const f_exclude_relations = (e_document_template.f_exclude_relations || '').split(',');
		for (let i = 0; i < relations.length; i++) {
			if (f_exclude_relations.indexOf(relations[i].value) < 0)
				relations[i].isSelected = true;
		}
		data.e_document_template.document_template_relations = relations;
		res.render('e_document_template/show', data);

	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.get('/create_form', block_access.actionAccessMiddleware("document_template", "create"), function (req, res) {
	const data = {
		menu: "e_document_template",
		sub_menu: "create_e_document_template",
		enum_radio: enums_radios.translated("e_document_template", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	data.document_template_entities = document_template_helper.get_entities(models);
	res.render('e_document_template/create', data);
});

router.post('/create', block_access.actionAccessMiddleware("document_template", "create"), function(req, res) {

	const createObject = model_builder.buildForRoute(attributes, options, req.body);
	const relations = document_template_helper.getRelations(req.body.f_entity);
	const f_exclude_relations = Array.isArray(req.body.f_exclude_relations) ? req.body.f_exclude_relations : [req.body.f_exclude_relations];
	const exclude_relations = [];

	for (let i = 0; i < relations.length; i++)
		if (f_exclude_relations.indexOf(relations[i].value) < 0)
			exclude_relations.push(relations[i].value);

	createObject.f_exclude_relations = exclude_relations.join(',');

	models.E_document_template.create(createObject, {
		req: req
	}).then(e_document_template => {
		const redirect = '/document_template/show?id=' + e_document_template.id;
		req.session.toastr = [{
			message: 'message.create.success',
			level: "success"
		}];
		res.redirect(redirect);
	}).catch(function(err) {
		entity_helper.error(err, req, res, '/document_template/create_form');
	});
});

router.get('/update_form', block_access.actionAccessMiddleware("document_template", "update"), function (req, res) {
	const id_e_document_template = req.query.id;
	const data = {
		menu: "e_document_template",
		sub_menu: "list_e_document_template",
		enum_radio: enums_radios.translated("e_document_template", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	models.E_document_template.findOne({
		where: {
			id: id_e_document_template
		},
		include: [{
			all: true
		}]
	}).then(function (e_document_template) {
		if (!e_document_template) {
			data.error = 404;
			return res.render('common/error', data);
		}

		data.e_document_template = e_document_template;
		data.document_template_entities = document_template_helper.get_entities(models);

		const relations = document_template_helper.getRelations(e_document_template.f_entity, {lang: req.session.lang_user});
		const f_exclude_relations = (e_document_template.f_exclude_relations || '').split(',');
		for (let i = 0; i < relations.length; i++) {
			if (f_exclude_relations.indexOf(relations[i].value) < 0)
				relations[i].isSelected = true;
		}
		data.e_document_template.document_template_relations = relations;

		res.render('e_document_template/update', data);
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/update', block_access.actionAccessMiddleware("document_template", "update"), function (req, res) {
	const id_e_document_template = parseInt(req.body.id);
	const updateObject = model_builder.buildForRoute(attributes, options, req.body);

	const relations = document_template_helper.getRelations(req.body.f_entity);
	const f_exclude_relations = Array.isArray(req.body.f_exclude_relations) ? req.body.f_exclude_relations : [req.body.f_exclude_relations];
	const exclude_relations = [];

	for (let i = 0; i < relations.length; i++)
		if (f_exclude_relations.indexOf(relations[i].value) < 0)
			exclude_relations.push(relations[i].value);

	updateObject.f_exclude_relations = exclude_relations.join(',');
	models.E_document_template.findOne({
		where: {
			id: id_e_document_template
		}
	}).then(function (e_document_template) {
		if (!e_document_template)
			return res.render('common/error', {error: 404});

		if(typeof e_document_template.version === 'undefined' || !e_document_template.version)
			updateObject.version = 0;
		updateObject.version++;

		e_document_template.update(updateObject, {req: req}).then(function () {

			// We have to find value in req.body that are linked to an hasMany or belongsToMany association
			// because those values are not updated for now
			model_builder.setAssocationManyValues(e_document_template, req.body, updateObject, options).then(function () {

				let redirect = '/document_template/show?id=' + id_e_document_template;
				if (typeof req.body.associationFlag !== 'undefined')
					redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

				req.session.toastr = [{
					message: 'message.update.success',
					level: "success"
				}];

				res.redirect(redirect);
			});
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/document_template/update_form?id=' + id_e_document_template);
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/document_template/update_form?id=' + id_e_document_template);
	});
});

router.get('/set_status/:id_document_template/:status/:id_new_status', block_access.actionAccessMiddleware("document_template", "update"), function (req, res) {
	status_helper.setStatus('e_document_template', req.params.id_document_template, req.params.status, req.params.id_new_status, req.session.passport.user.id, req.query.comment).then(() => {
		res.redirect('/document_template/show?id=' + req.params.id_document_template);
	}).catch((err) => {
		console.error(err);
		req.session.toastr.push({level: 'error', message: 'component.status.error.action_error'});
		res.redirect(req.headers.referer);
	});
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("document_template", "delete"), function (req, res) {
	const alias = req.params.alias;
	const idToRemove = req.body.idRemove;
	const idEntity = req.body.idEntity;
	models.E_document_template.findOne({
		where: {
			id: idEntity
		}
	}).then(function (e_document_template) {
		if (!e_document_template) {
			const data = {
				error: 404
			};
			return res.render('common/error', data);
		}

		// Get all associations
		e_document_template['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
			// Remove entity from association array
			for (let i = 0; i < aliasEntities.length; i++)
				if (aliasEntities[i].id == idToRemove) {
					aliasEntities.splice(i, 1);
					break;
				}

			// Set back associations without removed entity
			e_document_template['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
				res.sendStatus(200).end();
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("document_template", "create"), function (req, res) {
	const alias = req.params.alias;
	const idEntity = req.body.idEntity;
	models.E_document_template.findOne({
		where: {
			id: idEntity
		}
	}).then(function (e_document_template) {
		if (!e_document_template) {
			const data = {
				error: 404
			};
			return res.render('common/error', data);
		}

		let toAdd;
		if (typeof (toAdd = req.body.ids) === 'undefined') {
			req.session.toastr.push({
				message: 'message.create.failure',
				level: "error"
			});
			return res.redirect('/document_template/show?id=' + idEntity + "#" + alias);
		}

		e_document_template['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
			res.redirect('/document_template/show?id=' + idEntity + "#" + alias);
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/delete', block_access.actionAccessMiddleware("document_template", "delete"), function (req, res) {
	const id_e_document_template = parseInt(req.body.id);

	models.E_document_template.findOne({
		where: {
			id: id_e_document_template
		}
	}).then(function (deleteObject) {
		models.E_document_template.destroy({
			where: {
				id: id_e_document_template
			}
		}).then(function () {
			req.session.toastr = [{
				message: 'message.delete.success',
				level: "success"
			}];

			let redirect = '/document_template/list';
			if (typeof req.body.associationFlag !== 'undefined')
				redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			res.redirect(redirect);
			entity_helper.removeFiles("e_document_template", deleteObject, attributes);
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/document_template/list');
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/document_template/list');
	});
});

router.post('/generate', block_access.isLoggedIn, function (req, res) {
	const id_entity = req.body.id_entity;
	let entity = req.body.entity;
	const id_document = req.body.f_model_document;

	if (id_entity && id_document && entity) {
		models.E_document_template.findOne({
			where: {
				id: id_document
			}
		}).then(function (e_model_document) {
			if (e_model_document && e_model_document.f_file) {
				// Model name
				entity = entity.charAt(0).toUpperCase() + entity.slice(1);

				// Build include according to template configuration
				const includes = document_template_helper.buildInclude(entity, e_model_document.f_exclude_relations, models);

				// If you need to add more levels in the inclusion to access deeper data
				// You can add here more inclusion
				// Example:
				// if(entity == "myMainEntity")
				//	 for(var item in includes)
				//		 if(includes[item].as == "myAliasINeedToAddNewInclusion")
				//			 includes[item].include = [{
				//				 model: models.E_mymodeltoinclude,
				//				 as: "r_myModelToInclude"
				//			 }]

				models[entity].findOne({
					where: {
						id: id_entity
					},
					include: includes
				}).then(function (e_entity) {
					if (e_entity) {
						const partOfFilepath = e_model_document.f_file.split('-');
						if (partOfFilepath.length > 1) {
							let completeFilePath = globalConfig.localstorage + 'e_document_template/' + partOfFilepath[0] + '/' + e_model_document.f_file;
							const today = moment();
							let isDust = false;
							if (completeFilePath.indexOf('.dust') >= 0) {
								isDust = true;
								completeFilePath = completeFilePath.replace('.dust', '.html');
							}
							const mimeType = mimeTypes.lookup(completeFilePath);
							if (isDust)
								completeFilePath = completeFilePath.replace('.html', '.dust');
							const reworkOptions = {
								// Entity by entity
								// 'e_entity': [{
								//	 item: 'f_date',
								//	 type: 'datetime',
								//	 newFormat: 'DD/MM/YYYY HH'
								// }]
								// Next entity
							};
							// Rework data with given options
							const data = document_template_helper.rework(e_entity, entity.toLowerCase(), reworkOptions, req.session.lang_user, mimeType);

							// Now add others globals variables
							document_template_helper.globalVariables.forEach(function (g) {
								if (g.type === "date" || g.type === "datetime" || g.type === "time")
									data[g.name] = moment().format(document_template_helper.getDateFormatUsingLang(req.session.lang_user, g.type));
							});
							data['g_email'] = req.session.passport.user.f_email != null ? req.session.passport.user.f_email : '';
							data['g_login'] = req.session.passport.user.f_login != null ? req.session.passport.user.f_login : '';

							const options = {
								file: completeFilePath,
								mimeType: mimeType,
								data: data,
								entity: entity,
								lang: req.session.lang_user,
								req: req
							};
							document_template_helper.generateDoc(options).then(function (infos) {
								const filename = (e_entity.id || '') +
									'_' + today.format('DDMMYYYY_HHmmss') +
									'_' + today.unix() +
									infos.ext;
								res.writeHead(200, {
									"Content-Type": infos.contentType,
									"Content-Disposition": "attachment;filename=" + filename
								});
								res.write(infos.buffer);
								res.end();
							}).catch(function (e) {
								req.session.toastr = [{
									message: e.message,
									level: "error"
								}];
								res.redirect('/document_template/list');
							});
						} else {
							req.session.toastr = [
								{
									level: 'error',
									message: 'Nom du fichier template non valide'
								}
							];
							res.redirect('/document_template/list');
						}
					} else {
						req.session.toastr = [
							{
								level: 'error',
								message: 'Entité cible non trouvée'
							}
						];
						res.redirect('/document_template/list');
					}
				});
			} else {
				req.session.toastr = [
					{
						level: 'error',
						message: 'Fichier template non disponible'
					}
				];
				res.redirect('/document_template/list');
			}
		});
	} else {
		req.session.toastr = [
			{
				level: 'error',
				message: 'Erreur interne. Veuillez contacter votre administrateur'
			}
		];
		res.redirect('/document_template/list');
	}
});

router.get('/readme/:entity', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
	const data = {
		"menu": "e_document_template",
		"sub_menu": "list_e_document_template"
	};
	const entity = req.params.entity;
	if (entity) {
		data.toastr = req.session.toastr;
		req.session.toastr = [];
		data['entities'] = document_template_helper.build_help(entity, req.session.lang_user);
		data.document_template_entities = document_template_helper.get_entities(models);
		data.readme = document_template_helper.getReadmeMessages(req.session.lang_user);
		data.selectedEntity = entity;
		res.render('e_document_template/readme', data);
	}
});

router.get('/help/:type', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
	const type = req.params.type;

	if (type === "subEntities") {
		res.status(200).json({
			message: document_template_helper.getSubEntitiesHelp(req.session.lang_user)
		});
	} else
		res.status(404).end();
});

router.get('/entities/:entity/relations', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
	const entity = req.params.entity;
	const type = req.query.t;
	if (entity) {
		if (type === 'html') {
			document_template_helper.buildHTML_EntitiesHelperAjax(document_template_helper.build_help(entity, req.session.lang_user), req.session.lang_user).then(out => {
				res.status(200).json({
					HTMLRelationsList: out
				});
			}).catch(e => {
				console.log(e);
				res.status(500).end();
			});
		} else
			res.status(200).json({
				relations: document_template_helper.getRelations(entity)
			});
	} else
		res.status(200).end([]);
});

router.get('/global-variables', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
	document_template_helper.buildHTMLGlobalVariables(req.session.lang_user).then(out => {
		res.status(200).json({
			HTMLGlobalVariables: out
		});
	}).catch(e => {
		console.error(e);
		res.status(500).end();
	});
});

router.post('/search', block_access.actionAccessMiddleware('document_template', 'read'), function (req, res) {
	const search = '%' + (req.body.search || '') + '%';
	const limit = SELECT_PAGE_SIZE;
	const offset = (req.body.page - 1) * limit;

	// ID is always needed
	if (req.body.searchField.indexOf("id") == -1)
		req.body.searchField.push('id');

	const where = {
		raw: true,
		attributes: req.body.searchField,
		where: {}
	};
	if (search != '%%') {
		if (req.body.searchField.length == 1) {
			where.where[req.body.searchField[0]] = {
				[models.$like]: search
			};
		} else {
			where.where[models.$or] = [];
			for (let i = 0; i < req.body.searchField.length; i++) {
				if (req.body.searchField[i] != "id") {
					const currentOrObj = {};
					currentOrObj[req.body.searchField[i]] = {
						[models.$like]: search
					}
					where.where[models.$or].push(currentOrObj);
				}
			}
		}
	}

	// Example custom where in select HTML attributes, please respect " and ':
	// data-customwhere='{"myField": "myValue"}'

	// Notice that customwhere feature do not work with related to many field if the field is a foreignKey !

	// Possibility to add custom where in select2 ajax instanciation
	if (typeof req.body.customwhere !== "undefined") {
		// If customwhere from select HTML attribute, we need to parse to object
		if (typeof req.body.customwhere === "string")
			req.body.customwhere = JSON.parse(req.body.customwhere);
		for (const param in req.body.customwhere) {
			// If the custom where is on a foreign key
			if (param.indexOf("fk_") != -1) {
				for (const option in options) {
					// We only add where condition on key that are standard hasMany relation, not belongsToMany association
					if ((options[option].foreignKey == param || options[option].otherKey == param) && options[option].relation != "belongsToMany")
						where.where[param] = req.body.customwhere[param];
				}
			} else
				where.where[param] = req.body.customwhere[param];
		}
	}

	where.offset = offset;
	where.limit = limit;

	models.E_document_template.findAndCountAll(where).then(function (results) {
		results.more = results.count > req.body.page * SELECT_PAGE_SIZE;
		// Format value like date / datetime / etc...
		for (const field in attributes) {
			for (let i = 0; i < results.rows.length; i++) {
				for (const fieldSelect in results.rows[i]) {
					if (fieldSelect == field) {
						switch (attributes[field].newmipsType) {
							case "date":
								results.rows[i][fieldSelect] = moment(results.rows[i][fieldSelect]).format(req.session.lang_user == "fr-FR" ? "DD/MM/YYYY" : "YYYY-MM-DD")
								break;
							case "datetime":
								results.rows[i][fieldSelect] = moment(results.rows[i][fieldSelect]).format(req.session.lang_user == "fr-FR" ? "DD/MM/YYYY HH:mm" : "YYYY-MM-DD HH:mm")
								break;
							default:
								break;
						}
					}
				}
			}
		}
		res.json(results);
	}).catch(function (e) {
		console.error(e);
		res.status(500).json(e);
	});
});

module.exports = router;