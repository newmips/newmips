const fs = require("fs-extra");
const domHelper = require('../utils/jsDomHelper');
const translateHelper = require("../utils/translate");
const helpers = require("../utils/helpers");
const moment = require("moment");

async function addTab(entity, file, newLi, newTabContent) {
	const $ = await domHelper.read(file);

	// Tabs structure doesn't exist, create it
	var tabs = '';
	var context;
	if ($("#tabs").length == 0) {
		tabs = '\
		<div class="nav-tabs-custom" id="tabs">\n\
			<!--{^hideTab}-->\n\
				<ul class="nav nav-tabs">\n\
					<li class="active">\n\
						<a data-toggle="tab" href="#home">\n\
							<!--{#__ key="entity.' + entity + '.label_entity" /}-->\n\
						</a>\n\
					</li>\n\
				</ul>\n\
			<!--{/hideTab}-->\n\
			<div class="tab-content" style="min-height:275px;">\n\
				<div id="home" class="tab-pane fade in active"></div>\n\
			</div>\n\
		</div>\n';

		context = $(tabs);
		$("#home", context).append($("#fields"));
		$("#home", context).append($(".actions"));
	} else
		context = $("#tabs");

	// Append created elements to `context` to handle presence of tab or not
	$(".nav-tabs", context).append(newLi);
	$(".tab-content", context).append('<!--{^hideTab}-->');
	$(".tab-content", context).append(newTabContent);
	$(".tab-content", context).append('<!--{/hideTab}-->');
	$('body').empty().append(context);

	return await domHelper.write(file, $);
}

function addAccessManagment(appName, urlComponent, urlModule) {
	// Write new data entity to access.json file, within module's context
	const accessPath = __dirname + '/../workspace/' + appName + '/config/access.json';
	const accessLockPath = __dirname + '/../workspace/' + appName + '/config/access.lock.json';
	const accessObject = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
	accessObject[urlModule.toLowerCase()].entities.push({
		name: urlComponent,
		groups: [],
		actions: {
			create: [],
			update: [],
			read: [],
			delete: []
		}
	});
	fs.writeFileSync(accessPath, JSON.stringify(accessObject, null, 4), "utf8");
	fs.writeFileSync(accessLockPath, JSON.stringify(accessObject, null, 4), "utf8");
}

function deleteAccessManagment(appName, urlComponent, urlModule) {
	// Write new data entity to access.json file, within module's context
	const accessPath = __dirname + '/../workspace/' + appName + '/config/access.json';
	const accessLockPath = __dirname + '/../workspace/' + appName + '/config/access.lock.json';
	const accessObject = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
	if (accessObject[urlModule] && accessObject[urlModule].entities) {
		const entities = accessObject[urlModule].entities;
		let dataIndexToRemove = -1;
		for (let i = 0; i < entities.length; i++) {
			if (entities[i].name === urlComponent) {
				dataIndexToRemove = i;
				break;
			}
		}
		if (dataIndexToRemove !== -1)
			entities.splice(dataIndexToRemove, 1);
		fs.writeFileSync(accessPath, JSON.stringify(accessObject, null, 4), "utf8");
		fs.writeFileSync(accessLockPath, JSON.stringify(accessObject, null, 4), "utf8");
	}
}

function replaceValuesInFile(filePath, valueToFind, replaceWith) {
	let fileContent = fs.readFileSync(filePath, 'utf8');
	const reg = new RegExp(valueToFind, "g");
	fileContent = fileContent.replace(reg, replaceWith);
	fs.writeFileSync(filePath, fileContent);
}

exports.newLocalFileStorage = async (data) => {

	const componentName = data.options.value;
	const urlComponent = data.options.urlValue;
	const showComponentName = data.options.showValue;
	const source = data.entity.name;
	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	// CREATE MODEL FILE
	let modelTemplate = fs.readFileSync(__dirname + '/pieces/component/local_file_storage/models/model_local_file_storage.js', 'utf8');
	modelTemplate = modelTemplate.replace(/COMPONENT_NAME_LOWER/g, componentName);
	modelTemplate = modelTemplate.replace(/COMPONENT_NAME/g, componentName.charAt(0).toUpperCase() + componentName.toLowerCase().slice(1));
	modelTemplate = modelTemplate.replace(/TABLE_NAME/g, componentName);
	fs.writeFileSync(workspacePath + '/models/' + componentName + '.js', modelTemplate);

	// CREATE MODEL ATTRIBUTES FILE
	const attributesTemplate = fs.readFileSync(__dirname + '/pieces/component/local_file_storage/models/attributes/attributes_local_file_storage.json', 'utf8');
	fs.writeFileSync(workspacePath + '/models/attributes/' + componentName + '.json', attributesTemplate);

	// CREATE MODEL OPTIONS (ASSOCIATIONS) FILE
	let optionsTemplate = fs.readFileSync(__dirname + '/pieces/component/local_file_storage/models/options/options_local_file_storage.json', 'utf8');
	optionsTemplate = optionsTemplate.replace(/SOURCE_ENTITY_LOWER/g, source);
	fs.writeFileSync(workspacePath + '/models/options/' + componentName + '.json', optionsTemplate);

	// CREATE ROUTE FILE
	let routeTemplate = fs.readFileSync(__dirname + '/pieces/component/local_file_storage/routes/route_local_file_storage.js', 'utf8');
	routeTemplate = routeTemplate.replace(/COMPONENT_NAME_LOWER/g, componentName);
	routeTemplate = routeTemplate.replace(/COMPONENT_NAME_URL/g, componentName.substring(2));
	routeTemplate = routeTemplate.replace(/COMPONENT_NAME/g, componentName.charAt(0).toUpperCase() + componentName.slice(1));
	routeTemplate = routeTemplate.replace(/SOURCE_ENTITY_LOWER/g, source);
	routeTemplate = routeTemplate.replace(/SOURCE_URL_ENTITY_LOWER/g, source.substring(2));

	fs.writeFileSync(workspacePath + '/routes/' + componentName + '.js', routeTemplate);

	// Add access managment to the component route
	addAccessManagment(data.application.name, urlComponent, data.module_name.substring(2));

	/* --------------- New translation --------------- */
	await translateHelper.writeLocales(data.application.name, "component", componentName, showComponentName, data.googleTranslate);

	// GET COMPONENT PIECES TO BUILD STRUCTURE FILE
	const componentPiece = fs.readFileSync('./structure/pieces/component/local_file_storage/views/view_local_file_storage.dust', 'utf8');

	let componentContent = componentPiece.replace(/COMPONENT_NAME_LOWER/g, componentName);
	componentContent = componentContent.replace(/COMPONENT_URL_NAME_LOWER/g, urlComponent);
	componentContent = componentContent.replace(/SOURCE_LOWER/g, source);
	fs.mkdirSync(workspacePath + '/views/' + componentName);
	fs.writeFileSync(workspacePath + '/views/' + componentName + '/list_fields.dust', componentContent, 'utf8');

	const newLi = '<li><a id="' + componentName + '-click" data-toggle="tab" href="#' + componentName + '"><!--{#__ key="component.' + componentName + '.label_component" /}--></a></li>';
	const file = workspacePath + '/views/' + source + '/show_fields.dust';

	// CREATE THE TAB IN SHOW FIELDS
	const newTab = '<div id="' + componentName + '" class="ajax-tab tab-pane fade" data-tabtype="localfilestorage" data-asso-flag="{' + source + '.id}" data-asso-alias="' + componentName + '"><div class="ajax-content"></div></div>';
	await addTab(data.entity.name, file, newLi, newTab);
}

