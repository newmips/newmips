const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const filterDataTable = require('../utils/filter_datatable');
const models = require('../models/');
const attributes = require('../models/attributes/CODE_VALUE_CONTACT');
const options = require('../models/options/CODE_VALUE_CONTACT');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../utils/entity_helper');
const component_helper = require('../utils/component_helper');
const globalConfig = require('../config/global');
const fs = require('fs-extra');
const dust = require('dustjs-linkedin');
const SELECT_PAGE_SIZE = 10;
const enums_radios = require('../utils/enum_radio.js');

// Custom component
const mailer_helper = require('../utils/mailer');
const attributesSettings = require('../models/attributes/CODE_VALUE_SETTINGS');
const optionsSettings = require('../models/options/CODE_VALUE_SETTINGS');

router.get('/list', block_access.actionAccessMiddleware("URL_VALUE_CONTACT", "read"), (req, res) => {
	res.render('CODE_VALUE_CONTACT/list');
});

router.post('/datalist', block_access.actionAccessMiddleware("URL_VALUE_CONTACT", "read"), (req, res) => {
	filterDataTable("MODEL_VALUE_CONTACT", req.body).then((rawData) => {
		entity_helper.prepareDatalistResult('CODE_VALUE_CONTACT', rawData, req.session.lang_user).then((preparedData) => {
			res.send(preparedData).end();
		}).catch((err) => {
			console.error(err);
			res.end();
		});
	}).catch((err) => {
		console.error(err);
		res.end();
	});
});

router.get('/show', block_access.actionAccessMiddleware("URL_VALUE_CONTACT", "read"), (req, res) => {
	var id_CODE_VALUE_CONTACT = req.query.id;
	var tab = req.query.tab;
	var data = {
		tab: tab,
		enum_radio: enums_radios.translated("CODE_VALUE_CONTACT", req.session.lang_user, options)
	};

	/* If we arrive from an associated tab, hide the create and the list button */
	if (typeof req.query.hideButton !== 'undefined')
		data.hideButton = req.query.hideButton;

	entity_helper.optimizedFindOne('MODEL_VALUE_CONTACT', id_CODE_VALUE_CONTACT, options).then(function(CODE_VALUE_CONTACT) {
		if (!CODE_VALUE_CONTACT) {
			data.error = 404;
			return res.render('common/error', data);
		}

		/* Update local CODE_VALUE_CONTACT data before show */
		data.CODE_VALUE_CONTACT = CODE_VALUE_CONTACT;
		// Update some data before show, e.g get picture binary
		entity_helper.getPicturesBuffers(CODE_VALUE_CONTACT, "CODE_VALUE_CONTACT").then(function() {
			status_helper.translate(CODE_VALUE_CONTACT, attributes, req.session.lang_user);
			data.componentAddressConfig = component_helper.address.getMapsConfigIfComponentAddressExists("CODE_VALUE_CONTACT");
			// Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
			entity_helper.getLoadOnStartData(data, options).then(function(data) {
				res.render('CODE_VALUE_CONTACT/show', data);
			}).catch(function(err) {
				entity_helper.error(err, req, res, "/", "CODE_VALUE_CONTACT");
			})
		}).catch(function(err) {
			entity_helper.error(err, req, res, "/", "CODE_VALUE_CONTACT");
		});
	}).catch(function(err) {
		entity_helper.error(err, req, res, "/", "CODE_VALUE_CONTACT");
	});
});

