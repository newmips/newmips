var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var models = require('../models/');
var fs = require('fs-extra');
var moment = require("moment");

router.get('/', block_access.isAdmin, (req, res) => {
    data = {};
    models.User.findAll({
        where: {
            id: {
                $ne: 1
            }
        },
        include: [{all: true}]
    }).then(users => {
        data.users = users;
        res.render('users/list', data);
    })
})

router.get('/show/:id', block_access.isAdmin, (req, res) => {
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

router.get('/create', block_access.isAdmin, (req, res) => {
    models.Role.findAll().then(roles => {
        res.render('users/create', {roles: roles})
    })
})

router.post('/create', block_access.isAdmin, (req, res) => {
    if(req.body.login != "" && req.body.id_role != "" && req.body.email != ""){
        models.User.create({
            email: req.body.email,
            enabled: 0,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            login: req.body.login,
            id_role: req.body.role,
            password: null,
            phone: null,
            version: 1
        }).then(function(user) {
            req.session.toastr = [{
                message: "action.success.create",
                level: "success"
            }];
            res.redirect("/users/show/"+user.id)
            })
    } else {
        req.session.toastr = [{
            message: "action.missing_values",
            level: "error"
        }];
        res.redirect("/users")
    }
})

router.get('/update/:id', block_access.isAdmin, (req, res) => {
    models.User.findOne({
        where: {
            id: req.params.id
        },
        include: [{all: true}]
    }).then(user => {
        models.Role.findAll().then(roles => {
            res.render('users/update', {user: user, roles: roles})
        })
    })
})

router.post('/update', block_access.isAdmin, (req, res) => {
    if(req.body.id == 1 && req.body.role != 1){
        req.session.toastr = [{
            message: 'users.not_remove_admin_role',
            level: "error"
        }];
        return res.redirect("/users")
    }
    models.User.update({
        login: req.body.login,
        last_name: req.body.last_name,
        id_role: req.body.role,
        phone: req.body.phone,
        email: req.body.email
    }, {
        where: {
            id: req.body.id
        }
    }).then(() => {
        req.session.toastr = [{
            message: "action.success.update",
            level: "success"
        }];
        res.redirect("/users/update/"+req.body.id)
    })
})

router.post('/delete', block_access.isAdmin, (req, res) => {
    if(req.body.id == 1){
        req.session.toastr = [{
            message: 'users.not_delete_admin',
            level: "error"
        }];
        return res.redirect("/users")
    }
    models.User.destroy({
        where: {
            id: req.body.id
        }
    }).then(() => {
        req.session.toastr = [{
            message: 'action.success.destroy',
            level: "success"
        }];
        res.redirect("/users")
    })
})

router.post('/assign', block_access.isAdmin, (req, res) => {
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

router.post('/remove_access', block_access.isAdmin, (req, res) => {
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

module.exports = router;