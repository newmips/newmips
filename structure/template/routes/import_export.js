const router = require('express').Router();
const block_access = require('../utils/block_access');
const models = require('../models/');
const dbConfig = require('../config/database');
const fs = require('fs-extra');
const globalConf = require('../config/global');
const moment = require("moment");
const exec = require('child_process');

router.get('/db_show', block_access.isLoggedIn, block_access.actionAccessMiddleware("db_tool", "read"), (req, res) => {
	if (dbConfig.dialect != "mysql") {
		req.session.toastr = [{
			message: 'settings.db_tool.wrong_dialect',
			level: "error"
		}];
		return res.redirect("/default/administration")
	}

	let data = {};
	let entities = [];
	let through = [];

	fs.readdirSync(__dirname + '/../models/options/').filter(function(file) {
		return file.indexOf('.') !== 0 &&
			file.slice(-5) === '.json' &&
			file.substring(0, 2) == 'e_';
	}).forEach(function(file) {
		// Get primary tables
		let entityName = file.substring(0, file.length - 5);
		let modelName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
		let tableName = models[modelName].getTableName();
		let entityObject = {
			tradKey: 'entity.' + entityName + '.label_entity',
			tableName: tableName
		};
		entities.push(entityObject);

		let currentFile = JSON.parse(fs.readFileSync(__dirname + '/../models/options/' + file))
			// Get through tables
		for (let i = 0; i < currentFile.length; i++) {
			if (typeof currentFile[i].through === "string" && through.indexOf(currentFile[i].through) == -1) {
				through.push(currentFile[i].through);
				entities.push({
					tradKey: currentFile[i].through.substring(3),
					tableName: currentFile[i].through
				});
			}
		}
	})

	data.entities = entities;
	res.render('import_export/db_show', data);
})

router.post('/db_export', block_access.isLoggedIn, block_access.actionAccessMiddleware("db_tool", "create"), (req, res) => {
	if (dbConfig.password != req.body.db_password) {
		req.session.toastr = [{
			message: 'settings.db_tool.wrong_db_pwd',
			level: "error"
		}];
		return res.redirect("/import_export/db_show")
	}

	let tables = [];
	for (let prop in req.body)
		if (prop != "all_db" && req.body[prop] == "true")
			tables.push(prop);

	if (tables.length == 0 && req.body.all_db == "false") {
		req.session.toastr = [{
			message: 'settings.db_tool.no_choice',
			level: "error"
		}];
		return res.redirect("/import_export/db_show")
	}

	let cmd = "mysqldump";
	let cmdArgs = [
		"--default-character-set=utf8",
		"--add-drop-table",
		"-u",
		dbConfig.user,
		"-p" + dbConfig.password,
		dbConfig.database,
		"-h" + dbConfig.host,
	];

	// Export selected tables
	if (cmdArgs.length && req.body.all_db == "false") {
		cmdArgs.push("--tables");
		cmdArgs = cmdArgs.concat(tables);
	}

	function fullStdoutToFile(cmd, args, filePath) {
		return new Promise((resolve, reject) => {
			// Create and open file writeStream
			let fileStream = fs.createWriteStream(filePath);
			fileStream.on('open', function(fd) {

				// Exec instruction
				let childProcess = exec.spawn(cmd, args);
				childProcess.stdout.setEncoding('utf8');
				childProcess.stderr.setEncoding('utf8');

				// Child Success output
				childProcess.stdout.on('data', function(stdout) {
						fileStream.write(stdout);
					})
					// Child Error output
				childProcess.stderr.on('data', function(stderr) {
					// Avoid reject if only warning
					if (stderr.toLowerCase().indexOf("warning") != -1) {
						console.log("!! mysqldump ignored warning !!: " + stderr)
						return;
					}
					fileStream.end();
					childProcess.kill();
					reject(stderr);
				})

				// Child error
				childProcess.on('error', function(error) {
						console.error(error);
						fileStream.end();
						childProcess.kill();
						reject(error);
					})
					// Child close
				childProcess.on('close', function(code) {
					fileStream.end();
					resolve();
				})
			})
		})
	}

	let dumpName = 'dump_db_data_' + moment().format("YYYYMMDD-HHmmss") + '.sql';
	let dumpPath = __dirname + '/../' + dumpName;

	fullStdoutToFile(cmd, cmdArgs, dumpPath).then(function() {
		res.download(dumpPath, dumpName, function(err) {
			if (err)
				console.error(err);
			fs.unlinkSync(dumpPath);
		})
	}).catch(function(err) {
		console.error(err);
	})
})