exports.newContactForm = async (data) => {

	// Contact Form entity
	const codeName = data.options.value;
	const urlName = data.options.urlValue.toLowerCase();

	// Contact Form Settings entity
	const codeNameSettings = data.options.valueSettings;
	const urlNameSettings = data.options.urlValueSettings;

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const piecesPath = __dirname + '/../structure/pieces/component/contact_form';

	const toSyncObject = JSON.parse(fs.readFileSync(workspacePath + '/models/toSync.json'));
	if (typeof toSyncObject.queries !== "object")
		toSyncObject.queries = [];
	toSyncObject[codeNameSettings] = {};

	const mailConfigPath = workspacePath + "/config/mail.js";
	delete require.cache[require.resolve(mailConfigPath)];
	const mailConfig = require(mailConfigPath);

	const isSecure = mailConfig.transport.secure ? 1 : 0;
	const insertSettings = "INSERT INTO `" + codeNameSettings + "`(`version`, `f_transport_host`, `f_port`, `f_secure`, `f_user`, `f_pass`, `f_form_recipient`, `createdAt`, `updatedAt`)" +
			" VALUES(1,'" + mailConfig.transport.host + "'," +
			"'" + mailConfig.transport.port + "'," +
			isSecure + "," +
			"'" + mailConfig.transport.auth.user + "'," +
			"'" + mailConfig.transport.auth.pass + "'," +
			"'" + mailConfig.administrateur + "'," +
			"'" + moment().format("YYYY-MM-DD HH:mm:ss") + "'," +
			"'" + moment().format("YYYY-MM-DD HH:mm:ss") + "');";

	toSyncObject.queries.push(insertSettings);
	fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify(toSyncObject, null, 4));

	// Contact Form View
	fs.copySync(piecesPath + '/views/', workspacePath + '/views/' + codeName + '/');
	fs.unlinkSync(workspacePath + '/views/' + codeName + '/update.dust');
	fs.unlinkSync(workspacePath + '/views/' + codeName + '/update_fields.dust');

	// Contact Form Route
	// Unlink generated route to replace with our custom route file
	fs.unlinkSync(workspacePath + '/routes/' + codeName + '.js');
	fs.copySync(piecesPath + '/routes/route_contact_form.js', workspacePath + '/routes/' + codeName + '.js');

	const workspaceRoutePath = workspacePath + '/routes/' + codeName + '.js';
	const workspaceViewPath = workspacePath + '/views/' + codeName;

	replaceValuesInFile(workspaceRoutePath, "URL_VALUE_CONTACT", urlName);
	replaceValuesInFile(workspaceRoutePath, "URL_VALUE_SETTINGS", urlNameSettings);
	replaceValuesInFile(workspaceRoutePath, "CODE_VALUE_CONTACT", codeName);
	replaceValuesInFile(workspaceRoutePath, "CODE_VALUE_SETTINGS", codeNameSettings);
	replaceValuesInFile(workspaceRoutePath, "MODEL_VALUE_CONTACT", codeName.charAt(0).toUpperCase() + codeName.toLowerCase().slice(1));
	replaceValuesInFile(workspaceRoutePath, "MODEL_VALUE_SETTINGS", codeNameSettings.charAt(0).toUpperCase() + codeNameSettings.toLowerCase().slice(1));

	replaceValuesInFile(workspaceViewPath + '/create.dust', "CODE_VALUE_CONTACT", codeName);
	replaceValuesInFile(workspaceViewPath + '/create.dust', "URL_VALUE_CONTACT", urlName);
	replaceValuesInFile(workspaceViewPath + '/create.dust', "CODE_VALUE_MODULE", data.module_name);

	replaceValuesInFile(workspaceViewPath + '/create_fields.dust', "CODE_VALUE_CONTACT", codeName);

	replaceValuesInFile(workspaceViewPath + '/show_fields.dust', "CODE_VALUE_CONTACT", codeName);
	replaceValuesInFile(workspaceViewPath + '/show_fields.dust', "URL_VALUE_CONTACT", urlName);

	replaceValuesInFile(workspaceViewPath + '/list.dust', "CODE_VALUE_CONTACT", codeName);
	replaceValuesInFile(workspaceViewPath + '/list.dust', "URL_VALUE_CONTACT", urlName);
	replaceValuesInFile(workspaceViewPath + '/list.dust', "CODE_VALUE_MODULE", data.module_name);

	replaceValuesInFile(workspaceViewPath + '/list_fields.dust', "CODE_VALUE_CONTACT", codeName);
	replaceValuesInFile(workspaceViewPath + '/list_fields.dust', "URL_VALUE_CONTACT", urlName);

	replaceValuesInFile(workspaceViewPath + '/settings.dust', "CODE_VALUE_CONTACT", codeName);
	replaceValuesInFile(workspaceViewPath + '/settings.dust', "URL_VALUE_CONTACT", urlName);
	replaceValuesInFile(workspaceViewPath + '/settings.dust', "CODE_VALUE_MODULE", data.module_name);

	replaceValuesInFile(workspaceViewPath + '/settings_fields.dust', "CODE_VALUE_SETTINGS", codeNameSettings);

	// Delete Contact Form Settings Route and Views
	fs.unlinkSync(workspacePath + '/routes/' + codeNameSettings + '.js');
	helpers.rmdirSyncRecursive(workspacePath + '/views/' + codeNameSettings + '/');

	// Locales FR
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "f_name"], "Nom");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "f_sender"], "Expediteur");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "f_recipient"], "Destinataire");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "r_user"], "Utilisateur");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "f_title"], "Titre");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "f_content"], "Contenu");

	translateHelper.updateLocales(data.application.name, "en-EN", ["entity", codeName, "sendMail"], "Send a mail");
	translateHelper.updateLocales(data.application.name, "en-EN", ["entity", codeName, "inbox"], "Sent box");
	translateHelper.updateLocales(data.application.name, "en-EN", ["entity", codeName, "settings"], "Settings");
	translateHelper.updateLocales(data.application.name, "en-EN", ["entity", codeName, "successSendMail"], "The email has been sent!");

	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "sendMail"], "Envoyer un mail");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "inbox"], "Boîte de réception");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "settings"], "Paramètres");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "successSendMail"], "Le mail a bien été envoyé !");

	translateHelper.updateLocales(data.application.name, "en-EN", ["entity", codeNameSettings, "label_entity"], "Settings");
	translateHelper.updateLocales(data.application.name, "en-EN", ["entity", codeNameSettings, "name_entity"], "Settings");
	translateHelper.updateLocales(data.application.name, "en-EN", ["entity", codeNameSettings, "plural_entity"], "Settings");

	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeNameSettings, "label_entity"], "Paramètres");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeNameSettings, "name_entity"], "Paramètres");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeNameSettings, "plural_entity"], "Paramètres");

	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeNameSettings, "f_transport_host"], "Hôte");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeNameSettings, "f_port"], "Port");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeNameSettings, "f_secure"], "Sécurisé");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeNameSettings, "f_user"], "Utilisateur");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeNameSettings, "f_pass"], "Mot de passe");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeNameSettings, "f_form_recipient"], "Destinataire du formulaire");

	// If default name
	if (codeName == "e_contact_form")
		translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "label_entity"], "Formulaire de contact");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "name_entity"], "Formulaire de contact");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", codeName, "plural_entity"], "Formulaires de contact");

	const layoutFileName = __dirname + '/../workspace/' + data.application.name + '/views/layout_' + data.module_name + '.dust';
	const $ = await domHelper.read(layoutFileName);

	$("#" + urlName + "_menu_item").remove();
	$("#" + urlNameSettings + "_menu_item").remove();

	const li = '\
	<!--{#entityAccess entity=\"' + urlName + '\"}-->\n\
		<li id=\"' + urlName + '_menu_item\" style=\"display:block;\" class=\"treeview\">\n\
			<a href=\"#\">\n\
				<i class=\"fa fa-envelope\"></i>\n\
				<span><!--{#__ key=\"entity.' + codeName + '.label_entity\" /}--></span>\n\
				<i class=\"fa fa-angle-left pull-right\"></i>\n\
			</a>\n\
			<ul class=\"treeview-menu\">\n\
				<!--{#actionAccess entity=\"' + urlName + '\" action=\"create\"}-->\n\
				<li>\n\
					<a href=\"/' + urlName + '/create_form\">\n\
						<i class=\"fa fa-paper-plane\"></i>\n\
						<!--{#__ key=\"entity.' + codeName + '.sendMail\" /}-->\n\
					</a>\n\
				</li>\n\
				<!--{/actionAccess}-->\n\
				<!--{#actionAccess entity=\"' + urlName + '\" action=\"read\"}-->\n\
				<li>\n\
					<a href=\"/' + urlName + '/list\">\n\
						<i class=\"fa fa-inbox\"></i>\n\
						<!--{#__ key=\"entity.' + codeName + '.inbox\" /}-->\n\
					</a>\n\
				</li>\n\
				<!--{/actionAccess}-->\n\
				<!--{#actionAccess entity=\"' + urlNameSettings + '\" action=\"create\"}-->\n\
				<li>\n\
					<a href=\"/' + urlName + '/settings\">\n\
						<i class=\"fa fa-cog\"></i>\n\
						<!--{#__ key=\"entity.' + codeName + '.settings\" /}-->\n\
					</a>\n\
				</li>\n\
				<!--{/actionAccess}-->\n\
			</ul>\n\
		</li>\n\n\
	<!--{/entityAccess}-->\n';

	// Add new html to document
	$('#sortable').append(li);

	// Write back to file
	await domHelper.write(layoutFileName, $);
	// Clean empty and useless dust helper created by removing <li>
	let layoutContent = fs.readFileSync(layoutFileName, 'utf8');

	// Remove empty dust helper
	layoutContent = layoutContent.replace(/{#entityAccess entity=".+"}\W*{\/entityAccess}/g, "");

	fs.writeFileSync(layoutFileName, layoutContent);
}

exports.newAgenda = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const piecesPath = __dirname + '/pieces/component/agenda';

	const valueComponent = data.options.value;
	const showComponentName = data.options.showValue;
	const urlComponent = data.options.urlValue;

	const valueEvent = "e_" + urlComponent + "_event";
	const valueCategory = "e_" + urlComponent + "_category";

	const urlEvent = valueEvent.substring(2);
	const urlCategory = valueCategory.substring(2);

	// Agenda Route
	{
		const valueAgendaModel = valueComponent.charAt(0).toUpperCase() + valueComponent.slice(1);
		const valueEventModel = valueEvent.charAt(0).toUpperCase() + valueEvent.slice(1);
		const valueCategoryModel = valueCategory.charAt(0).toUpperCase() + valueCategory.slice(1);

		const urlRouteAgenda = valueComponent.substring(2);

		// CREATE ROUTE FILE
		let routeTemplate = fs.readFileSync(piecesPath + '/routes/route_agenda.js', 'utf8');

		routeTemplate = routeTemplate.replace(/CODE_NAME_LOWER/g, valueComponent);
		routeTemplate = routeTemplate.replace(/URL_ROUTE/g, urlRouteAgenda);

		routeTemplate = routeTemplate.replace(/CODE_NAME_EVENT_MODEL/g, valueEventModel);
		routeTemplate = routeTemplate.replace(/CODE_NAME_EVENT_URL/g, valueEvent.substring(2));

		routeTemplate = routeTemplate.replace(/CODE_NAME_CATEGORY_MODEL/g, valueCategoryModel);
		routeTemplate = routeTemplate.replace(/CODE_NAME_CATEGORY_URL/g, valueCategory.substring(2));

		fs.writeFileSync(workspacePath + '/routes/' + valueComponent + '.js', routeTemplate);
	}

	// Agenda view
	{
		// Calendar View
		const componentViewFolder = piecesPath + '/views';
		const viewsFolder = workspacePath + '/views/' + valueComponent;
		fs.copySync(componentViewFolder, viewsFolder);

		const viewFile = workspacePath + '/views/' + valueComponent + '/view_agenda.dust';
		const urlEvent = valueEvent.substring(2);

		let viewTemplate = fs.readFileSync(viewFile, 'utf8');
		viewTemplate = viewTemplate.replace(/CODE_NAME_LOWER/g, valueComponent);
		viewTemplate = viewTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);
		viewTemplate = viewTemplate.replace(/MODULE_NAME/g, data.np_module.name);
		viewTemplate = viewTemplate.replace(/URL_ROUTE/g, valueComponent.substring(2));
		viewTemplate = viewTemplate.replace(/URL_EVENT/g, urlEvent);

		fs.writeFileSync(viewFile, viewTemplate);

		// Copy the event view folder
		fs.copySync(piecesPath + '/views_event', workspacePath + '/views/' + valueEvent);

		// Replace variable in each files
		const fileToReplace = ["show_fields", "create_fields", "update_fields", "create", "update"];

		for (let i = 0; i < fileToReplace.length; i++) {
			const eventFile = workspacePath + '/views/' + valueEvent + '/' + fileToReplace[i] + '.dust';
			var eventTemplate = fs.readFileSync(eventFile, 'utf8');

			eventTemplate = eventTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);
			eventTemplate = eventTemplate.replace(/URL_EVENT/g, urlEvent);
			eventTemplate = eventTemplate.replace(/MODULE_NAME/g, data.np_module.name);

			fs.writeFileSync(eventFile, eventTemplate, 'utf8');
		}
	}

	// Add access managment to Agenda
	addAccessManagment(data.application.name, urlComponent, data.np_module.name.substring(2))
	// Add Event translation
	await translateHelper.writeLocales(data.application.name, "component", valueComponent, showComponentName, data.googleTranslate);

	// FR translation of the component
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueEvent, "label_entity"], "Événement");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueEvent, "name_entity"], "Événement");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueEvent, "plural_entity"], "Événement");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueEvent, "f_title"], "Titre");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueEvent, "f_place"], "Lieu");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueEvent, "f_start_date"], "Date de début");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueEvent, "f_end_date"], "Date de fin");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueEvent, "f_all_day"], "Toute la journée");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueEvent, "r_category"], "Catégorie");

	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueCategory, "label_entity"], "Catégorie");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueCategory, "name_entity"], "Catégorie");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueCategory, "plural_entity"], "Catégorie");
	translateHelper.updateLocales(data.application.name, "fr-FR", ["entity", valueCategory, "f_color"], "Couleur");

	const layoutFileName = workspacePath + '/views/layout_' + data.np_module.name + '.dust';

	const $ = await domHelper.read(layoutFileName);

	$("#" + urlEvent + "_menu_item").remove();
	$("#" + urlCategory + "_menu_item").remove();

	const li = "\
	<li id='" + urlComponent + "_menu_item' style='display:block;' class='treeview'>\n\
		<a href='#'>\n\
			<i class='fa fa-calendar-o'></i>\n\
			<span><!--{#__ key=\"component." + valueComponent + ".label_component\" /}--></span>\n\
			<i class='fa fa-angle-left pull-right'></i>\n\
		</a>\n\
		<ul class='treeview-menu'>\n\
			<li>\n\
				<a href='/" + urlComponent + "'>\n\
					<i class='fa fa-calendar'></i>\n\
					<!--{#__ key=\"global_component.agenda.menu\" /}-->\n\
				</a>\n\
			</li>\n\
			<li id='" + urlEvent + "_menu_item' style='display:block;' class='treeview'>\n\
				<a href='#'>\n\
					<i class='fa fa-calendar-plus-o'></i>\n\
					<!--{#__ key=\"entity." + valueEvent + ".label_entity\" /}-->\n\
					<i class='fa fa-angle-left pull-right'></i>\n\
				</a>\n\
				<ul class='treeview-menu'>\n\
					<li>\n\
						<a href='/" + urlEvent + "/create_form'>\n\
							<i class='fa fa-plus'></i>\n\
							<!--{#__ key=\"operation.create\" /}-->&nbsp;<!--{#__ key=\"entity." + valueEvent + ".label_entity\" /}-->\n\
						</a>\n\
					</li>\n\
					<li>\n\
						<a href='/" + urlEvent + "/list'>\n\
							<i class='fa fa-list'></i>\n\
							<!--{#__ key=\"operation.list\" /}-->&nbsp;<!--{#__ key=\"entity." + valueEvent + ".plural_entity\" /}-->\n\
						</a>\n\
					</li>\n\
				</ul>\n\
			</li>\n\
			<li id='" + urlCategory + "_menu_item' style='display:block;' class='treeview'>\n\
				<a href='#'>\n\
					<i class='fa fa-bookmark'></i> <!--{#__ key=\"entity." + valueCategory + ".label_entity\" /}-->\n\
					<i class='fa fa-angle-left pull-right'></i>\n\
				</a>\n\
				<ul class='treeview-menu'>\n\
					<li>\n\
						<a href='/" + urlCategory + "/create_form'>\n\
							<i class='fa fa-plus'></i>\n\
							<!--{#__ key=\"operation.create\" /}-->&nbsp;<!--{#__ key=\"entity." + valueCategory + ".label_entity\" /}-->\n\
						</a>\n\
					</li>\n\
					<li>\n\
						<a href='/" + urlCategory + "/list'>\n\
							<i class='fa fa-list'></i>\n\
							<!--{#__ key=\"operation.list\" /}-->&nbsp;<!--{#__ key=\"entity." + valueCategory + ".plural_entity\" /}-->\n\
						</a>\n\
					</li>\n\
				</ul>\n\
			</li>\n\
		</ul>\n\
	</li>\n";

	// Add new html to document
	$('#sortable').append(li);

	// Write back to file
	await domHelper.write(layoutFileName, $);

	// Clean empty and useless dust helper created by removing <li>
	var layoutContent = fs.readFileSync(layoutFileName, 'utf8');

	// Remove empty dust helper
	layoutContent = layoutContent.replace(/{#entityAccess entity=".+"}\W*{\/entityAccess}/g, "");

	fs.writeFileSync(layoutFileName, layoutContent);
	return true;
}

exports.deleteAgenda = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const layoutFileName = workspacePath + '/views/layout_' + data.np_module.name + '.dust';

	// Remove agenda controller
	fs.unlinkSync(workspacePath + '/routes/' + data.options.value + '.js');

	// Delete views folder
	helpers.rmdirSyncRecursive(workspacePath + '/views/' + data.options.value);

	const $ = await domHelper.read(layoutFileName);
	$("#" + data.options.urlValue + "_menu_item").remove();
	// Write back to file
	await domHelper.write(layoutFileName, $)

	// Clean empty and useless dust helper created by removing <li>
	let layoutContent = fs.readFileSync(layoutFileName, 'utf8');

	// Remove empty dust helper
	layoutContent = layoutContent.replace(/{#entityAccess entity=".+"}\W*{\/entityAccess}/g, "");

	fs.writeFileSync(layoutFileName, layoutContent);
	return true;
}

exports.newStatus = async (data) => {
	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const piecesPath = __dirname + '/../structure/pieces/component/status';
	const source = data.entity.name;

	// Rename history model, options, attributes files and view folder
	fs.renameSync(workspacePath + '/models/e_' + data.history_table_db_name + '.js', workspacePath + '/models/e_' + data.history_table + '.js');
	fs.renameSync(workspacePath + '/models/attributes/e_' + data.history_table_db_name + '.json', workspacePath + '/models/attributes/e_' + data.history_table + '.json');
	fs.renameSync(workspacePath + '/models/options/e_' + data.history_table_db_name + '.json', workspacePath + '/models/options/e_' + data.history_table + '.json');
	fs.renameSync(workspacePath + '/views/e_' + data.history_table_db_name, workspacePath + '/views/e_' + data.history_table);
	// Delete useless route and api history controllers
	fs.unlinkSync(workspacePath + '/routes/e_' + data.history_table_db_name + '.js');
	fs.unlinkSync(workspacePath + '/api/e_' + data.history_table_db_name + '.js');

	// Change model name of history table
	let historyModel = fs.readFileSync(workspacePath + '/models/e_' + data.history_table + '.js', 'utf8');
	historyModel = historyModel.replace(/e_[^_]_history_[^.]+.json/g, 'e_' + data.history_table + '.json');
	historyModel = historyModel.replace(/(buildAssociation\(')([^']+)'/, '$1E_' + data.history_table + '\'');
	historyModel = historyModel.replace(/(sequelize.define\(')([^']+)'/, '$1E_' + data.history_table + '\'');
	historyModel = historyModel.replace(/(addHooks\(Model, ')([^']+)'/, '$1' + data.history_table + '\'');
	fs.writeFileSync(workspacePath + '/models/e_' + data.history_table + '.js', historyModel, 'utf8');

	// Add virtual status field to source entity (s_statusName)
	const attributesObj = JSON.parse(fs.readFileSync(workspacePath + '/models/attributes/' + source + '.json'));
	attributesObj[data.options.value] = {
		type: "VIRTUAL",
		history_table: 'e_' + data.history_table_db_name,
		history_model: 'e_' + data.history_table
	};
	fs.writeFileSync(workspacePath + '/models/attributes/' + source + '.json', JSON.stringify(attributesObj, null, 4), 'utf8');

	// Replace history table name with history model name in access file
	const access = JSON.parse(fs.readFileSync(workspacePath + '/config/access.json', 'utf8'));
	for (const npsModule in access)
		for (let i = 0; i < access[npsModule].entities.length; i++)
			if (access[npsModule].entities[i].name == data.history_table_db_name)
				access[npsModule].entities[i].name = data.history_table;

	fs.writeFileSync(workspacePath + '/config/access.json', JSON.stringify(access, null, 4), 'utf8');
	fs.writeFileSync(workspacePath + '/config/access.lock.json', JSON.stringify(access, null, 4), 'utf8');

	// Change target of source entity to match history MODEL name (instead of TABLE name)
	const optionsObj = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + source + '.json'));
	for (const opt in optionsObj)
		if (optionsObj[opt].target == 'e_' + data.history_table_db_name)
			{optionsObj[opt].target = 'e_' + data.history_table;break;}
	fs.writeFileSync(workspacePath + '/models/options/' + source + '.json', JSON.stringify(optionsObj, null, 4), 'utf8');

	// Remove useless options on e_status
	const statusModel = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_status.json'));
	for (let i = 0; i < statusModel.length; i++)
		if (statusModel[i].target == 'e_' + data.history_table_db_name)
			{statusModel.splice(i, 1);break;}
	fs.writeFileSync(workspacePath + '/models/options/e_status.json', JSON.stringify(statusModel, null, 4), 'utf8');

	// Remove useless options on e_user (association hasMany with history table needs to be removed)
	const userModel = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_user.json'));
	for (let i = 0; i < userModel.length; i++)
		if (userModel[i].target == 'e_' + data.history_table_db_name)
			{userModel.splice(i, 1);break;}
	fs.writeFileSync(workspacePath + '/models/options/e_user.json', JSON.stringify(userModel, null, 4), 'utf8');

	// Remove useless options in toSync
	const toSync = JSON.parse(fs.readFileSync(workspacePath + '/models/toSync.json', 'utf8'));
	for (const prop in toSync) {
		if (prop.indexOf('e_status') != -1)
			for (let i = 0; i < toSync[prop].options.length; i++)
				if (toSync[prop].options[i].target.indexOf("_history_") != -1)
					toSync[prop].options.splice(i, 1);

		if (prop.indexOf('_history_') > 0)
			toSync[prop].options = undefined;
	}
	fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify(toSync, null, 4), 'utf8');

	// Remove useless history tab from Status views
	let $ = await domHelper.read(workspacePath + "/views/e_status/show_fields.dust")
	const historyId = 'r_' + data.history_table;
	$("#" + historyId + "-click").parent().remove();
	$("#" + historyId).remove();
	await domHelper.write(workspacePath + "/views/e_status/show_fields.dust", $);

	// Replace traduction keys in show_fields
	let show_fieldsFILE = fs.readFileSync(workspacePath + "/views/" + source + "/show_fields.dust", 'utf8');
	let reg = new RegExp(data.history_table_db_name, 'g');
	show_fieldsFILE = show_fieldsFILE.replace(reg, data.history_table);
	fs.writeFileSync(workspacePath + "/views/" + source + "/show_fields.dust", show_fieldsFILE, 'utf8');
	const statusAlias = 'r_' + data.options.value.substring(2);
	const statusAliasHTML = 'f_' + data.options.value.substring(2);
	const statusAliasSubstring = statusAlias.substring(2);
	// Customize history tab list
	$ = await domHelper.read(workspacePath + '/views/e_' + data.history_table + '/list_fields.dust');

	// History list
	{
		// Remove buttons i.e last two th/td
		$("tbody tr td").slice(5, 7).remove();
		$("thead").each(function () {
			$(this).find("tr th").slice(5, 7).remove();
		});
		// Remove id column
		$("[data-field=id]").remove();
		// Add createdAt column in thead/tbody
		let newTh = '';
		newTh += '<th data-field="createdAt" data-col="createdAt" data-type="date">\n';
		newTh += '	<!--{#__ key="defaults.createdAt"/}-->\n';
		newTh += '</th>\n';
		$(".fields").each(function () {
			$(this).find("th:eq(0)").before(newTh);
		});
		$("#bodyTR td:eq(2)").after('<td data-field="createdAt" data-type="text">{createdAt|datetime}</td>');
		// Remove delete button
		$("#bodyTR td:last").remove();
	}

	// LOCALS
	{
		// Change history tab locales
		const localesFR = JSON.parse(fs.readFileSync(workspacePath + '/locales/fr-FR.json', 'utf8'));
		localesFR.entity['e_' + data.history_table_db_name]['as_r_history_' + data.options.urlValue] = "Historique " + data.options.showValue;
		localesFR.entity['e_' + data.history_table_db_name]['f_comment'] = "Commentaire";
		localesFR.entity['e_' + data.history_table_db_name]['r_modified_by'] = "Modifié par";
		localesFR.entity['e_' + data.history_table_db_name]['as_r_' + data.history_table] = "Historique " + statusAliasSubstring + " " + source.substring(2);
		localesFR.entity['e_' + data.history_table_db_name].label_entity = "Historique " + statusAliasSubstring + " " + source.substring(2);
		localesFR.entity['e_' + data.history_table_db_name].name_entity = "Historique " + statusAliasSubstring + " " + source.substring(2);
		localesFR.entity['e_' + data.history_table_db_name].plural_entity = "Historique " + statusAliasSubstring + " " + source.substring(2);
		// Rename traduction key to use history MODEL value, delete old traduction key
		localesFR.entity['e_' + data.history_table] = localesFR.entity['e_' + data.history_table_db_name];
		localesFR.entity['e_' + data.history_table_db_name] = undefined;
		// Change entity's status tab name for FR (Historique instead of History)
		localesFR.entity[source]['r_history_'+data.options.urlValue] = "Historique "+data.options.showValue;
		fs.writeFileSync(workspacePath + '/locales/fr-FR.json', JSON.stringify(localesFR, null, 4), 'utf8');

		const localesEN = JSON.parse(fs.readFileSync(workspacePath + '/locales/en-EN.json', 'utf8'));
		localesEN.entity['e_' + data.history_table_db_name]['as_r_' + data.history_table] = "History " + source.substring(2) + " " + statusAliasSubstring;
		localesEN.entity['e_' + data.history_table_db_name].label_entity = "History " + source.substring(2) + " " + statusAliasSubstring;
		localesEN.entity['e_' + data.history_table_db_name].name_entity = "History " + source.substring(2) + " " + statusAliasSubstring;
		localesEN.entity['e_' + data.history_table_db_name].plural_entity = "History " + source.substring(2) + " " + statusAliasSubstring;
		// Rename traduction key to use history MODEL value, delete old traduction key
		localesEN.entity['e_' + data.history_table] = localesEN.entity['e_' + data.history_table_db_name];
		localesEN.entity['e_' + data.history_table_db_name] = undefined;
		fs.writeFileSync(workspacePath + '/locales/en-EN.json', JSON.stringify(localesEN, null, 4), 'utf8');
	}

	await domHelper.write(workspacePath + '/views/e_' + data.history_table + '/list_fields.dust', $);

	// Replace history traductions with history_table key
	let listFields = fs.readFileSync(workspacePath + '/views/e_' + data.history_table + '/list_fields.dust', 'utf8');
	reg = new RegExp(data.history_table_db_name, 'g');
	listFields = listFields.replace(reg, data.history_table);
	fs.writeFileSync(workspacePath + '/views/e_' + data.history_table + '/list_fields.dust', listFields, 'utf8');

	// Display status as a badge instead of an input
	// Also add next status buttons after status field
	$ = await domHelper.read(workspacePath + '/views/' + source + '/show_fields.dust');
	const statusBadgeHtml = '<br>\n<span class="badge" style="background: {' + statusAlias + '.f_color};">{' + statusAlias + '.f_name}</span>';
	let nextStatusHtml = '';
	nextStatusHtml += '<div class="form-group">\n';
	nextStatusHtml += '	 {#' + statusAlias + '.r_children ' + source.substring(2) + 'id=id}\n';
	nextStatusHtml += '		 {#checkStatusPermission status=.}\n';
	nextStatusHtml += '			 <a data-href="/' + source.substring(2) + '/set_status/{' + source.substring(2) + 'id}/{f_field}/{id}" data-comment="{f_comment}" class="status btn btn-info" style="margin-right: 5px;"><!--{^f_button_label}{f_name}{:else}{f_button_label}{/f_button_label}--></a>\n';
	nextStatusHtml += '		 {/checkStatusPermission}\n';
	nextStatusHtml += '	 {/' + statusAlias + '.r_children}\n';
	nextStatusHtml += '</div>\n';
	$("div[data-field='" + statusAliasHTML + "']").find('input').replaceWith(statusBadgeHtml);
	$("div[data-field='" + statusAliasHTML + "']").append(nextStatusHtml);
	// Input used for default ordering

	// Remove create button
	const historyTabId = "#r_history_" + data.options.urlValue;
	$(historyTabId).find('a.btn-success').remove();
	await domHelper.write(workspacePath + '/views/' + source + '/show_fields.dust', $);

	// Remove status field from update_fields and create_fields
	$ = await domHelper.read(workspacePath + '/views/' + source + '/create_fields.dust');
	$("div[data-field='" + statusAliasHTML + "']").remove();
	await domHelper.write(workspacePath + '/views/' + source + '/create_fields.dust', $);

	$ = await domHelper.read(workspacePath + '/views/' + source + '/update_fields.dust');
	$("div[data-field='" + statusAliasHTML + "']").remove();
	await domHelper.write(workspacePath + '/views/' + source + '/update_fields.dust', $);

	// Update list field to show status color in datalist
	$ = await domHelper.read(workspacePath + '/views/' + source + '/list_fields.dust');
	$("th[data-field='" + statusAlias + "']").each(function () {
		$(this).data("data-type", "status");
	});
	$("td[data-field='" + statusAlias + "']").data("data-type", "status");
	$("td[data-field='" + statusAlias + "']").data("data-color", "{" + statusAlias + ".f_color}");
	await domHelper.write(workspacePath + '/views/' + source + '/list_fields.dust', $)

	return await translateHelper.writeLocales(data.application.name, 'field', source, [data.options.value, data.options.showValue], false)
}

