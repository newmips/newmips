const fs = require("fs-extra");
const helpers = require('../utils/helpers');
const domHelper = require('../utils/jsDomHelper');
const translateHelper = require("../utils/translate");
const path = require("path");
const mysql = require('promise-mysql');
const {Client} = require('pg');

// Gitlab
const globalConf = require('../config/global.js');
const code_platform = require('../services/code_platform');

const dbConf = require('../config/database.js');
const studio_manager = require('../services/studio_manager');
const models = require('../models/');
const exec = require('child_process').exec;

function installAppModules(data) {
	return new Promise((resolve, reject) => {

		// Mandatory workspace folder
		if (!fs.existsSync(__workspacePath))
			fs.mkdirSync(__workspacePath);

		if (fs.existsSync(__dirname + '/../workspace/node_modules')) {
			console.log("Everything's ok about global workspaces node modules.");

			if (typeof data !== "undefined") {
				/* When we are in the "npm install" instruction from preview */
				let command = "npm install";
				console.log(data.specificModule)
				if (data.specificModule)
					command += " " + data.specificModule;

				console.log("Executing " + command + " in application: " + data.application.name + "...");

				exec(command, {
					cwd: __dirname + '/../workspace/' + data.application.name + '/'
				}, err => {
					if (err)
						return reject(err);
					console.log('Application ' + data.application.name + ' node modules successfully installed !');
					resolve();
				});
			} else {
				resolve();
			}
		} else {
			// We need to reinstall node modules properly
			console.log("Workspaces node modules initialization...");
			fs.copySync(path.join(__dirname, 'template', 'package.json'), path.join(__dirname, '..', 'workspace', 'package.json'))

			exec('npm install', {
				cwd: __dirname + '/../workspace/'
			}, err => {
				if (err){
					console.error(err)
					return reject(err);
				}
				console.log('Workspaces node modules successfuly initialized.');
				resolve();
			});
		}
	});
}
exports.installAppModules = installAppModules;

