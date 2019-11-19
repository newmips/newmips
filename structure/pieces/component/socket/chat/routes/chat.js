const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');

// Sequelize
const models = require('../models/');

router.post('/user_search', block_access.isLoggedIn, function(req, res) {
	models.E_user.findAll({
		where: {f_login: {[models.$like]: '%'+req.body.search+'%'}}
	}).then(function(results) {
		const data = [];
		for (let i = 0; i < results.length; i++)
			data.push({
				id: results[i].id,
				text: results[i].f_login
			});
		res.status(200).send(data);
	});
});

router.post('/channel_search', block_access.isLoggedIn, function(req, res) {
	models.E_channel.findAll({
		where: {
			f_type: 'public',
			f_name: {[models.$like]: '%'+req.body.search+'%'}
		}
	}).then(function(results) {
		const data = [];
		for (let i = 0; i < results.length; i++)
			data.push({
				id: results[i].id,
				text: results[i].f_name
			});
		res.status(200).send(data);
	});
});

module.exports = router;
