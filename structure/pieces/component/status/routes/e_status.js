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
var globalConf = require('../config/global');

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');

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
        var language = require('../services/language')(req.session.lang_user);
        for (var i = 0; i < data.data.length; i++) {
            var entityTradKey = 'entity.'+data.data[i].f_entity+'.label_entity';
            data.data[i].f_field = language.__('entity.'+data.data[i].f_entity+'.'+data.data[i].f_field);
            data.data[i].f_entity = language.__(entityTradKey);
        }

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
                        var thumbnailFolder = globalConf.thumbnail.folder;
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

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.E_status.findOne({where: {id: id_e_status}, include: include}).then(function (e_status) {
        if (!e_status) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify e_status value with the translated enum value in show result */
        for (var item in data.enum)
            for (var field in e_status.dataValues)
                if (item == field)
                    for (var value in data.enum[item])
                        if (data.enum[item][value].value == e_status[field])
                            e_status[field] = data.enum[item][value].translation;

        /* Update local e_status data before show */
        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function (found) {
            for (var i = 0; i < found.length; i++) {
                e_status[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            // Update some data before show, e.g get picture binary
            entity_helper.getPicturesBuffers(e_status, "e_status").then(function() {
                var childrenIds = [];
                for (var i = 0; i < e_status.r_children.length; i++) {
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

                    data.e_status = e_status;
                    res.render('e_status/show', data);
                });
            }).catch(function (err) {
                entity_helper.error500(err, req, res, "/");
            });
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

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

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                if (!association) {
                    e_status.destroy();
                    var err = new Error();
                    err.message = "Association not found."
                    return entity_helper.error500(err, req, res, "/");
                }

                var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                if (typeof association['add' + modelName] !== 'undefined')
                    association['add' + modelName](e_status.id);
                else {
                    var obj = {};
                    obj[req.body.associationForeignKey] = e_status.id;
                    association.update(obj);
                }
            });
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        model_builder.setAssocationManyValues(e_status, req.body, createObject, options);

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
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/status/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("status", 'update'), function (req, res) {
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

    var associationsFinder = model_builder.associationsFinder(models, options);

    Promise.all(associationsFinder).then(function (found) {
        models.E_status.findOne({where: {id: id_e_status}, include: [{all: true}]}).then(function (e_status) {
            if (!e_status) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_status = e_status;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can find adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_status[name_global_list] = rows;

                // Set associated property to item that are related to be able to make them selected client side
                if (rows.length > 1)
                    for (var j = 0; j < data[model].length; j++)
                        if (e_status[model] != null)
                            for (var k = 0; k < e_status[model].length; k++)
                                if (data[model][j].id == e_status[model][k].id)
                                    data[model][j].dataValues.associated = true;
            }

            req.session.toastr = [];
            res.render('e_status/update', data);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("status", 'update'), function (req, res) {
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
            model_builder.setAssocationManyValues(e_status, req.body, updateObject, options);

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

        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/status/update_form?id=' + id_e_status);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/status/update_form?id=' + id_e_status);
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