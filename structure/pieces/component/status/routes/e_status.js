const router = require('express').Router();
const block_access = require('../utils/block_access');
const filterDataTable = require('../utils/filter_datatable');
const models = require('../models/');
const attributes = require('../models/attributes/e_status');
const options = require('../models/options/e_status');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../utils/entity_helper');
const status_helper = require('../utils/status_helper');
const component_helper = require('../utils/component_helper');
const fs = require('fs-extra');
const dust = require('dustjs-linkedin');
const moment = require("moment");
const enums_radios = require('../utils/enum_radio.js');
const language = require('../services/language');
const SELECT_PAGE_SIZE = 10;

router.get('/set_default/:id', block_access.actionAccessMiddleware("status", "update"), function(req, res) {
	const id_status = req.params.id;

	(async () => {
		const status = await models.E_status.findOne({
			where: {
				id: id_status
			},
			include: [{
				model: models.E_action,
				as: 'r_actions',
				order: ["f_position", "ASC"],
				include: [{
					model: models.E_media,
					as: 'r_media',
					include: [{
						model: models.E_media_mail,
						as: 'r_media_mail'
					}, {
						model: models.E_media_notification,
						as: 'r_media_notification'
					}, {
						model: models.E_media_sms,
						as: 'r_media_sms'
					}]
				}]
			}]
		});

		if (!status)
			return res.render('common/error', {
				error: 404
			});

		// Find all entities without status
		const entityModel = entity_helper.capitalizeFirstLetter(status.f_entity);
		const where = {
			where: {}
		};
		where.where['fk_id_status_' + status.f_field.substring(2)] = null;
		const no_statuses = await models[entityModel].findAll(where);

		// Build ID array of entities that need to be updated
		// Build history creation array
		const historyModel = 'E_history_' + status.f_entity.substring(2) + '_' + status.f_field.substring(2);
		const historyCreateObj = [],
			toUpdateIds = [];

		for (let i = 0; i < no_statuses.length; i++) {
			toUpdateIds.push(no_statuses[i].id);
			const createObj = {};
			createObj['fk_id_status_' + status.f_field.substring(2)] = status.id;
			createObj['fk_id_' + status.f_entity.substring(2) + '_history_' + status.f_field.substring(2)] = no_statuses[i].id;
			historyCreateObj.push(createObj);

			// Execute actions for each entity instance
			status.executeActions(no_statuses[i]).catch(err => {
				console.error("Status action error on /set_default :");
				console.error(err);
			});
		}

		// Update entities to add status
		const updateObj = {};
		updateObj['fk_id_status_' + status.f_field.substring(2)] = status.id;
		await models[entityModel].update(updateObj, {
			where: {
				id: {
					[models.$in]: toUpdateIds
				}
			}
		}, {user: req.user});

		// Bulk create history for updated entities
		await models[historyModel].bulkCreate(historyCreateObj);

		return status;
	})().then(status => {
		res.redirect('/status/show?id=' + status.id);
	}).catch(err => {
		entity_helper.error(err, req, res, "/");
	});
});

router.get('/diagram', block_access.actionAccessMiddleware("status", "read"), (req, res) => {
	res.render('e_status/diagram', {statuses: status_helper.entityStatusFieldList()});
});

router.post('/diagramdata', block_access.actionAccessMiddleware("status", "read"), (req, res) => {
	models.E_status.findAll({
		where: {
			f_entity: req.body.f_entity,
			f_field: req.body.f_field
		},
		include: {
			model: models.E_action,
			as: 'r_actions'
		}
	}).then((statuses) => {
		if (statuses.length == 0)
			return res.json({
				statuses: [],
				connections: []
			});

		// Looking for r_children association through database table
		const throughTable = options.filter(x => x.target == 'e_status' && x.as == 'r_children')[0].through;

		let query = 'SELECT * FROM ' + throughTable + ';';
		if(models.sequelize.options.dialect == 'postgres')
			query = 'SELECT * FROM "' + throughTable + '";';

		models.sequelize.query(query, {
			type: models.sequelize.QueryTypes.SELECT
		}).then((connections) => {
			res.json({
				statuses,
				connections
			});
		});
	});
});

