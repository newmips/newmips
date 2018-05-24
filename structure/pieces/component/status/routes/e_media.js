var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_media');
var options = require('../models/options/e_media');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var globalConf = require('../config/global');
var fs = require('fs-extra');

var icon_list = require('../config/icon_list');

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');

var targetEntities = [];
fs.readdirSync(__dirname+'/../models/attributes/').filter(function(file) {
    return file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file.substring(0, 2) == 'e_';
}).forEach(function(file) {
    var fileContent = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+file));
    targetEntities.push({
        codename: file.substring(0, file.length-5),
        tradKey: 'entity.'+file.substring(0, file.length-5)+'.label_entity'
    });
});

router.get('/entity_tree/:entity', block_access.actionAccessMiddleware("media", "read"), function(req, res) {
    var entityTree = entity_helper.status.entityFieldForSelect(req.params.entity, req.session.lang_user);
    res.json(entityTree).end();
});

router.get('/list', block_access.actionAccessMiddleware("media", "read"), function (req, res) {
    var data = {
        "menu": "e_media",
        "sub_menu": "list_e_media"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_media/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("media", "read"), function (req, res) {
    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options, req.body.columns);
    filterDataTable("E_media", req.body, include).then(function (rawData) {
        entity_helper.prepareDatalistResult('e_media', rawData, req.session.lang_user).then(function(preparedData) {
            res.send(preparedData).end();
        });
    }).catch(function (err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.get('/show', block_access.actionAccessMiddleware("media", "read"), function (req, res) {
    var id_e_media = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_media",
        sub_menu: "list_e_media",
        tab: tab,
        enum_radio: enums_radios.translated("e_media", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined')
        data.hideButton = req.query.hideButton;

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.E_media.findOne({where: {id: id_e_media}, include: include}).then(function (e_media) {
        if (!e_media) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify e_media value with the translated enum value in show result */
        for (var item in data.enum)
            for (var field in e_media.dataValues)
                if (item == field)
                    for (var value in data.enum[item])
                        if (data.enum[item][value].value == e_media[field])
                            e_media[field] = data.enum[item][value].translation;

        /* Update local e_media data before show */
        data.e_media = e_media;
        var associationsFinder = model_builder.associationsFinder(models, options);
        associationsFinder = associationsFinder.concat(model_builder.associationsFinder(models, require(__dirname+'/../models/options/e_media_notification')));
        associationsFinder = associationsFinder.concat(model_builder.associationsFinder(models, require(__dirname+'/../models/options/e_media_mail')));
        associationsFinder = associationsFinder.concat(model_builder.associationsFinder(models, require(__dirname+'/../models/options/e_media_function')));

        Promise.all(associationsFinder).then(function (found) {
            for (var i = 0; i < found.length; i++) {
                data.e_media[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            // Update some data before show, e.g get picture binary
            entity_helper.getPicturesBuffers(e_media, "e_media").then(function() {
                entity_helper.status.translate(e_media, attributes, req.session.lang_user);
                res.render('e_media/show', data);
            }).catch(function (err) {
                entity_helper.error500(err, req, res, "/");
            });
       });

    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("media", "create"), function (req, res) {
    var data = {
        menu: "e_media",
        sub_menu: "create_e_media",
        enum_radio: enums_radios.translated("e_media", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var notifOptions = require('../models/options/e_media_notification');
    var associationsFinder = model_builder.associationsFinder(models, options);
    associationsFinder = associationsFinder.concat(model_builder.associationsFinder(models, notifOptions));

    Promise.all(associationsFinder).then(function (found) {
        for (var i = 0; i < found.length; i++)
            data[found[i].model] = found[i].rows;

        data.target_entities = targetEntities;
        data.icon_list = icon_list;
        res.render('e_media/create', data);
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/create', block_access.actionAccessMiddleware("media", "create"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    //createObject = enums.values("e_media", createObject, req.body);

    models.E_media.create(createObject).then(function (e_media) {
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
                    return entity_helper.error500(err, req, res, "/");
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
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/media/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("media", 'update'), function (req, res) {
    var id_e_media = req.query.id;
    var data = {
        menu: "e_media",
        sub_menu: "list_e_media",
        enum_radio: enums_radios.translated("e_media", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var notifOptions = require('../models/options/e_media_notification');
    var associationsFinder = model_builder.associationsFinder(models, options);
    associationsFinder = associationsFinder.concat(model_builder.associationsFinder(models, notifOptions));

    Promise.all(associationsFinder).then(function (found) {
        models.E_media.findOne({where: {id: id_e_media}, include: [{all: true, nested: true}]}).then(function (e_media) {
            if (!e_media) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_media = e_media;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can find adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_media[name_global_list] = rows;

                // Set associated property to item that are related to be able to make them selected client side
                if (rows.length > 1)
                    for (var j = 0; j < data[model].length; j++)
                        if (e_media[model] != null)
                            for (var k = 0; k < e_media[model].length; k++)
                                if (data[model][j].id == e_media[model][k].id)
                                    data[model][j].dataValues.associated = true;
            }

            data.target_entities = targetEntities;
            data.icon_list = icon_list;
            res.render('e_media/update', data);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("media", 'update'), function (req, res) {
    var id_e_media = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    //updateObject = enums.values("e_media", updateObject, req.body);

    models.E_media.findOne({where: {id: id_e_media}}).then(function (e_media) {
        if (!e_media) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_media.update(updateObject).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_media, req.body, updateObject, options);

            var redirect = '/media/show?id=' + id_e_media;
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

            req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

            res.redirect(redirect);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/media/update_form?id=' + id_e_media);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/media/update_form?id=' + id_e_media);
    });
});

router.get('/set_status/:id_media/:status/:id_new_status', block_access.actionAccessMiddleware("media", "create"), function(req, res) {
    var historyModel = 'E_history_e_media_'+req.params.status;
    var historyAlias = 'r_history_'+req.params.status.substring(2);
    var statusAlias = 'r_'+req.params.status.substring(2);

    var errorRedirect = '/media/show?id='+req.params.id_media;
    // Find target entity instance
    models.E_media.findOne({
        where: {id: req.params.id_media},
        include: [{
            model: models[historyModel],
            as: historyAlias,
            limit: 1,
            order: 'createdAt DESC',
            include: [{
                model: models.E_status,
                as: statusAlias
            }]
        }]
    }).then(function(e_media) {
        if (!e_media || !e_media[historyAlias] || !e_media[historyAlias][0][statusAlias]){
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {id: e_media[historyAlias][0][statusAlias].id},
            include: [{
                model: models.E_status,
                as: 'r_children',
                    include: [{
                    model: models.E_action,
                    as: 'r_actions',
                    order: 'f_position ASC',
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
            nextStatus.executeActions(e_media);

            // Create history record for this status field
            // Beeing the most recent history for media it will now be its current status
            var createObject = {}
            createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
            createObject["fk_id_media_history_"+req.params.status.substring(2)] = req.params.id_media;
            models[historyModel].create(createObject).then(function() {
                e_media['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                res.redirect('/media/show?id='+req.params.id_media)
            }).catch(function(err) {
                entity_helper.error500(err, req, res, errorRedirect);
            });
        });
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("media", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_media.findOne({where: {id: idEntity}}).then(function (e_media) {
        if (!e_media) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_media['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_media['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

var SELECT_PAGE_SIZE = 10
router.post('/search', block_access.actionAccessMiddleware('media', 'read'), function (req, res) {
    var search = '%' + (req.body.search || '') + '%';
    var limit = SELECT_PAGE_SIZE;
    var offset = (req.body.page-1)*limit;

    // ID is always needed
    if (req.body.searchField.indexOf("id") == -1)
        req.body.searchField.push('id');

    var where = {raw: true, attributes: req.body.searchField, where: {}};
    if (search != '%%') {
        if (req.body.searchField.length == 1) {
            where.where[req.body.searchField[0]] = {$like: search};
        } else {
            where.where.$or = [];
            for (var i = 0; i < req.body.searchField.length; i++) {
                if (req.body.searchField[i] != "id") {
                    var currentOrObj = {};
                    currentOrObj[req.body.searchField[i]] = {$like: search}
                    where.where.$or.push(currentOrObj);
                }
            }
        }
    }

    // Possibility to add custom where in select2 ajax instanciation
    if (typeof req.body.customWhere !== "undefined")
        for (var param in req.body.customWhere)
            where.where[param] = req.body.customWhere[param];

    where.offset = offset;
    where.limit = limit;

    models.E_media.findAndCountAll(where).then(function (results) {
        results.more = results.count > req.body.page * SELECT_PAGE_SIZE ? true : false;
        res.json(results);
    }).catch(function (e) {
        console.error(e);
        res.status(500).json(e);
    });
});


router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("media", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_media.findOne({where: {id: idEntity}}).then(function (e_media) {
        if (!e_media) {
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
            return res.redirect('/media/show?id=' + idEntity + "#" + alias);
        }

        e_media['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/media/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("media", "delete"), function (req, res) {
    var id_e_media = parseInt(req.body.id);

    models.E_media.findOne({where: {id: id_e_media}}).then(function (deleteObject) {
        models.E_media.destroy({
            where: {
                id: id_e_media
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/media/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.remove_files("e_media", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/media/list');
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/media/list');
    });
});

module.exports = router;