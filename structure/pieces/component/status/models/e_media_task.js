const builder = require('../utils/model_builder');
const fs = require('fs-extra');

const attributes_origin = require("./attributes/e_media_task.json");
const associations = require("./options/e_media_task.json");
const globalConf = require('../config/global');
const moment = require('moment');
let models;

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes);
	const options = {
		tableName: 'e_media_task',
		timestamps: true
	};

	const Model = sequelize.define('E_media_task', attributes, options);
	Model.associate = builder.buildAssociation('E_media_task', associations);
	builder.addHooks(Model, 'e_media_task', attributes_origin);

	// Return an array of all the field that need to be replaced by values. Array used to include what's needed for media execution
	//	  Ex: ['r_project.r_ticket.f_name', 'r_user.r_children.r_parent.f_name', 'r_user.r_children.r_grandparent']
	Model.prototype.parseForInclude = function() {
		const fieldsToParse = ['f_task_name'];
		const valuesForInclude = [];
		for (let i = 0; i < fieldsToParse.length; i++) {
			let regex = new RegExp(/{field\|([^}]*)}/g), matches = null;
			while ((matches = regex.exec(this[fieldsToParse[i]])) != null)
				valuesForInclude.push(matches[1]);
		}
		return valuesForInclude;
	}

	Model.prototype.execute = function(resolve, reject, dataInstance) {
		const self = this;
		if (!models)
			models = require('./index');

		function insertVariablesValue(property) {
			function diveData(object, depths, idx) {
				if (!object[depths[idx]])
					return "";
				else if (typeof object[depths[idx]] === 'object') {
					if (object[depths[idx]] instanceof Date)
						return moment(object[depths[idx]]).format("DD/MM/YYYY");
					// Case where targeted field is in an array.
					// Ex: r_projet.r_participants.f_name <- Loop through r_participants and join all f_name
					else if (object[depths[idx]] instanceof Array && depths.length-2 == idx) {
						const values = [];
						for (let i = 0; i < object[depths[idx]].length; i++)
							if (typeof object[depths[idx]][i][depths[idx+1]] !== 'undefined')
								values.push(object[depths[idx]][i][depths[idx+1]]);
						return values.join(' ');
					}
					return diveData(object[depths[idx]], depths, ++idx);
				} return object[depths[idx]];
			}

			let newString = self[property];
			const regex = new RegExp(/{field\|([^}]*)}/g),
				matches = null;
			while ((matches = regex.exec(self[property])) != null)
				newString = newString.replace(matches[0], diveData(dataInstance, matches[1].split('.'), 0));

			return newString || "";
		}

		function duplicateFile(originFileName) {
			return new Promise((fileResolve, fileReject) => {
				if (!originFileName || originFileName == '')
					return fileResolve(null);
				try {
					const originFolder = originFileName.split('-')[0];
					const originPath = globalConf.localstorage+'e_media_task/'+originFolder;

					let duplicateFolder = moment().format("YYYYMMDD-HHmmssSSS");
					const duplicateFileName = duplicateFolder+'_'+originFileName.substring(16);
					duplicateFolder = duplicateFolder.split('-')[0];
					const duplicatePath = globalConf.localstorage+'e_task/'+duplicateFolder;
					fs.mkdirs(duplicatePath, err => {
						if (err)
							return fileReject(err);

						fs.copySync(originPath+'/'+originFileName, duplicatePath+'/'+duplicateFileName);
						fileResolve(duplicateFileName);
					});
				} catch(err) {
					fileReject(err);
				}
			});
		}

		duplicateFile(self.f_program_file).then(program_file => {
			models.E_task.create({
				f_title: insertVariablesValue('f_task_name'),
				f_type: self.f_task_type,
				f_data_flow: insertVariablesValue('f_data_flow'),
				f_program_file: program_file
			}).then(_ => {
				resolve();
			}).catch(reject);
		});
	}
	return Model;
};