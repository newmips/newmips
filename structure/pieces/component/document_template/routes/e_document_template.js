var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_document_template');
var options = require('../models/options/e_document_template');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var globalConfig = require('../config/global');
var document_template_helper = require('../utils/document_template_helper');
// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

var moment = require('moment');
// Winston logger
var logger = require('../utils/logger');

router.get('/list', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
    var data = {
        "menu": "e_document_template",
        "sub_menu": "list_e_document_template"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_document_template/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {

    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options);
    filterDataTable("E_document_template", req.body, include).then(function (data) {

        var statusPromises = [];
        if (entity_helper.status.statusFieldList(attributes).length > 0)
            for (var i = 0; i < data.data.length; i++)
                statusPromises.push(entity_helper.status.currentStatus(models, "e_document_template", data.data[i], attributes, req.session.lang_user));

        Promise.all(statusPromises).then(function () {
            // Replace data enum value by translated value for datalist
            var enumsTranslation = enums_radios.translated("e_document_template", req.session.lang_user, options);
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
                            var filePath = thumbnailFolder + 'e_document_template/' + partOfFile[0] + '/' + value;
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
                var counter = 0;
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

router.get('/show', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
    var id_e_document_template = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_document_template",
        sub_menu: "list_e_document_template",
        tab: tab,
        enum_radio: enums_radios.translated("e_document_template", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined')
        data.hideButton = req.query.hideButton;

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.E_document_template.findOne({where: {id: id_e_document_template}, include: include}).then(function (e_document_template) {
        if (!e_document_template) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify e_document_template value with the translated enum value in show result */
        /*for (var item in data.enum)
         for (var field in e_document_template.dataValues)
         if (item == field)
         for (var value in data.enum[item])
         if (data.enum[item][value].value == e_document_template[field])
         e_document_template[field] = data.enum[item][value].translation;*/

        /* Update local e_document_template data before show */
        data.e_document_template = e_document_template;
        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function (found) {
            for (var i = 0; i < found.length; i++) {
                data.e_document_template[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            // Update some data before show, e.g get picture binary
            e_document_template = entity_helper.getPicturesBuffers(e_document_template, attributes, options, "e_document_template");
            entity_helper.status.translate(e_document_template, attributes, req.session.lang_user);
            var relations = document_template_helper.getRelations(e_document_template.f_entity);
            var reworkRelations = [];
            var f_exclude_relations = (e_document_template.f_exclude_relations || '').split(',');
            for (var i = 0; i < relations.length; i++) {
                reworkRelations[i] = {item: relations[i], value: relations[i]};
                if (f_exclude_relations.indexOf(relations[i]) < 0)
                    reworkRelations[i].isSelected = true;
            }
            data.e_document_template.document_template_relations = reworkRelations;
            res.render('e_document_template/show', data);
        });

    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("document_template", "create"), function (req, res) {
    var data = {
        menu: "e_document_template",
        sub_menu: "create_e_document_template",
        enum_radio: enums_radios.translated("e_document_template", req.session.lang_user, options)
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
        data.document_template_entities = document_template_helper.get_entities(models);
        res.render('e_document_template/create', data);
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/create', block_access.actionAccessMiddleware("document_template", "create"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    //createObject = enums.values("e_document_template", createObject, req.body);
    var relations = document_template_helper.getRelations(req.body.f_entity);
    var f_exclude_relations = Array.isArray(req.body.f_exclude_relations) ? req.body.f_exclude_relations : [req.body.f_exclude_relations];
    var exclude_relations = [];
    for (var i = 0; i < relations.length; i++)
        if (f_exclude_relations.indexOf(relations[i]) < 0)
            exclude_relations.push(relations[i]);
    createObject.f_exclude_relations = exclude_relations.join(',');

    models.E_document_template.create(createObject).then(function (e_document_template) {
        var redirect = '/document_template/show?id=' + e_document_template.id;
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
                        e_document_template.destroy();
                        var err = new Error();
                        err.message = "Association not found.";
                        reject(err);
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined') {
                        association['add' + modelName](e_document_template.id).then(resolve).catch(function (err) {
                            reject(err);
                        });
                    } else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = e_document_template.id;
                        association.update(obj).then(resolve).catch(function (err) {
                            reject(err);
                        });
                    }
                });
            }));
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        model_builder.setAssocationManyValues(e_document_template, req.body, createObject, options).then(function () {
            Promise.all(promises).then(function () {
                res.redirect(redirect);
            }).catch(function (err) {
                entity_helper.error500(err, req, res, '/document_template/create_form');
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/document_template/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("document_template", "update"), function (req, res) {
    var id_e_document_template = req.query.id;
    var data = {
        menu: "e_document_template",
        sub_menu: "list_e_document_template",
        enum_radio: enums_radios.translated("e_document_template", req.session.lang_user, options)
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
        models.E_document_template.findOne({where: {id: id_e_document_template}, include: [{all: true}]}).then(function (e_document_template) {
            if (!e_document_template) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_document_template = e_document_template;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can find adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_document_template[name_global_list] = rows;

                // Set associated property to item that are related to be able to make them selected client side
                if (rows.length > 1)
                    for (var j = 0; j < data[model].length; j++)
                        if (e_document_template[model] != null)
                            for (var k = 0; k < e_document_template[model].length; k++)
                                if (data[model][j].id == e_document_template[model][k].id)
                                    data[model][j].dataValues.associated = true;
            }

            req.session.toastr = [];
            data.document_template_entities = document_template_helper.get_entities(models);

            var relations = document_template_helper.getRelations(e_document_template.f_entity);
            var reworkRelations = [];
            var f_exclude_relations = (e_document_template.f_exclude_relations || '').split(',');
            for (var i = 0; i < relations.length; i++) {
                reworkRelations[i] = {item: relations[i], value: relations[i]};
                if (f_exclude_relations.indexOf(relations[i]) < 0)
                    reworkRelations[i].isSelected = true;
            }
            data.e_document_template.document_template_relations = reworkRelations;

            res.render('e_document_template/update', data);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("document_template", "update"), function (req, res) {
    var id_e_document_template = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);

    var relations = document_template_helper.getRelations(req.body.f_entity);
    var f_exclude_relations = Array.isArray(req.body.f_exclude_relations) ? req.body.f_exclude_relations : [req.body.f_exclude_relations];
    var exclude_relations = [];
    for (var i = 0; i < relations.length; i++)
        if (f_exclude_relations.indexOf(relations[i]) < 0)
            exclude_relations.push(relations[i]);
    updateObject.f_exclude_relations = exclude_relations.join(',');
    models.E_document_template.findOne({where: {id: id_e_document_template}}).then(function (e_document_template) {
        if (!e_document_template) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_document_template.update(updateObject).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_document_template, req.body, updateObject, options).then(function () {

                var redirect = '/document_template/show?id=' + id_e_document_template;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                        message: 'message.update.success',
                        level: "success"
                    }];

                res.redirect(redirect);
            });
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/document_template/update_form?id=' + id_e_document_template);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/document_template/update_form?id=' + id_e_document_template);
    });
});

router.get('/set_status/:id_document_template/:status/:id_new_status', block_access.actionAccessMiddleware("document_template", "create"), function (req, res) {
    var historyModel = 'E_history_e_document_template_' + req.params.status;
    var historyAlias = 'r_history_' + req.params.status.substring(2);
    var statusAlias = 'r_' + req.params.status.substring(2);

    var errorRedirect = '/document_template/show?id=' + req.params.id_document_template;
    // Find target entity instance
    models.E_document_template.findOne({
        where: {id: req.params.id_document_template},
        include: [{
                model: models[historyModel],
                as: historyAlias,
                limit: 1,
                order: 'createdAt DESC',
                include: [{
                        model: models.E_status,
                        as: statusAlias
                    }]
            }, {
                // Include all associations that can later be used by media to include variables value
                all: true, nested: true
            }]
    }).then(function (e_document_template) {
        if (!e_document_template || !e_document_template[historyAlias] || !e_document_template[historyAlias][0][statusAlias]) {
            logger.debug("Not found - Set status");
            return res.render('common/error', {error: 404});
        }

        // Find the children of the current status
        models.E_status.findOne({
            where: {id: e_document_template[historyAlias][0][statusAlias].id},
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
                                    include: [{all: true, nested: true}]
                                }]
                        }]
                }]
        }).then(function (current_status) {
            if (!current_status || !current_status.r_children) {
                logger.debug("Not found - Set status");
                return res.render('common/error', {error: 404});
            }

            // Check if new status is actualy the current status's children
            var children = current_status.r_children;
            var nextStatus = false;
            for (var i = 0; i < children.length; i++) {
                if (children[i].id == req.params.id_new_status)
                {
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
            nextStatus.executeActions(e_document_template).then(function () {
                // Create history record for this status field
                // Beeing the most recent history for document_template it will now be its current status
                var createObject = {}
                createObject["fk_id_status_" + nextStatus.f_field.substring(2)] = nextStatus.id;
                createObject["fk_id_document_template_history_" + req.params.status.substring(2)] = req.params.id_document_template;
                models[historyModel].create(createObject).then(function () {
                    e_document_template['set' + entity_helper.capitalizeFirstLetter(statusAlias)](nextStatus.id);
                    res.redirect('/document_template/show?id=' + req.params.id_document_template)
                });
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, errorRedirect);
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("document_template", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_document_template.findOne({where: {id: idEntity}}).then(function (e_document_template) {
        if (!e_document_template) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_document_template['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_document_template['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("document_template", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_document_template.findOne({where: {id: idEntity}}).then(function (e_document_template) {
        if (!e_document_template) {
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
            return res.redirect('/document_template/show?id=' + idEntity + "#" + alias);
        }

        e_document_template['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/document_template/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("document_template", "delete"), function (req, res) {
    var id_e_document_template = parseInt(req.body.id);

    models.E_document_template.findOne({where: {id: id_e_document_template}}).then(function (deleteObject) {
        models.E_document_template.destroy({
            where: {
                id: id_e_document_template
            }
        }).then(function () {
            req.session.toastr = [{
                    message: 'message.delete.success',
                    level: "success"
                }];

            var redirect = '/document_template/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.remove_files("e_document_template", deleteObject, attributes);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/document_template/list');
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/document_template/list');
    });
});

router.post('/generate', block_access.isLoggedIn, function (req, res) {
    var id_entity = req.body.id_entity;
    var entity = req.body.entity;
    var id_document = req.body.f_model_document;
    if (id_entity && id_document && entity) {
        models.E_document_template.findOne({where: {id: id_document}}).then(function (e_model_document) {
            if (e_model_document && e_model_document.f_file) {
                entity = entity.charAt(0).toUpperCase() + entity.slice(1);//uc first
                var includes = [{all: true}];
                if (e_model_document.f_exclude_relations)
                    includes = document_template_helper.buildInclude(entity, e_model_document.f_exclude_relations, models);
                models[entity].findOne({where: {id: id_entity}, include: includes}).then(function (e_entity) {
                    if (e_entity) {
                        var partOfFilepath = e_model_document.f_file.split('-');
                        if (partOfFilepath.length > 1) {
                            var completeFilePath = globalConfig.localstorage + 'e_document_template/' + partOfFilepath[0] + '/' + e_model_document.f_file;
                            var today = moment();
                            var mimeType = require('mime-types').lookup(completeFilePath);
                            var reworkOptions = {
                                //entity by entity
                                /**'e_entity': [
                                 {item: 'f_date', type: 'datetime', newFormat: 'DD/MM/YYYY HH'}
                                 ]**/
                                //next entity
                            };
                            //rework with own options
                            var data = document_template_helper.rework(e_entity, entity.toLowerCase(), reworkOptions, req.session.lang_user,mimeType);
                            //now add others variables
                            document_template_helper.globalVariables.forEach(function (g) {
                                if (g.type === "date" || g.type === "datetime" || g.type === "time")
                                    data[g.name] = moment().format(document_template_helper.getDateFormatUsingLang(req.session.lang_user, g.type));
                            });
                            data['g_email'] = req.session.passport.user.f_email != null ? req.session.passport.user.f_email : '';
                            data['g_login'] = req.session.passport.user.f_login != null ? req.session.passport.user.f_login : '';

                            var options = {
                                file: completeFilePath,
                                mimeType: mimeType,
                                data: data,
                                entity: entity,
                                lang: req.session.lang_user
                            };
                            document_template_helper.generateDoc(options).then(function (infos) {
                                var filename = (e_entity.id || '')
                                        + '_' + today.format('DDMMYYYY_HHmmss')
                                        + '_' + today.unix()
                                        + infos.ext;
                                res.writeHead(200, {"Content-Type": infos.contentType, "Content-Disposition": "attachment;filename=" + filename});
                                res.write(infos.buffer);
                                res.end();
                            }).catch(function (e) {
                                data.toastr = req.session.toastr;
                                req.session.toastr = [];
                                req.session.toastr = [{
                                        message: e.message,
                                        level: "error"
                                    }];
                                res.redirect(req.headers.referer);
                            });
                        } else
                            res.redirect(req.headers.referer);
                    } else
                        res.redirect(req.headers.referer);
                });
            } else
                res.redirect(req.headers.referer);
        });
    } else
        res.redirect(req.headers.referer);
});

router.get('/readme/:entity', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
    var data = {
        "menu": "e_document_template",
        "sub_menu": "list_e_document_template"
    };
    var entity = req.params.entity;
    if (entity) {
        data.toastr = req.session.toastr;
        req.session.toastr = [];
        data['entities'] = document_template_helper.build_help(entity, req.session.lang_user);
        data.document_template_entities = document_template_helper.get_entities(models);
        data.readme = document_template_helper.getReadmeMessages(req.session.lang_user);
        res.render('e_document_template/readme', data);
    }
});

router.get('/help/:type', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
    var type = req.params.type;

    if (type === "subEntities") {
        res.json({message: document_template_helper.getSubEntitiesHelp(req.session.lang_user)});
    } else
        res.status(404).end();
});


router.get('/entities/:entity/relations', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
    var entity = req.params.entity;
    var type = req.query.t;
    if (entity) {
        if (type === 'html') {
            var html = document_template_helper.buildHTMLHelpEntitiesAjax(document_template_helper.build_help(entity, req.session.lang_user), req.session.lang_user);
            res.json({HTMLRelationsList: html});
        } else
            res.json({relations: document_template_helper.getRelations(entity)});
    } else
        res.end([]);
});

router.get('/global-variables', block_access.actionAccessMiddleware("document_template", "read"), function (req, res) {
    res.json({HTMLGlobalVariables: document_template_helper.buildHTMLGlobalVariables(req.session.lang_user)});
});
/* Select 2 AJAX LOAD */
router.post('/search', block_access.isLoggedIn, function (req, res) {
    var entity = req.body.entity;
    entity = entity.replace('e_', '');
    entity = entity.charAt(0).toUpperCase() + entity.slice(1);
    models.E_document_template.findAll({where: {
            $and: [
                {f_entity: entity},
                {f_name: {$like: '%' + req.body.search + '%'}}
            ]
        }}).then(function (results) {
        var data = [];
        /* Format data for select2 */
        for (var j = 0; j < results.length; j++) {
            data.push({
                id: results[j].id,
                text: results[j].f_name
            });
        }
        res.send(data);
    });
});
module.exports = router;