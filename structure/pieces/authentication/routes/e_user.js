var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_user');
var options = require('../models/options/e_user');
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

router.get('/list', block_access.isLoggedIn, function(req, res) {
    var data = {
        "menu": "e_user",
        "sub_menu": "list_e_user"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_user/list', data);
});

router.post('/datalist', block_access.isLoggedIn, block_access.actionAccessMiddleware("user", "read"), function(req, res) {

    filterDataTable("E_user", req.body).then(function(data) {
        res.send(data).end();
    }).catch(function(err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/fieldset/:alias/remove', block_access.isLoggedIn, block_access.actionAccessMiddleware("user", "delete"), function(req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_user.findOne({where: {id: idEntity}}).then(function(e_user) {
        if (!e_user) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_user['get'+capitalizeFirstLetter(alias)]().then(function(aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_user['set'+capitalizeFirstLetter(alias)](aliasEntities).then(function(){
                res.sendStatus(200).end();
            });
        });
    });
});

router.post('/fieldset/:alias/add', block_access.isLoggedIn, block_access.actionAccessMiddleware("user", "write"), function(req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_user.findOne({where: {id: idEntity}}).then(function(e_user) {
        if (!e_user) {
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
            return res.redirect('/user/show?id='+idEntity+"#"+alias);
        }

        e_user['add'+capitalizeFirstLetter(alias)](toAdd).then(function(){
            res.redirect('/user/show?id='+idEntity+"#"+alias);
        });
    });
});

router.get('/show', block_access.isLoggedIn, block_access.actionAccessMiddleware("user", "read"), function(req, res) {
    var id_e_user = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_user",
        sub_menu: "list_e_user",
        tab: tab,
        enum: enums.translated("e_user", req.session.lang_user)
    };

    models.E_user.findOne({where: {id: id_e_user}, include: [{all: true}]}).then(function(e_user) {
        if (!e_user) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify e_user value with the translated enum value in show result */
        for(var item in data.enum){
            for(var field in e_user.dataValues){
                if(item == field){
                    for(var value in data.enum[item]){
                        if(data.enum[item][value].value == e_user[field]){
                            e_user[field] = data.enum[item][value].translation;
                        }
                    }
                }
            }
        }

        data.e_user = e_user;

        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function(found) {
            for (var i = 0; i < found.length; i++) {
                data.e_user[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_user/show', data);
        });

    }).catch(function(err){
        error500(err, res);
    });
});

router.get('/create_form', block_access.isLoggedIn, block_access.actionAccessMiddleware("user", "write"), function(req, res) {
    var data = {
        menu: "e_user",
        sub_menu: "create_e_user",
        enum: enums.translated("e_user", req.session.lang_user)
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
        res.render('e_user/create', data);
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/create', block_access.isLoggedIn, block_access.actionAccessMiddleware("user", "write"), function(req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    createObject = enums.values("e_user", createObject, req.body)

    createObject.f_enabled = 0;
    models.E_user.create(createObject).then(function(e_user) {
        var redirect = '/user/list';
        req.session.toastr = [{
            message: 'message.create.success',
            level: "success"
        }];

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/'+req.body.associationUrl+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;
            models[capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function(association){
                if (!association) {
                    e_user.destroy();
                    return error500("Not found", res);
                }

                var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                if (typeof association['add'+modelName] !== 'undefined')
                    association['add'+modelName](e_user.id);
                else {
                    var obj = {};
                    obj[req.body.associationForeignKey] = e_user.id;
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
            e_user['set'+target](req.body[prop]);
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
                return res.redirect('/user/create_form');
            error500(err, res);
        }
    });
});

router.get('/update_form', block_access.isLoggedIn, block_access.actionAccessMiddleware("user", "write"), function(req, res) {
    req.session.formSettings = false;
    var id_e_user = req.query.id;
    var data = {
        menu: "e_user",
        sub_menu: "list_e_user",
        enum: enums.translated("e_user", req.session.lang_user),
        user: req.session.passport.user
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
        models.E_user.findOne({where: {id: id_e_user}, include: [{all: true}]}).then(function(e_user) {
            if (!e_user) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_user = e_user;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can found adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_user[name_global_list] = rows;

                if (rows.length > 1){
                    for(var j = 0; j < data[model].length; j++){
                        if(e_user[model] != null){
                            for (var k = 0; k < e_user[model].length; k++){
                                if (data[model][j].id == e_user[model][k].id){
                                    data[model][j].dataValues.associated = true;
                                }
                            }
                        }
                    }
                }
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_user/update', data);
        }).catch(function(err){
            error500(err, res);
        });
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/update', block_access.isLoggedIn, block_access.actionAccessMiddleware("user", "write"), function(req, res) {
    var id_e_user = parseInt(req.body.id);

    if(typeof req.body.version !== "undefined")
        req.body.version = parseInt(req.body.version) + 1;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    updateObject = enums.values("e_user", updateObject, req.body);

    models.E_user.findOne({where: {id: id_e_user}}).then(function(e_user) {
        if (!e_user) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_user.update(updateObject, {where: {id: id_e_user}}).then(function() {

            var redirect = '/user/show?id=' + id_e_user;
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/'+req.body.associationUrl+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;
            else if (req.session.formSettings == true)
                redirect = '/user/settings';

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
                    return res.redirect('/user/update_form?id='+id_e_user);
                error500(err, res);
            }
        });
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/delete', block_access.isLoggedIn, block_access.actionAccessMiddleware("user", "delete"), function(req, res) {
    var id_e_user = req.body.id;

    models.E_user.destroy({
        where: {
            id: id_e_user
        }
    }).then(function() {
        req.session.toastr = [{
            message: 'message.delete.success',
            level: "success"
        }];
        var redirect = '/user/list';
        if (typeof req.body.associationFlag !== 'undefined')
            redirect = '/'+req.body.associationUrl+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;
        res.redirect(redirect);
    }).catch(function(err){
        error500(err, res);
    });
});

router.get('/settings', block_access.isLoggedIn, function(req, res) {
    var id_e_user = req.session.passport && req.session.passport.user ? req.session.passport.user.id : 1;
    var data = {
        menu: "e_user",
        sub_menu: "list_e_user",
        enum: enums.translated("e_user", req.session.lang_user)
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
        models.E_user.findOne({where: {id: id_e_user}, include: [{all: true}]}).then(function(e_user) {
            if (!e_user) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_user = e_user;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can found adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_user[name_global_list] = rows;

                if (rows.length > 1)
                    for(var j = 0; j < data[model].length; j++)
                        if(e_user[model] != null)
                            for (var k = 0; k < e_user[model].length; k++)
                                if (data[model][j].id == e_user[model][k].id)
                                    data[model][j].dataValues.associated = true;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];

            // Used to hide role/group inputs
            data.isSettings = true;
            req.session.formSettings = true;
            res.render('e_user/settings', data);
        }).catch(function(err){
            error500(err, res);
        });
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
                return res.render('e_user/settings', data);
            error500(err, res);
        }
    });
});

module.exports = router;