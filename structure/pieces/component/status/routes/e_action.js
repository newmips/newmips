var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filter_datatable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_action');
var options = require('../models/options/e_action');
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

router.get('/list', block_access.actionAccessMiddleware("action", "read"), function (req, res) {
    var data = {
        "menu": "e_action",
        "sub_menu": "list_e_action"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_action/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("action", "read"), function (req, res) {
    filterDataTable("E_action", req.body).then(function (data) {
        entity_helper.prepareDatalistResult('e_action', rawData, req.session.lang_user).then(function(preparedData) {
            res.send(preparedData).end();
        });
    }).catch(function (err) {
        console.error(err);
        logger.debug(err);
        res.end();
    });
});

router.get('/show', block_access.actionAccessMiddleware("action", "read"), function (req, res) {
    var id_e_action = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_action",
        sub_menu: "list_e_action",
        tab: tab,
        enum_radio: enums_radios.translated("e_action", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined')
        data.hideButton = req.query.hideButton;

    entity_helper.optimizedFindOne('E_action', id_e_action, options).then(function(e_action){
        if (!e_action) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Update local e_action data before show */
        data.e_action = e_action;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_action, "e_action").then(function() {
            status_helper.translate(e_action, attributes, req.session.lang_user);
            res.render('e_action/show', data);
        }).catch(function (err) {
            entity_helper.error(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("action", "create"), function (req, res) {
    var data = {
        menu: "e_action",
        sub_menu: "create_e_action",
        enum_radio: enums_radios.translated("e_action", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var view = req.query.ajax ? 'e_action/create_fields' : 'e_action/create';
    if (req.query.associationSource == 'e_status')
        models.E_status.findOne({where: {id: data.associationFlag}}).then(function(status) {
            models.E_action.findAll({
                where: {
                    fk_id_status_actions: status.id
                },
                order: [["f_order", "DESC"]],
                limit: 1
            }).then(function(actionMax) {
                data.max = (actionMax && actionMax[0] && actionMax[0].f_order) ? actionMax[0].f_order+1 : 1;
                data.status_target = status.f_entity;
                res.render(view, data);
            });
        });
    else
        res.render(view, data);
});

router.post('/create', block_access.actionAccessMiddleware("action", "create"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_action.create(createObject).then(function (e_action) {
        var redirect = '/action/show?id='+e_action.id;
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
                        e_action.destroy();
                        var err = new Error();
                        err.message = "Association not found.";
                        reject(err);
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined'){
                        association['add' + modelName](e_action.id).then(resolve).catch(function(err){
                            reject(err);
                        });
                    } else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = e_action.id;
                        association.update(obj).then(resolve).catch(function(err){
                            reject(err);
                        });
                    }
                });
            }));
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        model_builder.setAssocationManyValues(e_action, req.body, createObject, options).then(function(){
            Promise.all(promises).then(function() {
                res.redirect(redirect);
            }).catch(function(err){
                entity_helper.error(err, req, res, '/action/create_form');
            });
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/action/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("action", "update"), function (req, res) {
    var id_e_action = req.query.id;
    var data = {
        menu: "e_action",
        sub_menu: "list_e_action",
        enum_radio: enums_radios.translated("e_action", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    entity_helper.optimizedFindOne('E_action', id_e_action, options).then(function(e_action){
        if (!e_action) {
            data.error = 404;
            return res.render('common/error', data);
        }

        data.e_action = e_action;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_action, "e_action", true).then(function() {
            if (req.query.ajax) {
                e_action.dataValues.enum_radio = data.enum_radio;
                res.render('e_action/update_fields', e_action.get({plain: true}));
            }
            else
                res.render('e_action/update', data);
        }).catch(function (err) {
            entity_helper.error(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("action", "update"), function (req, res) {
    var id_e_action = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_action.findOne({where: {id: id_e_action}}).then(function (e_action) {
        if (!e_action) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_action.update(updateObject).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_action, req.body, updateObject, options).then(function () {

                var redirect = '/action/show?id=' + id_e_action;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

                res.redirect(redirect);
            });
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/action/update_form?id=' + id_e_action);
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/action/update_form?id=' + id_e_action);
    });
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('action', 'read'), function(req, res) {
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
    models.E_action.findOne({
        where: {id: id},
        include: [{
            model: models[entity_helper.capitalizeFirstLetter(option.target)],
            as: option.as,
            include: {all: true}
        }]
    }).then(function(e_action) {
        if (!e_action)
            return res.status(404).end();

        var dustData = e_action[option.as];
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

router.get('/set_status/:id_action/:status/:id_new_status', block_access.actionAccessMiddleware("action", "update"), function(req, res) {
    status_helper.setStatus('e_action', req.params.id_action, req.params.status, req.params.id_new_status, req.session.passport.user.id, req.query.comment).then(()=> {
        res.redirect('/action/show?id=' + req.params.id_action)
    }).catch((err)=> {
        entity_helper.error(err, req, res, '/action/show?id=' + req.params.id_action);
    });
});

var SELECT_PAGE_SIZE = 10
router.post('/search', block_access.actionAccessMiddleware('action', 'read'), function (req, res) {
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

    models.E_action.findAndCountAll(where).then(function (results) {
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

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("action", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_action.findOne({where: {id: idEntity}}).then(function (e_action) {
        if (!e_action) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_action['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_action['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            }).catch(function(err) {
                entity_helper.error(err, req, res, "/");
            });
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("action", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_action.findOne({where: {id: idEntity}}).then(function (e_action) {
        if (!e_action) {
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
            return res.redirect('/action/show?id=' + idEntity + "#" + alias);
        }

        e_action['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/action/show?id=' + idEntity + "#" + alias);
        }).catch(function(err) {
            entity_helper.error(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("action", "delete"), function (req, res) {
    var id_e_action = parseInt(req.body.id);

    models.E_action.findOne({where: {id: id_e_action}}).then(function (deleteObject) {
        models.E_action.destroy({
            where: {
                id: id_e_action
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/action/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.removeFiles("e_action", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/action/list');
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/action/list');
    });
});

module.exports = router;