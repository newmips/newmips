var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

// Sequelize
var models = require('../models/');

var moment = require("moment");

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

router.post('/add_event', block_access.actionAccessMiddleware("URL_ROUTE", "write"), function(req, res) {

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

router.post('/resize_event', block_access.actionAccessMiddleware("URL_ROUTE", "write"), function(req, res) {

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

router.post('/update_event', block_access.actionAccessMiddleware("URL_ROUTE", "write"), function(req, res) {

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

module.exports = router;