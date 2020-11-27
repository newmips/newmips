const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
// Datalist
const filterDataTable = require('../utils/filter_datatable');

// Sequelize
const models = require('../models/');
const attributes = require('../models/attributes/e_user');
const options = require('../models/options/e_user');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../utils/entity_helper');
const status_helper = require('../utils/status_helper');
const component_helper = require('../utils/component_helper');
const globalConfig = require('../config/global');
const fs = require('fs-extra');
const dust = require('dustjs-linkedin');
const moment = require("moment");
const bcrypt = require('bcrypt-nodejs');
const SELECT_PAGE_SIZE = 10;

// Enum and radio managment
const enums_radios = require('../utils/enum_radio.js');

// Winston logger
const logger = require('../utils/logger');

router.get('/list', block_access.actionAccessMiddleware("user", "read"), function(req, res) {
	res.render('e_user/list');
});

router.post('/datalist', block_access.actionAccessMiddleware("user", "read"), function(req, res) {
	filterDataTable("E_user", req.body).then(function(rawData) {
		for (let i = 0; i < rawData.data.length; i++) {
			const user = rawData.data[i];
			user.f_password = undefined;
			user.f_token_password_reset = undefined;
			user.f_enabled = undefined;
		}
		entity_helper.prepareDatalistResult('e_user', rawData, req.session.lang_user).then(function(preparedData) {
			res.send(preparedData).end();
		}).catch(function(err) {
			console.error(err);
			logger.debug(err);
			res.end();
		});
	}).catch(function(err) {
		console.error(err);
		logger.debug(err);
		res.end();
	});
});

router.post('/subdatalist', block_access.actionAccessMiddleware("user", "read"), (req, res) => {
	const start = parseInt(req.body.start || 0);
	const length = parseInt(req.body.length || 10);

	const sourceId = req.query.sourceId;
	const subentityAlias = req.query.subentityAlias, subentityName = req.query.subentityModel;
	const subentityModel = entity_helper.capitalizeFirstLetter(req.query.subentityModel);
	const doPagination = req.query.paginate;

	// Build array of fields for include and search object
	const isGlobalSearch = req.body.search.value != "";
	const search = {}, searchTerm = isGlobalSearch ? models.$or : models.$and;
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
		include: subentityInclude
	}
	if (search[searchTerm].length > 0)
		include.where = search;

	if (search[searchTerm].length > 0)
		include.where = search;

	if (doPagination == "true") {
		include.limit = length;
		include.offset = start;
	}

	include.required = false;

	models.E_user.findOne({
		where: {
			id: parseInt(sourceId)
		},
		include: include
	}).then(user => {
		if (!user['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]) {
			console.error('/subdatalist: count' + entity_helper.capitalizeFirstLetter(subentityAlias) + ' is undefined');
			return res.status(500).end();
		}

		user['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]({where: include.where}).then(count => {
			const rawData = {
				recordsTotal: count,
				recordsFiltered: count,
				data: []
			};
			for (let i = 0; i < user[subentityAlias].length; i++)
				rawData.data.push(user[subentityAlias][i].get({plain: true}));

			entity_helper.prepareDatalistResult(req.query.subentityModel, rawData, req.session.lang_user).then(preparedData => {
				res.send(preparedData).end();
			}).catch(err => {
				console.error(err);
				res.end();
			});
		});
	});
});

router.get('/show', block_access.actionAccessMiddleware("user", "read"), function(req, res) {
	const id_e_user = req.query.id;
	const tab = req.query.tab;
	const data = {
		tab: tab,
		enum_radio: enums_radios.translated("e_user", req.session.lang_user, options)
	};

	/* If we arrive from an associated tab, hide the create and the list button */
	if (typeof req.query.hideButton !== 'undefined')
		data.hideButton = req.query.hideButton;

	entity_helper.optimizedFindOne('E_user', id_e_user, options).then(function(e_user) {
		if (!e_user) {
			data.error = 404;
			logger.debug("No data entity found.");
			return res.render('common/error', data);
		}

		/* Update local e_user data before show */
		data.e_user = e_user;
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_user, "e_user").then(function() {
			status_helper.translate(e_user, attributes, req.session.lang_user);
			data.componentAddressConfig = component_helper.address.getMapsConfigIfComponentAddressExists("e_user");
			enums_radios.translateUsingField(e_user, options, data.enum_radio);
			// Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
			entity_helper.getLoadOnStartData(data, options).then(function(data) {
				res.render('e_user/show', data);
			}).catch(function(err) {
				entity_helper.error(err, req, res, "/", "e_user");
			})
		}).catch(function(err) {
			entity_helper.error(err, req, res, "/", "e_user");
		});
	}).catch(function(err) {
		entity_helper.error(err, req, res, "/", "e_user");
	});
});

