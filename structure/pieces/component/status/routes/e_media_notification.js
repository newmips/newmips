var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filter_datatable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_media_notification');
var options = require('../models/options/e_media_notification');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var globalConfig = require('../config/global');

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');


router.post('/create', block_access.actionAccessMiddleware("media", "create"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_media_notification.create(createObject).then(function (e_media_notification) {
        models.E_media.create({
            f_type: 'notification',
            f_name: req.body.f_name,
            f_target_entity: req.body.f_target_entity,
            fk_id_media_notification: e_media_notification.id
        }).then(function(e_media) {

            var redirect = '/media/show?id='+e_media.id;
            req.session.toastr = [{
                message: 'message.create.success',
                level: "success"
            }];

            var promises = [];

            if (typeof req.body.associationFlag !== 'undefined') {
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
                promises.push(new Promise(function(resolve, reject) {
                    models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                        if (!association) {
                            e_media_notification.destroy();
                            var err = new Error();
                            err.message = "Association not found.";
                            reject(err);
                        }

                        var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                        if (typeof association['add' + modelName] !== 'undefined'){
                            association['add' + modelName](e_media_notification.id).then(resolve).catch(function(err){
                                reject(err);
                            });
                        } else {
                            var obj = {};
                            obj[req.body.associationForeignKey] = e_media_notification.id;
                            association.update(obj).then(resolve).catch(function(err){
                                reject(err);
                            });
                        }
                    });
                }));
            }

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_media_notification, req.body, createObject, options).then(function(){
                Promise.all(promises).then(function() {
                    res.redirect(redirect);
                }).catch(function(err){
                    entity_helper.error(err, req, res, '/media/create_form');
                });
            });
        })
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/media/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("media", 'update'), function (req, res) {
    var id_e_media_notification = req.query.id;
    var data = {
        menu: "e_media",
        sub_menu: "list_e_media",
        enum_radio: enums_radios.translated("e_media_notification", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    models.E_media_notification.findOne({where: {id: id_e_media_notification}, include: [{all: true}]}).then(function (e_media_notification) {
        if (!e_media_notification) {
            data.error = 404;
            return res.render('common/error', data);
        }

        data.e_media_notification = e_media_notification;
        res.render('e_media/update', data);
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("media", 'update'), function (req, res) {
    var id_e_media_notification = parseInt(req.body.id_media_notification);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_media_notification.findOne({where: {id: id_e_media_notification}}).then(function (e_media_notification) {
        if (!e_media_notification) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_media_notification.update(updateObject).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_media_notification, req.body, updateObject, options).then(function () {

                var redirect = '/media/show?id=' + req.body.id;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

                res.redirect(redirect);
            });
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/media/update_form?id=' + id_e_media_notification);
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/media/update_form?id=' + id_e_media_notification);
    });
});

router.get('/set_status/:id_media_notification/:status/:id_new_status', block_access.actionAccessMiddleware("media_notification", "create"), function(req, res) {
    var historyModel = 'E_history_e_media_notification_'+req.params.status;
    var historyAlias = 'r_history_'+req.params.status.substring(2);
    var statusAlias = 'r_'+req.params.status.substring(2);

    var errorRedirect = '/media_notification/show?id='+req.params.id_media_notification;
    // Find target entity instance
    models.E_media_notification.findOne({
        where: {id: req.params.id_media_notification},
        include: [{
            model: models[historyModel],
            as: historyAlias,
            limit: 1,
            order: [["createdAt", "DESC"]],
            include: [{
                model: models.E_status,
                as: statusAlias
            }]
        }, {
            // Include all associations that can later be used by media to include variables value
            all: true, nested: true
        }]
    }).then(function(e_media_notification) {
        if (!e_media_notification || !e_media_notification[historyAlias] || !e_media_notification[historyAlias][0][statusAlias]){
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {id: e_media_notification[historyAlias][0][statusAlias].id},
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
                        include: [{all: true}]
                    }]
                }]
            }]
        }).then(function(current_status) {
            if (!current_status || !current_status.r_children){
                logger.debug("Not found - Set status");
                return res.render('common/error', {error: 404});
            }

            // Check if new status is actualy the current status's children
            var children = current_status.r_children;
            var nextStatus = false;
            for (var i = 0; i < children.length; i++) {
                if (children[i].id == req.params.id_new_status)
                    {nextStatus = children[i]; break;}
            }
            // Unautorized
            if (nextStatus === false){
                req.session.toastr = [{
                    level: 'error',
                    message: 'component.status.error.illegal_status'
                }]
                return res.redirect(errorRedirect);
            }

            // Execute newStatus actions
            nextStatus.executeActions(e_media_notification);

            // Create history record for this status field
            // Beeing the most recent history for media_notification it will now be its current status
            var createObject = {}
            createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
            createObject["fk_id_media_notification_history_"+req.params.status.substring(2)] = req.params.id_media_notification;
            models[historyModel].create(createObject).then(function() {
                e_media_notification['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                res.redirect('/media_notification/show?id='+req.params.id_media_notification)
            }).catch(function(err) {
                entity_helper.error(err, req, res, errorRedirect);
            });
        });
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("media_notification", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_media_notification.findOne({where: {id: idEntity}}).then(function (e_media_notification) {
        if (!e_media_notification) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_media_notification['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_media_notification['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            });
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("media_notification", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_media_notification.findOne({where: {id: idEntity}}).then(function (e_media_notification) {
        if (!e_media_notification) {
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
            return res.redirect('/media_notification/show?id=' + idEntity + "#" + alias);
        }

        e_media_notification['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/media_notification/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("media_notification", "delete"), function (req, res) {
    var id_e_media_notification = parseInt(req.body.id);

    models.E_media_notification.findOne({where: {id: id_e_media_notification}}).then(function (deleteObject) {
        models.E_media_notification.destroy({
            where: {
                id: id_e_media_notification
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/media_notification/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.removeFiles("e_media_notification", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/media_notification/list');
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/media_notification/list');
    });
});

module.exports = router;