// Application
exports.setupApplication = async (data) => {

	const appName = data.options.value;
	const appDisplayName = data.options.showValue;

	try {
		await installAppModules();
	} catch(err) {
		console.error(err);
		throw new Error("An error occurred while initializing the node modules.");
	}

	// *** Copy template folder to new workspace ***
	fs.copySync(__dirname + '/template/', __dirname + '/../workspace/' + appName);

	await translateHelper.writeLocales(appName, "application", null, appDisplayName, data.googleTranslate);

	// Add appname to application.json
	const applicationJSON = JSON.parse(fs.readFileSync(__dirname + '/../workspace/' + appName + '/config/application.json', 'utf8'));
	applicationJSON.appname = appName;
	fs.writeFileSync(__dirname + '/../workspace/' + appName + '/config/application.json', JSON.stringify(applicationJSON, null, 4), 'utf8');

	// Create database instance for application
	let conn, db_requests = [];
	if(dbConf.dialect == 'mysql' || dbConf.dialect == 'mariadb') {

		db_requests = [
			"CREATE DATABASE IF NOT EXISTS `np_" + appName + "` DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;",
			"CREATE USER IF NOT EXISTS 'np_" + appName + "'@'127.0.0.1' IDENTIFIED BY 'np_" + appName + "';",
			"CREATE USER IF NOT EXISTS 'np_" + appName + "'@'%' IDENTIFIED BY 'np_" + appName + "';",
			"GRANT ALL PRIVILEGES ON `np_" + appName + "`.* TO 'np_" + appName + "'@'127.0.0.1';",
			"GRANT ALL PRIVILEGES ON `np_" + appName + "`.* TO 'np_" + appName + "'@'%';",
			"GRANT ALL PRIVILEGES ON `np_" + appName + "`.* TO '" + dbConf.user + "'@'127.0.0.1';",
			"GRANT ALL PRIVILEGES ON `np_" + appName + "`.* TO '" + dbConf.user + "'@'%';"
		];

		// if(dbConf.dialect == 'mysql') {
		// 	db_requests.push("ALTER USER 'np_" + appName + "'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'np_" + appName + "';");
		// 	db_requests.push("ALTER USER 'np_" + appName + "'@'%' IDENTIFIED WITH mysql_native_password BY 'np_" + appName + "';");
		// }

		db_requests.push("FLUSH PRIVILEGES;");

		conn = await mysql.createConnection({
			host: dbConf.host,
			user: dbConf.user,
			password: dbConf.password,
			port: dbConf.port
		});
	} else if(dbConf.dialect == 'postgres') {
		db_requests = [
			"CREATE DATABASE \"np_" + appName + "\" ENCODING 'UTF8';",
			"CREATE USER \"np_" + appName + "\" WITH PASSWORD 'np_" + appName + "';",
			"GRANT ALL PRIVILEGES ON DATABASE \"np_" + appName + "\" TO \"np_" + appName + "\";",
			"GRANT ALL PRIVILEGES ON DATABASE \"np_" + appName + "\" TO " + dbConf.user + ";"
		];
		conn = new Client({
			host: dbConf.host,
			user: dbConf.user,
			password: dbConf.password,
			database: dbConf.database,
			port: dbConf.port
		});
		conn.connect();
	}

	for (let i = 0; i < db_requests.length; i++) {
		try {
			await conn.query(db_requests[i]); // eslint-disable-line
		} catch(err) {
			// Postgres error about db user that already exist, indeed postgres do not handle the 'IF NOT EXISTS' syntax...
			if(dbConf.dialect != 'postgres' || err.code != '42710'){
				console.error(err);
				throw new Error("An error occurred while initializing the workspace database.");
			}
		}
	}

	conn.end();

	// Update workspace database config file to point on the new separate DB
	let appDatabaseConfig = fs.readFileSync(__dirname + '/../workspace/' + appName + '/config/database.js', 'utf8');
	appDatabaseConfig = appDatabaseConfig.replace(/newmips/g, 'np_' + appName, 'utf8');
	fs.writeFileSync(__dirname + '/../workspace/' + appName + '/config/database.js', appDatabaseConfig);

	// Create the application on distant repository ?
	if (!code_platform.config.enabled)
		return false;

	if(!data.code_platform || !data.code_platform.user)
		throw new Error('code_platform.error.user_not_in_session');

	// Get current env admin for project creation
	const admin = await models.User.findByPk(1);
	const code_platform_admin_user = await code_platform.getUser(admin);

	// Admin user gitlab account isn't confirmed
	if(!code_platform_admin_user.confirmed_at)
		throw new Error('code_platform.error.admin_not_confirmed')

	// User do not confirm it's gitlab account yet
	if(!data.code_platform.user.confirmed_at) {
		// Verify if it's true
		const currentUser = await code_platform.getUser(data.code_platform.user);
		if(!currentUser.confirmed_at)
			throw new Error('code_platform.error.user_not_confirmed');
	}

	let newProject
	try {
		newProject = await code_platform.createProject(globalConf.host.replace(/\./g, "-") + "-" + appName.substring(2), code_platform_admin_user);
	} catch(err){
		console.error(err);
		throw new Error('code_platform.error.project_creation');
	}
	// Adding gitlab repo ID to metadata
	data.application.repoID = newProject.id;

	// Add current user to project, if connected user is not admin
	if(code_platform_admin_user.id != data.code_platform.user.id)
		await code_platform.addUserToProject(data.code_platform.user, newProject);

	return newProject;
}

async function finalizeApplication(application) {

	const appPath = __workspacePath + '/' + application.name;

	// Reset toSync file
	fs.writeFileSync(appPath + '/models/toSync.json', JSON.stringify({}, null, 4), 'utf8');

	const workspaceSequelize = require(appPath + '/models/'); // eslint-disable-line

	await workspaceSequelize.sequelize.sync({
		logging: false,
		hooks: false
	});

	// Create application's DNS through studio_manager
	if (globalConf.env == 'studio') {
		const db_app = await models.Application.findOne({
			name: application.name
		});
		studio_manager.createApplicationDns(application.name.substring(2), db_app.id);
	}

	return true;
}

