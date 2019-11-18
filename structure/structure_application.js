const fs = require("fs-extra");
const spawn = require('cross-spawn');
const helpers = require('../utils/helpers');
const domHelper = require('../utils/jsDomHelper');
const translateHelper = require("../utils/translate");
const path = require("path");
const mysql = require('promise-mysql');

// Gitlab
const globalConf = require('../config/global.js');
const gitlabConf = require('../config/gitlab.js');
const gitlab = require('../services/gitlab_api');

const dbConf = require('../config/database.js');
const studio_manager = require('../services/studio_manager');
const models = require('../models/');
const exec = require('child_process').exec;

function installAppModules(attr) {
	return new Promise(function(resolve, reject) {
		var dir = __dirname;

		// Mandatory workspace folder
		if (!fs.existsSync(dir + '/../workspace'))
			fs.mkdirSync(dir + '/../workspace');

		if (fs.existsSync(dir + '/../workspace/node_modules')) {
			console.log("Everything's ok about global workspaces node modules.");

			if(typeof attr !== "undefined"){
				/* When we are in the "npm install" instruction from preview */
				let command = "npm install";
				console.log(attr.specificModule)
				if(attr.specificModule)
					command += " "+attr.specificModule;

				console.log("Executing "+command+" in application: "+attr.id_application+"...");

				exec(command, {
					cwd: dir + '/../workspace/'+attr.id_application+'/'
				}, function(error, stdout, stderr) {
					if (error) {
						reject(error);
					}
					console.log('Application '+attr.id_application+' node modules successfully installed !');
					resolve();
				});
			} else {
				resolve();
			}
		} else {
			// We need to reinstall node modules properly
			console.log("Workspaces node modules initialization...");
			fs.copySync(path.join(dir, 'template', 'package.json'), path.join(dir, '..', 'workspace', 'package.json'))

			cmd = 'npm -s install';
			exec(cmd, {
				cwd: dir + '/../workspace/'
			}, function(error, stdout, stderr) {
				if (error) {
					reject(error);
				}
				console.log('Workspaces node modules successfuly initialized.');
				resolve();
			});
		}
	});
};
exports.installAppModules = installAppModules;

// Application
exports.setupApplication = async (data) => {

	let appName = data.options.value;
	let appDisplayName = data.options.showValue;

	try {
		await installAppModules();
	} catch(err) {
		throw new Error("An error occurred while initializing the node modules.");
	}

	// *** Copy template folder to new workspace ***
	fs.copySync(__dirname + '/template/', __dirname + '/../workspace/' + appName);

	await translateHelper.writeLocales(appName, "application", null, appDisplayName, data.googleTranslate);

	// Create database instance for application
	let db_requests = [
		"CREATE DATABASE IF NOT EXISTS `np_" + appName + "` DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;",
		"CREATE USER IF NOT EXISTS 'np_" + appName + "'@'127.0.0.1' IDENTIFIED BY 'np_" + appName + "';",
		"CREATE USER IF NOT EXISTS 'np_" + appName + "'@'%' IDENTIFIED BY 'np_" + appName + "';",
		"GRANT ALL PRIVILEGES ON `np_" + appName + "`.* TO 'np_" + appName + "'@'127.0.0.1';",
		"GRANT ALL PRIVILEGES ON `np_" + appName + "`.* TO 'np_" + appName + "'@'%';",
		"GRANT ALL PRIVILEGES ON `np_" + appName + "`.* TO '" + dbConf.user + "'@'127.0.0.1';",
		"GRANT ALL PRIVILEGES ON `np_" + appName + "`.* TO '" + dbConf.user + "'@'%';",
		"ALTER USER 'np_" + appName + "'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'np_" + appName + "';",
		"ALTER USER 'np_" + appName + "'@'%' IDENTIFIED WITH mysql_native_password BY 'np_" + appName + "';",
		"FLUSH PRIVILEGES;"
	];

	let conn = await mysql.createConnection({
		host: globalConf.env == "cloud" || globalConf.env == "docker" ? process.env.DATABASE_IP : dbConf.host,
		user: globalConf.env == "cloud" || globalConf.env == "docker" ? "root" : dbConf.user,
		password: globalConf.env == "cloud" || globalConf.env == "docker" ? "P@ssw0rd+" : dbConf.password
	});

	try {
		for (let i = 0; i < db_requests.length; i++)
			await conn.query(db_requests[i]);
	} catch(err) {
		console.error(err);
		throw new Error("An error occurred while initializing the workspace database. Does the mysql user have the privileges to create a database ?");;
	}

	conn.end();

	// Update workspace database config file to point on the new separate DB
	let appDatabaseConfig = fs.readFileSync(__dirname + '/../workspace/' + appName + '/config/database.js', 'utf8');
	appDatabaseConfig = appDatabaseConfig.replace(/newmips/g, 'np_' + appName, 'utf8');
	fs.writeFileSync(__dirname + '/../workspace/' + appName + '/config/database.js', appDatabaseConfig);

	// Create the application repository on gitlab ?
	if (!gitlabConf.doGit)
		return false;

	if (!data.gitlabUser)
		data.gitlabUser = await gitlab.getUser(data.currentUser.email);

	let idUserGitlab = data.gitlabUser.id;

	let newGitlabProject = {
		user_id: idUserGitlab,
		name: globalConf.host + "-" + appNameWithoutPrefix,
		description: "A generated Newmips workspace.",
		issues_enabled: false,
		merge_requests_enabled: false,
		wiki_enabled: false,
		snippets_enabled: false,
		public: false
	};

	let newRepo = await gitlab.createProjectForUser(newGitlabProject);
	await gitlab.addMemberToProject({
		id: newRepo.id,
		user_id: 1, // Admin
		access_level: 40
	})

	return newRepo;
}