exports.deleteStatus = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	// Delete history views
	helpers.rmdirSyncRecursive(workspacePath + '/views/' + data.historyName);
	// Delete history model
	fs.unlinkSync(workspacePath + '/models/' + data.historyName + '.js');
	fs.unlinkSync(workspacePath + '/models/attributes/' + data.historyName + '.json');
	fs.unlinkSync(workspacePath + '/models/options/' + data.historyName + '.json');

	// Add DROP TABLE query in toSync.json
	const toSyncObject = JSON.parse(fs.readFileSync(workspacePath + '/models/toSync.json', 'utf8'));
	if (typeof toSyncObject.queries !== "object")
		toSyncObject.queries = [];

	toSyncObject.queries.push("DROP TABLE " + data.historyTableName);
	fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify(toSyncObject, null, 4), 'utf8');

	// Clean attribute status field
	const attributesPath = workspacePath + '/models/attributes/' + data.entity + '.json';
	const attributes = JSON.parse(fs.readFileSync(attributesPath), 'utf8');
	for(const attribute in attributes)
		if(attribute == data.status_field)
			delete attributes[attribute];
	fs.writeFileSync(attributesPath, JSON.stringify(attributes, null, 4), 'utf8');

	// Clean options
	let source, options, idxToRemove;
	fs.readdirSync(workspacePath + '/models/options/').filter(file => {
		return file.indexOf('.') !== 0 && file.slice(-5) === '.json';
	}).forEach(file => {
		source = file.slice(0, -5);
		options = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + file));
		idxToRemove = [];

		// Looking for option link with history table
		for (let i = 0; i < options.length; i++){
			if(data.fk_status == options[i].foreignKey){
				// Status field relation
				idxToRemove.push(i);
			} else if (options[i].target == data.historyName){
				// History table relation
				idxToRemove.push(i);
			}
		}

		options = options.filter((val, idx, arr) => {
			return idxToRemove.indexOf(idx) == -1
		});

		fs.writeFileSync(workspacePath + '/models/options/' + file, JSON.stringify(options, null, 4), 'utf8')
	});

	const statusName = data.status_field.substring(2);

	// Remove status from views
	let $ = await domHelper.read(workspacePath + '/views/' + data.entity + '/show_fields.dust');
	$("div[data-field='f_" + statusName + "']").remove();
	$("a#r_history_" + statusName + "-click").parent().remove();
	$("div#r_history_" + statusName).remove();
	await domHelper.write(workspacePath + '/views/' + data.entity + '/show_fields.dust', $);

	$ = await domHelper.read(workspacePath + '/views/' + data.entity + '/list_fields.dust');
	$("th[data-field='r_" + statusName + "']").remove();
	await domHelper.write(workspacePath + '/views/' + data.entity + '/list_fields.dust', $);

	// Clean locales
	translateHelper.removeLocales(data.application.name, 'entity', data.historyName, _ => {});
	translateHelper.removeLocales(data.application.name, 'field', [data.entity, "r_history_" + statusName], _ => {});
	translateHelper.removeLocales(data.application.name, 'field', [data.entity, "r_" + statusName], _ => {});
	translateHelper.removeLocales(data.application.name, 'field', [data.entity, "s_" + statusName], _ => {});

	// Clean access
	const access = JSON.parse(fs.readFileSync(workspacePath + '/config/access.lock.json', 'utf8'));
	let idToRemove;
	for (const npsModule in access){
		idToRemove = false;
		for (let i = 0; i < access[npsModule].entities.length; i++)
			if (access[npsModule].entities[i].name == data.historyName.substring(2))
				idToRemove = i;

		if(idToRemove)
			access[npsModule].entities = access[npsModule].entities.filter((x, idx) => idx != idToRemove);
	}
	fs.writeFileSync(workspacePath + '/config/access.lock.json', JSON.stringify(access, null, 4), 'utf8');

	return true;
}

