const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
// Datalist
const filterDataTable = require('../utils/filter_datatable');

// Sequelize
const models = require('../models/');
const attributes = require('../models/attributes/e_api_credentials');
const options = require('../models/options/e_api_credentials');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../utils/entity_helper');
const status_helper = require('../utils/status_helper');
const component_helper = require('../utils/component_helper');
const fs = require('fs-extra');
const dust = require('dustjs-linkedin');
const randomString = require('randomstring');
const moment = require('moment');

const SELECT_PAGE_SIZE = 10;

// Enum and radio managment
const enums_radios = require('../utils/enum_radio.js');

// Winston logger
const logger = require('../utils/logger');

router.get('/list', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {
	const data = {
		"menu": "e_api_credentials",
		"sub_menu": "list_e_api_credentials"
	};

	data.toastr = req.session.toastr;
	req.session.toastr = [];

	res.render('e_api_credentials/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {
	filterDataTable("E_api_credentials", req.body).then(function (rawData) {
		entity_helper.prepareDatalistResult('e_api_credentials', rawData, req.session.lang_user).then(function (preparedData) {
			res.send(preparedData).end();
		}).catch(function (err) {
			console.error(err);
			logger.debug(err);
			res.end();
		});
	}).catch(function (err) {
		console.error(err);
		logger.debug(err);
		res.end();
	});
});

router.post('/subdatalist', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {
	const start = parseInt(req.body.start || 0);
	const length = parseInt(req.body.length || 10);

	const sourceId = req.query.sourceId;
	const subentityAlias = req.query.subentityAlias, subentityName = req.query.subentityModel;
	const subentityModel = entity_helper.capitalizeFirstLetter(req.query.subentityModel);
	const doPagination = req.query.paginate;

	// Build array of fields for include and search object
	const isGlobalSearch = req.body.search.value != "";
	const search = {}, searchTerm = isGlobalSearch ? [models.$or] : [models.$and];
	search[searchTerm] = [];
	const toInclude = [];
	// Loop over columns array
	for (let i = 0, columns = req.body.columns; i < columns.length; i++) {
		if (columns[i].searchable == 'false')
			continue;

		// Push column's field into toInclude. toInclude will be used to build the sequelize include. Ex: toInclude = ['r_alias.r_other_alias.f_field', 'f_name']
		toInclude.push(columns[i].data);

		// Add column own search
		if (columns[i].search.value != "") {
			const {type, value} = JSON.parse(columns[i].search.value);
			search[searchTerm].push(model_builder.formatSearch(columns[i].data, value, type));
		}
		// Add column global search
		if (isGlobalSearch)
			search[searchTerm].push(model_builder.formatSearch(columns[i].data, req.body.search.value, req.body.columnsTypes[columns[i].data]));
	}
	for (let i = 0; i < req.body.columns.length; i++)
		if (req.body.columns[i].searchable == 'true')
			toInclude.push(req.body.columns[i].data);
	// Get sequelize include object
	const subentityInclude = model_builder.getIncludeFromFields(models, subentityName, toInclude);

	// ORDER BY
	const stringOrder = req.body.columns[req.body.order[0].column].data;
	// If ordering on an association field, use Sequelize.literal so it can match field path 'r_alias.f_name'
	const order = stringOrder.indexOf('.') != -1 ? [[models.Sequelize.literal(stringOrder), req.body.order[0].dir]] : [[stringOrder, req.body.order[0].dir]];

	const include = {
		model: models[subentityModel],
		as: subentityAlias,
		order: order,
		where: search,
		include: subentityInclude
	}

	if (doPagination == "true") {
		include.limit = length;
		include.offset = start;
	}

	models.E_api_credentials.findOne({
		where: {id: parseInt(sourceId)},
		include: include
	}).then(e_api_credentials => {
		if (!e_api_credentials['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]) {
			console.error('/subdatalist: count' + entity_helper.capitalizeFirstLetter(subentityAlias) + ' is undefined');
			return res.status(500).end();
		}

		e_api_credentials['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]().then(function (count) {
			const rawData = {
				recordsTotal: count,
				recordsFiltered: count,
				data: []
			};
			for (let i = 0; i < e_api_credentials[subentityAlias].length; i++)
				rawData.data.push(e_api_credentials[subentityAlias][i].get({plain: true}));

			entity_helper.prepareDatalistResult(req.query.subentityModel, rawData, req.session.lang_user).then(function (preparedData) {
				res.send(preparedData).end();
			}).catch(function (err) {
				console.error(err);
				logger.debug(err);
				res.end();
			});
		});
	});
});

router.get('/show', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {
	const id_e_api_credentials = req.query.id;
	const tab = req.query.tab;
	const data = {
		menu: "e_api_credentials",
		sub_menu: "list_e_api_credentials",
		tab: tab,
		enum_radio: enums_radios.translated("e_api_credentials", req.session.lang_user, options)
	};

	/* If we arrive from an associated tab, hide the create and the list button */
	if (typeof req.query.hideButton !== 'undefined')
		data.hideButton = req.query.hideButton;

	entity_helper.optimizedFindOne('E_api_credentials', id_e_api_credentials, options).then(function (e_api_credentials) {
		if (!e_api_credentials) {
			data.error = 404;
			logger.debug("No data entity found.");
			return res.render('common/error', data);
		}

		/* Update local e_api_credentials data before show */
		data.e_api_credentials = e_api_credentials;
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_api_credentials, "e_api_credentials").then(_ => {
			status_helper.translate(e_api_credentials, attributes, req.session.lang_user);
			data.componentAddressConfig = component_helper.address.getMapsConfigIfComponentAddressExists("e_api_credentials");
			enums_radios.translateUsingField(e_api_credentials, options, data.enum_radio);
			res.render('e_api_credentials/show', data);
		}).catch(function (err) {
			entity_helper.error(err, req, res, "/", "e_user");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/", "e_user");
	});
});

router.get('/create_form', block_access.actionAccessMiddleware("api_credentials", "create"), function (req, res) {
	const data = {
		menu: "e_api_credentials",
		sub_menu: "create_e_api_credentials",
		enum_radio: enums_radios.translated("e_api_credentials", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	const view = req.query.ajax ? 'e_api_credentials/create_fields' : 'e_api_credentials/create';
	res.render(view, data);
});

router.post('/create', block_access.actionAccessMiddleware("api_credentials", "create"), function (req, res) {

	const createObject = model_builder.buildForRoute(attributes, options, req.body);

	createObject.f_client_key = randomString.generate(15);
	createObject.f_client_secret = randomString.generate(15);
	models.E_api_credentials.create(createObject, {user: req.user}).then(function (e_api_credentials) {
		let redirect = '/api_credentials/show?id=' + e_api_credentials.id;
		req.session.toastr = [{
			message: 'message.create.success',
			level: "success"
		}];

		const promises = [];

		if (typeof req.body.associationFlag !== 'undefined') {
			redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			promises.push(new Promise(function (resolve, reject) {
				models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
					if (!association) {
						e_api_credentials.destroy();
						const err = new Error();
						err.message = "Association not found.";
						reject(err);
					}

					const modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
					if (typeof association['add' + modelName] !== 'undefined') {
						association['add' + modelName](e_api_credentials.id).then(resolve).catch(function (err) {
							reject(err);
						});
					} else {
						const obj = {};
						obj[req.body.associationForeignKey] = e_api_credentials.id;
						association.update(obj, {user: req.user}).then(resolve).catch(function (err) {
							reject(err);
						});
					}
				});
			}));
		}

		// We have to find value in req.body that are linked to an hasMany or belongsToMany association
		// because those values are not updated for now
		model_builder.setAssocationManyValues(e_api_credentials, req.body, createObject, options).then(_ => {
			Promise.all(promises).then(_ => {
				component_helper.address.setAddressIfComponentExists(e_api_credentials, options, req.body).then(_ => {
					res.redirect(redirect);
				});
			}).catch(function (err) {
				entity_helper.error(err, req, res, '/api_credentials/create_form', "e_user");
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/api_credentials/create_form', "e_user");
	});
});

router.get('/update_form', block_access.actionAccessMiddleware("api_credentials", "update"), function (req, res) {
	const id_e_api_credentials = req.query.id;
	const data = {
		menu: "e_api_credentials",
		sub_menu: "list_e_api_credentials",
		enum_radio: enums_radios.translated("e_api_credentials", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	entity_helper.optimizedFindOne('E_api_credentials', id_e_api_credentials, options).then(function (e_api_credentials) {
		if (!e_api_credentials) {
			data.error = 404;
			return res.render('common/error', data);
		}

		data.e_api_credentials = e_api_credentials;
		enums_radios.translateUsingField(e_api_credentials, options, data.enum_radio);
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_api_credentials, "e_api_credentials", true).then(_ => {
			if (req.query.ajax) {
				e_api_credentials.dataValues.enum_radio = data.enum_radio;
				res.render('e_api_credentials/update_fields', e_api_credentials.get({plain: true}));
			} else
				res.render('e_api_credentials/update', data);
		}).catch(function (err) {
			entity_helper.error(err, req, res, "/", "e_user");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/", "e_user");
	});
});

router.post('/update', block_access.actionAccessMiddleware("api_credentials", "update"), function (req, res) {
	const id_e_api_credentials = parseInt(req.body.id);
	const updateObject = model_builder.buildForRoute(attributes, options, req.body);

	models.E_api_credentials.findOne({where: {id: id_e_api_credentials}}).then(function (e_api_credentials) {
		if (!e_api_credentials)
			return res.render('common/error', {error: 404});

		component_helper.address.updateAddressIfComponentExists(e_api_credentials, options, req.body);

		if(typeof e_api_credentials.version === 'undefined' || !e_api_credentials.version)
			updateObject.version = 0;
		updateObject.version++;

		e_api_credentials.update(updateObject, {user: req.user}).then(_ => {

			// We have to find value in req.body that are linked to an hasMany or belongsToMany association
			// because those values are not updated for now
			model_builder.setAssocationManyValues(e_api_credentials, req.body, updateObject, options).then(_ => {

				let redirect = '/api_credentials/show?id=' + id_e_api_credentials;
				if (typeof req.body.associationFlag !== 'undefined')
					redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

				req.session.toastr = [{
					message: 'message.update.success',
					level: "success"
				}];

				res.redirect(redirect);
			});
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/api_credentials/update_form?id=' + id_e_api_credentials, "e_user");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/api_credentials/update_form?id=' + id_e_api_credentials, "e_user");
	});
});


router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('api_credentials', 'read'), (req, res) => {
	const alias = req.params.alias;

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

	// Default value
	option.noCreateBtn = false;

	let dustData = null, subentityOptions = [], empty = false, dustFile;
	(async () => {
		if (typeof req.query.associationFlag !== 'undefined')
			dustData = req.query;

		// Get read / create / update / delete access on the sub entity to handle button display
		const userRoles = req.session.passport.user.r_role;
		option.access = {
			read: block_access.actionAccess(userRoles, option.target.substring(2), "read"),
			create: block_access.actionAccess(userRoles, option.target.substring(2), "create"),
			update: block_access.actionAccess(userRoles, option.target.substring(2), "update"),
			delete: block_access.actionAccess(userRoles, option.target.substring(2), "delete")
		};

		// Build tab specific variables
		let e_api_credentials;
		switch (option.structureType) {
			case 'hasOne':
				e_api_credentials = await models.E_api_credentials.findOne({
					where: {
						id: req.params.id
					},
					include: {
						model: models[entity_helper.capitalizeFirstLetter(option.target)],
						as: option.as,
						include: {all: true}
					}
				});
				if (!e_api_credentials)
					throw new Error('Cannot find entity object.')

				dustData = e_api_credentials[option.as];
				empty = !dustData || dustData instanceof Array && dustData.length == 0;
				dustFile = option.target + '/show_fields';

				if (empty)
					break;

				dustData.hideTab = true;
				dustData.enum_radio = enums_radios.translated(option.target, req.session.lang_user, options);
				dustData.componentAddressConfig = component_helper.address.getMapsConfigIfComponentAddressExists(option.target);
				await entity_helper.getPicturesBuffers(dustData, option.target);

				// Fetch status children to be able to switch status
				// Apply getR_children() on each current status
				subentityOptions = require('../models/options/' + option.target); // eslint-disable-line
				for (let i = 0; i < subentityOptions.length; i++) {
					if (subentityOptions[i].target.indexOf('e_status') != 0)
						continue;

					const statusAlias = subentityOptions[i].as;
					dustData[statusAlias].r_children = await dustData[statusAlias].getR_children({ // eslint-disable-line
						include: [{
							model: models.E_group,
							as: "r_accepted_group"
						}]
					});
				}
				break;

			case 'hasMany':
				// Status history specific behavior. Replace history_model by history_table to open view
				if (option.target.indexOf('e_history_') == 0)
					option.noCreateBtn = true;
				dustData.for = 'hasMany';
				dustFile = option.target + '/list_fields';
				break;

			case 'hasManyPreset':
				dustData.for = 'fieldset';
				dustFile = option.target + '/list_fields';
				break;

			default:
				throw new Error('Cannot find assocation structureType')
		}

		// Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
		return await entity_helper.getLoadOnStartData(dustData, subentityOptions); // Return dustData

	})().then(dustData => {
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
				data: dustData ? dustData.id || {} : {},
				empty: empty,
				option: option
			});
		});
	}).catch(err => {
		console.error(err);
		res.status(500).send(err);
	});
});

router.get('/set_status/:id_api_credentials/:status/:id_new_status', block_access.actionAccessMiddleware("api_credentials", "update"), function (req, res) {
	const historyModel = 'E_history_e_api_credentials_' + req.params.status;
	const historyAlias = 'r_history_' + req.params.status.substring(2);
	const statusAlias = 'r_' + req.params.status.substring(2);

	const errorRedirect = '/api_credentials/show?id=' + req.params.id_api_credentials;

	const includeTree = status_helper.generateEntityInclude(models, 'e_api_credentials');

	// Find target entity instance and include its child to be able to replace variables in media
	includeTree.push({
		model: models[historyModel],
		as: historyAlias,
		limit: 1,
		order: 'createdAt DESC',
		include: [{
			model: models.E_status,
			as: statusAlias
		}]
	});
	models.E_api_credentials.findOne({
		where: {id: req.params.id_api_credentials},
		include: includeTree
	}).then(function (e_api_credentials) {
		if (!e_api_credentials || !e_api_credentials[historyAlias] || !e_api_credentials[historyAlias][0][statusAlias]) {
			logger.debug("Not found - Set status");
			return res.render('common/error', {error: 404});
		}

		// Find the children of the current status
		models.E_status.findOne({
			where: {
				id: e_api_credentials[historyAlias][0][statusAlias].id
			},
			include: [{
				model: models.E_status,
				as: 'r_children',
				include: [{
					model: models.E_action,
					as: 'r_actions',
					order: 'f_position ASC',
					include: [{
						model: models.E_media,
						as: 'r_media',
						include: {
							all: true,
							nested: true
						}
					}]
				}]
			}]
		}).then(function (current_status) {
			if (!current_status || !current_status.r_children) {
				logger.debug("Not found - Set status");
				return res.render('common/error', {
					error: 404
				});
			}

			// Check if new status is actualy the current status's children
			const children = current_status.r_children;
			let nextStatus = false;
			for (let i = 0; i < children.length; i++) {
				if (children[i].id == req.params.id_new_status) {
					nextStatus = children[i];
					break;
				}
			}
			// Unautorized
			if (nextStatus === false) {
				req.session.toastr = [{
					level: 'error',
					message: 'component.status.error.illegal_status'
				}]
				return res.redirect(errorRedirect);
			}

			// Execute newStatus actions
			nextStatus.executeActions(e_api_credentials).then(_ => {
				// Create history record for this status field
				// Beeing the most recent history for api_credentials it will now be its current status
				const createObject = {}
				createObject["fk_id_status_" + nextStatus.f_field.substring(2)] = nextStatus.id;
				createObject["fk_id_api_credentials_history_" + req.params.status.substring(2)] = req.params.id_api_credentials;
				models[historyModel].create(createObject, {user: req.user}).then(_ => {
					e_api_credentials['set' + entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
					res.redirect('/api_credentials/show?id=' + req.params.id_api_credentials)
				});
			}).catch(function (err) {
				console.error(err);
				req.session.toastr = [{
					level: 'warning',
					message: 'component.status.error.action_error'
				}]
				const createObject = {}
				createObject["fk_id_status_" + nextStatus.f_field.substring(2)] = nextStatus.id;
				createObject["fk_id_api_credentials_history_" + req.params.status.substring(2)] = req.params.id_api_credentials;
				models[historyModel].create(createObject, {user: req.user}).then(_ => {
					e_api_credentials['set' + entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
					res.redirect('/api_credentials/show?id=' + req.params.id_api_credentials)
				});
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, errorRedirect, "e_user");
	});
});

router.post('/search', block_access.actionAccessMiddleware('api_credentials', 'read'), function (req, res) {
	const search = '%' + (req.body.search || '') + '%';
	const limit = SELECT_PAGE_SIZE;
	const offset = (req.body.page - 1) * limit;

	// ID is always needed
	if (req.body.searchField.indexOf("id") == -1)
		req.body.searchField.push('id');

	const where = {raw: true, attributes: req.body.searchField, where: {}};
	if (search != '%%') {
		if (req.body.searchField.length == 1) {
			where.where[req.body.searchField[0]] = {[models.$like]: search};
		} else {
			where.where[models.$or] = [];
			for (let i = 0; i < req.body.searchField.length; i++) {
				if (req.body.searchField[i] != "id") {
					const currentOrObj = {};
					currentOrObj[req.body.searchField[i]] = {[models.$like]: search}
					where.where[models.$or].push(currentOrObj);
				}
			}
		}
	}

	// Possibility to add custom where in select2 ajax instanciation
	if (typeof req.body.customWhere !== "undefined")
		for (const param in req.body.customWhere){
			// If the custom where is on a foreign key
			if(param.indexOf("fk_") != -1){
				for (const option in options){
					// We only add where condition on key that are standard hasMany relation, not belongsToMany association
					if(options[option].otherKey == param && options[option].relation != "belongsToMany")
						where.where[param] = req.body.customWhere[param];
				}
			} else
				where.where[param] = req.body.customWhere[param];
		}

	where.offset = offset;
	where.limit = limit;

	models.E_api_credentials.findAndCountAll(where).then(function (results) {
		results.more = results.count > req.body.page * SELECT_PAGE_SIZE;
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
								results.rows[i][field] = enums_radios.translateFieldValue('e_api_credentials', field, results.rows[i][field], req.session.lang_user)
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

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("api_credentials", "delete"), function (req, res) {
	const alias = req.params.alias;
	const idToRemove = req.body.idRemove;
	const idEntity = req.body.idEntity;
	models.E_api_credentials.findOne({where: {id: idEntity}}).then(function (e_api_credentials) {
		if (!e_api_credentials) {
			const data = {error: 404};
			return res.render('common/error', data);
		}

		// Get all associations
		e_api_credentials['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
			// Remove entity from association array
			for (let i = 0; i < aliasEntities.length; i++)
				if (aliasEntities[i].id == idToRemove) {
					aliasEntities.splice(i, 1);
					break;
				}

			// Set back associations without removed entity
			e_api_credentials['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(_ => {
				res.sendStatus(200).end();
			}).catch(function (err) {
				entity_helper.error(err, req, res, "/", "e_user");
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/", "e_user");
	});
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("api_credentials", "create"), function (req, res) {
	const alias = req.params.alias;
	const idEntity = req.body.idEntity;
	models.E_api_credentials.findOne({where: {id: idEntity}}).then(function (e_api_credentials) {
		if (!e_api_credentials) {
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
			return res.redirect('/api_credentials/show?id=' + idEntity + "#" + alias);
		}

		e_api_credentials['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(_ => {
			res.redirect('/api_credentials/show?id=' + idEntity + "#" + alias);
		}).catch(function (err) {
			entity_helper.error(err, req, res, "/", "e_user");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/", "e_user");
	});
});

router.post('/delete', block_access.actionAccessMiddleware("api_credentials", "delete"), function (req, res) {
	const id_e_api_credentials = parseInt(req.body.id);

	models.E_api_credentials.findOne({where: {id: id_e_api_credentials}}).then(function (deleteObject) {
		models.E_api_credentials.destroy({
			where: {
				id: id_e_api_credentials
			}
		}).then(_ => {
			req.session.toastr = [{
				message: 'message.delete.success',
				level: "success"
			}];

			let redirect = '/api_credentials/list';
			if (typeof req.body.associationFlag !== 'undefined')
				redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			res.redirect(redirect);
			entity_helper.removeFiles("e_api_credentials", deleteObject, attributes);
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/api_credentials/list', "e_user");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/api_credentials/list', "e_user");
	});
});

module.exports = router;