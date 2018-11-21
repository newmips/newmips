// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

var fs = require('fs');
var helpers = require('../utils/helpers');
var gitHelper = require('../utils/git_helper');

//Sequelize
var models = require('../models/');

// Check file to edit extension
var re = /(?:\.([^.]+))?$/;

// Exclude folder from editor
var excludeFolder = ["node_modules", "sql", "services", "upload", ".git"];
var excludeFile = [".git_keep", "application.json", "database.js", "global.js", "icon_list.json", "language.json", "webdav.js"];

router.get('/:id_application', block_access.isLoggedIn, function(req, res) {
    var data = {};
    var id_application = req.params.id_application;
    var workspacePath = __dirname + "/../workspace/" + id_application + "/";
    var folder = helpers.readdirSyncRecursive(workspacePath, excludeFolder, excludeFile);
    /* Sort folder first, file after */
    folder = helpers.sortEditorFolder(folder);
    data.workspaceFolder = folder;
    data.idApplication = id_application;
    if(typeof req.session.id_application === "undefined")
    	req.session.id_application = id_application;
    res.render("front/editor", data);
});

router.post('/load_file', block_access.isLoggedIn, function(req, res) {
	var data = {};
	var splitPath = req.body.path.split("/workspace/"+req.session.id_application+"/");
	splitPath = splitPath[1].split("/");
	if(excludeFolder.indexOf(splitPath[0]) != -1){
		res.status(403).send("You won't have the death star plans ! You rebel scum !");
	} else {
		data.html = helpers.readFileSyncWithCatch(req.body.path);
		data.path = req.body.path;
		data.extension = re.exec(req.body.path)[1];
		res.json(data);
	}
});

router.post('/update_file', block_access.isLoggedIn, function(req, res) {
	var splitPath = req.body.path.split("/workspace/"+req.session.id_application+"/");
	splitPath = splitPath[1].split("/");
	if(excludeFolder.indexOf(splitPath[0]) != -1){
		res.status(403).send("You won't update the death star plans ! You rebel scum !");
	} else {
		var writeStream = fs.createWriteStream(req.body.path);
		writeStream.write(req.body.content);
		writeStream.end();
		writeStream.on('finish', function() {
			var attr = {};

	        // We simply add session values in attributes array
	        attr.function = "Saved a file from editor: "+req.body.path;
	        attr.id_project = req.session.id_project;
	        attr.id_application = req.session.id_application;
	        attr.id_module = "-";
	        attr.id_data_entity = "-";

			gitHelper.gitCommit(attr, function(err, infoGit){
		        if(err)
		        	console.log(err);
		        res.json(true);
		    });
		});
	}
});

module.exports = router;