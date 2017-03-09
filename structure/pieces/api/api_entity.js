var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

var models = require('../models/');
var attributes = require('../models/attributes/ENTITY_NAME');
var options = require('../models/options/ENTITY_NAME');
var model_builder = require('../utils/model_builder');
var enums = require('../utils/enum.js');

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
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

    models.MODEL_NAME.findAndCountAll({limit: answer.limit, offset: answer.offset}).then(function(ENTITY_NAMEs) {
        answer["ENTITY_NAMEs".substring(2)] = ENTITY_NAMEs.rows || [];
        answer.totalCount = ENTITY_NAMEs.count;
        answer.rowsCount = answer["ENTITY_NAMEs".substring(2)].length;

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
    var id_ENTITY_NAME = parseInt(req.params.id);

    models.MODEL_NAME.findById(id_ENTITY_NAME).then(function(ENTITY_NAME) {
        if (!ENTITY_NAME) {
            answer.error = "No ENTITY_NAME with ID "+id_ENTITY_NAME;
            return res.status(404).json(answer);
        }
        answer["ENTITY_NAME".substring(2)] = ENTITY_NAME;

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
        error: null,
        limit: parseInt(req.query.limit),
        offset: parseInt(req.query.offset)
    };
    var id_ENTITY_NAME = req.params.id;
    var association = req.params.association;

    var include = null;
    for (var i = 0; i < options.length; i++) {
        if (options[i].as == 'r_'+association) {
            include = {
                model: models[capitalizeFirstLetter(options[i].target)],
                as: options[i].as,
                limit: answer.limit,
                offset: answer.offset
            };
            break;
        }
    }

    if (include == null) {
        answer.error = "No association with "+association;
        return res.status(404).json(answer);
    }

    models.MODEL_NAME.findOne({
        where: {id: id_ENTITY_NAME},
        include: [include]
    }).then(function(ENTITY_NAME) {
        if (!ENTITY_NAME) {
            answer.error = "No ENTITY_NAME with ID "+id_ENTITY_NAME;
            return res.status(404).json(answer);
        }
        answer[association] = ENTITY_NAME[include.as];

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

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    createObject = enums.values("ENTITY_NAME", createObject, req.body)

    models.MODEL_NAME.create(createObject).then(function(ENTITY_NAME) {
        answer["ENTITY_NAME".substring(2)] = ENTITY_NAME;

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
    var id_ENTITY_NAME = parseInt(req.params.id);
    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    updateObject = enums.values("ENTITY_NAME", updateObject, req.body);

    models.MODEL_NAME.findOne({where: {id: id_ENTITY_NAME}}).then(function(ENTITY_NAME) {
        if (!ENTITY_NAME) {
            answer.error = "No ENTITY_NAME with ID "+id_ENTITY_NAME;
            return res.status(404).json(answer);
        }

        ENTITY_NAME.update(updateObject, {where: {id: id_ENTITY_NAME}}).then(function() {
            answer["ENTITY_NAME".substring(2)] = ENTITY_NAME;

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
    var id_ENTITY_NAME = req.params.id;

    models.MODEL_NAME.destroy({where: {id: id_ENTITY_NAME}}).then(function() {
        res.status(200).end();
    }).catch(function(err){
        answer.error = err;
        res.status(500).json(answer);
    });
});

module.exports = router;
