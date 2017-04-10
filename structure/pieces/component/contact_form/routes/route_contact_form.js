var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_contact_form');
var options = require('../models/options/e_contact_form');

var attributesSettings = require('../models/attributes/e_contact_form_settings');
var optionsSettings = require('../models/options/e_contact_form_settings');

var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
// ENUM managment
var enums = require('../utils/enum.js');

// Winston logger
var logger = require('../utils/logger');

var mailer_helper = require('../utils/mailer');

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

router.get('/list', block_access.actionAccessMiddleware("contact_form", "read"), function (req, res) {
    var data = {
        "menu": "e_contact_form",
        "sub_menu": "list_e_contact_form"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_contact_form/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("contact_form", "read"), function (req, res) {

    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options);

    filterDataTable("E_contact_form", req.body, include).then(function (data) {
        // Replace data enum value by translated value for datalist
        var enumsTranslation = enums.translated("e_contact_form", req.session.lang_user);
        for(var i=0; i<data.data.length; i++)
            for(var field in data.data[i].dataValues)
                for(var enumField in enumsTranslation)
                    if(field == enumField)
                        for(var j=0; j<enumsTranslation[enumField].length; j++)
                            if(data.data[i].dataValues[enumField] == enumsTranslation[enumField][j].value)
                                data.data[i].dataValues[enumField] = enumsTranslation[enumField][j].translation;

        res.send(data).end();
    }).catch(function (err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("contact_form", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_contact_form.findOne({where: {id: idEntity}}).then(function (e_contact_form) {
        if (!e_contact_form) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_contact_form['get' + capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_contact_form['set' + capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            });
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("contact_form", "write"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_contact_form.findOne({where: {id: idEntity}}).then(function (e_contact_form) {
        if (!e_contact_form) {
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
            return res.redirect('/contact_form/show?id=' + idEntity + "#" + alias);
        }

        e_contact_form['add' + capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/contact_form/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.get('/show', block_access.actionAccessMiddleware("contact_form", "read"), function (req, res) {
    var id_e_contact_form = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_contact_form",
        sub_menu: "list_e_contact_form",
        tab: tab,
        enum: enums.translated("e_contact_form", req.session.lang_user)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined') {
        data.hideButton = req.query.hideButton;
    }

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.E_contact_form.findOne({where: {id: id_e_contact_form}, include: include}).then(function (e_contact_form) {
        if (!e_contact_form) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify e_contact_form value with the translated enum value in show result */
        for (var item in data.enum)
            for (var field in e_contact_form.dataValues)
                if (item == field)
                    for (var value in data.enum[item])
                        if (data.enum[item][value].value == e_contact_form[field])
                            e_contact_form[field] = data.enum[item][value].translation;

        /* Update local e_contact_form data before show */
        data.e_contact_form = e_contact_form;
        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function (found) {
            for (var i = 0; i < found.length; i++) {
                data.e_contact_form[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_contact_form/show', data);
        });

    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("contact_form", "write"), function (req, res) {
    var data = {
        menu: "e_contact_form",
        sub_menu: "create_e_contact_form",
        enum: enums.translated("e_contact_form", req.session.lang_user)
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
        res.render('e_contact_form/create', data);
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/create', block_access.actionAccessMiddleware("contact_form", "write"), function (req, res) {

    models.E_contact_form_settings.findById(1).then(function(settings){
        var from = req.body.f_name+" <"+req.body.f_sender+">";
        var mailOptions = {
            from: from,
            to: settings.f_administrateur,
            subject: req.body.f_title,
            html: req.body.f_content
        };
        var mailSettings = {
            transport: {
                host: settings.f_transport_host,
                port: settings.f_port,
                secure: settings.f_secure,
                auth: {
                    user: settings.f_user,
                    pass: settings.f_pass
                }
            },
            expediteur: settings.f_expediteur,
            administrateur: settings.f_administrateur,
            host: settings.f_host
        };
        mailer_helper.sendMailAsyncCustomTransport(mailOptions, mailSettings).then(function(success) {
            var createObject = model_builder.buildForRoute(attributes, options, req.body);
            createObject = enums.values("e_contact_form", createObject, req.body);
            createObject.f_id_user_user = req.session.passport.user.id;
            createObject.f_recipient = settings.f_administrateur;
            models.E_contact_form.create(createObject).then(function (e_contact_form) {
                var redirect = '/contact_form/create_form';
                req.session.toastr = [{
                    message: "Votre mail a bien été envoyé !",
                    level: "success"
                }];

                if (typeof req.body.associationFlag !== 'undefined') {
                    redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
                    models[capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                        if (!association) {
                            e_contact_form.destroy();
                            var err = new Error();
                            err.message = "Association not found."
                            return error500(err, req, res, "/");
                        }

                        var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                        if (typeof association['add' + modelName] !== 'undefined')
                            association['add' + modelName](e_contact_form.id);
                        else {
                            var obj = {};
                            obj[req.body.associationForeignKey] = e_contact_form.id;
                            association.update(obj);
                        }
                    });
                }

                // We have to find value in req.body that are linked to an hasMany or belongsToMany association
                // because those values are not updated for now
                model_builder.setAssocationManyValues(e_contact_form, req.body, createObject, options);
                res.redirect(redirect);
            }).catch(function (err) {
                error500(err, req, res, '/contact_form/create_form');
            });
        }).catch(function(err) {
            error500(err, req, res, '/contact_form/create_form');
        });
    });
});

router.post('/delete', block_access.actionAccessMiddleware("contact_form", "delete"), function (req, res) {
    var id_e_contact_form = req.body.id;

    models.E_contact_form.findOne({where: {id: id_e_contact_form}}).then(function (deleteObject) {
        models.E_contact_form.destroy({
            where: {
                id: id_e_contact_form
            }
        }).then(function () {
            req.session.toastr = [{
                    message: 'message.delete.success',
                    level: "success"
                }];

            var redirect = '/contact_form/list';
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            res.redirect(redirect);
            entity_helper.remove_files("e_contact_form",deleteObject,attributes);
        }).catch(function (err) {
            error500(err, req, res, '/contact_form/list');
        });
    }).catch(function (err) {
        error500(err, req, res, '/contact_form/list');
    });
});

router.get('/settings', block_access.actionAccessMiddleware("contact_form_settings", "write"), function (req, res) {
    id_e_contact_form_settings = 1;
    var data = {
        menu: "e_contact_form_settings",
        sub_menu: "list_e_contact_form_settings",
        enum: enums.translated("e_contact_form_settings", req.session.lang_user)
    };

    if (typeof req.query.associationFlag !== 'undefined') {
        data.associationFlag = req.query.associationFlag;
        data.associationSource = req.query.associationSource;
        data.associationForeignKey = req.query.associationForeignKey;
        data.associationAlias = req.query.associationAlias;
        data.associationUrl = req.query.associationUrl;
    }

    var associationsFinder = model_builder.associationsFinder(models, optionsSettings);

    Promise.all(associationsFinder).then(function (found) {
        models.E_contact_form_settings.findOne({where: {id: id_e_contact_form_settings}, include: [{all: true}]}).then(function (e_contact_form_settings) {
            if (!e_contact_form_settings) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_contact_form_settings = e_contact_form_settings;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can found adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_contact_form_settings[name_global_list] = rows;

                if (rows.length > 1) {
                    for (var j = 0; j < data[model].length; j++) {
                        if (e_contact_form_settings[model] != null) {
                            for (var k = 0; k < e_contact_form_settings[model].length; k++) {
                                if (data[model][j].id == e_contact_form_settings[model][k].id) {
                                    data[model][j].dataValues.associated = true;
                                }
                            }
                        }
                    }
                }
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_contact_form/settings', data);
        }).catch(function (err) {
            error500(err, req, res, "/");
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/settings', block_access.actionAccessMiddleware("contact_form_settings", "write"), function (req, res) {
    var id_e_contact_form_settings = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version))
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributesSettings, optionsSettings, req.body);
    updateObject = enums.values("e_contact_form_settings", updateObject, req.body);

    models.E_contact_form_settings.findOne({where: {id: id_e_contact_form_settings}}).then(function (e_contact_form_settings) {
        if (!e_contact_form_settings) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_contact_form_settings.update(updateObject, {where: {id: id_e_contact_form_settings}}).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_contact_form_settings, req.body, updateObject, optionsSettings);

            var redirect = '/contact_form/settings?id=' + id_e_contact_form_settings;

            req.session.toastr = [{
                message: 'message.update.success',
                level: "success"
            }];

            res.redirect(redirect);
        }).catch(function (err) {
            error500(err, req, res, '/contact_form/settings?id=' + id_e_contact_form_settings);
        });
    }).catch(function (err) {
        error500(err, req, res, '/contact_form/settings?id=' + id_e_contact_form_settings);
    });
});

module.exports = router;