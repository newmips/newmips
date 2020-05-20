const express = require('express');
const router = express.Router();
const multer = require('multer');
const readline = require('readline');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const dataHelper = require('../utils/data_helper');
const block_access = require('../utils/block_access');
const designer = require('../services/designer.js');
const session_manager = require('../services/session.js');
const parser = require('../services/bot.js');
const structure_application = require('../structure/structure_application');
const jschardet = require('jschardet');
const process_manager = require('../services/process_manager.js');
const metadata = require('../database/metadata')();

const scriptProcessing = {
	timeout: moment(),
	state: false
};
const scriptData = {};

const mandatoryInstructions = [
	"create module home",
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
	"entity Role has many User",
	"entity Group has many User",
	"add entity API credentials",
	"add field Client Name",
	"add field Client Key",
	"add field Client Secret",
	"add field Token",
	"add field Token timeout TMSP",
	"set icon key",
	"add field role related to many Role using label",
	"add field group related to many Group using label",
	"add entity Synchronization",
	"add field Journal backup file",
	"entity Synchronization has one API credentials",
	"add entity Synchro credentials",
	"add field Cloud host with type url",
	"add field Client key",
	"add field Client secret",
	"add widget stat on entity User",
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
	"entity Status has many Translation called Translations",
	"select entity translation",
	"add field Language",
	"add field Value",
	"create entity Media",
	"set icon envelope",
	"add field Type with type enum and values Mail, Notification, SMS, Task",
	"add field Name",
	"set field Name required",
	"add field Target entity",
	"entity status has many Action called Actions",
	"select entity action",
	"add field Media related to Media using name",
	"add field Order with type number",
	"add field Execution with type enum and values Immédiate, Différée with default value Immédiate",
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
	"add component file storage with name Documents",
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
	"add field Message with type regular text",
	"add field Phone numbers",
	"add entity Inline Help",
	"set icon question-circle-o",
	"add field Entity",
	"add field Field",
	"add field Content with type text",
	"entity user has many notification",
	"entity notification has many user",
	"add param entity User Guide",
	"set icon book",
	"add field File with type file",
	"select module home"
];

// When a script handling is over
function processEnd(path, userID) {
	// Delete instructions file
	if (fs.existsSync(path))
		fs.unlinkSync(path);
	// Tell client that the script is over
	scriptData[userID].over = true;
	// Tell the server that script processing is done
	scriptProcessing.state = false;
	// Save application metadata if exist
	if(scriptData[userID].data && scriptData[userID].data.application)
		scriptData[userID].data.application.save();
}

// Check if a script is already running
function isProcessing(userID, __) {
	if(scriptProcessing.state && moment().diff(scriptProcessing.timeout, 'seconds') < 100){
		scriptData[userID].answers = [{
			message: __('instructionScript.alreadyProcessing')
		}];
		scriptData[userID].overDueToProcessing = true;
		return true;
	}
	return false;
}

// Executing one instruction
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

	if(typeof req.session.gitlab !== 'undefined'
		&& typeof req.session.gitlab.user !== 'undefined'
		&& !isNaN(req.session.gitlab.user.id))
		data.gitlabUser = req.session.gitlab.user;

	if(data.function != 'createNewApplication' && data.function != 'deleteApplication')
		data.application = metadata.getApplication(data.app_name);

	const info = await designer[data.function](data);

	data = session_manager.setSession(data.function, req, info, data);

	// Save metadata
	if(data.application && data.function != 'deleteApplication' && saveMetadata)
		data.application.save();

	data.message = info.message;
	data.messageParams = info.messageParams;

	return data;
}

