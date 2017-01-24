var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_role');
var options = require('../models/options/e_role');
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
        "menu": "e_role",
        "sub_menu": "list_e_role"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('e_role/list', data);
});

router.post('/datalist', block_access.isLoggedIn, function(req, res) {

    filterDataTable("E_role", req.body).then(function(data) {
        res.send(data).end();
    }).catch(function(err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/fieldset/:alias/remove', block_access.isLoggedIn, function(req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_role.findOne({where: {id: idEntity}}).then(function(e_role) {
        if (!e_role) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_role['get'+capitalizeFirstLetter(alias)]().then(function(aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_role['set'+capitalizeFirstLetter(alias)](aliasEntities).then(function(){
                res.sendStatus(200).end();
            });
        });
    });
});

router.post('/fieldset/:alias/add', block_access.isLoggedIn, function(req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_role.findOne({where: {id: idEntity}}).then(function(e_role) {
        if (!e_role) {
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
            return res.redirect('/role/show?id='+idEntity+"#"+alias);
        }

        e_role['add'+capitalizeFirstLetter(alias)](toAdd).then(function(){
            res.redirect('/role/show?id='+idEntity+"#"+alias);
        });
    });
});

router.get('/show', block_access.isLoggedIn, function(req, res) {
    var id_e_role = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_role",
        sub_menu: "list_e_role",
        tab: tab,
        enum: enums.translated("e_role", req.session.lang_user)
    };

    models.E_role.findOne({where: {id: id_e_role}, include: [{all: true}]}).then(function(e_role) {
        if (!e_role) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify e_role value with the translated enum value in show result */
        for(var item in data.enum){
            for(var field in e_role.dataValues){
                if(item == field){
                    for(var value in data.enum[item]){
                        if(data.enum[item][value].value == e_role[field]){
                            e_role[field] = data.enum[item][value].translation;
                        }
                    }
                }
            }
        }

        data.e_role = e_role;

        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function(found) {
            for (var i = 0; i < found.length; i++) {
                data.e_role[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_role/show', data);
        });

    }).catch(function(err){
        error500(err, res);
    });
});

router.get('/create_form', block_access.isLoggedIn, function(req, res) {
    var data = {
        menu: "e_role",
        sub_menu: "create_e_role",
        enum: enums.translated("e_role", req.session.lang_user)
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
        res.render('e_role/create', data);
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/create', block_access.isLoggedIn, function(req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    createObject = enums.values("e_role", createObject, req.body)

    models.E_role.create(createObject).then(function(e_role) {
        var redirect = '/role/list';
        req.session.toastr = [{
            message: 'message.create.success',
            level: "success"
        }];

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/'+req.body.associationUrl+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;
            models[capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function(association){
                if (!association) {
                    e_role.destroy();
                    return error500("Not found", res);
                }

                var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                if (typeof association['add'+modelName] !== 'undefined')
                    association['add'+modelName](e_role.id);
                else {
                    var obj = {};
                    obj[req.body.associationForeignKey] = e_role.id;
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
            e_role['set'+target](req.body[prop]);
        }

        res.redirect(redirect);
    }).catch(function(err){
        error500(err, res);
    });
});

router.get('/update_form', block_access.isLoggedIn, function(req, res) {
    id_e_role = req.query.id;
    var data = {
        menu: "e_role",
        sub_menu: "list_e_role",
        enum: enums.translated("e_role", req.session.lang_user)
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
        models.E_role.findOne({where: {id: id_e_role}, include: [{all: true}]}).then(function(e_role) {
            if (!e_role) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_role = e_role;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can found adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_role[name_global_list] = rows;

                if (rows.length > 1){
                    for(var j = 0; j < data[model].length; j++){
                        if(e_role[model] != null){
                            for (var k = 0; k < e_role[model].length; k++){
                                if (data[model][j].id == e_role[model][k].id){
                                    data[model][j].dataValues.associated = true;
                                }
                            }
                        }
                    }
                }
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_role/update', data);
        }).catch(function(err){
            error500(err, res);
        });
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/update', block_access.isLoggedIn, function(req, res) {
    var id_e_role = parseInt(req.body.id);

    if(typeof req.body.version !== "undefined")
        req.body.version = parseInt(req.body.version) + 1;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    updateObject = enums.values("e_role", updateObject, req.body);

    models.E_role.findOne({where: {id: id_e_role}}).then(function(e_role) {
        if (!e_role) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_role.update(updateObject, {where: {id: id_e_role}}).then(function() {

            var redirect = '/role/show?id=' + id_e_role;
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/'+req.body.associationUrl+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;

            req.session.toastr = [{
                message: 'message.update.success',
                level: "success"
            }];

            res.redirect(redirect);
        }).catch(function(err){
            error500(err, res);
        });
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/delete', block_access.isLoggedIn, function(req, res) {
    var id_e_role = req.body.id;

    models.E_role.destroy({
        where: {
            id: id_e_role
        }
    }).then(function() {
        req.session.toastr = [{
            message: 'message.delete.success',
            level: "success"
        }];
        var redirect = '/role/list';
        if (typeof req.body.associationFlag !== 'undefined')
            redirect = '/'+req.body.associationUrl+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;
        res.redirect(redirect);
    }).catch(function(err){
        error500(err, res);
    });
});

module.exports = router;