async function finalizeApplication(application) {

	let piecesPath = __dirname + '/pieces';
	let workspacePath = __dirname + '/../workspace/' + application.name;

	// Reset toSync file
	fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify({}, null, 4), 'utf8');

	let workspaceSequelize = require(workspacePath + '/models/');
	await workspaceSequelize.sequelize.sync({
		logging: false,
		hooks: false
	});

	// Create application's DNS through studio_manager
	if (globalConf.env == 'cloud'){
		let appID = await models.Application.findOne({
			name: application.name
		});
		await studio_manager.createApplicationDns(application.name, appID);
	}
}

async function initializeWorkflow(application) {
	let piecesPath = __dirname + '/pieces/component/status';
	let workspacePath = __dirname + '/../workspace/' + application.name;

	// Remove existing has many from Status, the instruction is only used to generate the tab and views
	let statusModel = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_status.json'));
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
	fs.copySync(piecesPath + '/models/e_status.js', workspacePath + '/models/e_status.js');

	// Copy views pieces
	const toCopyViewFolders = ['e_status','e_media','e_media_mail','e_media_notification','e_media_sms','e_media_task','e_translation','e_action'];
	for (const folder of toCopyViewFolders)
		fs.copySync(`${piecesPath}/views/${folder}`, `${workspacePath}/views/${folder}`);

	// Copy routes
	fs.copySync(piecesPath + '/routes/', workspacePath + '/routes/');
	// Copy API routes
	fs.copySync(piecesPath + '/api/', workspacePath + '/api/');

	// Remove notification views
	fs.removeSync(workspacePath+'/views/e_notification');

	// Remove notification from administration sidebar
	let $ = await domHelper.read(workspacePath + '/views/layout_m_administration.dust');
	$("#notification_menu_item").remove();

	await domHelper.write(workspacePath + '/views/layout_m_administration.dust', $);

	// Write new locales trees
	let newLocalesEN = JSON.parse(fs.readFileSync(piecesPath + '/locales/global_locales_EN.json'));
	translateHelper.writeTree(application.name, newLocalesEN, 'en-EN');
	let newLocalesFR = JSON.parse(fs.readFileSync(piecesPath + '/locales/global_locales_FR.json'));
	translateHelper.writeTree(application.name, newLocalesFR, 'fr-FR');

	// Write enum traductions
	translateHelper.writeEnumTrad(application.name, 'e_media', 'f_type', 'task', 'Tâche', 'fr-FR');

	return await finalizeApplication(application);
}