// Execution all the script
function executeFile(req, userID, __) {

	// Open file descriptor
	const rl = readline.createInterface({
		input: fs.createReadStream(req.file.path)
	});

	/* If one of theses value is to 2 after readings all lines then there is an error,
	line to 1 are set because they are mandatory lines added by the generator */
	const exceptions = {
		createNewApplication : {
			error: 0,
			errorMessage: "You can't create or select more than one application in the same script."
		},
		createModuleHome: {
			error: 1,
			errorMessage: "You can't create a module home, because it's a default module in the application."
		},
		createModuleAuthentication: {
			error: 1,
			errorMessage: "You can't create a module authentication, because it's a default module in the application."
		},
		createEntityUser: {
			error: 1,
			errorMessage: "You can't create a entity user, because it's a default entity in the application."
		},
		createEntityRole: {
			error: 1,
			errorMessage: "You can't create a entity role, because it's a default entity in the application."
		},
		createEntityGroup: {
			error: 1,
			errorMessage: "You can't create a entity group, because it's a default entity in the application."
		},
		setFieldUnique: {
			error: 1,
			errorMessage: "You can't set a field unique in a script, please execute the instruction in preview."
		},
		delete: {
			error: 1,
			errorMessage: "Please do not use delete instruction in script mode."
		}
	};

	// Read file line by line, check for empty line, line comment, scope comment
	let fileLines = [];
	let commenting = false;

	// Checking file
	let lineIdx = -1;
	rl.on('line', line => {
		// Empty line || One line comment scope
		if (line.trim() == '' || (line.indexOf('/*') != -1 && line.indexOf('*/') != -1 || line.indexOf('//*') != -1))
			return;

		// Comment scope start
		if (line.indexOf('/*') != -1 && !commenting)
			commenting = true;

		// Comment scope end
		else if (line.indexOf('*/') != -1 && commenting)
			commenting = false;

		else if (!commenting) {
			const positionComment = line.indexOf('//');
			// Line start with comment
			if (positionComment == 0)
				return;
			// Line comment is after or in the instruction
			if (positionComment != -1)
				line = line.substring(0, line.indexOf('//'));

			// Get the wanted function given by the bot to do some checks
			let parserResult;
			try {
				parserResult = parser.parse(line);
				lineIdx++;
			} catch (err) {
				// Update script logs
				scriptData[userID].answers.unshift({
					instruction: line,
					message: __(err.message, err.messageParams || []),
					error: true
				});
				return processEnd(req.file.path, userID);
			}

			const designerFunction = parserResult.function;

			let designerValue = '';
			if (typeof parserResult.options !== "undefined")
				designerValue = parserResult.options.value ? parserResult.options.value.toLowerCase() : '';

			if (designerFunction == "createNewApplication") {
				scriptData[userID].isNewApp = true;
				// Getting all new app instructions indexes
				if(typeof scriptData[userID].newAppIndexes === 'undefined')
					scriptData[userID].newAppIndexes = [];
				scriptData[userID].newAppIndexes.push(lineIdx);
			}

			if (designerFunction == "createNewApplication" || designerFunction == "selectApplication")
				exceptions.createNewApplication.nbAuthorized++;

			if(designerFunction == "createNewModule" && designerValue == "home")
				exceptions.createModuleHome.nbAuthorized++;

			if(designerFunction == "createNewModule" && designerValue == "authentication")
				exceptions.createModuleAuthentication.nbAuthorized++;

			if(designerFunction == "createNewEntity" && designerValue == "user")
				exceptions.createEntityUser.nbAuthorized++;

			if(designerFunction == "createNewEntity" && designerValue == "role")
				exceptions.createEntityRole.nbAuthorized++;

			if(designerFunction == "createNewEntity" && designerValue == "group")
				exceptions.createEntityGroup.nbAuthorized++;

			if(typeof designerFunction !== 'undefined' && designerFunction.indexOf('delete') != -1)
				exceptions.delete.nbAuthorized++;

			fileLines.push(line);
		}
	});

	// All lines read, execute instructions
	rl.on('close', async () => {

		if(scriptData[userID].over)
			return;

		let errorMsg = '';
		for(const item in exceptions){
			if(item == "createNewApplication" && exceptions[item].value == 0)
				errorMsg += 'You have to create or select an application in your script.<br><br>';
			if(exceptions[item].value > 1)
				errorMsg += exceptions[item].errorMessage + '<br><br>';
		}

		// File content not valid
		if(errorMsg.length > 0){
			scriptData[userID].answers = [];
			scriptData[userID].answers.push({
				message: errorMsg
			});
			return processEnd(req.file.path, userID);
		}

		scriptData[userID].totalInstruction = fileLines.length;

		// If new app created, then add mandatory instructions
		if(scriptData[userID].isNewApp) {
			const newFileLines = [];
			for (let i = 0; i < fileLines.length; i++) {
				newFileLines.push(fileLines[i]);
				if(scriptData[userID].newAppIndexes.indexOf(i) != -1) {
					scriptData[userID].totalInstruction += mandatoryInstructions.length;
					newFileLines.push(...mandatoryInstructions);
				}
			}
			fileLines = newFileLines;
		}

		// Set default theme if different than blue-light
		if (typeof req.session.defaultTheme !== "undefined" && req.session.defaultTheme != "blue-light")
			fileLines.push("set theme " + req.session.defaultTheme);

		let currentApplication;
		// Executing all instructions !
		for (let i = 0; i < fileLines.length; i++) {
			// Re-create data object to avoid custom parameters set in bot being used multiple times
			let data = {
				app_name: req.session.app_name,
				module_name: req.session.module_name,
				entity_name: req.session.entity_name,
				googleTranslate: req.session.toTranslate || false,
				lang_user: req.session.lang_user,
				currentUser: req.session.passport.user,
				gitlabUser: null,
				isGeneration: true,
				application: currentApplication,
			}

			// Mandatory instructions are done, then init application before continuing
			if(i == mandatoryInstructions.length + 1) {
				await structure_application.initializeApplication(data.application); // eslint-disable-line
				// Write source script in generated workspace
				const historyPath = __dirname + '/../workspace/' + data.application.name + "/history_script.nps";
				let instructionsToWrite = fileLines[0] + '\n';
				instructionsToWrite += fileLines.slice(Math.max(mandatoryInstructions.length, 1)).join("\n");
				instructionsToWrite += "\n\n// --- End of the script --- //\n\n";
				fs.writeFileSync(historyPath, instructionsToWrite);
			}

			try {
				data = await execute(req, fileLines[i], __, data, false); // eslint-disable-line

				if (data.application)
					currentApplication = data.application;
			} catch(err) {
				console.trace(err);
				// Update script logs
				scriptData[userID].answers.unshift({
					instruction: fileLines[i],
					message: __(err.message, err.messageParams || []),
					error: true
				});
				return processEnd(req.file.path, userID);
			}

			scriptData[userID].data = data;
			scriptData[userID].doneInstruction++;

			// Update script logs
			scriptData[userID].answers.unshift({
				instruction: fileLines[i],
				message: __(data.message, data.messageParams || [])
			});
		}

		try {
			// Workspace sequelize instance
			delete require.cache[require.resolve(__dirname + '/../workspace/' + currentApplication.name + '/models/')]; // eslint-disable-line
			const workspaceSequelize = require(__dirname + '/../workspace/' + currentApplication.name + '/models/'); // eslint-disable-line

			// We need to clear toSync.json
			const toSyncFileName = __dirname + '/../workspace/' + currentApplication.name + '/models/toSync.json';
			const toSyncObject = JSON.parse(fs.readFileSync(toSyncFileName));

			let tableName = "TABLE_NAME"; // MySQL
			if(workspaceSequelize.sequelize.options.dialect == "postgres")
				tableName = "table_name";

			// Looking for already exisiting table in workspace BDD
			const result = await workspaceSequelize.sequelize.query("SELECT * FROM INFORMATION_SCHEMA.TABLES;", {type: workspaceSequelize.sequelize.QueryTypes.SELECT});
			const workspaceTables = [];
			for (let i = 0; i < result.length; i++)
				workspaceTables.push(result[i][tableName]);

			for(const entity in toSyncObject)
				if(workspaceTables.indexOf(entity) == -1 && !toSyncObject[entity].force){
					toSyncObject[entity].attributes = {};
					// We have to remove options from toSync.json that will be generate with sequelize sync
					// But we have to keep relation toSync on already existing entities
					if (typeof toSyncObject[entity].options !== "undefined") {
						const cleanOptions = [];
						for (let i = 0; i < toSyncObject[entity].options.length; i++)
							if (workspaceTables.indexOf(toSyncObject[entity].options[i].target) != -1 && toSyncObject[entity].options[i].relation != "belongsTo")
								cleanOptions.push(toSyncObject[entity].options[i]);
						toSyncObject[entity].options = cleanOptions;
					}
				}
			fs.writeFileSync(toSyncFileName, JSON.stringify(toSyncObject, null, 4), 'utf8');
		} catch(err) {
			console.error(err);
		}

		// Kill the application server if it's running, it will be restarted when accessing it
		const process_server_per_app = process_manager.process_server_per_app;
		if (process_server_per_app[currentApplication.name] != null && typeof process_server_per_app[currentApplication.name] !== "undefined"){
			await process_manager.killChildProcess(process_server_per_app[currentApplication.name].pid)
			process_server_per_app[currentApplication.name] = null;
		}

		// Delete instructions file
		return processEnd(req.file.path, userID);
	});
}

