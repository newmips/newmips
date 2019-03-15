var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filter_datatable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_api_credentials');
var options = require('../models/options/e_api_credentials');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var status_helper = require('../utils/status_helper');
var component_helper = require('../utils/component_helper');
var globalConfig = require('../config/global');
var fs = require('fs-extra');
var dust = require('dustjs-linkedin');
var randomString = require('randomstring');

var SELECT_PAGE_SIZE = 10;

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');

router.get('/list', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {
    var data = {
        "menu": "e_api_credentials",
        "sub_menu": "list_e_api_credentials"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_api_credentials/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {
    filterDataTable("E_api_credentials", req.body).then(function (rawData) {
        entity_helper.prepareDatalistResult('e_api_credentials', rawData, req.session.lang_user).then(function (preparedData) {
            res.send(preparedData).end();
        }).catch(function (err) {
            console.error(err);
            logger.debug(err);
            res.end();
        });
    }).catch(function (err) {
        console.error(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/subdatalist', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {
    var start = parseInt(req.body.start || 0);
    var length = parseInt(req.body.length || 10);

    var sourceId = req.query.sourceId;
    var subentityAlias = req.query.subentityAlias, subentityName = req.query.subentityModel;
    var subentityModel = entity_helper.capitalizeFirstLetter(req.query.subentityModel);
    var doPagination = req.query.paginate;

    // Build array of fields for include and search object
    var isGlobalSearch = req.body.search.value == "" ? false : true;
    var search = {}, searchTerm = isGlobalSearch ? '$or' : '$and';
    search[searchTerm] = [];
    var toInclude = [];
    // Loop over columns array
    for (var i = 0, columns = req.body.columns; i < columns.length; i++) {
        if (columns[i].searchable == 'false')
            continue;

        // Push column's field into toInclude. toInclude will be used to build the sequelize include. Ex: toInclude = ['r_alias.r_other_alias.f_field', 'f_name']
        toInclude.push(columns[i].data);

        // Add column own search
        if (columns[i].search.value != "") {
            var {type, value} = JSON.parse(columns[i].search.value);
            search[searchTerm].push(model_builder.formatSearch(columns[i].data, value, type));
        }
        // Add column global search
        if (isGlobalSearch)
            search[searchTerm].push(model_builder.formatSearch(columns[i].data, req.body.search.value, req.body.columnsTypes[columns[i].data]));
    }
    for (var i = 0; i < req.body.columns.length; i++)
        if (req.body.columns[i].searchable == 'true')
            toInclude.push(req.body.columns[i].data);
    // Get sequelize include object
    var subentityInclude = model_builder.getIncludeFromFields(models, subentityName, toInclude);

    // ORDER BY
    var order, stringOrder = req.body.columns[req.body.order[0].column].data;
    // If ordering on an association field, use Sequelize.literal so it can match field path 'r_alias.f_name'
    order = stringOrder.indexOf('.') != -1 ? [[models.Sequelize.literal(stringOrder), req.body.order[0].dir]] : [[stringOrder, req.body.order[0].dir]];

    var include = {
        model: models[subentityModel],
        as: subentityAlias,
        order: order,
        where: search,
        include: subentityInclude
    }

    if (doPagination == "true") {
        include.limit = length;
        include.offset = start;
    }

    models.E_api_credentials.findOne({
        where: {id: parseInt(sourceId)},
        include: include
    }).then(function (e_api_credentials) {
        if (!e_api_credentials['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]) {
            console.error('/subdatalist: count' + entity_helper.capitalizeFirstLetter(subentityAlias) + ' is undefined');
            return res.status(500).end();
        }

        e_api_credentials['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]().then(function (count) {
            var rawData = {
                recordsTotal: count,
                recordsFiltered: count,
                data: []
            };
            for (var i = 0; i < e_api_credentials[subentityAlias].length; i++)
                rawData.data.push(e_api_credentials[subentityAlias][i].get({plain: true}));

            entity_helper.prepareDatalistResult(req.query.subentityModel, rawData, req.session.lang_user).then(function (preparedData) {
                res.send(preparedData).end();
            }).catch(function (err) {
                console.error(err);
                logger.debug(err);
                res.end();
            });
        });
    });
});

router.get('/show', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {
    var id_e_api_credentials = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_api_credentials",
        sub_menu: "list_e_api_credentials",
        tab: tab,
        enum_radio: enums_radios.translated("e_api_credentials", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined')
        data.hideButton = req.query.hideButton;

    entity_helper.optimizedFindOne('E_api_credentials', id_e_api_credentials, options).then(function (e_api_credentials) {
        if (!e_api_credentials) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Update local e_api_credentials data before show */
        data.e_api_credentials = e_api_credentials;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_api_credentials, "e_api_credentials").then(function () {
            status_helper.translate(e_api_credentials, attributes, req.session.lang_user);
            data.componentAddressConfig = component_helper.getMapsConfigIfComponentAddressExist("e_api_credentials");
            res.render('e_api_credentials/show', data);
        }).catch(function (err) {
            entity_helper.error(err, req, res, "/", "e_user");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/", "e_user");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("api_credentials", "create"), function (req, res) {
    var data = {
        menu: "e_api_credentials",
        sub_menu: "create_e_api_credentials",
        enum_radio: enums_radios.translated("e_api_credentials", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var view = req.query.ajax ? 'e_api_credentials/create_fields' : 'e_api_credentials/create';
    res.render(view, data);
});

router.post('/create', block_access.actionAccessMiddleware("api_credentials", "create"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);

    createObject.f_client_key = randomString.generate(15);
    createObject.f_client_secret = randomString.generate(15);
    models.E_api_credentials.create(createObject).then(function (e_api_credentials) {
        var redirect = '/api_credentials/show?id=' + e_api_credentials.id;
        req.session.toastr = [{
                message: 'message.create.success',
                level: "success"
            }];

        var promises = [];

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            promises.push(new Promise(function (resolve, reject) {
                models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                    if (!association) {
                        e_api_credentials.destroy();
                        var err = new Error();
                        err.message = "Association not found.";
                        reject(err);
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined') {
                        association['add' + modelName](e_api_credentials.id).then(resolve).catch(function (err) {
                            reject(err);
                        });
                    } else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = e_api_credentials.id;
                        association.update(obj).then(resolve).catch(function (err) {
                            reject(err);
                        });
                    }
                });
            }));
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        model_builder.setAssocationManyValues(e_api_credentials, req.body, createObject, options).then(function () {
            Promise.all(promises).then(function () {
                component_helper.setAddressIfComponentExist(e_api_credentials, options, req.body).then(function () {
                    res.redirect(redirect);
                });
            }).catch(function (err) {
                entity_helper.error(err, req, res, '/api_credentials/create_form', "e_user");
            });
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/api_credentials/create_form', "e_user");
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("api_credentials", "update"), function (req, res) {
    var id_e_api_credentials = req.query.id;
    var data = {
        menu: "e_api_credentials",
        sub_menu: "list_e_api_credentials",
        enum_radio: enums_radios.translated("e_api_credentials", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    entity_helper.optimizedFindOne('E_api_credentials', id_e_api_credentials, options).then(function (e_api_credentials) {
        if (!e_api_credentials) {
            data.error = 404;
            return res.render('common/error', data);
        }

        data.e_api_credentials = e_api_credentials;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_api_credentials, "e_api_credentials", true).then(function () {
            if (req.query.ajax) {
                e_api_credentials.dataValues.enum_radio = data.enum_radio;
                res.render('e_api_credentials/update_fields', e_api_credentials.get({plain: true}));
            } else
                res.render('e_api_credentials/update', data);
        }).catch(function (err) {
            entity_helper.error(err, req, res, "/", "e_user");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/", "e_user");
    });
});

router.post('/update', block_access.actionAccessMiddleware("api_credentials", "update"), function (req, res) {
    var id_e_api_credentials = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_api_credentials.findOne({where: {id: id_e_api_credentials}}).then(function (e_api_credentials) {
        if (!e_api_credentials) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }
        component_helper.updateAddressIfComponentExist(e_api_credentials, options, req.body);
        e_api_credentials.update(updateObject).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_api_credentials, req.body, updateObject, options).then(function () {

                var redirect = '/api_credentials/show?id=' + id_e_api_credentials;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                        message: 'message.update.success',
                        level: "success"
                    }];

                res.redirect(redirect);
            });
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/api_credentials/update_form?id=' + id_e_api_credentials, "e_user");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/api_credentials/update_form?id=' + id_e_api_credentials, "e_user");
    });
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('api_credentials', 'read'), function (req, res) {
    var alias = req.params.alias;
    var id = req.params.id;

    // Find tab option
    var option;
    for (var i = 0; i < options.length; i++)
        if (options[i].as == req.params.alias) {
            option = options[i];
            break;
        }
    if (!option)
        return res.status(404).end();

    // Check access rights to subentity
    if (!block_access.entityAccess(req.session.passport.user.r_group, option.target.substring(2)))
        return res.status(403).end();

    var queryOpts = {where: {id: id}};
    // If hasMany, no need to include anything since it will be fetched using /subdatalist
    if (option.structureType != 'hasMany')
        queryOpts.include = {
            model: models[entity_helper.capitalizeFirstLetter(option.target)],
            as: option.as,
            include: {all: true}
        }

    // Fetch tab data
    models.E_api_credentials.findOne(queryOpts).then(function (e_api_credentials) {
        if (!e_api_credentials)
            return res.status(404).end();

        var dustData = e_api_credentials[option.as] || null;
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
                    var subentityOptions = require('../models/options/' + option.target);
                    // Fetch status children to be able to switch status
                    // Apply getR_children() on each current status
                    var statusGetterPromise = [], subentityOptions = require('../models/options/' + option.target);
                    dustData.componentAddressConfig = component_helper.getMapsConfigIfComponentAddressExist(option.target);
                    for (var i = 0; i < subentityOptions.length; i++)
                        if (subentityOptions[i].target.indexOf('e_status') == 0)
                            (function (alias) {
                                promisesData.push(new Promise(function (resolve, reject) {
                                    dustData[alias].getR_children().then(function (children) {
                                        dustData[alias].r_children = children;
                                        resolve();
                                    });
                                }));
                            })(subentityOptions[i].as);
                }
                dustFile = option.target + '/show_fields';
                break;

            case 'hasMany':
                dustFile = option.target + '/list_fields';
                // Status history specific behavior. Replace history_model by history_table to open view
                if (option.target.indexOf('e_history_e_') == 0)
                    option.noCreateBtn = true;
                dustData = {for : 'hasMany'};
                if (typeof req.query.associationFlag !== 'undefined')
                {
                    dustData.associationFlag = req.query.associationFlag;
                    dustData.associationSource = req.query.associationSource;
                    dustData.associationForeignKey = req.query.associationForeignKey;
                    dustData.associationAlias = req.query.associationAlias;
                    dustData.associationUrl = req.query.associationUrl;
                }
                break;

            case 'hasManyPreset':
                dustFile = option.target + '/list_fields';
                var obj = {};
                obj[option.target] = dustData;
                dustData = obj;
                if (typeof req.query.associationFlag !== 'undefined')
                {
                    dustData.associationFlag = req.query.associationFlag;
                    dustData.associationSource = req.query.associationSource;
                    dustData.associationForeignKey = req.query.associationForeignKey;
                    dustData.associationAlias = req.query.associationAlias;
                    dustData.associationUrl = req.query.associationUrl;
                }
                dustData.for = 'fieldset';
                for (var i = 0; i < dustData[option.target].length; i++)
                    promisesData.push(entity_helper.getPicturesBuffers(dustData[option.target][i], option.target, true));

                break;

            case 'localfilestorage':
                dustFile = option.target + '/list_fields';
                var obj = {};
                obj[option.target] = dustData;
                dustData = obj;
                dustData.sourceId = id;
                break;

            default:
                return res.status(500).end();
        }

        // Image buffer promise
        Promise.all(promisesData).then(function () {
            // Open and render dust file
            var file = fs.readFileSync(__dirname + '/../views/' + dustFile + '.dust', 'utf8');
            dust.insertLocalsFn(dustData ? dustData : {}, req);
            dust.renderSource(file, dustData || {}, function (err, rendered) {
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
        }).catch(function (err) {
            console.error(err);
            res.status(500).send(err);
        });
    }).catch(function (err) {
        console.error(err);
        res.status(500).send(err);
    });
});

router.get('/set_status/:id_api_credentials/:status/:id_new_status', block_access.actionAccessMiddleware("api_credentials", "update"), function (req, res) {
    var historyModel = 'E_history_e_api_credentials_' + req.params.status;
    var historyAlias = 'r_history_' + req.params.status.substring(2);
    var statusAlias = 'r_' + req.params.status.substring(2);

    var errorRedirect = '/api_credentials/show?id=' + req.params.id_api_credentials;

    var includeTree = status_helper.generateEntityInclude(models, 'e_api_credentials');

    // Find target entity instance and include its child to be able to replace variables in media
    includeTree.push({
        model: models[historyModel],
        as: historyAlias,
        limit: 1,
        order: 'createdAt DESC',
        include: [{
                model: models.E_status,
                as: statusAlias
            }]
    });
    models.E_api_credentials.findOne({
        where: {id: req.params.id_api_credentials},
        include: includeTree
    }).then(function (e_api_credentials) {
        if (!e_api_credentials || !e_api_credentials[historyAlias] || !e_api_credentials[historyAlias][0][statusAlias]) {
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {
                id: e_api_credentials[historyAlias][0][statusAlias].id
            },
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
                        include: {
                            all: true,
                            nested: true
                        }
                    }]
                }]
            }]
        }).then(function (current_status) {
            if (!current_status || !current_status.r_children) {
                logger.debug("Not found - Set status");
                return res.render('common/error', {
                    error: 404
                });
            }

            // Check if new status is actualy the current status's children
            var children = current_status.r_children;
            var nextStatus = false;
            for (var i = 0; i < children.length; i++) {
                if (children[i].id == req.params.id_new_status) {
                    nextStatus = children[i];
                    break;
                }
            }
            // Unautorized
            if (nextStatus === false) {
                req.session.toastr = [{
                        level: 'error',
                        message: 'component.status.error.illegal_status'
                    }]
                return res.redirect(errorRedirect);
            }

            // Execute newStatus actions
            nextStatus.executeActions(e_api_credentials).then(function () {
                // Create history record for this status field
                // Beeing the most recent history for api_credentials it will now be its current status
                var createObject = {}
                createObject["fk_id_status_" + nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_api_credentials_history_" + req.params.status.substring(2)] = req.params.id_api_credentials;
                models[historyModel].create(createObject).then(function () {
                    e_api_credentials['set' + entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/api_credentials/show?id=' + req.params.id_api_credentials)
                });
            }).catch(function (err) {
                console.error(err);
                req.session.toastr = [{
                        level: 'warning',
                        message: 'component.status.error.action_error'
                    }]
                var createObject = {}
                createObject["fk_id_status_" + nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_api_credentials_history_" + req.params.status.substring(2)] = req.params.id_api_credentials;
                models[historyModel].create(createObject).then(function () {
                    e_api_credentials['set' + entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/api_credentials/show?id=' + req.params.id_api_credentials)
                });
            });
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, errorRedirect, "e_user");
    });
});

router.post('/search', block_access.actionAccessMiddleware('api_credentials', 'read'), function (req, res) {
    var search = '%' + (req.body.search || '') + '%';
    var limit = SELECT_PAGE_SIZE;
    var offset = (req.body.page - 1) * limit;

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
        for (var param in req.body.customWhere){
            // If the custom where is on a foreign key
            if(param.indexOf("fk_") != -1){
                for (var option in options){
                    // We only add where condition on key that are standard hasMany relation, not belongsToMany association
                    if(options[option].otherKey == param && options[option].relation != "belongsToMany")
                        where.where[param] = req.body.customWhere[param];
                }
            } else
                where.where[param] = req.body.customWhere[param];
        }

    where.offset = offset;
    where.limit = limit;

    models.E_api_credentials.findAndCountAll(where).then(function (results) {
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

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("api_credentials", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_api_credentials.findOne({where: {id: idEntity}}).then(function (e_api_credentials) {
        if (!e_api_credentials) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_api_credentials['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_api_credentials['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            }).catch(function (err) {
                entity_helper.error(err, req, res, "/", "e_user");
            });
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/", "e_user");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("api_credentials", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_api_credentials.findOne({where: {id: idEntity}}).then(function (e_api_credentials) {
        if (!e_api_credentials) {
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
            return res.redirect('/api_credentials/show?id=' + idEntity + "#" + alias);
        }

        e_api_credentials['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/api_credentials/show?id=' + idEntity + "#" + alias);
        }).catch(function (err) {
            entity_helper.error(err, req, res, "/", "e_user");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, "/", "e_user");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("api_credentials", "delete"), function (req, res) {
    var id_e_api_credentials = parseInt(req.body.id);

    models.E_api_credentials.findOne({where: {id: id_e_api_credentials}}).then(function (deleteObject) {
        models.E_api_credentials.destroy({
            where: {
                id: id_e_api_credentials
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/api_credentials/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.removeFiles("e_api_credentials", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error(err, req, res, '/api_credentials/list', "e_user");
        });
    }).catch(function (err) {
        entity_helper.error(err, req, res, '/api_credentials/list', "e_user");
    });
});

module.exports = router;