const express = require('express');
const router = express.Router();
const models = require('../models/');
const attributes = require('../models/attributes/e_task');
const options = require('../models/options/e_task');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../utils/entity_helper');
const status_helper = require('../utils/status_helper');
const globalConf = require('../config/global');
const multer = require('multer');
const upload = multer().single('file');
const moment = require('moment');
const fs = require('fs-extra');

router.get('/:id/downloadProgram', function(req, res) {
	models.E_task.findOne({
		where: {id: req.params.id},
		include: {
			model: models.E_process,
			as: 'r_process',
			include: {
				model: models.E_program,
				as: 'r_program'
			}
		}
	}).then(task => {
		if (!task || !task.r_process || !task.r_process.r_program || !task.r_process.r_program.f_program_file)
			return res.sendStatus(404);
		const fileField = task.r_process.r_program.f_program_file;
		const fileFolder = fileField.split('-')[0];
		const filePath = globalConf.localstorage+'/e_program/'+fileFolder+'/'+fileField;

		res.download(filePath);
	});
});

router.post('/:id/error_file', function(req, res) {
	upload(req, res, error => {
		if (error) {
			console.error(error);
			return res.status(500).end(error);
		}
		if (!req.file) {
			console.error("No file found in request");
			return res.status(500).end("No file found in request");
		}

		const id_task = req.params.id;
		const folderName = moment().format('YYYYMMDD');
		const fileName = `${folderName}-${moment().format('hhmmss')}_${req.file.originalname}`;
		const basePath = `${globalConf.localstorage}/e_documents_task/${folderName}/`;
		fs.mkdirs(basePath, err => {
			if (err) {
				console.error(err);
				return res.status(500).end(error);
			}
			const outStream = fs.createWriteStream(basePath+fileName);
			outStream.write(req.file.buffer);
			outStream.end();
			outStream.on('finish', err => {
				if (err) {
					console.error("Couldn't create task's error file");
					console.error(err);
					return res.status(500).end();
				}
				models.E_documents_task.create({
					f_name: req.file.originalname,
					f_filename: fileName,
					fk_id_task: id_task
				}, {user: req.user}).then(_ => {
					console.log("Task's error file created");
					res.end();
				}).catch(err => {
					console.error("Couldn't create Documents task DB row");
					console.error(err);
					res.status(500).end();
				});
			});
		});
	});
});

//
// FIND ALL
//
router.get('/', function(req, res) {
	const answer = {
		limit: parseInt(req.query.limit || 50),
		offset: parseInt(req.query.offset || 0),
		error: null
	};

	// Build include from query parameter: `?include=r_asso1,r_asso2`
	const include = [];
	if (req.query.include) {
		const queryIncludes = req.query.include.split(',');
		for (let i = 0; i < queryIncludes.length; i++)
			for (let j = 0; j < options.length; j++)
				if (queryIncludes[i] == options[j].as)
					include.push({
						model: models[entity_helper.capitalizeFirstLetter(options[j].target)],
						as: options[j].as
					});
	}
	const query = {limit: answer.limit, offset: answer.offset};
	if (include.length)
		query.include = include;

	const where = {};
	for (const field in req.query)
		if (field.indexOf('fk_id_') == 0 || field.indexOf('f_') == 0 && attributes[field])
			where[field] = req.query[field];
	if (Object.keys(where).length)
		query.where = where;

	models.E_task.findAndCountAll(query).then(function(e_tasks) {
		answer["e_tasks".substring(2)] = e_tasks.rows || [];
		answer.totalCount = e_tasks.count;
		answer.rowsCount = answer["e_tasks".substring(2)].length;

		res.status(200).json(answer);
	}).catch(function(err) {
		answer.error = err;
		res.status(500).json(answer);
	});
});

//
// FIND ONE
//
router.get('/:id', function(req, res) {
	const answer = {
		error: null
	};
	const id_e_task = parseInt(req.params.id);

	// Build include from query parameter: `?include=r_asso1,r_asso2`
	const include = [];
	if (req.query.include) {
		const queryIncludes = req.query.include.split(',');
		for (let i = 0; i < queryIncludes.length; i++)
			for (let j = 0; j < options.length; j++)
				if (queryIncludes[i] == options[j].as)
					include.push({
						model: models[entity_helper.capitalizeFirstLetter(options[j].target)],
						as: options[j].as
					});
	}
	const query = {limit: answer.limit, offset: answer.offset};
	if (include.length)
		query.include = include;

	const where = {id: id_e_task};
	for (const field in req.query)
		if (field.indexOf('fk_id_') == 0 || field.indexOf('f_') == 0 && attributes[field])
			where[field] = req.query[field];
	query.where = where;

	models.E_task.findOne(query).then(function(e_task) {
		if (!e_task) {
			answer.error = "No e_task with ID "+id_e_task;
			return res.status(404).json(answer);
		}
		answer["e_task".substring(2)] = e_task;

		res.status(200).json(answer);
	}).catch(function(err){
		answer.error = err;
		res.status(500).json(answer);
	});
});

