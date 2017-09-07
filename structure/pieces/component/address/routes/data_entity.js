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
// ENUM managment
var enums = require('../utils/enum.js');

// Winston logger
var logger = require('../utils/logger');

function error500(err, req, res, redirect) {
    var isKnownError = false;
    try {

        //Sequelize validation error
        if (err.name == "SequelizeValidationError") {
            req.session.toastr.push({level: 'error', message: err.errors[0].message});
            isKnownError = true;
        }

        // Unique value constraint error
        if (typeof err.parent !== "undefined" && err.parent.errno == 1062) {
            req.session.toastr.push({level: 'error', message: err.errors[0].message});
            isKnownError = true;
        }

    } finally {
        if (isKnownError)
            return res.redirect(redirect || '/');
        else
            console.error(err);
        logger.debug(err);
        var data = {};
        data.code = 500;
        data.message = err.message || null;
        res.render('common/error', data);
    }
}

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

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
        var enumsTranslation = enums.translated("ENTITY_NAME", req.session.lang_user);
        var todo = [];
        for (var i = 0; i < data.data.length; i++) {
            for (var field in data.data[i].dataValues) {
                for (var enumField in enumsTranslation)
                    if (field == enumField)
                        for (var k = 0; k < enumsTranslation[enumField].length; k++)
                            if (data.data[i].dataValues[enumField] == enumsTranslation[enumField][k].value)
                                data.data[i].dataValues[enumField] = enumsTranslation[enumField][k].translation;
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
                var _todo = todo[i];
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
                }(_todo));
            }
        } else
            res.send(data).end();
    }).catch(function (err) {
        console.log(err);
        logger.debug(err);
        res.end();
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
        ENTITY_NAME['get' + capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            ENTITY_NAME['set' + capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            });
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
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

        ENTITY_NAME['add' + capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/ENTITY_URL_NAME/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.get('/show', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "read"), function (req, res) {
    var id_ENTITY_NAME = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "ENTITY_NAME",
        sub_menu: "list_ENTITY_NAME",
        tab: tab,
        enum: enums.translated("ENTITY_NAME", req.session.lang_user)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined') {
        data.hideButton = req.query.hideButton;
    }

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

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            // Update some data before show, e.g get picture binary
            ENTITY_NAME = entity_helper.update_local_data(ENTITY_NAME, attributes, "ENTITY_NAME");
            res.render('ENTITY_NAME/show', data);
        });

    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "write"), function (req, res) {
    var data = {
        menu: "ENTITY_NAME",
        sub_menu: "create_ENTITY_NAME",
        enum: enums.translated("ENTITY_NAME", req.session.lang_user)
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
        data.toastr = req.session.toastr;
        req.session.toastr = [];
        res.render('ENTITY_NAME/create', data);
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/create', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "write"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    createObject = enums.values("ENTITY_NAME", createObject, req.body);
    models.MODEL_NAME.create(createObject).then(function (ENTITY_NAME) {
        var redirect = '/ENTITY_URL_NAME/list';
        req.session.toastr = [{
                message: 'message.create.success',
                level: "success"
            }];

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            models[capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                if (!association) {
                    ENTITY_NAME.destroy();
                    var err = new Error();
                    err.message = "Association not found."
                    return error500(err, req, res, "/");
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
        error500(err, req, res, '/ENTITY_URL_NAME/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "write"), function (req, res) {
    var id_ENTITY_NAME = req.query.id;
    var data = {
        menu: "ENTITY_NAME",
        sub_menu: "list_ENTITY_NAME",
        enum: enums.translated("ENTITY_NAME", req.session.lang_user)
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
                // So in the context Personne we can found adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.ENTITY_NAME[name_global_list] = rows;

                if (rows.length > 1) {
                    for (var j = 0; j < data[model].length; j++) {
                        if (ENTITY_NAME[model] != null) {
                            for (var k = 0; k < ENTITY_NAME[model].length; k++) {
                                if (data[model][j].id == ENTITY_NAME[model][k].id) {
                                    data[model][j].dataValues.associated = true;
                                }
                            }
                        }
                    }
                }
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('ENTITY_NAME/update', data);
        }).catch(function (err) {
            error500(err, req, res, "/");
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("ENTITY_URL_NAME", "write"), function (req, res) {
    var id_ENTITY_NAME = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    updateObject = enums.values("ENTITY_NAME", updateObject, req.body);

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
            error500(err, req, res, '/ENTITY_URL_NAME/update_form?id=' + id_ENTITY_NAME);
        });
    }).catch(function (err) {
        error500(err, req, res, '/ENTITY_URL_NAME/update_form?id=' + id_ENTITY_NAME);
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
            error500(err, req, res, '/ENTITY_URL_NAME/list');
        });
    }).catch(function (err) {
        error500(err, req, res, '/ENTITY_URL_NAME/list');
    });

    // Check in the request come from an has one tab
    /*if (typeof req.body.associationFlag !== 'undefined'){
        var optionsSource = require('../models/options/'+req.body.associationSource);
        var foundUpdateToDo = false;
        for(var obj in optionsSource){
            if(optionsSource[obj].target == "ENTITY_NAME" && optionsSource[obj].relation == "belongsTo" && !foundUpdateToDo){
                var updateObj = {};
                // Set to null the source obj foreign key to avoid constraint error when we destroy the target
                updateObj[req.body.associationForeignKey] = null;
                foundUpdateToDo = true;
                models[capitalizeFirstLetter(req.body.associationSource)].update(updateObj, {
                    where: {
                        id: req.body.associationFlag
                    }
                }).then(function(){
                    doDelete();
                });
            }
        }
        if(!foundUpdateToDo)
            doDelete();
    } else{
        doDelete();
    }*/
});

module.exports = router;