router.get('/create_form', block_access.actionAccessMiddleware("user", "create"), function(req, res) {
	const data = {
		enum_radio: enums_radios.translated("e_user", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	// Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
	entity_helper.getLoadOnStartData(data, options).then(function(data) {
		const view = req.query.ajax ? 'e_user/create_fields' : 'e_user/create';
		res.render(view, data);
	}).catch(function(err) {
		entity_helper.error(err, req, res, '/user/create_form', "e_user");
	})
});

router.post('/create', block_access.actionAccessMiddleware("user", "create"), function(req, res) {

	const createObject = model_builder.buildForRoute(attributes, options, req.body);
	// Make sure it's impossible to set sensitive information through create form
	createObject.f_token_password_reset = undefined;
	createObject.f_enabled = 0;
	createObject.f_password = undefined;

	models.E_user.create(createObject, {user: req.user}).then(function(e_user) {
		let redirect = '/user/show?id=' + e_user.id;
		req.session.toastr = [{
			message: 'message.create.success',
			level: "success"
		}];

		const promises = [];

		if (typeof req.body.associationFlag !== 'undefined') {
			redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			promises.push(new Promise(function(resolve, reject) {
				models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({
					where: {
						id: req.body.associationFlag
					}
				}).then(function(association) {
					if (!association) {
						e_user.destroy();
						const err = new Error();
						err.message = "Association not found.";
						reject(err);
					}

					const modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
					if (typeof association['add' + modelName] !== 'undefined') {
						association['add' + modelName](e_user.id).then(resolve).catch(function(err) {
							reject(err);
						});
					} else {
						const obj = {};
						obj[req.body.associationForeignKey] = e_user.id;
						association.update(obj, {user: req.user}).then(resolve).catch(function(err) {
							reject(err);
						});
					}
				});
			}));
		}

		// We have to find value in req.body that are linked to an hasMany or belongsToMany association
		// because those values are not updated for now
		model_builder.setAssocationManyValues(e_user, req.body, createObject, options).then(function() {
			Promise.all(promises).then(function() {
				component_helper.address.setAddressIfComponentExists(e_user, options, req.body).then(function() {
					res.redirect(redirect);
				});
			}).catch(function(err) {
				entity_helper.error(err, req, res, '/user/create_form', "e_user");
			});
		});
	}).catch(function(err) {
		entity_helper.error(err, req, res, '/user/create_form', "e_user");
	});
});

router.get('/update_form', block_access.actionAccessMiddleware("user", "update"), function(req, res) {
	const id_e_user = req.query.id;
	const data = {
		enum_radio: enums_radios.translated("e_user", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	entity_helper.optimizedFindOne('E_user', id_e_user, options).then(function(e_user) {
		if (!e_user) {
			data.error = 404;
			return res.render('common/error', data);
		}

		e_user.dataValues.enum_radio = data.enum_radio;
		enums_radios.translateUsingField(e_user, options, data.enum_radio);
		data.e_user = e_user;
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_user, "e_user", true).then(function() {
			// Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
			entity_helper.getLoadOnStartData(req.query.ajax ? e_user.dataValues : data, options).then(function(data) {
				if (req.query.ajax) {
					e_user.dataValues = data;
					res.render('e_user/update_fields', e_user.get({
						plain: true
					}));
				} else
					res.render('e_user/update', data);
			}).catch(function(err) {
				entity_helper.error(err, req, res, "/", "e_user");
			})
		}).catch(function(err) {
			entity_helper.error(err, req, res, "/", "e_user");
		})
	}).catch(function(err) {
		entity_helper.error(err, req, res, "/", "e_user");
	})
});

router.post('/update', block_access.actionAccessMiddleware("user", "update"), function(req, res) {
	const id_e_user = parseInt(req.body.id);
	const data = {};

	const updateObject = model_builder.buildForRoute(attributes, options, req.body);
	// Make sure it's impossible to set sensitive information through update form
	updateObject.f_token_password_reset = undefined;
	updateObject.f_enabled = undefined;
	updateObject.f_password = undefined;

	models.E_user.findOne({
		where: {
			id: id_e_user
		}
	}).then(function(e_user) {
		if (!e_user) {
			data.error = 404;
			logger.debug("Not found - Update");
			return res.render('common/error', data);
		}
		component_helper.address.updateAddressIfComponentExists(e_user, options, req.body);

		let redirect = '/user/show?id=' + id_e_user;
		// If we are in user settings,then he cannot modify sensible data, and we redirect differently
		if(req.body.is_settings){
			delete updateObject.f_login;
			delete updateObject.r_role;
			delete updateObject.r_group;
			redirect = '/user/settings';
		}

		if(typeof e_user.version === 'undefined' || !e_user.version)
			updateObject.version = 0;
		updateObject.version++;

		e_user.update(updateObject, {user: req.user}).then(function() {

			// We have to find value in req.body that are linked to an hasMany or belongsToMany association
			// because those values are not updated for now
			model_builder.setAssocationManyValues(e_user, req.body, updateObject, options).then(function() {
				if (typeof req.body.associationFlag !== 'undefined')
					redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

				req.session.toastr = [{
					message: 'message.update.success',
					level: "success"
				}];

				res.redirect(redirect);
			}).catch(function(err) {
				entity_helper.error(err, req, res, '/user/update_form?id=' + id_e_user, "e_user");
			});
		}).catch(function(err) {
			entity_helper.error(err, req, res, '/user/update_form?id=' + id_e_user, "e_user");
		});
	}).catch(function(err) {
		entity_helper.error(err, req, res, '/user/update_form?id=' + id_e_user, "e_user");
	});
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('user', 'read'), (req, res) => {
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
		let ENTITY_NAME;
		switch (option.structureType) {
			case 'hasOne':
				ENTITY_NAME = await models.MODEL_NAME.findOne({
					where: {
						id: req.params.id
					},
					include: {
						model: models[entity_helper.capitalizeFirstLetter(option.target)],
						as: option.as,
						include: {all: true}
					}
				});
				if (!ENTITY_NAME)
					throw new Error('Cannot find entity object.')

				dustData = ENTITY_NAME[option.as];
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

router.get('/set_status/:id_user/:status/:id_new_status', block_access.actionAccessMiddleware("user", "update"), function(req, res) {
	status_helper.setStatus('e_user', req.params.id_user, req.params.status, req.params.id_new_status, req.user, req.query.comment).then(()=> {
		res.redirect(req.headers.referer);
	}).catch(err => {
		console.error(err);
		req.session.toastr.push({level: 'error', message: 'component.status.error.action_error'});
		res.redirect(req.headers.referer);
	});
});

router.post('/search', block_access.actionAccessMiddleware('user', 'read'), function(req, res) {
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
				$like: search
			};
		} else {
			where.where[models.$or] = [];
			for (let i = 0; i < req.body.searchField.length; i++) {
				if (req.body.searchField[i] != "id") {
					const currentOrObj = {};
					if(req.body.searchField[i].indexOf(".") != -1){
						currentOrObj["$"+req.body.searchField[i]+"$"] = {
							[models.$like]: search
						}
					} else {
						currentOrObj[req.body.searchField[i]] = {
							[models.$like]: search
						}
					}
					where.where[models.$or].push(currentOrObj);
				}
			}
		}
	}

	// /!\ Custom where disabled for user /!\

	where.offset = offset;
	where.limit = limit;

	// If you need to show fields in the select that are in an other associate entity
	// You have to include those entity here
	// where.include = [{model: models.E_myentity, as: "r_myentity"}]
	models.E_user.findAndCountAll(where).then(function(results) {
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
								results.rows[i][field] = enums_radios.translateFieldValue('e_user', field, results.rows[i][field], req.session.lang_user)
								break;
							default:
								break;
						}
		res.json(results);
	}).catch(function(e) {
		console.error(e);
		res.status(500).json(e);
	});
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("user", "delete"), function(req, res) {
	const alias = req.params.alias;
	const idToRemove = req.body.idRemove;
	const idEntity = req.body.idEntity;
	models.E_user.findOne({
		where: {
			id: idEntity
		}
	}).then(function(e_user) {
		if (!e_user)
			return res.render('common/error', {error: 404});

		// Get all associations
		e_user['remove' + entity_helper.capitalizeFirstLetter(alias)](idToRemove).then(_ => {
			res.sendStatus(200).end();
		}).catch(err => {
			entity_helper.error(err, req, res, "/", "e_user");
		});
	}).catch(err => {
		entity_helper.error(err, req, res, "/", "e_user");
	});
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("user", "create"), function(req, res) {
	const alias = req.params.alias;
	const idEntity = req.body.idEntity;
	models.E_user.findOne({
		where: {
			id: idEntity
		}
	}).then(function(e_user) {
		if (!e_user) {
			const data = {
				error: 404
			};
			logger.debug("No data entity found.");
			return res.render('common/error', data);
		}

		let toAdd;
		if (typeof(toAdd = req.body.ids) === 'undefined') {
			req.session.toastr.push({
				message: 'message.create.failure',
				level: "error"
			});
			return res.redirect('/user/show?id=' + idEntity + "#" + alias);
		}

		e_user['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function() {
			res.redirect('/user/show?id=' + idEntity + "#" + alias);
		}).catch(function(err) {
			entity_helper.error(err, req, res, "/", "e_user");
		});
	}).catch(function(err) {
		entity_helper.error(err, req, res, "/", "e_user");
	});
});

router.post('/delete', block_access.actionAccessMiddleware("user", "delete"), function(req, res) {
	const id_e_user = parseInt(req.body.id);

	models.E_user.findOne({
		where: {
			id: id_e_user
		}
	}).then(function(deleteObject) {
		models.E_user.destroy({
			where: {
				id: id_e_user
			}
		}).then(function() {
			req.session.toastr = [{
				message: 'message.delete.success',
				level: "success"
			}];

			let redirect = '/user/list';
			if (typeof req.body.associationFlag !== 'undefined')
				redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			res.redirect(redirect);
			entity_helper.removeFiles("e_user", deleteObject, attributes);
		}).catch(function(err) {
			entity_helper.error(err, req, res, '/user/list', "e_user");
		});
	}).catch(function(err) {
		entity_helper.error(err, req, res, '/user/list', "e_user");
	});
});

router.get('/settings', block_access.isLoggedIn, function(req, res) {

	const id_e_user = req.session.passport && req.session.passport.user ? req.session.passport.user.id : 1;
	const data = {};

	models.E_user.findOne({
		attributes: ["id", "f_login", "f_email"],
		where: {
			id: id_e_user
		},
		include: [{
			model: models.E_group,
			as: 'r_group'
		}, {
			model: models.E_role,
			as: 'r_role'
		}]
	}).then(e_user => {
		if (!e_user) {
			data.error = 404;
			return res.render('common/error', data);
		}

		data.e_user = e_user;
		data.isLocal = false;
		if(globalConfig.authStrategy && globalConfig.authStrategy.toLowerCase() == "local")
			data.isLocal = true;

		res.render('e_user/settings', data);
	}).catch(function(err) {
		entity_helper.error(err, req, res, "/", "e_user");
	});
})

router.post('/settings', block_access.isLoggedIn, function(req, res) {

	const updateObject = {};

	if (req.body.f_email && req.body.f_email != '')
		updateObject.f_email = req.body.f_email

	models.E_user.findByPk(req.session.passport.user.id).then(user => {
		const newPassword = new Promise((resolve, reject) => {
			if (!req.body.old_password || req.body.old_password == "")
				return resolve(updateObject);

			if (req.body.new_password_1 == "" && req.body.new_password_2 == "")
				return reject("settings.error1");
			else if (req.body.new_password_1 != req.body.new_password_2)
				return reject("settings.error2");
			else if (req.body.new_password_1.length < 4)
				return reject("settings.error3");

			bcrypt.compare(req.body.old_password, user.f_password, function(err, check) {
				if (!check)
					return reject("settings.error4");

				updateObject.f_password = bcrypt.hashSync(req.body.new_password_1, null, null);
				resolve(updateObject);
			})

		})

		newPassword.then(updateObject => {
			user.update(updateObject, {user: req.user}).then(() => {
				req.session.toastr = [{
					message: "settings.success",
					level: "success"
				}];
				res.redirect("/user/settings");
			})
		}).catch(err => {
			req.session.toastr = [{
				message: err,
				level: "error"
			}];
			res.redirect("/user/settings");
		})
	})
})

module.exports = router;