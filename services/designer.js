// Mipsy
const bot = require('../services/bot.js');

// Structure files
const structure_application = require("../structure/structure_application");
const structure_module = require("../structure/structure_module");
const structure_entity = require("../structure/structure_entity");
const structure_field = require("../structure/structure_field");
const structure_component = require("../structure/structure_component");
const structure_ui = require("../structure/structure_ui");

// Utils
const dataHelper = require("../utils/data_helper");
const gitHelper = require("../utils/git_helper");

// Others
const fs = require('fs-extra');
const models = require('../models/');
const sequelize = models.sequelize;
const cloud_manager = require('../services/cloud_manager');
const session = require("./session");

// Metadata
const metadata = require('../database/metadata')();
const database = require('../database/database');
const Application = require('../database/application');

/* --------------------------------------------------------------- */
/* -------------------------- General ---------------------------- */
/* --------------------------------------------------------------- */

// Execute an array of newmips instructions
exports.recursiveInstructionExecute = async (recursiveData, instructions, idx) => {
	const exportsContext = this;
	// Create the data obj
	let data = bot.parse(instructions[idx]);
	if (data.error)
		throw data.error;

	// Rework the data obj
	data = dataHelper.reworkData(data);

	data.application = recursiveData.application;
	data.module_name = recursiveData.module_name;
	data.entity_name = recursiveData.entity_name;

	// Execute the designer function
	const info = await this[data.function](data);
	session.setSessionObj(data, info);

	idx += 1;
	if (instructions.length == idx)
		return info;

	return await exportsContext.recursiveInstructionExecute(data, instructions, idx);
}

exports.help = async _ => { // eslint-disable-line
	return {
		message: "botresponse.help",
		restartServer: false
	}
}

exports.deploy = async (data) => {
	// Generator DB
	const dbApp = await models.Application.findOne({
		name: data.application.name
	});

	data.appID = dbApp.id;
	return await cloud_manager.deploy(data);
}

exports.restart = async _ => { // eslint-disable-line
	return {
		message: "structure.global.restart.success"
	};
}

exports.installNodePackage = async (data) => {
	await structure_application.installAppModules(data);
	return {
		message: "structure.global.npmInstall.success"
	};
}

/* --------------------------------------------------------------- */
/* --------------------------- Git ------------------------------- */
/* --------------------------------------------------------------- */

exports.gitPush = async (data) => {
	if(!gitHelper.isGitActivated())
		throw new Error('structure.global.error.notDoGit');
	await gitHelper.gitPush(data);
	return {
		message: "structure.global.gitPush.success",
		restartServer: false
	}
}

exports.gitPull = async (data) => {
	if(!gitHelper.isGitActivated())
		throw new Error('structure.global.error.notDoGit');
	await gitHelper.gitPull(data);
	return {
		message: "structure.global.gitPull.success",
		restartServer: false
	}
}

exports.gitCommit = async (data) => {
	if(!gitHelper.isGitActivated())
		throw new Error('structure.global.error.notDoGit');
	await gitHelper.gitCommit(data);
	return {
		message: "structure.global.gitCommit.success",
		restartServer: false
	}
}

exports.gitStatus = async (data) => {
	if(!gitHelper.isGitActivated())
		throw new Error('structure.global.error.notDoGit');
	const infoGit = await gitHelper.gitStatus(data);
	return {
		message: JSON.stringify(infoGit).replace(/,/g, ",<br>"),
		restartServer: false
	};
}

/* --------------------------------------------------------------- */
/* ----------------------- Application --------------------------- */
/* --------------------------------------------------------------- */
exports.selectApplication = async (data) => {
	const exportsContext = this;

	data.application = metadata.getApplication(data.options.value);

	// Select the module home automatically after selecting an application
	await exportsContext.recursiveInstructionExecute(data, ["select module home"], 0);
	return data;
}

exports.createNewApplication = async (data) => {

	const existingApp = await models.Application.findOne({
		where: {
			name: data.options.value
		}
	});

	if (existingApp) {
		const err = new Error("database.application.alreadyExist");
		err.messageParams = [data.options.showValue];
		throw err;
	}

	// Check if app folder in filesystem is free
	if(fs.existsSync(__dirname + '/../workspace/' + data.options.value))
		throw new Error("database.application.fsAlreadyExist");

	// Generator DB
	const dbApp = await models.Application.create({
		name: data.options.value,
		displayName: data.options.showValue
	});

	// Metadata
	const newApp = new Application(data.options.value, data.options.showValue);
	data.application = newApp;

	// If connected user is admin, then add only him. If not, add admin and current user
	const userToAdd = data.currentUser.id == 1 ? 1 : [1, data.currentUser.id];
	await dbApp.addUser(userToAdd);

	const gitlabRepo = await structure_application.setupApplication(data);

	// Set gitlab project ID
	if(gitlabRepo)
		newApp.gitlabID = gitlabRepo.id;

	newApp.createdBy = data.currentUser.login;
	// Save metadata in application
	newApp.save();

	return {
		application: newApp,
		message: "database.application.create.success",
		messageParams: [newApp.name]
	};
}

// Declare this function not directly within exports to be able to use it from deleteApplicationRecursive()
exports.deleteApplication = async (data) => {

	// Load app before deleting it
	try {
		data.application = metadata.getApplication(data.options.value);
	} catch(err) {
		console.error("Unable to load application metadata, workspace is maybe broken. Trying deleting after all...");
		// Faking metadata
		data.application = {
			name: data.options.value
		};
	}

	// Database deleting
	const appExistInDB = await models.Application.findOne({
		where: {
			name: data.options.value
		}
	});

	if(appExistInDB) {
		const hasAccess = await models.User.findOne({
			where: {
				id: data.currentUser.id
			},
			include: [{
				model: models.Application,
				required: true,
				where: {
					name: data.options.value
				}
			}]
		});

		if(!hasAccess)
			throw new Error("You do not have access to this application, you cannot delete it.");

		await models.Application.destroy({
			where: {
				name: data.options.value
			}
		});
	} else {
		console.error('Application to delete do not exist in database, trying deleting it after all...')
	}

	try {
		await structure_application.deleteApplication(data);
		metadata.deleteApplication(data.options.value);
	} catch(err) {
		console.error(err);
	}

	return {
		message: 'database.application.delete.deleted',
		messageParams: [data.options.showValue]
	};
}

/* --------------------------------------------------------------- */
/* ------------------------- Module ------------------------------ */
/* --------------------------------------------------------------- */
exports.selectModule = async (data) => { // eslint-disable-line
	data.module = data.application.getModule(data.options.value, true, data.options.showValue);
	return {
		module: data.module,
		message: "database.module.select.selected",
		messageParams: [data.module.displayName],
		restartServer: false
	};
}

exports.createNewModule = async (data) => {

	if(data.application.getModule(data.options.value)){
		const err = new Error("database.module.create.alreadyExist");
		err.messageParams = [data.options.showValue];
		throw err;
	}

	const np_module = data.application.addModule(data.options.value, data.options.showValue);

	// Assign list of existing application modules
	// Needed to recreate the dropdown list of modules in the interface
	data.modules = data.application.modules;

	// Structure
	await structure_module.setupModule(data);

	return {
		module: np_module,
		message: "database.module.create.success",
		messageParams: [data.options.showValue, data.options.showValue]
	};
}

exports.listModule = async (data) => { // eslint-disable-line
	let listing = "<br><ul>";
	for (let i = 0; i < data.application.modules.length; i++) {
		listing += "<li>" + data.application.modules[i].displayName + "(" + data.application.modules[i].name + ")</li>";
	}
	listing += "</ul>";
	return {
		message: listing,
		restartServer: false
	}
}

exports.deleteModule = async (data) => {

	if (data.options.value == 'm_home')
		throw new Error("structure.module.error.notHome");

	if (data.options.value == 'm_administration')
		throw new Error("structure.module.error.notAdministration");

	data.np_module = data.application.getModule(data.options.value, true);
	const entities = data.np_module.entities;

	const promises = [];
	for (let i = 0; i < entities.length; i++) {
		const tmpData = {
			application: data.application,
			module_name: data.np_module.name,
			options: {
				value: entities[i].name,
				showValue: entities[i].displayName
			}
		}

		promises.push(deleteEntity(tmpData)); // eslint-disable-line
	}

	await Promise.all(promises);
	await structure_module.deleteModule(data);
	data.application.deleteModule(data.np_module.name);
	return {
		message: "database.module.delete.deleted",
		messageParams: [data.np_module.displayName]
	};
}

/* --------------------------------------------------------------- */
/* --------------------------- Entity ---------------------------- */
/* --------------------------------------------------------------- */
exports.selectEntity = async (data) => {

	const {np_module, entity} = data.application.findEntity(data.options.value, true);
	data.module = np_module;
	data.doRedirect = await structure_entity.selectEntity(data);

	return {
		entity: entity,
		module: np_module,
		doRedirect: data.doRedirect,
		message: "database.entity.select.selected",
		messageParams: [entity.displayName],
		restartServer: false
	}
}

