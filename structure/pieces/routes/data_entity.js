var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var filterDataTable = require('../utils/filterDataTable');

var models = require('../models/');
var attributes = require('../models/attributes/ENTITY_NAME');
var options = require('../models/options/ENTITY_NAME');
var model_builder = require('../utils/model_builder');
var enums = require('../utils/enum.js');

function error500(err, res) {
    console.error(err);
    var data = {};
    data.error = 500;
    res.render('common/error', data);
}

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

router.get('/list', block_access.isLoggedIn, function(req, res) {
    var data = {
        "menu": "ENTITY_NAME",
        "sub_menu": "list_ENTITY_NAME"
    };

    data.toastr = req.session.toastr;
    req.session.toastr = [];

    res.render('ENTITY_NAME/list', data);
});

router.post('/datalist', block_access.isLoggedIn, function(req, res) {

    filterDataTable("MODEL_NAME", req.body).then(function(data) {
        res.send(data).end();
    }).catch(function(err) {
        console.error(err);
        res.end();
    });
});

router.post('/fieldset/:alias/remove', block_access.isLoggedIn, function(req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.MODEL_NAME.findOne({where: {id: idEntity}}).then(function(ENTITY_NAME) {
        if (!ENTITY_NAME) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        ENTITY_NAME['get'+capitalizeFirstLetter(alias)]().then(function(aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            ENTITY_NAME['set'+capitalizeFirstLetter(alias)](aliasEntities).then(function(){
                res.sendStatus(200).end();
            });
        });
    });
});

router.post('/fieldset/:alias/add', block_access.isLoggedIn, function(req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.MODEL_NAME.findOne({where: {id: idEntity}}).then(function(ENTITY_NAME) {
        if (!ENTITY_NAME) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        var toAdd;
        if (typeof (toAdd = req.body.ids) === 'undefined') {
            req.session.toastr.push({
                message: 'message.create.failure',
                level: "error"
            });
            return res.redirect('/ENTITY_NAME/show?id='+idEntity+"#"+alias);
        }

        ENTITY_NAME['add'+capitalizeFirstLetter(alias)](toAdd).then(function(){
            res.redirect('/ENTITY_NAME/show?id='+idEntity+"#"+alias);
        });
    });
});

router.get('/show', block_access.isLoggedIn, function(req, res) {
    var id_ENTITY_NAME = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "ENTITY_NAME",
        sub_menu: "list_ENTITY_NAME",
        tab: tab,
        enum: enums.translated("ENTITY_NAME", req.session.lang_user)
    };

    models.MODEL_NAME.findOne({where: {id: id_ENTITY_NAME}, include: [{all: true}]}).then(function(ENTITY_NAME) {
        if (!ENTITY_NAME) {
            data.error = 404;
            return res.render('common/error', data);
        }
        data.ENTITY_NAME = ENTITY_NAME;
        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function(found) {
            for (var i = 0; i < found.length; i++) {
                data.ENTITY_NAME[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('ENTITY_NAME/show', data);
        });

    }).catch(function(err){
        error500(err, res);
    });
});

router.get('/create_form', block_access.isLoggedIn, function(req, res) {
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
    }

    var associationsFinder = model_builder.associationsFinder(models, options);

    Promise.all(associationsFinder).then(function(found) {
        for (var i = 0; i < found.length; i++)
            data[found[i].model] = found[i].rows;
        data.toastr = req.session.toastr;
        req.session.toastr = [];
        res.render('ENTITY_NAME/create', data);
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/create', block_access.isLoggedIn, function(req, res) {
    var version = parseInt(req.body.version) + 1;

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    createObject = enums.values("ENTITY_NAME", createObject, req.body)

    models.MODEL_NAME.create(createObject).then(function(ENTITY_NAME) {
        var redirect = '/ENTITY_NAME/list';
        req.session.toastr = [{
            message: 'message.create.success',
            level: "success"
        }];

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/'+req.body.associationSource+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;
            models[capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function(association){
                if (!association) {
                    ENTITY_NAME.destroy();
                    return error500("Not found", res);
                }

                var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                if (typeof association['add'+modelName] !== 'undefined')
                    association['add'+modelName](ENTITY_NAME.id);
                else {
                    var obj = {};
                    obj[req.body.associationForeignKey] = ENTITY_NAME.id;
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
            ENTITY_NAME['set'+target](req.body[prop]);
        }

        res.redirect(redirect);
    }).catch(function(err){
        error500(err, res);
    });
});

router.get('/update_form', block_access.isLoggedIn, function(req, res) {
    id_ENTITY_NAME = req.query.id;
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
    }

    var associationsFinder = model_builder.associationsFinder(models, options);

    Promise.all(associationsFinder).then(function(found) {
        models.MODEL_NAME.findOne({where: {id: id_ENTITY_NAME}, include: [{all: true}]}).then(function(ENTITY_NAME) {
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

                if (rows.length > 1)
                    for(var j = 0; j < data[model].length; j++)
                        for (var k = 0; k < ENTITY_NAME[model].length; k++)
                            if (data[model][j].id == ENTITY_NAME[model][k].id)
                                data[model][j].dataValues.associated = true;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('ENTITY_NAME/update', data);
        }).catch(function(err){
            error500(err, res);
        });
    }).catch(function(err){
        error500(err, res);
    });
});

router.post('/update', block_access.isLoggedIn, function(req, res) {
    var id_ENTITY_NAME = parseInt(req.body.id);
    var version = parseInt(req.body.version) + 1;
    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    updateObject = enums.values("ENTITY_NAME", updateObject, req.body);

    models.MODEL_NAME.findOne({where: {id: id_ENTITY_NAME}}).then(function(ENTITY_NAME) {
        if (!ENTITY_NAME) {
            data.error = 404;
            return res.render('common/error', data);
        }

        ENTITY_NAME.update(updateObject, {where: {id: id_ENTITY_NAME}}).then(function() {

            var redirect = '/ENTITY_NAME/show?id=' + id_ENTITY_NAME;
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/'+req.body.associationSource+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;

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
    var id_ENTITY_NAME = req.body.id;

    models.MODEL_NAME.destroy({
        where: {
            id: id_ENTITY_NAME
        }
    }).then(function() {
        req.session.toastr = [{
            message: 'message.delete.success',
            level: "success"
        }];
        var redirect = '/ENTITY_NAME/list';
        if (typeof req.body.associationFlag !== 'undefined')
            redirect = '/'+req.body.associationSource+'/show?id='+req.body.associationFlag+'#'+req.body.associationAlias;
        res.redirect(redirect);
    }).catch(function(err){
        error500(err, res);
    });
});

module.exports = router;