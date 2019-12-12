const fs = require("fs-extra");
const domHelper = require('../utils/jsDomHelper');
const helpers = require('../utils/helpers');
const translateHelper = require("../utils/translate");

async function addTab(data, file, newLi, newTabContent, target) {

	const $ = await domHelper.read(file);

	// Tabs structure doesn't exist, create it
	let context, tabs;
	if ($("#tabs").length == 0) {
		tabs = '\
		<div class="nav-tabs-custom" id="tabs">\n\
			<!--{^hideTab}-->\n\
			<ul class="nav nav-tabs">\n\
				<li class="active">\n\
					<a data-toggle="tab" href="#home"><!--{#__ key="entity.' + data.options.source + '.label_entity" /}--></a>\n\
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
	newLi = '<!--{#entityAccess entity="' + target.substring(2) + '"}-->\n' + newLi + '\n<!--{/entityAccess}-->';
	$(".nav-tabs", context).append(newLi);
	$(".tab-content", context).append('\
		<!--{^hideTab}-->\n\
			<!--{#entityAccess entity="' + target.substring(2) + '"}-->\n\
				' + newTabContent + '\n\
			<!--{/entityAccess}-->\n\
		<!--{/hideTab}-->\n');

	$('body').empty().append(context);

	return domHelper.write(file, $);
}

// Create entity associations between the models
exports.setupAssociation = (data) => {

	const workspacePath = __dirname+'/../workspace/' + data.application.name;
	const source = data.source;
	const target = data.target;
	const foreignKey = data.foreignKey;
	const as = data.as;
	const showAs = data.showAs;
	const relation = data.relation;
	const through = data.through;
	const toSync = data.toSync;
	const type = data.type;
	const constraints = data.constraints;
	const targetType = data.targetType;

	// SETUP MODEL OPTIONS FILE
	const optionsFileName = workspacePath + '/models/options/' + source + '.json';
	const optionsObject = JSON.parse(fs.readFileSync(optionsFileName));

	// If we are generating automatically a key and the alias is already used, then cancel
	for (let i = 0; i < optionsObject.length; i++)
		if(type == "auto_generate" && optionsObject[i].as == as)
			return;

	// Check for other auto_generate keys with same alias, if exist, remove it
	for (let i = 0; i < optionsObject.length; i++)
		if(optionsObject[i].as == as && optionsObject[i].type == "auto_generate")
			optionsObject.splice(i, 1);

	const baseOptions = {target: target, relation: relation};
	baseOptions.foreignKey = foreignKey;
	baseOptions.as = as;
	baseOptions.showAs = showAs;

	if (relation == "belongsToMany") {
		baseOptions.through = through;
		baseOptions.foreignKey = "fk_id_" + source;
		baseOptions.otherKey = "fk_id_" + target;
		if(source == target)
			baseOptions.otherKey += "_bis";
	}

	baseOptions.structureType = "";
	if (typeof targetType !== "undefined")
		baseOptions.targetType = targetType;
	if (type != null)
		baseOptions.structureType = type;

	if (constraints != null && !constraints)
		baseOptions.constraints = constraints;

	// Save using field in related to and related to many fields
	if (typeof data.usingField !== "undefined")
		baseOptions.usingField = data.usingField;

	// Load this association directly in standard route data
	if (typeof data.loadOnStart !== "undefined" && data.loadOnStart)
		baseOptions.loadOnStart = true;

	optionsObject.push(baseOptions);

	if (toSync) {
		// SETUP toSync.json
		const toSyncFileName = workspacePath + '/models/toSync.json';
		const toSyncObject = JSON.parse(fs.readFileSync(toSyncFileName));

		if (typeof toSyncObject[source] === "undefined") {
			toSyncObject[source] = {};
			toSyncObject[source].options = [];
		}
		else if (typeof toSyncObject[source].options === "undefined")
			toSyncObject[source].options = [];

		toSyncObject[source].options.push(baseOptions);
		fs.writeFileSync(toSyncFileName, JSON.stringify(toSyncObject, null, 4));
	}

	fs.writeFileSync(optionsFileName, JSON.stringify(optionsObject, null, 4));
	return;
};

exports.selectEntity = async (data) => {
	const layout_path = __dirname + '/../workspace/' + data.application.name + '/views/layout_' + data.module.name + '.dust';
	const $ = await domHelper.read(layout_path);

	// Check if entity is a subEntity or not to do the redirection if needed
	if (typeof $('#' + data.entity_name + '_menu_item')[0] !== "undefined")
		return true;
	return false;
};

exports.setupEntity = async (data) => {

	const module_name = data.np_module.name;
	let addInSidebar = true;

	const piecesPath = __dirname + "/pieces";
	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	let entity_name, entity_url, entity_display_name;
	if (data.function === "createNewHasOne" || data.function === 'createNewHasMany') {
		// Sub entity generation
		entity_name = data.options.target;
		entity_display_name = data.options.showTarget;
		entity_url = data.options.urlTarget;
		addInSidebar = false;
	} else {
		// Simple entity generation
		entity_name = data.options.value;
		entity_display_name = data.options.showValue;
		entity_url = data.options.urlValue;
	}

	const entity_model = entity_name.charAt(0).toUpperCase() + entity_name.toLowerCase().slice(1);

	// CREATE MODEL FILE
	let modelTemplate = fs.readFileSync(piecesPath + '/models/data_entity.js', 'utf8');
	modelTemplate = modelTemplate.replace(/MODEL_NAME_LOWER/g, entity_name);
	modelTemplate = modelTemplate.replace(/MODEL_NAME/g, entity_model);
	modelTemplate = modelTemplate.replace(/TABLE_NAME/g, entity_name);
	fs.writeFileSync(workspacePath+ '/models/'+entity_name+'.js', modelTemplate);

	// CREATE MODEL ATTRIBUTES FILE
	const baseAttributes = {
		"id": {
			"type": "INTEGER",
			"autoIncrement": true,
			"primaryKey": true
		},
		"version": {
			"type": "INTEGER",
			"defaultValue": 1
		},
		"createdBy": {
			"type": "STRING",
			"defaultValue": null,
			"validate": false
		},
		"updatedBy": {
			"type": "STRING",
			"defaultValue": null,
			"validate": false
		}
	};
	fs.writeFileSync(workspacePath + '/models/attributes/' + entity_name + '.json', JSON.stringify(baseAttributes, null, 4));

	// CREATE MODEL OPTIONS (ASSOCIATIONS) FILE
	fs.writeFileSync(workspacePath + '/models/options/' + entity_name + '.json', JSON.stringify([], null, 4));

	// CREATE ROUTE FILE
	let routeTemplate = fs.readFileSync(piecesPath + '/routes/data_entity.js', 'utf8');
	routeTemplate = routeTemplate.replace(/ENTITY_NAME/g, entity_name);
	routeTemplate = routeTemplate.replace(/ENTITY_URL_NAME/g, entity_url);
	routeTemplate = routeTemplate.replace(/MODEL_NAME/g, entity_model);
	fs.writeFileSync(workspacePath + '/routes/' + entity_name + '.js', routeTemplate);

	// CREATE API FILE
	let apiTemplate = fs.readFileSync(piecesPath + '/api/api_entity.js', 'utf8');
	apiTemplate = apiTemplate.replace(/ENTITY_NAME/g, entity_name);
	apiTemplate = apiTemplate.replace(/MODEL_NAME/g, entity_model);
	fs.writeFileSync(workspacePath + '/api/' + entity_name + '.js', apiTemplate);

	// Add entity entry in the application module sidebar
	if(addInSidebar) {
		const fileName = workspacePath + '/views/layout_' + module_name + '.dust';
		// Read file and get jQuery instance
		const $ = await domHelper.read(fileName);
		let li = '';
		// Create new html
		li += '<!--{#entityAccess entity="' + entity_url + '"}-->\n';
		li += "	 <li id='" + entity_url + "_menu_item' class='treeview'>\n";
		li += '		 <a href="#">\n';
		li += '			 <i class="fa fa-folder"></i>\n';
		li += '			 <span><!--{#__ key="entity.' + entity_name + '.label_entity" /}--></span>\n';
		li += '			 <i class="fa fa-angle-left pull-right"></i>\n';
		li += '		 </a>\n';
		li += '		 <ul class="treeview-menu">\n';
		li += '			 <!--{#actionAccess entity="' + entity_url + '" action="create"}-->';
		li += '				 <li>\n';
		li += "					 <a href='/" + entity_url + "/create_form'>\n";
		li += '						 <i class="fa fa-angle-double-right"></i>\n';
		li += '						 <!--{#__ key="operation.create" /}--> \n';
		li += '					 </a>\n';
		li += '				 </li>';
		li += '			 <!--{/actionAccess}-->';
		li += '			 <!--{#actionAccess entity="' + entity_url + '" action="read"}-->';
		li += '				 <li>\n';
		li += "					 <a href='/" + entity_url + "/list'>\n";
		li += '						 <i class="fa fa-angle-double-right"></i>\n';
		li += '						 <!--{#__ key="operation.list" /}--> \n';
		li += '					 </a>\n';
		li += '				 </li>\n';
		li += '			 <!--{/actionAccess}-->';
		li += '		 </ul>\n';
		li += '	 </li>\n';
		li += '<!--{/entityAccess}-->\n';

		// Add new html to document
		$('#sortable').append(li);

		// Write back to file
		domHelper.write(fileName, $);
	}

	// Copy CRUD view folder and customize them according to data entity properties
	fs.copySync(piecesPath + '/views/entity', workspacePath + '/views/' + entity_name);
	const fileBase = workspacePath + '/views/' + entity_name;
	const dustFiles = ["create", "create_fields", "show", "show_fields", "update", "update_fields", "list", "list_fields"];

	for (let i = 0; i < dustFiles.length; i++) {
		const fileToWrite = fileBase + '/' + dustFiles[i] + ".dust";
		let dustContent = fs.readFileSync(fileToWrite, 'utf8');
		dustContent = dustContent.replace(/custom_module/g, module_name);
		dustContent = dustContent.replace(/custom_data_entity/g, entity_name);
		dustContent = dustContent.replace(/custom_url_data_entity/g, entity_url);

		if (module_name != "m_home") {
			// Good indent for dust code
			const htmlToAdd = "<li>\n\
			<a class='sub-module-arianne' href='/default/" + module_name.substring(2) + "'>\n\
				{#__ key=\"module." + module_name + "\"/}\n\
			</a>\n\
		</li>";

			dustContent = dustContent.replace(/<!-- SUB MODULE - DO NOT REMOVE -->/g, htmlToAdd);
		}
		fs.writeFileSync(fileToWrite, dustContent, "utf8");
	}

	// Write new data entity to access.json file, within module's context
	const accessPath = workspacePath + '/config/access.json';
	const accessLockPath = workspacePath + '/config/access.lock.json';
	const accessObject = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
	accessObject[module_name.substring(2)].entities.push({
		name: entity_url,
		groups: [],
		actions: {
			read: [],
			create: [],
			delete: [],
			update: []
		}
	});
	fs.writeFileSync(accessPath, JSON.stringify(accessObject, null, 4), "utf8");
	fs.writeFileSync(accessLockPath, JSON.stringify(accessObject, null, 4), "utf8");

	// Add entity locals
	await translateHelper.writeLocales(data.application.name, "entity", entity_name, entity_display_name, data.googleTranslate);

	return;
};

exports.deleteEntity = async (data) => {
	const baseFolder = __dirname + '/../workspace/' + data.application.name;

	// Delete views folder
	helpers.rmdirSyncRecursive(baseFolder + '/views/' + data.entity.name);
	// Delete route file
	fs.unlinkSync(baseFolder + '/routes/' + data.entity.name + '.js');
	// Delete API file
	fs.unlinkSync(baseFolder + '/api/' + data.entity.name + '.js');
	// Delete model file
	fs.unlinkSync(baseFolder + '/models/' + data.entity.name + '.js');
	// Delete options
	fs.unlinkSync(baseFolder + '/models/options/' + data.entity.name + '.json');
	// Delete attributes
	fs.unlinkSync(baseFolder + '/models/attributes/' + data.entity.name + '.json');

	// Remove relationships in options.json files
	const optionFiles = fs.readdirSync(baseFolder + '/models/options/').filter(x => x.indexOf('.json') != -1);
	for (const file in optionFiles) {
		const options = JSON.parse(fs.readFileSync(baseFolder + '/models/options/' + optionFiles[file]));
		const optionsCpy = [];
		for (let i = 0; i < options.length; i++)
			if (options[i].target != data.entity.name)
				optionsCpy.push(options[i]);
		if (optionsCpy.length != options.length)
			fs.writeFileSync(baseFolder + '/models/options/' + optionFiles[file], JSON.stringify(optionsCpy, null, 4));
	}

	// Clean up access config
	const access = JSON.parse(fs.readFileSync(baseFolder + '/config/access.json', 'utf8'));
	for (let i = 0; i < access[data.np_module.name.substring(2)].entities.length; i++)
		if (access[data.np_module.name.substring(2)].entities[i].name == data.entity.name.substring(2))
			access[data.np_module.name.substring(2)].entities.splice(i, 1);
	fs.writeFileSync(baseFolder + '/config/access.json', JSON.stringify(access, null, 4));
	fs.writeFileSync(baseFolder + '/config/access.lock.json', JSON.stringify(access, null, 4));

	// Remove entity entry from layout select
	const filePath = baseFolder + '/views/layout_' + data.np_module.name + '.dust';
	const $ = await domHelper.read(filePath);

	$("#" + data.entity.name.substring(2) + '_menu_item').remove();

	domHelper.write(filePath, $);

	translateHelper.removeLocales(data.application.name, "entity", data.entity.name);
	return true;
};

exports.setupHasManyTab = async (data) => {
	const target = data.options.target;
	const source = data.options.source;
	const urlSource = data.options.urlSource;
	const alias = data.options.as;
	const foreignKey = data.options.foreignKey;
	const showAlias = data.options.showAs;

	/* Add Alias in Translation file for tabs */
	const fileTranslationFR = __dirname + '/../workspace/' + data.application.name + '/locales/fr-FR.json';
	const fileTranslationEN = __dirname + '/../workspace/' + data.application.name + '/locales/en-EN.json';
	const dataFR = JSON.parse(fs.readFileSync(fileTranslationFR));
	const dataEN = JSON.parse(fs.readFileSync(fileTranslationEN));

	dataFR.entity[source][alias] = showAlias;
	dataEN.entity[source][alias] = showAlias;

	fs.writeFileSync(fileTranslationFR, JSON.stringify(dataFR, null, 4), 'utf8');
	fs.writeFileSync(fileTranslationEN, JSON.stringify(dataEN, null, 4), 'utf8');

	// Setup association tab for show_fields.dust
	const fileBase = __dirname + '/../workspace/' + data.application.name + '/views/' + source;
	const file = fileBase + '/show_fields.dust';

	// Create new tab button
	const newLi = '\
		<li>\n\
			<a id="' + alias + '-click" data-toggle="tab" data-tabtype="hasMany" href="#' + alias + '">\n\
				<!--{#__ key="entity.' + source + '.' + alias + '" /}-->\n\
			</a>\n\
		</li>';

	// Create new tab content
	const newTab = '  <div id="' + alias + '" class="ajax-tab tab-pane fade" data-tabType="hasMany" data-asso-alias="' + alias + '" data-asso-foreignkey="' + foreignKey + '" data-asso-flag="{id}" data-asso-source="' + source + '" data-asso-url="' + urlSource + '"><div class="ajax-content sub-tab-table"></div></div>';

	return await addTab(data, file, newLi, newTab, target);
};

exports.setupHasManyPresetTab = async (data) => {

	const source = data.options.source;
	const urlSource = data.options.urlSource;
	const foreignKey = data.options.foreignKey;
	const alias = data.options.as;
	const showAlias = data.options.showAs;

	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	/* Add Alias in Translation file for tabs */
	const fileTranslationFR = workspacePath + '/locales/fr-FR.json';
	const fileTranslationEN = workspacePath + '/locales/en-EN.json';
	const dataFR = JSON.parse(fs.readFileSync(fileTranslationFR));
	const dataEN = JSON.parse(fs.readFileSync(fileTranslationEN));

	dataFR.entity[source][alias] = showAlias;
	dataEN.entity[source][alias] = showAlias;

	fs.writeFileSync(fileTranslationFR, JSON.stringify(dataFR, null, 4));
	fs.writeFileSync(fileTranslationEN, JSON.stringify(dataEN, null, 4));

	// Setup association tab for show_fields.dust
	const fileBase = workspacePath + '/views/' + source;
	const file = fileBase + '/show_fields.dust';

	const newLi = '\
	<li>\n\
		<a id="' + alias + '-click" data-toggle="tab" data-tabtype="hasManyPreset" href="#' + alias + '">\n\
			<!--{#__ key="entity.' + source + '.' + alias + '" /}-->\n\
		</a>\n\
	</li>';

	const newTabContent = '<div id="' + alias + '" class="ajax-tab tab-pane fade" data-tabType="hasManyPreset" data-asso-alias="' + alias + '" data-asso-foreignkey="' + foreignKey + '" data-asso-flag="{id}" data-asso-source="' + source + '" data-asso-url="' + urlSource + '"><div class="ajax-content sub-tab-table"></div></div>';

	await addTab(data, file, newLi, newTabContent, data.options.target);
	return true;
};

exports.saveHasManyData = (data, workspaceData, foreignKey) => {
	const jsonPath = __dirname + '/../workspace/' + data.application.name + '/models/toSync.json';
	const toSync = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
	toSync.queries = [];
	const firstKey = "fk_id_" + data.options.source;
	const secondKey = "fk_id_" + data.options.target;
	/* Insert value in toSync queries array to add values of the old has many in the belongs to many */
	for (let i = 0; i < data.length; i++)
		toSync.queries.push("INSERT INTO " + data.options.through + "(" + firstKey + ", " + secondKey + ") VALUES(" + data[i].id + ", " + data[i][foreignKey] + ");");
	fs.writeFileSync(jsonPath, JSON.stringify(toSync, null, 4));
	return true;
};

exports.setupHasOneTab = async (data) => {
	const target = data.options.target;
	const source = data.options.source;
	const urlSource = data.options.urlSource;
	const foreignKey = data.options.foreignKey;
	const alias = data.options.as;
	const showAlias = data.options.showAs;

	/* Add Alias in Translation file for tabs */
	const fileTranslationFR = __dirname + '/../workspace/' + data.application.name + '/locales/fr-FR.json';
	const fileTranslationEN = __dirname + '/../workspace/' + data.application.name + '/locales/en-EN.json';
	const dataFR = JSON.parse(fs.readFileSync(fileTranslationFR));
	const dataEN = JSON.parse(fs.readFileSync(fileTranslationEN));

	dataFR.entity[source][alias] = showAlias;
	dataEN.entity[source][alias] = showAlias;

	fs.writeFileSync(fileTranslationFR, JSON.stringify(dataFR, null, 2))
	fs.writeFileSync(fileTranslationEN, JSON.stringify(dataEN, null, 2))

	// Setup association tab for show_fields.dust
	const fileBase = __dirname + '/../workspace/' + data.application.name + '/views/' + source;
	const file = fileBase + '/show_fields.dust';

	// Create new tab button
	const newLi = '\
	<li>\n\
		<a id="' + alias + '-click" data-toggle="tab" href="#' + alias + '">\n\
			<!--{#__ key="entity.' + source + '.' + alias + '" /}-->\n\
		</a>\n\
	</li>';

	// Create new tab content
	const newTab = '<div id="' + alias + '" class="ajax-tab tab-pane fade" data-tabType="hasOne" data-asso-alias="' + alias + '" data-asso-foreignkey="' + foreignKey + '" data-asso-flag="{id}" data-asso-source="' + source + '" data-asso-url="' + urlSource + '"><div class="ajax-content"></div></div>';
	return await addTab(data, file, newLi, newTab, target);
};

exports.deleteTab = async (data) => {

	const tabNameWithoutPrefix = data.options.urlValue;
	let target;

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const jsonPath = workspacePath + '/models/options/' + data.entity.name + '.json';

	const options = JSON.parse(fs.readFileSync(jsonPath));
	let found = false;
	let option;
	const deletedOptionsTarget = [];

	for (let i = 0; i < options.length; i++) {
		if (options[i].as !== "r_" + tabNameWithoutPrefix)
			continue;

		option = options[i];

		if(deletedOptionsTarget.indexOf(option.target) == -1)
			deletedOptionsTarget.push(option.target);

		if (option.relation == 'hasMany')
			target = option.target;
		else
			target = data.entity.name;

		// Delete unnecessary locales
		translateHelper.removeLocales(data.application.name, "field", [data.entity.name, option.as]);

		options.splice(i, 1);
		found = true;
		break;
	}

	if (!found) {
		const err = new Error('structure.association.error.unableTab');
		err.messageParams = [data.options.showValue];
		throw err;
	}

	// Look in option file for all concerned target to destroy auto_generate key no longer needed
	let targetOption, autoGenerateFound, targetJsonPath;
	for (let i = 0; i < deletedOptionsTarget.length; i++) {
		autoGenerateFound = false;
		targetJsonPath = workspacePath + '/models/options/' + deletedOptionsTarget[i] + '.json'
		targetOption = JSON.parse(fs.readFileSync(targetJsonPath));
		for (let j = 0; j < targetOption.length; j++) {
			if(targetOption[j].structureType == "auto_generate" && targetOption[j].foreignKey == option.foreignKey){
				targetOption.splice(j, 1);
				autoGenerateFound = true;
			}
		}
		if(autoGenerateFound)
			fs.writeFileSync(targetJsonPath, JSON.stringify(targetOption, null, 4), "utf8");
	}
	fs.writeFileSync(jsonPath, JSON.stringify(options, null, 4), "utf8");

	const showFile = workspacePath + '/views/' + data.entity.name + '/show_fields.dust';
	const $ = await domHelper.read(showFile)

	// Get tab type before destroying it
	const tabType = $("#r_" + tabNameWithoutPrefix + "-click").attr('data-tabtype');
	// Remove tab (<li>)
	$("#r_" + tabNameWithoutPrefix + "-click").parents('li').remove();
	// Remove tab content
	$("#r_" + tabNameWithoutPrefix).remove();

	// If last tab have been deleted, remove tab structure from view
	if ($(".tab-content .tab-pane").length == 1)
		$("#tabs").replaceWith($("#home").html());

	domHelper.write(showFile, $);

	return {
		fk: option.foreignKey,
		target: target,
		tabType: tabType
	};
};
