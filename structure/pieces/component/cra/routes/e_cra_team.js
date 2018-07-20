var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_cra_team');
var options = require('../models/options/e_cra_team');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var status_helper = require('../utils/status_helper');
var globalConfig = require('../config/global');
var fs = require('fs-extra');
var dust = require('dustjs-linkedin');
var holidaysApi = require('public-holidays');

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');

router.post('/generate_holidays', block_access.actionAccessMiddleware("cra_team", "create"), function (req, res) {
    var countryLang = req.body.lang.split('-');
    var country = countryLang[1];
    var lang = countryLang[0];
    var team_id = req.body.team_id;
    var yearStart = moment().startOf('year').toDate().getTime();
    var yearEnd = moment().endOf('year').toDate().getTime();

    holidaysApi({
        country: country,
        lang: lang,
        start: yearStart,
        end: yearEnd
    }, function(err, holidays) {
        if (err) {
            console.log(err);
            return entity_helper.error500(err, req, res);
        }

        var bulkCreate = [];
        for (var i = 0; i < holidays.length; i++) {
            var date = new Date(holidays[i].start);
            bulkCreate.push({f_date: date, fk_id_cra_team: team_id, f_label: holidays[i].summary});
        }

        models.E_cra_calendar_exception.bulkCreate(bulkCreate).then(function() {
            res.redirect('/cra_team/show?id='+team_id+'/#r_cra_calendar_exception');
        });
    });
});

