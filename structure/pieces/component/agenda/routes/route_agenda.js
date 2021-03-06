const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const models = require('../models/');
const model_builder = require('../utils/model_builder');
const attributes = require('../models/attributes/e_URL_ROUTE_event');
const options = require('../models/options/e_URL_ROUTE_event');
const entity_helper = require('../utils/entity_helper');

router.get('/', block_access.isLoggedIn, function(req, res) {
	const data = {};

	models.CODE_NAME_CATEGORY_MODEL.findAll().then(categories => {
		models.E_user.findAll().then(users => {

			data.categories = categories;
			data.events = [];
			data.users = users;

			res.render('CODE_NAME_LOWER/view_agenda', data);
		});
	});
});

router.post('/get_event', block_access.actionAccessMiddleware("URL_ROUTE_event", "read"), function(req, res) {
	(async () => {

		const events = await models.CODE_NAME_EVENT_MODEL.findAll({
			where: {
				f_start_date: {
					[models.$between]: [req.body.start, req.body.end]
				}
			},
			include: [{
				model: models.CODE_NAME_CATEGORY_MODEL,
				as: "r_category"
			}, {
				model: models.E_user,
				as: "r_users"
			}]
		});

		const eventsArray = [];
		for (let i = 0; i < events.length; i++) {
			if (events[i].r_category == null) {
				events[i].r_category = {
					f_color: "#CCCCCC"
				};
			}
			const resourceIds = [];
			for (let j = 0; j < events[i].r_users.length; j++) {
				resourceIds.push(events[i].r_users[j].id);
			}
			eventsArray.push({
				eventId: events[i].id,
				title: events[i].f_title,
				start: events[i].f_start_date,
				end: events[i].f_end_date,
				allDay: events[i].f_all_day,
				idCategory: events[i].r_category.id,
				backgroundColor: events[i].r_category.f_color,
				// url: "/CODE_NAME_EVENT_URL/show?id=" + events[i].id, // Uncomment if you want to be redirected on event click
				resourceIds: resourceIds
			});
		}

		return eventsArray;
	})().then(eventsArray => {
		res.status(200).send(eventsArray)
	}).catch(err => {
		console.error(err);
		res.status(500).send(err)
	})
});

router.post('/add_event', block_access.actionAccessMiddleware("URL_ROUTE_event", "create"), function(req, res) {

	if(req.body.idCategory == "" || req.body.idCategory == 0)
		req.body.idCategory = null;

	const createObj = {
		version: 0,
		f_title: req.body.title,
		f_start_date: req.body.start,
		f_end_date: req.body.end,
		f_all_day: req.body.allday,
		fk_id_CODE_NAME_CATEGORY_URL_category: req.body.idCategory
	};

	models.CODE_NAME_EVENT_MODEL.create(createObj, {user: req.user}).then(function(createdEvent){
		const users = [];
		if(req.body.idUser != null)
			users.push(req.body.idUser);
		createdEvent.setR_users(users).then(function(){
			res.json({
				success: true,
				idEvent: createdEvent.id
			});
		});
	});
});

router.post('/resize_event', block_access.actionAccessMiddleware("URL_ROUTE_event", "create"), function(req, res) {

	const updateObj = {
		f_start_date: req.body.start,
		f_end_date: req.body.end
	};

	models.CODE_NAME_EVENT_MODEL.update(updateObj, {where: {id: req.body.eventId}}, {user: req.user}).then(_ => {
		res.json({
			success: true
		});
	});
});

router.post('/update_event', block_access.actionAccessMiddleware("URL_ROUTE_event", "update"), function(req, res) {
	const id_e_URL_ROUTE_event = parseInt(req.body.id);
	const updateObject = model_builder.buildForRoute(attributes, options, req.body);

	models.CODE_NAME_EVENT_MODEL.findOne({
		where: {
			id: id_e_URL_ROUTE_event
		}
	}).then(function(e_URL_ROUTE_event) {
		if (!e_URL_ROUTE_event)
			return res.render('common/error', {erro: 404});

		if(typeof e_URL_ROUTE_event.version === 'undefined' || !e_URL_ROUTE_event.version)
			updateObject.version = 0;
		updateObject.version++;

		e_URL_ROUTE_event.update(updateObject, {user: req.user}).then(function(updatedObject) {

			// We have to find value in req.body that are linked to an hasMany or belongsToMany association
			// because those values are not updated for now
			model_builder.setAssocationManyValues(e_URL_ROUTE_event, req.body, updateObject, options).then(function() {
				res.send(updatedObject);
			});
		}).catch(function(err) {
			entity_helper.error(err, req, res, '/URL_ROUTE_event/update_form?id=' + id_e_URL_ROUTE_event);
		});
	}).catch(function(err) {
		entity_helper.error(err, req, res, '/URL_ROUTE_event/update_form?id=' + id_e_URL_ROUTE_event);
	});
});

router.post('/update_event_drop', block_access.actionAccessMiddleware("URL_ROUTE_event", 'update'), function(req, res) {
	(async () => {
		const updateObj = {
			f_start_date: req.body.start,
			f_end_date: req.body.end,
			f_all_day: typeof req.body.allDay === 'boolean' ? req.body.allDay : false
		};

		const currentEvent = await models.CODE_NAME_EVENT_MODEL.findByPk(req.body.eventId);
		await currentEvent.update(updateObj, {where: {id: req.body.eventId}}, {user: req.user});

		let users = [];
		if(req.body.idUsers != null)
			users = req.body.idUsers;
		else if (req.body.idUser != null)
			users.push(req.body.idUser);
		await currentEvent.setR_users(users)
	})().then(_ => {
		res.status(200).send(true);
	}).catch(err => {
		console.error(err);
		res.status(500).send(err);
	});
});

router.post('/delete_event', block_access.actionAccessMiddleware("URL_ROUTE_event", "delete"), function (req, res) {
	const id_e_URL_ROUTE_event = parseInt(req.body.id);

	models.CODE_NAME_EVENT_MODEL.findOne({where: {id: id_e_URL_ROUTE_event}}).then(function (deleteObject) {
		models.CODE_NAME_EVENT_MODEL.destroy({
			where: {
				id: id_e_URL_ROUTE_event
			}
		}).then(function () {
			res.send(true);
			entity_helper.removeFiles("e_URL_ROUTE_event", deleteObject, attributes);
		}).catch(function (err) {
			entity_helper.error(err, req, res, '/URL_ROUTE_event/list');
		});
	}).catch(function (err) {
		entity_helper.error(err, req, res, '/URL_ROUTE_event/list');
	});
});

module.exports = router;