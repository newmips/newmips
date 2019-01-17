
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

// Sequelize
var models = require('../models/');

// Winston logger
var logger = require('../utils/logger');

router.get('/load/:offset', function(req, res) {
    var offset = parseInt(req.params.offset);

    models.E_notification.findAll({
        include: [{
            model: models.E_user,
            as: 'r_user',
            where: {id: req.session.passport.user.id}
        }],
        subQuery: false,
        order: [["createdAt", "DESC"]],
        limit: 10,
        offset: offset
    }).then(function(notifications) {
        res.json(notifications);
    }).catch(function(err) {
        console.error(err);
        res.sendStatus(500);
    });
});

// Delete notification and redirect to notif's url
router.get('/read/:id', function (req, res) {
    var id_e_notification = parseInt(req.params.id);

    models.E_notification.findOne({where: {id: id_e_notification}}).then(function (notification) {
        var redirect = notification.f_url != "#" ? notification.f_url : req.headers.referer;

        models.E_user.findById(req.session.passport.user.id).then(function(user){
            user.removeR_notification(notification.id).then(function(){
                res.redirect(redirect);
            });
        }).catch(function(err) {
            console.error(err);
            logger.debug("No notification found.");
            return res.render('common/error', {error: 404});
        });
    }).catch(function (err) {
        console.error(err);
        logger.debug("No notification found.");
        return res.render('common/error', {error: 404});
    });
});

// Delete all user notifications
router.get('/deleteAll', function(req, res) {
    models.E_user.findById(req.session.passport.user.id).then(function(user){
        user.setR_notification([]).then(function(){
            res.end();
        });
    }).catch(function (err) {
        console.error(err);
        logger.debug("No notification found.");
        return res.render('common/error', {error: 404});
    });
})

module.exports = router;