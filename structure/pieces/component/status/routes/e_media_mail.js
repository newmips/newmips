var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filter_datatable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_media_mail');
var options = require('../models/options/e_media_mail');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var status_helper = require('../utils/status_helper');

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');

router.get('/entityTree', function(req, res) {
    res.json(status_helper.entityFieldTree('e_media_mail'));
});

router.post('/create', block_access.actionAccessMiddleware("media", "create"), function (req, res) {
    var createObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_media_mail.create(createObject).then(function (e_media_mail) {
        models.E_media.create({
            f_type: 'Mail',
            f_name: req.body.f_name,
            f_target_entity: req.body.f_target_entity,
            fk_id_media_mail: e_media_mail.id
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
        entity_helper.error(err, req, res, '/media_mail/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("media", 'update'), function (req, res) {
    var id_e_media_mail = req.query.id;
    var data = {
        menu: "e_media",
        sub_menu: "list_e_media",
        enum_radio: enums_radios.translated("e_media_mail", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var associationsFinder = model_builder.associationsFinder(models, options);

    Promise.all(associationsFinder).then(function (found) {
        models.E_media_mail.findOne({where: {id: id_e_media_mail}, include: [{all: true}]}).then(function (e_media_mail) {
            if (!e_media_mail) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_media_mail = e_media_mail;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can find adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_media_mail[name_global_list] = rows;

                // Set associated property to item that are related to be able to make them selected client side
                if (rows.length > 1)
                    for (var j = 0; j < data[model].length; j++)
                        if (e_media_mail[model] != null)
                            for (var k = 0; k < e_media_mail[model].length; k++)
                                if (data[model][j].id == e_media_mail[model][k].id)
                                    data[model][j].dataValues.associated = true;
            }

            req.session.toastr = [];
            res.render('e_media/update', data);
        }).catch(function (err) {
            entity_helper.error(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("media", 'update'), function (req, res) {
    var id_e_media_mail = parseInt(req.body.id_media_mail);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_media_mail.findOne({where: {id: id_e_media_mail}}).then(function (e_media_mail) {
        if (!e_media_mail) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_media_mail.update(updateObject, {where: {id: id_e_media_mail}}).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_media_mail, req.body, updateObject, options);

            models.E_media.findOne({where: {fk_id_media_mail: e_media_mail.id}}).then(function(e_media) {
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
            entity_helper.error(err, req, res, '/media_mail/update_form?id=' + id_e_media_mail);
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/media_mail/update_form?id=' + id_e_media_mail);
    });
});

router.get('/set_status/:id_media_mail/:status/:id_new_status', block_access.actionAccessMiddleware("media", "create"), function(req, res) {
    var historyModel = 'E_history_e_media_mail_'+req.params.status;
    var historyAlias = 'r_history_'+req.params.status.substring(2);
    var statusAlias = 'r_'+req.params.status.substring(2);

    var errorRedirect = '/media_mail/show?id='+req.params.id_media_mail;
    // Find target entity instance
    models.E_media_mail.findOne({
        where: {id: req.params.id_media_mail},
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
    }).then(function(e_media_mail) {
        if (!e_media_mail || !e_media_mail[historyAlias] || !e_media_mail[historyAlias][0][statusAlias]){
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {id: e_media_mail[historyAlias][0][statusAlias].id},
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
            // Beeing the most recent history for media_mail it will now be its current status
            var createObject = {fk_id_status_status: req.params.id_new_status};
            createObject["fk_id_media_mail_history_"+req.params.status.substring(2)] = req.params.id_media_mail;
            models[historyModel].create(createObject).then(function() {
                res.redirect('/media_mail/show?id='+req.params.id_media_mail)
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
    models.E_media_mail.findOne({where: {id: idEntity}}).then(function (e_media_mail) {
        if (!e_media_mail) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_media_mail['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_media_mail['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
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
    models.E_media_mail.findOne({where: {id: idEntity}}).then(function (e_media_mail) {
        if (!e_media_mail) {
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
            return res.redirect('/media_mail/show?id=' + idEntity + "#" + alias);
        }

        e_media_mail['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/media_mail/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("media", "delete"), function (req, res) {
    var id_e_media_mail = parseInt(req.body.id);

    models.E_media_mail.findOne({where: {id: id_e_media_mail}}).then(function (deleteObject) {
        models.E_media_mail.destroy({
            where: {
                id: id_e_media_mail
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/media_mail/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.remove_files("e_media_mail", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/media_mail/list');
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/media_mail/list');
    });
});

module.exports = router;