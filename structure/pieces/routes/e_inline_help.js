var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_inline_help');
var options = require('../models/options/e_inline_help');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var global = require('../config/global');
// ENUM managment
var enums_radios = require('../utils/enum_radio.js');
var fs = require('fs-extra');

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

router.get('/list', block_access.actionAccessMiddleware("inline_help", "read"), function (req, res) {
    var data = {
        "menu": "e_inline_help",
        "sub_menu": "list_e_inline_help"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_inline_help/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("inline_help", "read"), function (req, res) {
    var language = require('../services/language')(req.session.lang_user);

    var include = model_builder.getDatalistInclude(models, options);
    filterDataTable("E_inline_help", req.body, include).then(function (data) {
        for (var i = 0; i < data.data.length; i++) {
            var row = data.data[i];
            var entityTrad = 'entity.'+row.f_entity+'.label_entity';
            var fieldTrad = 'entity.'+row.f_entity+'.'+row.f_field;
            data.data[i].f_entity = language.__(entityTrad);
            data.data[i].f_field = language.__(fieldTrad);
        }
        res.send(data).end();
    }).catch(function (err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("inline_help", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_inline_help.findOne({where: {id: idEntity}}).then(function (e_inline_help) {
        if (!e_inline_help) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_inline_help['get' + capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_inline_help['set' + capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            });
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("inline_help", "create"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_inline_help.findOne({where: {id: idEntity}}).then(function (e_inline_help) {
        if (!e_inline_help) {
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
            return res.redirect('/inline_help/show?id=' + idEntity + "#" + alias);
        }

        e_inline_help['add' + capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/inline_help/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.get('/show', block_access.actionAccessMiddleware("inline_help", "read"), function (req, res) {
    var id_e_inline_help = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_inline_help",
        sub_menu: "list_e_inline_help",
        tab: tab,
        enum: enums_radios.translated("e_inline_help", req.session.lang_user)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined') {
        data.hideButton = req.query.hideButton;
    }

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.E_inline_help.findOne({where: {id: id_e_inline_help}, include: include}).then(function (e_inline_help) {
        if (!e_inline_help) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }
        var entity = e_inline_help.f_entity;
        e_inline_help.f_entity = 'entity.'+entity+'.label_entity';
        e_inline_help.f_field = 'entity.'+entity+'.'+e_inline_help.f_field;
        data.e_inline_help = e_inline_help;
        res.render('e_inline_help/show', data);
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.get('/help/:entity/:field', function(req, res) {
    models.E_inline_help.findOne({where: {f_entity: 'e_'+req.params.entity, f_field: req.params.field}}).then(function(help) {
        if (!help)
            res.status(404).end();
        res.send(help.f_content);
    });
})

router.get('/create_form', block_access.actionAccessMiddleware("inline_help", "create"), function (req, res) {
    var data = {
        menu: "e_inline_help",
        sub_menu: "create_e_inline_help",
        enum: enums_radios.translated("e_inline_help", req.session.lang_user)
    };
    var entities = [];
    fs.readdirSync(__dirname+'/../models/attributes/').filter(function(file) {
        return file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file.substring(0, 2) == 'e_';
    }).forEach(function(file) {
        var fields = [];
        var attributesObj = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+file));
        var optionsObj = JSON.parse(fs.readFileSync(__dirname+'/../models/options/'+file));
        var entityName = file.substring(0, file.length-5);
        for (var field in attributesObj)
            if (field != 'id' && field != 'version' && field.indexOf('f_') == 0)
                fields.push({tradKey: 'entity.'+entityName+'.'+field, field: field});
        for (var i = 0; i < optionsObj.length; i++)
            if (optionsObj[i].structureType == 'relatedTo' || optionsObj[i].structureType == 'relatedToMany')
                fields.push({tradKey: 'entity.'+entityName+'.'+optionsObj[i].as, field: optionsObj[i].as});
        if (fields.length > 0)
            entities.push({tradKey: 'entity.'+entityName+'.label_entity', entity: entityName, fields: fields});
    });
    data.entities = entities;
    res.render('e_inline_help/create', data);
});

router.post('/create', block_access.actionAccessMiddleware("inline_help", "create"), function (req, res) {

    var createObject = {f_entity: req.body.f_entity, f_field: req.body.f_field.split('.')[1], f_content: req.body.f_content};

    models.E_inline_help.create(createObject).then(function (e_inline_help) {
        var redirect = '/inline_help/list';

        res.redirect(redirect);
    }).catch(function (err) {
        error500(err, req, res, '/inline_help/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("inline_help", 'update'), function (req, res) {
    var id_e_inline_help = req.query.id;
    var data = {
        menu: "e_inline_help",
        sub_menu: "list_e_inline_help",
        enum: enums_radios.translated("e_inline_help", req.session.lang_user)
    };

    models.E_inline_help.findOne({where: {id: id_e_inline_help}}).then(function (e_inline_help) {
        if (!e_inline_help) {
            data.error = 404;
            return res.render('common/error', data);
        }

        var entity = e_inline_help.f_entity;
        e_inline_help.f_entity = 'entity.'+entity+'.label_entity';
        e_inline_help.f_field = 'entity.'+entity+'.'+e_inline_help.f_field;
        data.e_inline_help = e_inline_help;

        res.render('e_inline_help/update', data);
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("inline_help", 'update'), function (req, res) {
    var id_e_inline_help = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    // updateObject = enums_radios.values("e_inline_help", updateObject, req.body);

    models.E_inline_help.findOne({where: {id: id_e_inline_help}}).then(function (e_inline_help) {
        if (!e_inline_help) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_inline_help.update(updateObject, {where: {id: id_e_inline_help}}).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_inline_help, req.body, updateObject, options);

            var redirect = '/inline_help/show?id=' + id_e_inline_help;
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

            req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

            res.redirect(redirect);
        }).catch(function (err) {
            error500(err, req, res, '/inline_help/update_form?id=' + id_e_inline_help);
        });
    }).catch(function (err) {
        error500(err, req, res, '/inline_help/update_form?id=' + id_e_inline_help);
    });
});

router.post('/delete', block_access.actionAccessMiddleware("inline_help", "delete"), function (req, res) {
    var id_e_inline_help = parseInt(req.body.id);

    models.E_inline_help.findOne({where: {id: id_e_inline_help}}).then(function (deleteObject) {
        models.E_inline_help.destroy({
            where: {
                id: id_e_inline_help
            }
        }).then(function () {
            req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];

            var redirect = '/inline_help/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.remove_files("e_inline_help", deleteObject, attributes);
        }).catch(function (err) {
            error500(err, req, res, '/inline_help/list');
        });
    }).catch(function (err) {
        error500(err, req, res, '/inline_help/list');
    });
});

module.exports = router;