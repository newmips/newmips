const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const auth = require('../utils/authStrategies');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mail = require('../utils/mailer');
const request = require('request');

// Sequelize
const models = require('../models/');

// Gitlab API
const gitlab = require('../services/gitlab_api');
const gitlabConf = require('../config/gitlab.js');

router.get('/', block_access.loginAccess, function(req, res) {
	res.redirect('/login');
});

// Waiting room for deploy instruction
router.get('/waiting', function(req, res) {
	res.render('front/waiting_room', {
		redirect: req.query.redirect
	});
});

router.post('/waiting', function(req, res) {
	const callOptions = {
		url: req.body.redirect,
		strictSSL: false,
		rejectUnauthorized: false
	}
	request.get(callOptions, (error, response) => {
		if(error)
			console.log(error)

		// Stack is not ready
		if (error || response && response.statusCode !== 200 && response.statusCode !== 302)
			return res.sendStatus(503).end();

		// Stack ready, container ready, lets go
		return res.sendStatus(200);
	});
});

router.get('/login', block_access.loginAccess, function(req, res) {
	res.render('login/login');
});

router.post('/login', auth.isLoggedIn, function(req, res) {

	if (req.body.remember_me)
		req.session.cookie.maxAge = 168 * 3600000; // 1 week
	else
		req.session.cookie.expires = false; // Logout on browser exit

	const email_user = req.session.passport.user.email;

	req.session.isgenerator = true; // Needed to differentiate from generated app session.

	// Get gitlab instance
	if(gitlabConf.doGit)
		gitlab.getUser(email_user).then(gitlabUser => {

			if (gitlabUser){
				req.session.gitlab = {
					user: gitlabUser
				};
				return res.redirect('/default/home');
			}

			// Generate gitlab user if not found
			const usernameGitlab = email_user.replace(/@/g, "").replace(/\./g, "").trim();
			gitlabUser = gitlab.createUser({
				email: email_user,
				password: req.body.password_user,
				username: usernameGitlab,
				name: usernameGitlab,
				admin: false,
				skip_confirmation: true
			}).then(gitlabUser => {
				req.session.gitlab = {
					user: gitlabUser
				};
				res.redirect('/default/home');
			})
		}).catch(err => {
			console.error(err);
			req.session.toastr = [{
				message: "An error occured while getting your gitlab account.",
				level: "error"
			}];
			res.redirect('/logout');
		})
	else
		res.redirect('/default/home');
});

router.get('/first_connection', block_access.loginAccess, function(req, res) {
	const params = {
		login: "",
		email: ""
	};

	if(typeof req.query.login !== "undefined")
		params.login = req.query.login;

	if(typeof req.query.email !== "undefined")
		params.email = req.query.email;

	res.render('login/first_connection', params);
});

router.post('/first_connection', block_access.loginAccess, function(req, res) {
	const login_user = req.body.login_user.toLowerCase();
	const email_user = req.body.email_user;
	const usernameGitlab = email_user.replace(/@/g, "").replace(/\./g, "").trim();

	(async () => {

		if(req.body.password_user != req.body.password_user2 || req.body.password_user.length < 8)
			throw new Error("login.first_connection.passwordNotMatch");

		const password = bcrypt.hashSync(req.body.password_user2, null, null);

		const user = await models.User.findOne({
			where: {
				login: login_user,
				[models.$or]: [{password: ""}, {password: null}],
				enabled: false
			}
		})

		if(!user)
			throw new Error("login.first_connection.userNotExist");

		if(user.password && user.password != "")
			throw new Error("login.first_connection.hasAlreadyPassword");

		if(gitlabConf.doGit){
			let gitlabUser = await gitlab.getUser(email_user);

			if (!gitlabUser)
				gitlabUser = await gitlab.createUser({
					email: email_user,
					password: req.body.password_user2,
					username: usernameGitlab,
					name: usernameGitlab,
					admin: false,
					skip_confirmation: true
				})

			req.session.gitlab = {
				user: gitlabUser
			};
		}

		await user.update({
			password: password,
			email: email_user,
			enabled: 1
		})

		return user;

	})().then(connectedUser => {
		// Autologin after first connection form done
		req.login(connectedUser, err => {
			if (err)
				throw err;

			req.session.showytpopup = true;
			req.session.isgenerator = true; // Needed to differentiate from generated app session.
			res.redirect('/default/home');
		});
	}).catch(err => {
		console.error(err);
		req.session.toastr = [{
			message: err.message,
			level: "error"
		}];
		res.redirect('/first_connection?login='+login_user+'&email='+email_user);
	});
});

router.get('/reset_password', block_access.loginAccess, function(req, res) {
	res.render('login/reset_password');
});

