const router = require('express').Router();
const fs = require('fs-extra');
const models = require('../models/');
const multer = require('multer');
const Jimp = require('jimp');
const math = require('math');
const unzip = require('unzip-stream');
const JSZip = require('jszip');

// Config
const globalConf = require('../config/global.js');
const gitlabConf = require('../config/gitlab.js');

// Services
const process_manager = require('../services/process_manager.js');
const {process_server_per_app} = process_manager;
const exec = require('child_process');
const session_manager = require('../services/session.js');
const designer = require('../services/designer.js');
const parser = require('../services/bot.js');
const gitlab = require('../services/gitlab_api');
const studio_manager = require('../services/studio_manager');

// Utils
const block_access = require('../utils/block_access');
const docBuilder = require('../utils/api_doc_builder');
const helpers = require('../utils/helpers');
const dataHelper = require('../utils/data_helper');
const gitHelper = require('../utils/git_helper');

const metadata = require('../database/metadata')();
const structure_application = require('../structure/structure_application');
const pourcent_generation = {};

// Exclude from Editor
const excludeFolder = ["node_modules", "sql", "services", "upload", ".git"];
const excludeFile = [".git_keep", "application.json", "database.js", "global.js", "icon_list.json", "webdav.js"];

function initPreviewData(appName, data){
	// Editor
	const workspacePath = __dirname + "/../workspace/" + appName + "/";
	const folder = helpers.readdirSyncRecursive(workspacePath, excludeFolder, excludeFile);
	/* Sort folder first, file after */
	data.workspaceFolder = helpers.sortEditorFolder(folder);

	const application = metadata.getApplication(appName);
	const {modules} = application;

	// UI designer entity list
	data.entities = [];
	for (let i = 0; i < modules.length; i++)
		for (let j = 0; j < modules[i].entities.length; j++)
			data.entities.push(modules[i].entities[j]);

	function sortEntities(entities, idx) {
		if (entities.length == 0 || !entities[idx+1])
			return entities;
		if (entities[idx].name > entities[idx+1].name) {
			const swap = entities[idx];
			entities[idx] = entities[idx+1];
			entities[idx+1] = swap;
			return sortEntities(entities, idx == 0 ? 0 : idx-1);
		}
		return sortEntities(entities, idx+1);
	}
	data.entities = sortEntities(data.entities, 0);
	return data;
}

const chats = {};
function setChat(req, app_name, userID, user, content, params, isError){

	// Init if necessary
	if(!chats[app_name])
		chats[app_name] = {};
	if(!chats[app_name][userID])
		chats[app_name][userID] = {items: []};

	// Add chat
	if(content != "chat.welcome" || chats[app_name][userID].items.length < 1)
		chats[app_name][userID].items.push({
			user: user,
			dateEmission: req.moment().format("DD MMM HH:mm"),
			content: content,
			params: params || [],
			isError: isError || false
		});
}

async function execute(req, instruction, __, data = {}, saveMetadata = true) {

	// Lower the first word for the basic parser json
	instruction = dataHelper.lowerFirstWord(instruction);

	// Instruction to be executed
	data = {
		...data,
		...parser.parse(instruction)
	};

	// Rework the data to get value for the code / url / show
	data = dataHelper.reworkData(data);

	if (typeof data.error !== 'undefined')
		throw data.error;

	data.app_name = req.session.app_name;
	data.module_name = req.session.module_name;
	data.entity_name = req.session.entity_name;
	data.googleTranslate = req.session.toTranslate || false;
	data.lang_user = req.session.lang_user;
	data.currentUser = req.session.passport.user;
	data.gitlabUser = null;
	data.isGeneration = true;

	if(typeof req.session.gitlab !== 'undefined'
		&& typeof req.session.gitlab.user !== 'undefined'
		&& !isNaN(req.session.gitlab.user.id))
		data.gitlabUser = req.session.gitlab.user;

	if(data.function != 'createNewApplication' && data.function != 'deleteApplication')
		data.application = metadata.getApplication(data.app_name);

	let info;
	try {
		info = await designer[data.function](data);
	} catch (err) {
		console.error('Error on function: ' + data.function);
		console.error(err);
		throw __(err.message ? err.message : err, err.messageParams || []);
	}

	const newData = session_manager.setSession(data.function, req, info, data);

	// Save metadata
	if(data.application && data.function != 'deleteApplication' && saveMetadata)
		data.application.save();

	newData.message = info.message;
	newData.messageParams = info.messageParams;
	newData.restartServer = typeof info.restartServer === 'undefined';
	return newData;
}

