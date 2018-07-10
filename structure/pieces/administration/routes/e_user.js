var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_user');
var options = require('../models/options/e_user');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var component_helper = require('../utils/component_helper');
var globalConfig = require('../config/global');
var fs = require('fs-extra');
var dust = require('dustjs-linkedin');
var SELECT_PAGE_SIZE = 10;

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');

router.get('/list', block_access.actionAccessMiddleware("user", "read"), function (req, res) {
    var data = {
        "menu": "e_user",
        "sub_menu": "list_e_user"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_user/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("user", "read"), function (req, res) {

    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options, req.body.columns);
    filterDataTable("E_user", req.body, include).then(function (data) {

        var statusPromises = [];
        if (entity_helper.status.statusFieldList(attributes).length > 0)
            for (var i = 0; i < data.data.length; i++)
                statusPromises.push(entity_helper.status.currentStatus(models, "e_user", data.data[i], attributes, req.session.lang_user));

        Promise.all(statusPromises).then(function() {
            // Replace data enum value by translated value for datalist
            var enumsTranslation = enums_radios.translated("e_user", req.session.lang_user, options);
            var todo = [];
            for (var i = 0; i < data.data.length; i++) {
                for (var field in data.data[i].dataValues) {
                    // Look for enum translation
                    for (var enumEntity in enumsTranslation)
                        for (var enumField in enumsTranslation[enumEntity])
                            if (enumField == field)
                                for (var j = 0; j < enumsTranslation[enumEntity][enumField].length; j++)
                                    if (enumsTranslation[enumEntity][enumField][j].value == data.data[i].dataValues[field]) {
                                        data.data[i].dataValues[field] = enumsTranslation[enumEntity][enumField][j].translation;
                                        break;
                                    }

                    //get attribute value
                    var value = data.data[i].dataValues[field];
                    //for type picture, get thumbnail picture
                    if (typeof attributes[field] != 'undefined' && attributes[field].newmipsType == 'picture' && value != null) {
                        var partOfFile = value.split('-');
                        if (partOfFile.length > 1) {
                            //if field value have valide picture name, add new task in todo list
                            //we will use todo list to get all pictures binary
                            var thumbnailFolder = globalConfig.thumbnail.folder;
                            var filePath = thumbnailFolder + 'e_user/' + partOfFile[0] + '/' + value;
                            todo.push({
                                value: value,
                                file: filePath,
                                field: field,
                                dataIndex: i
                            });
                        }
                    }
                }
            }

            // Delete users sensitive informations
            for (var i = 0; i < data.data.length; i++) {
                var user = data.data[i];
                user.f_password = undefined;
                user.f_token_password_reset = undefined;
                user.f_enabled = undefined;
            }

            //check if we have to get some picture buffer before send data
            if (todo.length) {
                var counter=0;
                for (var i = 0; i < todo.length; i++) {
                    (function (task) {
                        file_helper.getFileBuffer64(task.file, function (success, buffer) {
                            counter++;
                            data.data[task.dataIndex].dataValues[task.field] = {
                                value: task.value,
                                buffer: buffer
                            };
                            if (counter === todo.length)
                                res.send(data).end();

                        });
                    }(todo[i]));
                }
            } else
                res.send(data).end();
        });
    }).catch(function (err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/subdatalist', block_access.actionAccessMiddleware("user", "read"), function (req, res) {
    var start = parseInt(req.body.start || 0);
    var length = parseInt(req.body.length || 10);

    var sourceId = req.query.sourceId;
    var subentityAlias = req.query.subentityAlias;
    var subentityModel = entity_helper.capitalizeFirstLetter(req.query.subentityModel);
    var doPagination = req.query.paginate;

    var queryAttributes = [];
    for (var i = 0; i < req.body.columns.length; i++)
        if (req.body.columns[i].searchable == 'true')
            queryAttributes.push(req.body.columns[i].data);

    var include = {
        model: models[subentityModel],
        as: subentityAlias,
        include: {all: true}
    }
    if (doPagination == "true") {
        include.limit = length;
        include.offset = start;
    }

    models.E_user.findOne({
        where: {id: parseInt(sourceId)},
        include: include
    }).then(function (e_user) {
        if (!e_user['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]) {
            console.error('/subdatalist: count' + entity_helper.capitalizeFirstLetter(subentityAlias) + ' is undefined');
            return res.status(500).end();
        }

        e_user['count' + entity_helper.capitalizeFirstLetter(subentityAlias)]().then(function (count) {
            var rawData = {
                recordsTotal: count,
                recordsFiltered: count,
                data: []
            };
            for (var i = 0; i < e_user[subentityAlias].length; i++)
                rawData.data.push(e_user[subentityAlias][i].get({plain: true}));

            entity_helper.prepareDatalistResult(req.query.subentityModel, rawData, req.session.lang_user).then(function (preparedData) {
                res.send(preparedData).end();
            }).catch(function (err) {
                console.log(err);
                logger.debug(err);
                res.end();
            });
        });
    });
});

router.get('/show', block_access.actionAccessMiddleware("user", "read"), function (req, res) {
    var id_e_user = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_user",
        sub_menu: "list_e_user",
        tab: tab,
        enum_radio: enums_radios.translated("e_user", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined')
        data.hideButton = req.query.hideButton;

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.E_user.findOne({attributes: {exclude: ['f_password', 'f_token_password_reset', 'f_enabled']}, where: {id: id_e_user}, include: include}).then(function (e_user) {
        if (!e_user) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Update local e_user data before show */
        data.e_user = e_user;
        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function (found) {
            for (var i = 0; i < found.length; i++) {
                data.e_user[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            // Update some data before show, e.g get picture binary
            e_user = entity_helper.getPicturesBuffers(e_user, attributes, options, "e_user");
            entity_helper.status.translate(e_user, attributes, req.session.lang_user);
            res.render('e_user/show', data);
       });

    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("user", "create"), function (req, res) {
    var data = {
        menu: "e_user",
        sub_menu: "create_e_user",
        enum_radio: enums_radios.translated("e_user", req.session.lang_user, options)
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
        for (var i = 0; i < found.length; i++)
            data[found[i].model] = found[i].rows;
        var view = req.query.ajax ? 'e_user/create_fields' : 'e_user/create';
        res.render(view, data);
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/create', block_access.actionAccessMiddleware("user", "create"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    // Make sure it's impossible to set sensitive information through create form
    createObject.f_token_password_reset = undefined;
    createObject.f_enabled = 0;
    createObject.f_password = undefined;

    models.E_user.create(createObject).then(function (e_user) {
        var redirect = '/user/show?id='+e_user.id;
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
                        e_user.destroy();
                        var err = new Error();
                        err.message = "Association not found.";
                        reject(err);
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined'){
                        association['add' + modelName](e_user.id).then(resolve).catch(function(err){
                            reject(err);
                        });
                    } else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = e_user.id;
                        association.update(obj).then(resolve).catch(function(err){
                            reject(err);
                        });
                    }
                });
            }));
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        model_builder.setAssocationManyValues(e_user, req.body, createObject, options).then(function(){
            Promise.all(promises).then(function() {
                res.redirect(redirect);
            }).catch(function(err){
                entity_helper.error500(err, req, res, '/user/create_form');
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/user/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("user", "update"), function (req, res) {
    var id_e_user = req.query.id;
    var data = {
        menu: "e_user",
        sub_menu: "list_e_user",
        enum_radio: enums_radios.translated("e_user", req.session.lang_user, options)
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
        models.E_user.findOne({attributes: {exclude: ['f_password', 'f_token_password_reset', 'f_enabled']}, where: {id: id_e_user}, include: [{all: true}]}).then(function (e_user) {
            if (!e_user) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_user = e_user;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can find adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_user[name_global_list] = rows;

                // Set associated property to item that are related to be able to make them selected client side
                if (rows.length > 1)
                    for (var j = 0; j < data[model].length; j++)
                        if (e_user[model] != null)
                            for (var k = 0; k < e_user[model].length; k++)
                                if (data[model][j].id == e_user[model][k].id)
                                    data[model][j].dataValues.associated = true;
            }

            req.session.toastr = [];
            if (req.query.ajax) {
                res.render('e_user/update_fields', e_user.get({plain: true}));
            } else
                res.render('e_user/update', data);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("user", "update"), function (req, res) {
    var id_e_user = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    var redirect = '/user/show?id=' + id_e_user;
    // If we are in user settings,then he cannot modify sensible data, and we redirect differently
    if(req.body.is_settings){
        delete updateObject.f_login;
        delete updateObject.r_role;
        delete updateObject.r_group;
        redirect = '/user/settings';
    }

    models.E_user.findOne({where: {id: id_e_user}}).then(function (e_user) {
        if (!e_user) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        updateObject.f_token_password_reset = undefined;
        updateObject.f_enabled = undefined;
        updateObject.f_password = undefined;
        e_user.update(updateObject).then(function () {
            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_user, req.body, updateObject, options).then(function () {
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

                res.redirect(redirect);
            });
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/user/update_form?id=' + id_e_user);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/user/update_form?id=' + id_e_user);
    });
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('user', 'read'), function (req, res) {
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
    models.E_user.findOne(queryOpts).then(function (e_user) {
        if (!e_user)
            return res.status(404).end();

        var dustData = e_user[option.as] || null;
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

router.get('/set_status/:id_user/:status/:id_new_status', block_access.actionAccessMiddleware("user", "update"), function(req, res) {
    var historyModel = 'E_history_e_user_'+req.params.status;
    var historyAlias = 'r_history_'+req.params.status.substring(2);
    var statusAlias = 'r_'+req.params.status.substring(2);

    var errorRedirect = '/user/show?id='+req.params.id_user;
    // Find target entity instance
    models.E_user.findOne({
        where: {id: req.params.id_user},
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
    }).then(function(e_user) {
        if (!e_user || !e_user[historyAlias] || !e_user[historyAlias][0][statusAlias]){
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {id: e_user[historyAlias][0][statusAlias].id},
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
                        include: [{all: true, nested: true}]
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
            nextStatus.executeActions(e_user).then(function() {
                // Create history record for this status field
                // Beeing the most recent history for user it will now be its current status
                var createObject = {}
                createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_user_history_"+req.params.status.substring(2)] = req.params.id_user;
                models[historyModel].create(createObject).then(function() {
                    e_user['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/user/show?id='+req.params.id_user)
                });
            });
        });
    }).catch(function(err) {
        entity_helper.error500(err, req, res, errorRedirect);
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("user", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_user.findOne({where: {id: idEntity}}).then(function (e_user) {
        if (!e_user) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_user['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_user['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("user", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_user.findOne({where: {id: idEntity}}).then(function (e_user) {
        if (!e_user) {
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
            return res.redirect('/user/show?id=' + idEntity + "#" + alias);
        }

        e_user['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/user/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("user", "delete"), function (req, res) {
    var id_e_user = parseInt(req.body.id);

    models.E_user.findOne({where: {id: id_e_user}}).then(function (deleteObject) {
        models.E_user.destroy({
            where: {
                id: id_e_user
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/user/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.remove_files("e_user", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/user/list');
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/user/list');
    });
});

router.post('/search', block_access.actionAccessMiddleware('user', 'read'), function (req, res) {
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

    // /!\ DISABLED FOR USER /!\
    // Possibility to add custom where in select2 ajax instanciation
    // if (typeof req.body.customWhere !== "undefined")
    //     for (var param in req.body.customWhere)
    //         where.where[param] = req.body.customWhere[param];

    where.offset = offset;
    where.limit = limit;
    where.include = [{model: models.E_role, as:'r_role'}, {model: models.E_group, as: 'r_group'}];
    models.E_user.findAndCountAll(where).then(function (results) {
        results.more = results.count > req.body.page * SELECT_PAGE_SIZE ? true : false;
        res.json(results);
    }).catch(function (e) {
        console.error(e);
        res.status(500).json(e);
    });
});

router.get('/settings', block_access.isLoggedIn, function(req, res) {
    var id_e_user = req.session.passport && req.session.passport.user ? req.session.passport.user.id : 1;
    var data = {
        menu: "e_user",
        sub_menu: "list_e_user",
        enum_radio: enums_radios.translated("e_user", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var associationsFinder = model_builder.associationsFinder(models, options);

    Promise.all(associationsFinder).then(function(found) {
        models.E_user.findOne({where: {id: id_e_user}, include: [{all: true}]}).then(function(e_user) {
            if (!e_user) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_user = e_user;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can found adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_user[name_global_list] = rows;

                if (rows.length > 1)
                    for(var j = 0; j < data[model].length; j++)
                        if(e_user[model] != null)
                            for (var k = 0; k < e_user[model].length; k++)
                                if (data[model][j].id == e_user[model][k].id)
                                    data[model][j].dataValues.associated = true;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];

            // Used to hide role/group inputs
            data.isSettings = true;
            req.session.formSettings = true;
            res.render('e_user/settings', data);
        }).catch(function(err){
            error500(err, res);
        });
    }).catch(function(err){
        var isKnownError = false;
        try {
            // Unique value constraint
            if (err.parent.errno == 1062 || err.parent.code == 23505) {
                req.session.toastr.push({level: 'error', message: err.errors[0].message});
                isKnownError = true;
            }
        } finally {
            if (isKnownError)
                return res.render('e_user/settings', data);
            error500(err, res);
        }
    });
});

module.exports = router;