var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filter_datatable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_inline_help');
var options = require('../models/options/e_inline_help');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var status_helper = require('../utils/status_helper');
var component_helper = require('../utils/component_helper');
var globalConfig = require('../config/global');
var fs = require('fs-extra');
var dust = require('dustjs-linkedin');
var moment = require("moment");
var SELECT_PAGE_SIZE = 10;

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');

router.get('/help/:entity/:field', function(req, res) {
    models.E_inline_help.findOne({
        where: {
            f_entity: 'e_' + req.params.entity,
            f_field: req.params.field
        }
    }).then(function(help) {
        if (!help)
            res.status(404).end();
        res.send(help.f_content);
    });
});

router.get('/list', block_access.actionAccessMiddleware("inline_help", "read"), function(req, res) {
    res.render('e_inline_help/list');
});

router.post('/datalist', block_access.actionAccessMiddleware("inline_help", "read"), function(req, res) {
    filterDataTable("E_inline_help", req.body).then(function(rawData) {
        entity_helper.prepareDatalistResult('e_inline_help', rawData, req.session.lang_user).then(function(preparedData) {
            var language = require('../services/language')(req.session.lang_user);

            for (var i = 0; i < preparedData.data.length; i++) {
                var row = preparedData.data[i];
                var entityTrad = 'entity.' + row.f_entity + '.label_entity';
                var fieldTrad = 'entity.' + row.f_entity + '.' + row.f_field;
                preparedData.data[i].f_entity = language.__(entityTrad);
                preparedData.data[i].f_field = language.__(fieldTrad);
            }

            res.send(preparedData).end();
        }).catch(function(err) {
            console.error(err);
            logger.debug(err);
            res.end();
        });
    }).catch(function(err) {
        console.error(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/subdatalist', block_access.actionAccessMiddleware("inline_help", "read"), function(req, res) {
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
        include: subentityInclude
    }
    if (search[searchTerm].length > 0)
        include.where = search;

    if (search[searchTerm].length > 0)
        include.where = search;

    if (doPagination == "true") {
        include.limit = length;
        include.offset = start;
    }

    include.required = false;

    models.E_inline_help.findOne({
        where: {
            id: parseInt(sourceId)
        },
        include: include
    }).then(function(e_inline_help) {
        if (!e_inline_help['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]) {
            console.error('/subdatalist: count' + entity_helper.capitalizeFirstLetter(subentityAlias) + ' is undefined');
            return res.status(500).end();
        }

        e_inline_help['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]().then(function(count) {
            var rawData = {
                recordsTotal: count,
                recordsFiltered: count,
                data: []
            };
            for (var i = 0; i < e_inline_help[subentityAlias].length; i++)
                rawData.data.push(e_inline_help[subentityAlias][i].get({plain: true}));

            entity_helper.prepareDatalistResult(req.query.subentityModel, rawData, req.session.lang_user).then(function(preparedData) {
                res.send(preparedData).end();
            }).catch(function(err) {
                console.error(err);
                logger.debug(err);
                res.end();
            });
        });
    });
});

router.get('/show', block_access.actionAccessMiddleware("inline_help", "read"), function(req, res) {
    var id_e_inline_help = req.query.id;
    var tab = req.query.tab;
    var data = {
        tab: tab,
        enum_radio: enums_radios.translated("e_inline_help", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined')
        data.hideButton = req.query.hideButton;

    entity_helper.optimizedFindOne('E_inline_help', id_e_inline_help, options).then(function(e_inline_help) {
        if (!e_inline_help) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Update local e_inline_help data before show */
        var entity = e_inline_help.f_entity;
        e_inline_help.f_entity = 'entity.' + entity + '.label_entity';
        e_inline_help.f_field = 'entity.' + entity + '.' + e_inline_help.f_field;
        data.e_inline_help = e_inline_help;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_inline_help, "e_inline_help").then(function() {
            status_helper.translate(e_inline_help, attributes, req.session.lang_user);
            data.componentAddressConfig = component_helper.getMapsConfigIfComponentAddressExist("e_inline_help");
            // Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
            entity_helper.getLoadOnStartData(data, options).then(function(data) {
                res.render('e_inline_help/show', data);
            }).catch(function(err) {
                entity_helper.error(err, req, res, "/", "e_inline_help");
            })
        }).catch(function(err) {
            entity_helper.error(err, req, res, "/", "e_inline_help");
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, "/", "e_inline_help");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("inline_help", "create"), function(req, res) {
    var data = {
        enum_radio: enums_radios.translated("e_inline_help", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var entities = [];
    fs.readdirSync(__dirname + '/../models/attributes/').filter(function(file) {
        return file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file.substring(0, 2) == 'e_';
    }).forEach(function(file) {
        var fields = [];
        var attributesObj = JSON.parse(fs.readFileSync(__dirname + '/../models/attributes/' + file));
        var optionsObj = JSON.parse(fs.readFileSync(__dirname + '/../models/options/' + file));
        var entityName = file.substring(0, file.length - 5);
        for (var field in attributesObj)
            if (field != 'id' && field != 'version' && field.indexOf('f_') == 0)
                fields.push({
                    tradKey: 'entity.' + entityName + '.' + field,
                    field: field
                });
        for (var i = 0; i < optionsObj.length; i++)
            if (optionsObj[i].structureType == 'relatedTo' || optionsObj[i].structureType == 'relatedToMany')
                fields.push({
                    tradKey: 'entity.' + entityName + '.' + optionsObj[i].as,
                    field: optionsObj[i].as
                });
        if (fields.length > 0)
            entities.push({
                tradKey: 'entity.' + entityName + '.label_entity',
                entity: entityName,
                fields: fields
            });
    });
    data.entities = entities;
    res.render('e_inline_help/create', data);
});

router.post('/create', block_access.actionAccessMiddleware("inline_help", "create"), function(req, res) {

    var createObject = {
        f_entity: req.body.f_entity,
        f_field: req.body.f_field.split('.')[1],
        f_content: req.body.f_content
    };

    models.E_inline_help.create(createObject).then(function(e_inline_help) {
        var redirect = '/inline_help/show?id=' + e_inline_help.id;
        req.session.toastr = [{
            message: 'message.create.success',
            level: "success"
        }];

        var promises = [];

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            promises.push(new Promise(function(resolve, reject) {
                models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({
                    where: {
                        id: req.body.associationFlag
                    }
                }).then(function(association) {
                    if (!association) {
                        e_inline_help.destroy();
                        var err = new Error();
                        err.message = "Association not found.";
                        reject(err);
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined') {
                        association['add' + modelName](e_inline_help.id).then(_ => {
                            if(globalConfig.env == "tablet"){
                                // Write add association to synchro journal
                                entity_helper.synchro.writeJournal({
                                    verb: "associate",
                                    id: req.body.associationFlag,
                                    target: "e_inline_help",
                                    entityName: req.body.associationSource,
                                    func: 'add' + modelName,
                                    ids: e_inline_help.id
                                });
                            }
                            resolve();
                        }).catch(function(err) {
                            reject(err);
                        });
                    } else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = e_inline_help.id;
                        association.update(obj).then(resolve).catch(function(err) {
                            reject(err);
                        });
                    }
                });
            }));
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        promises.push(model_builder.setAssocationManyValues(e_inline_help, req.body, createObject, options));

        Promise.all(promises).then(function() {
            res.redirect(redirect);
        }).catch(function(err) {
            entity_helper.error(err, req, res, '/inline_help/create_form', "e_inline_help");
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, '/inline_help/create_form', "e_inline_help");
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("inline_help", "update"), function(req, res) {
    var id_e_inline_help = req.query.id;
    var data = {
        enum_radio: enums_radios.translated("e_inline_help", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    entity_helper.optimizedFindOne('E_inline_help', id_e_inline_help, options).then(function(e_inline_help) {
        if (!e_inline_help) {
            data.error = 404;
            return res.render('common/error', data);
        }

        e_inline_help.dataValues.enum_radio = data.enum_radio;

        var entity = e_inline_help.f_entity;
        e_inline_help.f_entity = 'entity.' + entity + '.label_entity';
        e_inline_help.f_field = 'entity.' + entity + '.' + e_inline_help.f_field;
        data.e_inline_help = e_inline_help;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_inline_help, "e_inline_help", true).then(function() {
            // Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
            entity_helper.getLoadOnStartData(req.query.ajax ? e_inline_help.dataValues : data, options).then(function(data) {
                if (req.query.ajax) {
                    e_inline_help.dataValues = data;
                    res.render('e_inline_help/update_fields', e_inline_help.get({
                        plain: true
                    }));
                } else
                    res.render('e_inline_help/update', data);
            }).catch(function(err) {
                entity_helper.error(err, req, res, "/", "e_inline_help");
            })
        }).catch(function(err) {
            entity_helper.error(err, req, res, "/", "e_inline_help");
        })
    }).catch(function(err) {
        entity_helper.error(err, req, res, "/", "e_inline_help");
    })
});

router.post('/update', block_access.actionAccessMiddleware("inline_help", "update"), function(req, res) {
    var id_e_inline_help = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_inline_help.findOne({
        where: {
            id: id_e_inline_help
        }
    }).then(function(e_inline_help) {
        if (!e_inline_help) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }
        component_helper.updateAddressIfComponentExist(e_inline_help, options, req.body);
        e_inline_help.update(updateObject).then(function() {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_inline_help, req.body, updateObject, options).then(function() {

                var redirect = '/inline_help/show?id=' + id_e_inline_help;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

                res.redirect(redirect);
            }).catch(function(err) {
                entity_helper.error(err, req, res, '/inline_help/update_form?id=' + id_e_inline_help, "e_inline_help");
            });
        }).catch(function(err) {
            entity_helper.error(err, req, res, '/inline_help/update_form?id=' + id_e_inline_help, "e_inline_help");
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, '/inline_help/update_form?id=' + id_e_inline_help, "e_inline_help");
    });
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('inline_help', 'read'), function(req, res) {
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

    var queryOpts = {
        where: {
            id: id
        }
    };
    // If hasMany, no need to include anything since it will be fetched using /subdatalist
    if (option.structureType != 'hasMany')
        queryOpts.include = {
            model: models[entity_helper.capitalizeFirstLetter(option.target)],
            as: option.as,
            include: {
                all: true
            }
        }

    // Fetch tab data
    models.E_inline_help.findOne(queryOpts).then(function(e_inline_help) {
        if (!e_inline_help)
            return res.status(404).end();

        var dustData = e_inline_help[option.as] || null;
        var empty = !dustData || (dustData instanceof Array && dustData.length == 0) ? true : false;
        var dustFile, idSubentity, promisesData = [];
        var subentityOptions = [];

        // Default value
        option.noCreateBtn = false;

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
                    var subentityOptions = require('../models/options/' + option.target);
                    dustData.componentAddressConfig = component_helper.getMapsConfigIfComponentAddressExist(option.target);
                    for (var i = 0; i < subentityOptions.length; i++)
                        if (subentityOptions[i].target.indexOf('e_status') == 0)
                            (function(alias) {
                                promisesData.push(new Promise(function(resolve, reject) {
                                    dustData[alias].getR_children({
                                        include: [{
                                            model: models.E_group,
                                            as: "r_accepted_group"
                                        }]
                                    }).then(function(children) {
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
                dustData = {
                    for: 'hasMany'
                };
                if (typeof req.query.associationFlag !== 'undefined') {
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
                if (typeof req.query.associationFlag !== 'undefined') {
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

        // Get association data that needed to be load directly here (to do so set loadOnStart param to true in options).
        entity_helper.getLoadOnStartData(dustData, subentityOptions).then(function(dustData) {
            // Image buffer promise
            Promise.all(promisesData).then(function() {
                // Open and render dust file
                var file = fs.readFileSync(__dirname + '/../views/' + dustFile + '.dust', 'utf8');
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
    }).catch(function(err) {
        console.error(err);
        res.status(500).send(err);
    });
});

router.get('/set_status/:id_inline_help/:status/:id_new_status', block_access.actionAccessMiddleware("inline_help", "read"), block_access.statusGroupAccess, function(req, res) {
    status_helper.setStatus('e_inline_help', req.params.id_inline_help, req.params.status, req.params.id_new_status, req.session.passport.user.id, req.query.comment).then(()=> {
        res.redirect(req.headers.referer);
    }).catch((err)=> {
        entity_helper.error(err, req, res, '/inline_help/show?id=' + req.params.id_inline_help, "e_inline_help");
    });
});

router.post('/search', block_access.actionAccessMiddleware('inline_help', 'read'), function(req, res) {
    var search = '%' + (req.body.search || '') + '%';
    var limit = SELECT_PAGE_SIZE;
    var offset = (req.body.page - 1) * limit;

    // ID is always needed
    if (req.body.searchField.indexOf("id") == -1)
        req.body.searchField.push('id');

    var where = {
        raw: true,
        attributes: req.body.searchField,
        where: {}
    };
    if (search != '%%') {
        if (req.body.searchField.length == 1) {
            where.where[req.body.searchField[0]] = {
                $like: search
            };
        } else {
            where.where.$or = [];
            for (var i = 0; i < req.body.searchField.length; i++) {
                if (req.body.searchField[i] != "id") {
                    var currentOrObj = {};
                    if(req.body.searchField[i].indexOf(".") != -1){
                        currentOrObj["$"+req.body.searchField[i]+"$"] = {
                            $like: search
                        }
                    } else {
                        currentOrObj[req.body.searchField[i]] = {
                            $like: search
                        }
                    }
                    where.where.$or.push(currentOrObj);
                }
            }
        }
    }

    // Example custom where in select HTML attributes, please respect " and ':
    // data-customwhere='{"myField": "myValue"}'

    // Notice that customwhere feature do not work with related to many field if the field is a foreignKey !

    // Possibility to add custom where in select2 ajax instanciation
    if (typeof req.body.customwhere !== "undefined"){
        // If customwhere from select HTML attribute, we need to parse to object
        if(typeof req.body.customwhere === "string")
            req.body.customwhere = JSON.parse(req.body.customwhere);
        for (var param in req.body.customwhere) {
            // If the custom where is on a foreign key
            if (param.indexOf("fk_") != -1) {
                for (var option in options) {
                    // We only add where condition on key that are standard hasMany relation, not belongsToMany association
                    if ((options[option].foreignKey == param || options[option].otherKey == param) && options[option].relation != "belongsToMany"){
                        // Where on include managment if fk
                        if(param.indexOf(".") != -1){
                            where.where["$"+param+"$"] = req.body.customwhere[param];
                        } else {
                            where.where[param] = req.body.customwhere[param];
                        }
                    }
                }
            } else {
                if(param.indexOf(".") != -1){
                    where.where["$"+param+"$"] = req.body.customwhere[param];
                } else {
                    where.where[param] = req.body.customwhere[param];
                }
            }
        }
    }

    where.offset = offset;
    where.limit = limit;

    // If you need to show fields in the select that are in an other associate entity
    // You have to include those entity here
    // where.include = [{model: models.E_myentity, as: "r_myentity"}]

    models.E_inline_help.findAndCountAll(where).then(function(results) {
        results.more = results.count > req.body.page * SELECT_PAGE_SIZE ? true : false;
        // Format value like date / datetime / etc...
        for (var field in attributes)
            for (var i = 0; i < results.rows.length; i++)
                for (var fieldSelect in results.rows[i])
                    if(fieldSelect == field)
                        switch(attributes[field].newmipsType) {
                            case "date":
                                if(results.rows[i][fieldSelect] && results.rows[i][fieldSelect] != "")
                                    results.rows[i][fieldSelect] = moment(results.rows[i][fieldSelect]).format(req.session.lang_user == "fr-FR" ? "DD/MM/YYYY" : "YYYY-MM-DD")
                                break;
                            case "datetime":
                                if(results.rows[i][fieldSelect] && results.rows[i][fieldSelect] != "")
                                    results.rows[i][fieldSelect] = moment(results.rows[i][fieldSelect]).format(req.session.lang_user == "fr-FR" ? "DD/MM/YYYY HH:mm" : "YYYY-MM-DD HH:mm")
                                break;
                        }

        res.json(results);
    }).catch(function(e) {
        console.error(e);
        res.status(500).json(e);
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("inline_help", "delete"), function(req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_inline_help.findOne({
        where: {
            id: idEntity
        }
    }).then(function(e_inline_help) {
        if (!e_inline_help) {
            var data = {
                error: 404
            };
            return res.render('common/error', data);
        }

        // Get all associations
        e_inline_help['remove' + entity_helper.capitalizeFirstLetter(alias)](idToRemove).then(aliasEntities => {

            if(globalConfig.env == "tablet"){
                let target = "";
                for (let i = 0; i < options.length; i++)
                    if (options[i].as == alias)
                        {target = options[i].target; break;}
                entity_helper.synchro.writeJournal({
                    verb: "associate",
                    id: idEntity,
                    target: target,
                    entityName: "e_inline_help",
                    func: 'remove' + entity_helper.capitalizeFirstLetter(alias),
                    ids: idToRemove
                });
            }

            res.sendStatus(200).end();
        }).catch(function(err) {
            entity_helper.error(err, req, res, "/", "e_inline_help");
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, "/", "e_inline_help");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("inline_help", "create"), function(req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_inline_help.findOne({
        where: {
            id: idEntity
        }
    }).then(function(e_inline_help) {
        if (!e_inline_help) {
            var data = {
                error: 404
            };
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        var toAdd;
        if (typeof(toAdd = req.body.ids) === 'undefined') {
            req.session.toastr.push({
                message: 'message.create.failure',
                level: "error"
            });
            return res.redirect('/inline_help/show?id=' + idEntity + "#" + alias);
        }

        e_inline_help['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function() {
            res.redirect('/inline_help/show?id=' + idEntity + "#" + alias);
        }).catch(function(err) {
            entity_helper.error(err, req, res, "/", "e_inline_help");
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, "/", "e_inline_help");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("inline_help", "delete"), function(req, res) {
    var id_e_inline_help = parseInt(req.body.id);

    models.E_inline_help.findOne({
        where: {
            id: id_e_inline_help
        }
    }).then(function(deleteObject) {
        if (!deleteObject) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }
        deleteObject.destroy().then(function() {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/inline_help/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.removeFiles("e_inline_help", deleteObject, attributes);
        }).catch(function(err) {
            entity_helper.error(err, req, res, '/inline_help/list', "e_inline_help");
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, '/inline_help/list', "e_inline_help");
    });
});

module.exports = router;