exports.setupChat = async (data) => {
	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const piecesPath = __dirname + '/../structure/pieces/component/socket';

	// Copy chat files
	fs.copySync(piecesPath + '/chat/js/chat.js', workspacePath + '/public/js/Newmips/component/chat.js');
	fs.copySync(piecesPath + '/chat/chat_utils.js', workspacePath + '/utils/chat.js');
	fs.copySync(piecesPath + '/chat/routes/chat.js', workspacePath + '/routes/chat.js');

	// Copy chat models
	const chatModels = ['e_channel', 'e_channelmessage', 'e_chatmessage', 'e_user_channel', 'e_user_chat', 'e_chat'];
	for (let i = 0; i < chatModels.length; i++) {
		fs.copySync(piecesPath + '/chat/models/' + chatModels[i] + '.js', workspacePath + '/models/' + chatModels[i] + '.js');
		// let model = fs.readFileSync(workspacePath + '/models/' + chatModels[i] + '.js', 'utf8');
		// model = model.replace(/ID_APPLICATION/g, attr.id_application);
		// fs.writeFileSync(workspacePath + '/models/' + chatModels[i] + '.js', model, 'utf8');
	}
	// Copy attributes
	fs.copySync(piecesPath + '/chat/models/attributes/', workspacePath + '/models/attributes/');
	// Copy options
	fs.copySync(piecesPath + '/chat/models/options/', workspacePath + '/models/options/');

	// Add belongsToMany with e_channel to e_user, belongsToMany with e_user to e_chat
	const userOptions = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_user.json'));
	userOptions.push({
		target: 'e_chat',
		relation: 'belongsToMany',
		foreignKey: 'id_user',
		otherKey: 'id_chat',
		through: 'chat_user_chat',
		as: 'r_chat'
	});
	userOptions.push({
		target: "e_channel",
		relation: "belongsToMany",
		foreignKey: "id_user",
		otherKey: "id_channel",
		through: "chat_user_channel",
		as: "r_user_channel"
	});
	fs.writeFileSync(workspacePath + '/models/options/e_user.json', JSON.stringify(userOptions, null, 4), 'utf8')

	// Set socket and chat config to enabled/true
	const appConf = JSON.parse(fs.readFileSync(workspacePath + '/config/application.json'));
	appConf.socket.enabled = true;
	appConf.socket.chat = true;
	fs.writeFileSync(workspacePath + '/config/application.json', JSON.stringify(appConf, null, 4), 'utf8');

	// Add custom user_channel/user_chat columns to toSync file
	// Id will not be used but is required by sequelize to be able to query on the junction table
	const toSync = JSON.parse(fs.readFileSync(workspacePath + '/models/toSync.json'));
	toSync['chat_user_channel'] = {
		attributes: {
			id_last_seen_message: {type: 'INTEGER', default: 0},
			id: {
				type: "INTEGER",
				autoIncrement: true,
				primaryKey: true
			}
		},
		force: true
	};
	toSync['chat_user_chat'] = {
		attributes: {
			id_last_seen_message: {type: 'INTEGER', default: 0},
			id: {
				type: "INTEGER",
				autoIncrement: true,
				primaryKey: true
			}
		},
		force: true
	};
	fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify(toSync, null, 4), 'utf8');

	// Add chat locales
	const newLocalesEN = JSON.parse(fs.readFileSync(piecesPath + '/chat/locales/en-EN.json'));
	translateHelper.writeTree(data.application.name, newLocalesEN, 'en-EN');
	const newLocalesFR = JSON.parse(fs.readFileSync(piecesPath + '/chat/locales/fr-FR.json'));
	translateHelper.writeTree(data.application.name, newLocalesFR, 'fr-FR');

	// Add chat dust template to main_layout
	const $layout = await domHelper.read(workspacePath + '/views/main_layout.dust');
	const $chat = await domHelper.read(piecesPath + '/chat/views/chat.dust');

	$layout("#chat-placeholder").html($chat("body")[0].innerHTML);

	await domHelper.writeMainLayout(workspacePath + '/views/main_layout.dust', $layout);

	return true;
};

