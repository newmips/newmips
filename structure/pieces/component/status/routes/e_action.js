const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const filterDataTable = require('../utils/filter_datatable');
const models = require('../models/');
const attributes = require('../models/attributes/e_action');
const options = require('../models/options/e_action');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../utils/entity_helper');
const status_helper = require('../utils/status_helper');
const fs = require('fs-extra');
const dust = require('dustjs-linkedin');
const moment = require('moment');

// Enum and radio managment
const enums_radios = require('../utils/enum_radio.js');

router.get('/list', block_access.actionAccessMiddleware("action", "read"), (req, res) => {
	const data = {
		"menu": "e_action",
		"sub_menu": "list_e_action"
	};

	data.toastr = req.session.toastr;
	req.session.toastr = [];

	res.render('e_action/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("action", "read"), (req, res) => {
	filterDataTable("E_action", req.body).then(rawData => {
		entity_helper.prepareDatalistResult('e_action', rawData, req.session.lang_user).then(preparedData => {
			res.send(preparedData).end();
		});
	}).catch(function (err) {
		console.error(err);
		res.end();
	});
});

router.get('/show', block_access.actionAccessMiddleware("action", "read"), (req, res) => {
	const id_e_action = req.query.id;
	const tab = req.query.tab;
	const data = {
		menu: "e_action",
		sub_menu: "list_e_action",
		tab: tab,
		enum_radio: enums_radios.translated("e_action", req.session.lang_user, options)
	};

	/* If we arrive from an associated tab, hide the create and the list button */
	if (typeof req.query.hideButton !== 'undefined')
		data.hideButton = req.query.hideButton;

	entity_helper.optimizedFindOne('E_action', id_e_action, options).then(e_action => {
		if (!e_action)
			return res.render('common/error', {error: 404});

		/* Update local e_action data before show */
		data.e_action = e_action;
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_action, "e_action").then(_ => {
			status_helper.translate(e_action, attributes, req.session.lang_user);
			res.render('e_action/show', data);
		}).catch(function (err) {
			entity_helper.error(err, req, res, "/");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.get('/create_form', block_access.actionAccessMiddleware("action", "create"), (req, res) => {
	const data = {
		menu: "e_action",
		sub_menu: "create_e_action",
		enum_radio: enums_radios.translated("e_action", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	const view = req.query.ajax ? 'e_action/create_fields' : 'e_action/create';
	if (req.query.associationSource != 'e_status')
		return res.render(view, data);
	models.E_status.findOne({where: {id: data.associationFlag}}).then(status => {
		models.E_action.findAll({
			where: {
				fk_id_status_actions: status.id
			},
			order: [["f_order", "DESC"]],
			limit: 1
		}).then(actionMax => {
			data.max = actionMax && actionMax[0] && actionMax[0].f_order ? actionMax[0].f_order+1 : 1;
			data.status_target = status.f_entity;
			res.render(view, data);
		});
	});
});

router.post('/create', block_access.actionAccessMiddleware("action", "create"), function (req, res) {

	const createObject = model_builder.buildForRoute(attributes, options, req.body);

	models.E_action.create(createObject, {req: req}).then(function (e_action) {
		let redirect = '/action/show?id='+e_action.id;
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
						e_action.destroy();
						const err = new Error();
						err.message = "Association not found.";
						reject(err);
					}

					const modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
					if (typeof association['add' + modelName] !== 'undefined'){
						association['add' + modelName](e_action.id).then(resolve).catch(function(err){
							reject(err);
						});
					} else {
						const obj = {};
						obj[req.body.associationForeignKey] = e_action.id;
						association.update(obj, {req: req}).then(resolve).catch(function(err){
							reject(err);
						});
					}
				});
			}));
		}

		// We have to find value in req.body that are linked to an hasMany or belongsToMany association
		// because those values are not updated for now
		model_builder.setAssocationManyValues(e_action, req.body, createObject, options).then(function(){
			Promise.all(promises).then(function() {
				status_helper.setInitialStatus(req, e_action, 'E_action', attributes).then(_ => {
					res.redirect(redirect);
				});
			}).catch(function(err){
				entity_helper.error(err, req, res, '/action/create_form');
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/action/create_form');
	});
});

router.get('/update_form', block_access.actionAccessMiddleware("action", "update"), function (req, res) {
	const id_e_action = req.query.id;
	const data = {
		menu: "e_action",
		sub_menu: "list_e_action",
		enum_radio: enums_radios.translated("e_action", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	entity_helper.optimizedFindOne('E_action', id_e_action, options).then(function(e_action){
		if (!e_action) {
			data.error = 404;
			return res.render('common/error', data);
		}

		data.e_action = e_action;
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_action, "e_action", true).then(function() {
			if (req.query.ajax) {
				e_action.dataValues.enum_radio = data.enum_radio;
				res.render('e_action/update_fields', e_action.get({plain: true}));
			}
			else
				res.render('e_action/update', data);
		}).catch(function (err) {
			entity_helper.error(err, req, res, "/");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/update', block_access.actionAccessMiddleware("action", "update"), function (req, res) {
	const id_e_action = parseInt(req.body.id);
	const updateObject = model_builder.buildForRoute(attributes, options, req.body);

	models.E_action.findOne({where: {id: id_e_action}}).then(function (e_action) {
		if (!e_action)
			return res.render('common/error', {error: 404});

		if(typeof e_action.version === 'undefined' || !e_action.version)
			updateObject.version = 0;
		updateObject.version++;

		e_action.update(updateObject, {req: req}).then(function () {

			// We have to find value in req.body that are linked to an hasMany or belongsToMany association
			// because those values are not updated for now
			model_builder.setAssocationManyValues(e_action, req.body, updateObject, options).then(function () {

				let redirect = '/action/show?id=' + id_e_action;
				if (typeof req.body.associationFlag !== 'undefined')
					redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

				req.session.toastr = [{
					message: 'message.update.success',
					level: "success"
				}];

				res.redirect(redirect);
			});
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/action/update_form?id=' + id_e_action);
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/action/update_form?id=' + id_e_action);
	});
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('action', 'read'), (req, res) => {
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
	models.E_action.findOne(queryOpts).then(e_action => {
		if (!e_action)
			return res.status(404).end();

		let dustData = e_action[option.as] || null, subentityOptions = [], dustFile, idSubentity, obj;
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

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('action', 'read'), function(req, res) {
	const alias = req.params.alias;
	const id = req.params.id;

	// Find tab option
	let option;
	for (let i = 0; i < options.length; i++)
		if (options[i].as == alias)
		{option = options[i]; break;}
	if (!option)
		return res.status(404).end();

	// Check access rights to subentity
	if (!block_access.entityAccess(req.session.passport.user.r_group, option.target.substring(2)))
		return res.status(403).end();

	// Fetch tab data
	models.E_action.findOne({
		where: {id: id},
		include: [{
			model: models[entity_helper.capitalizeFirstLetter(option.target)],
			as: option.as,
			include: {all: true}
		}]
	}).then(function(e_action) {
		if (!e_action)
			return res.status(404).end();

		let dustData = e_action[option.as], dustFile, idSubentity, obj;
		const empty = !dustData || dustData instanceof Array && dustData.length == 0;
		const promisesData = [];

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
					const subentityOptions = require('../models/options/'+option.target); // eslint-disable-line
					for (let i = 0; i < subentityOptions.length; i++)
						if (subentityOptions[i].target.indexOf('e_status') == 0)
							(alias => {
								promisesData.push(new Promise((resolve, reject) => {
									dustData[alias].getR_children().then(children => {
										dustData[alias].r_children = children;
										resolve();
									}).catch(reject);
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
				obj = {[option.target]: dustData};
				dustData = obj;
				dustData.for = option.structureType == 'hasMany' ? 'hasMany' : 'fieldset';
				for (let i = 0; i < dustData[option.target].length; i++)
					promisesData.push(entity_helper.getPicturesBuffers(dustData[option.target][i], option.target, true));
				if (typeof req.query.associationFlag !== 'undefined')
				{dustData.associationFlag = req.query.associationFlag;dustData.associationSource = req.query.associationSource;dustData.associationForeignKey = req.query.associationForeignKey;dustData.associationAlias = req.query.associationAlias;dustData.associationUrl = req.query.associationUrl;}
				break;

			case 'localfilestorage':
				dustFile = option.target+'/list_fields';
				obj = {[option.target]: dustData};
				dustData = obj;
				dustData.sourceId = id;
				break;

			default:
				return res.status(500).end();
		}

		// Image buffer promise
		Promise.all(promisesData).then(_ => {
			// Open and render dust file
			const file = fs.readFileSync(__dirname+'/../views/'+dustFile+'.dust', 'utf8');
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
		}).catch(function(err) {
			console.error(err);
			res.status(500).send(err);
		});
	}).catch(function(err) {
		console.error(err);
		res.status(500).send(err);
	});
});

router.get('/set_status/:id_action/:status/:id_new_status', block_access.actionAccessMiddleware("action", "update"), function(req, res) {
	status_helper.setStatus('e_action', req.params.id_action, req.params.status, req.params.id_new_status, req.session.passport.user.id, req.query.comment).then(()=> {
		res.redirect('/action/show?id=' + req.params.id_action)
	}).catch((err)=> {
		console.error(err);
		req.session.toastr.push({level: 'error', message: 'component.status.error.action_error'});
		res.redirect(req.headers.referer);
	});
});

const SELECT_PAGE_SIZE = 10
router.post('/search', block_access.actionAccessMiddleware('action', 'read'), function (req, res) {
	const search = '%' + (req.body.search || '') + '%';
	const limit = SELECT_PAGE_SIZE;
	const offset = (req.body.page-1)*limit;

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

	models.E_action.findAndCountAll(where).then(results => {
		results.more = results.count > req.body.page * SELECT_PAGE_SIZE;
		// Format value like date / datetime / etc...
		for (const field in attributes) {
			for (let i = 0; i < results.rows.length; i++) {
				for (const fieldSelect in results.rows[i]) {
					if(fieldSelect == field){
						switch(attributes[field].newmipsType) {
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

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("action", "delete"), function (req, res) {
	const alias = req.params.alias;
	const idToRemove = req.body.idRemove;
	const idEntity = req.body.idEntity;
	models.E_action.findOne({where: {id: idEntity}}).then(function (e_action) {
		if (!e_action) {
			const data = {error: 404};
			return res.render('common/error', data);
		}

		// Get all associations
		e_action['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
			// Remove entity from association array
			for (let i = 0; i < aliasEntities.length; i++)
				if (aliasEntities[i].id == idToRemove) {
					aliasEntities.splice(i, 1);
					break;
				}

			// Set back associations without removed entity
			e_action['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
				res.sendStatus(200).end();
			}).catch(function(err) {
				entity_helper.error(err, req, res, "/");
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("action", "create"), function (req, res) {
	const alias = req.params.alias;
	const idEntity = req.body.idEntity;
	models.E_action.findOne({where: {id: idEntity}}).then(function (e_action) {
		if (!e_action)
			return res.render('common/error', {error: 404});

		let toAdd;
		if (typeof (toAdd = req.body.ids) === 'undefined') {
			req.session.toastr.push({
				message: 'message.create.failure',
				level: "error"
			});
			return res.redirect('/action/show?id=' + idEntity + "#" + alias);
		}

		e_action['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
			res.redirect('/action/show?id=' + idEntity + "#" + alias);
		}).catch(function(err) {
			entity_helper.error(err, req, res, "/");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/delete', block_access.actionAccessMiddleware("action", "delete"), function (req, res) {
	const id_e_action = parseInt(req.body.id);

	models.E_action.findOne({where: {id: id_e_action}}).then(function (deleteObject) {
		models.E_action.destroy({
			where: {
				id: id_e_action
			}
		}).then(function () {
			req.session.toastr = [{
				message: 'message.delete.success',
				level: "success"
			}];

			let redirect = '/action/list';
			if (typeof req.body.associationFlag !== 'undefined')
				redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			res.redirect(redirect);
			entity_helper.removeFiles("e_action", deleteObject, attributes);
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/action/list');
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/action/list');
	});
});

module.exports = router;