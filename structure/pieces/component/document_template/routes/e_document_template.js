const router = require('express').Router();
const block_access = require('../utils/block_access');
const filterDataTable = require('../utils/filter_datatable');
const models = require('../models/');
const attributes = require('../models/attributes/e_document_template');
const options = require('../models/options/e_document_template');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../utils/entity_helper');
const status_helper = require('../utils/status_helper');
const component_helper = require('../utils/component_helper');
const globalConfig = require('../config/global');
const fs = require('fs-extra');
const dust = require('dustjs-linkedin');
const moment = require("moment");
const SELECT_PAGE_SIZE = 10;
const enums_radios = require('../utils/enum_radio.js');

const document_template_helper = require('../utils/document_template_helper');
const mimeTypes = require('mime-types');

router.get('/list', block_access.actionAccessMiddleware("document_template", "read"), (req, res) => {
	res.render('e_document_template/list');
});

router.post('/datalist', block_access.actionAccessMiddleware("document_template", "read"), (req, res) => {
	filterDataTable("E_document_template", req.body).then(rawData => {
		entity_helper.prepareDatalistResult('e_document_template', rawData, req.session.lang_user).then(preparedData => {
			res.send(preparedData).end();
		}).catch(err => {
			console.error(err);
			res.end();
		});
	}).catch(err => {
		console.error(err);
		res.end();
	});
});

router.post('/subdatalist', block_access.actionAccessMiddleware("document_template", "read"), (req, res) => {
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

	models.E_document_template.findOne({
		where: {
			id: parseInt(sourceId)
		},
		include: include
	}).then(e_document_template => {
		if (!e_document_template['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]) {
			console.error('/subdatalist: count' + entity_helper.capitalizeFirstLetter(subentityAlias) + ' is undefined');
			return res.status(500).end();
		}

		e_document_template['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]({where: include.where}).then(count => {
			const rawData = {
				recordsTotal: count,
				recordsFiltered: count,
				data: []
			};
			for (let i = 0; i < e_document_template[subentityAlias].length; i++)
				rawData.data.push(e_document_template[subentityAlias][i].get({plain: true}));

			entity_helper.prepareDatalistResult(req.query.subentityModel, rawData, req.session.lang_user).then(preparedData => {
				res.send(preparedData).end();
			}).catch(err => {
				console.error(err);
				res.end();
			});
		});
	});
});

router.get('/show', block_access.actionAccessMiddleware("document_template", "read"), (req, res) => {
	const id_e_document_template = req.query.id;
	const tab = req.query.tab;
	const data = {
		tab: tab,
		enum_radio: enums_radios.translated("e_document_template", req.session.lang_user, options)
	};

	/* If we arrive from an associated tab, hide the create and the list button */
	if (typeof req.query.hideButton !== 'undefined')
		data.hideButton = req.query.hideButton;

	entity_helper.optimizedFindOne('E_document_template', id_e_document_template, options).then(e_document_template => {
		if (!e_document_template)
			return res.render('common/error', {error: 404});

		/* Update local e_document_template data before show */
		data.e_document_template = e_document_template;
		const relations = document_template_helper.getRelations(e_document_template.f_entity);
		const f_exclude_relations = (e_document_template.f_exclude_relations || '').split(',');
		for (let i = 0; i < relations.length; i++) {
			if (f_exclude_relations.indexOf(relations[i].value) < 0)
				relations[i].isSelected = true;
		}
		data.e_document_template.document_template_relations = relations;

		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_document_template, "e_document_template").then(_ => {
			status_helper.translate(e_document_template, attributes, req.session.lang_user);
			data.componentAddressConfig = component_helper.address.getMapsConfigIfComponentAddressExists("e_document_template");
			// Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
			entity_helper.getLoadOnStartData(data, options).then(data => {
				res.render('e_document_template/show', data);
			}).catch(err => {
				entity_helper.error(err, req, res, "/", "e_document_template");
			})
		}).catch(err => {
			entity_helper.error(err, req, res, "/", "e_document_template");
		});
	}).catch(err => {
		entity_helper.error(err, req, res, "/", "e_document_template");
	});
});

