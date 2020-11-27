const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const fs = require('fs-extra');
const helpers = require('../utils/helpers');
const gitHelper = require('../utils/git_helper');

// Check file to edit extension
const fileExtRegex = /(?:\.([^.]+))?$/;

// Exclude folder from editor
const excludeFolder = ["node_modules", "sql", "services", "upload", ".git"];
const excludeFile = [".git_keep", "application.json", "database.js", "global.js", "icon_list.json", "webdav.js"];

router.post('/load_file', block_access.hasAccessApplication, function(req, res) {
	if (!req.body.path.includes("/../workspace/" + req.session.app_name))
		return res.status(403).send("You won't have the death star plans ! You rebel scum !");

	let splitPath = req.body.path.split("/workspace/" + req.session.app_name + "/");
	splitPath = splitPath[1].split("/");

	if (excludeFolder.indexOf(splitPath[0]) != -1 || excludeFile.indexOf(splitPath[splitPath.length - 1]) != -1)
		return res.status(403).send("You won't have the death star plans ! You rebel scum !");

	const data = {};
	data.html = helpers.readFileSyncWithCatch(req.body.path);
	data.path = req.body.path;
	data.extension = fileExtRegex.exec(req.body.path)[1];
	res.json(data);
});

router.post('/update_file', block_access.hasAccessApplication, function(req, res) {
	if (!req.body.path.includes("/../workspace/" + req.session.app_name))
		return res.status(403).send("You won't have the death star plans ! You rebel scum !");

	let splitPath = req.body.path.split("/workspace/" + req.session.app_name + "/");
	splitPath = splitPath[1].split("/");

	if (excludeFolder.indexOf(splitPath[0]) != -1 || excludeFile.indexOf(splitPath[splitPath.length - 1]) != -1)
		return res.status(403).send("You won't update the death star plans ! You rebel scum !");

	fs.writeFileSync(req.body.path, req.body.content);

	res.json(true);

	gitHelper.gitCommit({
		function: "Saved a file from editor: " + req.body.path,
		application: {
			name: req.session.app_name
		}
	}).catch(err => {
		console.error(err);
	})
});

module.exports = router;