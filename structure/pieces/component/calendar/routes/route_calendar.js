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
            as: "r_CODE_NAME_EVENT_LOWER_category"
        }]
    }).then(function(events) {

        var eventsArray = [];
        for(var i=0; i<events.length; i++){
            if(events[i].r_CODE_NAME_EVENT_LOWER_category == null){
                events[i].r_CODE_NAME_EVENT_LOWER_category = {
                    f_color: "#CCCCCC"
                };
            }
            eventsArray.push({
                title: events[i].f_title,
                start: moment(events[i].f_datedebut).format("YYYY-MM-DD HH:mm:ss"),
                end: moment(events[i].f_datefin).format("YYYY-MM-DD HH:mm:ss"),
                allDay: events[i].f_allday,
                backgroundColor: events[i].r_CODE_NAME_EVENT_LOWER_category.f_color,
                url: "/CODE_NAME_EVENT_URL/show?id="+events[i].id
            });
        }
        models.CODE_NAME_CATEGORY_MODEL.findAll().then(function(categories){

            data.categories = categories;
            data.events = eventsArray;

            // Récupération des toastr en session
            data.toastr = req.session.toastr;
            // Nettoyage de la session
            req.session.toastr = [];
            res.render('CODE_NAME_LOWER/view_calendar', data);
        });
    });
});

module.exports = router;