router.get('/create_form', block_access.actionAccessMiddleware("document_template", "create"), (req, res) => {
	const data = {
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

	// Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
	entity_helper.getLoadOnStartData(data, options).then(data => {
		const view = req.query.ajax ? 'e_document_template/create_fields' : 'e_document_template/create';
		res.render(view, data);
	}).catch(err => {
		entity_helper.error(err, req, res, '/document_template/create_form', "e_document_template");
	})
});

router.post('/create', block_access.actionAccessMiddleware("document_template", "create"), (req, res) => {

	const createObject = model_builder.buildForRoute(attributes, options, req.body);
	const relations = document_template_helper.getRelations(req.body.f_entity);
	const f_exclude_relations = Array.isArray(req.body.f_exclude_relations) ? req.body.f_exclude_relations : [req.body.f_exclude_relations];
	const exclude_relations = [];

	for (let i = 0; i < relations.length; i++)
		if (f_exclude_relations.indexOf(relations[i].value) < 0)
			exclude_relations.push(relations[i].value);

	createObject.f_exclude_relations = exclude_relations.join(',');

	models.E_document_template.create(createObject, {req: req}).then(e_document_template => {
		let redirect = '/document_template/show?id=' + e_document_template.id;
		req.session.toastr = [{
			message: 'message.create.success',
			level: "success"
		}];

		const promises = [];

		if (typeof req.body.associationFlag !== 'undefined') {
			redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			promises.push(new Promise((resolve, reject) => {
				models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({
					where: {
						id: req.body.associationFlag
					}
				}).then(association => {
					if (!association) {
						e_document_template.destroy();
						const err = new Error();
						err.message = "Association not found.";
						reject(err);
					}

					const modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
					if (typeof association['add' + modelName] !== 'undefined') {
						association['add' + modelName](e_document_template.id).then(_ => {
							if(globalConfig.env == "tablet"){
								// Write add association to synchro journal
								entity_helper.synchro.writeJournal({
									verb: "associate",
									id: req.body.associationFlag,
									target: "e_document_template",
									entityName: req.body.associationSource,
									func: 'add' + modelName,
									ids: e_document_template.id
								});
							}
							resolve();
						}).catch(err => {
							reject(err);
						});
					} else {
						const obj = {};
						obj[req.body.associationForeignKey] = e_document_template.id;
						association.update(obj, {req: req}).then(resolve).catch(err => {
							reject(err);
						});
					}
				});
			}));
		}

		// We have to find value in req.body that are linked to an hasMany or belongsToMany association
		// because those values are not updated for now
		model_builder.setAssocationManyValues(e_document_template, req.body, createObject, options).then(_ => {
			promises.push(status_helper.setInitialStatus(e_document_template, 'E_document_template', attributes));
			Promise.all(promises).then(_ => {
				component_helper.address.setAddressIfComponentExists(e_document_template, options, req.body).then(_ => {
					res.redirect(redirect);
				});
			}).catch(err => {
				entity_helper.error(err, req, res, '/document_template/create_form', "e_document_template");
			});
		});
	}).catch(err => {
		entity_helper.error(err, req, res, '/document_template/create_form', "e_document_template");
	});
});

router.get('/update_form', block_access.actionAccessMiddleware("document_template", "update"), (req, res) => {
	const id_e_document_template = req.query.id;
	const data = {
		enum_radio: enums_radios.translated("e_document_template", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	entity_helper.optimizedFindOne('E_document_template', id_e_document_template, options).then(e_document_template => {
		if (!e_document_template) {
			data.error = 404;
			return res.render('common/error', data);
		}

		e_document_template.dataValues.enum_radio = data.enum_radio;
		data.e_document_template = e_document_template;
		data.document_template_entities = document_template_helper.get_entities(models);

		const relations = document_template_helper.getRelations(e_document_template.f_entity, {lang: req.session.lang_user});
		const f_exclude_relations = (e_document_template.f_exclude_relations || '').split(',');
		for (let i = 0; i < relations.length; i++) {
			if (f_exclude_relations.indexOf(relations[i].value) < 0)
				relations[i].isSelected = true;
		}
		data.e_document_template.document_template_relations = relations;

		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_document_template, "e_document_template", false).then(_ => {
			// Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
			entity_helper.getLoadOnStartData(req.query.ajax ? e_document_template.dataValues : data, options).then(data => {
				if (req.query.ajax) {
					e_document_template.dataValues = data;
					res.render('e_document_template/update_fields', e_document_template.get({
						plain: true
					}));
				} else
					res.render('e_document_template/update', data);
			}).catch(err => {
				entity_helper.error(err, req, res, "/", "e_document_template");
			})
		}).catch(err => {
			entity_helper.error(err, req, res, "/", "e_document_template");
		})
	}).catch(err => {
		entity_helper.error(err, req, res, "/", "e_document_template");
	})
});

router.post('/update', block_access.actionAccessMiddleware("document_template", "update"), (req, res) => {
	const id_e_document_template = parseInt(req.body.id);
	const updateObject = model_builder.buildForRoute(attributes, options, req.body);

	models.E_document_template.findOne({
		where: {
			id: id_e_document_template
		}
	}).then(e_document_template => {
		if (!e_document_template)
			return res.render('common/error', {error: 404});

		component_helper.address.updateAddressIfComponentExists(e_document_template, options, req.body);

		if(typeof e_document_template.version === 'undefined' || !e_document_template.version)
			updateObject.version = 0;
		updateObject.version++;

		e_document_template.update(updateObject, {req: req}).then(_ => {

			// We have to find value in req.body that are linked to an hasMany or belongsToMany association
			// because those values are not updated for now
			model_builder.setAssocationManyValues(e_document_template, req.body, updateObject, options).then(_ => {

				let redirect = '/document_template/show?id=' + id_e_document_template;
				if (typeof req.body.associationFlag !== 'undefined')
					redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

				req.session.toastr = [{
					message: 'message.update.success',
					level: "success"
				}];

				res.redirect(redirect);
			}).catch(err => {
				entity_helper.error(err, req, res, '/document_template/update_form?id=' + id_e_document_template, "e_document_template");
			});
		}).catch(err => {
			entity_helper.error(err, req, res, '/document_template/update_form?id=' + id_e_document_template, "e_document_template");
		});
	}).catch(err => {
		entity_helper.error(err, req, res, '/document_template/update_form?id=' + id_e_document_template, "e_document_template");
	});
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('document_template', 'read'), (req, res) => {
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
	if (option.structureType != 'hasMany')
		queryOpts.include = {
			model: models[entity_helper.capitalizeFirstLetter(option.target)],
			as: option.as,
			include: {all: true}
		}

	// Fetch tab data
	models.E_document_template.findOne(queryOpts).then(e_document_template => {
		if (!e_document_template)
			return res.status(404).end();

		let dustData = e_document_template[option.as] || null, subentityOptions = [], dustFile, idSubentity, obj;
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

			case 'localfilestorage':
				dustFile = option.target + '/list_fields';
				obj = {[option.target]: dustData};
				dustData = obj;
				dustData.sourceId = id;
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

router.get('/set_status/:id_document_template/:status/:id_new_status', block_access.actionAccessMiddleware("document_template", "read"), block_access.statusGroupAccess, (req, res) => {
	status_helper.setStatus('e_document_template', req.params.id_document_template, req.params.status, req.params.id_new_status, req.session.passport.user.id, req.query.comment).then(_ => {
		res.redirect(req.headers.referer);
	}).catch(err => {
		console.error(err);
		req.session.toastr.push({level: 'error', message: 'component.status.error.action_error'});
		res.redirect(req.headers.referer);
	});
});

router.post('/search', block_access.actionAccessMiddleware('document_template', 'read'), (req, res) => {
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

	// Example custom where in select HTML attributes, please respect " and ':
	// data-customwhere='{"myField": "myValue"}'

	// Notice that customwhere feature do not work with related to many field if the field is a foreignKey !

	// Possibility to add custom where in select2 ajax instanciation
	if (typeof req.body.customwhere !== "undefined") {
		// If customwhere from select HTML attribute, we need to parse to object
		if(typeof req.body.customwhere === "string")
			req.body.customwhere = JSON.parse(req.body.customwhere);
		for (const param in req.body.customwhere) {
			// If the custom where is on a foreign key
			if (param.indexOf("fk_") != -1)
				for (const option in options) {
					// We only add where condition on key that are standard hasMany relation, not belongsToMany association
					if ((options[option].foreignKey == param || options[option].otherKey == param) && options[option].relation != "belongsToMany"){
						// Where on include managment if fk
						if(param.indexOf(".") != -1)
							where.where["$"+param+"$"] = req.body.customwhere[param];
						else
							where.where[param] = req.body.customwhere[param];
					}
				}
			else if (param.indexOf(".") != -1)
				where.where["$"+param+"$"] = req.body.customwhere[param];
			else
				where.where[param] = req.body.customwhere[param];
		}
	}

	where.offset = offset;
	where.limit = limit;

	// If you need to show fields in the select that are in an other associate entity
	// You have to include those entity here
	// where.include = [{model: models.E_myentity, as: "r_myentity"}]

	models.E_document_template.findAndCountAll(where).then(results => {
		results.more = results.count > req.body.page * SELECT_PAGE_SIZE;
		// Format value like date / datetime / etc...
		for (const field in attributes)
			for (let i = 0; i < results.rows.length; i++)
				for (const fieldSelect in results.rows[i])
					if(fieldSelect == field)
						switch(attributes[field].newmipsType) {
							case "date":
								if(results.rows[i][fieldSelect] && results.rows[i][fieldSelect] != "")
									results.rows[i][fieldSelect] = moment(results.rows[i][fieldSelect]).format(req.session.lang_user == "fr-FR" ? "DD/MM/YYYY" : "YYYY-MM-DD")
								break;
							case "datetime":
								if(results.rows[i][fieldSelect] && results.rows[i][fieldSelect] != "")
									results.rows[i][fieldSelect] = moment(results.rows[i][fieldSelect]).format(req.session.lang_user == "fr-FR" ? "DD/MM/YYYY HH:mm" : "YYYY-MM-DD HH:mm")
								break;
							default:
								break;
						}

		res.json(results);
	}).catch(err => {
		console.error(err);
		res.status(500).json(err);
	});
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("document_template", "update"), (req, res) => {
	const alias = req.params.alias;
	const idToRemove = req.body.idRemove;
	const idEntity = req.body.idEntity;
	models.E_document_template.findOne({
		where: {
			id: idEntity
		}
	}).then(e_document_template => {
		if (!e_document_template) {
			const data = {
				error: 404
			};
			return res.render('common/error', data);
		}

		// Get all associations
		e_document_template['remove' + entity_helper.capitalizeFirstLetter(alias)](idToRemove).then(_ => {
			if(globalConfig.env == "tablet"){
				let target = "";
				for (let i = 0; i < options.length; i++)
					if (options[i].as == alias)
					{target = options[i].target; break;}
				entity_helper.synchro.writeJournal({
					verb: "associate",
					id: idEntity,
					target: target,
					entityName: "e_document_template",
					func: 'remove' + entity_helper.capitalizeFirstLetter(alias),
					ids: idToRemove
				});
			}

			res.sendStatus(200).end();
		}).catch(err => {
			entity_helper.error(err, req, res, "/", "e_document_template");
		});
	}).catch(err => {
		entity_helper.error(err, req, res, "/", "e_document_template");
	});
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("document_template", "create"), (req, res) => {
	const alias = req.params.alias;
	const idEntity = req.body.idEntity;
	models.E_document_template.findOne({
		where: {
			id: idEntity
		}
	}).then(e_document_template => {
		if (!e_document_template)
			return res.render('common/error', {error: 404});

		let toAdd;
		if (typeof(toAdd = req.body.ids) === 'undefined') {
			req.session.toastr.push({
				message: 'message.create.failure',
				level: "error"
			});
			return res.redirect('/document_template/show?id=' + idEntity + "#" + alias);
		}

		e_document_template['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(_ => {
			res.redirect('/document_template/show?id=' + idEntity + "#" + alias);
		}).catch(err => {
			entity_helper.error(err, req, res, "/", "e_document_template");
		});
	}).catch(err => {
		entity_helper.error(err, req, res, "/", "e_document_template");
	});
});

router.post('/delete', block_access.actionAccessMiddleware("document_template", "delete"), (req, res) => {
	const id_e_document_template = parseInt(req.body.id);

	models.E_document_template.findOne({
		where: {
			id: id_e_document_template
		}
	}).then(deleteObject => {
		if (!deleteObject)
			return res.render('common/error', {error: 404});

		deleteObject.destroy().then(_ => {
			req.session.toastr = [{
				message: 'message.delete.success',
				level: "success"
			}];

			let redirect = '/document_template/list';
			if (typeof req.body.associationFlag !== 'undefined')
				redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			res.redirect(redirect);
			entity_helper.removeFiles("e_document_template", deleteObject, attributes);
		}).catch(err => {
			entity_helper.error(err, req, res, '/document_template/list', "e_document_template");
		});
	}).catch(err => {
		entity_helper.error(err, req, res, '/document_template/list', "e_document_template");
	});
});

router.post('/generate', block_access.isLoggedIn, (req, res) => {
	(async () => {

		if (!block_access.entityAccess(req.session.passport.user.r_group, req.body.entity.substring(2)))
			throw new Error("403 - Access forbidden");

		const id_entity = req.body.id_entity;
		const id_document = req.body.f_model_document;
		let entity = req.body.entity;

		if (!id_entity || !id_document || !entity)
			throw new Error('Missing req.body values.');

		const e_model_document = await models.E_document_template.findOne({
			where: {
				id: id_document
			}
		});

		if (!e_model_document || !e_model_document.f_file)
			throw new Error('Missing template file.');

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

		const e_entity = await models[entity].findOne({
			where: {
				id: id_entity
			},
			include: includes
		});

		if (!e_entity)
			throw new Error('Target entity not found.');

		const partOfFilepath = e_model_document.f_file.split('-');
		if (partOfFilepath.length == 0)
			throw new Error('Template filename is invalid.');

		let completeFilePath = globalConfig.localstorage + 'e_document_template/' + partOfFilepath[0] + '/' + e_model_document.f_file;
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
		data.g_email = req.session.passport.user.f_email != null ? req.session.passport.user.f_email : '';
		data.g_login = req.session.passport.user.f_login != null ? req.session.passport.user.f_login : '';

		// Get all images ressources
		let allImageRessources = await models.E_image_ressources.findAll();
		for (const img of allImageRessources) {
			try {
				// Remove {} around the value
				img.f_code = img.f_code.substring(1, img.f_code.length -1);
				data[img.f_code] = "data:image/*;base64, " + fs.readFileSync(globalConfig.localstorage + 'e_image_ressources/' + img.f_image.split('-')[0] + '/' + img.f_image).toString('base64');
			} catch (err) {
				console.error("Cannot load image ressource => " + img.f_code);
			}
		}

		const infos = await document_template_helper.generateDoc({
			file: completeFilePath,
			mimeType: mimeType,
			data: data,
			entity: entity,
			lang: req.session.lang_user,
			req: req
		});

		return {
			infos: infos,
			e_entity: e_entity
		};
	})().then(data => {
		const today = moment();
		const filename = (data.e_entity.id || '') +
			'_' + today.format('DDMMYYYY_HHmmss') +
			'_' + today.unix() +
			data.infos.ext;
		res.writeHead(200, {
			"Content-Type": data.infos.contentType,
			"Content-Disposition": "attachment;filename=" + filename
		});
		res.write(data.infos.buffer);
		res.end();
	}).catch(err => {
		console.error(err);
		req.session.toastr = [{
			message: err.message,
			level: "error"
		}];
		res.redirect('/');
	});
});

router.get('/readme/:entity', block_access.actionAccessMiddleware("document_template", "read"), (req, res) => {
	const entity = req.params.entity;
	if (!entity)
		return res.redirect('/');

	res.render('e_document_template/readme', {
		entities: document_template_helper.build_help(entity, req.session.lang_user),
		document_template_entities: document_template_helper.get_entities(models),
		readme: document_template_helper.getReadmeMessages(req.session.lang_user),
		selectedEntity: entity
	});
});

router.get('/help/:type', block_access.actionAccessMiddleware("document_template", "read"), (req, res) => {
	const type = req.params.type;

	if (type === "subEntities") {
		res.status(200).json({
			message: document_template_helper.getSubEntitiesHelp(req.session.lang_user)
		});
	} else
		res.status(404).end();
});

router.get('/entities/:entity/relations', block_access.actionAccessMiddleware("document_template", "read"), (req, res) => {
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

router.get('/global-variables', block_access.actionAccessMiddleware("document_template", "read"), (req, res) => {
	document_template_helper.buildHTMLGlobalVariables(req.session.lang_user).then(out => {
		res.status(200).json({
			HTMLGlobalVariables: out
		});
	}).catch(e => {
		console.error(e);
		res.status(500).end();
	});
});

module.exports = router;