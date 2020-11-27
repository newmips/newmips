// router/routes.js
const express = require('express');
const router = express.Router();
const hat = require('hat');
const models = require('../models/');

router.get('/getToken', function(req, res) {
	const {authorization} = req.headers;
	// No authorization header
	if (!authorization)
		return res.status(500).json({error: 'No authorization header'});

	const parts = authorization.split(' ');
	// Bad authorization header
	if (parts.length < 2)
		return res.status(500).json({error: 'Bad authorization header'});

	const sheme = parts[0];
	const credentials = new Buffer(parts[1], 'base64').toString().split(':');
	// Bad authorization header
	if (!/Basic/i.test(sheme))
		return res.status(500).json({error: 'Bad authorization header'});

	// Bad authorization header
	if (credentials.length < 2)
		return res.status(500).json({error: 'Bad authorization header'});

	// Bad authorization header
	if (!credentials[0] || !credentials[1])
		return res.status(500).json({error: 'Bad authorization header'});

	const client_key = credentials[0];
	const client_secret = credentials[1];
	models.E_api_credentials.findOne({where: {f_client_key: client_key, f_client_secret: client_secret}}).then(function(credentialsObj) {
		// Authentication failed
		if (!credentialsObj)
			return res.status(401).json({error: 'Authentication failed'});

		// Authentication success, create token and set token timeout
		const token = hat();
		// timeout is one day (86400000)
		const token_timeout_tmsp = new Date().getTime() + 86400000;
		credentialsObj.update({f_token_timeout_tmsp: token_timeout_tmsp, f_token: token}, {user: req.user}).then(function() {
			// Send back new token
			res.status(200).json({token: credentialsObj.f_token});
		}).catch(function(err) {
			res.status(500).json({error: err});
		});
	}).catch(function(err) {
		res.status(500).json(err);
	});
});

module.exports = router;