exports.createNewEntity = async (data) => {
	const entityName = data.options.value;
	if (data.application.findEntity(entityName) !== false) {
		const err = new Error('database.entity.create.alreadyExist');
		err.messageParams = [data.options.showValue];
		throw err;
	}

	data.np_module = data.application.getModule(data.module_name, true);
	const entity = data.np_module.addEntity(data.options.value, data.options.showValue, data.options.isParamEntity);

	await structure_entity.setupEntity(data);

	return {
		entity: entity,
		message: "database.entity.create.success",
		messageParams: [entity.displayName, data.np_module.displayName, entity.displayName]
	};
}

exports.listEntity = async (data) => { // eslint-disable-line
	let listing = "<br><ul>";
	for (let i = 0; i < data.application.modules.length; i++) {
		listing += "<li>" + data.application.modules[i].displayName + "</li>";
		for (let j = 0; j < data.application.modules[i].entities.length; j++) {
			listing += "- " + data.application.modules[i].entities[j].displayName + " (" + data.application.modules[i].entities[j].name + ")<br>";
		}
	}
	listing += "</ul>";
	return {
		message: listing,
		restartServer: false
	};
}

async function deleteEntity(data) {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const foundEntity = data.application.findEntity(data.options.value, true);

	data.np_module = foundEntity.np_module;
	data.entity = foundEntity.entity;

	// Delete entity relations
	const entityOptions = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.entity.name + '.json'));

	for (let i = 0; i < entityOptions.length; i++) {
		if(entityOptions[i].structureType == 'auto_generate')
			continue;
		if (entityOptions[i].relation == 'hasMany') {
			const tmpData = {
				options: {
					value: entityOptions[i].as,
					urlValue: entityOptions[i].as.substring(2)
				},
				application: data.application,
				module_name: data.np_module.name,
				entity_name:  data.entity.name,
				structureType: entityOptions[i].structureType
			};

			if (tmpData.structureType == "hasMany" || tmpData.structureType == "hasManyPreset") {
				if(tmpData.options && tmpData.options.value != '' && tmpData.options.value.indexOf('r_history_') != -1){
					const statusName = tmpData.options.value.split('r_history_')[1];
					await deleteComponentStatus({ // eslint-disable-line
						application: tmpData.application,
						entity_name: tmpData.entity_name,
						options: {
							value : "s_"+statusName,
							urlValue: statusName,
							showValue: statusName
						}
					})
				} else {
					await deleteTab(tmpData); // eslint-disable-line
				}
			} else {
				console.warn("WARNING - Unknown option to delete !");
				console.warn(entityOptions[i]);
			}
		} else if (entityOptions[i].relation == 'belongsToMany') {
			await database.dropEntityOnSync(data.application, entityOptions[i].through); // eslint-disable-line
		}
	}

	// Delete relation comming from other entities
	const files = fs.readdirSync(workspacePath + '/models/options/').filter(file => file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file.slice(0, -5) != data.entity.name);

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const source = file.slice(0, -5);
		let options = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + file));

		// Look for auto_generate key targeting deleted entity and remove them
		const idxToRemove = [];
		for (let i = 0; i < options.length; i++) {
			if (options[i].target != data.entity.name)
				continue;

			if (options[i].structureType == 'auto_generate')
				idxToRemove.push(i);
		}

		options = options.filter((val, idx) => idxToRemove.indexOf(idx) == -1);
		fs.writeFileSync(workspacePath + '/models/options/' + file, JSON.stringify(options, null, 4), 'utf8')

		// Loop on entity options
		for (let i = 0; i < options.length; i++) {
			if (options[i].target != data.entity.name)
				continue;

			const tmpData = {
				options: {
					value: options[i].as,
					urlValue: options[i].as.substring(2)
				},
				application: data.application,
				module_name: data.np_module.name,
				structureType: options[i].structureType
			};

			tmpData.entity_name = source;
			if (options[i].relation == 'hasMany') {
				if (tmpData.structureType == "hasMany" || tmpData.structureType == "hasManyPreset") {
					await deleteTab(tmpData); // eslint-disable-line
				} else {
					console.warn("WARNING - Unknown option to delete !");
					console.warn(tmpData);
				}
			} else if (options[i].relation == 'belongsTo') {
				if (tmpData.structureType == "relatedTo") {
					tmpData.options.value = "f_" + tmpData.options.value.substring(2);
					await deleteField(tmpData); // eslint-disable-line
				} else if (tmpData.structureType == "hasOne") {
					await deleteTab(tmpData); // eslint-disable-line
				} else {
					console.warn("WARNING - Unknown option to delete !");
					console.warn(tmpData);
				}
			} else if(options[i].relation == 'belongsToMany' && tmpData.structureType == "relatedToMultiple" || tmpData.structureType == "relatedToMultipleCheck") {
				tmpData.options.value = "f_" + tmpData.options.value.substring(2);
				await deleteField(tmpData); // eslint-disable-line
			}
		}
	}

	// Fake session for delete widget
	data.entity_name = data.entity.name;
	data.module_name = data.np_module.name;
	await deleteEntityWidgets(data); // eslint-disable-line
	database.dropEntityOnSync(data.application, data.entity.name);
	data.np_module.deleteEntity(data.entity.name);
	await structure_entity.deleteEntity(data);

	return {
		message: "database.entity.delete.deleted",
		messageParams: [data.entity.displayName],
		entity: data.entity
	};
}
exports.deleteEntity = deleteEntity;

/* --------------------------------------------------------------- */
/* --------------------------- Field ----------------------------- */
/* --------------------------------------------------------------- */
exports.createNewField = async (data) => {

	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	if (data.entity.getField(data.options.value)) {
		const err = new Error('database.field.error.alreadyExist');
		err.messageParams = [data.options.showValue];
		throw err;
	}

	const newmipsFieldType = await structure_field.setupField(data);
	data.entity.addField(data.options.value, data.options.showValue, newmipsFieldType);

	return {
		message: "database.field.create.created",
		messageParams: [data.options.showValue, data.entity.displayName, data.options.showValue, data.options.showValue, data.options.showValue]
	};
}

async function deleteTab(data) {
	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	const {fk, target, tabType} = await structure_entity.deleteTab(data);

	data.fieldToDrop = fk;
	data.name_data_entity = target;

	await database.dropFKField(data);

	return {
		tabType: tabType,
		message: 'structure.association.deleteTab',
		messageParams: [data.options.showValue]
	};
}
exports.deleteTab = deleteTab;

// Delete
async function deleteField(data) {

	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);
	data.field = data.entity.getField(data.options.value, true, data.options.showValue)

	// Delete field from views and models
	const infoStructure = await structure_field.deleteField(data);

	// Alter database
	data.fieldToDrop = infoStructure.fieldToDrop;

	// Related To Multiple
	if (infoStructure.isMultipleConstraint) {
		data.target = infoStructure.target;
		await database.dropFKMultipleField(data);
	} else if (infoStructure.isConstraint)
		await database.dropFKField(data);
	else
		database.dropField(data);

	// Missing id_ in data.options.value, so we use fieldToDrop
	// data.options.value = data.fieldToDrop;

	data.entity.deleteField(data.options.value);

	return {
		message: 'database.field.delete.deleted',
		messageParams: [data.options.showValue]
	};
}
exports.deleteField = deleteField;

exports.listField = async (data) => { // eslint-disable-line
	let listing = "<br><ul>";
	for (let i = 0; i < data.application.modules.length; i++) {
		listing += "<li>" + data.application.modules[i].displayName + "<ul>";
		for (let j = 0; j < data.application.modules[i].entities.length; j++) {
			listing += "<li><b>" + data.application.modules[i].entities[j].displayName + "</b></li>";
			for (let k = 0; k < data.application.modules[i].entities[j].fields.length; k++) {
				listing += "- " + data.application.modules[i].entities[j].fields[k].displayName + " (" + data.application.modules[i].entities[j].fields[k].name + ")<br>";
			}
		}
		listing += "</ul></li>";
	}
	listing += "</ul>";
	return {
		message: listing,
		restartServer: false
	};
}

/* --------------------------------------------------------------- */
/* ---------------------- Field Attributes ----------------------- */
/* --------------------------------------------------------------- */

