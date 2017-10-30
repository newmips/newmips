var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var holidaysApi = require('public-holidays');
var moment = require('moment');

// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_cra_team');
var options = require('../models/options/e_cra_team');
var model_builder = require('../utils/model_builder');

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');

// Winston logger
var logger = require('../utils/logger');


function error500(err, req, res, redirect) {
    var isKnownError = false;
    try {

        //Sequelize validation error
        if(err.name == "SequelizeValidationError"){
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

router.get('/list', block_access.actionAccessMiddleware("cra_team", "read"), function (req, res) {
    var data = {
        "menu": "e_cra_team",
        "sub_menu": "list_e_cra_team"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_cra_team/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("cra_team", "read"), function (req, res) {

    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options);

    filterDataTable("E_cra_team", req.body, include).then(function (data) {
        // Replace data enum value by translated value for datalist
        var enumsTranslation = enums_radios.translated("e_cra_team", req.session.lang_user, options);
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

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("cra_team", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_cra_team.findOne({where: {id: idEntity}}).then(function (e_cra_team) {
        if (!e_cra_team) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_cra_team['get' + capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_cra_team['set' + capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            });
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("cra_team", "write"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_cra_team.findOne({where: {id: idEntity}}).then(function (e_cra_team) {
        if (!e_cra_team) {
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
            return res.redirect('/cra_team/show?id=' + idEntity + "#" + alias);
        }

        // Check if user is already in the Team
        var hasTeamPromise = [];
        if (alias == 'r_users')
            for (var i = 0; i < toAdd.length; i++)
                hasTeamPromise.push(new Promise(function(resolve, reject) {
                    models.E_cra_team.findOne({
                        include: [{
                            model: models.E_user,
                            as: 'r_users',
                            where: {id: toAdd[i]}
                        }]
                    }).then(function(found) {
                        if (!found)
                            return resolve({isOkToAdd: true});
                        resolve({isOkToAdd: false, login: found.r_users[0].f_login});
                    });
                }));

        Promise.all(hasTeamPromise).then(function(isOkToAdd) {
            var notOk = 'Following users already have a C.R.A Team : ';
            var isEverythingOk = true;
            for (var i = 0; i < isOkToAdd.length; i++) {
                if (isOkToAdd[i].isOkToAdd == false) {
                    isEverythingOk = false;
                    notOk += isOkToAdd[i].login+' ';
                }
            }

            // If user not already in a team, add and redirect
            if (isEverythingOk == true) {
                e_cra_team['add' + capitalizeFirstLetter(alias)](toAdd).then(function () {
                    res.redirect('/cra_team/show?id=' + idEntity + "#" + alias);
                });
            }
            // If user already in a team, set error toastr and redirect
            else {
                req.session.toastr.push({level: 'error', message: notOk});
                return res.redirect('/cra_team/show?id=' + idEntity + "#" + alias);
            }
        });

    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.get('/show', block_access.actionAccessMiddleware("cra_team", "read"), function (req, res) {
    var id_e_cra_team = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_cra_team",
        sub_menu: "list_e_cra_team",
        tab: tab,
        enum_radio: enums_radios.translated("e_cra_team", req.session.lang_user, options)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined') {
        data.hideButton = req.query.hideButton;
    }

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.E_cra_team.findOne({where: {id: id_e_cra_team}, include: include}).then(function (e_cra_team) {
        if (!e_cra_team) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify e_cra_team value with the translated enum value in show result */
        for (var item in data.enum)
            for (var field in e_cra_team.dataValues)
                if (item == field)
                    for (var value in data.enum[item])
                        if (data.enum[item][value].value == e_cra_team[field])
                            e_cra_team[field] = data.enum[item][value].translation;

        /* Update local e_cra_team data before show */
        data.e_cra_team = e_cra_team;
        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function (found) {
            for (var i = 0; i < found.length; i++) {
                data.e_cra_team[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_cra_team/show', data);
        });

    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/generate_holidays', block_access.actionAccessMiddleware("cra_team", "write"), function (req, res) {
    var countryLang = req.body.lang.split('-');
    var country = countryLang[1];
    var lang = countryLang[0];
    var team_id = req.body.team_id;
    var yearStart = moment().startOf('year').toDate().getTime();
    var yearEnd = moment().endOf('year').toDate().getTime();

    holidaysApi({
        country: country,
        lang: lang,
        start: yearStart,
        end: yearEnd
    }, function(err, holidays) {
        if (err) {
            console.log(err);
            return error500(err, req, res);
        }

        var bulkCreate = [];
        for (var i = 0; i < holidays.length; i++) {
            var date = new Date(holidays[i].start);
            bulkCreate.push({f_date: date, fk_id_cra_team: team_id, f_label: holidays[i].summary});
        }

        models.E_cra_calendar_exception.bulkCreate(bulkCreate).then(function() {
            res.redirect('/cra_team/show?id='+team_id+'/#r_cra_calendar_exception');
        });
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("cra_team", "write"), function (req, res) {
    var data = {
        menu: "e_cra_team",
        sub_menu: "create_e_cra_team",
        enum_radio: enums_radios.translated("e_cra_team", req.session.lang_user, options)
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
        res.render('e_cra_team/create', data);
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/create', block_access.actionAccessMiddleware("cra_team", "write"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    //createObject = enums.values("e_cra_team", createObject, req.body);

    // Set creating user as team admin
    createObject.fk_id_admin_user = req.session.passport.user.id;

    // Create default calendar settings
    models.E_cra_calendar_settings.create({
        f_monday: true,
        f_tuesday: true,
        f_wednesday: true,
        f_thursday: true,
        f_friday: true,
        f_saturday: false,
        f_sunday: false
    }).then(function(settings) {
        createObject.fk_id_cra_calendar_settings = settings.id;
        models.E_cra_team.create(createObject).then(function (e_cra_team) {
            var redirect = '/cra_team/list';
            req.session.toastr = [{
                    message: 'message.create.success',
                    level: "success"
                }];

            if (typeof req.body.associationFlag !== 'undefined') {
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
                models[capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                    if (!association) {
                        e_cra_team.destroy();
                        var err = new Error();
                        err.message = "Association not found."
                        return error500(err, req, res, "/");
                    }

                    var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                    if (typeof association['add' + modelName] !== 'undefined')
                        association['add' + modelName](e_cra_team.id);
                    else {
                        var obj = {};
                        obj[req.body.associationForeignKey] = e_cra_team.id;
                        association.update(obj);
                    }
                });
            }

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_cra_team, req.body, createObject, options);

            res.redirect(redirect);
        }).catch(function (err) {
            error500(err, req, res, '/cra_team/create_form');
        });
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("cra_team", "write"), function (req, res) {
    id_e_cra_team = req.query.id;
    var data = {
        menu: "e_cra_team",
        sub_menu: "list_e_cra_team",
        enum_radio: enums_radios.translated("e_cra_team", req.session.lang_user, options)
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
        models.E_cra_team.findOne({where: {id: id_e_cra_team}, include: [{all: true}]}).then(function (e_cra_team) {
            if (!e_cra_team) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_cra_team = e_cra_team;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can found adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_cra_team[name_global_list] = rows;

                if (rows.length > 1) {
                    for (var j = 0; j < data[model].length; j++) {
                        if (e_cra_team[model] != null) {
                            for (var k = 0; k < e_cra_team[model].length; k++) {
                                if (data[model][j].id == e_cra_team[model][k].id) {
                                    data[model][j].dataValues.associated = true;
                                }
                            }
                        }
                    }
                }
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_cra_team/update', data);
        }).catch(function (err) {
            error500(err, req, res, "/");
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("cra_team", "write"), function (req, res) {
    var id_e_cra_team = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version))
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    //updateObject = enums.values("e_cra_team", updateObject, req.body);

    models.E_cra_team.findOne({where: {id: id_e_cra_team}}).then(function (e_cra_team) {
        if (!e_cra_team) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_cra_team.update(updateObject, {where: {id: id_e_cra_team}}).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_cra_team, req.body, updateObject, options);

            var redirect = '/cra_team/show?id=' + id_e_cra_team;
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

            req.session.toastr = [{
                message: 'message.update.success',
                level: "success"
            }];

            res.redirect(redirect);
        }).catch(function (err) {
            error500(err, req, res, '/cra_team/update_form?id=' + id_e_cra_team);
        });
    }).catch(function (err) {
        error500(err, req, res, '/cra_team/update_form?id=' + id_e_cra_team);
    });
});

router.post('/delete', block_access.actionAccessMiddleware("cra_team", "delete"), function (req, res) {
    var id_e_cra_team = req.body.id;

    models.E_cra_team.destroy({
        where: {
            id: id_e_cra_team
        }
    }).then(function () {
        req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];
        var redirect = '/cra_team/list';
        if (typeof req.body.associationFlag !== 'undefined')
            redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
        res.redirect(redirect);
    }).catch(function (err) {
        error500(err, req, res, '/cra_team/list');
    });
});

module.exports = router;