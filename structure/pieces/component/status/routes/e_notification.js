var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

// Sequelize
var models = require('../models/');

// Winston logger
var logger = require('../utils/logger');

// Delete notification and redirect to notif's url
router.get('/read/:id', function (req, res) {
    var id_e_notification = parseInt(req.params.id);

    models.E_notification.findOne({where: {id: id_e_notification}}).then(function (notification) {
        var redirect = notification.f_url;

        models.E_user.findById(req.session.passport.user.id).then(function(user){
            user.removeR_notification(notification.id).then(function(){
                res.redirect(redirect);
            });
        });
    }).catch(function (err) {
        console.log(err);
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
        console.log(err);
        logger.debug("No notification found.");
        return res.render('common/error', {error: 404});
    });
})

module.exports = router;