router.post('/set_children_diagram', block_access.actionAccessMiddleware("status", "update"), (req, res) => {
	models.E_status.findOne({
		where: {
			id: req.body.parent
		}
	}).then(parent => {
		parent.addR_children(req.body.child).then(_ => {
			res.sendStatus(200);
		});
	});
});

router.post('/remove_children_diagram', block_access.actionAccessMiddleware("status", "update"), function(req, res) {
	models.E_status.findOne({
		where: {
			id: req.body.id
		}
	}).then(status => {
		if (!status)
			return res.sendStatus(500);

		// Looking for r_children association through database table
		const throughTable = options.filter(x => x.target == 'e_status' && x.as == 'r_children')[0].through;

		let query = `DELETE FROM ${throughTable} WHERE fk_id_parent_status = ? || fk_id_child_status = ?;`;
		if(models.sequelize.options.dialect == 'postgres')
			query = `DELETE FROM "${throughTable}" WHERE fk_id_parent_status = '?' OR fk_id_child_status = '?';`;

		models.sequelize.query(query, {
			replacements: [status.id, status.id],
			type: models.sequelize.QueryTypes.DELETE
		}).then(_ => {
			res.sendStatus(200);
		});
	})
});

router.post('/set_children', block_access.actionAccessMiddleware("status", "update"), function(req, res) {
	const statuses = req.body.next_status || [];
	const id_status = req.body.id_status;

	for (let i = 0; i < statuses.length; i++)
		statuses[i] = parseInt(statuses[i]);
	models.E_status.findOne({
		where: {
			id: id_status
		}
	}).then(function(status) {
		if (status)
			status.setR_children(statuses);
		res.redirect('/status/show?id=' + id_status + '#r_children');
	});
});

router.get('/list', block_access.actionAccessMiddleware("status", "read"), function (req, res) {
	const data = {
		"menu": "e_status",
		"sub_menu": "list_e_status"
	};

	data.toastr = req.session.toastr;
	req.session.toastr = [];

	res.render('e_status/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("status", "read"), function (req, res) {
	filterDataTable("E_status", req.body).then(function (rawData) {
		entity_helper.prepareDatalistResult('e_status', rawData, req.session.lang_user).then(function(preparedData) {
			for (let i = 0; i < preparedData.data.length; i++) {
				const entity = preparedData.data[i].f_entity;
				const field = preparedData.data[i].f_field;
				preparedData.data[i].f_entity = language(req.session.lang_user).__('entity.'+entity+'.label_entity');
				preparedData.data[i].f_field = language(req.session.lang_user).__('entity.'+entity+'.'+field);
			}
			res.send(preparedData).end();
		});
	}).catch(function (err) {
		console.error(err);
		res.end();
	});
});

router.post('/subdatalist', block_access.actionAccessMiddleware("status", "read"), function(req, res) {
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
		where: search,
		include: subentityInclude
	}

	if (doPagination == "true") {
		include.limit = length;
		include.offset = start;
	}
	models.E_status.findOne({
		where: {
			id: parseInt(sourceId)
		},
		include: include
	}).then(function(e_status) {
		if (!e_status['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]) {
			console.error('/subdatalist: count' + entity_helper.capitalizeFirstLetter(subentityAlias) + ' is undefined');
			return res.status(500).end();
		}

		e_status['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]().then(function(count) {
			const rawData = {
				recordsTotal: count,
				recordsFiltered: count,
				data: []
			};
			for (let i = 0; i < e_status[subentityAlias].length; i++)
				rawData.data.push(e_status[subentityAlias][i].get({
					plain: true
				}));

			entity_helper.prepareDatalistResult(req.query.subentityModel, rawData, req.session.lang_user).then(function(preparedData) {
				res.send(preparedData).end();
			}).catch(function(err) {
				console.error(err);
				res.end();
			});
		});
	});
});

