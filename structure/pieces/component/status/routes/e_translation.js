const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
// Datalist
const filterDataTable = require('../utils/filter_datatable');

// Sequelize
const models = require('../models/');
const attributes = require('../models/attributes/e_translation');
const options = require('../models/options/e_translation');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../utils/entity_helper');
const file_helper = require('../utils/file_helper');
const status_helper = require('../utils/status_helper');
const globalConfig = require('../config/global');
const fs = require('fs-extra');
const dust = require('dustjs-linkedin');

// Enum and radio managment
const enums_radios = require('../utils/enum_radio.js');

// Winston logger
const logger = require('../utils/logger');

router.get('/list', block_access.actionAccessMiddleware("translation", "read"), function (req, res) {
	const data = {
		"menu": "e_translation",
		"sub_menu": "list_e_translation"
	};

	data.toastr = req.session.toastr;
	req.session.toastr = [];

	res.render('e_translation/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("translation", "read"), function (req, res) {
	filterDataTable("E_translation", req.body).then(function (rawData) {
		entity_helper.prepareDatalistResult('e_translation', rawData, req.session.lang_user).then(function(preparedData) {
			res.send(preparedData).end();
		});
	}).catch(function (err) {
		console.error(err);
		logger.debug(err);
		res.end();
	});
});

router.get('/show', block_access.actionAccessMiddleware("translation", "read"), function (req, res) {
	const id_e_translation = req.query.id;
	const tab = req.query.tab;
	const data = {
		menu: "e_translation",
		sub_menu: "list_e_translation",
		tab: tab,
		enum_radio: enums_radios.translated("e_translation", req.session.lang_user, options)
	};

	/* If we arrive from an associated tab, hide the create and the list button */
	if (typeof req.query.hideButton !== 'undefined')
		data.hideButton = req.query.hideButton;

	entity_helper.optimizedFindOne('E_translation', id_e_translation, options).then(function(e_translation){
		if (!e_translation) {
			data.error = 404;
			logger.debug("No data entity found.");
			return res.render('common/error', data);
		}

		/* Update local e_translation data before show */
		data.e_translation = e_translation;
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_translation, "e_translation").then(function() {
			status_helper.translate(e_translation, attributes, req.session.lang_user);
			// Check if entity has Status component defined and get the possible next status
			status_helper.nextStatus(models, "e_translation", e_translation.id, attributes).then(function(nextStatus) {
				if (nextStatus)
					data.next_status = nextStatus;

				// Give children status entity/field translation
				for (let i = 0; e_translation.r_children && i < e_translation.r_children.length; i++) {
					const curr = e_translation.r_children[i];
					const entityTradKey = 'entity.'+curr.f_entity+'.label_entity';
					curr.f_field = 'entity.'+curr.f_entity+'.'+curr.f_field;
					curr.f_entity = entityTradKey;
				}
				res.render('e_translation/show', data);
			}).catch(function(err) {
				console.error(err);
				req.session.toastr = [{
					message: 'component.status.error',
					level: 'error'
				}];
				res.render('e_translation/show', data);
			});
		}).catch(function (err) {
			entity_helper.error(err, req, res, "/");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.get('/create_form', block_access.actionAccessMiddleware("translation", "create"), function (req, res) {
	const data = {
		menu: "e_translation",
		sub_menu: "create_e_translation",
		enum_radio: enums_radios.translated("e_translation", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	data.languages = [];
	fs.readdirSync(__dirname+'/../locales/').filter(function(file){
		return (file.indexOf('.') !== 0) && (file.slice(-5) === '.json') && file != 'enum_radio.json';
	}).forEach(function(file){
		data.languages.push(file.substring(0, file.length-5));
	});

	const view = req.query.ajax ? 'e_translation/create_fields' : 'e_translation/create';
	res.render(view, data);
});

router.post('/create', block_access.actionAccessMiddleware("translation", "create"), function (req, res) {

	const createObject = model_builder.buildForRoute(attributes, options, req.body);

	models.E_translation.create(createObject, {user: req.user}).then(function (e_translation) {
		let redirect = '/translation/show?id='+e_translation.id;
		req.session.toastr = [{
			message: 'message.create.success',
			level: "success"
		}];

		const promises = [];

		if (typeof req.body.associationFlag !== 'undefined') {
			redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			promises.push(new Promise(function(resolve, reject) {
				models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
					if (!association) {
						e_translation.destroy();
						const err = new Error();
						err.message = "Association not found.";
						reject(err);
					}

					const modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
					if (typeof association['add' + modelName] !== 'undefined'){
						association['add' + modelName](e_translation.id).then(resolve).catch(function(err){
							reject(err);
						});
					} else {
						const obj = {};
						obj[req.body.associationForeignKey] = e_translation.id;
						association.update(obj, {user: req.user}).then(resolve).catch(function(err){
							reject(err);
						});
					}
				});
			}));
		}

		// We have to find value in req.body that are linked to an hasMany or belongsToMany association
		// because those values are not updated for now
		model_builder.setAssocationManyValues(e_translation, req.body, createObject, options).then(function(){
			Promise.all(promises).then(function() {
				res.redirect(redirect);
			}).catch(function(err){
				entity_helper.error(err, req, res, '/translation/create_form');
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/translation/create_form');
	});
});

router.get('/update_form', block_access.actionAccessMiddleware("translation", "update"), function (req, res) {
	const id_e_translation = req.query.id;
	const data = {
		menu: "e_translation",
		sub_menu: "list_e_translation",
		enum_radio: enums_radios.translated("e_translation", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	entity_helper.optimizedFindOne('E_translation', id_e_translation, options).then(function(e_translation){
		if (!e_translation) {
			data.error = 404;
			return res.render('common/error', data);
		}

		data.e_translation = e_translation;
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_translation, "e_translation", true).then(function() {
			if (req.query.ajax) {
				e_translation.dataValues.enum_radio = data.enum_radio;
				res.render('e_translation/update_fields', e_translation.get({plain: true}));
			}
			else
				res.render('e_translation/update', data);
		}).catch(function (err) {
			entity_helper.error(err, req, res, "/");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/update', block_access.actionAccessMiddleware("translation", "update"), function (req, res) {
	const id_e_translation = parseInt(req.body.id);
	const updateObject = model_builder.buildForRoute(attributes, options, req.body);

	models.E_translation.findOne({where: {id: id_e_translation}}).then(function (e_translation) {
		if (!e_translation) {
			data.error = 404;
			logger.debug("Not found - Update");
			return res.render('common/error', data);
		}

		if(typeof e_translation.version === 'undefined' || !e_translation.version)
			updateObject.version = 0;
		updateObject.version++;

		e_translation.update(updateObject, {user: req.user}).then(function () {

			// We have to find value in req.body that are linked to an hasMany or belongsToMany association
			// because those values are not updated for now
			model_builder.setAssocationManyValues(e_translation, req.body, updateObject, options).then(function () {

				let redirect = '/translation/show?id=' + id_e_translation;
				if (typeof req.body.associationFlag !== 'undefined')
					redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

				req.session.toastr = [{
					message: 'message.update.success',
					level: "success"
				}];

				res.redirect(redirect);
			});
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/translation/update_form?id=' + id_e_translation);
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/translation/update_form?id=' + id_e_translation);
	});
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('translation', 'read'), (req, res) => {
	const alias = req.params.alias;
	const id = req.params.id;

	// Find tab option
	let option;
	for (let i = 0; i < options.length; i++)
		if (options[i].as == alias) {
			option = options[i];
			break;
		}
	if (!option)
		return res.status(404).end();

	// Check access rights to subentity
	if (!block_access.entityAccess(req.session.passport.user.r_group, option.target.substring(2)))
		return res.status(403).end();

	const queryOpts = {
		where: {
			id: id
		}
	};
	// If hasMany, no need to include anything since it will be fetched using /subdatalist
	if (option.structureType != 'hasMany' && option.structureType != 'hasManyPreset')
		queryOpts.include = {
			model: models[entity_helper.capitalizeFirstLetter(option.target)],
			as: option.as,
			include: {all: true}
		}

	// Fetch tab data
	models.E_translation.findOne(queryOpts).then(e_translation => {
		if (!e_translation)
			return res.status(404).end();

		let dustData = e_translation[option.as] || null, subentityOptions = [], dustFile, idSubentity, obj;
		const empty = !dustData || dustData instanceof Array && dustData.length == 0, promisesData = [];

		// Default value
		option.noCreateBtn = false;

		// Build tab specific variables
		switch (option.structureType) {
			case 'hasOne':
				if (!empty) {
					idSubentity = dustData.id;
					dustData.hideTab = true;
					dustData.enum_radio = enums_radios.translated(option.target, req.session.lang_user, options);
					promisesData.push(entity_helper.getPicturesBuffers(dustData, option.target));
					// Fetch status children to be able to switch status
					// Apply getR_children() on each current status
					subentityOptions = require('../models/options/' + option.target); // eslint-disable-line
					dustData.componentAddressConfig = component_helper.address.getMapsConfigIfComponentAddressExists(option.target);
					for (let i = 0; i < subentityOptions.length; i++)
						if (subentityOptions[i].target.indexOf('e_status') == 0)
							(alias => {
								promisesData.push(new Promise((resolve, reject) => {
									dustData[alias].getR_children({
										include: [{
											model: models.E_group,
											as: "r_accepted_group"
										}]
									}).then(children => {
										dustData[alias].r_children = children;
										resolve();
									}).catch(reject);
								}));
							})(subentityOptions[i].as);
				}
				dustFile = option.target + '/show_fields';
				break;

			case 'hasMany':
				dustFile = option.target + '/list_fields';
				// Status history specific behavior. Replace history_model by history_table to open view
				if (option.target.indexOf('_history_') == 0)
					option.noCreateBtn = true;
				dustData = {
					for: 'hasMany'
				};
				if (typeof req.query.associationFlag !== 'undefined') {
					dustData.associationFlag = req.query.associationFlag;
					dustData.associationSource = req.query.associationSource;
					dustData.associationForeignKey = req.query.associationForeignKey;
					dustData.associationAlias = req.query.associationAlias;
					dustData.associationUrl = req.query.associationUrl;
				}
				break;

			case 'hasManyPreset':
				dustFile = option.target + '/list_fields';
				obj = {[option.target]: dustData};
				dustData = obj;
				if (typeof req.query.associationFlag !== 'undefined') {
					dustData.associationFlag = req.query.associationFlag;
					dustData.associationSource = req.query.associationSource;
					dustData.associationForeignKey = req.query.associationForeignKey;
					dustData.associationAlias = req.query.associationAlias;
					dustData.associationUrl = req.query.associationUrl;
				}
				dustData.for = 'fieldset';
				for (let i = 0; i < dustData[option.target].length; i++)
					promisesData.push(entity_helper.getPicturesBuffers(dustData[option.target][i], option.target, true));

				break;

			default:
				return res.status(500).end();
		}

		// Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
		entity_helper.getLoadOnStartData(dustData, subentityOptions).then(dustData => {
			// Image buffer promise
			Promise.all(promisesData).then(_ => {
				// Open and render dust file
				const file = fs.readFileSync(__dirname + '/../views/' + dustFile + '.dust', 'utf8');
				dust.insertLocalsFn(dustData ? dustData : {}, req);
				dust.renderSource(file, dustData || {}, (err, rendered) => {
					if (err) {
						console.error(err);
						return res.status(500).end();
					}

					// Send response to ajax request
					res.json({
						content: rendered,
						data: idSubentity || {},
						empty: empty,
						option: option
					});
				});
			}).catch(err => {
				console.error(err);
				res.status(500).send(err);
			});
		}).catch(err => {
			console.error(err);
			res.status(500).send(err);
		});
	}).catch(err => {
		console.error(err);
		res.status(500).send(err);
	});
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('translation', 'read'), function(req, res) {
	const alias = req.params.alias;
	const id = req.params.id;

	// Find tab option
	let option;
	for (let i = 0; i < options.length; i++)
		if (options[i].as == req.params.alias)
		{option = options[i]; break;}
	if (!option)
		return res.status(404).end();

	// Check access rights to subentity
	if (!block_access.entityAccess(req.session.passport.user.r_group, option.target.substring(2)))
		return res.status(403).end();

	// Fetch tab data
	models.E_translation.findOne({
		where: {id: id},
		include: [{
			model: models[entity_helper.capitalizeFirstLetter(option.target)],
			as: option.as,
			include: {all: true}
		}]
	}).then(function(e_translation) {
		if (!e_translation)
			return res.status(404).end();

		let dustData = e_translation[option.as];
		const empty = !dustData || (dustData instanceof Array && dustData.length == 0) ? true : false;
		let dustFile, idSubentity, promisesData = [];

		// Build tab specific variables
		switch (option.structureType) {
			case 'hasOne':
				if (!empty) {
					idSubentity = dustData.id;
					dustData.hideTab = true;
					dustData.enum_radio = enums_radios.translated(option.target, req.session.lang_user, options);
					promisesData.push(entity_helper.getPicturesBuffers(dustData, option.target));
					// Fetch status children to be able to switch status
					// Apply getR_children() on each current status
					const statusGetterPromise = [], subentityOptions = require('../models/options/'+option.target);
					for (var i = 0; i < subentityOptions.length; i++)
						if (subentityOptions[i].target.indexOf('e_status') == 0)
							(function(alias) {
								promisesData.push(new Promise(function(resolve, reject) {
									dustData[alias].getR_children().then(function(children) {
										dustData[alias].r_children = children;
										resolve();
									});
								}))
							})(subentityOptions[i].as);
				}
				dustFile = option.target+'/show_fields';
				break;

			case 'hasMany':
			case 'hasManyPreset':
				dustFile = option.target+'/list_fields';
				// Status history specific behavior. Replace history_model by history_table to open view
				if (option.target.indexOf('_history_') == 0) {
					option.noCreateBtn = true;
					for (const attr in attributes)
						if (attributes[attr].history_table && attributes[attr].history_model == option.target)
							dustFile = attributes[attr].history_table+'/list_fields';
				}
				var obj = {};
				obj[option.target] = dustData;
				dustData = obj;
				dustData.for = option.structureType == 'hasMany' ? 'hasMany' : 'fieldset';
				for (var i = 0; i < dustData[option.target].length; i++)
					promisesData.push(entity_helper.getPicturesBuffers(dustData[option.target][i], option.target, true));
				if (typeof req.query.associationFlag !== 'undefined')
				{dustData.associationFlag = req.query.associationFlag;dustData.associationSource = req.query.associationSource;dustData.associationForeignKey = req.query.associationForeignKey;dustData.associationAlias = req.query.associationAlias;dustData.associationUrl = req.query.associationUrl;}
				break;

			case 'localfilestorage':
				dustFile = option.target+'/list_fields';
				var obj = {};
				obj[option.target] = dustData;
				dustData = obj;
				dustData.sourceId = id;
				break;

			default:
				return res.status(500).end();
		}

		// Image buffer promise
		Promise.all(promisesData).then(function() {
			// Open and render dust file
			const file = fs.readFileSync(__dirname+'/../views/'+dustFile+'.dust', 'utf8');
			dust.insertLocalsFn(dustData ? dustData : {}, req);
			dust.renderSource(file, dustData || {}, function(err, rendered) {
				if (err) {
					console.error(err);
					return res.status(500).end();
				}

				// Send response to ajax request
				res.json({
					content: rendered,
					data: idSubentity || {},
					empty: empty,
					option: option
				});
			});
		}).catch(function(err) {
			console.error(err);
			res.status(500).send(err);
		});
	}).catch(function(err) {
		console.error(err);
		res.status(500).send(err);
	});
});

router.get('/set_status/:id_translation/:status/:id_new_status', block_access.actionAccessMiddleware("translation", "update"), function(req, res) {
	const historyModel = 'E_history_e_translation_'+req.params.status;
	const historyAlias = 'r_history_'+req.params.status.substring(2);
	const statusAlias = 'r_'+req.params.status.substring(2);

	const errorRedirect = '/translation/show?id='+req.params.id_translation;

	const includeTree = status_helper.generateEntityInclude(models, 'e_translation');

	// Find target entity instance and include its child to be able to replace variables in media
	includeTree.push({
		model: models[historyModel],
		as: historyAlias,
		limit: 1,
		order: [["createdAt", "DESC"]],
		include: [{
			model: models.E_status,
			as: statusAlias
		}]
	});
	models.E_translation.findOne({
		where: {id: req.params.id_translation},
		include: includeTree
	}).then(function(e_translation) {
		if (!e_translation || !e_translation[historyAlias] || !e_translation[historyAlias][0][statusAlias]){
			logger.debug("Not found - Set status");
			return res.render('common/error', {error: 404});
		}

		// Find the children of the current status
		models.E_status.findOne({
			where: {id: e_translation[historyAlias][0][statusAlias].id},
			include: [{
				model: models.E_status,
				as: 'r_children',
				include: [{
					model: models.E_action,
					as: 'r_actions',
					order: ["f_position", "ASC"],
					include: [{
						model: models.E_media,
						as: 'r_media',
						include: {all: true, nested: true}
					}]
				}]
			}]
		}).then(function(current_status) {
			if (!current_status || !current_status.r_children){
				logger.debug("Not found - Set status");
				return res.render('common/error', {error: 404});
			}

			// Check if new status is actualy the current status's children
			const children = current_status.r_children;
			let nextStatus = false;
			for (let i = 0; i < children.length; i++) {
				if (children[i].id == req.params.id_new_status)
				{nextStatus = children[i]; break;}
			}
			// Unautorized
			if (nextStatus === false){
				req.session.toastr = [{
					level: 'error',
					message: 'component.status.error.illegal_status'
				}]
				return res.redirect(errorRedirect);
			}

			// Execute newStatus actions
			nextStatus.executeActions(e_translation).then(function() {
				// Create history record for this status field
				// Beeing the most recent history for translation it will now be its current status
				const createObject = {}
				createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
				createObject["fk_id_translation_history_"+req.params.status.substring(2)] = req.params.id_translation;
				models[historyModel].create(createObject, {user: req.user}).then(function() {
					e_translation['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
					res.redirect('/translation/show?id='+req.params.id_translation)
				});
			}).catch(function(err) {
				console.error(err);
				req.session.toastr = [{
					level: 'warning',
					message: 'component.status.error.action_error'
				}]
				const createObject = {}
				createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
				createObject["fk_id_translation_history_"+req.params.status.substring(2)] = req.params.id_translation;
				models[historyModel].create(createObject, {user: req.user}).then(function() {
					e_translation['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
					res.redirect('/translation/show?id='+req.params.id_translation)
				});
			});
		});
	}).catch(function(err) {
		entity_helper.error(err, req, res, errorRedirect);
	});
});

const SELECT_PAGE_SIZE = 10
router.post('/search', block_access.actionAccessMiddleware('translation', 'read'), function (req, res) {
	const search = '%' + (req.body.search || '') + '%';
	const limit = SELECT_PAGE_SIZE;
	const offset = (req.body.page-1)*limit;

	// ID is always needed
	if (req.body.searchField.indexOf("id") == -1)
		req.body.searchField.push('id');

	const where = {raw: true, attributes: req.body.searchField, where: {}};
	if (search != '%%') {
		if (req.body.searchField.length == 1) {
			where.where[req.body.searchField[0]] = {$like: search};
		} else {
			where.where[models.$or] = [];
			for (let i = 0; i < req.body.searchField.length; i++) {
				if (req.body.searchField[i] != "id") {
					const currentOrObj = {};
					currentOrObj[req.body.searchField[i]] = {$like: search}
					where.where[models.$or].push(currentOrObj);
				}
			}
		}
	}

	// Possibility to add custom where in select2 ajax instanciation
	if (typeof req.body.customwhere !== "undefined") {
		let customwhere = {};
		try {
			customwhere = JSON.parse(req.body.customwhere);
		} catch(e){console.error(e);console.error("ERROR: Error in customwhere")}
		for (const param in customwhere)
			where.where[param] = customwhere[param];
	}


	where.offset = offset;
	where.limit = limit;

	models.E_translation.findAndCountAll(where).then(function (results) {
		results.more = results.count > req.body.page * SELECT_PAGE_SIZE ? true : false;
		// Format value like date / datetime / enum / etc...
		for (const field in attributes)
			for (let i = 0; i < results.rows.length; i++)
				for (const fieldSelect in results.rows[i])
					if(fieldSelect == field && results.rows[i][field] && results.rows[i][field] != "")
						switch(attributes[field].newmipsType) {
							case "date":
								results.rows[i][field] = moment(results.rows[i][field]).format(req.session.lang_user == "fr-FR" ? "DD/MM/YYYY" : "YYYY-MM-DD")
								break;
							case "datetime":
								results.rows[i][field] = moment(results.rows[i][field]).format(req.session.lang_user == "fr-FR" ? "DD/MM/YYYY HH:mm" : "YYYY-MM-DD HH:mm")
								break;
							case "enum":
								results.rows[i][field] = enums_radios.translateFieldValue('e_translation', field, results.rows[i][field], req.session.lang_user)
								break;
							default:
								break;
						}
		res.json(results);
	}).catch(function (e) {
		console.error(e);
		res.status(500).json(e);
	});
});


router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("translation", "delete"), function (req, res) {
	const alias = req.params.alias;
	const idToRemove = req.body.idRemove;
	const idEntity = req.body.idEntity;
	models.E_translation.findOne({where: {id: idEntity}}).then(function (e_translation) {
		if (!e_translation) {
			const data = {error: 404};
			return res.render('common/error', data);
		}

		// Get all associations
		e_translation['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
			// Remove entity from association array
			for (let i = 0; i < aliasEntities.length; i++)
				if (aliasEntities[i].id == idToRemove) {
					aliasEntities.splice(i, 1);
					break;
				}

			// Set back associations without removed entity
			e_translation['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
				res.sendStatus(200).end();
			}).catch(function(err) {
				entity_helper.error(err, req, res, "/");
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("translation", "create"), function (req, res) {
	const alias = req.params.alias;
	const idEntity = req.body.idEntity;
	models.E_translation.findOne({where: {id: idEntity}}).then(function (e_translation) {
		if (!e_translation) {
			const data = {error: 404};
			logger.debug("No data entity found.");
			return res.render('common/error', data);
		}

		let toAdd;
		if (typeof (toAdd = req.body.ids) === 'undefined') {
			req.session.toastr.push({
				message: 'message.create.failure',
				level: "error"
			});
			return res.redirect('/translation/show?id=' + idEntity + "#" + alias);
		}

		e_translation['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
			res.redirect('/translation/show?id=' + idEntity + "#" + alias);
		}).catch(function(err) {
			entity_helper.error(err, req, res, "/");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/delete', block_access.actionAccessMiddleware("translation", "delete"), function (req, res) {
	const id_e_translation = parseInt(req.body.id);

	models.E_translation.findOne({where: {id: id_e_translation}}).then(function (deleteObject) {
		models.E_translation.destroy({
			where: {
				id: id_e_translation
			}
		}).then(function () {
			req.session.toastr = [{
				message: 'message.delete.success',
				level: "success"
			}];

			let redirect = '/translation/list';
			if (typeof req.body.associationFlag !== 'undefined')
				redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			res.redirect(redirect);
			entity_helper.removeFiles("e_translation", deleteObject, attributes);
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/translation/list');
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/translation/list');
	});
});

module.exports = router;