router.get('/index', block_access.isLoggedIn, (req, res) => {
	res.render('front/instruction_script');
});

// Execute script file
router.post('/execute', block_access.isLoggedIn, multer({
	dest: './upload/'
}).single('instructions'), (req, res) => {

	const userID = req.session.passport.user.id;
	const __ = require("../services/language")(req.session.lang_user).__; // eslint-disable-line

	// Init scriptData object for user. (session simulation)
	scriptData[userID] = {
		over: false,
		answers: [],
		doneInstruction: 0,
		totalInstruction: 0,
		isNewApp: false
	};

	// Script already processing
	if(isProcessing(userID, __)) {
		processEnd(req.file.path, userID);
		return res.end();
	}

	scriptProcessing.state = true;
	scriptProcessing.timeout = moment();

	// Get file extension
	let extensionFile = req.file.originalname.split(".");
	extensionFile = extensionFile[extensionFile.length - 1];
	// Read file to determine encoding
	const encoding = jschardet.detect(fs.readFileSync(req.file.path));
	const acceptedEncoding = ['utf-8', 'windows-1252', 'ascii'];
	// If extension or encoding is not supported, send error
	if (extensionFile != 'txt' && extensionFile != 'nps' || acceptedEncoding.indexOf(encoding.encoding.toLowerCase()) == -1) {
		scriptData[userID].answers.push({
			message: "File need to have .nps or .txt extension and utf8 or ascii encoding.<br>Your file have '"+extensionFile+"' extension and '"+encoding.encoding+"' encoding"
		});
		processEnd(req.file.path, userID);
		return res.end();
	}

	// Answer to client, next steps will be handle in ajax
	res.end();

	try {
		executeFile(req, userID, __);
	} catch (err) {
		console.error(err);
		return processEnd(req.file.path, userID);
	}
});