router.get('/show', block_access.actionAccessMiddleware("status", "read"), function (req, res) {
	const id_e_status = req.query.id;
	const tab = req.query.tab;
	const data = {
		menu: "e_status",
		sub_menu: "list_e_status",
		tab: tab,
		enum_radio: enums_radios.translated("e_status", req.session.lang_user, options)
	};

	/* If we arrive from an associated tab, hide the create and the list button */
	if (typeof req.query.hideButton !== 'undefined')
		data.hideButton = req.query.hideButton;

	entity_helper.optimizedFindOne('E_status', id_e_status, options, [{
		model: models.E_status,
		as: 'r_children'
	}]).then(function(e_status){
		if (!e_status)
			return res.render('common/error', {error: 404});

		data.e_status = e_status;

		const childrenIds = [];
		for (let i = 0; e_status.r_children && i < e_status.r_children.length; i++) {
			const child = e_status.r_children[i];
			child.translate(req.session.lang_user);
			child.dataValues.selected = true;
			childrenIds.push(child.id);
		}

		const where = {
			f_field: e_status.f_field,
			f_entity: e_status.f_entity
		};
		if (childrenIds.length)
			where.id = {[models.$notIn]: childrenIds};
		models.E_status.findAll({
			where: where,
			include: [{
				model: models.E_translation,
				as: 'r_translations'
			}]
		}).then(function(allStatus) {
			for (let i = 0; i < allStatus.length; i++)
				allStatus[i].translate(req.session.lang_user)
			e_status.dataValues.all_children = allStatus.concat(e_status.r_children);

			const entityTradKey = 'entity.'+e_status.f_entity+'.label_entity';
			e_status.f_field = 'entity.'+e_status.f_entity+'.'+e_status.f_field;
			e_status.f_entity = entityTradKey;

			status_helper.translate(e_status, attributes, req.session.lang_user);
			data.e_status = e_status;
			res.render('e_status/show', data);
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.get('/create_form', block_access.actionAccessMiddleware("status", "create"), function (req, res) {
	const data = {
		menu: "e_status",
		sub_menu: "create_e_status",
		enum_radio: enums_radios.translated("e_status", req.session.lang_user, options)
	};

	data.entities = status_helper.entityStatusFieldList();

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
		models.E_status.findOne({where: {id: data.associationFlag}}).then(function(status) {
			data.f_field = status.f_field;
			data.f_entity = status.f_entity;
			data.entityTrad = 'entity.'+data.f_entity+'.label_entity';
			data.fieldTrad = 'entity.'+data.f_entity+'.'+data.f_field;
			res.render('e_status/create', data);
		}).catch(err => {
			console.error(err);
			res.render('common/error', {error: 404});
		});
	}
	else
		res.render('e_status/create', data);
});

router.post('/create', block_access.actionAccessMiddleware("status", "create"), function (req, res) {
	const createObject = model_builder.buildForRoute(attributes, options, req.body);
	const [entity, field] = req.body.entityStatus.split('.');
	createObject.f_entity = entity;
	createObject.f_field = field;

	models.E_status.create(createObject, {user: req.user}).then(function (e_status) {
		let redirect = '/status/show?id='+e_status.id;
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
						e_status.destroy();
						const err = new Error();
						err.message = "Association not found.";
						reject(err);
					}

					const modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
					if (typeof association['add' + modelName] !== 'undefined'){
						association['add' + modelName](e_status.id).then(resolve).catch(function(err){
							reject(err);
						});
					} else {
						const obj = {};
						obj[req.body.associationForeignKey] = e_status.id;
						association.update(obj, {user: req.user}).then(resolve).catch(function(err){
							reject(err);
						});
					}
				});
			}));
		}

		// We have to find value in req.body that are linked to an hasMany or belongsToMany association
		// because those values are not updated for now
		model_builder.setAssocationManyValues(e_status, req.body, createObject, options).then(function(){
			Promise.all(promises).then(function() {
				// If new status is default, remove default from other status entity/field duo
				if (createObject.f_default && createObject.f_default == 'true')
					models.E_status.update(
						{f_default: false},
						{where: {f_entity: e_status.f_entity, f_field: e_status.f_field, id: {[models.$not]: e_status.id}}},
						{user: req.user}
					).then(function() {
						res.redirect(redirect);
					});
				else
					res.redirect(redirect);
			}).catch(function(err){
				entity_helper.error(err, req, res, '/status/create_form');
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/status/create_form');
	});
});

router.get('/update_form', block_access.actionAccessMiddleware("status", "update"), function (req, res) {
	const id_e_status = req.query.id;
	const data = {
		menu: "e_status",
		sub_menu: "list_e_status",
		enum_radio: enums_radios.translated("e_status", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	entity_helper.optimizedFindOne('E_status', id_e_status, options).then(function(e_status){
		if (!e_status) {
			data.error = 404;
			return res.render('common/error', data);
		}
		data.e_status = e_status;
		data.f_field = e_status.f_field;
		data.f_entity = e_status.f_entity;
		data.entityTrad = 'entity.'+data.f_entity+'.label_entity';
		data.fieldTrad = 'entity.'+data.f_entity+'.'+data.f_field;
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_status, "e_status", true).then(function() {
			if (req.query.ajax) {
				e_status.dataValues.enum_radio = data.enum_radio;
				res.render('e_status/update_fields', e_status.get({plain: true}));
			}
			else
				res.render('e_status/update', data);
		}).catch(function (err) {
			entity_helper.error(err, req, res, "/");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/update', block_access.actionAccessMiddleware("status", "update"), function (req, res) {
	const id_e_status = parseInt(req.body.id);
	const updateObject = model_builder.buildForRoute(attributes, options, req.body);

	models.E_status.findOne({where: {id: id_e_status}}).then(function (e_status) {
		if (!e_status)
			return res.render('common/error', {error: 404});

		if(typeof e_status.version === 'undefined' || !e_status.version)
			updateObject.version = 0;
		updateObject.version++;

		e_status.update(updateObject, {user: req.user}).then(function () {

			// We have to find value in req.body that are linked to an hasMany or belongsToMany association
			// because those values are not updated for now
			model_builder.setAssocationManyValues(e_status, req.body, updateObject, options).then(function () {

				let redirect = '/status/show?id=' + id_e_status;
				if (typeof req.body.associationFlag !== 'undefined')
					redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

				req.session.toastr = [{
					message: 'message.update.success',
					level: "success"
				}];

				// If status is now default, remove default from other status entity/field duo
				if (updateObject.f_default && updateObject.f_default == 'true')
					models.E_status.update(
						{f_default: false},
						{where: {f_entity: e_status.f_entity, f_field: e_status.f_field, id: {[models.$not]: e_status.id}}},
						{user: req.user}
					).then(function() {
						res.redirect(redirect);
					});
				else
					res.redirect(redirect);
			});
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/status/update_form?id=' + id_e_status);
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/status/update_form?id=' + id_e_status);
	});
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('status', 'read'), (req, res) => {
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
		let e_status;
		switch (option.structureType) {
			case 'hasOne':
				e_status = await models.E_status.findOne({
					where: {
						id: req.params.id
					},
					include: {
						model: models[entity_helper.capitalizeFirstLetter(option.target)],
						as: option.as,
						include: {all: true}
					}
				});
				if (!e_status)
					throw new Error('Cannot find entity object.')

				dustData = e_status[option.as];
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

					dustData[alias].r_children = await dustData[alias].getR_children({ // eslint-disable-line
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
				return res.status(500).end();
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

router.get('/set_status/:id_status/:status/:id_new_status', block_access.actionAccessMiddleware("status", "update"), function(req, res) {
	const historyModel = 'E_history_status_' + req.params.status.substring(2);
	const historyAlias = 'r_history_' + req.params.status.substring(2);
	const statusAlias = 'r_' + req.params.status.substring(2);

	const errorRedirect = '/status/show?id=' + req.params.id_status;

	const includeTree = status_helper.generateEntityInclude(models, 'e_status');

	// Find target entity instance and include its child to be able to replace variables in media
	includeTree.push({
		model: models[historyModel],
		as: historyAlias,
		limit: 1,
		order: [
			["createdAt", "DESC"]
		],
		include: [{
			model: models.E_status,
			as: statusAlias
		}]
	});
	models.E_status.findOne({
		where: {
			id: req.params.id_status
		},
		include: includeTree
	}).then(function(e_status) {
		if (!e_status || !e_status[historyAlias] || !e_status[historyAlias][0][statusAlias])
			return res.render('common/error', {
				error: 404
			});

		// Find the children of the current status
		models.E_status.findOne({
			where: {
				id: e_status[historyAlias][0][statusAlias].id
			},
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
						include: {
							all: true,
							nested: true
						}
					}]
				}]
			}]
		}).then(function(current_status) {
			if (!current_status || !current_status.r_children)
				return res.render('common/error', {
					error: 404
				});

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
			nextStatus.executeActions(e_status).then(function() {
				// Create history record for this status field
				// Beeing the most recent history for status it will now be its current status
				const createObject = {}
				createObject["fk_id_status_" + nextStatus.f_field.substring(2)] = nextStatus.id;
				createObject["fk_id_status_history_" + req.params.status.substring(2)] = req.params.id_status;
				models[historyModel].create(createObject, {user: req.user}).then(function() {
					e_status['set' + entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
					res.redirect('/status/show?id=' + req.params.id_status)
				});
			}).catch(function(err) {
				console.error(err);
				req.session.toastr = [{
					level: 'warning',
					message: 'component.status.error.action_error'
				}]
				const createObject = {}
				createObject["fk_id_status_" + nextStatus.f_field.substring(2)] = nextStatus.id;
				createObject["fk_id_status_history_" + req.params.status.substring(2)] = req.params.id_status;
				models[historyModel].create(createObject, {user: req.user}).then(function() {
					e_status['set' + entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
					res.redirect('/status/show?id=' + req.params.id_status)
				});
			});
		});
	}).catch(function(err) {
		entity_helper.error(err, req, res, errorRedirect);
	});
});

router.post('/search', block_access.actionAccessMiddleware('status', 'read'), function (req, res) {
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

	models.E_status.findAndCountAll(where).then(function (results) {
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
								results.rows[i][field] = enums_radios.translateFieldValue('e_status', field, results.rows[i][field], req.session.lang_user)
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

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("status", "delete"), function (req, res) {
	const alias = req.params.alias;
	const idToRemove = req.body.idRemove;
	const idEntity = req.body.idEntity;
	models.E_status.findOne({where: {id: idEntity}}).then(function (e_status) {
		if (!e_status) {
			const data = {error: 404};
			return res.render('common/error', data);
		}

		// Get all associations
		e_status['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
			// Remove entity from association array
			for (let i = 0; i < aliasEntities.length; i++)
				if (aliasEntities[i].id == idToRemove) {
					aliasEntities.splice(i, 1);
					break;
				}

			// Set back associations without removed entity
			e_status['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
				res.sendStatus(200).end();
			}).catch(function(err) {
				entity_helper.error(err, req, res, "/");
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("status", "create"), function (req, res) {
	const alias = req.params.alias;
	const idEntity = req.body.idEntity;
	models.E_status.findOne({where: {id: idEntity}}).then(function (e_status) {
		if (!e_status)
			return res.render('common/error', {error: 404});

		let toAdd;
		if (typeof (toAdd = req.body.ids) === 'undefined') {
			req.session.toastr.push({
				message: 'message.create.failure',
				level: "error"
			});
			return res.redirect('/status/show?id=' + idEntity + "#" + alias);
		}

		e_status['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
			res.redirect('/status/show?id=' + idEntity + "#" + alias);
		}).catch(function(err) {
			entity_helper.error(err, req, res, "/");
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/delete', block_access.actionAccessMiddleware("status", "delete"), function (req, res) {
	const id_e_status = parseInt(req.body.id);

	models.E_status.findOne({where: {id: id_e_status}}).then(function (deleteObject) {
		models.E_status.destroy({
			where: {
				id: id_e_status
			}
		}).then(function () {
			req.session.toastr = [{
				message: 'message.delete.success',
				level: "success"
			}];

			let redirect = '/status/list';
			if (typeof req.body.associationFlag !== 'undefined')
				redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			res.redirect(redirect);
			entity_helper.removeFiles("e_status", deleteObject, attributes);
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/status/list');
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/status/list');
	});
});

module.exports = router;