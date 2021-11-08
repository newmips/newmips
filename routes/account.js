const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const code_platform = require('../config/code_platform.js');
const models = require('../models/');

router.get('/', block_access.isLoggedIn, (req, res) => {
	const data = {};
	data.user = req.session.passport.user;
	models.Role.findByPk(data.user.id_role).then(userRole => {
		data.user.role = userRole;

		if (code_platform.enabled) {
			data.code_platform_user = req.session.code_platform.user;
			data.code_platform_host = code_platform.protocol + "://" + code_platform.url;
		}

		res.render('front/account', data);
	});
});

module.exports = router;