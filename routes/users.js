var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var models = require('../models/');
var globalConfig = require('../config/global');
var fs = require('fs-extra');
var dust = require('dustjs-linkedin');
var moment = require("moment");
var SELECT_PAGE_SIZE = 10;

router.get('/', (req, res) => {
    data = {};
    models.User.findAll({include: [{all: true}]}).then(users => {
        data.users = users;
        res.render('users/list', data);
    })
})

router.get('/show/:id', (req, res) => {
    var user_id = req.params.id;
    models.User.findOne({
        where: {
            id: user_id
        },
        include: [{all: true}]
    }).then(user => {
        let idAppUser = [];
        for (var i = 0; i < user.Applications.length; i++)
            idAppUser.push(user.Applications[i].id)
        models.Application.findAll({
            where: {
                id: {
                    $notIn: idAppUser
                }
            }
        }).then(applications => {
            res.render('users/show', {user: user, otherApp: applications})
        })
    })
})

router.post('/assign', (req, res) => {
    var app = req.body.app;
    var userId = req.body.id_user;
    models.User.findByPk(userId).then(user => {
        if (!user) {
            data.code = 404;
            console.log("User not found");
            return res.render('common/error', data);
        }

        user.addApplication(app).then(() => {
            res.redirect('/users/show/'+userId+"#applications");
        }).catch((err) => {
            data.code = 500;
            console.log(err);
            return res.render('common/error', data);
        })
    }).catch((err) => {
        data.code = 500;
        console.log(err);
        return res.render('common/error', data);
    })
})