router.get('/list', block_access.actionAccessMiddleware("cra_team", "read"), function (req, res) {
    var data = {
        "menu": "e_cra_team",
        "sub_menu": "list_e_cra_team"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_cra_team/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("cra_team", "read"), function (req, res) {

    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options, req.body.columns);
    filterDataTable("E_cra_team", req.body, include).then(function (rawData) {
        entity_helper.prepareDatalistResult('e_cra_team', rawData, req.session.lang_user).then(function (preparedData) {
            res.send(preparedData).end();
        }).catch(function (err) {
            console.log(err);
            logger.debug(err);
            res.end();
        });
    }).catch(function (err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.get('/show', block_access.actionAccessMiddleware("cra_team", "read"), function (req, res) {
    var id_e_cra_team = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_cra_team",
        sub_menu: "list_e_cra_team",
        tab: tab,
        enum_radio: enums_radios.translated("e_cra_team", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined')
        data.hideButton = req.query.hideButton;

    entity_helper.optimizedFindOne('E_cra_team', id_e_cra_team, options).then(function(e_cra_team){
        if (!e_cra_team) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Update local e_cra_team data before show */
        data.e_cra_team = e_cra_team;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_cra_team, "e_cra_team").then(function() {
            status_helper.translate(e_cra_team, attributes, req.session.lang_user);
            res.render('e_cra_team/show', data);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("cra_team", "create"), function (req, res) {
    var data = {
        menu: "e_cra_team",
        sub_menu: "create_e_cra_team",
        enum_radio: enums_radios.translated("e_cra_team", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var view = req.query.ajax ? 'e_cra_team/create_fields' : 'e_cra_team/create';
    res.render(view, data);
});

router.post('/create', block_access.actionAccessMiddleware("cra_team", "create"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);

    // Set creating user as team admin
    createObject.fk_id_admin_user = req.session.passport.user.id;

    // Create default calendar settings
    models.E_cra_calendar_settings.create({
        f_monday: true,
        f_tuesday: true,
        f_wednesday: true,
        f_thursday: true,
        f_friday: true,
        f_saturday: false,
        f_sunday: false
    }).then(function(settings) {
        createObject.fk_id_cra_calendar_settings = settings.id;
        models.E_cra_team.create(createObject).then(function (e_cra_team) {
            var redirect = '/cra_team/list';
            req.session.toastr = [{
                    message: 'message.create.success',
                    level: "success"
                }];

            if (typeof req.body.associationFlag !== 'undefined') {
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
                models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                    if (!association) {
                        e_cra_team.destroy();
                        var err = new Error();
                        err.message = "Association not found."
                        return error500(err, req, res, "/");
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined')
                        association['add' + modelName](e_cra_team.id);
                    else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = e_cra_team.id;
                        association.update(obj);
                    }
                });
            }

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_cra_team, req.body, createObject, options);

            res.redirect(redirect);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/cra_team/create_form');
        });
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("cra_team", "update"), function (req, res) {
    var id_e_cra_team = req.query.id;
    var data = {
        menu: "e_cra_team",
        sub_menu: "list_e_cra_team",
        enum_radio: enums_radios.translated("e_cra_team", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var relatedToList = [];
    for (var i = 0; i < options.length; i++)
        if (options[i].structureType == 'relatedTo' || options[i].structureType == 'relatedToMultiple')
            relatedToList.push({
                model: models[entity_helper.capitalizeFirstLetter(options[i].target)],
                as: options[i].as
            });

    entity_helper.optimizedFindOne('E_cra_team', id_e_cra_team, relatedToList).then(function(e_cra_team){
        if (!e_cra_team) {
            data.error = 404;
            return res.render('common/error', data);
        }

        data.e_cra_team = e_cra_team;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_cra_team, "e_cra_team", true).then(function() {
            if (req.query.ajax) {
                e_cra_team.dataValues.enum_radio = data.enum_radio;
                res.render('e_cra_team/update_fields', e_cra_team.get({plain: true}));
            }
            else
                res.render('e_cra_team/update', data);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("cra_team", "update"), function (req, res) {
    var id_e_cra_team = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_cra_team.findOne({where: {id: id_e_cra_team}}).then(function (e_cra_team) {
        if (!e_cra_team) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_cra_team.update(updateObject).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_cra_team, req.body, updateObject, options).then(function () {

                var redirect = '/cra_team/show?id=' + id_e_cra_team;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

                res.redirect(redirect);
            });
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/cra_team/update_form?id=' + id_e_cra_team);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/cra_team/update_form?id=' + id_e_cra_team);
    });
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('cra_team', 'read'), function(req, res) {
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
    models.E_cra_team.findOne({
        where: {id: id},
        include: [{
            model: models[entity_helper.capitalizeFirstLetter(option.target)],
            as: option.as,
            include: {all: true}
        }]
    }).then(function(e_cra_team) {
        if (!e_cra_team)
            return res.status(404).end();

        var dustData = e_cra_team[option.as];
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

router.get('/set_status/:id_cra_team/:status/:id_new_status', block_access.actionAccessMiddleware("cra_team", "update"), function(req, res) {
    var historyModel = 'E_history_e_cra_team_'+req.params.status;
    var historyAlias = 'r_history_'+req.params.status.substring(2);
    var statusAlias = 'r_'+req.params.status.substring(2);

    var errorRedirect = '/cra_team/show?id='+req.params.id_cra_team;

    var includeTree = status_helper.generateEntityInclude(models, 'e_cra_team');

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
    models.E_cra_team.findOne({
        where: {id: req.params.id_cra_team},
        include: includeTree
    }).then(function(e_cra_team) {
        if (!e_cra_team || !e_cra_team[historyAlias] || !e_cra_team[historyAlias][0][statusAlias]){
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {id: e_cra_team[historyAlias][0][statusAlias].id},
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
            nextStatus.executeActions(e_cra_team).then(function() {
                // Create history record for this status field
                // Beeing the most recent history for cra_team it will now be its current status
                var createObject = {}
                createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_cra_team_history_"+req.params.status.substring(2)] = req.params.id_cra_team;
                models[historyModel].create(createObject).then(function() {
                    e_cra_team['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/cra_team/show?id='+req.params.id_cra_team)
                });
            }).catch(function(err) {
                console.error(err);
                req.session.toastr = [{
                    level: 'warning',
                    message: 'component.status.error.action_error'
                }]
                var createObject = {}
                createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_cra_team_history_"+req.params.status.substring(2)] = req.params.id_cra_team;
                models[historyModel].create(createObject).then(function() {
                    e_cra_team['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/cra_team/show?id='+req.params.id_cra_team)
                });
            });
        });
    }).catch(function(err) {
        entity_helper.error500(err, req, res, errorRedirect);
    });
});

var SELECT_PAGE_SIZE = 10
router.post('/search', block_access.actionAccessMiddleware('cra_team', 'read'), function (req, res) {
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

    models.E_cra_team.findAndCountAll(where).then(function (results) {
        results.more = results.count > req.body.page * SELECT_PAGE_SIZE ? true : false;
        res.json(results);
    }).catch(function (e) {
        console.error(e);
        res.status(500).json(e);
    });
});


router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("cra_team", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_cra_team.findOne({where: {id: idEntity}}).then(function (e_cra_team) {
        if (!e_cra_team) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_cra_team['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_cra_team['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            }).catch(function(err) {
                entity_helper.error500(err, req, res, "/");
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("cra_team", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_cra_team.findOne({where: {id: idEntity}}).then(function (e_cra_team) {
        if (!e_cra_team) {
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
            return res.redirect('/cra_team/show?id=' + idEntity + "#" + alias);
        }

        // Check if user is already in the Team
        var hasTeamPromise = [];
        if (alias == 'r_users')
            for (var i = 0; i < toAdd.length; i++)
                hasTeamPromise.push(new Promise(function(resolve, reject) {
                    models.E_cra_team.findOne({
                        include: [{
                            model: models.E_user,
                            as: 'r_users',
                            where: {id: toAdd[i]}
                        }]
                    }).then(function(found) {
                        if (!found)
                            return resolve({isOkToAdd: true});
                        resolve({isOkToAdd: false, login: found.r_users[0].f_login});
                    });
                }));

        Promise.all(hasTeamPromise).then(function(isOkToAdd) {
            var notOk = 'Following users already have a Team : ';
            var isEverythingOk = true;
            for (var i = 0; i < isOkToAdd.length; i++) {
                if (isOkToAdd[i].isOkToAdd == false) {
                    isEverythingOk = false;
                    notOk += isOkToAdd[i].login+' ';
                }
            }

            // If user not already in a team, add and redirect
            if (isEverythingOk == true) {
                e_cra_team['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
                    res.redirect('/cra_team/show?id=' + idEntity + "#" + alias);
                });
            }
            // If user already in a team, set error toastr and redirect
            else {
                req.session.toastr.push({level: 'error', message: notOk});
                return res.redirect('/cra_team/show?id=' + idEntity + "#" + alias);
            }
        });

    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("cra_team", "delete"), function (req, res) {
    var id_e_cra_team = parseInt(req.body.id);

    models.E_cra_team.findOne({where: {id: id_e_cra_team}}).then(function (deleteObject) {
        models.E_cra_team.destroy({
            where: {
                id: id_e_cra_team
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/cra_team/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.remove_files("e_cra_team", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/cra_team/list');
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/cra_team/list');
    });
});

module.exports = router;