const fs = require('fs-extra');
const language = require('../services/language');
const model_builder = require('../utils/model_builder');
const models = require('../models');

module.exports = {
	// Build entity tree with fields and ONLY belongsTo associations
	entityFieldTree:  (entity, alias) => {
		const genealogy = [];
		// Create inner function to use genealogy globaly
		function loadTree(entity, alias) {
			const fieldTree = {
				entity: entity,
				alias: alias || entity,
				fields: [],
				email_fields: [],
				phone_fields: [],
				file_fields: [],
				children: []
			}

			let entityFields, entityAssociations;
			try {
				entityFields = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+entity+'.json'));
				entityAssociations = JSON.parse(fs.readFileSync(__dirname+'/../models/options/'+entity+'.json'));
			} catch (e) {
				console.error(e);
				return fieldTree;
			}

			// Building field array
			for (const field in entityFields) {
				if (entityFields[field].newmipsType == "email")
					fieldTree.email_fields.push(field);
				if (entityFields[field].newmipsType == "phone")
					fieldTree.phone_fields.push(field);
				if (entityFields[field].newmipsType == "file" || entityFields[field].newmipsType == "picture")
					fieldTree.file_fields.push(field);
				fieldTree.fields.push(field);
			}

			// Check if current entity has already been built in this branch of the tree to avoid infinite loop
			if (genealogy.indexOf(entity) != -1)
				return fieldTree;
			genealogy.push(entity);

			// Building children array
			for (let i = 0; i < entityAssociations.length; i++)
				if (entityAssociations[i].relation == 'belongsTo' && entityAssociations[i].target != entity)
					fieldTree.children.push(loadTree(entityAssociations[i].target, entityAssociations[i].as));

			return fieldTree;
		}
		return loadTree(entity, alias);
	},
	// Build entity tree with fields and ALL associations
	fullEntityFieldTree:  (entity, alias = entity) => {
		const genealogy = [];
		// Create inner function to use genealogy globaly
		function loadTree(entity, alias, depth = 0) {
			const fieldTree = {
				entity: entity,
				alias: alias,
				fields: [],
				email_fields: [],
				phone_fields: [],
				file_fields: [],
				children: []
			}
			let entityFields, entityAssociations;
			try {
				entityFields = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+entity+'.json'));
				entityAssociations = JSON.parse(fs.readFileSync(__dirname+'/../models/options/'+entity+'.json'));
			} catch (e) {
				console.error(e);
				return fieldTree;
			}

			// Building field array
			for (const field in entityFields) {
				if (entityFields[field].newmipsType == "email")
					fieldTree.email_fields.push(field);
				if (entityFields[field].newmipsType == "phone")
					fieldTree.phone_fields.push(field);
				if (entityFields[field].newmipsType == "file" || entityFields[field].newmipsType == "picture")
					fieldTree.file_fields.push(field);
				fieldTree.fields.push(field);
			}

			// Check if current entity has already been built in this branch of the tree to avoid infinite loop
			for (const [idx, genealogyBranch] of genealogy.entries())
				if (genealogyBranch.entity == entity) {
					// Keep smallest depth
					if (genealogyBranch.depth > depth)
						genealogy.splice(idx, 1);
					else
						return fieldTree;
				}

			genealogy.push({
				entity: entity,
				depth: depth
			});

			// Building children array
			for (let i = 0; i < entityAssociations.length; i++) {
				// Do not include history & status table in field list
				if(entityAssociations[i].target.indexOf("e_history_e_") == -1 && entityAssociations[i].target.indexOf("e_status") == -1 && entityAssociations[i].structureType !== 'auto_generate')
					fieldTree.children.push(loadTree(entityAssociations[i].target, entityAssociations[i].as, depth+1));
			}

			return fieldTree;
		}
		return loadTree(entity, alias);
	},
	// Build array of fields for media sms/notification/email insertion <select>
	entityFieldForSelect: function(entityTree, lang) {
		const __ = language(lang).__;
		const separator = ' > ';
		const options = [];
		function dive(obj, codename, parent, parentTraduction = "") {
			let traduction;
			// Top level. Entity traduction Ex: 'Ticket'
			if (!parent)
				traduction = __('entity.'+obj.entity+'.label_entity');
			// Child level. Parent traduction with child entity alias Ex: 'Ticket > Participants' OR 'Ticket > Participants > Adresse'
			else
				traduction = parentTraduction + separator + __('entity.'+parent.entity+'.'+obj.alias);

			for (let j = 0; j < obj.fields.length; j++) {
				if (obj.fields[j].indexOf('f_') != 0)
					continue;
				options.push({
					codename: !codename ? obj.fields[j] : codename+'.'+obj.fields[j],
					traduction: traduction + separator + __('entity.'+obj.entity+'.'+obj.fields[j]), // Append field to traduction Ex: 'Ticket > Participants > Adresse > Ville'
					target: obj.entity,
					isEmail: obj.email_fields.indexOf(obj.fields[j]) != -1,
					isPhone: obj.phone_fields.indexOf(obj.fields[j]) != -1,
					isFile: obj.file_fields.indexOf(obj.fields[j]) != -1
				});
			}

			for (let i = 0; i < obj.children.length; i++)
				dive(obj.children[i], !codename ? obj.children[i].alias : codename+'.'+obj.children[i].alias, obj, traduction);
		}

		// Build options array
		dive(entityTree);

		// Sort options array
		// loopCount is used to avoid "Maximum call stack exedeed" error with large arrays.
		// Using setTimeout (even with 0 milliseconds) will end the current call stack and create a new one.
		// Even with 0 milliseconds timeout execution can be realy slower, so we reset call stack once every 1000 lap
		function stackProtectedRecursion(sortFunc, ...args) {
			if (!this.loopCount)
				this.loopCount = 0;
			this.loopCount++;
			if (this.loopCount % 1000 === 0) {
				this.loopCount = 0;
				return setTimeout(() => {sortFunc(...args);}, 0);
			}
			return sortFunc(...args);
		}
		function swap(arr, i, j) {
			const tmp = arr[j];
			arr[j] = arr[i];
			arr[i] = tmp;
		}
		function sort(array, idx = 0) {
			if (idx < 0) idx = 0;
			if (!array || !array[idx+1])
				return;

			const first = array[idx].traduction.split(separator);
			const second = array[idx+1].traduction.split(separator);

			// Swap because of depth difference
			if (first.length > second.length) {
				swap(array, idx, idx+1);
				idx--;
			}
			else if (first.length == second.length) {
				// Dive depth until mismatch
				const initialIdx = idx;
				for (let i = 0; i < first.length; i++) {
					if (first[i] > second[i]) {
						swap(array, idx, idx+1);
						idx--;
						break;
					}
					else if (first[i] < second[i]) {
						idx++;
						break;
					}
				}
				// Avoid infinite loop if both traduction are equal
				if (initialIdx == idx)
					idx++;
			}
			else
				idx++;

			stackProtectedRecursion(sort, array, idx);
		}
		sort(options);

		return options;
	},
	// Build sequelize formated include object from tree
	buildIncludeFromTree: function (entityTree) {
		const includes = [];
		for (let i = 0; entityTree.children && i < entityTree.children.length; i++) {
			const include = {};
			const child = entityTree.children[i];
			include.as = child.alias;
			include.model = models[child.entity.charAt(0).toUpperCase() + child.entity.toLowerCase().slice(1)];
			if (child.children && child.children.length != 0)
				include.include = this.buildIncludeFromTree(child);

			includes.push(include);
		}
		return includes;
	},
	// Build array of user target for media_notification insertion <select>
	getUserTargetList: (entityTree, lang) => {
		const __ = language(lang).__;
		entityTree.topLevel = true;
		const userList = [];
		function dive(obj, parent = null) {
			if (obj.entity == "e_user") {
				userList.push({
					traduction: __("entity."+parent.entity+"."+obj.alias),
					field: "{" + (parent == null || parent.topLevel ? obj.alias : parent.alias+'.'+obj.alias) + "}"
				});
			}
			else
				for (let i = 0; i < obj.children.length; i++)
					dive(obj.children[i], obj)
		}
		dive(entityTree);
		return userList;
	},
	entityStatusFieldList: function() {
		const self = this;
		const entities = [];
		fs.readdirSync(__dirname+'/../models/attributes').filter(file => file.indexOf('.') !== 0 && file.slice(-5) === '.json').forEach(file => {
			const entityName = file.slice(0, -5);
			const attributesObj = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+file));
			const statuses = self.statusFieldList(attributesObj);
			if (statuses.length > 0) {
				for (let i = 0; i < statuses.length; i++)
					statuses[i] = {status: statuses[i], statusTrad: 'entity.'+entityName+'.'+statuses[i]};
				entities.push({entity: entityName, entityTrad: 'entity.'+entityName+'.label_entity', statuses: statuses});
			}
		});

		// return value example: [{
		//	 entity: 'e_test',
		//	 entityTrad: 'entity.e_test.label_entity',
		//	 statuses: [{
		//		 status: 's_status',
		//		 statusTrad: 'entity.e_test.s_status'
		//	 }]
		// }];
		return entities;
	},
	statusFieldList: (attributes) => {
		const list = [];
		for (const prop in attributes)
			if (prop.indexOf('s_') == 0)
				list.push(prop);
		return list;
	},
	translate:  function (entity, attributes, lang) {
		const self = this;
		const statusList = self.statusFieldList(attributes);

		for (let i = 0; i < statusList.length; i++) {
			const statusAlias = 'r_'+statusList[i].substring(2);
			if (!entity[statusAlias] || !entity[statusAlias].r_translations)
				continue;
			for (let j = 0; j < entity[statusAlias].r_translations.length; j++) {
				if (entity[statusAlias].r_translations[j].f_language == lang) {
					entity[statusAlias].f_name = entity[statusAlias].r_translations[j].f_value;
					break;
				}
			}
		}
	},
	setStatus: async function (entityName, entityID, statusName, statusId, user = null, comment = "") {
		const historyModel = 'E_history_' + entityName.substring(2) + '_' + statusName.substring(2);
		const statusAlias = 'r_' + statusName.substring(2);
		const userID = user ? user.id : null;

		// Fetch entity to get its current status's children and their media
		let entity = await models['E_' + entityName.substring(2)].findOne({
			where: {id: entityID},
			include: {
				model: models.E_status,
				as: statusAlias,
				include: [{
					model: models.E_status,
					as: 'r_children',
					include: [{
						model: models.E_action,
						as: 'r_actions',
						order: ["f_position", "ASC"],
						include: [{
							model: models.E_media,
							as: 'r_media',
							include: [{
								model: models.E_media_mail,
								as: 'r_media_mail'
							}, {
								model: models.E_media_notification,
								as: 'r_media_notification'
							}, {
								model: models.E_media_sms,
								as: 'r_media_sms'
							}, {
								model: models.E_media_task,
								as: 'r_media_task'
							}]
						}]
					}]
				}]
			}
		})

		const current_status = entity[statusAlias];
		if (!current_status || !current_status.r_children)
			throw new Error('Not found - Set status');

		// Check if new status is actualy the current status's children
		let nextStatus = false;
		for (let i = 0; i < current_status.r_children.length; i++) {
			if (current_status.r_children[i].id == statusId) {
				nextStatus = current_status.r_children[i];
				break;
			}
		}
		// Unauthorized
		if (nextStatus === false)
			throw new Error('component.status.error.illegal_status');

		// For each action, get the fields we need to execute the media. r_media.getFieldsToInclude() -> ['r_user.r_address.f_email', 'r_help.f_field']
		let fieldsToInclude = [];
		for (let i = 0; i < nextStatus.r_actions.length; i++)
			fieldsToInclude = fieldsToInclude.concat(nextStatus.r_actions[i].r_media.getFieldsToInclude());

		// Generate include depending on required fields of all action's media
		const include = model_builder.getIncludeFromFields(models, entityName, fieldsToInclude);
		// Get entity with elements used in media included
		entity = await models['E_' + entityName.substring(2)].findOne({
			where: {id: entityID},
			include: include
		});

		entity.entity_name = entityName;
		// Create history record for this status field
		const createObject = {
			f_comment: comment,
			fk_id_user_modified_by: userID
		};

		createObject["fk_id_status_" + nextStatus.f_field.substring(2)] = nextStatus.id;
		createObject["fk_id_" + entityName.substring(2) + "_history_" + statusName.substring(2)] = entityID;

		// Execute newStatus actions
		const history = await models[historyModel].create(createObject, {user});
		await entity['setR' + statusAlias.substring(1)](nextStatus.id, {user});
		if (userID)
			history['setR_modified_by'](userID, {user});

		return await nextStatus.executeActions(entity);
	},
	setInitialStatus: async (user, model, modelName, attributes) => {
		// Look for s_status fields
		const statusFields = [];
		for (const field in attributes)
			if (field.indexOf('s_') == 0)
				statusFields.push(field);
		if (statusFields.length == 0)
			return;
		// Special object, no status available
		if (!models['E_' + modelName.substring(2)])
			return;

		const initStatusPromise = [];
		for (let i = 0; i < statusFields.length; i++) {
			const field = statusFields[i];

			initStatusPromise.push((async (fieldIn) => {
				const historyModel = 'E_history_' + modelName.substring(2) + '_' + fieldIn.substring(2);
				const [status, created] = await models.E_status.findOrCreate({
					where: {
						f_entity: modelName.toLowerCase(),
						f_field: fieldIn,
						f_default: true
					},
					defaults: {
						f_entity: modelName.toLowerCase(),
						f_field: fieldIn,
						f_name: 'Initial',
						f_default: true,
						f_color: '#999999'
					},
					include: [{
						model: models.E_action,
						as: 'r_actions',
						include: [{
							model: models.E_media,
							as: 'r_media',
							include: [{
								model: models.E_media_mail,
								as: 'r_media_mail'
							}, {
								model: models.E_media_notification,
								as: 'r_media_notification'
							}, {
								model: models.E_media_sms,
								as: 'r_media_sms'
							}, {
								model: models.E_media_task,
								as: 'r_media_task'
							}]
						}]
					}],
					user: user
				});
				let includeArray = [];
				if (!created) {
					let fieldsToInclude = [];
					for (let i = 0; i < status.r_actions.length; i++)
						fieldsToInclude = [...fieldsToInclude, ...status.r_actions[i].r_media.getFieldsToInclude()];
					includeArray = model_builder.getIncludeFromFields(models, modelName, fieldsToInclude);
				}

				const modelWithRelations = await models['E_' + modelName.substring(2)].findOne({
					where: {id: model.id},
					include: includeArray
				});
				// Create history object with initial status related to new entity
				const historyObject = {
					version: 1,
					f_comment: '',
					fk_id_user_modified_by: user && user.id || null
				};
				historyObject["fk_id_status_" + fieldIn.substring(2)] = status.id;
				historyObject["fk_id_" + modelName.substring(2) + "_history_" + fieldIn.substring(2)] = modelWithRelations.id;

				await models[historyModel].create(historyObject, {user: false});
				await modelWithRelations['setR_' + fieldIn.substring(2)](status.id, {user: user})

				if (!created)
					try {
						await status.executeActions(modelWithRelations);
					} catch(err) {
						console.error("Unable to execute actions");
						console.error(err);
						return {level: 'error', message: 'component.status.error.action_error'};
					}
			})(field));
		}

		const results = await Promise.all(initStatusPromise);
		// Clear empty promise results
		return results.filter(toastr => !!toastr);
	}
}
