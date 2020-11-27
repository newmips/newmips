const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const filterDataTable = require('../utils/filter_datatable');
const models = require('../models/');
const attributes = require('../models/attributes/e_media');
const options = require('../models/options/e_media');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../utils/entity_helper');
const status_helper = require('../utils/status_helper');
const fs = require('fs-extra');
const language = require('../services/language');
const icon_list = require('../config/icon_list');
const enums_radios = require('../utils/enum_radio.js');
const moment = require('moment');

const TARGET_ENTITIES = [];
fs.readdirSync(__dirname+'/../models/attributes/').filter(file => file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file.substring(0, 2) == 'e_')
	.forEach(file => {
		TARGET_ENTITIES.push({
			codename: file.substring(0, file.length-5),
			tradKey: 'entity.'+file.substring(0, file.length-5)+'.label_entity'
		});
	});

function sortTargetEntities(lang_user) {
	// Copy global object to add traducted property and sort it
	const targetEntitiesCpy = [];
	for (const target of TARGET_ENTITIES) {
		targetEntitiesCpy.push({
			codename: target.codename,
			trad: language(lang_user).__(target.tradKey)
		});
	}
	targetEntitiesCpy.sort((a, b) => {
		if (a.trad.toLowerCase() > b.trad.toLowerCase()) return 1;
		if (a.trad.toLowerCase() < b.trad.toLowerCase()) return -1;
		return 0;
	});
	return targetEntitiesCpy;
}

router.get('/entity_tree/:entity', block_access.actionAccessMiddleware("media", "read"), function(req, res) {
	const entityTree = status_helper.entityFieldTree(req.params.entity);
	const entityTreeSelect = status_helper.entityFieldForSelect(entityTree, req.session.lang_user);
	res.json(entityTreeSelect).end();
});

router.get('/entity_full_tree/:entity', block_access.actionAccessMiddleware("media", "read"), function(req, res) {
	const entityTree = status_helper.fullEntityFieldTree(req.params.entity);
	const entityTreeSelect = status_helper.entityFieldForSelect(entityTree, req.session.lang_user);
	res.json(entityTreeSelect).end();
});

router.get('/user_tree/:entity', block_access.actionAccessMiddleware("media", "read"), function(req, res) {
	const entityTree = status_helper.fullEntityFieldTree(req.params.entity);
	const userTree = status_helper.getUserTargetList(entityTree, req.session.lang_user);
	res.json(userTree).end();
});