exports.addNewComponentAddress = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name + '/';
	const address_path = __dirname + '/pieces/component/address/';
	const address_utils = require(__dirname + '/pieces/component/address/utils/address_utils');

	// Models
	const modelAttributes = JSON.parse(fs.readFileSync(address_path + 'models/attributes/e_address.json', 'utf8'));

	// Generate views data
	const fields = address_utils.generateFields(data.options.showValue, data.options.value);

	// Update model attributes
	for (const attribute in fields.db_fields)
		modelAttributes[attribute] = fields.db_fields[attribute];

	//save new model component attributes file
	fs.writeFileSync(workspacePath + 'models/attributes/' + data.options.value + '.json', JSON.stringify(modelAttributes, null, 4), 'utf8');
	fs.copySync(address_path + 'models/options/e_address.json', workspacePath + 'models/options/' + data.options.value + '.json');

	const createFieldsFile = workspacePath + 'views/' + data.entity.name + '/' + 'create_fields.dust';
	const updateFieldsFile = workspacePath + 'views/' + data.entity.name + '/' + 'update_fields.dust';
	const showFieldsFile = workspacePath + 'views/' + data.entity.name + '/' + 'show_fields.dust';

	let showHtml = fs.readFileSync(address_path + 'views/show.dust', 'utf8');
	showHtml = showHtml.replace(/COMPONENT_NAME/g, data.options.value);

	const appendTo = '#fields';
	const mapsHtml = '<div id="' + data.options.value + '" class="address_maps ' + data.options.value + '" mapsid="' + data.options.value + '" style="margin-top: 25px !important"></div>';
	fs.mkdirpSync(workspacePath + 'views/' + data.options.value);
	fs.writeFileSync(workspacePath + 'views/' + data.options.value + '/maps.dust', mapsHtml);
	fs.writeFileSync(workspacePath + 'views/' + data.options.value + '/create_fields.dust', fields.createHtml);
	fs.writeFileSync(workspacePath + 'views/' + data.options.value + '/update_fields.dust', fields.updateHtml);
	fs.writeFileSync(workspacePath + 'views/' + data.options.value + '/fields.dust', fields.showFieldsHtml);
	fs.writeFileSync(workspacePath + 'views/' + data.options.value + '/show.dust', showHtml);
	fs.writeFileSync(workspacePath + 'views/' + data.options.value + '/list_fields.dust', fields.headers);

	const $createFieldsFile = await domHelper.read(createFieldsFile);
	const $updateFieldsFile = await domHelper.read(updateFieldsFile);
	const $showFieldsFile = await domHelper.read(showFieldsFile);

	$createFieldsFile(appendTo).append('<div data-field="' + data.options.value + '" class="' + data.options.value + ' fieldLineHeight col-xs-12">{>"' + data.options.value + '/create_fields"/}</div>');
	$updateFieldsFile(appendTo).append('<div data-field="' + data.options.value + '" class="' + data.options.value + ' fieldLineHeight col-xs-12">{>"' + data.options.value + '/update_fields"/}</div>');
	$showFieldsFile(appendTo).append('<div data-field="' + data.options.value + '" class="' + data.options.value + ' fieldLineHeight col-xs-12">{>"' + data.options.value + '/show"/}</div>');

	await domHelper.write(createFieldsFile, $createFieldsFile);
	await domHelper.write(updateFieldsFile, $updateFieldsFile);
	await domHelper.write(showFieldsFile, $showFieldsFile);

	const parentBaseFile = workspacePath + 'views/' + data.entity.name;

	await require('./structure_field').updateListFile(parentBaseFile, 'list_fields', fields.singleAddressTableDFields.header, fields.singleAddressTableDFields.body);

	// Update locales
	var langFR = JSON.parse(fs.readFileSync(workspacePath + 'locales/fr-FR.json', 'utf8'));
	var langEN = JSON.parse(fs.readFileSync(workspacePath + 'locales/en-EN.json', 'utf8'));
	langFR.entity[data.options.value] = fields.locales.fr;
	langFR.entity[data.entity.name].r_address = 'Adresse';
	langEN.entity[data.options.value] = fields.locales.en;
	langEN.entity[data.entity.name].r_address = 'Address';

	// CREATE MODEL FILE
	let modelTemplate = fs.readFileSync(__dirname + '/../structure/pieces/component/address/models/model_address.js', 'utf8');
	modelTemplate = modelTemplate.replace(/COMPONENT_NAME_LOWER/g, data.options.value);
	modelTemplate = modelTemplate.replace(/COMPONENT_NAME/g, data.options.value.charAt(0).toUpperCase() + data.options.value.toLowerCase().slice(1));
	modelTemplate = modelTemplate.replace(/TABLE_NAME/g, data.options.value);
	fs.writeFileSync(workspacePath + 'models/' + data.options.value + '.js', modelTemplate);

	// Check if component config exist, if not we create it
	let address_settings_config;

	const configPath = workspacePath + 'config/address_settings.json';
	if (!fs.existsSync(configPath)) {

		// Files doesn't exist
		address_settings_config = {entities: {}};

		// Add settings locales
		langFR.component.address_settings = {
			"label_component": "Configuration adresse",
			"position": "Position de la carte",
			"top": "Au dessus",
			"right": "A droite",
			"bottom": "En dessous",
			"left": "A gauche",
			"distance": "Afficher la distance",
			"settings": "Configurer",
			"enableMaps": "Activer la carte",
			"entity": "Entité",
			"zoomBar": "Afficher panneau de zoom",
			"navigation": "Activer la navigation",
			"mousePosition": "Afficher les coordonnées de la souris",
			"addressNotValid": "Adresse non valide",
			"info_address_maps": "Pour avoir une carte valide, veuillez utiliser le champ ci-dessous pour saisir l'adresse"
		};
		langEN.component.address_settings = {
			"label_component": "Addresses settings",
			"position": "Map position",
			"top": "Top",
			"right": "Right",
			"bottom": "Bottom",
			"left": "Left",
			"distance": "Display distance",
			"settings": "Settings",
			"enableMaps": "Enable Map",
			"entity": "Entity",
			"zoomBar": "Display zoom bar",
			"navigation": "Enable navigation",
			"mousePosition": "Display mouse coordinate",
			"addressNotValid": "Not valid address",
			"info_address_maps": "To have a valid map, please use the field below to enter the address"
		};

		// Add component address files
		fs.mkdirpSync(workspacePath + 'views/e_address_settings');
		fs.copySync(address_path + 'views/config.dust', workspacePath + 'views/e_address_settings/config.dust');
		fs.copySync(address_path + 'views/config_fields.dust', workspacePath + 'views/e_address_settings/config_fields.dust');
		fs.copySync(address_path + 'route/address_settings.js', workspacePath + 'routes/e_address_settings.js');

		addAccessManagment(data.application.name, "address_settings", 'administration');

		// Add new menu in administration for address settings
		const fileName = workspacePath + 'views/layout_m_administration.dust';

		// Read file and get jQuery instance
		const $ = await domHelper.read(fileName);
		const li = '\
		<!--{#entityAccess entity="address_settings"}-->\n\
			 <!--{#actionAccess entity="address_settings" action="create"}-->\
				 <li id="e_address_settings_menu_item" style="display:block;">\n\
					 <a href="/address_settings/config">\n\
						 <i class="fa fa-map-marker"></i>\n\
						 <span><!--{#__ key="component.address_settings.label_component" /}--></span>\n\
						 <i class="fa fa-angle-right pull-right"></i>\n\
					 </a>\n\
				 </li>\n\
			 <!--{/actionAccess}-->\n\
		<!--{/entityAccess}-->\n';

		// Add new html to document
		$('#sortable').append(li);

		// Write back to file
		await domHelper.write(fileName, $)
	} else {
		address_settings_config = JSON.parse(fs.readFileSync(configPath));
	}

	address_settings_config.entities[data.entity.name] = {
		"enableMaps": false,
		"mapsPosition": {
			"top": false,
			"right": true,
			"bottom": false,
			"left": false
		},
		"estimateDistance": false,
		"zoomBar": false,
		"navigation": true,
		"mousePosition": false
	};

	// Set locales
	fs.writeFileSync(workspacePath + 'locales/fr-FR.json', JSON.stringify(langFR, null, 4), 'utf8');
	fs.writeFileSync(workspacePath + 'locales/en-EN.json', JSON.stringify(langEN, null, 4), 'utf8');

	// Update or create address settings
	fs.writeFileSync(workspacePath + 'config/address_settings.json', JSON.stringify(address_settings_config, null, 4));
	return true;
};