exports.setFieldKnownAttribute = async (data) => {

	const wordParam = data.options.word.toLowerCase();
	const requiredAttribute = ["mandatory", "required", "obligatoire", "optionnel", "non-obligatoire", "optional"];
	const uniqueAttribute = ["unique", "not-unique", "non-unique"];

	data.field = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true).getField(data.options.value);

	// Standard field not found, looking for related to field
	if (!data.field) {
		const optionsArray = JSON.parse(fs.readFileSync(__dirname + '/../workspace/' + data.application.name + '/models/options/' + data.entity_name + '.json'));
		for (let i = 0; i < optionsArray.length; i++) {
			if (optionsArray[i].showAs == data.options.showValue) {
				if (optionsArray[i].structureType == "relatedTo") {
					// We need the key in DB to set it unique instead of the client side name of the field
					if (uniqueAttribute.indexOf(wordParam) != -1)
						data.options.value = optionsArray[i].foreignKey;
				} else if (optionsArray[i].structureType == "relatedToMultiple" || optionsArray[i].structureType == "relatedToMultipleCheckbox") {
					if (uniqueAttribute.indexOf(wordParam) != -1)
						throw new Error("structure.field.attributes.notUnique4RelatedToMany");
					else
						data.structureType = optionsArray[i].structureType;
				}
				break;
			}
		}
	}

	// Check the attribute asked in the instruction
	if (requiredAttribute.indexOf(wordParam) != -1) {
		// Get DB SQL type needed to Alter Column
		const {sqlDataType, sqlDataTypeLength} = await database.getDatabaseSQLType({
			table: data.entity_name,
			column: data.options.value
		});

		data.sqlDataType = sqlDataType;
		data.sqlDataTypeLength = sqlDataTypeLength;
		data.dialect = sequelize.options.dialect;

		await structure_field.setRequiredAttribute(data);

		return {
			message: "structure.field.attributes.successKnownAttribute",
			messageParams: [data.options.showValue, data.options.word]
		}
	} else if (uniqueAttribute.indexOf(wordParam) != -1) {

		const sourceEntity = data.entity_name;
		const constraintName = sourceEntity + "_" + data.options.value + "_unique";

		const possibilityUnique = ["unique"];
		const possibilityNotUnique = ["not-unique", "non-unique"];

		let request = "";

		// Get application database, it won't be newmips if seperate DB
		const appDBConf = require(__dirname+'/../workspace/' + data.application.name + '/config/database.js'); // eslint-disable-line

		// Add or remove the unique constraint ?
		if(sequelize.options.dialect == "mysql"){
			if (possibilityUnique.indexOf(wordParam) != -1) {
				request = "ALTER TABLE `" + appDBConf.database + "`.`" + sourceEntity + "` ADD CONSTRAINT " + constraintName + " UNIQUE (`" + data.options.value + "`);";
			} else if (possibilityNotUnique.indexOf(wordParam) != -1) {
				request = "ALTER TABLE `" + appDBConf.database + "`.`" + sourceEntity + "` DROP INDEX `" + constraintName + "`;";
			}
		} else if (sequelize.options.dialect == "postgres"){
			if (possibilityUnique.indexOf(wordParam) != -1) {
				request = "ALTER TABLE \"" + appDBConf.database + "\".\"" + sourceEntity + "\" ADD CONSTRAINT \"" + constraintName + "\" UNIQUE (" + data.options.value + ");";
			} else if (possibilityNotUnique.indexOf(wordParam) != -1) {
				request = "ALTER TABLE \"" + appDBConf.database + "\".\"" + sourceEntity + "\" DROP INDEX \"" + constraintName + "\";";
			}
		}

		try {
			await sequelize.query(request);
		} catch(err) {
			if (typeof err.parent !== "undefined" && (err.parent.errno == 1062 || err.parent.code == 23505)) {
				throw new Error('structure.field.attributes.duplicateUnique');
			} else if(typeof err.parent !== "undefined" && (err.parent.errno == 1146 || err.parent.code == "42P01" || err.parent.code == "3F000")){
				// Handle case by Newmips, no worry about this one
				if(['e_group', 'e_role', 'e_user'].indexOf(data.entity_name) == -1 && data.options.showValue == 'label'){
					// Table do not exist - In case of script it's totally normal, just generate a warning
					console.warn("WARNING - The database unique constraint on '"+data.options.showValue+"' could not be applied, the corresponding table '"+sourceEntity+"' does not exist at the time of the instruction.");
				}
				structure_field.setUniqueField(data);

				return {
					message: "structure.field.attributes.successKnownAttributeWarning",
					messageParams: [data.options.showValue, data.options.word]
				};
			} else {
				throw err;
			}
		}

		structure_field.setUniqueField(data);

		return {
			message: "structure.field.attributes.successKnownAttribute",
			messageParams: [data.options.showValue, data.options.word]
		}

	}
	const err = new Error("structure.field.attributes.notUnderstandGiveAvailable");
	let msgParams = "";
	for (let i = 0; i < requiredAttribute.length; i++) {
		msgParams += "-  " + requiredAttribute[i] + "<br>";
	}
	for (let j = 0; j < uniqueAttribute.length; j++) {
		msgParams += "-  " + uniqueAttribute[j] + "<br>";
	}
	err.messageParams = [msgParams];
	throw err;

}

exports.setFieldAttribute = async (data) => {
	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);
	await structure_field.setFieldAttribute(data);
	return {
		message: "structure.field.attributes.success",
		messageParams: [data.options.showValue, data.options.word, data.options.attributeValue]
	}
}
/* --------------------------------------------------------------- */
/* -------------------------- Datalist --------------------------- */
/* --------------------------------------------------------------- */

exports.setColumnVisibility = async (data) => {
	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);
	return await structure_ui.setColumnVisibility(data);
}

/* --------------------------------------------------------------- */
/* -------------------- ASSOCIATION / RELATION ------------------- */
/* --------------------------------------------------------------- */

// Create a tab with an add button to create one new object associated to source entity
exports.createNewHasOne = async (data) => {

	/* Check if entity source exist before doing anything */
	const sourceEntity = data.application.findEntity(data.options.source, true);

	if(sourceEntity.entity.isParamEntity)
		throw new Error('error.notForParamEntity');

	data.np_module = sourceEntity.np_module;
	data.source_entity = sourceEntity.entity;

	const answer = {};
	let toSync = true;
	let constraints = true;

	let target_entity = data.application.findEntity(data.options.target);

	// Target entity does not exist -> Subentity generation
	if(!target_entity) {
		target_entity = data.np_module.addEntity(data.options.target, data.options.showTarget);

		answer.message = "structure.association.hasMany.successSubEntity";
		answer.messageParams = [data.options.showAs, data.options.showSource, data.options.showSource, data.options.showAs];

		// Subentity code generation
		await structure_entity.setupEntity(data)
	} else {
		if(target_entity.entity.isParamEntity)
			throw new Error('error.notForParamEntity');
		answer.message = "structure.association.hasOne.successEntity";
		answer.messageParams = [data.options.showAs, data.options.showSource, data.options.showSource, data.options.showAs];
	}

	// Check already existing relation from source to target
	const sourceOptionsPath = __dirname+'/../workspace/' + data.application.name + '/models/options/' + data.options.source + '.json';
	const optionsSourceObject = JSON.parse(fs.readFileSync(sourceOptionsPath));
	let saveFile = false;

	// Checking relation existence from source to target
	for (let i = 0; i < optionsSourceObject.length; i++) {
		if (optionsSourceObject[i].target == data.options.target) {
			// If alias already used
			if (data.options.as == optionsSourceObject[i].as){
				if(optionsSourceObject[i].structureType == "auto_generate") {
					// Remove auto generate key by the generator
					optionsSourceObject.splice(i, 1);
					saveFile = true;
				} else {
					throw new Error('structure.association.error.alreadySameAlias');
				}
			}
		} else if(data.options.as == optionsSourceObject[i].as){
			const err = new Error('database.field.error.alreadyExist');
			err.messageParams = [data.options.showAs];
			throw err;
		}
	}

	// Changes to be saved, remove auto_generate key
	if(saveFile)
		fs.writeFileSync(sourceOptionsPath, JSON.stringify(optionsSourceObject, null, 4), "utf8");

	// Check already existing relation from target to source
	const optionsFile = fs.readFileSync(__dirname+'/../workspace/' + data.application.name + '/models/options/' + data.options.target + '.json');
	const targetOptionsObject = JSON.parse(optionsFile);

	for (let i = 0; i < targetOptionsObject.length; i++) {
		if (targetOptionsObject[i].target == data.options.source && targetOptionsObject[i].relation != "hasMany" && targetOptionsObject[i].relation != "belongsToMany") {
			// Remove constraint to accept circular belongsTo
			constraints = false;
		} else if (data.options.source != data.options.target
				&& (targetOptionsObject[i].target == data.options.source && targetOptionsObject[i].relation == "hasMany")
				&& targetOptionsObject[i].foreignKey == data.options.foreignKey) {
			// We avoid the toSync to append because the already existing has many relation has already created the foreing key in BDD
			toSync = false;
		}

		if (data.options.source != data.options.target
				&& (targetOptionsObject[i].target == data.options.source && targetOptionsObject[i].relation == "hasMany")
				&& targetOptionsObject[i].foreignKey == data.options.foreignKey) {
			// We avoid the toSync to append because the already existing has many relation has already created the foreing key in BDD
			toSync = false;
		}
	}

	// Add the foreign key reference in generator database
	const associationOption = {
		application: data.application,
		source: data.options.source,
		target: data.options.target,
		foreignKey: data.options.foreignKey,
		as: data.options.as,
		relation: "belongsTo",
		through: null,
		toSync: toSync,
		type: "hasOne",
		constraints: constraints
	};

	const reversedOption = {
		application: data.application,
		source: data.options.target,
		target: data.options.source,
		foreignKey: data.options.foreignKey,
		as: "r_"+data.options.source.substring(2),
		relation: "hasMany",
		type: "auto_generate",
		constraints: constraints
	};

	// Create belongsTo association between source and target
	structure_entity.setupAssociation(associationOption);
	// Create the opposite hasMany association
	structure_entity.setupAssociation(reversedOption);

	// Generator tabulation in display
	await structure_entity.setupHasOneTab(data);

	return {
		...answer,
		entity: data.source_entity
	};
}

