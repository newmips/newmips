const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const fs = require("fs-extra");
const helpers = require('../utils/helpers');
const globalConf = require('../config/global.js');

router.get('/', block_access.isLoggedIn, function(req, res) {
	const data = {};
	let version;

	if(globalConf.version)
		version = globalConf.version;
	else {
		console.warn("Missing version for templates.");
		req.session.toastr = [{
			message: "template.no_version",
			level: "error"
		}];
		return res.redirect("/default/home");
	}

	let initTemplate = false;
	let templateDir = __dirname + "/../templates";

	// Templates folder managment
	if (!fs.existsSync(templateDir)) {
		fs.mkdirSync(templateDir);
		initTemplate = true;
	}

	const gitTemplate = require('simple-git')(templateDir);

	let gitPromise = new Promise((resolve, reject) => {
		if(initTemplate){
			gitTemplate.clone("https://github.com/newmips/templates.git", ".", (err, answer) => {
				if(err){
					req.session.toastr = [{
						message: "template.no_clone",
						level: "error"
					}];
					helpers.rmdirSyncRecursive(templateDir);
					return res.redirect("/default/home");
				}

				console.log("TEMPLATE GIT CLONE DONE");
				gitTemplate.checkout(version, (err, answer) => {
					if(err){
						req.session.toastr = [{
							message: "template.no_checkout",
							level: "error"
						}];
						helpers.rmdirSyncRecursive(templateDir);
						return res.redirect("/default/home");
					}

					console.log("TEMPLATE GIT CHECKOUT VERSION "+version+" DONE");
					resolve();
				 })
			})
		} else {
			gitTemplate.pull("origin", version, "-f", (err, answer) => {
				if(err){
					console.error(err);
					req.session.toastr = [{
						message: "template.no_pull",
						level: "warning"
					}];
				}
				console.log("TEMPLATE GIT PULL DONE");
				resolve();
			})
		}
	})

	gitPromise.then(() => {
		let templatesInfos = JSON.parse(fs.readFileSync(templateDir + "/templates.json", "utf8"), null, 4).templates;
		let templatesNames = [];
		data.templates = [];
		for(let i=0; i<templatesInfos.length; i++)
			templatesNames.push(templatesInfos[i].name);

		// Sorting templates in alphabetic order
		templatesNames.sort();
		for (let i = 0; i < templatesNames.length; i++)
			for (let j = 0; j < templatesInfos.length; j++)
				if(templatesInfos[j].name == templatesNames[i])
					data.templates.push({
						name: templatesInfos[j].name,
						entry: templatesInfos[j].entry
					});

		res.render('front/templates', data);
	})
})

module.exports = router;