router.get('/create_form', block_access.actionAccessMiddleware("URL_VALUE_CONTACT", "create"), (req, res) => {
	var data = {
		enum_radio: enums_radios.translated("CODE_VALUE_CONTACT", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	// Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
	entity_helper.getLoadOnStartData(data, options).then(data => {
		var view = req.query.ajax ? 'CODE_VALUE_CONTACT/create_fields' : 'CODE_VALUE_CONTACT/create';
		res.render(view, data);
	}).catch(err => {
		entity_helper.error(err, req, res, '/URL_VALUE_CONTACT/create_form', "CODE_VALUE_CONTACT");
	})
});

router.post('/create', block_access.actionAccessMiddleware("URL_VALUE_CONTACT", "create"), (req, res) => {

	models.MODEL_VALUE_SETTINGS.findByPk(1).then(function(settings) {
		var from = req.body.f_name + " <" + req.body.f_sender + ">";
		var mailOptions = {
			from: from,
			to: settings.f_form_recipient,
			subject: req.body.f_title,
			html: req.body.f_content
		};
		var mailSettings = {
			transport: {
				host: settings.f_transport_host,
				port: settings.f_port,
				secure: settings.f_secure,
				auth: {
					user: settings.f_user,
					pass: settings.f_pass
				}
			},
			expediteur: settings.f_expediteur,
			administrateur: settings.f_form_recipient
		};
		mailer_helper.sendMailAsyncCustomTransport(mailOptions, mailSettings).then(function(success) {
			var createObject = model_builder.buildForRoute(attributes, options, req.body);
			//createObject = enums.values("CODE_VALUE_CONTACT", createObject, req.body);
			createObject.fk_id_user_user = req.session.passport.user.id;
			createObject.f_recipient = settings.f_form_recipient;
			models.MODEL_VALUE_CONTACT.create(createObject).then((CODE_VALUE_CONTACT) => {
				var redirect = '/URL_VALUE_CONTACT/create_form';
				req.session.toastr = [{
					message: "entity.CODE_VALUE_CONTACT.successSendMail",
					level: "success"
				}];

				if (typeof req.body.associationFlag !== 'undefined') {
					redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
					models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({
						where: {
							id: req.body.associationFlag
						}
					}).then((association) => {
						if (!association) {
							CODE_VALUE_CONTACT.destroy();
							var err = new Error();
							err.message = "Association not found."
							return entity_helper.error(err, req, res, "/");
						}

						var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
						if (typeof association['add' + modelName] !== 'undefined')
							association['add' + modelName](CODE_VALUE_CONTACT.id);
						else {
							var obj = {};
							obj[req.body.associationForeignKey] = CODE_VALUE_CONTACT.id;
							association.update(obj);
						}
					});
				}

				// We have to find value in req.body that are linked to an hasMany or belongsToMany association
				// because those values are not updated for now
				model_builder.setAssocationManyValues(CODE_VALUE_CONTACT, req.body, createObject, options);
				res.redirect(redirect);
			}).catch((err) => {
				entity_helper.error(err, req, res, '/URL_VALUE_CONTACT/create_form');
			});
		}).catch(function(err) {
			entity_helper.error(err, req, res, '/URL_VALUE_CONTACT/create_form');
		});
	});
});

router.post('/delete', block_access.actionAccessMiddleware("URL_VALUE_CONTACT", "delete"), (req, res) => {
	var id_CODE_VALUE_CONTACT = req.body.id;

	models.MODEL_VALUE_CONTACT.findOne({
		where: {
			id: id_CODE_VALUE_CONTACT
		}
	}).then((deleteObject) => {
		models.MODEL_VALUE_CONTACT.destroy({
			where: {
				id: id_CODE_VALUE_CONTACT
			}
		}).then(_ => {
			req.session.toastr = [{
				message: 'message.delete.success',
				level: "success"
			}];

			var redirect = '/URL_VALUE_CONTACT/list';
			if (typeof req.body.associationFlag !== 'undefined')
				redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
			res.redirect(redirect);
			entity_helper.removeFiles("CODE_VALUE_CONTACT", deleteObject, attributes);
		}).catch((err) => {
			entity_helper.error(err, req, res, '/URL_VALUE_CONTACT/list');
		});
	}).catch((err) => {
		entity_helper.error(err, req, res, '/URL_VALUE_CONTACT/list');
	});
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("URL_VALUE_CONTACT", "create"), (req, res) => {
	var alias = req.params.alias;
	var idEntity = req.body.idEntity;
	models.MODEL_VALUE_CONTACT.findOne({
		where: {
			id: idEntity
		}
	}).then((CODE_VALUE_CONTACT) => {
		if (!CODE_VALUE_CONTACT) {
			var data = {
				error: 404
			};
			return res.render('common/error', data);
		}

		var toAdd;
		if (typeof(toAdd = req.body.ids) === 'undefined') {
			req.session.toastr.push({
				message: 'message.create.failure',
				level: "error"
			});
			return res.redirect('/URL_VALUE_CONTACT/show?id=' + idEntity + "#" + alias);
		}

		CODE_VALUE_CONTACT['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(_ => {
			res.redirect('/URL_VALUE_CONTACT/show?id=' + idEntity + "#" + alias);
		});
	}).catch((err) => {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("URL_VALUE_CONTACT", "delete"), (req, res) => {
	var alias = req.params.alias;
	var idToRemove = req.body.idRemove;
	var idEntity = req.body.idEntity;
	models.MODEL_VALUE_CONTACT.findOne({
		where: {
			id: idEntity
		}
	}).then((CODE_VALUE_CONTACT) => {
		if (!CODE_VALUE_CONTACT) {
			var data = {
				error: 404
			};
			return res.render('common/error', data);
		}

		// Get all associations
		CODE_VALUE_CONTACT['get' + entity_helper.capitalizeFirstLetter(alias)]().then((aliasEntities) => {
			// Remove entity from association array
			for (var i = 0; i < aliasEntities.length; i++)
				if (aliasEntities[i].id == idToRemove) {
					aliasEntities.splice(i, 1);
					break;
				}

				// Set back associations without removed entity
			CODE_VALUE_CONTACT['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(_ => {
				res.sendStatus(200).end();
			});
		});
	}).catch((err) => {
		entity_helper.error(err, req, res, "/");
	});
});

router.get('/settings', block_access.actionAccessMiddleware("URL_VALUE_SETTINGS", "create"), (req, res) => {
	const id_CODE_VALUE_SETTINGS = 1;
	const data = {
		menu: "CODE_VALUE_SETTINGS",
		sub_menu: "list_CODE_VALUE_SETTINGS",
		enum_radio: enums_radios.translated("CODE_VALUE_SETTINGS", req.session.lang_user, options)
	};

	if (typeof req.query.associationFlag !== 'undefined') {
		data.associationFlag = req.query.associationFlag;
		data.associationSource = req.query.associationSource;
		data.associationForeignKey = req.query.associationForeignKey;
		data.associationAlias = req.query.associationAlias;
		data.associationUrl = req.query.associationUrl;
	}

	models.MODEL_VALUE_SETTINGS.findOne({
		where: {
			id: id_CODE_VALUE_SETTINGS
		},
		include: [{
			all: true
		}]
	}).then(CODE_VALUE_SETTINGS => {
		if (!CODE_VALUE_SETTINGS) {
			models.MODEL_VALUE_SETTINGS.create({
				id: 1,
				f_transport_host: "",
				f_port: "",
				f_user: "",
				f_pass: "",
				f_form_recipient: ""
			}).then(createdSettings => {
				data.CODE_VALUE_SETTINGS = createdSettings;
				res.render('CODE_VALUE_CONTACT/settings', data);
			});
		} else {
			data.CODE_VALUE_SETTINGS = CODE_VALUE_SETTINGS;
			res.render('CODE_VALUE_CONTACT/settings', data);
		}
	}).catch((err) => {
		entity_helper.error(err, req, res, "/");
	});
});

router.post('/settings', block_access.actionAccessMiddleware("URL_VALUE_SETTINGS", "create"), (req, res) => {
	const id_CODE_VALUE_SETTINGS = parseInt(req.body.id);

	if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version))
		req.body.version = parseInt(req.body.version) + 1;
	else
		req.body.version = 0;

	const updateObject = model_builder.buildForRoute(attributesSettings, optionsSettings, req.body);

	models.MODEL_VALUE_SETTINGS.findOne({
		where: {
			id: id_CODE_VALUE_SETTINGS
		}
	}).then(CODE_VALUE_SETTINGS => {
		if (!CODE_VALUE_SETTINGS) {
			data.error = 404;
			return res.render('common/error', data);
		}

		CODE_VALUE_SETTINGS.update(updateObject, {
			where: {
				id: id_CODE_VALUE_SETTINGS
			}
		}).then(_ => {

			// We have to find value in req.body that are linked to an hasMany or belongsToMany association
			// because those values are not updated for now
			model_builder.setAssocationManyValues(CODE_VALUE_SETTINGS, req.body, updateObject, optionsSettings);

			req.session.toastr = [{
				message: 'message.update.success',
				level: "success"
			}];

			res.redirect('/URL_VALUE_CONTACT/settings?id=' + id_CODE_VALUE_SETTINGS);
		}).catch((err) => {
			entity_helper.error(err, req, res, '/URL_VALUE_CONTACT/settings?id=' + id_CODE_VALUE_SETTINGS);
		});
	}).catch((err) => {
		entity_helper.error(err, req, res, '/URL_VALUE_CONTACT/settings?id=' + id_CODE_VALUE_SETTINGS);
	});
});

module.exports = router;