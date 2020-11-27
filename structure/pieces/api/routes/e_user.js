const express = require('express');
const router = express.Router();

const models = require('../models/');
const attributes = require('../models/attributes/e_user');
const options = require('../models/options/e_user');
const model_builder = require('../utils/model_builder');

function capitalizeFirstLetter(word) {
	return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

const publicAttributes = [];
for (const attribute in attributes) {
	if (attribute != 'f_password' && attribute != 'f_enabled' && attribute != 'f_token_password_reset')
		publicAttributes.push(attribute);
}

//
// FIND ALL
//
router.get('/', function(req, res) {
	const answer = {
		limit: parseInt(req.query.limit || 10),
		offset: parseInt(req.query.offset || 0),
		error: null
	};

	models.E_user.findAndCountAll({
		limit: answer.limit,
		offset: answer.offset,
		attributes: publicAttributes
	}).then(function(e_users) {
		answer["e_users".substring(2)] = e_users.rows || [];
		answer.totalCount = e_users.count;

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
	const id_e_user = parseInt(req.params.id);

	models.E_user.findOne({where: {id: id_e_user}, attributes: publicAttributes}).then(function(e_user) {
		if (!e_user) {
			answer.error = "No e_user with ID "+id_e_user;
			return res.status(404).json(answer);
		}
		answer["e_user".substring(2)] = e_user;

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
		error: null
	};
	const id_e_user = req.params.id;
	const association = req.params.association;

	let include = null;
	for (let i = 0; i < options.length; i++) {
		if (options[i].as == 'r_'+association)
			include = {
				model: models[capitalizeFirstLetter(options[i].target)],
				as: options[i].as
			}
	}

	if (include == null) {
		answer.error = "No association with "+association;
		return res.status(404).json(answer);
	}

	models.E_user.findOne({
		where: {id: id_e_user},
		include: [include]
	}).then(function(e_user) {
		if (!e_user) {
			answer.error = "No e_user with ID "+id_e_user;
			return res.status(404).json(answer);
		}
		answer[association] = e_user[include.as];

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

	const publicFields = {};
	for (const field in req.body) {
		if (publicAttributes.indexOf(field) != -1)
			publicFields[field] = req.body[field];
	}
	const createObject = model_builder.buildForRoute(attributes, options, publicFields);

	models.E_user.create(createObject, {user: req.user}).then(function(e_user) {
		answer["e_user".substring(2)] = e_user;

		res.status(200).json(answer);
	}).catch(function(err){
		answer.error = err;
		res.status(200).json(answer);
	});
});

//
// UPDATE
//
router.put('/:id', function(req, res) {
	const answer = {
		error: null
	};
	const id_e_user = parseInt(req.params.id);
	const publicFields = {};
	for (const field in req.body) {
		if (publicAttributes.indexOf(field) != -1)
			publicFields[field] = req.body[field];
	}
	const updateObject = model_builder.buildForRoute(attributes, options, publicFields);
	//updateObject = enums.values("e_user", updateObject, req.body);

	models.E_user.findOne({where: {id: id_e_user}, attributes: publicAttributes}).then(function(e_user) {
		if (!e_user) {
			answer.error = "No e_user with ID "+id_e_user;
			return res.status(404).json(answer);
		}

		e_user.update(updateObject, {where: {id: id_e_user}}, {user: req.user}).then(_ => {
			answer["e_user".substring(2)] = e_user;

			res.status(200).json(answer);
		}).catch(function(err){
			answer.error = err;
			res.status(500).json(answer);
		});
	}).catch(function(err){
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
	const id_e_user = req.params.id;

	models.E_user.destroy({where: {id: id_e_user}}).then(_ => {
		res.status(200).end();
	}).catch(function(err){
		answer.error = err;
		res.status(500).json(answer);
	});
});

module.exports = router;