async function belongsToMany(data, optionObj, setupFunction, exportsContext) {

	data.options.through = data.application.associationSeq + "_" + data.options.source.substring(2) + "_" + data.options.target.substring(2) + '_' + data.options.as.substring(2);
	const through = data.options.through;

	try {
		/* First we have to save the already existing data to put them in the new relation */
		const workspaceData = await database.retrieveWorkspaceHasManyData(data, dataHelper.capitalizeFirstLetter(data.options.source), optionObj.foreignKey);
		structure_entity.saveHasManyData(data, workspaceData, optionObj.foreignKey);
	} catch (err) {
		if (err.original && err.original.code == 'ER_NO_SUCH_TABLE') {
			if (!data.isGeneration)
				console.warn('BelongsToMany generation => Cannot retrieve already existing data, the table do no exist.');
		}
		else
			throw err;
	}

	/* Secondly we have to remove the already existing has many to create the belongs to many relation */
	const instructions = [
		"select entity " + data.options.showTarget
	];

	let setRequired = false;
	if (optionObj.structureType == "relatedToMultiple" || optionObj.structureType == "relatedToMultipleCheckbox") {
		instructions.push("delete field " + optionObj.as.substring(2));
		// If related to is required, then rebuilt it required
		if(optionObj.allowNull === false)
			setRequired = true;
	} else {
		instructions.push("delete tab " + optionObj.as.substring(2));
	}

	// Start doing necessary instruction for component creation
	const infoInstruction = await exportsContext.recursiveInstructionExecute(data, instructions, 0);

	if (typeof infoInstruction.tabType !== "undefined")
		data.targetType = infoInstruction.tabType;
	else
		data.targetType = optionObj.structureType;
	/* Then lets create the belongs to many association */

	/* We need the same alias for both relation */
	//data.options.as = "r_"+data.options.source.substring(2)+ "_" + data.options.target.substring(2);

	const associationOptionOne = {
		application: data.application,
		source: data.options.source,
		target: data.options.target,
		foreignKey: data.options.foreignKey,
		as: data.options.as,
		showAs: data.options.showAs,
		relation: "belongsToMany",
		through: through,
		toSync: false,
		type: data.targetType,
		usingField: data.options.usingField || undefined,
	};

	structure_entity.setupAssociation(associationOptionOne);

	const associationOptionTwo = {
		application: data.application,
		source: data.options.target,
		target: data.options.source,
		foreignKey: data.options.foreignKey,
		as: optionObj.as,
		showAs: optionObj.showAs,
		relation: "belongsToMany",
		through: through,
		toSync: false,
		type: data.targetType,
		usingField: optionObj.usingField || undefined,
	};

	structure_entity.setupAssociation(associationOptionTwo);

	await structure_entity[setupFunction](data);
	const reversedData = {
		options: {
			target: data.options.source,
			source: data.options.target,
			foreignKey: optionObj.foreignKey,
			as: optionObj.as,
			showTarget: data.options.showSource,
			urlTarget: data.options.urlSource,
			showSource: data.options.showTarget,
			urlSource: data.options.urlTarget,
			showAs: optionObj.showAs,
			urlAs: optionObj.as.substring(2)
		},
		application: data.application,
		module_name: data.module_name,
		entity_name: data.entity_name,
		source_entity: data.application.getModule(data.module_name, true).getEntity(data.entity_name, true)
	};

	if (data.targetType == "hasMany") {
		await structure_entity.setupHasManyTab(reversedData);
	} else if (data.targetType == "hasManyPreset") {
		await structure_entity.setupHasManyPresetTab(reversedData);
	} else if (data.targetType == "relatedToMultiple" || data.targetType == "relatedToMultipleCheckbox") {

		if (typeof optionObj.usingField !== "undefined")
			reversedData.options.usingField = optionObj.usingField;

		await structure_field.setupRelatedToMultipleField(reversedData);

		if(setRequired){
			reversedData.name_data_entity = reversedData.options.source;
			reversedData.options.value = "f_"+reversedData.options.urlAs;
			reversedData.options.word = "required";
			await structure_field.setRequiredAttribute(reversedData);
		}
	} else {
		throw new Error('Unknown target type for belongsToMany generation.')
	}
}

// Create a tab with an add button to create multiple new object associated to source entity
exports.createNewHasMany = async (data) => {
	const exportsContext = this;

	const sourceEntity = data.application.findEntity(data.options.source, true);
	data.np_module = sourceEntity.np_module;
	data.source_entity = sourceEntity.entity;

	if(data.source_entity.isParamEntity)
		throw new Error('error.notForParamEntity');

	const sourceOptionsPath = __dirname+'/../workspace/' + data.application.name + '/models/options/' + data.source_entity.name + '.json';
	const optionsSourceObject = JSON.parse(fs.readFileSync(sourceOptionsPath));
	let saveFile = false;

	// Vérification si une relation existe déjà de la source VERS la target
	for (let i = 0; i < optionsSourceObject.length; i++) {
		if (optionsSourceObject[i].target == data.options.target) {
			// If alias already used
			if (data.options.as == optionsSourceObject[i].as){
				if(optionsSourceObject[i].structureType == "auto_generate") {
					// Remove auto generate key by the generator
					optionsSourceObject.splice(i, 1);
					saveFile = true;
				} else
					throw new Error("structure.association.error.alreadySameAlias");
			}
		} else if(data.options.as == optionsSourceObject[i].as){
			const err = new Error('database.field.error.alreadyExist');
			err.messageParams = [data.options.showAs];
			throw err;
		}
	}

	// Changes to be saved, remove auto_generate key
	if(saveFile)
		fs.writeFileSync(sourceOptionsPath, JSON.stringify(optionsSourceObject, null, 4), "utf8");

	const answer = {};
	let toSync = true;
	let targetEntity = data.application.findEntity(data.options.target);

	// Target entity does not exist -> Sub entity generation
	if(!targetEntity) {
		targetEntity = data.np_module.addEntity(data.options.target, data.options.showTarget);

		answer.message = "structure.association.hasMany.successSubEntity";
		answer.messageParams = [data.options.showAs, data.options.showSource, data.options.showSource, data.options.showAs];

		// Sub entity code generation
		await structure_entity.setupEntity(data)
	} else {

		if(targetEntity.entity.isParamEntity)
			throw new Error('error.notForParamEntity');

		const optionsObject = JSON.parse(fs.readFileSync(__dirname+'/../workspace/' + data.application.name + '/models/options/' + data.options.target + '.json'));
		let matchingAlias = null, cptExistingHasMany = 0;

		// Check if there is no or just one belongsToMany to do
		for (let i = 0; i < optionsObject.length; i++) {
			if (optionsObject[i].target == data.options.source &&
				optionsObject[i].relation == "hasMany" &&
				optionsObject[i].structureType != "auto_generate") {
				cptExistingHasMany++;

				if (optionsObject[i].as == data.options.as)
					matchingAlias = optionsObject[i].as;
				else if (optionsObject[i].as == 'r_' + data.options.source.substring(2)) // Matching default generated alias in case of specific alias not found
					matchingAlias = optionsObject[i].as;
			}
		}

		// Check that an association already exist from TARGET to SOURCE
		for (let i = 0; i < optionsObject.length; i++) {
			if (optionsObject[i].target == data.options.source
				&& optionsObject[i].target != data.options.target
				&& optionsObject[i].relation == "hasMany"
				&& optionsObject[i].structureType != "auto_generate") {

				/* If there are multiple has many association from target to source and no alias matching */
				/* we can't handle on which one we gonna link the belongsToMany association */
				if (cptExistingHasMany > 1)
					if(!matchingAlias)
						throw new Error("structure.association.error.tooMuchHasMany");
					else if(optionsObject[i].as != matchingAlias) // Not the matching alias we want to generate belongsToMany link
						continue;

				/* Then lets create the belongs to many association */
				await belongsToMany(data, optionsObject[i], "setupHasManyTab", exportsContext); // eslint-disable-line

				return {
					entity: data.source_entity,
					message: 'structure.association.hasMany.successEntity',
					messageParams: [data.options.showAs, data.options.showSource, data.options.showSource, data.options.showAs]
				}
			} else if (data.options.source != data.options.target
					&& (optionsObject[i].target == data.options.source && optionsObject[i].relation == "belongsTo")
					&& optionsObject[i].foreignKey == data.options.foreignKey) {
				// We avoid the toSync to append because the already existing has one relation
				// has already created the foreign key in BDD
				toSync = false;
			}
		}

		answer.message = "structure.association.hasMany.successEntity";
		answer.messageParams = [data.options.showAs, data.options.showSource, data.options.showSource, data.options.showAs];
	}

	// Créer le lien hasMany en la source et la target
	const associationOption = {
		application: data.application,
		source: data.options.source,
		target: data.options.target,
		foreignKey: data.options.foreignKey,
		as: data.options.as,
		showAs: data.options.showAs,
		relation: "hasMany",
		through: null,
		toSync: toSync,
		type: "hasMany"
	};

	const reversedOptions = {
		application: data.application,
		source: data.options.target,
		target: data.options.source,
		foreignKey: data.options.foreignKey,
		as: "r_" + data.options.source.substring(2) + '_' + data.options.as.substring(2),
		relation: "belongsTo",
		toSync: toSync,
		type: "auto_generate"
	}

	// Generate hasMany relation in options
	structure_entity.setupAssociation(associationOption);
	// Generate opposite belongsTo relation in options
	structure_entity.setupAssociation(reversedOptions);

	// Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
	await structure_entity.setupHasManyTab(data);
	return {
		...answer,
		entity: data.source_entity
	};
}

