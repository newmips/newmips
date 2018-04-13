var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_status');
var options = require('../models/options/e_status');
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

router.post('/set_children', block_access.actionAccessMiddleware("status", "read"), function(req, res) {
    var statuses = req.body.next_status || [];
    var id_status = req.body.id_status;

    for (var i = 0; i < statuses.length; i++)
        statuses[i] = parseInt(statuses[i]);
    models.E_status.findOne({where: {id: id_status}}).then(function(status) {
        if (status)
            status.setR_children(statuses);
        res.redirect('/status/show?id='+id_status+'#r_children');
    });
});

router.get('/set_default/:id', block_access.actionAccessMiddleware("status", "update"), function(req, res) {
    var id_status = req.params.id;

    models.E_status.findOne({
        where: {id: id_status},
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
    }).then(function(status) {
        if (!status) {
            logger.debug("No data entity found.");
            return res.render('common/error', {error: 404});
        }

        // Find all entities without status
        var entityModel = entity_helper.capitalizeFirstLetter(status.f_entity);
        var where = {
            where: {},
            attributes: ['id'],
            raw: true
        };
        where.where['fk_id_status_'+status.f_field.substring(2)] = null;
        models[entityModel].findAll(where).then(function(no_statuses) {
            // Build ID array of entities that need to be updated
            // Build history creation array
            var historyModel = 'E_history_'+status.f_entity+'_'+status.f_field;
            var historyCreateObj = [], toUpdateIds = [];
            for (var i = 0; i < no_statuses.length; i++) {
                toUpdateIds.push(no_statuses[i].id);
                var createObj = {};
                createObj['fk_id_status_'+status.f_field.substring(2)] = status.id;
                createObj['fk_id_'+status.f_entity.substring(2)+'_history_'+status.f_field.substring(2)] = no_statuses[i].id;
                historyCreateObj.push(createObj);

                // Execute actions for each entity instance
                status.executeActions(no_statuses[i]).catch(function(err) {
                    console.error("Status action error on /set_default :");
                    console.error(err);
                });
            }

            // Update entities to add status
            var updateObj = {};
            updateObj['fk_id_status_'+status.f_field.substring(2)] = status.id;
            models[entityModel].update(updateObj, {
                where: {id: {$in: toUpdateIds}}
            }).then(function() {
                // Bulk create history for updated entities
                models[historyModel].bulkCreate(historyCreateObj).then(function() {
                    res.redirect('/status/show?id='+status.id);
                }).catch(function(err) {entity_helper.error500(err, req, res, "/");});
            }).catch(function(err) {entity_helper.error500(err, req, res, "/");});
        }).catch(function(err) {entity_helper.error500(err, req, res, "/");});
    }).catch(function(err) {entity_helper.error500(err, req, res, "/");});
});

