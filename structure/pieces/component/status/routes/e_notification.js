
const express = require('express');
const router = express.Router();
const models = require('../models/');

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
	}).then(notification => {
		if (!notification.r_user)
			return res.render('common/error', {error: 401});

		const redirect = notification.f_url != "#" ? notification.f_url : req.headers.referer;

		models.E_user.findByPk(req.session.passport.user.id).then(user => {
			user.removeR_notification(notification.id).then(_ => {
				res.redirect(redirect);
			});
		}).catch(err => {
			console.error(err);
			return res.render('common/error', {error: 404});
		});
	}).catch(err => {
		console.error(err);
		return res.render('common/error', {error: 404});
	});
});

// Delete all user notifications
router.get('/deleteAll', (req, res) => {
	models.E_user.findByPk(req.session.passport.user.id).then(user => {
		user.setR_notification([]).then(_ =>{
			res.end();
		});
	}).catch(err => {
		console.error(err);
		return res.render('common/error', {error: 404});
	});
})

module.exports = router;