// Create a tab with a select of existing object and a list associated to it
exports.createNewHasManyPreset = async (data) => {

	const exportsContext = this;
	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	const sourceEntity = data.application.findEntity(data.options.source, true);
	data.np_module = sourceEntity.np_module;
	data.source_entity = sourceEntity.entity;

	// Check that target exist
	const targetEntity = data.application.findEntity(data.options.target, true);

	if(data.source_entity.isParamEntity || targetEntity.entity.isParamEntity)
		throw new Error('error.notForParamEntity');

	// If a using field or fields has been asked, we have to check if those fields exist in the entity
	if (typeof data.options.usingField !== "undefined") {
		const attributesPath = workspacePath + '/models/attributes/' + data.options.target + '.json';
		const attributeTarget = JSON.parse(fs.readFileSync(attributesPath));

		for (let i = 0; i < data.options.usingField.length; i++) {
			if (typeof attributeTarget[data.options.usingField[i]] === "undefined") {
				// If a asked using field doesn't exist in the target entity we send an error
				const err = new Error('structure.association.relatedTo.missingField');
				err.messageParams = [data.options.showUsingField[i], data.options.showTarget];
				throw err;
			} else {
				data.options.usingField[i] = {
					value: data.options.usingField[i],
					type: attributeTarget[data.options.usingField[i]].newmipsType
				}
			}
		}
	}

	const sourceOptionsPath = workspacePath + '/models/options/' + data.options.source + '.json';
	const optionsSourceObject = JSON.parse(fs.readFileSync(sourceOptionsPath));

	let toSync = true;
	let saveFile = false;
	// Checking if a relationship already exists with this alias
	for (let i = 0; i < optionsSourceObject.length; i++) {
		if (optionsSourceObject[i].target == data.options.target) {
			// If alias already used
			if (data.options.as == optionsSourceObject[i].as){
				if(optionsSourceObject[i].structureType == "auto_generate") {
					// Remove auto generate key by the generator
					optionsSourceObject.splice(i, 1);
					saveFile = true;
				} else {
					throw new Error('structure.association.error.alreadySameAlias');
				}
			}
		} else if(data.options.as == optionsSourceObject[i].as){
			const err = new Error('database.field.error.alreadyExist');
			err.messageParams = [data.options.showAs];
			throw err;
		}
	}

	// Association table
	data.options.through = data.application.associationSeq + "_" + data.options.as.substring(2);

	if (data.options.through.length > 55) {
		const err = new Error('error.valueTooLong');
		err.messageParams = [data.options.through];
		throw err;
	}

	// Changes to be saved, remove auto_generate key
	if(saveFile)
		fs.writeFileSync(sourceOptionsPath, JSON.stringify(optionsSourceObject, null, 4), "utf8")

	const targetOptions = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.options.target + '.json'));
	let cptExistingHasMany = 0;

	// Preparing variable
	const source = data.options.source.toLowerCase();
	const target = data.options.target.toLowerCase();

	// Check if there is no or just one belongsToMany to do
	for (let i = 0; i < targetOptions.length; i++)
		if (targetOptions[i].target.toLowerCase() == source && targetOptions[i].relation != "belongsTo")
			cptExistingHasMany++;

	/* If there are multiple has many association from target to source we can't handle on which one we gonna link the belongsToMany association */
	if (cptExistingHasMany > 1)
		throw new Error("structure.association.error.tooMuchHasMany");

	let targetObjTarget;
	// Vérification si une relation existe déjà de la target VERS la source
	for (let i = 0; i < targetOptions.length; i++) {
		targetObjTarget = targetOptions[i].target.toLowerCase();

		if (targetObjTarget == source
			&& targetObjTarget != target
			&& targetOptions[i].relation != "belongsTo"
			&& targetOptions[i].structureType != "auto_generate") {

			/* Then lets create the belongs to many association */
			await belongsToMany(data, targetOptions[i], "setupHasManyPresetTab", exportsContext); // eslint-disable-line

			return {
				message: "structure.association.hasManyExisting.success",
				messageParams: [data.options.showTarget, data.options.showSource]
			}
		} else if (source != target
			&& (targetObjTarget == source && targetOptions[i].relation == "belongsTo")
			&& targetOptions[i].foreignKey == data.options.foreignKey) {
			// We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
			toSync = false;
		}
	}

	const associationOption = {
		application: data.application,
		source: data.options.source,
		target: data.options.target,
		foreignKey: data.options.foreignKey,
		as: data.options.as,
		showAs: data.options.showAs,
		relation: "belongsToMany",
		through: data.options.through,
		toSync: toSync,
		usingField: data.options.usingField || undefined,
		type: "hasManyPreset"
	};

	// Create the belongsTo link between source and target
	structure_entity.setupAssociation(associationOption);

	// Add the assocation field in create_fields/update_fields. Adding a tab in the show
	await structure_entity.setupHasManyPresetTab(data);

	return {
		message: "structure.association.hasManyExisting.success",
		messageParams: [data.options.showTarget, data.options.showSource]
	};
}

// Create a field in create/show/update related to target entity
exports.createNewFieldRelatedTo = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	// Get source entity
	data.source_entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	// Check if a field with this name already exist
	if(data.source_entity.getField('f_' + data.options.urlAs)) {
		const err = new Error('database.field.error.alreadyExist');
		err.messageParams = [data.options.showAs];
		throw err;
	}

	// Check if the target entity exist
	data.target_entity = data.application.findEntity(data.options.target, true);

	// If a using field or fields has been asked, we have to check if those fields exist in the entity
	if (typeof data.options.usingField !== "undefined") {
		const attributeTarget = JSON.parse(fs.readFileSync(workspacePath + '/models/attributes/' + data.options.target + '.json'));
		for (let i = 0; i < data.options.usingField.length; i++) {
			if (typeof attributeTarget[data.options.usingField[i]] === "undefined") {
				// If a asked using field doesn't exist in the target entity we send an error
				const err = new Error('structure.association.relatedTo.missingField');
				err.messageParams = [data.options.showUsingField[i], data.options.showTarget];
				throw err;
			} else {
				data.options.usingField[i] = {
					value: data.options.usingField[i],
					type: attributeTarget[data.options.usingField[i]].newmipsType
				}
			}
		}
	}

	// Check if an association already exists from source to target
	const sourceOptionsPath = workspacePath + '/models/options/' + data.source_entity.name + '.json';
	const optionsSourceObject = JSON.parse(fs.readFileSync(sourceOptionsPath));

	let toSync = true;
	let constraints = true;
	let saveFile = false;

	// Check if an association already exists with the same alias
	for (let i = 0; i < optionsSourceObject.length; i++) {
		if (optionsSourceObject[i].target == data.options.target) {
			// If alias already used
			if (data.options.as == optionsSourceObject[i].as){
				if(optionsSourceObject[i].structureType == "auto_generate") {
					// Remove auto generate key by the generator
					optionsSourceObject.splice(i, 1);
					saveFile = true;
				} else
					throw new Error("structure.association.error.alreadySameAlias");
			}
		} else if(data.options.as == optionsSourceObject[i].as){
			const err = new Error('database.field.error.alreadyExist');
			err.messageParams = [data.options.showAs];
			throw err;
		}
	}

	// Changes to be saved, remove auto_generate key
	if(saveFile)
		fs.writeFileSync(sourceOptionsPath, JSON.stringify(optionsSourceObject, null, 4), "utf8");

	// Check if an association already exists from target to source
	const optionsObject = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.options.target + '.json'));
	for (let i = 0; i < optionsObject.length; i++) {
		if (optionsObject[i].target == data.source_entity.name && optionsObject[i].relation != "hasMany" && optionsObject[i].relation != "belongsToMany") {
			constraints = false;
		} else if (data.source_entity.name != data.options.target
				&& (optionsObject[i].target == data.source_entity.name && optionsObject[i].relation == "hasMany")
				&& optionsObject[i].foreignKey == data.options.foreignKey) {
			// We avoid the toSync to append because the already existing has many relation has already created the foreign key in BDD
			toSync = false;
		}
	}

	// Créer le lien belongsTo en la source et la target dans models/options/source.json
	const associationOption = {
		application: data.application,
		source: data.source_entity.name,
		target: data.options.target,
		foreignKey: data.options.foreignKey,
		as: data.options.as,
		showAs: data.options.showAs,
		relation: "belongsTo",
		through: null,
		toSync: toSync,
		type: "relatedTo",
		constraints: constraints
	};

	if (typeof data.options.usingField !== "undefined")
		associationOption.usingField = data.options.usingField;

	const reversedOption = {
		application: data.application,
		source: data.options.target,
		target: data.source_entity.name,
		foreignKey: data.options.foreignKey,
		as: "r_" + data.source_entity.name.substring(2),
		relation: "hasMany",
		type: "auto_generate",
		constraints: constraints
	};

	structure_entity.setupAssociation(associationOption);
	structure_entity.setupAssociation(reversedOption);

	// Generate html code in dust file
	await structure_field.setupRelatedToField(data);

	data.source_entity.addField('f_' + data.options.urlAs, data.options.showAs);

	return {
		entity: data.source_entity,
		message: "structure.association.relatedTo.success",
		messageParams: [data.options.showAs, data.options.showTarget, data.options.showAs, data.options.showAs, data.options.showAs]
	}
}