router.get('/list', block_access.actionAccessMiddleware("status", "read"), function (req, res) {
    var data = {
        "menu": "e_status",
        "sub_menu": "list_e_status"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_status/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("status", "read"), function (req, res) {

    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options);
    filterDataTable("E_status", req.body, include).then(function (data) {

        var statusPromises = [];
        if (entity_helper.status.statusFieldList(attributes).length > 0)
            for (var i = 0; i < data.data.length; i++)
                statusPromises.push(entity_helper.status.currentStatus(models, "e_status", data.data[i], attributes, req.session.lang_user));

        Promise.all(statusPromises).then(function() {
            // Replace data enum value by translated value for datalist
            var enumsTranslation = enums_radios.translated("e_status", req.session.lang_user, options);
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
                            var filePath = thumbnailFolder + 'e_status/' + partOfFile[0] + '/' + value;
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

router.get('/show', block_access.actionAccessMiddleware("status", "read"), function (req, res) {
    var id_e_status = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_status",
        sub_menu: "list_e_status",
        tab: tab,
        enum_radio: enums_radios.translated("e_status", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined')
        data.hideButton = req.query.hideButton;

    entity_helper.optimizedFindOne('E_status', id_e_status, options, [{
        model: models.E_status,
        as: 'r_children'
    }]).then(function(e_status){
        if (!e_status) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        data.e_status = e_status;

        var childrenIds = [];
        for (var i = 0; e_status.r_children && i < e_status.r_children.length; i++) {
            var child = e_status.r_children[i];
            child.translate(req.session.lang_user);
            child.dataValues.selected = true;
            childrenIds.push(child.id);
        }

        var where = {
            f_field: e_status.f_field,
            f_entity: e_status.f_entity
        };
        if (childrenIds.length)
            where.id = {$notIn: childrenIds};
        models.E_status.findAll({
            where: where,
            include: [{
                model: models.E_translation,
                as: 'r_translations'
            }]
        }).then(function(allStatus) {
            for (var i = 0; i < allStatus.length; i++)
                allStatus[i].translate(req.session.lang_user)
            e_status.dataValues.all_children = allStatus.concat(e_status.r_children);

            var entityTradKey = 'entity.'+e_status.f_entity+'.label_entity';
            e_status.f_field = 'entity.'+e_status.f_entity+'.'+e_status.f_field;
            e_status.f_entity = entityTradKey;

            entity_helper.status.translate(e_status, attributes, req.session.lang_user);
            data.e_status = e_status;
            res.render('e_status/show', data);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("status", "create"), function (req, res) {
    var data = {
        menu: "e_status",
        sub_menu: "create_e_status",
        enum_radio: enums_radios.translated("e_status", req.session.lang_user, options)
    };

    data.entities = entity_helper.status.entityStatusFieldList();

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
        models.E_status.findOne({where: {id: data.associationFlag}}).then(function(status) {
            data.f_field = status.f_field;
            data.f_entity = status.f_entity;
            data.entityTrad = 'entity.'+data.f_entity+'.label_entity';
            data.fieldTrad = 'entity.'+data.f_entity+'.'+data.f_field;
            res.render('e_status/create', data);
        }).catch(function(err) {
            data.error = 404;
            res.render('common/error', data);
        });
    }
    else
        res.render('e_status/create', data);
});

router.post('/create', block_access.actionAccessMiddleware("status", "create"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_status.create(createObject).then(function (e_status) {
        var redirect = '/status/show?id='+e_status.id;
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
                        e_status.destroy();
                        var err = new Error();
                        err.message = "Association not found.";
                        reject(err);
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined'){
                        association['add' + modelName](e_status.id).then(resolve).catch(function(err){
                            reject(err);
                        });
                    } else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = e_status.id;
                        association.update(obj).then(resolve).catch(function(err){
                            reject(err);
                        });
                    }
                });
            }));
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        model_builder.setAssocationManyValues(e_status, req.body, createObject, options).then(function(){
            Promise.all(promises).then(function() {
                // If new status is default, remove default from other status entity/field duo
                if (createObject.f_default && createObject.f_default == 'true')
                    models.E_status.update(
                        {f_default: false},
                        {where: {f_entity: e_status.f_entity, f_field: e_status.f_field, id: {$not: e_status.id}}}
                    ).then(function() {
                        res.redirect(redirect);
                    });
                else
                    res.redirect(redirect);
            }).catch(function(err){
                entity_helper.error500(err, req, res, '/status/create_form');
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/status/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("status", "update"), function (req, res) {
    var id_e_status = req.query.id;
    var data = {
        menu: "e_status",
        sub_menu: "list_e_status",
        enum_radio: enums_radios.translated("e_status", req.session.lang_user, options)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    entity_helper.optimizedFindOne('E_status', id_e_status, options).then(function(e_status){
        if (!e_status) {
            data.error = 404;
            return res.render('common/error', data);
        }

        data.e_status = e_status;
        // Update some data before show, e.g get picture binary
        entity_helper.getPicturesBuffers(e_status, "e_status", true).then(function() {
            if (req.query.ajax) {
                e_status.dataValues.enum_radio = data.enum_radio;
                res.render('e_status/update_fields', e_status.get({plain: true}));
            }
            else
                res.render('e_status/update', data);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("status", "update"), function (req, res) {
    var id_e_status = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    models.E_status.findOne({where: {id: id_e_status}}).then(function (e_status) {
        if (!e_status) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_status.update(updateObject).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_status, req.body, updateObject, options).then(function () {

                var redirect = '/status/show?id=' + id_e_status;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

                // If status is now default, remove default from other status entity/field duo
                if (updateObject.f_default && updateObject.f_default == 'true')
                    models.E_status.update(
                        {f_default: false},
                        {where: {f_entity: e_status.f_entity, f_field: e_status.f_field, id: {$not: e_status.id}}}
                    ).then(function() {
                        res.redirect(redirect);
                    });
                else
                    res.redirect(redirect);
            });
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/status/update_form?id=' + id_e_status);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/status/update_form?id=' + id_e_status);
    });
});

router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('status', 'read'), function(req, res) {
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
    models.E_status.findOne({
        where: {id: id},
        include: [{
            model: models[entity_helper.capitalizeFirstLetter(option.target)],
            as: option.as,
            include: {all: true}
        }]
    }).then(function(e_status) {
        if (!e_status)
            return res.status(404).end();

        var dustData = e_status[option.as];
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

router.get('/set_status/:id_status/:status/:id_new_status', block_access.actionAccessMiddleware("status", "update"), function(req, res) {
    var historyModel = 'E_history_e_status_'+req.params.status;
    var historyAlias = 'r_history_'+req.params.status.substring(2);
    var statusAlias = 'r_'+req.params.status.substring(2);

    var errorRedirect = '/status/show?id='+req.params.id_status;

    var includeTree = entity_helper.status.generateEntityInclude(models, 'e_status');

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
    models.E_status.findOne({
        where: {id: req.params.id_status},
        include: includeTree
    }).then(function(e_status) {
        if (!e_status || !e_status[historyAlias] || !e_status[historyAlias][0][statusAlias]){
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {id: e_status[historyAlias][0][statusAlias].id},
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
            nextStatus.executeActions(e_status).then(function() {
                // Create history record for this status field
                // Beeing the most recent history for status it will now be its current status
                var createObject = {}
                createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_status_history_"+req.params.status.substring(2)] = req.params.id_status;
                models[historyModel].create(createObject).then(function() {
                    e_status['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/status/show?id='+req.params.id_status)
                });
            }).catch(function(err) {
                console.error(err);
                req.session.toastr = [{
                    level: 'warning',
                    message: 'component.status.error.action_error'
                }]
                var createObject = {}
                createObject["fk_id_status_"+nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_status_history_"+req.params.status.substring(2)] = req.params.id_status;
                models[historyModel].create(createObject).then(function() {
                    e_status['set'+entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/status/show?id='+req.params.id_status)
                });
            });
        });
    }).catch(function(err) {
        entity_helper.error500(err, req, res, errorRedirect);
    });
});

router.post('/search', block_access.actionAccessMiddleware('status','read'), function(req, res) {
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

    models.E_status.findAll(where).then(function(results) {
        res.json(results);
    }).catch(function(e) {
        console.error(e);
        res.status(500).json(e);
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("status", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_status.findOne({where: {id: idEntity}}).then(function (e_status) {
        if (!e_status) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_status['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_status['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            }).catch(function(err) {
                entity_helper.error500(err, req, res, "/");
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("status", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_status.findOne({where: {id: idEntity}}).then(function (e_status) {
        if (!e_status) {
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
            return res.redirect('/status/show?id=' + idEntity + "#" + alias);
        }

        e_status['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/status/show?id=' + idEntity + "#" + alias);
        }).catch(function(err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("status", "delete"), function (req, res) {
    var id_e_status = parseInt(req.body.id);

    models.E_status.findOne({where: {id: id_e_status}}).then(function (deleteObject) {
        models.E_status.destroy({
            where: {
                id: id_e_status
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/status/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.remove_files("e_status", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/status/list');
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/status/list');
    });
});

module.exports = router;