exports.initializeApplication = async(application) => {

	let piecesPath = __dirname + '/pieces';
	let workspacePath = __dirname + '/../workspace/' + application.name;

	fs.copySync(piecesPath + '/administration/views/e_user/', workspacePath + '/views/e_user/');

	// Clean user list fields
	let $ = await domHelper.read(workspacePath + '/views/e_user/list_fields.dust');

	$("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();

	await domHelper.write(workspacePath + '/views/e_user/list_fields.dust', $);
	// Clean user show fields and remove tab view
	$ = await domHelper.read(workspacePath + '/views/e_user/show_fields.dust');
	$("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();
	let homeHtml = $("#home").html();
	$("#home").remove();
	$("#tabs").removeClass('.nav-tabs-custom').attr('id', 'home');
	$("#home").html(homeHtml);
	await domHelper.write(workspacePath + '/views/e_user/show_fields.dust', $);
	// Clean user create fields
	$ = await domHelper.read(workspacePath + '/views/e_user/create_fields.dust');
	$("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();
	await domHelper.write(workspacePath + '/views/e_user/create_fields.dust', $)

	// Clean user update fields
	$ = await domHelper.read(workspacePath + '/views/e_user/update_fields.dust');
	$("[data-field=id], [data-field=f_password], [data-field=f_token_password_reset], [data-field=f_enabled]").remove();
	await domHelper.write(workspacePath + '/views/e_user/update_fields.dust', $)
	// Copy inline-help route and views
	fs.copySync(piecesPath + '/routes/e_inline_help.js', workspacePath + '/routes/e_inline_help.js');
	fs.copySync(piecesPath + '/views/e_inline_help/', workspacePath + '/views/e_inline_help/');

	// Copy api entities views
	fs.copySync(piecesPath + '/api/views/e_api_credentials', workspacePath + '/views/e_api_credentials');
	// Copy js file for access settings
	fs.copySync(piecesPath + '/administration/js/', workspacePath + '/public/js/Newmips/');
	// Copy authentication user entity route
	fs.copySync(piecesPath + '/administration/routes/e_user.js', workspacePath + '/routes/e_user.js');

	// Make fields unique
	function uniqueField(entity, field) {
		let model = JSON.parse(fs.readFileSync(workspacePath + '/models/attributes/' + entity + '.json', 'utf8'));
		model[field].unique = true;
		fs.writeFileSync(workspacePath + '/models/attributes/' + entity + '.json', JSON.stringify(model, null, 4), 'utf8');
	}
	uniqueField('e_user', 'f_login');
	uniqueField('e_role', 'f_label');
	uniqueField('e_group', 'f_label');

	// Manualy add custom menus to access file because it's not a real entity
	let access = JSON.parse(fs.readFileSync(workspacePath + '/config/access.json', 'utf8'));
	let arrayKey = [
		"access_settings",
		"db_tool",
		"import_export",
		"access_tool",
		"access_settings_role",
		"access_settings_group",
		"access_settings_api"
	];
	for (let i = 0; i < arrayKey.length; i++) {
		access.administration.entities.push({
			name: arrayKey[i],
			groups: [],
			actions: {
				read: [],
				create: [],
				update: [],
				delete: []
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

	$ = await domHelper.read(workspacePath + '/views/layout_m_administration.dust');
	let li = '';

	// Delete generated synchro in sidebar
	$("#synchronization_menu_item").remove();
	$("#synchro_credentials_menu_item").remove();
	// Put back Synchro in sidebar
	li += '<!--{#entityAccess entity="synchro"}-->\n';
	li += '	 <li id="synchro_menu_item" style="display:block;" class="treeview">\n';
	li += '		 <a href="#">\n';
	li += '			 <i class="fa fa-refresh"></i>\n';
	li += '			 <span><!--{#__ key="synchro.title" /}--></span>\n';
	li += '			 <i class="fa fa-angle-left pull-right"></i>\n';
	li += '		 </a>\n';
	li += '		 <ul class="treeview-menu">\n';
	li += '			 <!--{@ne key=config.env value="tablet"}-->\n';
	li += '				 <li>\n';
	li += '					 <a href="/synchronization/show">\n';
	li += '						 <i class="fa fa-angle-double-right"></i>\n';
	li += '						 <!--{#__ key="synchro.configure" /}-->\n';
	li += '					 </a>\n';
	li += '				 </li>\n';
	li += '				 <li>\n';
	li += '					 <a href="/synchronization/list_dump">\n';
	li += '						 <i class="fa fa-angle-double-right"></i>\n';
	li += '						 <!--{#__ key="synchro.list" /}-->\n';
	li += '					 </a>\n';
	li += '				 </li>\n';
	li += '			 <!--{/ne}-->\n';
	li += '			 <!--{@eq key=config.env value="tablet"}-->\n';
	li += '				 <li>\n';
	li += '					 <a href="/synchronization/show">\n';
	li += '						 <i class="fa fa-angle-double-right"></i>\n';
	li += '						 <!--{#__ key="synchro.process.synchronize" /}-->\n';
	li += '					 </a>\n';
	li += '				 </li>\n';
	li += '			 <!--{/eq}-->\n';
	li += '		 </ul>\n';
	li += '	 </li>\n';
	li += '<!--{/entityAccess}-->\n';

	li += '<!--{@eq key=config.env value="tablet"}-->\n';
	li += '	 <!--{#entityAccess entity="synchro_credentials"}\n';
	li += '	 <li id="synchro_credentials_menu_item" style="display:block;" class="treeview">\n';
	li += '		 <a href="#">\n';
	li += '			 <i class="fa fa-unlink"></i>\n';
	li += '			 <span><!--{#__ key="entity.e_synchro_credentials.label_entity" /}--></span>\n';
	li += '			 <i class="fa fa-angle-left pull-right"></i>\n';
	li += '		 </a>\n';
	li += '		 <ul class="treeview-menu">\n';
	li += '			 <!--{#actionAccess entity="synchro_credentials" action="create"}-->\n';
	li += '				 <li>\n';
	li += '					 <a href="/synchro_credentials/create_form">\n';
	li += '						 <i class="fa fa-angle-double-right"></i>\n';
	li += '						 <!--{#__ key="operation.create" /}-->\n';
	li += '					 </a>\n';
	li += '				 </li>\n';
	li += '			 <!--{/actionAccess}-->\n';
	li += '			 <!--{#actionAccess entity="synchro_credentials" action="read"}-->\n';
	li += '				 <li>\n';
	li += '					 <a href="/synchro_credentials/list">\n';
	li += '						 <i class="fa fa-angle-double-right"></i>\n';
	li += '						 <!--{#__ key="operation.list" /}-->\n';
	li += '					 </a>\n';
	li += '				 </li>\n';
	li += '			 <!--{/actionAccess}-->\n';
	li += '		 </ul>\n';
	li += '	 </li>\n';
	li += '	 <!--{/entityAccess}-->\n';
	li += '<!--{/eq}-->\n';

	li += '<!--{#entityAccess entity="import_export"}-->\n';
	li += '	 <li id="import_export_menu_item" class="treeview">\n';
	li += '		 <a href="#">\n';
	li += '			 <i class="fa fa-arrows-v"></i>\n';
	li += '			 <span><!--{#__ key="settings.import_export.title" /}--></span>\n';
	li += '			 <i class="fa fa-angle-left pull-right"></i>\n';
	li += '		 </a>\n';
	li += '		 <ul class="treeview-menu">\n';
	li += '			 <!--{#actionAccess entity="db_tool" action="read"}-->\n';
	li += '			 <li>\n';
	li += '				 <a href="/import_export/db_show">\n';
	li += '					 <i class="fa fa-angle-double-right"></i>\n';
	li += '					 <!--{#__ key="settings.db_tool.title" /}-->\n';
	li += '				 </a>\n';
	li += '			 </li>\n';
	li += '			 <!--{/actionAccess}-->\n';
	li += '			 <!--{#actionAccess entity="access_tool" action="read"}-->\n';
	li += '			 <li>\n';
	li += '				 <a href="/import_export/access_show">\n';
	li += '					 <i class="fa fa-angle-double-right"></i>\n';
	li += '					 <!--{#__ key="settings.tool_menu" /}-->\n';
	li += '				 </a>\n';
	li += '			 </li>\n';
	li += '			 <!--{/actionAccess}-->\n';
	li += '		 </ul>\n';
	li += '	 </li>\n';
	li += '<!--{/entityAccess}-->\n';

	li += '<!--{#entityAccess entity="access_settings"}-->\n';
	li += '	 <li id="access_settings_menu_item" class="treeview">\n';
	li += '		 <a href="#">\n';
	li += '			 <i class="fa fa-cog"></i>\n';
	li += '			 <span><!--{#__ key="settings.title" /}--></span>\n';
	li += '			 <i class="fa fa-angle-left pull-right"></i>\n';
	li += '		 </a>\n';
	li += '		 <ul class="treeview-menu">\n';
	li += '			 <!--{#actionAccess entity="access_settings_role" action="read"}-->\n';
	li += '			 <li>\n';
	li += '				 <a href="/access_settings/show_role">\n';
	li += '					 <i class="fa fa-angle-double-right"></i>\n';
	li += '					 <!--{#__ key="entity.e_role.label_entity" /}-->\n';
	li += '				 </a>\n';
	li += '			 </li>\n';
	li += '			 <!--{/actionAccess}-->\n';
	li += '			 <!--{#actionAccess entity="access_settings_group" action="read"}-->\n';
	li += '			 <li>\n';
	li += '				 <a href="/access_settings/show_group">\n';
	li += '					 <i class="fa fa-angle-double-right"></i>\n';
	li += '					 <!--{#__ key="entity.e_group.label_entity" /}-->\n';
	li += '				 </a>\n';
	li += '			 </li>\n';
	li += '			 <!--{/actionAccess}-->\n';
	li += '			 <!--{#actionAccess entity="access_settings_api" action="read"}-->\n';
	li += '			 <li>\n';
	li += '				 <a href="/access_settings/show_api">\n';
	li += '					 <i class="fa fa-angle-double-right"></i>\n';
	li += '					 API\n';
	li += '				 </a>\n';
	li += '			 </li>\n';
	li += '			 <!--{/actionAccess}-->\n';
	li += '		 </ul>\n';
	li += '	 </li>\n';
	li += '<!--{/entityAccess}-->\n';

	$("#sortable").append(li);

	// Add settings entry into authentication module layout
	await domHelper.write(workspacePath + '/views/layout_m_administration.dust', $);

	// Copy routes settings pieces
	fs.copySync(piecesPath + '/administration/routes/e_access_settings.js', workspacePath + '/routes/e_access_settings.js');
	// Copy view settings pieces
	fs.copySync(piecesPath + '/administration/views/e_access_settings', workspacePath + '/views/e_access_settings');
	// Copy route e_api_credentials piece
	fs.copySync(piecesPath + '/api/routes/e_api_credentials.js', workspacePath + '/routes/e_api_credentials.js');
	// Copy api e_user piece
	fs.copySync(piecesPath + '/api/routes/e_user.js', workspacePath + '/api/e_user.js');

	// Delete and copy synchronization files/pieces
	let synchroViews = fs.readdirSync(workspacePath + '/views/e_synchronization');
	for (let i = 0; i < synchroViews.length; i++)
		fs.unlink(workspacePath + '/views/e_synchronization/' + synchroViews[i], (err) => {
			if (err) console.error(err);
		});

	fs.copySync(piecesPath + '/component/synchronization/views/', workspacePath + '/views/e_synchronization/');
	fs.copySync(piecesPath + '/component/synchronization/routes/e_synchronization.js', workspacePath + '/routes/e_synchronization.js');
	fs.copySync(piecesPath + '/component/synchronization/api/e_synchronization.js', workspacePath + '/api/e_synchronization.js');

	// API credentials must not be available to API calls, delete the file
	fs.unlinkSync(workspacePath + '/api/e_api_credentials.js');
	// Set french translation about API credentials
	translateHelper.updateLocales(application.name, "fr-FR", ["entity", "e_api_credentials", "label_entity"], "Identifiant d'API");
	translateHelper.updateLocales(application.name, "fr-FR", ["entity", "e_api_credentials", "name_entity"], "Identifiant d'API");
	translateHelper.updateLocales(application.name, "fr-FR", ["entity", "e_api_credentials", "plural_entity"], "Identifiant d'API");

	await initializeWorkflow(application);
}

let process_manager = require('../services/process_manager.js');
exports.deleteApplication = async(app_name) => {
	// Kill spawned child process by preview
	let process_server = process_manager.process_server;
	let pathToWorkspace = __dirname + '/../workspace/' + app_name;
	let pathToAppLogs = __dirname + '/../workspace/logs/app_' + app_name + '.log';

	let nameAppWithoutPrefix = app_name.substring(2);
	let nameRepo = globalConf.host + "-" + nameAppWithoutPrefix;

	// Removing .toml file in traefik rules folder
	if (globalConf.env == "cloud" || globalConf.env == "docker") {
		try {
			fs.unlinkSync(__dirname + "/../workspace/rules/" + globalConf.sub_domain + "-" + nameAppWithoutPrefix + ".toml");
		} catch (err) {
			console.error(err);
		}
	}

	if (gitlabConf.doGit) {
		let project = await gitlab.getProject(nameRepo);

		if (!project)
			console.error("Unable to find gitlab project to delete.");
		else {
			let answer = await gitlab.deleteProject(project.id);
			console.log("Delete Gitlab repository: " + nameRepo + " => " + JSON.stringify(answer));
		}
	}

	let conn = await mysql.createConnection({
		host: globalConf.env == "cloud" || globalConf.env == "docker" ? process.env.DATABASE_IP : dbConf.host,
		user: globalConf.env == "cloud" || globalConf.env == "docker" ? "root" : dbConf.user,
		password: globalConf.env == "cloud" || globalConf.env == "docker" ? "P@ssw0rd+" : dbConf.password
	});
	await conn.query("DROP DATABASE IF EXISTS `np_" + app_name + "`;");
	conn.end();

	if (process_server != null)
		await process_manager.killChildProcess(process_server.pid);

	helpers.rmdirSyncRecursive(pathToWorkspace);

	// Delete application log file
	if (fs.existsSync(pathToAppLogs))
		fs.unlinkSync(pathToAppLogs);

	return;
}
