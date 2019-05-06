var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filter_datatable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_media_task');
var options = require('../models/options/e_media_task');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var status_helper = require('../utils/status_helper');

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');

router.get('/entityTree', function(req, res) {
    res.json(status_helper.entityFieldTree('e_media_task'));
});

router.post('/create', block_access.actionAccessMiddleware("media", "create"), function (req, res) {
    var createObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_media_task.create(createObject).then(function (e_media_task) {
        models.E_media.create({
            f_type: 'task',
            f_name: req.body.f_name,
            f_target_entity: req.body.f_target_entity,
            fk_id_media_task: e_media_task.id
        }).then(function(e_media) {
            var redirect = '/media/show?id='+e_media.id;
            req.session.toastr = [{
                message: 'message.create.success',
                level: "success"
            }];

            if (typeof req.body.associationFlag !== 'undefined') {
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
                models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                    if (!association) {
                        e_media.destroy();
                        var err = new Error();
                        err.message = "Association not found."
                        return entity_helper.error(err, req, res, "/");
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined')
                        association['add' + modelName](e_media.id);
                    else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = e_media.id;
                        association.update(obj);
                    }
                });
            }

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_media, req.body, createObject, options);

            res.redirect(redirect);
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/media_task/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("media", 'update'), function (req, res) {
    var id_e_media_task = req.query.id;
    var data = {
        menu: "e_media",
        sub_menu: "list_e_media",
        enum_radio: enums_radios.translated("e_media_task", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    models.E_media_task.findOne({where: {id: id_e_media_task}, include: [{all: true}]}).then(function (e_media_task) {
        if (!e_media_task) {
            data.error = 404;
            return res.render('common/error', data);
        }

        data.e_media_task = e_media_task;
        res.render('e_media/update', data);
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("media", 'update'), function (req, res) {
    var id_e_media_task = parseInt(req.body.id_media_task);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_media_task.findOne({where: {id: id_e_media_task}}).then(function (e_media_task) {
        if (!e_media_task) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_media_task.update(updateObject, {where: {id: id_e_media_task}}).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_media_task, req.body, updateObject, options);

            models.E_media.findOne({where: {fk_id_media_task: e_media_task.id}}).then(function(e_media) {
                var redirect = '/media/show?id=' + e_media.id;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                        message: 'message.update.success',
                        level: "success"
                    }];

                res.redirect(redirect);
            })
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/media_task/update_form?id=' + id_e_media_task);
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/media_task/update_form?id=' + id_e_media_task);
    });
});

router.get('/set_status/:id_media_task/:status/:id_new_status', block_access.actionAccessMiddleware("media", "create"), function(req, res) {
    var historyModel = 'E_history_e_media_task_'+req.params.status;
    var historyAlias = 'r_history_'+req.params.status.substring(2);
    var statusAlias = 'r_'+req.params.status.substring(2);

    var errorRedirect = '/media_task/show?id='+req.params.id_media_task;
    // Find target entity instance
    models.E_media_task.findOne({
        where: {id: req.params.id_media_task},
        include: [{
            model: models[historyModel],
            as: historyAlias,
            limit: 1,
            order: [["createdAt", "DESC"]],
            include: [{
                model: models.E_status,
                as: statusAlias
            }]
        }]
    }).then(function(e_media_task) {
        if (!e_media_task || !e_media_task[historyAlias] || !e_media_task[historyAlias][0][statusAlias]){
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {id: e_media_task[historyAlias][0][statusAlias].id},
            include: [{
                model: models.E_status,
                as: 'r_children'
            }]
        }).then(function(current_status) {
            if (!current_status || !current_status.r_children){
                logger.debug("Not found - Set status");
                return res.render('common/error', {error: 404});
            }

            // Check if new status is actualy the current status's children
            var children = current_status.r_children;
            var validNext = false;
            for (var i = 0; i < children.length; i++) {
                if (children[i].id == req.params.id_new_status)
                    {validNext = true; break;}
            }
            // Unautorized
            if (!validNext){
                req.session.toastr = [{
                    level: 'error',
                    message: 'component.status.error.illegal_status'
                }]
                return res.redirect(errorRedirect);
            }

            // Create history record for this status field
            // Beeing the most recent history for media_task it will now be its current status
            var createObject = {fk_id_status_status: req.params.id_new_status};
            createObject["fk_id_media_task_history_"+req.params.status.substring(2)] = req.params.id_media_task;
            models[historyModel].create(createObject).then(function() {
                res.redirect('/media_task/show?id='+req.params.id_media_task)
            }).catch(function(err) {
                entity_helper.error(err, req, res, errorRedirect);
            });
        });
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("media", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_media_task.findOne({where: {id: idEntity}}).then(function (e_media_task) {
        if (!e_media_task) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_media_task['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            var toKeep = [];
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove)
                    aliasEntities.splice(i, 1);
                else
                    toKeep.push(aliasEntities[i].id);

            // Set back associations without removed entity
            e_media_task['set' + entity_helper.capitalizeFirstLetter(alias)](toKeep).then(function () {
                res.sendStatus(200).end();
            });
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("media", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_media_task.findOne({where: {id: idEntity}}).then(function (e_media_task) {
        if (!e_media_task) {
            var data = {error: 404};
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        var toAdd;
        if (typeof (toAdd = req.body.ids) === 'undefined') {
            req.session.toastr.push({
                message: 'message.create.failure',
                level: "error"
            });
            return res.redirect('/media_task/show?id=' + idEntity + "#" + alias);
        }

        e_media_task['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/media_task/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("media", "delete"), function (req, res) {
    var id_e_media_task = parseInt(req.body.id);

    models.E_media_task.findOne({where: {id: id_e_media_task}}).then(function (deleteObject) {
         if (!deleteObject) {
            req.session.toastr = [{level: 'error', message: 'error.404.title'}];
            return res.redirect('/media/list');
        }
        deleteObject.destroy().then(() => {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/media_task/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.removeFiles("e_media_task", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/media_task/list');
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/media_task/list');
    });
});

module.exports = router;