// Select multiple in create/show/update related to target entity
exports.createNewFieldRelatedToMultiple = async (data) => {

	const alias = data.options.as;
	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	// Get source entity
	data.source_entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	// Check if a field with this name already exist
	if(data.source_entity.getField('f_' + data.options.urlAs)) {
		const err = new Error('database.field.error.alreadyExist');
		err.messageParams = [data.options.showAs];
		throw err;
	}

	// Foreign key name generation
	data.options.foreignKey = "fk_id_" + data.source_entity.name + "_" + alias.substring(2);

	// Check if the target entity exist
	data.target_entity = data.application.findEntity(data.options.target, true).entity;

	// If a using field or fields has been asked, we have to check if those fields exist in the entity
	if (typeof data.options.usingField !== "undefined") {
		const attributesPath = workspacePath + '/models/attributes/' + data.options.target.toLowerCase() + '.json';
		const attributeTarget = JSON.parse(fs.readFileSync(attributesPath));

		for (let i = 0; i < data.options.usingField.length; i++) {
			if (typeof attributeTarget[data.options.usingField[i]] === "undefined") {
				// If a asked using field doesn't exist in the target entity we send an error
				const err = new Error('structure.association.relatedTo.missingField');
				err.messageParams = [data.options.showUsingField[i], data.options.showTarget];
				throw err;
			} else {
				data.options.usingField[i] = {
					value: data.options.usingField[i],
					type: attributeTarget[data.options.usingField[i]].newmipsType
				}
			}
		}
	}

	// Check if an association already exists from source to target
	const optionsSourceObject = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.source_entity.name + '.json'));

	let toSync = true;
	let relation = "belongsToMany";

	// Check already exisiting association from source to target entity
	for (let i = 0; i < optionsSourceObject.length; i++) {
		if (optionsSourceObject[i].target.toLowerCase() == data.options.target.toLowerCase()) {
			if (data.options.as == optionsSourceObject[i].as)
				throw new Error("structure.association.error.alreadySameAlias");
		} else if (optionsSourceObject[i].relation == "belongsToMany" && data.options.as == optionsSourceObject[i].as) {
			throw new Error("structure.association.error.alreadySameAlias");
		} else if(data.options.as == optionsSourceObject[i].as){
			const err = new Error('database.field.error.alreadyExist');
			err.messageParams = [data.options.showAs];
			throw err;
		}
	}

	// Association table
	data.options.through = data.application.associationSeq + "_" + data.options.as.substring(2);

	// MySQL table length limit
	if (data.options.through.length > 60) {
		const err = new Error('error.valueTooLong');
		err.messageParams = [data.options.through];
		throw err;
	}

	// Check if an association already exists from target to source
	const optionsObject = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.target_entity.name + '.json'));

	for (let i = 0; i < optionsObject.length; i++) {
		if (data.source_entity.name != data.target_entity.name
				&& (optionsObject[i].target == data.source_entity.name
					&& optionsObject[i].relation == "belongsTo")) {
			// Temporary solution ! TODO: Mispy should ask if we want to link the already existing 1,1 with this new 1,n
			if (data.options.target.substring(2) == data.options.as.substring(2)
					&& optionsObject[i].target.substring(2) == optionsObject[i].as.substring(2)) {
				//&& (optionsObject[i].foreignKey == data.options.foreignKey)
				// If alias both side are the same that their own target then it trigger the 1,1 / 1,n generation
				data.options.foreignKey = optionsObject[i].foreignKey;
				// We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
				toSync = false;
				// If it's already define that target entity belongsTo source entity, then we create a simple hasMany instead of a belongsToMany
				relation = "hasMany";
				data.options.through = null;
			}
		}
	}

	// Create the association link between source and target
	const associationOption = {
		application: data.application,
		source: data.source_entity.name,
		target: data.target_entity.name,
		foreignKey: data.options.foreignKey,
		as: data.options.as,
		showAs: data.options.showAs,
		relation: relation,
		through: data.options.through,
		toSync: toSync,
		type: data.options.isCheckbox ? "relatedToMultipleCheckbox" : "relatedToMultiple"
	};

	if (typeof data.options.usingField !== "undefined")
		associationOption.usingField = data.options.usingField;
	if (typeof data.options.isCheckbox !== "undefined" && data.options.isCheckbox) {
		// If it's a checkbox presentation style, we need to load association directly in the route, not in ajax
		associationOption.loadOnStart = true;
	}

	// Generate ORM association
	structure_entity.setupAssociation(associationOption);

	// Generate HTML code
	await structure_field.setupRelatedToMultipleField(data);

	data.source_entity.addField('f_' + data.options.urlAs, data.options.showAs);

	return {
		message: 'structure.association.relatedToMultiple.success',
		messageParams: [data.options.showAs, data.options.showTarget, data.source_entity.name, data.options.showAs, data.options.showAs]
	};
}

/* --------------------------------------------------------------- */
/* -------------------------- COMPONENT -------------------------- */
/* --------------------------------------------------------------- */
exports.createNewComponentStatus = async (data) => {
	const self = this;
	const entity = data.application.findEntity(data.entity_name, true);
	data.np_module = entity.np_module;
	data.entity = entity.entity;

	if(data.entity.isParamEntity)
		throw new Error('error.notForParamEntity');

	if (data.entity.getComponent(data.options.value, 'status'))
		throw new Error('structure.component.error.alreadyExistOnEntity');

	data.history_table_db_name = data.application.associationSeq + '_history_' + data.options.value;
	data.history_table = 'history_' + data.entity.name.substring(2) + '_' + data.options.value.substring(2);

	// These instructions create a has many with a new entity history_status
	// It also does a hasMany relation with e_status
	const instructions = [
		"entity " + data.entity.name.substring(2) + ' has many ' + data.history_table_db_name + ' called History ' + data.options.showValue,
		"select entity " + data.history_table_db_name,
		"add field " + data.options.showValue + " related to Status using name",
		"add field Comment with type text",
		"add field Modified by related to user using login",
		"entity status has many " + data.history_table_db_name,
		"select entity " + data.entity.name.substring(2),
		"add field " + data.options.showValue + " related to Status using name"
	];

	await self.recursiveInstructionExecute(data, instructions, 0);

	await structure_component.newStatus(data);

	data.entity.addComponent(data.options.value, data.options.showValue, 'status');

	// Remove useless related field on entity
	data.entity.deleteField('f_' + data.options.value.substring(2));

	return {
		message: 'database.component.create.successOnEntity',
		messageParams: ['status', data.entity.displayName]
	};
}