// Reset password - Generate token, insert into DB, send email
router.post('/reset_password', block_access.loginAccess, function(req, res) {
	// Check if user with login + email exist in DB
	models.User.findOne({
		where: {
			login: req.body.login.toLowerCase(),
			email: req.body.mail
		}
	}).then(user => {
		if(!user){
			req.session.toastr = [{
				message: "login.first_connection.userNotExist",
				level: "error"
			}];
			return res.render('login/reset_password');
		}

		if(!user.password && !user.enabled){
			req.session.toastr = [{
				message: "login.first_connection.userNotActivate",
				level: "error"
			}];
			return res.redirect('/first_connection');
		}

		// Create unique token and insert into user
		const token = crypto.randomBytes(64).toString('hex');

		models.User.update({
			token_password_reset: token
		}, {
			where: {
				id: user.id
			}
		}).then(function(){
			// Send email with generated token
			mail.sendMail_Reset_Password({
				mail_user: user.email,
				token: token
			}).then(_ => {
				req.session.toastr = [{
					message: "login.emailResetSent",
					level: "success"
				}];
				res.redirect('/');
			}).catch(err => {
				// Remove inserted value in user to avoid zombies
				models.User.update({
					token_password_reset: null
				}, {
					where: {
						id: user.id
					}
				}).then(_ => {
					req.session.toastr = [{
						message: err.message,
						level: "error"
					}];
					res.render('login/reset_password');
				});
			});
		}).catch(function(err){
			req.session.toastr = [{
				message: err.message,
				level: "error"
			}];
			res.render('login/reset_password');
		});
	}).catch(function(err){
		req.session.toastr = [{
			message: err.message,
			level: "error"
		}];
		res.render('login/reset_password');
	})
})

router.get('/reset_password_form/:token', block_access.loginAccess, function(req, res) {

	models.User.findOne({
		where: {
			token_password_reset: req.params.token
		}
	}).then(user => {
		if (!user) {
			req.session.toastr = [{
				message: "login.tokenNotFound",
				level: "error"
			}];
			res.render('login/reset_password');
		} else
			models.User.update({
				password: null
			}, {
				where: {
					id: user.id
				}
			}).then(_ => {
				res.render('login/reset_password_form', {
					resetUser: user
				});
			});
	}).catch(err => {
		req.session.toastr = [{
			message: err.message,
			level: "error"
		}];
		res.render('login/reset_password');
	});
});

router.post('/reset_password_form', block_access.loginAccess, function(req, res) {

	const login_user = req.body.login_user.toLowerCase();
	const email_user = req.body.email_user;

	(async () => {
		const user = await models.User.findOne({
			where: {
				login: login_user,
				email: email_user,
				[models.$or]: [{password: ""}, {password: null}]
			}
		});

		if(req.body.password_user != req.body.password_user2 || req.body.password_user.length < 8)
			throw {
				message: "login.first_connection.passwordNotMatch",
				redirect: '/reset_password_form/'+user.token_password_reset
			}

		const password = bcrypt.hashSync(req.body.password_user2, null, null);

		if(!user)
			throw {
				message: "login.first_connection.userNotExist",
				redirect: '/login'
			}

		if(user.password && user.password != '')
			throw {
				message: "login.first_connection.hasAlreadyPassword",
				redirect: '/login'
			}

		await models.User.update({
			password: password,
			token_password_reset: null
		}, {
			where: {
				id: user.id
			}
		});

		let gitlabUser = null;
		// Update Gitlab password
		if(gitlabConf.doGit){
			gitlabUser = await gitlab.getUser(email_user);

			if(!gitlabUser)
				console.warn('Cannot update gitlab user password, user not found.');
			else
				await gitlab.updateUser(gitlabUser, {
					password: req.body.password_user2,
					skip_reconfirmation: true
				});
		}

		// Autologin after first connection form done
		const connectedUser = await models.User.findOne({
			where: {
				id: user.id
			}
		});

		return {connectedUser, gitlabUser};

	})().then(infos => {

		req.login(infos.connectedUser, err => {
			if (err) {
				console.error(err);
				req.session.toastr = [{
					message: err.message,
					level: "error"
				}];
				res.redirect('/login');
			} else {
				req.session.gitlab = {
					user: infos.gitlabUser
				};
				req.session.toastr = [{
					message: "login.passwordReset",
					level: "success"
				}];
				res.redirect('/default/home');
			}
		});
	}).catch(err => {
		req.session.toastr = [{
			message: err.message,
			level: "error"
		}];
		res.redirect(err.redirect ? err.redirect : '/login');
	})
});

// Logout
router.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/login');
});

module.exports = router;