async function initializeWorkflow(application) {
	const statusPiecesPath = __dirname + '/pieces/component/status';
	const workspacePath = __dirname + '/../workspace/' + application.name;

	// Replace default role & groupe option to set belongsToMany with user entity
	fs.writeFileSync(workspacePath + '/models/options/e_role.json', JSON.stringify([{
		"target": "e_user",
		"relation": "belongsToMany",
		"foreignKey": "fk_id_e_role",
		"as": "r_user",
		"showAs": "User",
		"through": "1_role",
		"otherKey": "fk_id_e_user",
		"structureType": "hasMany"
	}], null, 4), 'utf8');

	fs.writeFileSync(workspacePath + '/models/options/e_group.json', JSON.stringify([{
		"target": "e_user",
		"relation": "belongsToMany",
		"foreignKey": "fk_id_e_group",
		"as": "r_user",
		"showAs": "User",
		"through": "2_group",
		"otherKey": "fk_id_e_user",
		"structureType": "hasMany"
	}], null, 4), 'utf8');

	// Clean useless auto_generate key in user option about role and group hasMany/BelongsTo
	let userOptions = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_user.json'));
	userOptions = userOptions.filter(x => {
		if(['e_role', 'e_group'].indexOf(x.target) != -1 && x.structureType == 'auto_generate')
			return false;
		return true;
	});
	fs.writeFileSync(workspacePath + '/models/options/e_user.json', JSON.stringify(userOptions, null, 4), 'utf8');

	// Remove existing has many from Status, the instruction is only used to generate the tab and views
	const statusModel = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_status.json'));
	for (let i = 0; i < statusModel.length; i++)
		if (statusModel[i].target == 'e_status') {
			statusModel.splice(i, 1);
			break;
		}

	// Create Status belongsToMany with itself as target
	statusModel.push({
		relation: 'belongsToMany',
		target: 'e_status',
		through: application.associationSeq + '_status_children',
		foreignKey: 'fk_id_parent_status',
		otherKey: 'fk_id_child_status',
		as: 'r_children'
	});

	fs.writeFileSync(workspacePath + '/models/options/e_status.json', JSON.stringify(statusModel, null, 4), 'utf8');

	// Status models pieces
	fs.copySync(statusPiecesPath + '/models/e_status.js', workspacePath + '/models/e_status.js');

	// Copy views pieces
	const toCopyViewFolders = ['e_status', 'e_media', 'e_media_mail', 'e_media_notification', 'e_media_sms', 'e_media_task', 'e_translation', 'e_action'];
	for (const folder of toCopyViewFolders)
		fs.copySync(statusPiecesPath + '/views/' + folder, workspacePath + '/views/' + folder);

	// Copy routes
	fs.copySync(statusPiecesPath + '/routes/', workspacePath + '/routes/');
	// Copy API routes
	fs.copySync(statusPiecesPath + '/api/', workspacePath + '/api/');

	// Remove notification views
	fs.removeSync(workspacePath + '/views/e_notification');

	const mediaModels = [
		'e_media.js',
		'e_media_mail.js',
		'e_media_notification.js',
		'e_media_sms.js',
		'e_media_task.js',
		'e_task.js'
	];

	for (let i = 0; i < mediaModels.length; i++)
		fs.copySync(statusPiecesPath + '/models/' + mediaModels[i], workspacePath + '/models/' + mediaModels[i]);

	// Write new locales trees
	const newLocalesEN = JSON.parse(fs.readFileSync(statusPiecesPath + '/locales/global_locales_EN.json'));
	translateHelper.writeTree(application.name, newLocalesEN, 'en-EN');
	const newLocalesFR = JSON.parse(fs.readFileSync(statusPiecesPath + '/locales/global_locales_FR.json'));
	translateHelper.writeTree(application.name, newLocalesFR, 'fr-FR');

	// Write enum traductions
	translateHelper.writeEnumTrad(application.name, 'e_media', 'f_type', 'task', 'Tâche', 'fr-FR');
	translateHelper.writeEnumTrad(application.name, 'e_task', 'f_type', 'manual', 'Manuelle', 'fr-FR');
	translateHelper.writeEnumTrad(application.name, 'e_task', 'f_type', 'automatic', 'Automatique', 'fr-FR');
	translateHelper.writeEnumTrad(application.name, 'e_media_task', 'f_task_type', 'manual', 'Manuelle', 'fr-FR');
	translateHelper.writeEnumTrad(application.name, 'e_media_task', 'f_task_type', 'automatic', 'Automatique', 'fr-FR');
	translateHelper.writeEnumTrad(application.name, 'e_robot', 'f_current_status', 'connected', 'CONNECTÉ', 'fr-FR');
	translateHelper.writeEnumTrad(application.name, 'e_robot', 'f_current_status', 'disconnected', 'DÉCONNECTÉ', 'fr-FR');
	translateHelper.writeEnumTrad(application.name, 'e_robot', 'f_current_status', 'working', 'EN COURS', 'fr-FR');

	return await finalizeApplication(application);
}

