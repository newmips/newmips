
const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');

// Sequelize
const models = require('../models/');

// Winston logger
const logger = require('../utils/logger');

router.get('/load/:offset', function(req, res) {
	const offset = parseInt(req.params.offset);

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
	const id_e_notification = parseInt(req.params.id);

	// Check if user owns notification
	models.E_notification.findOne({
		where: {id: id_e_notification},
		include: {
			model: models.E_user,
			as: 'r_user',
			where: {id: req.session.passport.user.id}
		}
	}).then(function (notification) {
		if (!notification.r_user) {
			logger.debug("User id = "+req.session.passport.user.id+" not allowed to read notification "+id_e_notification+".");
			return res.render('common/error', {error: 401});
		}

		const redirect = notification.f_url != "#" ? notification.f_url : req.headers.referer;

		models.E_user.findByPk(req.session.passport.user.id).then(function(user){
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
	models.E_user.findByPk(req.session.passport.user.id).then(function(user){
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