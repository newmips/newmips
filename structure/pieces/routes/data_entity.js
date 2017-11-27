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
var global = require('../config/global');

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
                        var thumbnailFolder = global.thumbnail.folder;
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

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.MODEL_NAME.findOne({where: {id: id_ENTITY_NAME}, include: include}).then(function (ENTITY_NAME) {
        if (!ENTITY_NAME) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify ENTITY_NAME value with the translated enum value in show result */
        for (var item in data.enum)
            for (var field in ENTITY_NAME.dataValues)
                if (item == field)
                    for (var value in data.enum[item])
                        if (data.enum[item][value].value == ENTITY_NAME[field])
                            ENTITY_NAME[field] = data.enum[item][value].translation;

        /* Update local ENTITY_NAME data before show */
        data.ENTITY_NAME = ENTITY_NAME;
        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function (found) {
            for (var i = 0; i < found.length; i++) {
                data.ENTITY_NAME[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            // Update some data before show, e.g get picture binary
            ENTITY_NAME = entity_helper.getPicturesBuffers(ENTITY_NAME, attributes, options, "ENTITY_NAME");

            // Check if entity has Status component defined and get the possible next status
            entity_helper.status.nextStatus(models, "ENTITY_NAME", ENTITY_NAME.id, attributes).then(function(nextStatus) {
                if (nextStatus)
                    data.next_status = nextStatus;

                // Give children status entity/field translation
                for (var i = 0; i < e_status.r_children.length; i++) {
                    var curr = e_status.r_children[i];
                    var entityTradKey = 'entity.'+curr.f_entity+'.label_entity';
                    curr.f_field = 'entity.'+curr.f_entity+'.'+curr.f_field;
                    curr.f_entity = entityTradKey;
                }
                res.render('ENTITY_NAME/show', data);
            }).catch(function(err) {
                console.error(err);
                req.session.toastr = [{
                    message: 'component.status.error',
                    level: 'error'
                }];
                res.render('ENTITY_NAME/show', data);
            });
        });

    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "write"), function (req, res) {
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

    var associationsFinder = model_builder.associationsFinder(models, options);

    Promise.all(associationsFinder).then(function (found) {
        for (var i = 0; i < found.length; i++)
            data[found[i].model] = found[i].rows;

        res.render('ENTITY_NAME/create', data);
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/create', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "write"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    //createObject = enums.values("ENTITY_NAME", createObject, req.body);

    models.MODEL_NAME.create(createObject).then(function (ENTITY_NAME) {
        var redirect = '/ENTITY_URL_NAME/show?id='+ENTITY_NAME.id;
        req.session.toastr = [{
                message: 'message.create.success',
                level: "success"
            }];

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                if (!association) {
                    ENTITY_NAME.destroy();
                    var err = new Error();
                    err.message = "Association not found."
                    return entity_helper.error500(err, req, res, "/");
                }

                var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                if (typeof association['add' + modelName] !== 'undefined')
                    association['add' + modelName](ENTITY_NAME.id);
                else {
                    var obj = {};
                    obj[req.body.associationForeignKey] = ENTITY_NAME.id;
                    association.update(obj);
                }
            });
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        model_builder.setAssocationManyValues(ENTITY_NAME, req.body, createObject, options);

        res.redirect(redirect);
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/ENTITY_URL_NAME/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "write"), function (req, res) {
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

    var associationsFinder = model_builder.associationsFinder(models, options);

    Promise.all(associationsFinder).then(function (found) {
        models.MODEL_NAME.findOne({where: {id: id_ENTITY_NAME}, include: [{all: true}]}).then(function (ENTITY_NAME) {
            if (!ENTITY_NAME) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.ENTITY_NAME = ENTITY_NAME;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can find adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.ENTITY_NAME[name_global_list] = rows;

                // Set associated property to item that are related to be able to make them selected client side
                if (rows.length > 1)
                    for (var j = 0; j < data[model].length; j++)
                        if (ENTITY_NAME[model] != null)
                            for (var k = 0; k < ENTITY_NAME[model].length; k++)
                                if (data[model][j].id == ENTITY_NAME[model][k].id)
                                    data[model][j].dataValues.associated = true;
            }

            req.session.toastr = [];
            res.render('ENTITY_NAME/update', data);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, "/");
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "write"), function (req, res) {
    var id_ENTITY_NAME = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    //updateObject = enums.values("ENTITY_NAME", updateObject, req.body);

    models.MODEL_NAME.findOne({where: {id: id_ENTITY_NAME}}).then(function (ENTITY_NAME) {
        if (!ENTITY_NAME) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        ENTITY_NAME.update(updateObject, {where: {id: id_ENTITY_NAME}}).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(ENTITY_NAME, req.body, updateObject, options);

            var redirect = '/ENTITY_URL_NAME/show?id=' + id_ENTITY_NAME;
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

            req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

            res.redirect(redirect);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/ENTITY_URL_NAME/update_form?id=' + id_ENTITY_NAME);
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/ENTITY_URL_NAME/update_form?id=' + id_ENTITY_NAME);
    });
});

router.get('/set_status/:id_ENTITY_URL_NAME/:status/:id_new_status', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "write"), function(req, res) {
    var historyModel = 'E_history_ENTITY_NAME_'+req.params.status;
    var historyAlias = 'r_history_'+req.params.status.substring(2);
    var statusAlias = 'r_'+req.params.status.substring(2);

    var errorRedirect = '/ENTITY_URL_NAME/show?id='+req.params.id_ENTITY_URL_NAME;
    // Find target entity instance
    models.MODEL_NAME.findOne({
        where: {id: req.params.id_ENTITY_URL_NAME},
        include: [{
            model: models[historyModel],
            as: historyAlias,
            limit: 1,
            order: 'createdAt DESC',
            include: [{
                model: models.E_status,
                as: statusAlias
            }]
        }]
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
                as: 'r_children'
            }]
        }).then(function(current_status) {
            if (!current_status || !current_status.r_children){
                logger.debug("Not found - Set status");
                return res.render('common/error', {error: 404});
            }

            // Check if new status is actualy the current status's children
            var children = current_status.r_children;
            var validNext = false;
            for (var i = 0; i < children.length; i++) {
                if (children[i].id == req.params.id_new_status)
                    {validNext = true; break;}
            }
            // Unautorized
            if (!validNext){
                req.session.toastr = [{
                    level: 'error',
                    message: 'component.status.error.illegal_status'
                }]
                return res.redirect(errorRedirect);
            }

            // Create history record for this status field
            // Beeing the most recent history for ENTITY_URL_NAME it will now be its current status
            var createObject = {fk_id_status_status: req.params.id_new_status};
            createObject["fk_id_ENTITY_URL_NAME_history_"+req.params.status.substring(2)] = req.params.id_ENTITY_URL_NAME;
            models[historyModel].create(createObject).then(function() {
                res.redirect('/ENTITY_URL_NAME/show?id='+req.params.id_ENTITY_URL_NAME)
            }).catch(function(err) {
                entity_helper.error500(err, req, res, errorRedirect);
            });
        });
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
            });
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "write"), function (req, res) {
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