exports.deleteComponentAddress = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name + '/';

	fs.remove(workspacePath + 'views/' + data.options.value);
	fs.remove(workspacePath + 'models/' + data.options.value + '.js');
	fs.remove(workspacePath + 'models/attributes/' + data.options.value + '.json');
	fs.remove(workspacePath + 'models/options/' + data.options.value + '.json');

	// Remove association
	const relations = JSON.parse(fs.readFileSync(workspacePath + 'models/options/' + data.entity.name + '.json', 'utf8'));
	for (let i = 0; i < relations.length; i++) {
		const relation = relations[i];
		if (relation.as == 'r_address') {
			relations.splice(i, 1);
			break;
		}
	}
	// Update relation file
	fs.writeFileSync(workspacePath + 'models/options/' + data.entity.name + '.json', JSON.stringify(relations, null, 4), 'utf8');

	const toDoFile = ['create_fields', 'update_fields', 'show_fields'];
	for (var i = 0; i < toDoFile.length; i++) {
		const $ = await domHelper.read(workspacePath + 'views/' + data.entity.name + '/' + toDoFile[i] + '.dust');
		$('.' + data.options.value).remove();
		await domHelper.write(workspacePath + 'views/' + data.entity.name + '/' + toDoFile[i] + '.dust', $);
	}

	// Remove Field In Parent List Field
	const $ = await domHelper.read(workspacePath + 'views/' + data.entity.name + '/list_fields.dust');
	$("th[data-field='" + data.entity.name + "']").remove();
	$("td[data-field='" + data.entity.name + "']").remove();
	await domHelper.write(workspacePath + 'views/' + data.entity.name + '/list_fields.dust', $)

	// Update locales
	const langFR = JSON.parse(fs.readFileSync(workspacePath + 'locales/fr-FR.json', 'utf8'));
	const langEN = JSON.parse(fs.readFileSync(workspacePath + 'locales/en-EN.json', 'utf8'));
	delete langFR.entity[data.options.value];
	delete langEN.entity[data.options.value];

	// Update address settings file
	const addressSettingsObj = JSON.parse(fs.readFileSync(workspacePath + 'config/address_settings.json'));

	for (const item in addressSettingsObj.entities)
		if (item === data.entity.name)
			delete addressSettingsObj.entities[item];

	if (Object.keys(addressSettingsObj.entities).length === 0) {
		fs.remove(workspacePath + 'views/e_address_settings');
		fs.remove(workspacePath + 'routes/e_address_settings.js');
		fs.remove(workspacePath + 'config/address_settings.json');
		delete langFR.component.address_settings;
		delete langEN.component.address_settings;
		deleteAccessManagment(data.application.name, "address_settings", "administration");

		// Read file and get jQuery instance
		const $ = await domHelper.read(workspacePath + 'views/layout_m_administration.dust');
		$('#e_address_settings_menu_item').remove();
		// Write back to file
		await domHelper.write(workspacePath + 'views/layout_m_administration.dust', $);

	} else {
		fs.writeFileSync(workspacePath + 'config/address_settings.json', JSON.stringify(addressSettingsObj, null, 4), 'utf8');
	}

	fs.writeFileSync(workspacePath + 'locales/fr-FR.json', JSON.stringify(langFR, null, 4), 'utf8');
	fs.writeFileSync(workspacePath + 'locales/en-EN.json', JSON.stringify(langEN, null, 4), 'utf8');
	return true;
};

