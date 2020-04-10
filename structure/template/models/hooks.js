const fs = require('fs-extra');
const globalConf = require('../config/global');
const ignoreList = globalConf.synchronization.ignore_list;

/* eslint-disable */
function getModels() {
	if (!this.models)
		this.models = require('./');
	return this.models;
}
/* eslint-enable */

function writeJournalLine(line) {
	let journalData;
	try {
		journalData = JSON.parse(fs.readFileSync(__dirname + '/../sync/journal.json', 'utf8'));
	} catch(e) {
		journalData = {"transactions":[]};
	}
	journalData.transactions.push(line);
	fs.writeFileSync(__dirname + '/../sync/journal.json', JSON.stringify(journalData, null, 4), 'utf8');
}

module.exports = function(model_name) {
	return {
		// CREATE HOOKS
		beforeCreate: [{
			// Hook is expecting a user to set createdBy
			// If user is false, warning is disabled
			name: 'insertCreatedBy',
			func: (model, args) => new Promise(resolve => {
				try {
					// No user
					if(args.user === undefined)
						throw 'No user provided for createdBy on table -> ' + model.constructor.tableName;

					// Disabled
					if (args.user === false)
						return resolve();

					// No login
					if (!args.user.f_login)
						throw 'Couldn\'t get user login for createdBy on table -> ' + model.constructor.tableName;

					model.createdBy = args.user.f_login;
				} catch (errMsg) {
					console.log('WARN '+errMsg);
				}
				resolve();
			})
		}],
		afterCreate: [{
			name: 'synchroJournalCreate',
			func: function(model) {
				if (globalConf.env != "tablet" || ignoreList.indexOf(model_name) != -1)
					return;
				const line = model.dataValues;
				line.verb = 'create';
				line.createdAt = new Date();
				line.updatedAt = new Date();
				line.entityTable = model._modelOptions.tableName;
				line.entityName = model_name.toLowerCase();
				writeJournalLine(line);
			}
		}],
		// UPDATE HOOKS
		beforeUpdate: [{
			// Hook is expecting a user to set updatedBy
			// If user is false, warning is disabled
			name: 'insertUpdatedBy',
			func: (model, args) => new Promise(resolve => {
				try {
					// No user
					if(args.user === undefined)
						throw 'No user provided for updatedBy on table -> ' + model.constructor.tableName;

					// Disabled
					if (args.user === false)
						return resolve();

					// No login
					if (!args.user.f_login)
						throw 'Couldn\'t get user login for updatedBy on table -> ' + model.constructor.tableName;

					model.updatedBy = args.user.f_login;
				} catch (errMsg) {
					console.log('WARN '+errMsg);
				}
				resolve();
			})
		}],
		afterUpdate: [{
			name: 'synchroJournalUpdate',
			func: function(model) {
				if (globalConf.env != "tablet" || ignoreList.indexOf(model_name) != -1)
					return;
				const line = model.dataValues;
				line.verb = 'update';
				line.updatedAt = new Date();
				line.entityTable = model._modelOptions.tableName;
				line.entityName = model_name.toLowerCase();
				writeJournalLine(line);
			}
		}],
		// DELETE HOOKS
		afterDestroy: [{
			name: 'synchroJournalDelete',
			func: function(model) {
				if (globalConf.env != "tablet" || ignoreList.indexOf(model_name) != -1)
					return;
				const line = model.dataValues;
				line.verb = 'delete';
				line.entityTable = model._modelOptions.tableName;
				line.entityName = model_name.toLowerCase();
				writeJournalLine(line);
			}
		}]
	}
}