router.post('/db_import', block_access.isLoggedIn, block_access.actionAccessMiddleware("db_tool", "create"), (req, res) => {

	let filename = req.body.import_file;
	if (filename == "") {
		req.session.toastr = [{
			message: 'settings.db_tool.file_needed',
			level: "error"
		}];
		return res.redirect("/import_export/db_show")
	}

	let baseFile = filename.split('-')[0];
	let completeFilePath = globalConf.localstorage + '/db_import/' + baseFile + '/' + filename;

	if (dbConfig.password != req.body.db_password) {
		req.session.toastr = [{
			message: 'settings.db_tool.wrong_db_pwd',
			level: "error"
		}];
		fs.unlinkSync(completeFilePath);
		return res.redirect("/import_export/db_show")
	}

	let cmd = "mysql";
	let cmdArgs = [
		"-u",
		dbConfig.user,
		"-p" + dbConfig.password,
		dbConfig.database,
		"-h" + dbConfig.host,
		"--default-character-set=utf8",
		"<",
		completeFilePath
	];

	function handleExecStdout(cmd, args) {
		return new Promise((resolve, reject) => {

			// Exec instruction
			let childProcess = exec.spawn(cmd, args, {
				shell: true,
				detached: true
			});
			childProcess.stdout.setEncoding('utf8');
			childProcess.stderr.setEncoding('utf8');

			// Child Success output
			childProcess.stdout.on('data', function(stdout) {
				console.log(stdout)
			})

			// Child Error output
			childProcess.stderr.on('data', function(stderr) {
				// Avoid reject if only warning
				if (stderr.toLowerCase().indexOf("warning") != -1) {
					console.log("!! mysql ignored warning !!: " + stderr)
					return;
				}
				childProcess.kill();
				reject(stderr);
			})

			// Child error
			childProcess.on('error', function(error) {
				childProcess.kill();
				reject(error);
			})

			// Child close
			childProcess.on('close', function(code) {
				resolve();
			})
		})
	}

	handleExecStdout(cmd, cmdArgs).then(function() {
		fs.unlinkSync(completeFilePath);
		req.session.toastr = [{
			message: 'settings.db_tool.import_success',
			level: "success"
		}];
		res.redirect("/import_export/db_show")
	}).catch(function(err) {
		console.error(err);
		req.session.toastr = [{
			message: "settings.db_tool.import_error",
			level: "error"
		}];
		res.redirect("/import_export/db_show")
	})
})

router.get('/access_show', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_tool", "read"), (req, res) => {
	res.render('import_export/access_show');
})

router.get('/access_export', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_tool", "create"), (req, res) => {
	let dumpPath = __dirname + '/../config/access.json';
	res.download(dumpPath, "access_conf_" + moment().format("YYYYMMDD-HHmmss") + ".json", function(err) {
		if (err) {
			console.error(err);
			req.session.toastr.push({
				message: err,
				level: "error"
			});
			return res.redirect("/import_export/access_show");
		}
	})
})

router.post('/access_import', block_access.isLoggedIn, block_access.actionAccessMiddleware("access_tool", "create"), (req, res) => {
	let src = req.body.import_file;
	let partOfFilepath = src.split('-');
	if (partOfFilepath.length > 1) {
		let base = partOfFilepath[0];
		let completeFilePath = globalConf.localstorage + 'access_import/' + base + '/' + src;
		let newAccessJson = fs.readFileSync(completeFilePath);
		fs.writeFileSync(__dirname + "/../config/access.json", newAccessJson);
		req.session.toastr.push({
			message: "settings.tool_success",
			level: "success"
		});
		return res.redirect("/import_export/access_show");
	} else {
		req.session.toastr.push({
			message: "An error occured.",
			level: "error"
		});
		return res.redirect("/import_export/access_show");
	}
})

module.exports = router;