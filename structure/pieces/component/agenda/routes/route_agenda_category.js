var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/CODE_NAME_LOWER');
var options = require('../models/options/CODE_NAME_LOWER');
var model_builder = require('../utils/model_builder');

// ENUM managment
var enums = require('../utils/enum.js');

// Winston logger
var logger = require('../utils/logger');

function error500(err, res) {
    console.error(err);
    logger.debug(err);
    var data = {};
    data.error = 500;
    res.render('common/error', data);
}

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

router.get('/list', block_access.actionAccessMiddleware("URL_ROUTE", "read"), function(req, res) {
    var data = {
        "menu": "CODE_NAME_LOWER",
        "sub_menu": "list_CODE_NAME_LOWER"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('CODE_NAME_LOWER/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("URL_ROUTE", "read"), function(req, res) {

    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options);

    filterDataTable("CODE_NAME_MODEL", req.body, include).then(function(data) {
        res.send(data).end();
    }).catch(function(err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("URL_ROUTE", "delete"), function(req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.CODE_NAME_MODEL.findOne({where: {id: idEntity}}).then(function(CODE_NAME_LOWER) {
        if (!CODE_NAME_LOWER) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        CODE_NAME_LOWER['get'+capitalizeFirstLetter(alias)]().then(function(aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            CODE_NAME_LOWER['set'+capitalizeFirstLetter(alias)](aliasEntities).then(function(){
                res.sendStatus(200).end();
            });
        });
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("URL_ROUTE", "write"), function(req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.CODE_NAME_MODEL.findOne({where: {id: idEntity}}).then(function(CODE_NAME_LOWER) {
        if (!CODE_NAME_LOWER) {
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
            return res.redirect('/URL_ROUTE/show?id='+idEntity+"#"+alias);
        }

        CODE_NAME_LOWER['add'+capitalizeFirstLetter(alias)](toAdd).then(function(){
            res.redirect('/URL_ROUTE/show?id='+idEntity+"#"+alias);
        });
    });
});

router.get('/show', block_access.actionAccessMiddleware("URL_ROUTE", "read"), function(req, res) {
    var id_CODE_NAME_LOWER = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "CODE_NAME_LOWER",
        sub_menu: "list_CODE_NAME_LOWER",
        tab: tab,
        enum: enums.translated("CODE_NAME_LOWER", req.session.lang_user)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined') {
        data.hideButton = req.query.hideButton;
    }

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.CODE_NAME_MODEL.findOne({where: {id: id_CODE_NAME_LOWER}, include: include}).then(function(CODE_NAME_LOWER) {
        if (!CODE_NAME_LOWER) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify CODE_NAME_LOWER value with the translated enum value in show result */
        for(var item in data.enum){
            for(var field in CODE_NAME_LOWER.dataValues){
                if(item == field){
                    for(var value in data.enum[item]){
                        if(data.enum[item][value].value == CODE_NAME_LOWER[field]){
                            CODE_NAME_LOWER[field] = data.enum[item][value].translation;
                        }
                    }
                }
            }
        }

        data.CODE_NAME_LOWER = CODE_NAME_LOWER;
        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function(found) {
            for (var i = 0; i < found.length; i++) {
                data.CODE_NAME_LOWER[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('CODE_NAME_LOWER/show', data);
        });

    }).catch(function(err){
        error500(err, res);
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("URL_ROUTE", "write"), function(req, res) {
    var data = {
        menu: "CODE_NAME_LOWER",
        sub_menu: "create_CODE_NAME_LOWER",
        enum: enums.translated("CODE_NAME_LOWER", req.session.lang_user)
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
        for (var i = 0; i < found.length; i++)
            data[found[i].model] = found[i].rows;
        data.toastr = req.session.toastr;
        req.session.toastr = [];
        res.render('CODE_NAME_LOWER/create', data);
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/create', block_access.actionAccessMiddleware("URL_ROUTE", "write"), function(req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    createObject = enums.values("CODE_NAME_LOWER", createObject, req.body);

    models.CODE_NAME_MODEL.create(createObject).then(function(CODE_NAME_LOWER) {
        var redirect = '/URL_ROUTE/list';
        req.session.toastr = [{
            message: 'message.create.success',
            level: "success"
        }];

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/'+req.body.associationUrl+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;
            models[capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function(association){
                if (!association) {
                    CODE_NAME_LOWER.destroy();
                    return error500("Not found", res);
                }

                var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                if (typeof association['add'+modelName] !== 'undefined')
                    association['add'+modelName](CODE_NAME_LOWER.id);
                else {
                    var obj = {};
                    obj[req.body.associationForeignKey] = CODE_NAME_LOWER.id;
                    association.update(obj);
                }
            });
        }

        var foreignKeyArray = [];
        var asArray = [];
        for (var j = 0; j < options.length; j++) {
            if(typeof options[j].foreignKey != "undefined")
                foreignKeyArray.push(options[j].foreignKey.toLowerCase());
            if(typeof options[j].as != "undefined")
                asArray.push(options[j].as.toLowerCase());
        }

        first: for (var prop in req.body) {
            if (prop.indexOf('id_') != 0 && asArray.indexOf(prop.toLowerCase()) == -1)
                continue;
            //BELONGS TO with foreignKey naming
            second: for (var i = 0; i < options.length; i++) {
                if(typeof options[i].foreignKey != "undefined" && options[i].foreignKey == prop)
                    continue first;
            }
            if(foreignKeyArray.indexOf(prop.toLowerCase()) != -1)
                continue;

            var target = prop.substr(3);
            //HAS MANY with as naming
            for (var k = 0; k < options.length; k++) {
                if(typeof options[k].as != "undefined" && options[k].as.toLowerCase() == prop.toLowerCase())
                    target = options[k].as;
            }

            target = target.charAt(0).toUpperCase() + target.toLowerCase().slice(1);
            CODE_NAME_LOWER['set'+target](req.body[prop]);
        }

        res.redirect(redirect);
    }).catch(function(err){
        var isKnownError = false;
        try {
            // Unique value constraint
            if (err.parent.errno == 1062) {
                req.session.toastr.push({level: 'error', message: err.errors[0].message});
                isKnownError = true;
            }
        } finally {
            if (isKnownError)
                return res.redirect('/URL_ROUTE/create_form');
            error500(err, res);
        }
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("URL_ROUTE", "write"), function(req, res) {
    id_CODE_NAME_LOWER = req.query.id;
    var data = {
        menu: "CODE_NAME_LOWER",
        sub_menu: "list_CODE_NAME_LOWER",
        enum: enums.translated("CODE_NAME_LOWER", req.session.lang_user)
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
        models.CODE_NAME_MODEL.findOne({where: {id: id_CODE_NAME_LOWER}, include: [{all: true}]}).then(function(CODE_NAME_LOWER) {
            if (!CODE_NAME_LOWER) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.CODE_NAME_LOWER = CODE_NAME_LOWER;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can found adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.CODE_NAME_LOWER[name_global_list] = rows;

                if (rows.length > 1){
                    for(var j = 0; j < data[model].length; j++){
                        if(CODE_NAME_LOWER[model] != null){
                            for (var k = 0; k < CODE_NAME_LOWER[model].length; k++){
                                if (data[model][j].id == CODE_NAME_LOWER[model][k].id){
                                    data[model][j].dataValues.associated = true;
                                }
                            }
                        }
                    }
                }
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('CODE_NAME_LOWER/update', data);
        }).catch(function(err){
            error500(err, res);
        });
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/update', block_access.actionAccessMiddleware("URL_ROUTE", "write"), function(req, res) {
    var id_CODE_NAME_LOWER = parseInt(req.body.id);

    if(typeof req.body.version !== "undefined")
        req.body.version = parseInt(req.body.version) + 1;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    updateObject = enums.values("CODE_NAME_LOWER", updateObject, req.body);

    models.CODE_NAME_MODEL.findOne({where: {id: id_CODE_NAME_LOWER}}).then(function(CODE_NAME_LOWER) {
        if (!CODE_NAME_LOWER) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        CODE_NAME_LOWER.update(updateObject, {where: {id: id_CODE_NAME_LOWER}}).then(function() {

            var redirect = '/URL_ROUTE/show?id=' + id_CODE_NAME_LOWER;
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/'+req.body.associationUrl+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;

            req.session.toastr = [{
                message: 'message.update.success',
                level: "success"
            }];

            res.redirect(redirect);
        }).catch(function(err){
            var isKnownError = false;
            try {
                // Unique value constraint
                if (err.parent.errno == 1062) {
                    req.session.toastr.push({level: 'error', message: err.errors[0].message});
                    isKnownError = true;
                }
            } finally {
                if (isKnownError)
                    return res.redirect('/URL_ROUTE/update_form?id='+id_CODE_NAME_LOWER);
                error500(err, res);
            }
        });
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/delete', block_access.actionAccessMiddleware("URL_ROUTE", "delete"), function(req, res) {
    var id_CODE_NAME_LOWER = req.body.id;

    models.CODE_NAME_MODEL.destroy({
        where: {
            id: id_CODE_NAME_LOWER
        }
    }).then(function() {
        req.session.toastr = [{
            message: 'message.delete.success',
            level: "success"
        }];
        var redirect = '/URL_ROUTE/list';
        if (typeof req.body.associationFlag !== 'undefined')
            redirect = '/'+req.body.associationUrl+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;
        res.redirect(redirect);
    }).catch(function(err){
        error500(err, res);
    });
});

module.exports = router;