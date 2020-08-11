const router = require('express').Router();
const block_access = require('../utils/block_access');
const auth = require('../utils/auth_strategies');
const bcrypt = require('bcrypt-nodejs');
const crypto = require('crypto');
const mailer = require('../utils/mailer');
const svgCaptcha = require('svg-captcha');
const models = require('../models/');
const globalConf = require('../config/global');

// Home
router.get('/', (req, res) => {
	res.redirect('/login');
});

// Route used to redirect to set_status when submitting comment modal
router.post('/status_comment', block_access.isLoggedIn, (req, res) => {
	res.redirect('/'+req.body.parentName+'/set_status/'+req.body.parentId+'/'+req.body.field+'/'+req.body.statusId+'?comment='+encodeURIComponent(req.body.comment));
});

// Login
router.get('/login', block_access.loginAccess, (req, res) => {

	let captcha;
	if(req.session.loginAttempt >= 5){
		const loginCaptcha = svgCaptcha.create({
			size: 4, // size of random string
			ignoreChars: '0oO1iIlL', // filter out some characters
			noise: 1, // number of noise lines
			color: false,
			width: 500
		});
		req.session.loginCaptcha = loginCaptcha.text;
		captcha = loginCaptcha.data;
	}

	res.render('login/login', {
		captcha: captcha,
		redirect: req.query.r ? req.query.r : null
	});
});

router.post('/login', auth.isLoggedIn, (req, res) => {

	if (req.body.remember_me)
		req.session.cookie.maxAge = 168 * 3600000; // 1 week
	else
		req.session.cookie.expires = false; // Logout on browser exit

	const redirect = req.query.r ? req.query.r : "/default/home";
	res.redirect(redirect);
});

router.get('/refresh_login_captcha', (req, res) => {
	const captcha = svgCaptcha.create({
		size: 4,
		ignoreChars: '0oO1iIlL',
		noise: 1,
		color: false,
		width: "500"
	});
	req.session.loginCaptcha = captcha.text;
	res.status(200).send(captcha.data);
});

router.get('/first_connection', block_access.loginAccess, (req, res) => {
	res.render('login/first_connection');
});

router.post('/first_connection', block_access.loginAccess, (req, res) => {
	const login = req.body.login;
	const passwordRegex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/);

	(async () => {

		if (globalConf.env != 'develop' && (req.body.password != req.body.confirm_password || !passwordRegex.test(req.body.password)))
			throw new Error("login.first_connection.passwordNotValid");

		const user = await models.E_user.findOne({
			where: {
				f_login: login,
				f_enabled: 0
			},
			include: [{
				model: models.E_group,
				as: 'r_group'
			}, {
				model: models.E_role,
				as: 'r_role'
			}]
		})

		if (!user)
			throw new Error("login.first_connection.userNotExist");

		if (user.f_password && user.f_password != '')
			throw new Error("login.first_connection.alreadyHavePassword");

		const password = bcrypt.hashSync(req.body.confirm_password, null, null);

		await user.update({
			f_password: password,
			f_enabled: 1
		})

		return user;
	})().then(user => {
		req.login(user, err => {
			if (err) {
				console.error(err);
				req.session.toastr = [{
					message: err.message,
					level: "warn"
				}];
				return res.redirect('/login');
			}
			req.session.toastr = [{
				message: "login.first_connection.success_login",
				level: "success"
			}];
			res.redirect('/default/home');
		})
	}).catch(err => {
		console.error(err);
		req.session.toastr = [{
			message: err.message,
			level: "error"
		}];
		res.redirect('/first_connection');
	})
})

// Affichage de la page reset_password
router.get('/reset_password', block_access.loginAccess, (req, res) => {
	res.render('login/reset_password');
});

// Reset password - Generate token, insert into DB, send email
router.post('/reset_password', block_access.loginAccess, (req, res) => {
	(async () => {
		// Check if user with login + email exist in DB
		const user = await models.E_user.findOne({
			where: {
				f_login: req.body.login.toLowerCase(),
				f_email: req.body.email
			}
		});

		if(!user)
			throw new Error("login.reset_password.userNotExist");

		if(!user.f_enabled)
			throw new Error("login.not_enabled");

		// Create unique token and insert into user
		const token = crypto.randomBytes(64).toString('hex');

		await user.update({
			f_token_password_reset: token
		});

		// Send email with generated token
		const mailOptions = {
			data: {
				href: mailer.config.host + '/reset_password/' + token,
				user: user
			},
			from: mailer.config.expediteur,
			to: req.body.email,
			subject: 'Newmips - Réinitialisation de votre mot de passe'
		}
		await mailer.sendTemplate('mail_reset_password', mailOptions);
	})().then(_ => {
		req.session.toastr = [{
			message: "login.reset_password.successMail",
			level: "success"
		}];
		// Reset potential captcha
		delete req.session.loginAttempt;
		res.redirect('/');
	}).catch(err => {
		// Remove inserted value in user to avoid zombies
		models.E_user.update({
			f_token_password_reset: null
		}, {
			where: {
				f_login: req.body.login.toLowerCase()
			}
		}).catch(err => {console.error(err);})

		console.error(err);
		req.session.toastr = [{
			message: err.message,
			level: "error"
		}];
		res.render('login/reset_password');
	})
})

// Trigger password reset
router.get('/reset_password/:token', block_access.loginAccess, (req, res) => {
	models.E_user.findOne({
		where: {
			f_token_password_reset: req.params.token
		}
	}).then(user => {
		if (!user) {
			req.session.toastr = [{
				message: "login.reset_password.cannotFindToken",
				level: 'error'
			}];
			return res.redirect('/login');
		}

		user.update({
			f_password: null,
			f_token_password_reset: null,
			f_enabled: 0
		}).then(_ => {
			req.session.toastr = [{
				message: "login.reset_password.success",
				level: 'success'
			}];
			res.redirect('/first_connection');
		});
	}).catch(err => {
		req.session.toastr = [{
			message: err.message,
			level: 'error'
		}];
		res.redirect('/login');
	});
});

// =====================================
// LOGOUT ==============================
// =====================================
router.get('/logout', (req, res) => {
	req.session.autologin = false;
	req.logout();
	req.session.toastr = [{
		message: "login.logout_sucess",
		level: "success"
	}];
	res.redirect('/login');
});

module.exports = router;