const workspacesModels = {};
async function deleteComponentStatus(data) {
	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	/* If there is no defined name for the module, set the default */
	if (typeof data.options.value === 'undefined') {
		data.options.value = "s_status";
		data.options.urlValue = "status";
		data.options.showValue = "Status";
	}

	const foundEntity = data.application.findEntity(data.entity_name, true);
	data.np_module = foundEntity.np_module;
	data.entity = foundEntity.entity;
	data.component = data.entity.getComponent(data.options.value, 'status', true);

	// Looking for status & history status information in options.json
	const entityOptions = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.entity.name + '.json'));
	let historyInfo, statusFieldInfo;

	for (const option of entityOptions) {
		if (option.as == 'r_' + data.options.urlValue)
			statusFieldInfo = option;

		if (option.as == 'r_history_' + data.options.urlValue)
			historyInfo = option;
	}

	const modelsPath = workspacePath + '/models/';
	if(typeof workspacesModels[data.application.name] === 'undefined'){
		delete require.cache[require.resolve(modelsPath)];
		workspacesModels[data.application.name] = require(modelsPath); // eslint-disable-line
	}
	const historyTableName = workspacesModels[data.application.name]['E_' + historyInfo.target.substring(2)].getTableName();

	await structure_component.deleteStatus({
		application: data.application,
		status_field: 's_' + data.options.urlValue,
		fk_status: statusFieldInfo.foreignKey,
		entity: data.entity.name,
		historyName: historyInfo.target,
		historyTableName: historyTableName
	});

	data.entity.deleteComponent(data.options.value, 'status');

	return {
		message: 'database.component.delete.success'
	};
}
exports.deleteComponentStatus = deleteComponentStatus;

// Componant that we can add on an entity to store local documents
exports.addComponentFileStorage = async (data) => {

	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	if(data.entity.isParamEntity)
		throw new Error('error.notForParamEntity');

	/* If there is no defined name for the component */
	if (typeof data.options.value === "undefined") {
		data.options.value = "e_file_storage_" + data.entity.name.substring(2);
		data.options.showValue = "File storage";
	} else {
		data.options.value = data.options.value + "_" + data.entity.name.substring(2);
	}

	if (data.entity.getComponent(data.options.value, 'file_storage'))
		throw new Error('structure.component.error.alreadyExistOnEntity');

	if(data.application.findEntity(data.options.value))
		throw new Error("structure.component.error.alreadyExistInApp");

	const instructions = [
		'entity ' + data.entity.displayName + ' has many ' + data.options.showValue + ' ' + data.entity.displayName,
		'select entity ' + data.options.showValue + ' ' + data.entity.displayName,
		'add field filename with type file'
	];

	await this.recursiveInstructionExecute(data, instructions, 0);

	// structure_entity.setupAssociation(associationOption);
	structure_component.newFileStorage(data);

	data.entity.addComponent(data.options.value, data.options.showValue, 'file_storage');

	return {
		message: "database.component.create.successOnEntity",
		messageParams: [data.options.showValue, data.entity.displayName]
	};
}

// Componant to create a contact form in a module
exports.createNewComponentContactForm = async (data) => {

	const exportsContext = this;

	/* If there is no defined name for the module */
	if (typeof data.options.value === "undefined") {
		data.options.value = "e_contact_form";
		data.options.urlValue = "contact_form";
		data.options.showValue = "Contact Form";
	}

	data.np_module = data.application.getModule(data.module_name, true);

	data.options.valueSettings = data.options.value + "_settings";
	data.options.urlValueSettings = data.options.urlValue + "_settings";
	data.options.showValueSettings = data.options.showValue + " Settings";

	const instructions = [
		"add entity " + data.options.showValue,
		"add field Name",
		"set field Name required",
		"add field Sender with type email",
		"set field Sender required",
		"add field Recipient with type email",
		"add field User related to user using login",
		"add field Title",
		"set field Title required",
		"add field Content with type text",
		"set field Content required",
		"add entity " + data.options.showValueSettings,
		"add field Transport Host",
		"add field Port with type number",
		"add field Secure with type boolean and default value true",
		"add field User",
		"add field Pass",
		"add field Form Recipient",
		"set field Transport Host required",
		"set field Port required",
		"set field User required",
		"set field Pass required",
		"set field Form Recipient required"
	];

	// Start doing necessary instruction for component creation
	await exportsContext.recursiveInstructionExecute(data, instructions, 0);
	data.np_module.addComponent(data.options.value, data.options.showValue, 'contact_form');
	await structure_component.newContactForm(data);
	return {
		message: "database.component.create.success",
		messageParams: [data.options.showValue]
	};
}

exports.deleteComponentContactForm = async (data) => {

	const exportsContext = this;

	/* If there is no defined name for the module */
	if (typeof data.options.value === "undefined") {
		data.options.value = "e_contact_form";
		data.options.urlValue = "contact_form";
		data.options.showValue = "Contact Form";
	}

	data.np_module = data.application.getModule(data.module_name, true);

	// Checking that component exist
	data.np_module.getComponent(data.options.value, 'contact_form', true);

	data.options.valueSettings = data.options.value + "_settings";
	data.options.urlValueSettings = data.options.urlValue + "_settings";
	data.options.showValueSettings = data.options.showValue + " Settings";

	const instructions = [
		"delete entity " + data.options.showValue,
		"delete entity " + data.options.showValueSettings
	];

	// Create a tmp route file to avoid error during the delete entity, this file was removed at the component generation
	fs.writeFileSync(__dirname + "/../workspace/" + data.application.name + "/routes/" + data.options.valueSettings + ".js", "", "utf-8");

	// Start doing necessary instructions for component deletion
	await exportsContext.recursiveInstructionExecute(data, instructions, 0);
	data.np_module.deleteComponent(data.options.value, 'contact_form');

	return {
		message: "database.component.delete.success"
	};
}

// Componant to create an agenda in a module
exports.createNewComponentAgenda = async (data) => {

	/* If there is no defined name for the module */
	if (typeof data.options.value === "undefined") {
		data.options.value = "c_agenda";
		data.options.urlValue = "agenda";
		data.options.showValue = "Agenda";
	}

	data.np_module = data.application.getModule(data.module_name, true);

	if(data.np_module.getComponent(data.options.value, 'agenda'))
		throw new Error("structure.component.error.alreadyExistOnModule");

	const showValueEvent = data.options.showValue + " Event";
	const showValueCategory = data.options.showValue + " Category";

	const instructions = [
		"add entity " + showValueCategory,
		"add field Label",
		"add field Color with type color",
		"set field Label required",
		"set field Color required",
		"add entity " + showValueEvent,
		"add field Title",
		"add field Description with type text",
		"add field Place",
		"add field Start date with type datetime",
		"add field End date with type datetime",
		"add field All day with type boolean",
		"add field Category related to " + showValueCategory + " using Label",
		"add field Users related to many user using login, email",
		"set field Title required",
		"set field Start date required"
	];

	// Start doing necessary instruction for component creation
	await this.recursiveInstructionExecute(data, instructions, 0);
	data.np_module.addComponent(data.options.value, data.options.showValue, 'agenda');
	await structure_component.newAgenda(data);

	return {
		message: "database.component.create.success",
		messageParams: [data.options.showValue]
	};
}

exports.deleteAgenda = async (data) => {

	/* If there is no defined name for the module */
	if (typeof data.options.value === "undefined") {
		data.options.value = "c_agenda";
		data.options.urlValue = "agenda";
		data.options.showValue = "Agenda";
	}

	data.np_module = data.application.getModule(data.module_name, true);

	if(!data.np_module.getComponent(data.options.value, 'agenda')) {
		const err = new Error("database.component.notFound.notFoundInModule");
		err.messageParams = [data.options.showValue, data.np_module.displayName];
		throw err;
	}

	const showValueEvent = data.options.showValue + " Event";
	const showValueCategory = data.options.showValue + " Category";

	const instructions = [
		"delete entity " + showValueCategory,
		"delete entity " + showValueEvent,
	];

	// Start doing necessary instruction for component creation
	await this.recursiveInstructionExecute(data, instructions, 0);
	await structure_component.deleteAgenda(data);
	data.np_module.deleteComponent(data.options.value, 'agenda');

	return {
		message: "database.component.delete.success"
	};
}

exports.createComponentChat = async (data) => {

	if(data.application.getComponent('chat', 'chat'))
		throw new Error("structure.component.error.alreadyExistInApp");

	await structure_component.setupChat(data);
	data.application.addComponent('chat', 'Chat', 'chat');

	return {
		message: 'structure.component.chat.success'
	}
}

// Create new component address
exports.createNewComponentAddress = async (data) => {

	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	if(data.options.componentName) {
		// TODO - 2.10
		// data.options.as = 'r_address_' + data.options.value;
		// data.options.urlValue = 'address_' + data.entity_name + '_' + data.options.value;
		// data.options.value = 'e_address_' + data.entity_name + '_' + data.options.value;

		data.options.as = 'r_address';
		data.options.value = 'e_address_' + data.entity_name;
		data.options.showValue = data.options.componentName;
		data.options.urlValue = 'address_' + data.entity_name;
	} else {
		data.options.value = 'e_address_' + data.entity_name;
		data.options.showValue = 'Address ' + data.entity.displayName;
		data.options.urlValue = 'address_' + data.entity_name;
		data.options.as = 'r_address';
	}

	if(data.entity.getComponent(data.options.value, 'address'))
		throw new Error("structure.component.error.alreadyExistOnEntity");

	const associationOption = {
		application: data.application,
		source: data.entity.name,
		target: data.options.value,
		foreignKey: 'fk_id_address',
		as: data.options.as,
		type: "relatedTo",
		relation: "belongsTo",
		targetType: "component",
		toSync: true
	};

	structure_entity.setupAssociation(associationOption);

	data.entity.addComponent(data.options.value, 'Address', 'address');
	await structure_component.addNewComponentAddress(data);

	return {
		message: 'database.component.create.success',
		messageParams: [data.options.showValue]
	};
}