// Preview Get
router.get('/preview/:app_name', block_access.hasAccessApplication, (req, res) => {

	const appName = req.params.app_name;

	// Application starting timeout
	let timeoutServer = 30000;
	if(typeof req.query.timeout !== "undefined")
		timeoutServer = req.query.timeout;

	const currentUserID = req.session.passport.user.id;

	req.session.app_name = appName;
	req.session.module_name = 'm_home';
	req.session.entity_name = null;

	let data = {
		application: metadata.getApplication(appName),
		currentUser: req.session.passport.user,
		gitlabUser: null
	};

	if ((!appName || appName == '') && typeof process_server_per_app[appName] === 'undefined') {
		req.session.toastr.push({level: "warning", message: "application.not_started"});
		return res.redirect('/default/home');
	}

	setChat(req, appName, currentUserID, "Mipsy", "chat.welcome", []);

	models.Application.findOne({where: {name: appName}}).then(db_app => {

		const env = Object.create(process.env);
		const port = math.add(9000, db_app.id);
		env.PORT = port;

		if (process_server_per_app[appName] == null || typeof process_server_per_app[appName] === "undefined")
			process_server_per_app[appName] = process_manager.launchChildProcess(req, appName, env);

		if(typeof req.session.gitlab !== "undefined" && typeof req.session.gitlab.user !== "undefined" && !isNaN(req.session.gitlab.user.id))
			data.gitlabUser = req.session.gitlab.user;

		data.session = session_manager.getSession(req)

		const initialTimestamp = new Date().getTime();
		let iframe_url = globalConf.protocol_iframe + '://';

		if (globalConf.env == 'cloud'){
			iframe_url += globalConf.sub_domain + '-' + data.application.name.substring(2) + "." + globalConf.dns + '/default/status';
			// Checking .toml file existence, creating it if necessary
			studio_manager.createApplicationDns(appName.substring(2), db_app.id)
		}
		else
			iframe_url += globalConf.host + ":" + port + "/default/status";

		data = initPreviewData(appName, data);
		data.chat = chats[appName][currentUserID];

		// Check server has started every 50 ms
		console.log('Starting server...');
		process_manager.checkServer(iframe_url, initialTimestamp, timeoutServer).then(_ => {
			data.iframe_url = iframe_url.split("/default/status")[0] + "/default/home";
			// Let's do git init or commit depending the env (only on cloud env for now)
			gitHelper.doGit(data);
			res.render('front/preview', data);
		}).catch(err => {
			console.error(err);

			if(!err)
				err = new Error('An error occured');

			let chatKey = err.message;
			let chatParams = err.messageParams;
			let lastError = helpers.getLastLoggedError(appName);
			// If missing module error
			if(typeof lastError === "string" && lastError.indexOf("Cannot find module") != -1){
				chatKey = "structure.global.restart.missing_module";
				lastError = lastError.split("Cannot find module")[1].replace(/'/g, "").trim();
				chatParams = [lastError, lastError];
			}

			setChat(req, appName, currentUserID, "Mipsy", chatKey, chatParams, true);
			data.iframe_url = -1;
			res.render('front/preview', data);
		});
	}).catch(err => {
		data = initPreviewData(appName, data);
		data.code = 500;
		console.error(err);
		res.render('common/error', data);
	});
});

// AJAX Preview Post
router.post('/fastpreview', block_access.hasAccessApplication, (req, res) => {

	const appName = req.session.app_name;
	/* Lower the first word for the basic parser json */
	const instruction = dataHelper.lowerFirstWord(req.body.instruction.trim());
	const currentUserID = req.session.passport.user.id;
	let data = {};

	(async () => {
		const db_app = await models.Application.findOne({where: {name: appName}});

		const port = math.add(9000, db_app.id);
		const env = Object.create(process.env);
		env.PORT = port;

		const {protocol_iframe} = globalConf;
		const {host} = globalConf;
		const timeoutServer = 30000; // 30 sec

		// Current application url
		data.iframe_url = process_manager.childUrl(req, db_app.id);

		/* Add instruction in chat */
		setChat(req, appName, currentUserID, req.session.passport.user.login, instruction, []);

		const {__} = require("../services/language")(req.session.lang_user); // eslint-disable-line

		// Executing instruction
		data = await execute(req, instruction, __, data);

		let appBaseUrl = protocol_iframe + '://' + host + ":" + port;
		if(globalConf.env == 'cloud')
			appBaseUrl = protocol_iframe + '://' + globalConf.sub_domain + '-' + req.session.app_name.substring(2) + "." + globalConf.dns;

		// On entity delete, reset child_url to avoid 404
		if (data.function == 'deleteDataEntity') {
			data.iframe_url = appBaseUrl + "/default/home";
			process_manager.setChildUrl(req.sessionID, appName, "/default/home");
		}

		/* Save an instruction history in the history script in workspace folder */
		if (data.function != 'restart') {
			const historyScriptPath = __dirname + '/../workspace/' + appName + '/history_script.nps';
			let historyScript = fs.readFileSync(historyScriptPath, 'utf8');
			historyScript += "\n" + instruction;
			fs.writeFileSync(historyScriptPath, historyScript);
		}

		if (data.function == "deleteApplication"){
			data.toRedirect = true;
			data.url = "/default/home";
			return data;
		}

		// Generator answer
		setChat(req, appName, currentUserID, "Mipsy", data.message, data.messageParams);

		// If we stop the server manually we loose some stored data, so we just need to redirect.
		if(typeof process_server_per_app[appName] === "undefined"){
			data.toRedirect = true;
			data.url = "/application/preview/" + appName;
			return data;
		}

		if(data.restartServer) {
			// Kill server first
			await process_manager.killChildProcess(process_server_per_app[appName].pid)
			// Launch a new server instance to reload resources
			process_server_per_app[appName] = process_manager.launchChildProcess(req, appName, env);
			const initialTimestamp = new Date().getTime();
			console.log('Starting server...');
			await process_manager.checkServer(appBaseUrl + '/default/status', initialTimestamp, timeoutServer);
		}

		data.session = session_manager.getSession(req);
		data = initPreviewData(appName, data);
		data.chat = chats[appName][currentUserID];

		// Let's do git init or commit depending the situation
		if (data.function != 'restart' && data.function != 'installNodePackage')
			gitHelper.doGit(data);

		return data;

	})().then(data => {
		if(data.application)
			docBuilder.build(data.application).catch(err => {
				console.error(err);
			});
		res.send(data);
	}).catch(err => {

		// Error handling code goes here
		console.error(err);

		// Server timed out handling
		if(err.message == 'preview.server_timeout') {

			// Get last error from app logs
			let lastError = helpers.getLastLoggedError(appName);
			let chatKey = "structure.global.restart.error";
			let chatParams = [lastError];

			// If missing module error
			if(typeof lastError === "string" && lastError.indexOf("Cannot find module") != -1){
				chatKey = "structure.global.restart.missing_module";
				lastError = lastError.split("Cannot find module")[1].replace(/'/g, "").trim();
				chatParams = [lastError, lastError];
			}
			data.iframe_url = -1;
			setChat(req, appName, currentUserID, "Mipsy", chatKey, chatParams, true);
		} else
			setChat(req, appName, currentUserID, "Mipsy", err.message ? err.message : err, err.messageParams, true);

		/* Save ERROR an instruction history in the history script in workspace folder */
		if (data.function != 'restart') {
			const historyScriptPath = __dirname + '/../workspace/' + appName + '/history_script.nps';
			let historyScript = fs.readFileSync(historyScriptPath, 'utf8');
			historyScript += "\n//ERROR: " + instruction + " (" + err.message + ")";
			fs.writeFileSync(historyScriptPath, historyScript);
		}

		// Load session values
		data = initPreviewData(appName, data);
		data.session = session_manager.getSession(req);
		data.chat = chats[appName][currentUserID];
		res.send(data);
	});
});

// Dropzone FIELD ajax upload file
router.post('/set_logo', block_access.hasAccessApplication, (req, res) => {
	multer().single('file')(req, res, err => {
		if (err) {
			console.error(err);
			return res.status(500).end(err);
		}

		const configLogo = {
			folder: 'thumbnail/',
			height: 30,
			width: 30,
			quality: 60
		};

		const entity = req.body.entity;

		if (!entity)
			return res.status(500).end(new Error('Internal error, entity not found.'));

		let basePath = __dirname + "/../workspace/" + req.body.appName + "/public/img/" + entity + '/';
		fs.mkdirs(basePath, err => {
			if (err) {
				console.error(err);
				return res.status(500).end(err);
			}

			const uploadPath = basePath + req.file.originalname;
			fs.writeFileSync(uploadPath, req.file.buffer);

			// Thumbnail creation
			basePath = __dirname + "/../workspace/" + req.body.appName + "/public/img/" + entity + '/' + configLogo.folder;
			fs.mkdirs(basePath, err => {
				if (err) {
					console.error(err);
					return res.status(500).end(err);
				}

				Jimp.read(uploadPath, (err, imgThumb) => {
					if (err) {
						console.error(err);
						return res.status(500).end(err);
					}

					imgThumb.resize(configLogo.height, configLogo.width).quality(configLogo.quality).write(basePath + req.file.originalname);
					res.json({
						success: true
					});
				});
			});
		});
	});
});

// List all applications
router.get('/list', block_access.isLoggedIn, (req, res) => {
	(async () => {
		const applications = await models.Application.findAll({
			include: [{
				model: models.User,
				as: "users",
				where: {
					id: req.session.passport.user.id
				},
				required: true
			}],
			order: [['id', 'DESC']]
		});

		const data = {gitlabUser: null};
		const host = globalConf.host;

		// Get user project for clone url generation
		if(req.session.gitlab && req.session.gitlab.user)
			data.gitlabUser = req.session.gitlab.user;

		const promises = [];
		for (let i = 0; i < applications.length; i++) {
			promises.push((async () => {
				const port = 9000 + parseInt(applications[i].id);
				let app_url = globalConf.protocol_iframe + '://' + host + ":" + port + "/";

				const appName = applications[i].name.substring(2);
				if (globalConf.env == 'cloud')
					app_url += globalConf.sub_domain + '-' + appName + "." + globalConf.dns + '/';

				applications[i].dataValues.url = app_url;

				if (gitlabConf.doGit && data.gitlabUser) {
					const metadataApp = metadata.getApplication(applications[i].name);
					let gitlabProject = null;

					// Missing metadata gitlab info
					if(!metadataApp.gitlabID) {
						gitlabProject = await gitlab.getProjectByName(globalConf.host + "-" + applications[i].name.substring(2));
						metadataApp.gitlabID = gitlabProject.id;
						metadataApp.gitlabRepo = gitlabProject.http_url_to_repo;
						metadataApp.save();
					} else if(!metadataApp.gitlabRepo) {
						try {
							gitlabProject = await gitlab.getProjectByID(metadataApp.gitlabID);
						} catch(err){
							console.log("ERROR while retrieving: " + applications[i].name + "(" + metadataApp.gitlabID + ")");
						}
					} else {
						gitlabProject = {
							http_url_to_repo: metadataApp.gitlabRepo
						};
					}

					if (gitlabProject)
						applications[i].dataValues.repo_url = gitlabProject.http_url_to_repo;
					else
						console.warn("Cannot find gitlab project: " + metadataApp.name);
				}
			})())
		}

		await Promise.all(promises);
		data.applications = applications
		return data;
	})().then(data => {
		res.render('front/application', data);
	}).catch(err => {
		console.error(err);
		res.render('common/error', {
			code: 500
		});
	})
});

router.post('/delete', block_access.isLoggedIn, (req, res) => {
	const {__} = require("../services/language")(req.session.lang_user); // eslint-disable-line
	execute(req, "delete application " + req.body.appName, __).then(_ => {
		res.status(200).send(true);
	}).catch(err => {
		console.error(err);
		res.status(500).send(err);
	});
});

router.post('/initiate', block_access.isLoggedIn, (req, res) => {

	pourcent_generation[req.session.passport.user.id] = 1;
	if (req.body.application == "") {
		req.session.toastr = [{
			message: "Missing application name.",
			level: "error"
		}];
		return res.redirect('/default/home');
	}

	const instructions = [
		"create application " + req.body.application,
		"create module home",

		// Authentication module
		"create module Administration",
		"create entity User",
		"add field login",
		"set field login required",
		"set field login unique",
		"add field password",
		"add field email with type email",
		"add field token_password_reset",
		"add field enabled with type number",
		"set icon user",
		"create entity Role",
		"add field label",
		"set field label required",
		"set field label unique",
		"set icon asterisk",
		"create entity Group",
		"add field label",
		"set field label required",
		"set field label unique",
		"set icon users",
		"select entity User",
		"add field Role related to many Role using label",
		"add field Group related to many Group using label",
		"set field Role required",
		"set field Group required",
		"entity Role has many user",
		"entity Group has many user",
		"add entity API credentials",
		"add field Client Name",
		"add field Client Key",
		"add field Client Secret",
		"set icon key",
		"add field role related to many Role using label",
		"add field group related to many Group using label",
		"add field Token",
		"add field Token timeout TMSP",
		"add entity Synchronization",
		"entity Synchronization has one API credentials",
		"add field Journal backup file",
		"add entity Synchro credentials",
		"add field Cloud host with type url",
		"add field Client key",
		"add field Client secret",
		"set icon unlink",
		"add widget stat on entity User",

		// Component status base
		"add entity Status",
		"set icon tags",
		"add field Entity",
		"add field Field",
		"add field Name",
		"add field Color with type color",
		"add field Accepted group related to many Group using Label",
		"add field Button label",
		"add field Position with type number",
		"add field Default with type boolean",
		"add field Comment with type boolean",
		"entity Status has many Status called Children",
		"entity status has many Translation called Translations",
		"select entity translation",
		"add field Language",
		"add field Value",
		"create entity Robot",
		"set icon android",
		"add field Current status with type enum and values CONNECTED, DISCONNECTED, WORKING",
		"add field Name",
		"add field Api credentials related to api credentials using client name",
		"add field Comment with type regular text",
		"create entity Task",
		"set icon cogs",
		"add component status with name State",
		"add field Title",
		"set field Title required",
		"add field Type with type enum and values Manual, Automatic and default value Manual",
		"add field Planned date with type date",
		"add field Execution start date with type date",
		"add field Execution finish date with type date",
		"add field Duration with type decimal",
		"add field Data flow with type regular text",
		"add field Robot related to Robot using Name",
		"add field Program file with type file",
		"add field Procedure with type regular text",
		"add component localfilestorage with name Documents",
		"create entity Media",
		"set icon envelope",
		"add field Type with type enum and values Mail, Notification, SMS, Task",
		"add field Name",
		"set field Name required",
		"add field Target entity",
		"entity Media has one Media Mail",
		"entity Media has one Media Notification",
		"entity Media has one Media SMS",
		"entity Media has one Media Task",
		"select entity media task",
		"add field Task name",
		"add field Task type with type enum and values Manual, Automatic and default value Manual",
		"add field Assignment logic",
		"add field Program file with type file",
		"add field Data flow with type text",

		"entity status has many Action called Actions",
		"select entity action",
		"add field Media related to Media using name",
		"add field Order with type number",
		"add field Execution with type enum and values Immédiate, Différée with default value Immédiate",
		"select entity media mail",
		"add field To",
		"add field Cc",
		"add field Cci",
		"add field From",
		"add field Attachments",
		"add field Subject",
		"add field Content with type text",
		"select entity media notification",
		"add field Title",
		"add field Description",
		"add field Icon",
		"add field Color with type color",
		"add field targets",
		"add entity Notification",
		"add field Title",
		"add field Description",
		"add field URL",
		"add field Color with type color",
		"add field Icon",
		"select entity media SMS",
		"add field Message with type text",
		"add field Phone numbers",
		"entity user has many notification",
		"entity notification has many user",

		// Inline help
		"add entity Inline Help",
		"set icon question-circle-o",
		"add field Entity",
		"add field Field",
		"add field Content with type text"
	];

	// Set default theme if different than blue-light
	if(typeof req.session.defaultTheme !== "undefined" && req.session.defaultTheme != "blue-light")
		instructions.push("set theme "+req.session.defaultTheme);

	// Set home module selected
	instructions.push("select module home");

	// Needed for translation purpose
	const {__} = require("../services/language")(req.session.lang_user); // eslint-disable-line

	(async () => {
		for (let i = 0; i < instructions.length; i++) {
			await execute(req, instructions[i], __, {}, false); // eslint-disable-line
			pourcent_generation[req.session.passport.user.id] = i == 0 ? 1 : Math.floor(i * 100 / instructions.length);
		}
		metadata.getApplication(req.session.app_name).save();
		await structure_application.initializeApplication(metadata.getApplication(req.session.app_name));
	})().then(_ => {
		// Build API documentation
		docBuilder.build(metadata.getApplication(req.session.app_name));
		res.redirect('/application/preview/' + req.session.app_name);
	}).catch(err => {
		console.error(err);
		req.session.toastr = [{
			message: err,
			level: "error"
		}];
		return res.redirect('/default/home');
	});
});

router.get('/get_pourcent_generation', (req, res) => {
	res.json({
		pourcent: pourcent_generation[req.session.passport.user.id]
	});
});

// Application import
router.get('/import', block_access.isLoggedIn, (req, res) => {
	res.render('front/import');
});

router.post('/import', block_access.isLoggedIn, (req, res) => {
	multer().fields([{
		name: 'zipfile',
		maxCount: 1
	}, {
		name: 'sqlfile',
		maxCount: 1
	}])(req, res, err => {
		if (err)
			console.error(err);

		let infoText = '';

		(async() => {
			const {__} = require("../services/language")(req.session.lang_user); // eslint-disable-line

			// Generate standard app
			const data = await execute(req, "add application " + req.body.appName, __);
			const workspacePath = __dirname + '/../workspace/' + data.options.value;

			// Delete generated workspace folder
			helpers.rmdirSyncRecursive(workspacePath);
			fs.mkdirsSync(workspacePath);

			// Write zip file to system
			fs.writeFileSync('importArchive.zip', req.files['zipfile'][0].buffer);
			// Extract zip file content
			await new Promise((resolve, reject) => {
				fs.createReadStream('./importArchive.zip')
					.pipe(unzip.Extract({path: workspacePath}))
					.on('close', resolve).on('error', reject);
			});
			// Delete temporary zip file
			fs.unlinkSync('importArchive.zip');

			let oldAppName = false;

			const metadataContent = JSON.parse(fs.readFileSync(workspacePath+'/config/metadata.json'));
			oldAppName = Object.keys(metadataContent)[0];
			const appRegex = new RegExp(oldAppName, 'g');
			if(!oldAppName) {
				infoText += '- Unable to find metadata.json in .zip.<br>';
				return null;
			}

			// Need to modify so file content to change appName in it
			const fileToReplace = ['/config/metadata.json', '/config/database.js'];
			for (let i = 0; i < fileToReplace.length; i++) {
				let content = fs.readFileSync(workspacePath + fileToReplace[i], 'utf8');
				content = content.replace(appRegex, data.options.value);
				fs.writeFileSync(workspacePath + fileToReplace[i], content);
			}

			infoText += '- The application is ready to be launched.<br>';

			// Executing SQL file if exist
			if(typeof req.files['sqlfile'] === 'undefined')
				return data.options.value;

			// Saving tmp sql file
			const sqlFilePath = __dirname + '/../sql/' + req.files['sqlfile'][0].originalname;
			fs.writeFileSync(sqlFilePath, req.files['sqlfile'][0].buffer);

			// Getting workspace DB conf
			const dbConfig = require(workspacePath + '/config/database'); // eslint-disable-line

			const cmd = "mysql";
			const cmdArgs = [
				"-u",
				dbConfig.user,
				"-p" + dbConfig.password,
				dbConfig.database,
				"-h" + dbConfig.host,
				"--default-character-set=utf8",
				"<",
				sqlFilePath
			];

			function handleExecStdout(cmd, args) {
				return new Promise((resolve, reject) => {
					// Exec instruction
					const childProcess = exec.spawn(cmd, args, {shell: true, detached: true});
					childProcess.stdout.setEncoding('utf8');
					childProcess.stderr.setEncoding('utf8');

					// Child Success output
					childProcess.stdout.on('data', stdout => {
						console.log(stdout)
					})

					// Child Error output
					childProcess.stderr.on('data', stderr => {
						// Avoid reject if only warning
						if (stderr.toLowerCase().indexOf("warning") != -1) {
							console.log("!! mysql ignored warning !!: " + stderr)
							return;
						}
						childProcess.kill();
						reject(stderr);
					})

					// Child error
					childProcess.on('error', error => {
						childProcess.kill();
						reject(error);
					})

					// Child close
					childProcess.on('close', _ => {
						resolve();
					})
				})
			}

			try {
				await handleExecStdout(cmd, cmdArgs);
				infoText += '- The SQL file has been successfully executed.<br>';
			} catch(err) {
				console.error('Error while executing SQL file in the application.');
				console.error(err);
				infoText += '- An error while executing SQL file in the application:<br>';
				infoText += err;
			}

			// Delete tmp sql file
			fs.unlinkSync(sqlFilePath);

			return data.options.value;
		})().then(appName => {
			res.render('front/import', {
				infoText: infoText,
				appName: appName
			});
		}).catch(err => {
			console.error(err);
			infoText += '- An error occured during the process:<br>';
			infoText += err;
			res.render('front/import', {
				infoText: infoText
			});
		});
	});
});

router.get('/export/:app_name', block_access.hasAccessApplication, (req, res) => {
	// We know what directory we want
	const workspacePath = __dirname + '/../workspace/' + req.params.app_name;

	const zip = new JSZip();
	helpers.buildZipFromDirectory(workspacePath, zip, workspacePath);

	// Generate zip file content
	zip.generateAsync({
		type: 'nodebuffer',
		comment: 'ser-web-manangement',
		compression: "DEFLATE",
		compressionOptions: {
			level: 9
		}
	}).then(zipContent => {

		// Create zip file
		fs.writeFileSync(workspacePath + '.zip', zipContent);
		res.download(workspacePath + '.zip', req.params.app_name + '.zip', err => {
			if(err)
				console.error(err);
			fs.unlinkSync(workspacePath + '.zip')
		});
	});
});

module.exports = router;
