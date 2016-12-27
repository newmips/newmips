// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var bcrypt = require('bcrypt-nodejs');

//Sequelize
var models = require('../models/');

// ===========================================
// Gestion client des USERS =====================
// ===========================================

// Settings
router.get('/settings', block_access.isLoggedIn, function(req, res) {
    var data = {};
    data.user = req.session.data;
    // Récupération des toastr en session
    data.toastr = req.session.toastr;
    // Nettoyage de la session
    req.session.toastr = [];
    res.render('default/settings', data);
});

// Update_User
router.post('/user_update', block_access.isAdmin, function(req, res) {
    var id_user = req.session.passport.user.id;
    var email = req.body.email;
    var last_name = req.body.last_name;
    var first_name = req.body.first_name;
    var phone = req.body.phone;

    var data = {};

    models.User.update({
        email: email,
        last_name: last_name,
        first_name: first_name,
        phone: phone
    }, {
        where: {
            id: id_user
        }
    }).then(function(){
        req.session.toastr = [{
            message: "Vos informations ont bien été mises à jours.",
            level: "success"
        }];
        res.redirect("/user/settings");
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

// ===========================================
// Gestion admin des USERS =====================
// ===========================================

// List
router.get('/list', block_access.isAdmin, function(req, res) {
    var data = {};

    models.User.findAll({
        include: [{
            model: models.Role
        }]
    }).then(function(users){
        data.users = users;
        // Récupération des toastr en session
        data.toastr = req.session.toastr;
        // Nettoyage de la session
        req.session.toastr = [];
        res.render('user/list', data);
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

// Show
router.get('/show/:id', block_access.isAdmin, function(req, res) {
    var id_user = req.params.id;
    var data = {};

    models.User.findOne({
        where: {
            id: id_user
        },
        include: [{
            model: models.Role
        }]
    }).then(function(user){
        data.user = user;
        res.render('user/show', data);
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

// Create
router.get('/create', block_access.isAdmin, function(req, res) {
    models.Role.findAll().then(function(roles){
        var data = {};
        data.roles = roles;
        // Récupération des toastr en session
        data.toastr = req.session.toastr;
        // Nettoyage de la session
        req.session.toastr = [];
        res.render('user/create', data);
    });
});

// Create POST
router.post('/create', block_access.isAdmin, function(req, res) {
    var email = req.body.email;
    var last_name = req.body.last_name;
    var first_name = req.body.first_name;
    var phone = req.body.phone;

    var login = req.body.login;
    var password = bcrypt.hashSync(req.body.password, null, null);
    var id_role = req.body.id_role;

    var data = {};

    models.User.findOne({
        where: {
            $or: [{
                login: login
            }, {
                email: email
            }]
        }
    }).then(function(user){
        if(user){
            req.session.toastr = [{
                message: "Erreur, cet utilisateur existe déjà.",
                level: "error"
            }];
            res.redirect("/user/create");
        }
        else{
            models.User.create({
                email: email,
                last_name: last_name,
                first_name: first_name,
                phone: phone,
                login: login,
                password: password,
                id_role: id_role,
                enabled: 1,
                version: 1
            }).then(function(created_user){
                res.redirect("/user/show/"+created_user.id);
            });
        }
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

// Update
router.get('/update/:id', block_access.isAdmin, function(req, res) {
    var id_user = req.params.id;
    var data = {};

    models.User.findOne({
        where: {
            id: id_user
        },
        include: [{
            model: models.Role
        }]
    }).then(function(user){
        models.Role.findAll().then(function(roles){
            data.user = user;
            data.roles = roles;
            res.render('user/update', data);
        });
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

// Update POST
router.post('/update/:id', block_access.isAdmin, function(req, res) {
    var id_user = req.params.id;
    var email = req.body.email;
    var last_name = req.body.last_name;
    var first_name = req.body.first_name;
    var phone = req.body.phone;

    var login = req.body.login;
    var password = req.body.password;
    var password2 = req.body.password2;

    var id_role = req.body.id_role;
    var data = {};

    var obj = {
        email: email,
        last_name: last_name,
        first_name: first_name,
        phone: phone,
        login: login,
        id_role: id_role
    }

    if(password === password2 && password != ""){
        password = bcrypt.hashSync(req.body.password, null, null);
        var obj = {
            email: email,
            last_name: last_name,
            first_name: first_name,
            phone: phone,
            login: login,
            password: password,
            id_role: id_role
        }
    }
    else{
        if(password != password2){
            req.session.toastr = [{
                message: "Votre mot de passe n'a pas été mis à jour, erreur de correspondance.",
                level: "error"
            }];
        }
    }

    models.User.update(obj, {
        where: {
            id: id_user
        }
    }).then(function(){
        //Met à jour le user en session
        models.User.findOne({
            where: {
                id: id_user
            }
        }).then(function(user){
            req.session.data = user;
            res.redirect("/user/show/"+id_user);
        });
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});

// Delete POST
router.post('/delete', block_access.isAdmin, function(req, res) {
    var id_user = req.body.id_user;
    var data = {};

    if(id_user == req.session.data.id){
        req.session.toastr = [{
            message: "Erreur, impossible de supprimer l'utilisateur connecté.",
            level: "error"
        }];
        res.redirect("/user/list");
    }
    else{
        models.User.destroy({
            where: {
                id: id_user
            }
        }).then(function(){
            res.redirect("/user/list");
        }).catch(function(err){
            data.code = 500;
            res.render('common/error', data);
        });
    }
});

module.exports = router;