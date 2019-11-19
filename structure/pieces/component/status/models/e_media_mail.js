const builder = require('../utils/model_builder');
const mailer = require('../utils/mailer.js');
const moment = require('moment');
const globalConf = require('../config/global');
const attributes_origin = require("./attributes/e_media_mail.json");
const associations = require("./options/e_media_mail.json");
const INSERT_USER_GROUP_FIELDS = ['f_from', 'f_to', 'f_cc', 'f_cci', 'f_attachments'];

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes);
	const options = {
		tableName: 'e_media_mail',
		timestamps: true
	};

	const Model = sequelize.define('E_media_mail', attributes, options);

	Model.associate = builder.buildAssociation('E_media_mail', associations);
	builder.addHooks(Model, 'e_media_mail', attributes_origin);

	// Return an array of all the field that need to be replaced by values. Array used to include what's needed for media execution
	//	  Ex: ['r_project.r_ticket.f_name', 'r_user.r_children.r_parent.f_name', 'r_user.r_children.r_grandparent']
	Model.prototype.parseForInclude = function() {
		const fieldsToParse = ['f_from', 'f_to', 'f_cc', 'f_cci', 'f_subject', 'f_content', 'f_attachments'];
		const valuesForInclude = [];
		for (let i = 0; i < fieldsToParse.length; i++) {
			const regex = new RegExp(/{field\|([^}]*)}/g);let matches = null;
			while ((matches = regex.exec(this[fieldsToParse[i]])) != null)
				valuesForInclude.push(matches[1]);
		}
		return valuesForInclude;
	}

	Model.prototype.execute = function(resolve, reject, dataInstance) {
		const self = this;

		async function insertGroupAndUserEmail() {
			for (let fieldIdx = 0; fieldIdx < INSERT_USER_GROUP_FIELDS.length; fieldIdx++) {
				const property = INSERT_USER_GROUP_FIELDS[fieldIdx];
				const groupIds = [],
					userIds = [],
					userMails = [],
					intermediateData = {};

				// FETCH GROUP EMAIL
				{
					// Exctract all group IDs from property to find them all at once
					const groupRegex = new RegExp(/{(group\|[^}]*)}/g);let match = null;
					while ((match = groupRegex.exec(self[property])) != null) {
						const placeholderParts = match[1].split('|');
						const groupId = parseInt(placeholderParts[placeholderParts.length-1]);
						intermediateData['group'+groupId] = {placeholder: match[0], emails: []};
						groupIds.push(groupId);
					}

					// Fetch all groups found and their users
					/* eslint-disable */
					const groups = await sequelize.models.E_group.findAll({
						where: {id: {[models.$in]: groupIds}},
						include: {model: sequelize.models.E_user, as: 'r_user'}
					});
					/* eslint-enable */

					// Exctract email and build intermediateData object used to replace placeholders
					for (let i = 0; i < groups.length; i++) {
						const intermediateKey = 'group'+groups[i].id;
						for (let j = 0; j < groups[i].r_user.length; j++)
							if (groups[i].r_user[j].f_email && groups[i].r_user[j].f_email != '') {
								intermediateData[intermediateKey].emails.push(groups[i].r_user[j].f_email);
								userMails.push(groups[i].r_user[j].f_email);
							}
					}
				}

				// FETCH USER EMAIL
				{
					// Exctract all user IDs from property to find them all at once
					const userRegex = new RegExp(/{(user\|[^}]*)}/g);let match = null;
					while ((match = userRegex.exec(self[property])) != null) {
						const placeholderParts = match[1].split('|');
						const userId = parseInt(placeholderParts[placeholderParts.length-1]);
						intermediateData['user'+userId] = {placeholder: match[0], emails: []};
						userIds.push(userId);
					}

					// Fetch all users found
					/* eslint-disable */
					const users = await sequelize.models.E_user.findAll({
						where: {id: {[models.$in]: userIds}}
					});
					/* eslint-enable */

					// Exctract email and build intermediateData object used to replace placeholders
					for (let i = 0; i < users.length; i++) {
						const intermediateKey = 'user'+users[i].id;
						if (users[i].f_email && users[i].f_email != '') {
							intermediateData[intermediateKey].emails.push(users[i].f_email);
							userMails.push(users[i].f_email);
						}
					}
				}

				// Replace each occurence of {group|label|id} and {user|label|id} placeholders by their built emails list
				for (const prop in intermediateData) {
					// Escape placeholder and use it as a regex key to execute the replace on self[property]
					const regKey = intermediateData[prop].placeholder.replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&')
					// Replace globaly
					const reg = new RegExp(regKey, 'g');
					self[property] = self[property].replace(reg, intermediateData[prop].emails.join(', '));
				}
			}
		}

		function getFilePath(filename){
			const entity = dataInstance.entity_name;
			const folderName = filename.split("-")[0];
			const filePath = globalConf.localstorage + entity + '/' + folderName + '/' + filename;
			return filePath;
		}

		function insertVariablesValue(property) {
			// Recursive function to dive into relations object until matching field or nothing is found
			function diveData(object, depths, idx) {
				if (!object[depths[idx]])
					return "";
				else if (typeof object[depths[idx]] === 'object') {
					if (object[depths[idx]] instanceof Date)
						return moment(object[depths[idx]]).format("DD/MM/YYYY");

					// Case where targeted field is in an array.
					// Ex: r_projet.r_participants.f_email <- Loop through r_participants and join all f_email
					else if (object[depths[idx]] instanceof Array && depths.length-2 == idx) {
						const values = [];
						for (let i = 0; i < object[depths[idx]].length; i++)
							if (typeof object[depths[idx]][i][depths[idx+1]] !== 'undefined')
								values.push(object[depths[idx]][i][depths[idx+1]]);
						return values.join(', ');
					}
					return diveData(object[depths[idx]], depths, ++idx);
				}
				return object[depths[idx]];
			}

			let newString = self[property];
			const regex = new RegExp(/{field\|([^}]*)}/g);
			let matches = null;

			// Need an array for attachments, not a string
			if(property == 'f_attachments'){
				newString = [];
				while ((matches = regex.exec(self[property])) != null)
					newString.push({
						filename: diveData(dataInstance, matches[1].split('.'), 0),
						path: getFilePath(diveData(dataInstance, matches[1].split('.'), 0))
					});
				self[property] = newString || [];
			}

			else{
				while ((matches = regex.exec(self[property])) != null)
					newString = newString.replace(matches[0], diveData(dataInstance, matches[1].split('.'), 0));
				self[property] = newString || "";
			}

			return self[property];
		}

		// Replace {group|id} and {user|id} placeholders before inserting variables
		// to avoid trying to replace placeholders as entity's fields
		insertGroupAndUserEmail().then(_ => {
			// Build mail options and replace entity's fields
			const options = {
				from: insertVariablesValue('f_from'),
				to: insertVariablesValue('f_to'),
				cc: insertVariablesValue('f_cc'),
				cci: insertVariablesValue('f_cci'),
				subject: insertVariablesValue('f_subject'),
				data: dataInstance
			};

			const attachmentsFile = insertVariablesValue('f_attachments');

			// Send mail
			mailer.sendHtml(insertVariablesValue('f_content'), options, attachmentsFile).then(resolve).catch(reject);
		});
	};

	return Model;
};