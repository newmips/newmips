const fs = require('fs-extra');
const globalConf = require("../config/global.js");
const gitHelper = require("../utils/git_helper");
const language = require("../services/language");
const metadata = require('../database/metadata')();

// Get
exports.getSession = (req) => {
	let application, np_module, entity;
	application = metadata.getApplication(req.session.app_name);
	np_module = application.getModule(req.session.module_name);
	if(req.session.entity_name)
		entity = np_module.getEntity(req.session.entity_name);
	return {
		application: {
			name: application ? application.displayName : null,
			noApplication: language(req.session.lang_user).__("preview.session.noApplication")
		},
		module: {
			name: np_module ? np_module.displayName : null,
			noModule: language(req.session.lang_user).__("preview.session.noModule")
		},
		entity: {
			name: entity ? entity.displayName : null,
			noEntity: language(req.session.lang_user).__("preview.session.noEntity")
		}
	};
}

// Set session in POST application
exports.setSession = function(npFunction, req, info, data) {

	let iframeUrl;
	switch(npFunction){
		case "selectApplication":
		case "createNewApplication":
			req.session.app_name = info.application.name;
			req.session.module_name = null;
			req.session.entity_name = null;
			break;
		case "selectModule":
		case "createNewModule":
			req.session.module_name = info.module.name;
			req.session.entity_name = null;
			if (data && data.iframe_url) {
				// Redirect iframe to new module
				iframeUrl = data.iframe_url.split("/");
				data.iframe_url = iframeUrl[0] + "//" + iframeUrl[2] + "/default/" + info.module.name.substring(2);
			}
			break;
		case "selectEntity":
			req.session.entity_name = info.entity.name;
			req.session.module_name = info.module.name;
			if (data && data.iframe_url && info.doRedirect) {
				iframeUrl = data.iframe_url.split("/");
				data.iframe_url = iframeUrl[0] + "//" + iframeUrl[2] + "/" + info.entity.name.substring(2) + "/list";
			}
			break;
		case "createNewEntity":
			req.session.entity_name = info.entity.name;
			if (data && data.iframe_url) {
				iframeUrl = data.iframe_url.split("/");
				data.iframe_url = iframeUrl[0] + "//" + iframeUrl[2] + "/" + info.entity.name.substring(2) + "/create_form";
			}
			break;
		case "createNewEntityWithBelongsTo":
		case "createNewEntityWithHasMany":
		case "createNewBelongsTo":
		case "createNewHasMany":
		case "createNewFieldRelatedTo":
			req.session.entity_name = info.entity.name;
			break;
		case "deleteApplication":
			req.session.app_name = null;
			req.session.module_name = null;
			req.session.entity_name = null;
			break;
		case "deleteModule":
			req.session.module_name = "m_home";
			req.session.entity_name = null;
			if (data && data.iframe_url) {
				// Redirect iframe to home module
				iframeUrl = data.iframe_url.split("/");
				data.iframe_url = iframeUrl[0] + "//" + iframeUrl[2] + "/default/home";
			}
			break;
		case "deleteDataEntity":
			// If we were on the deleted entity we has to reset the entity session
			if(req.session.entity_name == info.entity.name)
				req.session.entity_name = null;
			break;
	}
	return data;
}

// Set session for the instruction script
exports.setSessionForInstructionScript = function(attrFunction, userArray, info) {

	switch(attrFunction){
		case "selectProject":
		case "createNewProject":
			userArray.ids.id_project = info.insertId;
			userArray.ids.id_application = null;
			userArray.ids.id_module = null;
			userArray.ids.id_data_entity = null;
			break;
		case "selectApplication":
		case "createNewApplication":
			userArray.ids.id_application = info.insertId;
			userArray.name_application = info.name_application;
			userArray.ids.id_module = null;
			userArray.ids.id_data_entity = null;
			break;
		case "selectModule":
		case "createNewModule":
			userArray.ids.id_module = info.insertId;
			userArray.ids.id_data_entity = null;
			break;
		case "selectEntity":
			userArray.ids.id_data_entity = info.insertId;
			userArray.ids.id_module = info.moduleId;
			break;
		case "createNewEntity":
		case "selectEntity":
		case "createNewEntityWithBelongsTo":
		case "createNewEntityWithHasMany":
		case "createNewBelongsTo":
		case "createNewHasMany":
		case "createNewFieldRelatedTo":
			userArray.ids.id_data_entity = info.insertId;
			break;
		case "deleteProject":
			userArray.ids.id_project = null;
			userArray.ids.id_application = null;
			userArray.ids.id_module = null;
			userArray.ids.id_data_entity = null;
			break;
		case "deleteApplication":
			userArray.ids.id_application = null;
			userArray.ids.id_module = null;
			userArray.ids.id_data_entity = null;
			break;
		case "deleteModule":
			userArray.ids.id_module = info.homeID;
			userArray.ids.id_data_entity = null;
			break;
	}
}

// Set session only in a given obj
exports.setSessionObj = function(data, info) {

	switch(data.function){
		case "selectApplication":
		case "createNewApplication":
			data.app_name = info.application.name;
			data.module_name = null;
			data.entity_name = null;
			break;
		case "selectModule":
		case "createNewModule":
			data.module_name = info.module.name;
			data.entity_name = null;
			break;
		case "createNewEntity":
		case "selectEntity":
		case "createNewEntityWithBelongsTo":
		case "createNewEntityWithHasMany":
		case "createNewBelongsTo":
		case "createNewHasMany":
		case "createNewFieldRelatedTo":
			data.entity_name = info.entity.name;
			break;
		case "deleteApplication":
			data.app_name = null;
			data.module_name = null;
			data.entity_name = null;
			break;
		case "deleteModule":
			data.module_name = info.homeID;
			data.entity_name = null;
			break;
	}

	return data;
}