exports.createComponentDocumentTemplate = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name + '/';
	const piecesPath = __dirname + '/pieces/component/document_template/';

	// Update locales
	const langFR = JSON.parse(fs.readFileSync(workspacePath + 'locales/fr-FR.json', 'utf8'));
	const langEN = JSON.parse(fs.readFileSync(workspacePath + 'locales/en-EN.json', 'utf8'));

	// Add administration configuration files
	if (!data.application.hasDocumentTemplate) {

		// Models
		let modelContent = fs.readFileSync(piecesPath + 'models/e_document_template.js', 'utf8');
		modelContent = modelContent.replace(/TABLE_NAME/g, 'e_document_template');
		modelContent = modelContent.replace(/MODEL_CODE_NAME/g, 'e_document_template');

		// Now copy model files
		fs.copySync(piecesPath + 'models/attributes/e_document_template.json', workspacePath + 'models/attributes/e_document_template.json');
		fs.copySync(piecesPath + 'models/options/e_document_template.json', workspacePath + 'models/options/e_document_template.json');
		fs.writeFileSync(workspacePath + 'models/e_document_template.js', modelContent, 'utf8');

		// Copy views files. Todo => move directory
		fs.copySync(piecesPath + 'views/create.dust', workspacePath + 'views/e_document_template/create.dust');
		fs.copySync(piecesPath + 'views/create_fields.dust', workspacePath + 'views/e_document_template/create_fields.dust');
		fs.copySync(piecesPath + 'views/list.dust', workspacePath + 'views/e_document_template/list.dust');
		fs.copySync(piecesPath + 'views/list_fields.dust', workspacePath + 'views/e_document_template/list_fields.dust');
		fs.copySync(piecesPath + 'views/show.dust', workspacePath + 'views/e_document_template/show.dust');
		fs.copySync(piecesPath + 'views/show_fields.dust', workspacePath + 'views/e_document_template/show_fields.dust');
		fs.copySync(piecesPath + 'views/update.dust', workspacePath + 'views/e_document_template/update.dust');
		fs.copySync(piecesPath + 'views/update_fields.dust', workspacePath + 'views/e_document_template/update_fields.dust');
		fs.copySync(piecesPath + 'views/readme.dust', workspacePath + 'views/e_document_template/readme.dust');
		fs.copySync(piecesPath + 'views/entity_helper_template.dust', workspacePath + 'views/e_document_template/entity_helper_template.dust');
		fs.copySync(piecesPath + 'views/global_variable_template.dust', workspacePath + 'views/e_document_template/global_variable_template.dust');
		fs.copySync(piecesPath + 'views/layout_document_template.dust', workspacePath + 'views/layout_document_template.dust');

		// Copy helper
		fs.copySync(piecesPath + 'utils/document_template_helper.js', workspacePath + 'utils/document_template_helper.js');
		fs.copySync(piecesPath + 'locales/document_template_locales.js', workspacePath + 'locales/document_template_locales.js');

		// Copy route file
		fs.copySync(piecesPath + 'routes/e_document_template.js', workspacePath + 'routes/e_document_template.js');

		// Add new entry for access
		addAccessManagment(data.application.name, data.options.urlValue, 'administration');

		// Set traduction
		langFR.entity.e_document_template = {
			label_entity: "Modèle de document",
			name_entity: "Modèle de document",
			plural_entity: "Modèle de documents",
			id_entity: "ID",
			f_name: "Nom du fichier",
			f_file: "Fichier",
			f_entity: "Entité",
			f_exclude_relations: "Sous entités"
		};

		langEN.entity.e_document_template = {
			label_entity: "Document template",
			name_entity: "Document template",
			plural_entity: "Document templates",
			id_entity: "ID",
			f_name: "Filename",
			f_file: "File",
			f_entity: "Entity",
			f_exclude_relations: "Sub entities"
		};

		// Now new Menu For Entity DocumentTemplate
		const fileName = workspacePath + '/views/layout_m_administration.dust';
		const $ = await domHelper.read(fileName);

		const li = "\
		<!--{#entityAccess entity=\"document_template\"}-->\n\
			<li id='document_template_menu_item' style='display:block;' class='treeview'>\n\
				<a href='#'>\n\
					<i class='fa fa-file-text'></i>\n\
					<span><!--{#__ key=\"entity.e_document_template.label_entity\" /}--></span>\n\
					<i class='fa fa-angle-left pull-right'></i>\n\
				</a>\n\
				<ul class='treeview-menu'>\n\
					<!--{#actionAccess entity=\"document_template\" action=\"create\"}-->\
						<li>\n\
							<a href='/document_template/create_form'>\n\
								<i class='fa fa-angle-double-right'></i>\n\
								<!--{#__ key=\"operation.create\" /}--> \n\
							</a>\n\
						</li>\
					<!--{/actionAccess}-->\
					<!--{#actionAccess entity=\"document_template\" action=\"read\"}-->\
						<li>\n\
							<a href='/document_template/list'>\n\
								<i class='fa fa-angle-double-right'></i>\n\
								<!--{#__ key=\"operation.list\" /}--> \n\
							</a>\n\
						</li>\n\
					<!--{/actionAccess}-->\
				</ul>\n\
			</li>\n\
		<!--{/entityAccess}-->\n";

		// Add new html to document
		$('#sortable').append(li);

		// Write back to file
		await domHelper.write(fileName, $);
	}

	langFR.entity.e_document_template["tab_name_" + data.entity.name] = data.options.showValue == 'Document template' ? 'Modèle de document' : data.options.showValue;
	langEN.entity.e_document_template["tab_name_" + data.entity.name] = data.options.showValue;
	fs.writeFileSync(workspacePath + 'locales/fr-FR.json', JSON.stringify(langFR, null, 4), 'utf8');
	fs.writeFileSync(workspacePath + 'locales/en-EN.json', JSON.stringify(langEN, null, 4), 'utf8');

	// New entry for source relation view
	const newLi = '\
	<li>\n\
		<a id="r_document_template-click" data-toggle="tab" href="#r_document_template">\n\
			<!--{#__ key="entity.e_document_template.tab_name_' + data.entity.name + '" /}-->\n\
		</a>\n\
	</li>';
	let newTabContent = fs.readFileSync(piecesPath + 'views/generate_doc.dust', 'utf8');
	newTabContent = newTabContent.replace(/ENTITY_DOC/g, data.entity.name.substring(2).charAt(0).toUpperCase() + data.entity.name.substring(2).slice(1));
	newTabContent = newTabContent.replace(/ENTITY/g, data.entity.name);
	await addTab(data.entity.name, workspacePath + 'views' + '/' + data.entity.name + '/show_fields.dust', newLi, newTabContent);

	return true;
};

exports.deleteComponentDocumentTemplate = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name + '/';
	const $ = await domHelper.read(workspacePath + 'views/' + data.entity.name + '/show_fields.dust');

	$('#r_' + data.options.urlValue + '-click').parent().remove(); //remove li tab
	$('#r_' + data.options.urlValue).remove(); //remove tab content div

	// If last tab have been deleted, remove tab structure from view
	if ($(".tab-content .tab-pane").length == 1)
		$("#tabs").replaceWith($("#home").html());

	await domHelper.write(workspacePath + 'views/' + data.entity.name + '/show_fields.dust', $);
	return true;
}