exports.deleteComponentAddress = async (data) => {

	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	data.options.value = 'e_address_' + data.entity_name;
	data.options.showValue = 'Address ' + data.entity.displayName;
	data.options.urlValue = 'address_' + data.entity_name;

	if(!data.entity.getComponent(data.options.value, 'address')){
		const err = new Error("database.component.notFound.notFoundOnEntity");
		err.messageParams = [data.options.showValue, data.entity.displayName];
		throw err;
	}

	await structure_component.deleteComponentAddress(data);
	data.fieldToDrop = 'fk_id_address';
	database.dropFKField(data);

	data.entity.deleteComponent(data.options.value, 'address');

	return {
		message: 'database.component.delete.success'
	}
}

exports.createComponentDocumentTemplate = async (data) => {

	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	data.options.value = 'c_document_template';
	data.options.showValue = 'Document template';
	data.options.urlValue = 'document_template';

	if(data.entity.getComponent(data.options.value, 'document_template'))
		throw new Error("structure.component.error.alreadyExistOnEntity");

	if (!data.application.hasDocumentTemplate) {
		const instructions = [
			"select module Administration",
			"add entity " + data.options.showValue,
			"set icon file-text",
			"add field name",
			"add field file with type file",
			"add field entity",
			"add field exclude relations with type text",
			"add entity Image ressources",
			"set icon picture-o",
			"add field Image with type image",
			"set field Image required",
			"add field code",
			"set field code required"
		];

		await this.recursiveInstructionExecute(data, instructions, 0);
	}

	await structure_component.createComponentDocumentTemplate(data);
	data.entity.addComponent(data.options.value, "Document template", 'document_template');

	if(!data.application.hasDocumentTemplate)
		data.application.hasDocumentTemplate = 1;

	return {
		message: 'database.component.create.success',
		messageParams: ["Document template"]
	};
};

exports.deleteComponentDocumentTemplate = async (data) => {

	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	data.options.value = 'c_document_template';
	data.options.showValue = 'Document template';
	data.options.urlValue = 'document_template';

	if(!data.entity.getComponent(data.options.value, 'document_template')){
		const err = new Error("database.component.notFound.notFoundOnEntity");
		err.messageParams = [data.options.showValue, data.entity.displayName];
		throw err;
	}

	// Remove component template from entity
	await structure_component.deleteComponentDocumentTemplate(data)
	data.entity.deleteComponent(data.options.value, 'document_template');

	return {
		message: 'database.component.delete.success',
		messageParams: ["Document template"]
	};
};

/* --------------------------------------------------------------- */
/* -------------------------- INTERFACE -------------------------- */
/* --------------------------------------------------------------- */
exports.setLogo = async (data) => {
	await structure_ui.setLogo(data);
	return {
		message: 'preview.logo.add',
		restartServer: false
	};
}

exports.removeLogo = async (data) => {
	const message = await structure_ui.removeLogo(data);
	return {
		message: message,
		restartServer: false
	};
}

exports.setLayout = async (data) => {
	data.np_module = data.application.getModule(data.module_name, true);
	return await structure_ui.setLayout(data);
}

exports.listLayout = async (data) => structure_ui.listLayout(data); // eslint-disable-line

exports.setTheme = async (data) => {
	await structure_ui.setTheme(data);
	return {
		message: "structure.ui.theme.successInstall",
		messageParams: [data.options.value],
		restartServer: false
	}
}

exports.listTheme = async (data) => structure_ui.listTheme(data); // eslint-disable-line

exports.listIcon = async _ => { // eslint-disable-line
	return {
		message: "structure.ui.icon.list",
		messageParams: ['https://fontawesome.com/v4.7.0/icons/'],
		restartServer: false
	}
}

exports.setIcon = async (data) => {

	if(typeof data.options.value !== 'undefined')
		data.entity_name = data.options.value;

	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	await structure_ui.setIcon(data);
	return {
		message: "structure.ui.icon.success",
		messageParams: [data.entity.displayName, data.iconValue],
		restartServer: false
	}
}

exports.addTitle = async (data) => {

	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

	if(data.options.afterField) {
		const field = "f_" + dataHelper.clearString(data.options.afterField);
		data.field = data.entity.getField(field, true);
	}

	await structure_ui.addTitle(data);
	return {
		message: 'structure.ui.title.success'
	}
}

exports.removeTitle = async (data) => {
	data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);
	await structure_ui.removeTitle(data);
	return {
		message: 'structure.ui.title.remove_success'
	}
}

exports.createWidgetPiechart = async (data) => {

	if(data.entityTarget) {
		const entity = "e_" + dataHelper.clearString(data.entityTarget);
		data.entity_name = entity;
	}

	data.np_module = data.application.getModule(data.module_name, true);
	data.entity = data.np_module.getEntity(data.entity_name, true);
	data.field = data.entity.getField("f_" + dataHelper.clearString(data.givenField));

	await structure_ui.createWidgetPiechart(data);

	return {
		message: 'structure.ui.widget.success',
		messageParams: [data.widgetInputType, data.np_module.displayName]
	}
}

exports.createWidgetLastRecords = async (data) => {

	if(data.entityTarget) {
		const entity = "e_" + dataHelper.clearString(data.entityTarget);
		data.entity_name = entity;
	}

	data.np_module = data.application.getModule(data.module_name, true);
	data.entity = data.np_module.getEntity(data.entity_name, true);

	// Check for not found fields and build error message
	loop1: for (let k = 0; k < data.columns.length; k++) {

		if (data.columns[k].toLowerCase() == 'id') {
			data.columns[k] = {
				name: 'id',
				displayName: 'id',
				found: true
			};
			continue;
		}

		// Looking in entity fields
		for (let i = 0; i < data.entity.fields.length; i++) {
			if (data.columns[k].toLowerCase() == data.entity.fields[i].displayName.toLowerCase()) {
				data.columns[k] = {
					name: data.entity.fields[i].name,
					displayName: data.entity.fields[i].displayName,
					found: true
				};
				continue loop1;
			}
		}

		// Looking in entity components for status
		for (let i = 0; i < data.entity.components.length; i++) {

			if (data.entity.components[i].name.indexOf('s_') == 0 && data.columns[k] == data.entity.components[i].displayName) {
				data.columns[k] = {
					name: 'r_' + data.entity.components[i].name.substring(2),
					displayName: data.entity.components[i].displayName,
					found: true
				};
				continue loop1;
			}
		}

		data.columns[k] = {
			name: data.columns[k],
			found: false
		};
	}

	await structure_ui.createWidgetLastRecords(data);

	return {
		message: 'structure.ui.widget.success',
		messageParams: [data.widgetInputType, data.np_module.displayName]
	};
}

exports.createWidgetOnEntity = async (data) => {
	const entity = "e_" + dataHelper.clearString(data.entityTarget);
	data.entity_name = data.application.findEntity(entity, true).entity.name;
	return await createWidget(data); // eslint-disable-line
}

async function createWidget(data) {
	if (data.widgetType == -1) {
		const err = new Error('structure.ui.widget.unknown');
		err.messageParams = [data.widgetInputType];
		throw err;
	}

	const entity = data.application.findEntity(data.entity_name, true);
	data.np_module = entity.np_module;
	data.entity = entity.entity;
	await structure_ui.createWidget(data);
	return {
		message: "structure.ui.widget.success",
		messageParams: [data.widgetInputType, entity.np_module.name]
	};
}
exports.createWidget = createWidget;

async function deleteWidget(data) {
	if (data.widgetType == -1) {
		const err = new Error('structure.ui.widget.unkown');
		err.messageParams = [data.widgetInputType];
		throw err;
	}

	data.np_module = data.application.getModule(data.module_name, true);
	data.entity = data.np_module.getEntity(data.entity_name, true);

	await structure_ui.deleteWidget(data);

	return {
		message: "structure.ui.widget.delete",
		messageParams: [data.widgetInputType]
	}
}
exports.deleteWidget = deleteWidget;

async function deleteEntityWidgets(data) {
	data.widgetTypes = ['info', 'stats', 'lastrecords', 'piechart'];
	await deleteWidget(data);

	return {
		message: "structure.ui.widget.all_deleted",
		messageParams: [data.entityTarget]
	};
}
exports.deleteEntityWidgets = deleteEntityWidgets;
