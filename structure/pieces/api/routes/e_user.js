var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

var models = require('../models/');
var attributes = require('../models/attributes/e_user');
var options = require('../models/options/e_user');
var model_builder = require('../utils/model_builder');
var enums = require('../utils/enum.js');

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

var publicAttributes = [];
for (var attribute in attributes) {
    if (attribute != 'f_password' && attribute != 'f_enabled' && attribute != 'f_token_password_reset')
        publicAttributes.push(attribute);
}

//
// FIND ALL
//
router.get('/', function(req, res) {
    var answer = {
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
    var answer = {
        error: null
    };
    var id_e_user = parseInt(req.params.id);

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
    var answer = {
        error: null
    };
    var id_e_user = req.params.id;
    var association = req.params.association;

    var include = null;
    for (var i = 0; i < options.length; i++) {
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
    var answer = {
        error: null
    };

    var publicFields = {};
    for (var field in req.body) {
        if (publicAttributes.indexOf(field) != -1)
            publicFields[field] = req.body[field];
    }
    var createObject = model_builder.buildForRoute(attributes, options, publicFields);
    createObject = enums.values("e_user", createObject, req.body)

    models.E_user.create(createObject).then(function(e_user) {
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
    var answer = {
        error: null
    };
    var id_e_user = parseInt(req.params.id);
    var publicFields = {};
    for (var field in req.body) {
        if (publicAttributes.indexOf(field) != -1)
            publicFields[field] = req.body[field];
    }
    var updateObject = model_builder.buildForRoute(attributes, options, publicFields);
    updateObject = enums.values("e_user", updateObject, req.body);

    models.E_user.findOne({where: {id: id_e_user}, attributes: publicAttributes}).then(function(e_user) {
        if (!e_user) {
            answer.error = "No e_user with ID "+id_e_user;
            return res.status(404).json(answer);
        }

        e_user.update(updateObject, {where: {id: id_e_user}}).then(function() {
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
    var answer = {
        error: null
    }
    var id_e_user = req.params.id;

    models.E_user.destroy({where: {id: id_e_user}}).then(function() {
        res.status(200).end();
    }).catch(function(err){
        answer.error = err;
        res.status(500).json(answer);
    });
});

module.exports = router;
