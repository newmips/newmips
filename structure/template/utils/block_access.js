const models = require('../models/');
const fs = require('fs-extra');

// route middleware to make sure
exports.isLoggedIn = function(req, res, next) {
	// Autologin for newmips's "iframe" live preview context
	if (AUTO_LOGIN == true){ // eslint-disable-line
		AUTO_LOGIN = false; // eslint-disable-line
		models.E_user.findOne({
			where: {
				id: 1
			},
			include: [{
				model: models.E_group,
				as: 'r_group'
			}, {
				model: models.E_role,
				as: 'r_role'
			}]
		}).then(user => req.login(user, _ => next()));
	}
	else if (req.isAuthenticated())
		return next();
	else
		res.redirect('/login?r=' + req.originalUrl);
};

// If the user is already identified, he can't access the login page
exports.loginAccess = function(req, res, next) {
	// If user is not authenticated in the session, carry on
	if (!req.isAuthenticated())
		return next();

	res.redirect('/default/home');
};

let LOAD_ACCESS_FILE = true;
exports.reloadAccess = function(reload = true) {
	LOAD_ACCESS_FILE = reload;
}
let ACCESS;
function getAccess() {
	if (LOAD_ACCESS_FILE || !ACCESS) {
		try {
			ACCESS = JSON.parse(fs.readFileSync(__dirname+'/../config/access.json', 'utf8'));
		} catch(e) {console.error(e);return {};}
		LOAD_ACCESS_FILE = false;
	}
	return ACCESS;
}

function isInBothArray(stringArray, objectArray) {
	if (stringArray.length == 0)
		return false;
	let allowedCount = 0;
	for (let j = 0; j < objectArray.length; j++) {
		let isAllowed = true;
		for (let i = 0; i < stringArray.length; i++) {
			if (stringArray[i] == objectArray[j].f_label)
				isAllowed = false;
		}
		if (isAllowed == true)
			allowedCount++;
	}

	if (allowedCount > 0)
		return false
	return true;
}
// Check if user's group have access to module
function moduleAccess(userGroups, moduleName) {
	try {
		if(userGroups.length == 0)
			return false;
		const access = getAccess();
		for (const npsModule in access)
			if (npsModule == moduleName)
				if (!isInBothArray(access[npsModule].groups, userGroups))
					return true;
		return false;
	} catch (e) {
		return false;
	}
}
exports.moduleAccess = moduleAccess;

exports.moduleAccessMiddleware = function(moduleName) {
	return function(req, res, next) {
		if (!req.isAuthenticated())
			return res.redirect('/login');
		const userGroups = req.session.passport.user.r_group;
		if (userGroups.length > 0 && moduleAccess(userGroups, moduleName))
			return next();

		if(userGroups.length == 0){
			req.session.toastr = [{
				level: 'error',
				message: "settings.auth_component.no_group"
			}];
			return res.redirect('/logout');
		}

		req.session.toastr = [{
			level: 'error',
			message: "settings.auth_component.no_access_group_module"
		}];
		return res.redirect('/');
	}
}

exports.haveGroup = function(userGroups, group) {
	for (let i = 0; i < userGroups.length; i++)
		if (userGroups[i].f_label == group)
			return true;
	return false;
}

// Check if user's group have access to entity
function entityAccess(userGroups, entityName) {
	try {
		if(userGroups.length == 0)
			return false;
		const access = getAccess();
		for (const npsModule in access) {
			const moduleEntities = access[npsModule].entities;
			for (let i = 0; i < moduleEntities.length; i++)
				if (moduleEntities[i].name == entityName) {
					// Check if group can access entity AND module to which the entity belongs
					// if (!isInBothArray(moduleEntities[i].groups, userGroups)
					// && !isInBothArray(access[npsModule].groups, userGroups)) {
					//	 return true;
					// }

					// Check if group can access entity
					if (!isInBothArray(moduleEntities[i].groups, userGroups))
						return true;
				}
		}
		return false;
	} catch (e) {
		return false;
	}
}
exports.entityAccess = entityAccess;

// Check if user's role can do `action` on entity
function actionAccess(userRoles, entityName, action) {
	try {
		if(userRoles.length == 0)
			return false;
		const access = getAccess();
		for (const npsModule in access) {
			const moduleEntities = access[npsModule].entities;
			for (let i = 0; i < moduleEntities.length; i++)
				if (moduleEntities[i].name == entityName)
					return !isInBothArray(moduleEntities[i].actions[action], userRoles)
		}
		return false;
	} catch (e) {
		return false;
	}
}
exports.actionAccess = actionAccess;

exports.entityAccessMiddleware = function(entityName) {
	return function(req, res, next) {
		if(req.originalUrl == '/user/settings') {
			// Exception for /user/settings, only logged access is required
			return next()
		} else if (req.originalUrl == `/${entityName}/search`) {
			// Exception for `/search` routes. We only check for 'read' action access.
			// Bypass module/entity access check
			if (actionAccess(req.session.passport.user.r_role, entityName, 'read'))
				return next();
		} else {
			const userGroups = req.session.passport.user.r_group;
			if (userGroups.length > 0 && entityAccess(userGroups, entityName))
				return next();
		}
		req.session.toastr = [{
			level: 'error',
			message: "settings.auth_component.no_access_group_entity"
		}];
		return res.redirect('/');
	}
}

