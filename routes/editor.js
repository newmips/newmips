// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

var fs = require('fs');
var helpers = require('../utils/helpers');

//Sequelize
var models = require('../models/');

// Check file to edit extension
var re = /(?:\.([^.]+))?$/;

// ===========================================
// Redirection Editor =====================
// ===========================================

// Homepage
router.get('/:id_application', block_access.isLoggedIn, function(req, res) {
    var data = {};
    var id_application = req.params.id_application;
    var workspacePath = __dirname + "/../workspace/" + id_application + "/";
    var exclude = ["node_modules", "config", "sql", "services", "models", "api", "utils", "upload", "public"];
    var folder = helpers.readdirSyncRecursive(workspacePath, exclude);
    data.workspaceFolder = folder;
    data.idApplication = id_application;
    res.render("front/editor", data);
});

router.post('/load_file', block_access.isLoggedIn, function(req, res) {
	var data = {};
	data.html = helpers.readFileSyncWithCatch(req.body.path);
	data.path = req.body.path;
	data.extension = re.exec(req.body.path)[1];
	res.json(data);
});

router.post('/update_file', block_access.isLoggedIn, function(req, res) {
	var writeStream = fs.createWriteStream(req.body.path);
	writeStream.write(req.body.content);
	writeStream.end();
	writeStream.on('finish', function() {
		res.json(true);
	});
});

module.exports = router;