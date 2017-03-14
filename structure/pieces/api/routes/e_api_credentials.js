var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var filterDataTable = require('../utils/filterDataTable');
var randomString = require('randomstring');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_api_credentials');
var options = require('../models/options/e_api_credentials');
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

router.get('/list', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {
    var data = {
        "menu": "e_api_credentials",
        "sub_menu": "list_e_api_credentials"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_api_credentials/list', data);
});

router.post('/datalist', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {

    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options);

    filterDataTable("E_api_credentials", req.body, include).then(function (data) {
        res.send(data).end();
    }).catch(function (err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("api_credentials", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_api_credentials.findOne({where: {id: idEntity}}).then(function (e_api_credentials) {
        if (!e_api_credentials) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_api_credentials['get' + capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_api_credentials['set' + capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            });
        });
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("api_credentials", "write"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_api_credentials.findOne({where: {id: idEntity}}).then(function (e_api_credentials) {
        if (!e_api_credentials) {
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
            return res.redirect('/api_credentials/show?id=' + idEntity + "#" + alias);
        }

        e_api_credentials['add' + capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/api_credentials/show?id=' + idEntity + "#" + alias);
        });
    });
});

router.get('/show', block_access.actionAccessMiddleware("api_credentials", "read"), function (req, res) {
    var id_e_api_credentials = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_api_credentials",
        sub_menu: "list_e_api_credentials",
        tab: tab,
        enum: enums.translated("e_api_credentials", req.session.lang_user)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined') {
        data.hideButton = req.query.hideButton;
    }

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.E_api_credentials.findOne({where: {id: id_e_api_credentials}, include: include}).then(function (e_api_credentials) {
        if (!e_api_credentials) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify e_api_credentials value with the translated enum value in show result */
        for (var item in data.enum) {
            for (var field in e_api_credentials.dataValues) {
                if (item == field) {
                    for (var value in data.enum[item]) {
                        if (data.enum[item][value].value == e_api_credentials[field]) {
                            e_api_credentials[field] = data.enum[item][value].translation;
                        }
                    }
                }
            }
        }

        data.e_api_credentials = e_api_credentials;
        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function (found) {
            for (var i = 0; i < found.length; i++) {
                data.e_api_credentials[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_api_credentials/show', data);
        });

    }).catch(function (err) {
        error500(err, res);
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("api_credentials", "write"), function (req, res) {
    var data = {
        menu: "e_api_credentials",
        sub_menu: "create_e_api_credentials",
        enum: enums.translated("e_api_credentials", req.session.lang_user)
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
        res.render('e_api_credentials/create', data);
    }).catch(function (err) {
        error500(err, res);
    });
});

router.post('/create', block_access.actionAccessMiddleware("api_credentials", "write"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    createObject = enums.values("e_api_credentials", createObject, req.body);

    // Generate client ID and client SECRET
    createObject.f_client_key = randomString.generate(15);
    createObject.f_client_secret = randomString.generate(15);
    models.E_api_credentials.create(createObject).then(function (e_api_credentials) {
        var redirect = '/api_credentials/list';
        req.session.toastr = [{
                message: 'message.create.success',
                level: "success"
            }];

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            models[capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                if (!association) {
                    e_api_credentials.destroy();
                    return error500("Not found", res);
                }

                var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                if (typeof association['add' + modelName] !== 'undefined')
                    association['add' + modelName](e_api_credentials.id);
                else {
                    var obj = {};
                    obj[req.body.associationForeignKey] = e_api_credentials.id;
                    association.update(obj);
                }
            });
        }

        var foreignKeyArray = [];
        var asArray = [];
        for (var j = 0; j < options.length; j++) {
            if (typeof options[j].foreignKey != "undefined")
                foreignKeyArray.push(options[j].foreignKey.toLowerCase());
            if (typeof options[j].as != "undefined")
                asArray.push(options[j].as.toLowerCase());
        }

        first: for (var prop in req.body) {
            if (prop.indexOf('id_') != 0 && asArray.indexOf(prop.toLowerCase()) == -1)
                continue;
            //BELONGS TO with foreignKey naming
            second: for (var i = 0; i < options.length; i++) {
                if (typeof options[i].foreignKey != "undefined" && options[i].foreignKey == prop)
                    continue first;
            }
            if (foreignKeyArray.indexOf(prop.toLowerCase()) != -1)
                continue;

            var target = prop.substr(3);
            //HAS MANY with as naming
            for (var k = 0; k < options.length; k++) {
                if (typeof options[k].as != "undefined" && options[k].as.toLowerCase() == prop.toLowerCase())
                    target = options[k].as;
            }

            target = target.charAt(0).toUpperCase() + target.toLowerCase().slice(1);
            e_api_credentials['set' + target](req.body[prop]);
        }

        res.redirect(redirect);
    }).catch(function (err) {
        var isKnownError = false;
        try {
            // Unique value constraint
            if (err.parent.errno == 1062) {
                req.session.toastr.push({level: 'error', message: err.errors[0].message});
                isKnownError = true;
            }
        } finally {
            if (isKnownError)
                return res.redirect('/api_credentials/create_form');
            error500(err, res);
        }
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("api_credentials", "write"), function (req, res) {
    id_e_api_credentials = req.query.id;
    var data = {
        menu: "e_api_credentials",
        sub_menu: "list_e_api_credentials",
        enum: enums.translated("e_api_credentials", req.session.lang_user)
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
        models.E_api_credentials.findOne({where: {id: id_e_api_credentials}, include: [{all: true}]}).then(function (e_api_credentials) {
            if (!e_api_credentials) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_api_credentials = e_api_credentials;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can found adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_api_credentials[name_global_list] = rows;

                if (rows.length > 1) {
                    for (var j = 0; j < data[model].length; j++) {
                        if (e_api_credentials[model] != null) {
                            for (var k = 0; k < e_api_credentials[model].length; k++) {
                                if (data[model][j].id == e_api_credentials[model][k].id) {
                                    data[model][j].dataValues.associated = true;
                                }
                            }
                        }
                    }
                }
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_api_credentials/update', data);
        }).catch(function (err) {
            error500(err, res);
        });
    }).catch(function (err) {
        error500(err, res);
    });
});

router.post('/update', block_access.actionAccessMiddleware("api_credentials", "write"), function (req, res) {
    var id_e_api_credentials = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined")
        req.body.version = parseInt(req.body.version) + 1;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    updateObject = enums.values("e_api_credentials", updateObject, req.body);

    models.E_api_credentials.findOne({where: {id: id_e_api_credentials}}).then(function (e_api_credentials) {
        if (!e_api_credentials) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_api_credentials.update(updateObject, {where: {id: id_e_api_credentials}}).then(function () {

            var redirect = '/api_credentials/show?id=' + id_e_api_credentials;
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

            req.session.toastr = [{
                    message: 'message.update.success',
                    level: "success"
                }];

            res.redirect(redirect);
        }).catch(function (err) {
            var isKnownError = false;
            try {
                // Unique value constraint
                if (err.parent.errno == 1062) {
                    req.session.toastr.push({level: 'error', message: err.errors[0].message});
                    isKnownError = true;
                }
            } finally {
                if (isKnownError)
                    return res.redirect('/api_credentials/update_form?id=' + id_e_api_credentials);
                error500(err, res);
            }
        });
    }).catch(function (err) {
        error500(err, res);
    });
});

router.post('/delete', block_access.actionAccessMiddleware("api_credentials", "delete"), function (req, res) {
    var id_e_api_credentials = req.body.id;

    models.E_api_credentials.destroy({
        where: {
            id: id_e_api_credentials
        }
    }).then(function () {
        req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];
        var redirect = '/api_credentials/list';
        if (typeof req.body.associationFlag !== 'undefined')
            redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
        res.redirect(redirect);
    }).catch(function (err) {
        error500(err, res);
    });
});

module.exports = router;