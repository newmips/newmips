var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filter_datatable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_translation');
var options = require('../models/options/e_translation');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var status_helper = require('../utils/status_helper');
var globalConfig = require('../config/global');
var fs = require('fs-extra');
var dust = require('dustjs-linkedin');

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');

router.get('/list', block_access.actionAccessMiddleware("translation", "read"), function (req, res) {
    var data = {
        "menu": "e_translation",
        "sub_menu": "list_e_translation"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_translation/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("translation", "read"), function (req, res) {
    filterDataTable("E_translation", req.body).then(function (rawData) {
        entity_helper.prepareDatalistResult('e_translation', rawData, req.session.lang_user).then(function(preparedData) {
            res.send(preparedData).end();
        });
    }).catch(function (err) {
        console.error(err);
        logger.debug(err);
        res.end();
    });
});

router.get('/show', block_access.actionAccessMiddleware("translation", "read"), function (req, res) {
    var id_e_translation = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_translation",
        sub_menu: "list_e_translation",
        tab: tab,
        enum_radio: enums_radios.translated("e_translation", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined')
        data.hideButton = req.query.hideButton;

    entity_helper.optimizedFindOne('E_translation', id_e_translation, options).then(function(e_translation){
        if (!e_translation) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Update local e_translation data before show */
        data.e_translation = e_translation;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_translation, "e_translation").then(function() {
            status_helper.translate(e_translation, attributes, req.session.lang_user);
            // Check if entity has Status component defined and get the possible next status
            status_helper.nextStatus(models, "e_translation", e_translation.id, attributes).then(function(nextStatus) {
                if (nextStatus)
                    data.next_status = nextStatus;

                // Give children status entity/field translation
                for (var i = 0; e_translation.r_children && i < e_translation.r_children.length; i++) {
                    var curr = e_translation.r_children[i];
                    var entityTradKey = 'entity.'+curr.f_entity+'.label_entity';
                    curr.f_field = 'entity.'+curr.f_entity+'.'+curr.f_field;
                    curr.f_entity = entityTradKey;
                }
                res.render('e_translation/show', data);
            }).catch(function(err) {
                console.error(err);
                req.session.toastr = [{
                    message: 'component.status.error',
                    level: 'error'
                }];
                res.render('e_translation/show', data);
            });
        }).catch(function (err) {
            entity_helper.error(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("translation", "create"), function (req, res) {
    var data = {
        menu: "e_translation",
        sub_menu: "create_e_translation",
        enum_radio: enums_radios.translated("e_translation", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    data.languages = [];
    fs.readdirSync(__dirname+'/../locales/').filter(function(file){
        return (file.indexOf('.') !== 0) && (file.slice(-5) === '.json') && file != 'enum_radio.json';
    }).forEach(function(file){
        data.languages.push(file.substring(0, file.length-5));
    });

    var view = req.query.ajax ? 'e_translation/create_fields' : 'e_translation/create';
    res.render(view, data);
});

router.post('/create', block_access.actionAccessMiddleware("translation", "create"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_translation.create(createObject).then(function (e_translation) {
        var redirect = '/translation/show?id='+e_translation.id;
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
                        e_translation.destroy();
                        var err = new Error();
                        err.message = "Association not found.";
                        reject(err);
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined'){
                        association['add' + modelName](e_translation.id).then(resolve).catch(function(err){
                            reject(err);
                        });
                    } else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = e_translation.id;
                        association.update(obj).then(resolve).catch(function(err){
                            reject(err);
                        });
                    }
                });
            }));
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        model_builder.setAssocationManyValues(e_translation, req.body, createObject, options).then(function(){
            Promise.all(promises).then(function() {
                res.redirect(redirect);
            }).catch(function(err){
                entity_helper.error(err, req, res, '/translation/create_form');
            });
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/translation/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("translation", "update"), function (req, res) {
    var id_e_translation = req.query.id;
    var data = {
        menu: "e_translation",
        sub_menu: "list_e_translation",
        enum_radio: enums_radios.translated("e_translation", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    entity_helper.optimizedFindOne('E_translation', id_e_translation, options).then(function(e_translation){
        if (!e_translation) {
            data.error = 404;
            return res.render('common/error', data);
        }

        data.e_translation = e_translation;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_translation, "e_translation", true).then(function() {
            if (req.query.ajax) {
                e_translation.dataValues.enum_radio = data.enum_radio;
                res.render('e_translation/update_fields', e_translation.get({plain: true}));
            }
            else
                res.render('e_translation/update', data);
        }).catch(function (err) {
            entity_helper.error(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("translation", "update"), function (req, res) {
    var id_e_translation = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_translation.findOne({where: {id: id_e_translation}}).then(function (e_translation) {
        if (!e_translation) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_translation.update(updateObject).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_translation, req.body, updateObject, options).then(function () {

                var redirect = '/translation/show?id=' + id_e_translation;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

                res.redirect(redirect);
            });
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/translation/update_form?id=' + id_e_translation);
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/translation/update_form?id=' + id_e_translation);
    });
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('translation', 'read'), function(req, res) {
    var alias = req.params.alias;
    var id = req.params.id;

    // Find tab option
    var option;
    for (var i = 0; i < options.length; i++)
        if (options[i].as == req.params.alias)
            {option = options[i]; break;}
    if (!option)
        return res.status(404).end();

    // Check access rights to subentity
    if (!block_access.entityAccess(req.session.passport.user.r_group, option.target.substring(2)))
        return res.status(403).end();

    // Fetch tab data
    models.E_translation.findOne({
        where: {id: id},
        include: [{
            model: models[entity_helper.capitalizeFirstLetter(option.target)],
            as: option.as,
            include: {all: true}
        }]
    }).then(function(e_translation) {
        if (!e_translation)
            return res.status(404).end();

        var dustData = e_translation[option.as];
        var empty = !dustData || (dustData instanceof Array && dustData.length == 0) ? true : false;
        var dustFile, idSubentity, promisesData = [];

        // Build tab specific variables
        switch (option.structureType) {
            case 'hasOne':
                if (!empty) {
                    idSubentity = dustData.id;
                    dustData.hideTab = true;
                    dustData.enum_radio = enums_radios.translated(option.target, req.session.lang_user, options);
                    promisesData.push(entity_helper.getPicturesBuffers(dustData, option.target));
                    // Fetch status children to be able to switch status
                    // Apply getR_children() on each current status
                    var statusGetterPromise = [], subentityOptions = require('../models/options/'+option.target);;
                    for (var i = 0; i < subentityOptions.length; i++)
                        if (subentityOptions[i].target.indexOf('e_status') == 0)
                            (function(alias) {
                                promisesData.push(new Promise(function(resolve, reject) {
                                    dustData[alias].getR_children().then(function(children) {
                                        dustData[alias].r_children = children;
                                        resolve();
                                    });
                                }))
                            })(subentityOptions[i].as);
                }
                dustFile = option.target+'/show_fields';
            break;

            case 'hasMany':
            case 'hasManyPreset':
                dustFile = option.target+'/list_fields';
                // Status history specific behavior. Replace history_model by history_table to open view
                if (option.target.indexOf('e_history_e_') == 0) {
                    option.noCreateBtn = true;
                    for (var attr in attributes)
                        if (attributes[attr].history_table && attributes[attr].history_model == option.target)
                            dustFile = attributes[attr].history_table+'/list_fields';
                }
                var obj = {};
                obj[option.target] = dustData;
                dustData = obj;
                dustData.for = option.structureType == 'hasMany' ? 'hasMany' : 'fieldset';
                for (var i = 0; i < dustData[option.target].length; i++)
                    promisesData.push(entity_helper.getPicturesBuffers(dustData[option.target][i], option.target, true));
                if (typeof req.query.associationFlag !== 'undefined')
                    {dustData.associationFlag = req.query.associationFlag;dustData.associationSource = req.query.associationSource;dustData.associationForeignKey = req.query.associationForeignKey;dustData.associationAlias = req.query.associationAlias;dustData.associationUrl = req.query.associationUrl;}
            break;

            case 'localfilestorage':
                dustFile = option.target+'/list_fields';
                var obj = {};
                obj[option.target] = dustData;
                dustData = obj;
                dustData.sourceId = id;
            break;

            default:
                return res.status(500).end();
        }

        // Image buffer promise
        Promise.all(promisesData).then(function() {
            // Open and render dust file
            var file = fs.readFileSync(__dirname+'/../views/'+dustFile+'.dust', 'utf8');
            dust.insertLocalsFn(dustData ? dustData : {}, req);
            dust.renderSource(file, dustData || {}, function(err, rendered) {
                if (err) {
                    console.error(err);
                    return res.status(500).end();
                }

                // Send response to ajax request
                res.json({
                    content: rendered,
                    data: idSubentity || {},
                    empty: empty,
                    option: option
                });
            });
        }).catch(function(err) {
            console.error(err);
            res.status(500).send(err);
        });
    }).catch(function(err) {
        console.error(err);
        res.status(500).send(err);
    });
});

router.get('/set_status/:id_translation/:status/:id_new_status', block_access.actionAccessMiddleware("translation", "update"), function(req, res) {
    var historyModel = 'E_history_e_translation_'+req.params.status;
    var historyAlias = 'r_history_'+req.params.status.substring(2);
    var statusAlias = 'r_'+req.params.status.substring(2);

    var errorRedirect = '/translation/show?id='+req.params.id_translation;

    var includeTree = status_helper.generateEntityInclude(models, 'e_translation');

    // Find target entity instance and include its child to be able to replace variables in media
    includeTree.push({
        model: models[historyModel],
        as: historyAlias,
        limit: 1,
        order: [["createdAt", "DESC"]],
        include: [{
            model: models.E_status,
            as: statusAlias
        }]
    });
    models.E_translation.findOne({
        where: {id: req.params.id_translation},
        include: includeTree
    }).then(function(e_translation) {
        if (!e_translation || !e_translation[historyAlias] || !e_translation[historyAlias][0][statusAlias]){
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {id: e_translation[historyAlias][0][statusAlias].id},
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
                        include: {all: true, nested: true}
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
            nextStatus.executeActions(e_translation).then(function() {
                // Create history record for this status field
                // Beeing the most recent history for translation it will now be its current status
                var createObject = {}
                createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_translation_history_"+req.params.status.substring(2)] = req.params.id_translation;
                models[historyModel].create(createObject).then(function() {
                    e_translation['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/translation/show?id='+req.params.id_translation)
                });
            }).catch(function(err) {
                console.error(err);
                req.session.toastr = [{
                    level: 'warning',
                    message: 'component.status.error.action_error'
                }]
                var createObject = {}
                createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_translation_history_"+req.params.status.substring(2)] = req.params.id_translation;
                models[historyModel].create(createObject).then(function() {
                    e_translation['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/translation/show?id='+req.params.id_translation)
                });
            });
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, errorRedirect);
    });
});

var SELECT_PAGE_SIZE = 10
router.post('/search', block_access.actionAccessMiddleware('translation', 'read'), function (req, res) {
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
    if (typeof req.body.customwhere !== "undefined") {
        var customwhere = {};
        try {
            customwhere = JSON.parse(req.body.customwhere);
        } catch(e){console.error(e);console.error("ERROR: Error in customwhere")}
        for (var param in customwhere)
            where.where[param] = customwhere[param];
    }


    where.offset = offset;
    where.limit = limit;

    models.E_translation.findAndCountAll(where).then(function (results) {
        results.more = results.count > req.body.page * SELECT_PAGE_SIZE ? true : false;
        // Format value like date / datetime / etc...
        for (var field in attributes) {
            for (var i = 0; i < results.rows.length; i++) {
                for (var fieldSelect in results.rows[i]) {
                    if(fieldSelect == field){
                        switch(attributes[field].newmipsType) {
                            case "date":
                                results.rows[i][fieldSelect] = moment(results.rows[i][fieldSelect]).format(req.session.lang_user == "fr-FR" ? "DD/MM/YYYY" : "YYYY-MM-DD")
                                break;
                            case "datetime":
                                results.rows[i][fieldSelect] = moment(results.rows[i][fieldSelect]).format(req.session.lang_user == "fr-FR" ? "DD/MM/YYYY HH:mm" : "YYYY-MM-DD HH:mm")
                                break;
                        }
                    }
                }
            }
        }
        res.json(results);
    }).catch(function (e) {
        console.error(e);
        res.status(500).json(e);
    });
});


router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("translation", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_translation.findOne({where: {id: idEntity}}).then(function (e_translation) {
        if (!e_translation) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_translation['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_translation['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            }).catch(function(err) {
                entity_helper.error(err, req, res, "/");
            });
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("translation", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_translation.findOne({where: {id: idEntity}}).then(function (e_translation) {
        if (!e_translation) {
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
            return res.redirect('/translation/show?id=' + idEntity + "#" + alias);
        }

        e_translation['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/translation/show?id=' + idEntity + "#" + alias);
        }).catch(function(err) {
            entity_helper.error(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("translation", "delete"), function (req, res) {
    var id_e_translation = parseInt(req.body.id);

    models.E_translation.findOne({where: {id: id_e_translation}}).then(function (deleteObject) {
        models.E_translation.destroy({
            where: {
                id: id_e_translation
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/translation/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.removeFiles("e_translation", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/translation/list');
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/translation/list');
    });
});

module.exports = router;