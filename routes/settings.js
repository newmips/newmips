const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const language = require('../services/language');
const extend = require('util')._extend;
const models = require('../models/');
const crypto = require('crypto');
const mail = require('../utils/mailer');

router.get('/', block_access.isLoggedIn, function(req, res) {
	const data = {};
	// Récupération des toastr en session
	data.toastr = req.session.toastr;
	// Nettoyage de la session
	req.session.toastr = [];
	data.toTranslate = req.session.toTranslate || false;
	data.user = req.session.passport.user;
	models.Role.findByPk(data.user.id_role).then(function(userRole){
		data.user.role = userRole;
		res.render('front/settings', data);
	});
});

// Fonction de changement du language
router.post('/change_language', block_access.isLoggedIn, function(req, res) {
	if (typeof req.body !== 'undefined' && typeof req.body.lang !== 'undefined') {
		req.session.lang_user = req.body.lang;
		res.locals = extend(res.locals, language(req.body.lang));
		res.json({
			success: true
		});
	} else
		res.json({
			success: false
		});
});

router.post('/change_theme', block_access.isLoggedIn, function(req, res) {
	req.session.dark_theme = req.body.choice;
	res.json({
		success: true
	});
});

router.post('/activate_translation', block_access.isLoggedIn, function(req, res) {
	if (typeof req.body !== 'undefined' && typeof req.body.activate !== 'undefined') {
		req.session.toTranslate = req.body.activate;
		res.json({
			success: true
		});
	} else
		res.json({
			success: false
		});
});

// Reset password - Generate token, insert into DB, send email
router.post('/reset_password', block_access.isLoggedIn, function(req, res) {
	const login_user = req.body.login;
	const given_mail = req.body.mail;

	function resetPasswordProcess(idUser, email) {
		// Create unique token and insert into user
		const token = crypto.randomBytes(64).toString('hex');

		models.User.update({
			token_password_reset: token
		}, {
			where: {
				id: idUser
			}
		}).then(_ => {
			// Send email with generated token
			mail.sendMailResetPassword({
				mail_user: email,
				token: token
			}).then(_ => {
				req.session.toastr = [{
					message: "login.emailResetSent",
					level: "success"
				}];
				res.send(true);
			}).catch(err => {
				// Remove inserted value in user to avoid zombies
				models.User.update({
					token_password_reset: null
				}, {
					where: {
						id: idUser
					}
				}).then(_ => {
					req.session.toastr = [{
						message: err.message,
						level: "error"
					}];
					res.status(500).send(false);
				});
			});
		}).catch(function(err){
			req.session.toastr = [{
				message: err.message,
				level: "error"
			}];
			res.status(500).send(false);
		});
	}

	models.User.findOne({
		where: {
			login: login_user,
			email: given_mail
		}
	}).then(user => {
		if(user)
			resetPasswordProcess(user.id, user.email);
		else {
			req.session.toastr = [{
				message: "login.first_connection.userNotExist",
				level: "error"
			}];
			res.status(500).send(false);
		}
	}).catch(err => {
		req.session.toastr = [{
			message: err.message,
			level: "error"
		}];
		res.status(500).send(false);
	});
});

module.exports = router;