exports.initializeApplication = async(application) => {

	const piecesPath = __dirname + '/pieces';
	const workspacePath = __dirname + '/../workspace/' + application.name;

	//
	// ACCESS AND SECURITY: USER / GROUP / ROLE
	//
	fs.copySync(piecesPath + '/administration/views/e_user/', workspacePath + '/views/e_user/');

	// Clean user show fields and remove tab view
	let $ = await domHelper.read(workspacePath + '/views/e_user/show_fields.dust');
	$("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset]").remove();
	const homeHtml = $("#home").html();
	$("#home").remove();
	$("#tabs").removeClass('.nav-tabs-custom').attr('id', 'home');
	$("#home").html(homeHtml);
	domHelper.write(workspacePath + '/views/e_user/show_fields.dust', $);

	// Clean user update fields
	$ = await domHelper.read(workspacePath + '/views/e_user/update_fields.dust');
	$("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();
	domHelper.write(workspacePath + '/views/e_user/update_fields.dust', $);

	// Copy inline-help route and views
	fs.copySync(piecesPath + '/routes/e_inline_help.js', workspacePath + '/routes/e_inline_help.js');
	fs.copySync(piecesPath + '/views/e_inline_help/', workspacePath + '/views/e_inline_help/');

	// Copy user / role / group routes into app
	fs.copySync(piecesPath + '/administration/routes', workspacePath + '/routes');

	// Make fields unique
	function uniqueField(entity, field) {
		const model = JSON.parse(fs.readFileSync(workspacePath + '/models/attributes/' + entity + '.json', 'utf8'));
		model[field].unique = true;
		fs.writeFileSync(workspacePath + '/models/attributes/' + entity + '.json', JSON.stringify(model, null, 4), 'utf8');
	}
	uniqueField('e_user', 'f_login');
	uniqueField('e_role', 'f_label');
	uniqueField('e_group', 'f_label');

	// Manualy add custom menus to access file because it's not a real entity
	const access = JSON.parse(fs.readFileSync(workspacePath + '/config/access.json', 'utf8'));
	const arrayKey = [
		"access_settings",
		"db_tool",
		"import_export",
		"access_tool",
		"access_settings_role",
		"access_settings_group",
		"access_settings_api",
		"api_documentation"
	];
	for (const key of arrayKey) {
		access.administration.entities.push({
			name: key,
			groups: ["admin"],
			actions: {
				read: ["admin"],
				create: ["admin"],
				update: ["admin"],
				delete: ["admin"]
			}
		});
	}
	fs.writeFileSync(workspacePath + '/config/access.json', JSON.stringify(access, null, 4), 'utf8');
	fs.writeFileSync(workspacePath + '/config/access.lock.json', JSON.stringify(access, null, 4), 'utf8');

	// Set role-group/user structureType to hasManyPreset to be used by ajax
	let opts = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_role.json', 'utf8'));
	opts[0].structureType = "hasManyPreset";
	opts[0].usingField = [{
		value: 'f_login',
		type: 'string'
	}];
	fs.writeFileSync(workspacePath + '/models/options/e_role.json', JSON.stringify(opts, null, 4), 'utf8');
	opts = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_group.json', 'utf8'));
	opts[0].structureType = "hasManyPreset";
	opts[0].usingField = [{
		value: 'f_login',
		type: 'string'
	}];
	fs.writeFileSync(workspacePath + '/models/options/e_group.json', JSON.stringify(opts, null, 4), 'utf8');

	//
	// SYNCHRONIZATION
	//
	// Delete and copy synchronization files/pieces
	const synchroViews = fs.readdirSync(workspacePath + '/views/e_synchronization');
	for (let i = 0; i < synchroViews.length; i++)
		fs.remove(workspacePath + '/views/e_synchronization/' + synchroViews[i], (err) => {
			if (err) console.error(err);
		});

	fs.copySync(piecesPath + '/component/synchronization/routes/e_synchronization.js', workspacePath + '/routes/e_synchronization.js');

	// API credentials must not be available to API calls, delete the file
	fs.unlinkSync(workspacePath + '/api/e_api_credentials.js');
	// Set french translation about API credentials
	translateHelper.updateLocales(application.name, "fr-FR", ["entity", "e_api_credentials", "label_entity"], "Identifiant d'API");

	// Set french translation for User Guide
	translateHelper.updateLocales(application.name, "fr-FR", ["entity", "e_user_guide", "label_entity"], "Guide utilisateur");
	translateHelper.updateLocales(application.name, "fr-FR", ["entity", "e_user_guide", "f_file"], "Fichier");

	return await initializeWorkflow(application);
}

const process_manager = require('../services/process_manager.js');
exports.deleteApplication = async(data) => {
	const app_name = data.application.name;
	// Kill spawned child process by preview
	const process_server = process_manager.process_server_per_app[app_name];
	const pathToWorkspace = __dirname + '/../workspace/' + app_name;
	const pathToAppLogs = __dirname + '/../workspace/logs/app_' + app_name + '.log';

	const nameAppWithoutPrefix = app_name.substring(2);
	const nameRepo = globalConf.host + "-" + nameAppWithoutPrefix;

	// Removing .toml file in traefik rules folder
	if (globalConf.env == 'studio') {
		try {
			fs.unlinkSync(__dirname + "/../workspace/rules/" + globalConf.sub_domain + "-" + nameAppWithoutPrefix + ".toml");
		} catch (err) {
			console.error(err);
		}
	}

	if (code_platform.config.enabled) {
		try {
			const project = await code_platform.getProjectByID(data.application.repoID);
			if (!project)
				console.error("Unable to find code project to delete.");
			else {
				const answer = await code_platform.deleteProject(project.id);
				console.log("Delete repository: " + nameRepo + " => " + JSON.stringify(answer));
			}
		} catch(err) {
			console.error(err);
		}
	}

	try {
		let conn;
		if(dbConf.dialect == 'mysql' || dbConf.dialect == 'mariadb') {
			conn = await mysql.createConnection({
				host: dbConf.host,
				user: dbConf.user,
				password: dbConf.password,
				port: dbConf.port
			});
			await conn.query("DROP DATABASE IF EXISTS `np_" + app_name + "`;");
			await conn.query("DROP USER IF EXISTS 'np_" + app_name + "'@'127.0.0.1';");
			await conn.query("DROP USER IF EXISTS 'np_" + app_name + "'@'%';");
		} else if(dbConf.dialect == 'postgres') {
			conn = new Client({
				host: globalConf.env == 'studio' ? process.env.DATABASE_IP : dbConf.host,
				user: globalConf.env == 'studio' ? dbConf.user : dbConf.user,
				password: globalConf.env == 'studio' ? dbConf.password : dbConf.password,
				database: dbConf.database,
				port: dbConf.port
			});
			conn.connect();
			await conn.query("REVOKE CONNECT ON DATABASE \"np_" + app_name + "\" FROM public;");
			await conn.query("SELECT pid, pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'np_" + app_name + "' AND pid <> pg_backend_pid();");
			await conn.query("DROP DATABASE \"np_" + app_name + "\";");
			await conn.query("DROP USER IF EXISTS \"np_" + app_name + "@127.0.0.1\";");
			await conn.query("DROP USER IF EXISTS \"np_" + app_name + "@%\";");
		}
		conn.end();
	} catch (err) {
		console.error(err);
	}

	if (process_server != null) {
		await process_manager.killChildProcess(process_server);
		process_manager.process_server_per_app[app_name] = null;
	}

	helpers.rmdirSyncRecursive(pathToWorkspace);

	// Delete application log file
	if (fs.existsSync(pathToAppLogs))
		fs.unlinkSync(pathToAppLogs);

	return;
}