/* Execute when it's not a file upload but a file written in textarea */
router.post('/execute_alt', block_access.isLoggedIn, function(req, res) {

	const userID = req.session.passport.user.id;
	const __ = require("../services/language")(req.session.lang_user).__; // eslint-disable-line

	// Init scriptData object for user. (session simulation)
	scriptData[userID] = {
		over: false,
		answers: [],
		doneInstruction: 0,
		totalInstruction: 0,
		isNewApp: false
	};

	// Script already processing
	if(isProcessing(userID, __)) {
		processEnd(null, userID);
		return res.end();
	}

	scriptProcessing.state = true;
	scriptProcessing.timeout = moment();

	const tmpFilename = moment().format('YY-MM-DD-HH_mm_ss') + "_custom_script.nps";
	const tmpPath = __dirname + '/../upload/' + tmpFilename;

	// Load template script and unzip master file if application is created using template
	const templateEntry = req.body.template_entry;
	fs.openSync(tmpPath, 'w');

	if(templateEntry){
		let templateLang;
		switch(req.session.lang_user.toLowerCase()) {
			case "fr-fr":
				templateLang = "fr";
				break;
			case "en-en":
				templateLang = "en";
				break;
			default:
				templateLang = "fr";
				break;
		}

		const files = fs.readdirSync(__dirname + "/../templates/" + templateEntry);
		let filename = false;

		for (let i = 0; i < files.length; i++)
			if (files[i].indexOf(".nps") != -1)
				if (!filename)
					filename = path.join(__dirname + "/../templates/" + templateEntry, files[i]);
				else if (files[i].indexOf("_" + templateLang + "_") != -1)
					filename = path.join(__dirname + "/../templates/" + templateEntry, files[i]);

		if(!filename){
			scriptData[userID].answers = [{
				message: __('template.no_script')
			}];
			processEnd(null, userID);
			return res.end();
		}

		// Write template script in the tmpPath
		fs.writeFileSync(tmpPath, fs.readFileSync(filename));
	} else
		fs.writeFileSync(tmpPath, req.body.text);

	// Answer to client, next steps will be handle in ajax
	res.end();

	try {
		req.file = {
			path: tmpPath
		};
		executeFile(req, userID, __);
	} catch (err) {
		console.error(err);
		return processEnd(null, userID);
	}
});

// Script execution status
router.get('/status', (req, res) => {
	try {
		const userID = req.session.passport.user.id;
		res.send(scriptData[userID]).end();
		// Clean answers that will be shown in the client
		scriptData[userID].answers = [];
		if(scriptData[userID].over)
			delete scriptData[userID];
	} catch(err) {
		console.error(err);
		res.send({
			skip: true
		}).end();
	}
});

module.exports = router;