router.post('/remove_access', (req, res) => {
    let appId = req.body.id_app;
    let userId = req.body.id_user;
    let data = {};
    models.User.findByPk(userId).then(user => {
        if (!user) {
            data.code = 404;
            console.log("User not found");
            return res.render('common/error', data);
        }

        // Get all associations
        user.getApplications().then(applications => {
            // Remove entity from association array
            for (var i = 0; i < applications.length; i++)
                if (applications[i].id == appId) {
                    applications.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            user.setApplications(applications).then(() => {
                res.redirect('/users/show/'+userId+"#applications");
            })
        })
    }).catch((err) => {
        data.code = 500;
        console.log(err);
        return res.render('common/error', data);
    })
})



// router.get('/create_form', block_access.actionAccessMiddleware("user", "create"), function (req, res) {
//     var data = {
//         menu: "e_user",
//         sub_menu: "create_e_user",
//         enum_radio: enums_radios.translated("e_user", req.session.lang_user, options)
//     };

//     if (typeof req.query.associationFlag !== 'undefined') {
//         data.associationFlag = req.query.associationFlag;
//         data.associationSource = req.query.associationSource;
//         data.associationForeignKey = req.query.associationForeignKey;
//         data.associationAlias = req.query.associationAlias;
//         data.associationUrl = req.query.associationUrl;
//     }

//     var associationsFinder = model_builder.associationsFinder(models, options);

//     Promise.all(associationsFinder).then(function (found) {
//         for (var i = 0; i < found.length; i++)
//             data[found[i].model] = found[i].rows;
//         var view = req.query.ajax ? 'e_user/create_fields' : 'e_user/create';
//         res.render(view, data);
//     }).catch(function (err) {
//         entity_helper.error(err, req, res, "/");
//     })
// })

// router.post('/create', block_access.actionAccessMiddleware("user", "create"), function (req, res) {

//     var createObject = model_builder.buildForRoute(attributes, options, req.body);
//     // Make sure it's impossible to set sensitive information through create form
//     createObject.f_token_password_reset = undefined;
//     createObject.f_enabled = 0;
//     createObject.f_password = undefined;

//     models.E_user.create(createObject).then(function (e_user) {
//         var redirect = '/user/show?id='+e_user.id;
//         req.session.toastr = [{
//             message: 'message.create.success',
//             level: "success"
//         }];

//         var promises = [];

//         if (typeof req.body.associationFlag !== 'undefined') {
//             redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
//             promises.push(new Promise(function(resolve, reject) {
//                 models[entity_helper.capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
//                     if (!association) {
//                         e_user.destroy();
//                         var err = new Error();
//                         err.message = "Association not found.";
//                         reject(err);
//                     }

//                     var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
//                     if (typeof association['add' + modelName] !== 'undefined'){
//                         association['add' + modelName](e_user.id).then(resolve).catch(function(err){
//                             reject(err);
//                         })
//                     } else {
//                         var obj = {};
//                         obj[req.body.associationForeignKey] = e_user.id;
//                         association.update(obj).then(resolve).catch(function(err){
//                             reject(err);
//                         })
//                     }
//                 })
//             }));
//         }

//         // We have to find value in req.body that are linked to an hasMany or belongsToMany association
//         // because those values are not updated for now
//         model_builder.setAssocationManyValues(e_user, req.body, createObject, options).then(function(){
//             Promise.all(promises).then(function() {
//                 res.redirect(redirect);
//             }).catch(function(err){
//                 entity_helper.error(err, req, res, '/user/create_form');
//             })
//         })
//     }).catch(function (err) {
//         entity_helper.error(err, req, res, '/user/create_form');
//     })
// })

// router.get('/update_form', block_access.actionAccessMiddleware("user", "update"), function (req, res) {
//     var id_e_user = req.query.id;
//     var data = {
//         menu: "e_user",
//         sub_menu: "list_e_user",
//         enum_radio: enums_radios.translated("e_user", req.session.lang_user, options)
//     };

//     if (typeof req.query.associationFlag !== 'undefined') {
//         data.associationFlag = req.query.associationFlag;
//         data.associationSource = req.query.associationSource;
//         data.associationForeignKey = req.query.associationForeignKey;
//         data.associationAlias = req.query.associationAlias;
//         data.associationUrl = req.query.associationUrl;
//     }

//     var associationsFinder = model_builder.associationsFinder(models, options);

//     Promise.all(associationsFinder).then(function (found) {
//         models.E_user.findOne({attributes: {exclude: ['f_password', 'f_token_password_reset', 'f_enabled']}, where: {id: id_e_user}, include: [{all: true}]}).then(function (e_user) {
//             if (!e_user) {
//                 data.error = 404;
//                 return res.render('common/error', data);
//             }

//             data.e_user = e_user;
//             var name_global_list = "";

//             for (var i = 0; i < found.length; i++) {
//                 var model = found[i].model;
//                 var rows = found[i].rows;
//                 data[model] = rows;

//                 // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
//                 // So in the context Personne we can find adresse.findAll through {#adresse_global_list}{/adresse_global_list}
//                 name_global_list = model + "_global_list";
//                 data.e_user[name_global_list] = rows;

//                 // Set associated property to item that are related to be able to make them selected client side
//                 if (rows.length > 1)
//                     for (var j = 0; j < data[model].length; j++)
//                         if (e_user[model] != null)
//                             for (var k = 0; k < e_user[model].length; k++)
//                                 if (data[model][j].id == e_user[model][k].id)
//                                     data[model][j].dataValues.associated = true;
//             }

//             req.session.toastr = [];
//             if (req.query.ajax) {
//                 res.render('e_user/update_fields', e_user.get({plain: true}));
//             } else
//                 res.render('e_user/update', data);
//         }).catch(function (err) {
//             entity_helper.error(err, req, res, "/");
//         })
//     }).catch(function (err) {
//         entity_helper.error(err, req, res, "/");
//     })
// })

// router.post('/update', block_access.actionAccessMiddleware("user", "update"), function (req, res) {
//     var id_e_user = parseInt(req.body.id);

//     if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version) && req.body.version != '')
//         req.body.version = parseInt(req.body.version) + 1;
//     else
//         req.body.version = 0;

//     var updateObject = model_builder.buildForRoute(attributes, options, req.body);

//     var redirect = '/user/show?id=' + id_e_user;
//     // If we are in user settings,then he cannot modify sensible data, and we redirect differently
//     if(req.body.is_settings){
//         delete updateObject.f_login;
//         delete updateObject.r_role;
//         delete updateObject.r_group;
//         redirect = '/user/settings';
//     }

//     models.E_user.findOne({where: {id: id_e_user}}).then(function (e_user) {
//         if (!e_user) {
//             data.error = 404;
//             logger.debug("Not found - Update");
//             return res.render('common/error', data);
//         }

//         updateObject.f_token_password_reset = undefined;
//         updateObject.f_enabled = undefined;
//         updateObject.f_password = undefined;
//         e_user.update(updateObject).then(function () {
//             // We have to find value in req.body that are linked to an hasMany or belongsToMany association
//             // because those values are not updated for now
//             model_builder.setAssocationManyValues(e_user, req.body, updateObject, options).then(function () {
//                 if (typeof req.body.associationFlag !== 'undefined')
//                     redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

//                 req.session.toastr = [{
//                     message: 'message.update.success',
//                     level: "success"
//                 }];

//                 res.redirect(redirect);
//             }).catch(function (err) {
//                 entity_helper.error(err, req, res, '/user/update_form?id=' + id_e_user);
//             })
//         }).catch(function (err) {
//             entity_helper.error(err, req, res, '/user/update_form?id=' + id_e_user);
//         })
//     }).catch(function (err) {
//         entity_helper.error(err, req, res, '/user/update_form?id=' + id_e_user);
//     })
// })

// router.get('/loadtab/:id/:alias', block_access.actionAccessMiddleware('user', 'read'), function (req, res) {
//     var alias = req.params.alias;
//     var id = req.params.id;

//     // Find tab option
//     var option;
//     for (var i = 0; i < options.length; i++)
//         if (options[i].as == req.params.alias) {
//             option = options[i];
//             break;
//         }
//     if (!option)
//         return res.status(404).end();

//     // Check access rights to subentity
//     if (!block_access.entityAccess(req.session.passport.user.r_group, option.target.substring(2)))
//         return res.status(403).end();

//     var queryOpts = {where: {id: id}};
//     // If hasMany, no need to include anything since it will be fetched using /subdatalist
//     if (option.structureType != 'hasMany')
//         queryOpts.include = {
//             model: models[entity_helper.capitalizeFirstLetter(option.target)],
//             as: option.as,
//             include: {all: true}
//         }

//     // Fetch tab data
//     models.E_user.findOne(queryOpts).then(function (e_user) {
//         if (!e_user)
//             return res.status(404).end();

//         var dustData = e_user[option.as] || null;
//         var empty = !dustData || (dustData instanceof Array && dustData.length == 0) ? true : false;
//         var dustFile, idSubentity, promisesData = [];

//         // Build tab specific variables
//         switch (option.structureType) {
//             case 'hasOne':
//                 if (!empty) {
//                     idSubentity = dustData.id;
//                     dustData.hideTab = true;
//                     dustData.enum_radio = enums_radios.translated(option.target, req.session.lang_user, options);
//                     promisesData.push(entity_helper.getPicturesBuffers(dustData, option.target));
//                     var subentityOptions = require('../models/options/' + option.target);
//                     // Fetch status children to be able to switch status
//                     // Apply getR_children() on each current status
//                     var statusGetterPromise = [], subentityOptions = require('../models/options/' + option.target);
//                     dustData.componentAddressConfig = component_helper.getMapsConfigIfComponentAddressExist(option.target);
//                     for (var i = 0; i < subentityOptions.length; i++)
//                         if (subentityOptions[i].target.indexOf('e_status') == 0)
//                             (function (alias) {
//                                 promisesData.push(new Promise(function (resolve, reject) {
//                                     dustData[alias].getR_children().then(function (children) {
//                                         dustData[alias].r_children = children;
//                                         resolve();
//                                     })
//                                 }));
//                             })(subentityOptions[i].as);
//                 }
//                 dustFile = option.target + '/show_fields';
//                 break;

//             case 'hasMany':
//                 dustFile = option.target + '/list_fields';
//                 // Status history specific behavior. Replace history_model by history_table to open view
//                 if (option.target.indexOf('e_history_e_') == 0)
//                     option.noCreateBtn = true;
//                 dustData = {for : 'hasMany'};
//                 if (typeof req.query.associationFlag !== 'undefined')
//                 {
//                     dustData.associationFlag = req.query.associationFlag;
//                     dustData.associationSource = req.query.associationSource;
//                     dustData.associationForeignKey = req.query.associationForeignKey;
//                     dustData.associationAlias = req.query.associationAlias;
//                     dustData.associationUrl = req.query.associationUrl;
//                 }
//                 break;

//             case 'hasManyPreset':
//                 dustFile = option.target + '/list_fields';
//                 var obj = {};
//                 obj[option.target] = dustData;
//                 dustData = obj;
//                 if (typeof req.query.associationFlag !== 'undefined')
//                 {
//                     dustData.associationFlag = req.query.associationFlag;
//                     dustData.associationSource = req.query.associationSource;
//                     dustData.associationForeignKey = req.query.associationForeignKey;
//                     dustData.associationAlias = req.query.associationAlias;
//                     dustData.associationUrl = req.query.associationUrl;
//                 }
//                 dustData.for = 'fieldset';
//                 for (var i = 0; i < dustData[option.target].length; i++)
//                     promisesData.push(entity_helper.getPicturesBuffers(dustData[option.target][i], option.target, true));

//                 break;

//             case 'localfilestorage':
//                 dustFile = option.target + '/list_fields';
//                 var obj = {};
//                 obj[option.target] = dustData;
//                 dustData = obj;
//                 dustData.sourceId = id;
//                 break;

//             default:
//                 return res.status(500).end();
//         }

//         // Image buffer promise
//         Promise.all(promisesData).then(function () {
//             // Open and render dust file
//             var file = fs.readFileSync(__dirname + '/../views/' + dustFile + '.dust', 'utf8');
//             dust.renderSource(file, dustData || {}, function (err, rendered) {
//                 if (err) {
//                     console.error(err);
//                     return res.status(500).end();
//                 }

//                 // Send response to ajax request
//                 res.json({
//                     content: rendered,
//                     data: idSubentity || {},
//                     empty: empty,
//                     option: option
//                 })
//             })
//         }).catch(function (err) {
//             console.error(err);
//             res.status(500).send(err);
//         })
//     }).catch(function (err) {
//         console.error(err);
//         res.status(500).send(err);
//     })
// })

// router.get('/set_status/:id_user/:status/:id_new_status', block_access.actionAccessMiddleware("user", "update"), function(req, res) {
//     status_helper.setStatus('e_user', req.params.id_user, req.params.status, req.params.id_new_status, req.query.comment).then(()=> {
//         res.redirect('/user/show?id=' + req.params.id_user);
//     }).catch((err)=> {
//         entity_helper.error(err, req, res, '/user/show?id=' + req.params.id_user);
//     })
// })



// router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("user", "create"), function (req, res) {
//     var alias = req.params.alias;
//     var idEntity = req.body.idEntity;
//     models.E_user.findOne({where: {id: idEntity}}).then(function (e_user) {
//         if (!e_user) {
//             var data = {error: 404};
//             logger.debug("No data entity found.");
//             return res.render('common/error', data);
//         }

//         var toAdd;
//         if (typeof (toAdd = req.body.ids) === 'undefined') {
//             req.session.toastr.push({
//                 message: 'message.create.failure',
//                 level: "error"
//             })
//             return res.redirect('/user/show?id=' + idEntity + "#" + alias);
//         }

//         e_user['add' + entity_helper.capitalizeFirstLetter(alias)](toAdd).then(function () {
//             res.redirect('/user/show?id=' + idEntity + "#" + alias);
//         })
//     }).catch(function (err) {
//         entity_helper.error(err, req, res, "/");
//     })
// })

// router.post('/delete', block_access.actionAccessMiddleware("user", "delete"), function (req, res) {
//     var id_e_user = parseInt(req.body.id);

//     models.E_user.findOne({where: {id: id_e_user}}).then(function (deleteObject) {
//         models.E_user.destroy({
//             where: {
//                 id: id_e_user
//             }
//         }).then(function () {
//             req.session.toastr = [{
//                 message: 'message.delete.success',
//                 level: "success"
//             }];

//             var redirect = '/user/list';
//             if (typeof req.body.associationFlag !== 'undefined')
//                 redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
//             res.redirect(redirect);
//             entity_helper.remove_files("e_user", deleteObject, attributes);
//         }).catch(function (err) {
//             entity_helper.error(err, req, res, '/user/list');
//         })
//     }).catch(function (err) {
//         entity_helper.error(err, req, res, '/user/list');
//     })
// })

// router.post('/search', block_access.actionAccessMiddleware('user', 'read'), function (req, res) {
//     var search = '%' + (req.body.search || '') + '%';
//     var limit = SELECT_PAGE_SIZE;
//     var offset = (req.body.page-1)*limit;

//     // ID is always needed
//     if (req.body.searchField.indexOf("id") == -1)
//         req.body.searchField.push('id');

//     var where = {raw: true, attributes: req.body.searchField, where: {}};
//     if (search != '%%') {
//         if (req.body.searchField.length == 1) {
//             where.where[req.body.searchField[0]] = {$like: search};
//         } else {
//             where.where.$or = [];
//             for (var i = 0; i < req.body.searchField.length; i++) {
//                 if (req.body.searchField[i] != "id") {
//                     var currentOrObj = {};
//                     currentOrObj[req.body.searchField[i]] = {$like: search}
//                     where.where.$or.push(currentOrObj);
//                 }
//             }
//         }
//     }

//     // /!\ DISABLED FOR USER /!\
//     // Possibility to add custom where in select2 ajax instanciation
//     // if (typeof req.body.customWhere !== "undefined")
//     //     for (var param in req.body.customWhere)
//     //         where.where[param] = req.body.customWhere[param];

//     where.offset = offset;
//     where.limit = limit;
// // If this is uncommentted, when a user have multiple roles/groups he appear multiple times in the search select
// //    where.include = [{model: models.E_role, as:'r_role'}, {model: models.E_group, as: 'r_group'}];
//     models.E_user.findAndCountAll(where).then(function (results) {
//         results.more = results.count > req.body.page * SELECT_PAGE_SIZE ? true : false;
//         res.json(results);
//     }).catch(function (e) {
//         console.error(e);
//         res.status(500).json(e);
//     })
// })

module.exports = router;