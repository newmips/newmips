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
	models.CODE_NAME_EVENT_MODEL.findAll({
		include: [{
			model: models.CODE_NAME_CATEGORY_MODEL,
			as: "r_category"
		}, {
			model: models.E_user,
			as: "r_users"
		}]
	}).then(function(events) {

		const eventsArray = [];
		for(let i=0; i<events.length; i++){
			if(events[i].r_category == null){
				events[i].r_category = {
					f_color: "#CCCCCC"
				};
			}
			const ressourceIds = [];
			for(let j=0; j<events[i].r_users.length; j++){
				ressourceIds.push(events[i].r_users[j].id);
			}
			eventsArray.push({
				eventId: events[i].id,
				title: events[i].f_title,
				start: events[i].f_start_date,
				end: events[i].f_end_date,
				allDay: events[i].f_all_day,
				idCategory: events[i].r_category.id,
				backgroundColor: events[i].r_category.f_color,
				url: "/CODE_NAME_EVENT_URL/show?id="+events[i].id,
				ressourceIds: ressourceIds
			});
		}
		models.CODE_NAME_CATEGORY_MODEL.findAll().then(function(categories){
			models.E_user.findAll().then(function(users){

				data.categories = categories;
				data.events = eventsArray;
				data.users = users;

				// Récupération des toastr en session
				data.toastr = req.session.toastr;
				// Nettoyage de la session
				req.session.toastr = [];
				res.render('CODE_NAME_LOWER/view_agenda', data);
			});
		});
	});
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

	models.CODE_NAME_EVENT_MODEL.create(createObj, {req}).then(function(createdEvent){
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

	models.CODE_NAME_EVENT_MODEL.update(updateObj, {where: {id: req.body.eventId}}, {req}).then(_ => {
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

		e_URL_ROUTE_event.update(updateObject, {req}).then(function(updatedObject) {

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

router.post('/update_event_drop', block_access.actionAccessMiddleware("agenda_event", 'update'), function(req, res) {

	const updateObj = {
		f_start_date: req.body.start,
		f_end_date: req.body.end,
		f_all_day: typeof req.body.allDay === 'boolean' ? req.body.allDay : false
	};

	models.E_agenda_event.findByPk(req.body.eventId).then(function(currentEvent){
		currentEvent.update(updateObj, {where: {id: req.body.eventId}}, {req}).then(_ => {
			let users = [];
			if(req.body.idUsers != null)
				users = req.body.idUsers;
			else if (req.body.idUser != null)
				users.push(req.body.idUser);
			currentEvent.setR_users(users).then(function(){
				res.json({
					success: true
				});
			});
		});
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