exports.actionAccessMiddleware = function(entityName, action) {
	return function(req, res, next) {
		const userRoles = req.session.passport.user.r_role;
		if (userRoles.length > 0 && actionAccess(userRoles, entityName, action))
			return next();
		req.session.toastr = [{
			level: 'error',
			message: "settings.auth_component.no_access_role"
		}];
		return res.redirect('/');
	}
}

exports.apiAuthentication = function(req, res, next) {
	const token = req.query.token;

	models.E_api_credentials.findOne({
		where: {
			f_token: token
		}
	}).then(function(credentialsObj) {
		if (!credentialsObj)
			return res.status(401).end('Bad Bearer Token');

		const currentTmsp = new Date().getTime();
		if (parseInt(credentialsObj.f_token_timeout_tmsp) < currentTmsp)
			return res.status(403).json('Bearer Token expired');

		req.apiCredentials = credentialsObj;
		next();
	});
}

exports.accessFileManagment = function(){
	if (!fs.existsSync(__dirname +'/../config/access.lock.json') && !fs.existsSync(__dirname +'/../config/access.json'))
		throw new Error("Missing access.json and access.lock.json file.")

	// Generate access.json file
	if (!fs.existsSync(__dirname +'/../config/access.json'))
		fs.copySync(__dirname +'/../config/access.lock.json', __dirname +'/../config/access.json');

	// Generate access.lock.json file
	if (!fs.existsSync(__dirname +'/../config/access.lock.json'))
		fs.copySync(__dirname +'/../config/access.json', __dirname +'/../config/access.lock.json');
	else {
		// access.lock.json exist, check if new keys to add in access.json
		const access = JSON.parse(fs.readFileSync(__dirname +'/../config/access.json'))
		const accessLock = JSON.parse(fs.readFileSync(__dirname +'/../config/access.lock.json'))

		const emptyEntityContent = {
			"name": "",
			"groups": [],
			"actions": {
				"read": [],
				"create": [],
				"delete": [],
				"update": []
			}
		}

		let lockEntities, accessEntities, found;
		// Add missing things in access.json
		for (const moduleLock in accessLock) {
			// Generate new module with entities and groups if needed
			if(!access[moduleLock]){
				console.log("access.json: NEW MODULE: "+moduleLock);
				access[moduleLock] = {};
				access[moduleLock].entities = accessLock[moduleLock].entities;
				access[moduleLock].groups = accessLock[moduleLock].groups;
				continue;
			}

			// Loop on entities to add missing ones
			lockEntities = accessLock[moduleLock].entities;
			accessEntities = access[moduleLock].entities;
			for (let i = 0; i < lockEntities.length; i++){
				found = false;
				for (let j = 0; j < accessEntities.length; j++)
					if(lockEntities[i].name == accessEntities[j].name){found=true;break;}
				if(!found){
					// Add new entity to access
					emptyEntityContent.name = lockEntities[i].name;
					accessEntities.push(Object.assign({}, emptyEntityContent));
					console.log("access.json : NEW ENTITY " + lockEntities[i].name + " IN MODULE " + moduleLock);
				}
			}
		}

		// Remove key in access that are not in access.lock
		for (const nps_module in access) {
			// Generate new module with entities and groups if needed
			if(!accessLock[nps_module]){
				console.log("access.json: REMOVE MODULE: "+nps_module);
				delete access[nps_module];
				continue;
			}

			// Loop on entities to remove missing ones
			lockEntities = accessLock[nps_module].entities;
			accessEntities = access[nps_module].entities;
			const idxToRemove = [];
			for (let i = 0; i < accessEntities.length; i++) {
				found = false;
				for (let j = 0; j < lockEntities.length; j++) {
					if (accessEntities[i].name == lockEntities[j].name) {
						found = true;
						break;
					}
				}
				if (!found) {
					// Remove entity from access
					idxToRemove.push(i);
					console.log("access.json : REMOVE ENTITY " + accessEntities[i].name + " IN MODULE " + nps_module);
				}
			}

			access[nps_module].entities = access[nps_module].entities.filter((val, idx) => idxToRemove.indexOf(idx) == -1)
		}

		// Write access.json with new entries
		fs.writeFileSync(__dirname +'/../config/access.json', JSON.stringify(access, null, 4), "utf8");
	}
}

exports.statusGroupAccess = function(req, res, next) {

	const idNewStatus = parseInt(req.params.id_new_status);
	const userGroups = req.session.passport.user.r_group;

	models.E_status.findOne({
		where: {
			id: idNewStatus
		},
		include: [{
			model: models.E_group,
			as: "r_accepted_group"
		}]
	}).then(newStatus => {
		if(!newStatus){
			return next();
		}
		if(!newStatus.r_accepted_group || newStatus.r_accepted_group.length == 0){
			// Not groups defined, open for all
			return next();
		}
		for (let i = 0; i < userGroups.length; i++) {
			for (let j = 0; j < newStatus.r_accepted_group.length; j++) {
				if(userGroups[i].id == newStatus.r_accepted_group[j].id){
					// You are in accepted groups, let's continue
					return next();
				}
			}
		}

		console.log("USER "+req.session.passport.user.f_login+" TRYING TO SET STATUS "+idNewStatus+ " BUT IS NOT AUTHORIZED.");
		req.session.toastr = [{
			message: "settings.auth_component.no_access_change_status",
			level: "error"
		}]
		return res.redirect("/");
	})
}