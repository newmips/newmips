const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const auth = require('../utils/authStrategies');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mail = require('../utils/mailer');
const request = require('request');
const globalConf = require('../config/global');

// Sequelize
const models = require('../models/');

// Gitlab API
const gitlab = require('../services/gitlab_api');
const gitlabConf = require('../config/gitlab');

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
	const login = req.body.login.toLowerCase();
	const email = req.body.email;
	const usernameGitlab = email.replace(/@/g, "").replace(/\./g, "").trim();
	const passwordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");

	(async() => {

		if (globalConf.env != 'develop' && (req.body.password != req.body.confirm_password || !passwordRegex.test(req.body.password)))
			throw new Error("login.first_connection.passwordNotValid");

		const password = bcrypt.hashSync(req.body.confirm_password, null, null);

		const user = await models.User.findOne({
			where: {
				login: login,
				email: email
			}
		})

		if (!user)
			throw new Error("login.first_connection.userNotExist");

		if (user.password && user.password != "")
			throw new Error("login.first_connection.hasAlreadyPassword");

		if (gitlabConf.doGit) {
			let gitlabUser = await gitlab.getUser(email);

			if (!gitlabUser)
				gitlabUser = await gitlab.createUser({
					email: email,
					password: req.body.confirm_password,
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
			email: email,
			enabled: true
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
		res.redirect('/first_connection?login=' + login + '&email=' + email);
	});
});

router.get('/reset_password', block_access.loginAccess, function(req, res) {
	res.render('login/reset_password');
});

// Reset password - Generate token, insert into DB, send email
router.post('/reset_password', block_access.loginAccess, function(req, res) {
	(async () => {
		// Check if user with login + email exist in DB
		const user = await models.User.findOne({
			where: {
				login: req.body.login.toLowerCase(),
				email: req.body.mail
			}
		});

		if(!user)
			throw new Error("login.first_connection.userNotExist");

		if(!user.password && !user.enabled)
			throw new Error("login.first_connection.userNotActivate");

		// Create unique token and insert into user
		const token = crypto.randomBytes(64).toString('hex');

		await user.update({
			token_password_reset: token
		});

		// Send email with generated token
		await mail.sendMailResetPassword({
			mail_user: user.email,
			token: token
		});
	})().then(_ => {
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
				login: req.body.login.toLowerCase()
			}
		})

		console.error(err);
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
			return res.render('login/reset_password');
		}

		user.update({
			password: null
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

	const login = req.body.login.toLowerCase();
	const email = req.body.email;

	(async () => {
		const user = await models.User.findOne({
			where: {
				login: login,
				email: email,
				[models.$or]: [{password: ""}, {password: null}]
			}
		});

		if(globalConf.env != 'develop' && (req.body.password != req.body.confirm_password || req.body.password.length < 8))
			throw {
				message: "login.first_connection.passwordNotValid",
				redirect: '/reset_password_form/'+user.token_password_reset
			}

		const password = bcrypt.hashSync(req.body.confirm_password, null, null);

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
			gitlabUser = await gitlab.getUser(email);

			if(!gitlabUser)
				console.warn('Cannot update gitlab user password, user not found.');
			else
				await gitlab.updateUser(gitlabUser, {
					password: req.body.confirm_password,
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
				return res.redirect('/login');
			}

			if(infos.gitlabUser)
				req.session.gitlab = {
					user: infos.gitlabUser
				};

			req.session.toastr = [{
				message: "login.passwordReset",
				level: "success"
			}];
			res.redirect('/default/home');
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
	req.session.toastr = [{
		message: "login.logout_sucess",
		level: "success"
	}];
	res.redirect('/login');
});

module.exports = router;