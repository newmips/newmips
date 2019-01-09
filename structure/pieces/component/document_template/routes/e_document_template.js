var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filter_datatable');

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

var SELECT_PAGE_SIZE = 10;

router.get('/list', block_access.actionAccessMiddleware("document_template", "read"), function(req, res) {
    res.render('e_document_template/list');
});

router.post('/datalist', block_access.actionAccessMiddleware("document_template", "read"), function(req, res) {
    filterDataTable("E_document_template", req.body).then(function(rawData) {
        entity_helper.prepareDatalistResult('e_document_template', rawData, req.session.lang_user).then(function(preparedData) {
            res.send(preparedData).end();
        });
    }).catch(function(err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.get('/show', block_access.actionAccessMiddleware("document_template", "read"), function(req, res) {
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

    models.E_document_template.findOne({
        where: {
            id: id_e_document_template
        }
    }).then(function(e_document_template) {
        if (!e_document_template) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        data.e_document_template = e_document_template;
        var relations = document_template_helper.getRelations(e_document_template.f_entity);
        var reworkRelations = [];
        var f_exclude_relations = (e_document_template.f_exclude_relations || '').split(',');
        for (var i = 0; i < relations.length; i++) {
            reworkRelations[i] = {
                item: relations[i],
                value: relations[i]
            };
            if (f_exclude_relations.indexOf(relations[i]) < 0)
                reworkRelations[i].isSelected = true;
        }
        data.e_document_template.document_template_relations = reworkRelations;
        res.render('e_document_template/show', data);

    }).catch(function(err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("document_template", "create"), function(req, res) {
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

    data.document_template_entities = document_template_helper.get_entities(models);
    res.render('e_document_template/create', data);
});

router.post('/create', block_access.actionAccessMiddleware("document_template", "create"), function(req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    var relations = document_template_helper.getRelations(req.body.f_entity);
    var f_exclude_relations = Array.isArray(req.body.f_exclude_relations) ? req.body.f_exclude_relations : [req.body.f_exclude_relations];
    var exclude_relations = [];
    for (var i = 0; i < relations.length; i++)
        if (f_exclude_relations.indexOf(relations[i]) < 0)
            exclude_relations.push(relations[i]);
    createObject.f_exclude_relations = exclude_relations.join(',');
    models.E_document_template.create(createObject).then(function(e_document_template) {
        var redirect = '/document_template/show?id=' + e_document_template.id;
        req.session.toastr = [{
            message: 'message.create.success',
            level: "success"
        }];
        res.redirect(redirect);
    }).catch(function(err) {
        entity_helper.error(err, req, res, '/document_template/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("document_template", "update"), function(req, res) {
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

    models.E_document_template.findOne({
        where: {
            id: id_e_document_template
        },
        include: [{
            all: true
        }]
    }).then(function(e_document_template) {
        if (!e_document_template) {
            data.error = 404;
            return res.render('common/error', data);
        }

        data.e_document_template = e_document_template;
        data.document_template_entities = document_template_helper.get_entities(models);

        var relations = document_template_helper.getRelations(e_document_template.f_entity);
        var reworkRelations = [];
        var f_exclude_relations = (e_document_template.f_exclude_relations || '').split(',');
        for (var i = 0; i < relations.length; i++) {
            reworkRelations[i] = {
                item: relations[i],
                value: relations[i]
            };
            if (f_exclude_relations.indexOf(relations[i]) < 0)
                reworkRelations[i].isSelected = true;
        }
        data.e_document_template.document_template_relations = reworkRelations;

        res.render('e_document_template/update', data);
    }).catch(function(err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("document_template", "update"), function(req, res) {
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
    models.E_document_template.findOne({
        where: {
            id: id_e_document_template
        }
    }).then(function(e_document_template) {
        if (!e_document_template) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_document_template.update(updateObject).then(function() {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_document_template, req.body, updateObject, options).then(function() {

                var redirect = '/document_template/show?id=' + id_e_document_template;
                if (typeof req.body.associationFlag !== 'undefined')
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

                req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

                res.redirect(redirect);
            });
        }).catch(function(err) {
            entity_helper.error(err, req, res, '/document_template/update_form?id=' + id_e_document_template);
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, '/document_template/update_form?id=' + id_e_document_template);
    });
});

router.get('/set_status/:id_document_template/:status/:id_new_status', block_access.actionAccessMiddleware("document_template", "update"), function(req, res) {
    status_helper.setStatus('e_document_template', req.params.id_document_template, req.params.status, req.params.id_new_status, req.session.passport.user.id, req.query.comment).then(()=> {
        res.redirect('/document_template/show?id=' + req.params.id_document_template);
    }).catch((err)=> {
        entity_helper.error(err, req, res, '/document_template/show?id=' + req.params.id_document_template);
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("document_template", "delete"), function(req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_document_template.findOne({
        where: {
            id: idEntity
        }
    }).then(function(e_document_template) {
        if (!e_document_template) {
            var data = {
                error: 404
            };
            return res.render('common/error', data);
        }

        // Get all associations
        e_document_template['get' + entity_helper.capitalizeFirstLetter(alias)]().then(function(aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

                // Set back associations without removed entity
            e_document_template['set' + entity_helper.capitalizeFirstLetter(alias)](aliasEntities).then(function() {
                res.sendStatus(200).end();
            });
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("document_template", "create"), function(req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_document_template.findOne({
        where: {
            id: idEntity
        }
    }).then(function(e_document_template) {
        if (!e_document_template) {
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
            return res.redirect('/document_template/show?id=' + idEntity + "#" + alias);
        }

        e_document_template['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function() {
            res.redirect('/document_template/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, "/");
    });
});

router.post('/delete', block_access.actionAccessMiddleware("document_template", "delete"), function(req, res) {
    var id_e_document_template = parseInt(req.body.id);

    models.E_document_template.findOne({
        where: {
            id: id_e_document_template
        }
    }).then(function(deleteObject) {
        models.E_document_template.destroy({
            where: {
                id: id_e_document_template
            }
        }).then(function() {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/document_template/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.removeFiles("e_document_template", deleteObject, attributes);
        }).catch(function(err) {
            entity_helper.error(err, req, res, '/document_template/list');
        });
    }).catch(function(err) {
        entity_helper.error(err, req, res, '/document_template/list');
    });
});

router.post('/generate', block_access.isLoggedIn, function(req, res) {
    var id_entity = req.body.id_entity;
    var entity = req.body.entity;
    var id_document = req.body.f_model_document;

    if (id_entity && id_document && entity) {
        models.E_document_template.findOne({
            where: {
                id: id_document
            }
        }).then(function(e_model_document) {
            if (e_model_document && e_model_document.f_file) {
                // Model name
                entity = entity.charAt(0).toUpperCase() + entity.slice(1);

                // Build include according to template configuration
                var includes = document_template_helper.buildInclude(entity, e_model_document.f_exclude_relations, models);

                // If you need to add more levels in the inclusion to access deeper data
                // You can add here more inclusion
                // Example:
                // if(entity == "myMainEntity")
                //     for(var item in includes)
                //         if(includes[item].as == "myAliasINeedToAddNewInclusion")
                //             includes[item].include = [{
                //                 model: models.E_mymodeltoinclude,
                //                 as: "r_myModelToInclude"
                //             }]

                models[entity].findOne({
                    where: {
                        id: id_entity
                    },
                    include: includes
                }).then(function(e_entity) {
                    if (e_entity) {
                        var partOfFilepath = e_model_document.f_file.split('-');
                        if (partOfFilepath.length > 1) {
                            var completeFilePath = globalConfig.localstorage + 'e_document_template/' + partOfFilepath[0] + '/' + e_model_document.f_file;
                            var today = moment();
                            var isDust = false;
                            if (completeFilePath.indexOf('.dust') != -1) {
                                isDust = true;
                                completeFilePath = completeFilePath.replace('.dust', '.html');
                            }
                            var mimeType = require('mime-types').lookup(completeFilePath);
                            if (isDust)
                                completeFilePath = completeFilePath.replace('.html', '.dust');
                            var reworkOptions = {
                                // Entity by entity
                                // 'e_entity': [{
                                //     item: 'f_date',
                                //     type: 'datetime',
                                //     newFormat: 'DD/MM/YYYY HH'
                                // }]
                                // Next entity
                            };
                            // Rework data with given options
                            var data = document_template_helper.rework(e_entity, entity.toLowerCase(), reworkOptions, req.session.lang_user, mimeType);

                            // Now add others globals variables
                            document_template_helper.globalVariables.forEach(function(g) {
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
                            document_template_helper.generateDoc(options).then(function(infos) {
                                var filename = (e_entity.id || '') +
                                    '_' + today.format('DDMMYYYY_HHmmss') +
                                    '_' + today.unix() +
                                    infos.ext;
                                res.writeHead(200, {
                                    "Content-Type": infos.contentType,
                                    "Content-Disposition": "attachment;filename=" + filename
                                });
                                res.write(infos.buffer);
                                res.end();
                            }).catch(function(e) {
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

router.get('/readme/:entity', block_access.actionAccessMiddleware("document_template", "read"), function(req, res) {
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
        data.selectedEntity = entity;
        res.render('e_document_template/readme', data);
    }
});

router.get('/help/:type', block_access.actionAccessMiddleware("document_template", "read"), function(req, res) {
    var type = req.params.type;

    if (type === "subEntities") {
        res.json({
            message: document_template_helper.getSubEntitiesHelp(req.session.lang_user)
        });
    } else
        res.status(404).end();
});

router.get('/entities/:entity/relations', block_access.actionAccessMiddleware("document_template", "read"), function(req, res) {
    var entity = req.params.entity;
    var type = req.query.t;
    if (entity) {
        if (type === 'html') {
            var html = document_template_helper.buildHTMLHelpEntitiesAjax(document_template_helper.build_help(entity, req.session.lang_user), req.session.lang_user);
            res.json({
                HTMLRelationsList: html
            });
        } else
            res.json({
                relations: document_template_helper.getRelations(entity)
            });
    } else
        res.end([]);
});

router.get('/global-variables', block_access.actionAccessMiddleware("document_template", "read"), function(req, res) {
    res.json({
        HTMLGlobalVariables: document_template_helper.buildHTMLGlobalVariables(req.session.lang_user)
    });
});

router.post('/search', block_access.actionAccessMiddleware('document_template', 'read'), function(req, res) {
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
                    currentOrObj[req.body.searchField[i]] = {
                        $like: search
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
                    if ((options[option].foreignKey == param || options[option].otherKey == param) && options[option].relation != "belongsToMany")
                        where.where[param] = req.body.customwhere[param];
                }
            } else
                where.where[param] = req.body.customwhere[param];
        }
    }

    where.offset = offset;
    where.limit = limit;

    models.E_document_template.findAndCountAll(where).then(function(results) {
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
    }).catch(function(e) {
        console.error(e);
        res.status(500).json(e);
    });
});

module.exports = router;