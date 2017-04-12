// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

var fs = require('fs');
var domHelper = require('../utils/jsDomHelper');
var language = require('../services/language');

//Sequelize
var models = require('../models/');

// ===========================================
// Redirection Editor =====================
// ===========================================

// Homepage
router.get('/getPage/:entity/:page', block_access.isLoggedIn, function(req, res) {
	var page = req.params.page;
	var entity = req.params.entity;

	var pageUri = __dirname+'/../workspace/'+req.session.id_application+'/views/'+entity+'/'+page;
	domHelper.read(pageUri).then(function($) {
		res.status(200).send($("body")[0].innerHTML);
	}).catch(function(err) {
		console.log(err);
		res.status(404).send(language(req.session.lang_user)("ui_editor.page_not_fouond"));
	});
});

module.exports = router;