router.get('/list', block_access.actionAccessMiddleware("media", "read"), function (req, res) {
	const data = {
		"menu": "e_media",
		"sub_menu": "list_e_media"
	};

	data.toastr = req.session.toastr;
	req.session.toastr = [];

	res.render('e_media/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("media", "read"), function (req, res) {
	filterDataTable("E_media", req.body).then(function (rawData) {
		entity_helper.prepareDatalistResult('e_media', rawData, req.session.lang_user).then(function(preparedData) {
			// Translate targeted entity name
			preparedData.data.forEach(row => row.f_target_entity = language(req.session.lang_user).__(`entity.${row.f_target_entity}.label_entity`));
			res.send(preparedData).end();
		});
	}).catch(function (err) {
		console.error(err);
		res.end();
	});
});

router.get('/show', block_access.actionAccessMiddleware("media", "read"), function (req, res) {
	const id_e_media = req.query.id;
	const tab = req.query.tab;
	const data = {
		menu: "e_media",
		sub_menu: "list_e_media",
		tab: tab,
		enum_radio: enums_radios.translated("e_media", req.session.lang_user, options)
	};

	/* If we arrive from an associated tab, hide the create and the list button */
	if (typeof req.query.hideButton !== 'undefined')
		data.hideButton = req.query.hideButton;

	/* Looking for two level of include to get all associated data in show tab list */
	const include = model_builder.getTwoLevelIncludeAll(models, options);

	models.E_media.findOne({where: {id: id_e_media}, include: include}).then(function (e_media) {
		if (!e_media)
			return res.render('common/error', {error: 404});

		/* Modify e_media value with the translated enum value in show result */
		for (const item in data.enum)
			for (const field in e_media.dataValues)
				if (item == field)
					for (const value in data.enum[item])
						if (data.enum[item][value].value == e_media[field])
							e_media[field] = data.enum[item][value].translation;

		e_media.f_target_entity = language(req.session.lang_user).__(`entity.${e_media.f_target_entity}.label_entity`)

		/* Update local e_media data before show */
		data.e_media = e_media;
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(e_media, "e_media").then(function() {
			status_helper.translate(e_media, attributes, req.session.lang_user);
			res.render('e_media/show', data);
		}).catch(function (err) {
			entity_helper.error(err, req, res, "/");
		});

	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.get('/create_form', block_access.actionAccessMiddleware("media", "create"), function (req, res) {
	const data = {
		menu: "e_media",
		sub_menu: "create_e_media",
		enum_radio: enums_radios.translated("e_media", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	data.target_entities = sortTargetEntities(req.session.lang_user);
	data.icon_list = icon_list;
	res.render('e_media/create', data);
});

router.post('/create', block_access.actionAccessMiddleware("media", "create"), function (req, res) {

	const createObject = model_builder.buildForRoute(attributes, options, req.body);

	models.E_media.create(createObject, {user: req.user}).then(function (e_media) {
		let redirect = '/media/show?id='+e_media.id;
		req.session.toastr = [{
			message: 'message.create.success',
			level: "success"
		}];

		if (typeof req.body.associationFlag !== 'undefined') {
			redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
				if (!association) {
					e_media.destroy();
					const err = new Error();
					err.message = "Association not found."
					return entity_helper.error(err, req, res, "/");
				}

				const modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
				if (typeof association['add' + modelName] !== 'undefined')
					association['add' + modelName](e_media.id);
				else {
					const obj = {};
					obj[req.body.associationForeignKey] = e_media.id;
					association.update(obj, {user: req.user});
				}
			});
		}

		// We have to find value in req.body that are linked to an hasMany or belongsToMany association
		// because those values are not updated for now
		model_builder.setAssocationManyValues(e_media, req.body, createObject, options);

		res.redirect(redirect);
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/media/create_form');
	});
});

router.get('/update_form', block_access.actionAccessMiddleware("media", 'update'), function (req, res) {
	const id_e_media = req.query.id;
	const data = {
		menu: "e_media",
		sub_menu: "list_e_media",
		enum_radio: enums_radios.translated("e_media", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	models.E_media.findOne({where: {id: id_e_media}, include: [{all: true}]}).then(function (e_media) {
		if (!e_media) {
			data.error = 404;
			return res.render('common/error', data);
		}

		data.e_media = e_media;

		data.target_entities = sortTargetEntities(req.session.lang_user);
		data.icon_list = icon_list;
		res.render('e_media/update', data);
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/update', block_access.actionAccessMiddleware("media", 'update'), function (req, res) {
	const id_e_media = parseInt(req.body.id);
	const updateObject = model_builder.buildForRoute(attributes, options, req.body);

	models.E_media.findOne({where: {id: id_e_media}}).then(function (e_media) {
		if (!e_media)
			return res.render('common/error', {error: 404});

		if(typeof e_media.version === 'undefined' || !e_media.version)
			updateObject.version = 0;
		updateObject.version++;

		e_media.update(updateObject, {user: req.user}).then(function () {

			// We have to find value in req.body that are linked to an hasMany or belongsToMany association
			// because those values are not updated for now
			model_builder.setAssocationManyValues(e_media, req.body, updateObject, options);

			let redirect = '/media/show?id=' + id_e_media;
			if (typeof req.body.associationFlag !== 'undefined')
				redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

			req.session.toastr = [{
				message: 'message.update.success',
				level: "success"
			}];

			res.redirect(redirect);
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/media/update_form?id=' + id_e_media);
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/media/update_form?id=' + id_e_media);
	});
});

router.get('/set_status/:id_media/:status/:id_new_status', block_access.actionAccessMiddleware("media", "update"), function(req, res) {
	status_helper.setStatus('e_media', req.params.id_media, req.params.status, req.params.id_new_status, req.user, req.query.comment).then(()=> {
		res.redirect('/media/show?id=' + req.params.id_media);
	}).catch(err => {
		console.error(err);
		req.session.toastr.push({level: 'error', message: 'component.status.error.action_error'});
		res.redirect(req.headers.referer);
	});
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("media", "delete"), function (req, res) {
	const alias = req.params.alias;
	const idToRemove = req.body.idRemove;
	const idEntity = req.body.idEntity;
	models.E_media.findOne({where: {id: idEntity}}).then(function (e_media) {
		if (!e_media) {
			const data = {error: 404};
			return res.render('common/error', data);
		}

		// Get all associations
		e_media['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
			// Remove entity from association array
			for (let i = 0; i < aliasEntities.length; i++)
				if (aliasEntities[i].id == idToRemove) {
					aliasEntities.splice(i, 1);
					break;
				}

			// Set back associations without removed entity
			e_media['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
				res.sendStatus(200).end();
			});
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

const SELECT_PAGE_SIZE = 10
router.post('/search', block_access.actionAccessMiddleware('media', 'read'), function (req, res) {
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

	models.E_media.findAndCountAll(where).then(function (results) {
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
								results.rows[i][field] = enums_radios.translateFieldValue('e_media', field, results.rows[i][field], req.session.lang_user)
								break;
							default:
								break;
						}
		res.json(results);
	}).catch(e => {
		console.error(e);
		res.status(500).json(e);
	});
});


router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("media", "create"), function (req, res) {
	const alias = req.params.alias;
	const idEntity = req.body.idEntity;
	models.E_media.findOne({where: {id: idEntity}}).then(function (e_media) {
		if (!e_media)
			return res.render('common/error', {error: 404});

		let toAdd;
		if (typeof (toAdd = req.body.ids) === 'undefined') {
			req.session.toastr.push({
				message: 'message.create.failure',
				level: "error"
			});
			return res.redirect('/media/show?id=' + idEntity + "#" + alias);
		}

		e_media['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
			res.redirect('/media/show?id=' + idEntity + "#" + alias);
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/delete', block_access.actionAccessMiddleware("media", "delete"), function (req, res) {
	const id_e_media = parseInt(req.body.id);

	models.E_media.findOne({where: {id: id_e_media}}).then(function (deleteObject) {
		models.E_media.destroy({
			where: {
				id: id_e_media
			}
		}).then(function () {
			req.session.toastr = [{
				message: 'message.delete.success',
				level: "success"
			}];

			let redirect = '/media/list';
			if (typeof req.body.associationFlag !== 'undefined')
				redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			res.redirect(redirect);
			entity_helper.removeFiles("e_media", deleteObject, attributes);
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/media/list');
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/media/list');
	});
});

module.exports = router;