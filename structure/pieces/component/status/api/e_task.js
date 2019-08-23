const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');

const models = require('../models/');
const attributes = require('../models/attributes/e_task');
const options = require('../models/options/e_task');
const model_builder = require('../utils/model_builder');
const enums_radios = require('../utils/enum_radio.js');
const entity_helper = require('../utils/entity_helper');
const globalConf = require('../config/global');

router.get('/:id/downloadProgram', function(req, res) {
    models.E_task.findOne({where: {id: req.params.id}}).then(task => {
        if (!task)
            return res.sendStatus(404);
        var fileFolder = task.f_program_file.split('-')[0];
        var filePath = globalConf.localstorage+'/e_task/'+fileFolder+'/'+task.f_program_file;

        res.download(filePath);
    });
});

//
// FIND ALL
//
router.get('/', function(req, res) {
    var answer = {
        limit: parseInt(req.query.limit || 50),
        offset: parseInt(req.query.offset || 0),
        error: null
    };

    // Build include from query parameter: `?include=r_asso1,r_asso2`
    var include = [];
    if (req.query.include) {
        var queryIncludes = req.query.include.split(',');
        for (var i = 0; i < queryIncludes.length; i++)
            for (var j = 0; j < options.length; j++)
                if (queryIncludes[i] == options[j].as)
                    include.push({
                        model: models[entity_helper.capitalizeFirstLetter(options[j].target)],
                        as: options[j].as
                    });
    }
    var query = {limit: answer.limit, offset: answer.offset};
    if (include.length)
        query.include = include;

    var where = {};
    for (var field in req.query)
        if ((field.indexOf('f_') == 0 && attributes[field]) || field.indexOf('fk_id_') == 0)
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
    var answer = {
        error: null
    };
    var id_e_task = parseInt(req.params.id);

    // Build include from query parameter: `?include=r_asso1,r_asso2`
    var include = [];
    if (req.query.include) {
        var queryIncludes = req.query.include.split(',');
        for (var i = 0; i < queryIncludes.length; i++)
            for (var j = 0; j < options.length; j++)
                if (queryIncludes[i] == options[j].as)
                    include.push({
                        model: models[entity_helper.capitalizeFirstLetter(options[j].target)],
                        as: options[j].as
                    });
    }
    var query = {limit: answer.limit, offset: answer.offset};
    if (include.length)
        query.include = include;

    var where = {id: id_e_task};
    for (var field in req.query)
        if ((field.indexOf('f_') == 0 && attributes[field]) || field.indexOf('fk_id_') == 0)
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
    var answer = {
        error: null,
        limit: parseInt(req.query.limit || 50),
        offset: parseInt(req.query.offset || 0)
    };
    var id_e_task = req.params.id;
    var association = req.params.association;

    var include = null;
    for (var i = 0; i < options.length; i++) {
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

    var where = {};
    for (var field in req.query)
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
    var answer = {
        error: null
    };

    var createObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_task.create(createObject).then(function(e_task) {
        answer["e_task".substring(2)] = e_task;

        // Set associations
        var associationPromises = [];
        for (var prop in req.body)
            if (prop.indexOf('r_') == 0) {
                if (e_task['set'+entity_helper.capitalizeFirstLetter(prop)] !== 'undefined')
                    associationPromises.push(e_task['set'+entity_helper.capitalizeFirstLetter(prop)](req.body[prop]));
                else
                    console.error("API: Couldn't set association.\nAPI: e_task.set"+entity_helper.capitalizeFirstLetter(prop)+"() is undefined.");
            }

        Promise.all(associationPromises).then(function() {
            res.status(200).json(answer);
        }).catch(function(err) {
            answer.error = "Error with associations";
            res.status(500).json(answer);
        });
    }).catch(function(err){
        answer.error = err;
        res.status(500).json(answer);
    });
});

//
// UPDATE
//
router.put('/:id', function(req, res) {
    var answer = {
        error: null
    };
    var id_e_task = parseInt(req.params.id);
    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    // Fetch e_task to update
    models.E_task.findOne({where: {id: id_e_task}}).then(function(e_task) {
        if (!e_task) {
            answer.error = "No e_task with ID "+id_e_task;
            return res.status(404).json(answer);
        }

        // Update e_task
        e_task.update(updateObject, {where: {id: id_e_task}}).then(function() {
            answer["e_task".substring(2)] = e_task;

            // Set associations
            var associationPromises = [];
            for (var prop in req.body)
                if (prop.indexOf('r_') == 0) {
                    if (e_task['set'+entity_helper.capitalizeFirstLetter(prop)] !== 'undefined')
                        associationPromises.push(e_task['set'+entity_helper.capitalizeFirstLetter(prop)](req.body[prop]));
                    else
                        console.error("API: Couldn't set association.\nAPI: e_task.set"+entity_helper.capitalizeFirstLetter(prop)+"() is undefined.");
                }

            Promise.all(associationPromises).then(function() {
                res.status(200).json(answer);
            }).catch(function(err) {
                answer.error = "Error with associations";
                res.status(500).json(answer);
            });
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
    var id_e_task = req.params.id;

    models.E_task.destroy({where: {id: id_e_task}}).then(function() {
        res.status(200).end();
    }).catch(function(err){
        answer.error = err;
        res.status(500).json(answer);
    });
});

module.exports = router;
