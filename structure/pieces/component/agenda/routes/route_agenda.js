var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

// Sequelize
var models = require('../models/');

var model_builder = require('../utils/model_builder');
var moment = require("moment");

var attributes = require('../models/attributes/e_URL_ROUTE_event');
var options = require('../models/options/e_URL_ROUTE_event');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');

// Winston logger
var logger = require('../utils/logger');

function error500(err, res) {
    console.error(err);
    var data = {};
    data.error = 500;
    res.render('common/error', data);
}

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

router.get('/', block_access.isLoggedIn, function(req, res) {
    var data = {};
    models.CODE_NAME_EVENT_MODEL.findAll({
        include: [{
            model: models.CODE_NAME_CATEGORY_MODEL,
            as: "r_category"
        }, {
            model: models.E_user,
            as: "r_users"
        }]
    }).then(function(events) {

        var eventsArray = [];
        for(var i=0; i<events.length; i++){
            if(events[i].r_category == null){
                events[i].r_category = {
                    f_color: "#CCCCCC"
                };
            }
            var ressourceIds = [];
            for(var j=0; j<events[i].r_users.length; j++){
                ressourceIds.push(events[i].r_users[j].id);
            }
            eventsArray.push({
                eventId: events[i].id,
                title: events[i].f_title,
                start: events[i].f_start_date,
                end: events[i].f_end_date,
                allDay: events[i].f_all_day,
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

    var createObj = {
        version: 0,
        f_title: req.body.title,
        f_start_date: req.body.start,
        f_end_date: req.body.end,
        f_all_day: req.body.allday,
        fk_id_CODE_NAME_CATEGORY_URL_category: req.body.idCategory
    };

    models.CODE_NAME_EVENT_MODEL.create(createObj).then(function(createdEvent){
        var users = [];
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

    var updateObj = {
        f_start_date: req.body.start,
        f_end_date: req.body.end
    };

    models.CODE_NAME_EVENT_MODEL.update(updateObj, {where: {id: req.body.eventId}}).then(function(updatedEvent){
        res.json({
            success: true
        });
    });
});

router.post('/update_event', block_access.actionAccessMiddleware("URL_ROUTE_event", "update"), function (req, res) {
    var id_e_URL_ROUTE_event = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.CODE_NAME_EVENT_MODEL.findOne({where: {id: id_e_URL_ROUTE_event}}).then(function (e_URL_ROUTE_event) {
        if (!e_URL_ROUTE_event) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_URL_ROUTE_event.update(updateObject).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_URL_ROUTE_event, req.body, updateObject, options).then(function () {
                res.send(true);
            });
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/URL_ROUTE_event/update_form?id=' + id_e_URL_ROUTE_event);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/URL_ROUTE_event/update_form?id=' + id_e_URL_ROUTE_event);
    });
});

router.post('/update_event_drop', block_access.actionAccessMiddleware("URL_ROUTE_event", 'update'), function(req, res) {

    var updateObj = {
        f_start_date: req.body.start,
        f_end_date: req.body.end
    };

    models.CODE_NAME_EVENT_MODEL.findById(req.body.eventId).then(function(currentEvent){
        currentEvent.update(updateObj, {where: {id: req.body.eventId}}).then(function(updateEvent){
            var users = [];
            if(req.body.idUsers != null){
                users = req.body.idUsers;
            } else if (req.body.idUser != null){
                users.push(req.body.idUser);
            }
            currentEvent.setR_users(users).then(function(){
                res.json({
                    success: true
                });
            });
        });
    });
});

router.post('/delete_event', block_access.actionAccessMiddleware("URL_ROUTE_event", "delete"), function (req, res) {
    var id_e_URL_ROUTE_event = parseInt(req.body.id);

    models.CODE_NAME_EVENT_MODEL.findOne({where: {id: id_e_URL_ROUTE_event}}).then(function (deleteObject) {
        models.CODE_NAME_EVENT_MODEL.destroy({
            where: {
                id: id_e_URL_ROUTE_event
            }
        }).then(function () {
            res.send(true);
            entity_helper.remove_files("e_URL_ROUTE_event", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/URL_ROUTE_event/list');
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/URL_ROUTE_event/list');
    });
});

module.exports = router;