//
// FIND ASSOCIATION
//
router.get('/:id/:association', function(req, res) {
	const answer = {
		error: null,
		limit: parseInt(req.query.limit || 50),
		offset: parseInt(req.query.offset || 0)
	};
	const id_e_task = req.params.id;
	const association = req.params.association;

	let include = null;
	for (let i = 0; i < options.length; i++) {
		if (options[i].as == 'r_' + association) {
			if (options[i].relation.toLowerCase().indexOf('many') != -1) {
				include = {
					model: models[entity_helper.capitalizeFirstLetter(options[i].target)],
					as: options[i].as
				};
				delete answer.limit;
				delete answer.offset;
			}
			else
				include = {
					model: models[entity_helper.capitalizeFirstLetter(options[i].target)],
					as: options[i].as,
					limit: answer.limit,
					offset: answer.offset
				}
			break;
		}
	}

	if (include == null) {
		answer.error = "No association with "+association;
		return res.status(404).json(answer);
	}

	const where = {};
	for (const field in req.query)
		if (field.indexOf('f_') == 0)
			where[field] = req.query[field];
	if (Object.keys(where).length)
		include.where = where;

	models.E_task.findOne({
		where: {id: id_e_task},
		include: include
	}).then(function(e_task) {
		if (!e_task) {
			answer.error = "No e_task with ID "+id_e_task;
			return res.status(404).json(answer);
		}
		answer[association] = e_task[include.as];

		res.status(200).json(answer);
	}).catch(function(err){
		answer.error = err;
		res.status(500).json(answer);
	});
});

//
// CREATE
//
router.post('/', function(req, res) {
	const answer = {
		error: null
	};

	const createObject = model_builder.buildForRoute(attributes, options, req.body);

	models.E_task.create(createObject, {user: req.user}).then(function(e_task) {
		answer["e_task".substring(2)] = e_task;

		// Set associations
		const associationPromises = [];
		for (const prop in req.body)
			if (prop.indexOf('r_') == 0) {
				if (e_task['set'+entity_helper.capitalizeFirstLetter(prop)] !== 'undefined')
					associationPromises.push(e_task['set'+entity_helper.capitalizeFirstLetter(prop)](req.body[prop]));
				else
					console.error("API: Couldn't set association.\nAPI: e_task.set"+entity_helper.capitalizeFirstLetter(prop)+"() is undefined.");
			}

		Promise.all(associationPromises).then(function() {
			res.status(200).json(answer);
		}).catch(err => {
			console.error(err);
			answer.error = "Error with associations";
			res.status(500).json(answer);
		});
	}).catch(err => {
		console.error(err);
		answer.error = err;
		res.status(500).json(answer);
	});
});

//
// UPDATE
//
router.put('/:id', function(req, res) {
	const answer = {
		error: null
	};
	const id_e_task = parseInt(req.params.id);
	const updateObject = model_builder.buildForRoute(attributes, options, req.body);

	// Fetch e_task to update
	models.E_task.findOne({where: {id: id_e_task}}).then(function(e_task) {
		if (!e_task) {
			answer.error = "No e_task with ID "+id_e_task;
			return res.status(404).json(answer);
		}

		const statusPromise = [];
		if (req.body.r_state) {
			statusPromise.push(status_helper.setStatus('e_task', id_e_task, 's_state', req.body.r_state, req.user));
			delete req.body.r_state;
			delete updateObject.r_state;
		}

		Promise.all(statusPromise).then(_ => {
			// Update e_task
			e_task.update(updateObject, {where: {id: id_e_task}}, {user: req.user}).then(function() {
				answer["e_task".substring(2)] = e_task;

				// Set associations
				const associationPromises = [];
				for (const prop in req.body)
					if (prop.indexOf('r_') == 0) {
						if (e_task['set'+entity_helper.capitalizeFirstLetter(prop)] !== 'undefined')
							associationPromises.push(e_task['set'+entity_helper.capitalizeFirstLetter(prop)](req.body[prop]));
						else
							console.error("API: Couldn't set association.\nAPI: e_task.set"+entity_helper.capitalizeFirstLetter(prop)+"() is undefined.");
					}

				Promise.all(associationPromises).then(function() {
					res.status(200).json(answer);
				}).catch(err => {
					console.error(err);
					answer.error = "Error with associations";
					res.status(500).json(answer);
				});
			}).catch(err =>{
				console.error(err);
				answer.error = err;
				res.status(500).json(answer);
			});
		});
	}).catch(err =>{
		console.error(err);
		answer.error = err;
		res.status(500).json(answer);
	});
});

//
// DELETE
//
router.delete('/:id', function(req, res) {
	const answer = {
		error: null
	}
	const id_e_task = req.params.id;

	models.E_task.destroy({where: {id: id_e_task}}).then(function() {
		res.status(200).end();
	}).catch(function(err){
		answer.error = err;
		res.status(500).json(answer);
	});
});

module.exports = router;
