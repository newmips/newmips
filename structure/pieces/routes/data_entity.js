var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/ENTITY_NAME');
var options = require('../models/options/ENTITY_NAME');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var globalConfig = require('../config/global');
var fs = require('fs-extra');
var dust = require('dustjs-linkedin');

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');

router.get('/list', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "read"), function (req, res) {
    var data = {
        "menu": "ENTITY_NAME",
        "sub_menu": "list_ENTITY_NAME"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('ENTITY_NAME/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "read"), function (req, res) {

    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options);
    filterDataTable("MODEL_NAME", req.body, include).then(function (data) {

        var statusPromises = [];
        if (entity_helper.status.statusFieldList(attributes).length > 0)
            for (var i = 0; i < data.data.length; i++)
                statusPromises.push(entity_helper.status.currentStatus(models, "ENTITY_NAME", data.data[i], attributes, req.session.lang_user));

        Promise.all(statusPromises).then(function() {
            // Replace data enum value by translated value for datalist
            var enumsTranslation = enums_radios.translated("ENTITY_NAME", req.session.lang_user, options);
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
                            var filePath = thumbnailFolder + 'ENTITY_NAME/' + partOfFile[0] + '/' + value;
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

router.get('/show', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "read"), function (req, res) {
    var id_ENTITY_NAME = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "ENTITY_NAME",
        sub_menu: "list_ENTITY_NAME",
        tab: tab,
        enum_radio: enums_radios.translated("ENTITY_NAME", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined')
        data.hideButton = req.query.hideButton;

    var relatedToList = [];
    for (var i = 0; i < options.length; i++)
        if (options[i].structureType == 'relatedTo' || options[i].structureType == 'relatedToMultiple') {
            var opt = {
                model: models[entity_helper.capitalizeFirstLetter(options[i].target)],
                as: options[i].as
            };
            // Include status children
            if (options[i].target == 'e_status')
                opt.include = {model: models.E_status, as: 'r_children'};
            relatedToList.push(opt);
        }

    entity_helper.optimizedFindOne('MODEL_NAME', id_ENTITY_NAME, relatedToList).then(function(ENTITY_NAME){
        if (!ENTITY_NAME) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Update local ENTITY_NAME data before show */
        data.ENTITY_NAME = ENTITY_NAME;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(ENTITY_NAME, "ENTITY_NAME").then(function() {
            entity_helper.status.translate(ENTITY_NAME, attributes, req.session.lang_user);
            res.render('ENTITY_NAME/show', data);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "create"), function (req, res) {
    var data = {
        menu: "ENTITY_NAME",
        sub_menu: "create_ENTITY_NAME",
        enum_radio: enums_radios.translated("ENTITY_NAME", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var view = req.query.ajax ? 'ENTITY_NAME/create_fields' : 'ENTITY_NAME/create';
    res.render(view, data);
});

router.post('/create', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "create"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);

    models.MODEL_NAME.create(createObject).then(function (ENTITY_NAME) {
        var redirect = '/ENTITY_URL_NAME/show?id='+ENTITY_NAME.id;
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
                        ENTITY_NAME.destroy();
                        var err = new Error();
                        err.message = "Association not found.";
                        reject(err);
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined'){
                        association['add' + modelName](ENTITY_NAME.id).then(resolve).catch(function(err){
                            reject(err);
                        });
                    } else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = ENTITY_NAME.id;
                        association.update(obj).then(resolve).catch(function(err){
                            reject(err);
                        });
                    }
                });
            }));
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        model_builder.setAssocationManyValues(ENTITY_NAME, req.body, createObject, options).then(function(){
            Promise.all(promises).then(function() {
                res.redirect(redirect);
            }).catch(function(err){
                entity_helper.error500(err, req, res, '/ENTITY_URL_NAME/create_form');
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/ENTITY_URL_NAME/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "update"), function (req, res) {
    var id_ENTITY_NAME = req.query.id;
    var data = {
        menu: "ENTITY_NAME",
        sub_menu: "list_ENTITY_NAME",
        enum_radio: enums_radios.translated("ENTITY_NAME", req.session.lang_user, options)
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

    entity_helper.optimizedFindOne('MODEL_NAME', id_ENTITY_NAME, relatedToList).then(function(ENTITY_NAME){
        if (!ENTITY_NAME) {
            data.error = 404;
            return res.render('common/error', data);
        }

        data.ENTITY_NAME = ENTITY_NAME;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(ENTITY_NAME, "ENTITY_NAME", true).then(function() {
            if (req.query.ajax) {
                ENTITY_NAME.dataValues.enum_radio = data.enum_radio;
                res.render('ENTITY_NAME/update_fields', ENTITY_NAME.get({plain: true}));
            }
            else
                res.render('ENTITY_NAME/update', data);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "update"), function (req, res) {
    var id_ENTITY_NAME = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.MODEL_NAME.findOne({where: {id: id_ENTITY_NAME}}).then(function (ENTITY_NAME) {
        if (!ENTITY_NAME) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        ENTITY_NAME.update(updateObject).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(ENTITY_NAME, req.body, updateObject, options).then(function () {

                var redirect = '/ENTITY_URL_NAME/show?id=' + id_ENTITY_NAME;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

                res.redirect(redirect);
            });
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/ENTITY_URL_NAME/update_form?id=' + id_ENTITY_NAME);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/ENTITY_URL_NAME/update_form?id=' + id_ENTITY_NAME);
    });
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('ENTITY_URL_NAME', 'read'), function(req, res) {
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
    models.MODEL_NAME.findOne({
        where: {id: id},
        include: [{
            model: models[entity_helper.capitalizeFirstLetter(option.target)],
            as: option.as,
            include: {all: true}
        }]
    }).then(function(ENTITY_URL_NAME) {
        if (!ENTITY_URL_NAME)
            return res.status(404).end();

        var dustData = ENTITY_URL_NAME[option.as];
        var empty = !dustData || (dustData instanceof Array && dustData.length == 0) ? true : false;
        var dustFile, idSubentity, promisesData = [];

        // Build tab specific variables
        switch (option.structureType) {
            case 'hasOne':
                if (!empty) {
                    idSubentity = ENTITY_URL_NAME[option.as].id;
                    ENTITY_URL_NAME[option.as].hideTab = true;
                    dustData.enum_radio = enums_radios.translated(option.target, req.session.lang_user, options);
                    promisesData.push(entity_helper.getPicturesBuffers(ENTITY_URL_NAME[option.as], option.target));
                }
                dustFile = option.target+'/show_fields';
            break;

            case 'hasMany':
            case 'hasManyPreset':
                dustFile = option.target+'/list_fields';
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

router.get('/set_status/:id_ENTITY_URL_NAME/:status/:id_new_status', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "update"), function(req, res) {
    var historyModel = 'E_history_ENTITY_NAME_'+req.params.status;
    var historyAlias = 'r_history_'+req.params.status.substring(2);
    var statusAlias = 'r_'+req.params.status.substring(2);

    var errorRedirect = '/ENTITY_URL_NAME/show?id='+req.params.id_ENTITY_URL_NAME;

    var includeTree = entity_helper.status.generateEntityInclude(models, 'ENTITY_NAME');

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
    models.MODEL_NAME.findOne({
        where: {id: req.params.id_ENTITY_URL_NAME},
        include: includeTree
    }).then(function(ENTITY_NAME) {
        if (!ENTITY_NAME || !ENTITY_NAME[historyAlias] || !ENTITY_NAME[historyAlias][0][statusAlias]){
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {id: ENTITY_NAME[historyAlias][0][statusAlias].id},
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
            nextStatus.executeActions(ENTITY_NAME).then(function() {
                // Create history record for this status field
                // Beeing the most recent history for ENTITY_URL_NAME it will now be its current status
                var createObject = {}
                createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_ENTITY_URL_NAME_history_"+req.params.status.substring(2)] = req.params.id_ENTITY_URL_NAME;
                models[historyModel].create(createObject).then(function() {
                    ENTITY_NAME['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/ENTITY_URL_NAME/show?id='+req.params.id_ENTITY_URL_NAME)
                });
            }).catch(function(err) {
                console.error(err);
                req.session.toastr = [{
                    level: 'warning',
                    message: 'component.status.error.action_error'
                }]
                var createObject = {}
                createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_ENTITY_URL_NAME_history_"+req.params.status.substring(2)] = req.params.id_ENTITY_URL_NAME;
                models[historyModel].create(createObject).then(function() {
                    ENTITY_NAME['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/ENTITY_URL_NAME/show?id='+req.params.id_ENTITY_URL_NAME)
                });
            });
        });
    }).catch(function(err) {
        entity_helper.error500(err, req, res, errorRedirect);
    });
});

router.post('/search', block_access.actionAccessMiddleware('ENTITY_URL_NAME','read'), function(req, res) {
    var search = '%'+(req.body.search||'')+'%';

    // ID is always needed
    if(req.body.searchField.indexOf("id") == -1)
        req.body.searchField.push('id');

    var where = {raw: true, attributes: req.body.searchField, where: {}};
    if (search != '%%'){
        if(req.body.searchField.length == 1){
            where.where[req.body.searchField[0]] = {$like: search};
        } else {
            where.where.$or = [];
            for(var i=0; i<req.body.searchField.length; i++){
                if(req.body.searchField[i] != "id"){
                    var currentOrObj = {};
                    currentOrObj[req.body.searchField[i]] = {$like: search}
                    where.where.$or.push(currentOrObj);
                }
            }
        }
    }

    // Possibility to add custom where in select2 ajax instanciation
    if(typeof req.body.customWhere !== "undefined")
        for(var param in req.body.customWhere)
            where.where[param] = req.body.customWhere[param];

    models.MODEL_NAME.findAll(where).then(function(results) {
        res.json(results);
    }).catch(function(e) {
        console.error(e);
        res.status(500).json(e);
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.MODEL_NAME.findOne({where: {id: idEntity}}).then(function (ENTITY_NAME) {
        if (!ENTITY_NAME) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        ENTITY_NAME['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            ENTITY_NAME['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            }).catch(function(err) {
                entity_helper.error500(err, req, res, "/");
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.MODEL_NAME.findOne({where: {id: idEntity}}).then(function (ENTITY_NAME) {
        if (!ENTITY_NAME) {
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
            return res.redirect('/ENTITY_URL_NAME/show?id=' + idEntity + "#" + alias);
        }

        ENTITY_NAME['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/ENTITY_URL_NAME/show?id=' + idEntity + "#" + alias);
        }).catch(function(err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "delete"), function (req, res) {
    var id_ENTITY_NAME = parseInt(req.body.id);

    models.MODEL_NAME.findOne({where: {id: id_ENTITY_NAME}}).then(function (deleteObject) {
        models.MODEL_NAME.destroy({
            where: {
                id: id_ENTITY_NAME
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/ENTITY_URL_NAME/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.remove_files("ENTITY_NAME", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/ENTITY_URL_NAME/list');
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/ENTITY_URL_NAME/list');
    });
});

module.exports = router;