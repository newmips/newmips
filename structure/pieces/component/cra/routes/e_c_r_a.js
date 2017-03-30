var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var dust = require('dustjs-linkedin');
var pdf = require('html-pdf');
var fs = require('fs-extra');

// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_c_r_a');
var options = require('../models/options/e_c_r_a');
var model_builder = require('../utils/model_builder');

// ENUM managment
var enums = require('../utils/enum.js');

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
            data.message = err.message || err || null;
            res.render('common/error', data);
    }
}

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

function teamAdminMiddleware(req, res, next) {
    models.E_c_r_a_team.findOne({
        where: {f_id_admin_user: req.session.passport.user.id},
        include: [{
            model: models.E_user,
            as: 'r_users'
        }]
    }).then(function(team) {
        if (!team) {
            req.session.toastr.push({level: 'error', message: 'entity.e_c_r_a_team.admin_only'});
            return res.redirect('/default/c_r_a');
        }
        req.team = team;
        next();
    });
}

router.get('/list', teamAdminMiddleware, block_access.actionAccessMiddleware("c_r_a", "read"), function (req, res) {
    var data = {
        "menu": "e_c_r_a",
        "sub_menu": "list_e_c_r_a"
    };
    data.toastr = req.session.toastr;
    req.session.toastr = [];

    var idTeamUsers = [];
    for (var i = 0; i < req.team.r_users.length; i++)
        idTeamUsers.push(req.team.r_users[i].id);

    models.E_c_r_a.findAll({
        where: {
            f_id_user: {$in: idTeamUsers},
            f_admin_validated: false,
            f_user_validated: true
        }
    }).then(function(cra) {
        data.cra = cra;
        res.render('e_c_r_a/list', data);
    });
});

router.post('/datalist', teamAdminMiddleware, block_access.actionAccessMiddleware("c_r_a", "read"), function (req, res) {
    /* Looking for include to get all associated related to data for the datalist ajax loading */
    var include = model_builder.getDatalistInclude(models, options);

    var idTeamUsers = [];
    for (var i = 0; i < req.team.r_users.length; i++)
        idTeamUsers.push(req.team.r_users[i].id);

    var where = {
        f_id_user: {$in: idTeamUsers}
    }

    filterDataTable("E_c_r_a", req.body, include, where).then(function (data) {
        // Replace data enum value by translated value for datalist
        var enumsTranslation = enums.translated("e_c_r_a", req.session.lang_user);
        for(var i=0; i<data.data.length; i++){
            for(var field in data.data[i].dataValues){
                for(var enumField in enumsTranslation){
                    if(field == enumField){
                        for(var j=0; j<enumsTranslation[enumField].length; j++){
                            if(data.data[i].dataValues[enumField] == enumsTranslation[enumField][j].value){
                                data.data[i].dataValues[enumField] = enumsTranslation[enumField][j].translation;
                            }
                        }
                    }
                }
            }
        }
        res.send(data).end();
    }).catch(function (err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/fieldset/:alias/remove', block_access.actionAccessMiddleware("c_r_a", "delete"), function (req, res) {
    var alias = req.params.alias;
    var idToRemove = req.body.idRemove;
    var idEntity = req.body.idEntity;
    models.E_c_r_a.findOne({where: {id: idEntity}}).then(function (e_c_r_a) {
        if (!e_c_r_a) {
            var data = {error: 404};
            return res.render('common/error', data);
        }

        // Get all associations
        e_c_r_a['get' + capitalizeFirstLetter(alias)]().then(function (aliasEntities) {
            // Remove entity from association array
            for (var i = 0; i < aliasEntities.length; i++)
                if (aliasEntities[i].id == idToRemove) {
                    aliasEntities.splice(i, 1);
                    break;
                }

            // Set back associations without removed entity
            e_c_r_a['set' + capitalizeFirstLetter(alias)](aliasEntities).then(function () {
                res.sendStatus(200).end();
            });
        });
    }).catch(function (err) {
        error500(err, req, res);
    });
});

router.post('/fieldset/:alias/add', block_access.actionAccessMiddleware("c_r_a", "write"), function (req, res) {
    var alias = req.params.alias;
    var idEntity = req.body.idEntity;
    models.E_c_r_a.findOne({where: {id: idEntity}}).then(function (e_c_r_a) {
        if (!e_c_r_a) {
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
            return res.redirect('/c_r_a/show?id=' + idEntity + "#" + alias);
        }

        e_c_r_a['add' + capitalizeFirstLetter(alias)](toAdd).then(function () {
            res.redirect('/c_r_a/show?id=' + idEntity + "#" + alias);
        });
    }).catch(function (err) {
        error500(err, req, res);
    });
});

router.get('/admin', teamAdminMiddleware, block_access.actionAccessMiddleware("c_r_a", 'read'), function(req, res) {
    var data = {
        menu: "e_c_r_a",
        sub_menu: "list_e_c_r_a"
    };

    var id_cra = req.query.id;
    models.E_user.findOne({
        include: [{
            model: models.E_c_r_a,
            as: 'r_c_r_a',
            where: {id: id_cra}
        }]
    }).then(function(user) {
        if (!user)
            return error500("Unable to find associated user", req, res);
        data.user = user;
        models.E_c_r_a_activity.findAll({where: {f_active: true}}).then(function(activities) {
            models.E_c_r_a_team.findOne({
                include: [{
                    model: models.E_user,
                    as: 'r_users',
                    where: {id: user.id}
                }, {
                    model: models.E_c_r_a_activity,
                    as: 'r_default_c_r_a_activity'
                }]
            }).then(function(team) {
                if (!team)
                    return res.render('e_c_r_a/declare', data);
                for (var i = 0; i < team.r_default_c_r_a_activity.length; i++)
                    for (var j = 0; j < activities.length; j++)
                        if (team.r_default_c_r_a_activity[i].id == activities[j].id)
                            activities.splice(j, 1);
                data.activities = activities;
                res.render('e_c_r_a/admin_declare', data);
            });
        });
    });
});

router.get('/admin/validate/:id', teamAdminMiddleware, block_access.actionAccessMiddleware("c_r_a", 'write'), function(req, res) {
    var id_cra = req.params.id;

    models.E_c_r_a.findById(id_cra).then(function(cra) {
        if (!cra)
            return res.status(404).send("Couldn't find CRA");
        if (!cra.f_user_validated)
            return res.status(404).send("User must validate first");

        cra.update({f_admin_validated: true}).then(function() {
            res.status(200).end();
        });
    }).catch(function(err) {
        res.status(500).send("Couldn't validate CRA");
    });
});

router.post('/admin/update', teamAdminMiddleware, block_access.actionAccessMiddleware("c_r_a", 'write'), function(req, res) {
    var body = req.body;
    var id_cra = parseInt(body.id_cra);
console.log(body);
    models.E_c_r_a.findOne({
        where: {id: id_cra},
        include: [{
            model: models.E_c_r_a_task,
            as: 'r_c_r_a_task',
            include: [{
                model: models.E_c_r_a_activity,
                as: 'r_c_r_a_activity'
            }]
        }]
    }).then(function(cra) {
        if (!cra)
            return res.status(500).send("Couldn't find previously saved C.R.A");

        if (cra.f_user_validated && cra.f_admin_validated)
            return res.status(403).send("You can't update if admin validated");

        var updateDeleteTasksPromises = [];
        var createTasksPromises = [];
        var matchedTasks = [];
        for (var input in body) {
            var parts = input.split('.');
            if (parts[0] !== 'task' || body[input] == '' || body[input] == '0')
                continue;
            var activityId = parts[1];
            var formDate = new Date(cra.f_year, cra.f_month-1, parts[2]);
            var taskExists = false;
            for (var i = 0; i < cra.r_c_r_a_task.length; i++) {
                if (cra.r_c_r_a_task[i].f_id_c_r_a_activity == activityId) {
                    var taskDate = new Date(cra.r_c_r_a_task[i].f_date);
                    if (taskDate.getDate() == formDate.getDate()) {
                        taskExists = true;
                        matchedTasks.push(cra.r_c_r_a_task[i].id);
                        updateDeleteTasksPromises.push(cra.r_c_r_a_task[i].update({f_duration: body[input]}));
                        break;
                    }
                }
            }
            if (!taskExists)
                createTasksPromises.push(models.E_c_r_a_task.create({
                    f_date: formDate,
                    f_duration: body[input],
                    f_id_c_r_a: cra.id,
                    f_id_c_r_a_activity: activityId
                }));
        }

        Promise.all(createTasksPromises).then(function(tasks) {
            for (var i = 0; i < tasks.length; i++)
                matchedTasks.push(tasks[i].id);
            // Delete replaced (not changed) tasks
            updateDeleteTasksPromises.push(models.E_c_r_a_task.destroy({
                where: {
                    id: {$notIn: matchedTasks},
                    f_id_c_r_a: cra.id
                }})
            );
            Promise.all(updateDeleteTasksPromises).then(function() {
                res.status(200).json({user_validated: cra.f_user_validated, admin_validated: false});
                cra.update({f_admin_validated: false, f_notification_admin: body.notificationAdmin});
            });
        });
    }).catch(function(err) {
        console.log(err);
        return res.status(500).send("Unable to update your Activity report");
    });
});

router.get('/declare', block_access.actionAccessMiddleware("c_r_a", 'read'), function(req, res) {
    var data = {
        menu: "e_c_r_a",
        sub_menu: "create_e_c_r_a"
    };

    models.E_c_r_a_activity.findAll({where: {f_active: true}}).then(function(activities) {
        models.E_c_r_a_team.findOne({
            include: [{
                model: models.E_user,
                as: 'r_users',
                where: {id: req.session.passport.user.id}
            }, {
                model: models.E_c_r_a_activity,
                as: 'r_default_c_r_a_activity'
            }]
        }).then(function(team) {
            if (!team)
                return res.render('e_c_r_a/declare', data);
            for (var i = 0; i < team.r_default_c_r_a_activity.length; i++)
                for (var j = 0; j < activities.length; j++)
                    if (team.r_default_c_r_a_activity[i].id == activities[j].id)
                        activities.splice(j, 1);
            data.activities = activities;
            res.render('e_c_r_a/declare', data);
        });
    });
});

router.get('/declare/validate/:id_cra', block_access.actionAccessMiddleware("c_r_a", 'write'), function(req, res) {
    var id_cra = parseInt(req.params.id_cra);

    models.E_c_r_a.update({f_user_validated: true}, {where: {id: id_cra}}).then(function(cra) {
        if (!cra)
            return res.status(404).send("Couldn't find C.R.A with id "+id_cra);
        res.status(200).end();
    }).catch(function(err) {
        console.log(err);
        return res.status(404).send("Couldn't update");
    });
});

router.post('/declare/create', block_access.actionAccessMiddleware("c_r_a", 'write'), function(req, res) {
    var body = req.body;
    body.year = parseInt(body.year);
    body.month = parseInt(body.month);
    var id_user = req.session.passport.user.id;

    models.E_c_r_a.create({
        f_month: body.month,
        f_year: body.year,
        f_id_user: id_user,
        f_user_validated: false,
        f_admin_validated: false
    }).then(function(cra) {
        var tasksPromises = [];
        for (var input in body) {
            var parts = input.split('.');
            if (parts[0] !== 'task' || body[input] == '' || body[input] == '0')
                continue;
            var activityId = parts[1];
            var date = new Date(body.year, body.month-1, parts[2]);
            tasksPromises.push(models.E_c_r_a_task.create({
                f_date: date,
                f_duration: body[input],
                f_id_c_r_a: cra.id,
                f_id_c_r_a_activity: activityId
            }));
        }

        Promise.all(tasksPromises).then(function() {
            res.status(200).json({id_cra: cra.id, action: 'created', user_validated: false, admin_validated: false});

            // Calculate and update open days count of CRA
            models.E_c_r_a_team.findOne({
                include: [{
                    model: models.E_user,
                    as: 'r_users',
                    where: {id: id_user}
                }, {
                    model: models.E_c_r_a_calendar_settings,
                    as: 'r_c_r_a_calendar_settings'
                }, {
                    model: models.E_c_r_a_calendar_exception,
                    as: 'r_c_r_a_calendar_exception'
                }]
            }).then(function(team) {
                var date = new Date(body.year, body.month-1, 1);
                var days = [];
                while (date.getMonth() === body.month-1) {
                    days.push(new Date(date));
                    date.setDate(date.getDate()+1);
                }

                var openDays = days.length;
                var labels = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                for (var i = 0; i < days.length; i++) {
                    days[i].setHours(0,0,0,0);
                    if (team.r_c_r_a_calendar_settings['f_'+labels[days[i].getDay()].toLowerCase()] == false) {
                        openDays--;
                        continue;
                    }
                    for (var j = 0; j < team.r_c_r_a_calendar_exception.length; j++) {
                        var excepDate = new Date(team.r_c_r_a_calendar_exception[j].f_date);
                        excepDate.setHours(0,0,0,0);
                        if (excepDate.getTime() == days[i].getTime()) {
                            openDays--;
                            continue;
                        }
                    }
                }

                cra.update({f_open_days_in_month: openDays});
            })
        }).catch(function(err) {
            return res.status(500).send("Can't create your C.R.A");
        });
    });
});

router.post('/declare/update', block_access.actionAccessMiddleware("c_r_a", 'write'), function(req, res) {
    var body = req.body;
    body.year = parseInt(body.year);
    body.month = parseInt(body.month);
    var id_user = req.session.passport.user.id;

    models.E_c_r_a.findOne({
        where: {
            f_month: body.month,
            f_year: body.year,
            f_id_user: id_user
        },
        include: [{
            model: models.E_c_r_a_task,
            as: 'r_c_r_a_task',
            include: [{
                model: models.E_c_r_a_activity,
                as: 'r_c_r_a_activity'
            }]
        }]
    }).then(function(cra) {
        if (!cra)
            return res.status(500).send("Couldn't find previously saved C.R.A");

        if (cra.f_user_validated && cra.f_admin_validated)
            return res.status(403).send("You can't update if admin validated");

        var tasksPromises = [];
        var matchedTasks = [];
        for (var input in body) {
            var parts = input.split('.');
            if (parts[0] !== 'task' || body[input] == '' || body[input] == '0')
                continue;
            var activityId = parts[1];
            var formDate = new Date(body.year, body.month-1, parts[2]);
            var taskExists = false;
            for (var i = 0; i < cra.r_c_r_a_task.length; i++) {
                if (cra.r_c_r_a_task[i].f_id_c_r_a_activity == activityId) {
                    var taskDate = new Date(cra.r_c_r_a_task[i].f_date);
                    if (taskDate.getDate() == formDate.getDate()) {
                        taskExists = true;
                        matchedTasks.push(cra.r_c_r_a_task[i].id);
                        tasksPromises.push(cra.r_c_r_a_task[i].update({f_duration: body[input]}));
                        break;
                    }
                }
            }
            if (!taskExists)
                tasksPromises.push(models.E_c_r_a_task.create({
                    f_date: formDate,
                    f_duration: body[input],
                    f_id_c_r_a: cra.id,
                    f_id_c_r_a_activity: activityId
                }));
        }

        // Delete replaced (not changed) tasks
        tasksPromises.push(models.E_c_r_a_task.destroy({
            where: {
                id: {$notIn: matchedTasks},
                f_id_c_r_a: cra.id
            }})
        );

        Promise.all(tasksPromises).then(function() {
            res.status(200).json({action: 'updated', user_validated: false, admin_validated: cra.f_admin_validated});
            cra.update({f_user_validated: false});
        });
    }).catch(function(err) {
        console.log(err);
        return res.status(500).send("Unable to update your Activity report");
    });
});

router.get('/getData/:month/:year', function(req, res) {
    var data = {};
    var id_user = req.session.passport.user.id;
    var month = parseInt(req.params.month);
    var year = parseInt(req.params.year);

    models.E_c_r_a.findOne({
        where: {
            f_id_user: id_user,
            $and: [
                {f_month: month},
                {f_year: year}
            ]
        },
        include: [{
            model: models.E_c_r_a_task,
            as: 'r_c_r_a_task',
            include: [{
                model: models.E_c_r_a_activity,
                as: 'r_c_r_a_activity'
            }]
        }]
    }).then(function(cra) {
        if (!cra)
            data.craExists = false;
        else {
            data.craExists = true;
            data.cra = cra;
        }
        models.E_c_r_a_activity.findAll().then(function(activities) {
            data.activities = activities;
            models.E_c_r_a_team.findOne({
                include: [{
                    model: models.E_user,
                    as: 'r_users',
                    where: {id: id_user}
                }, {
                    model: models.E_c_r_a_calendar_settings,
                    as: 'r_c_r_a_calendar_settings'
                }, {
                    model: models.E_c_r_a_calendar_exception,
                    as: 'r_c_r_a_calendar_exception'
                }, {
                    model: models.E_c_r_a_activity,
                    as: 'r_default_c_r_a_activity'
                }]
            }).then(function(team) {
                if (!team)
                    return res.status(500).send("You need to be in a team");
                data.team = team;
                data.isTeamAdmin = (team.f_id_admin_user == id_user) ? true : false;
                res.status(200).json(data);
            })
        });
    });
});

router.get('/export/:id', block_access.actionAccessMiddleware("c_r_a", "read"), function (req, res) {
    var id_cra = req.params.id;

    models.E_c_r_a.findOne({
        where: {id: id_cra},
        include: [{
            model: models.E_c_r_a_task,
            as: 'r_c_r_a_task',
            include: [{
                model: models.E_c_r_a_activity,
                as: 'r_c_r_a_activity'
            }]
        }]
    }).then(function(cra) {
        var workedDays = cra.r_c_r_a_task.length;
        var activitiesById = [];
        // Organize array with activity > tasks instead of tasks > activity
        for (var i = 0; i < cra.r_c_r_a_task.length; i++) {
            var task = cra.r_c_r_a_task[i];
            if (typeof activitiesById[task.f_id_c_r_a_activity] === 'undefined') {
                activitiesById[task.f_id_c_r_a_activity] = task.r_c_r_a_activity;
                activitiesById[task.f_id_c_r_a_activity].tasks = [];
            }
            activitiesById[task.f_id_c_r_a_activity].tasks.push(task);
        }

        var totalDays = new Date(cra.f_year, cra.f_month, 0).getDate();
        var activities = [];var daysAndLabels = [];
        var daysLabels = (req.session.lang_user == 'fr-FR')
                ? ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
                : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

        for (var acti in activitiesById) {
            var i = 0;
            activitiesById[acti].filledTasks = [];
            while (i++ < totalDays) {
                var tmp = new Date(cra.f_year, cra.f_month-1, i);
                if (daysAndLabels.length < totalDays)
                    daysAndLabels.push({f_date: i, f_day: daysLabels[tmp.getDay()]})
                activitiesById[acti].filledTasks.push({f_date: tmp, f_duration: ''});
            }
            for (var i = 0; i < activitiesById[acti].tasks.length; i++) {
                var origiTask = activitiesById[acti].tasks[i];
                for (var j = 0; j < activitiesById[acti].filledTasks.length; j++) {
                    var filledTask = activitiesById[acti].filledTasks[j];
                    if (origiTask.f_date.getDate() == filledTask.f_date.getDate()) {
                        activitiesById[acti].filledTasks[j].f_duration = origiTask.f_duration;
                    }
                }
            }
            activitiesById[acti].tasks = undefined;
            activities.push(activitiesById[acti]);
        }

        var dustSrc = fs.readFileSync(__dirname+'/../views/e_c_r_a/export_template.dust', 'utf8');
        dust.renderSource(dustSrc, {
            activities: activities,
            daysAndLabels: daysAndLabels,
            workedDays: workedDays,
            cra: cra
        }, function(err, html) {
            if (err)
                return error500(err, req, res);

            var fileName = __dirname+'/../views/e_c_r_a/'+cra.id+'_cra_'+cra.f_year+'_'+cra.f_month+'.pdf';
            pdf.create(html, {orientation: 'landscape'}).toFile(fileName, function(err, data) {
                if (err)
                    return error500(err, req, res);
                fs.readFile(fileName, function(err, data) {
                    if (err)
                        return error500(err, req, res);
                    res.writeHead(200, {"Content-Type": "application/pdf"});
                    res.write(data);
                    res.end();

                    fs.unlinkSync(fileName);
                });
            });
        });
    });
});

router.get('/show', block_access.actionAccessMiddleware("c_r_a", "read"), function (req, res) {
    var id_e_c_r_a = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_c_r_a",
        sub_menu: "list_e_c_r_a",
        tab: tab,
        enum: enums.translated("e_c_r_a", req.session.lang_user)
    };

    /* If we arrive from an associated tab, hide the create and the list button */
    if (typeof req.query.hideButton !== 'undefined') {
        data.hideButton = req.query.hideButton;
    }

    /* Looking for two level of include to get all associated data in show tab list */
    var include = model_builder.getTwoLevelIncludeAll(models, options);

    models.E_c_r_a.findOne({where: {id: id_e_c_r_a}, include: include}).then(function (e_c_r_a) {
        if (!e_c_r_a) {
            data.error = 404;
            logger.debug("No data entity found.");
            return res.render('common/error', data);
        }

        /* Modify e_c_r_a value with the translated enum value in show result */
        for (var item in data.enum) {
            for (var field in e_c_r_a.dataValues) {
                if (item == field) {
                    for (var value in data.enum[item]) {
                        if (data.enum[item][value].value == e_c_r_a[field]) {
                            e_c_r_a[field] = data.enum[item][value].translation;
                        }
                    }
                }
            }
        }
        /* Update local e_c_r_a data before show */
        data.e_c_r_a = e_c_r_a;
        var associationsFinder = model_builder.associationsFinder(models, options);

        Promise.all(associationsFinder).then(function (found) {
            for (var i = 0; i < found.length; i++) {
                data.e_c_r_a[found[i].model + "_global_list"] = found[i].rows;
                data[found[i].model] = found[i].rows;
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_c_r_a/show', data);
        });

    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.get('/create_form', block_access.actionAccessMiddleware("c_r_a", "write"), function (req, res) {
    var data = {
        menu: "e_c_r_a",
        sub_menu: "create_e_c_r_a",
        enum: enums.translated("e_c_r_a", req.session.lang_user)
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
        res.render('e_c_r_a/create', data);
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/create', block_access.actionAccessMiddleware("c_r_a", "write"), function (req, res) {

    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    createObject = enums.values("e_c_r_a", createObject, req.body);
    models.E_c_r_a.create(createObject).then(function (e_c_r_a) {
        var redirect = '/c_r_a/list';
        req.session.toastr = [{
                message: 'message.create.success',
                level: "success"
            }];

        if (typeof req.body.associationFlag !== 'undefined') {
            redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
            models[capitalizeFirstLetter(req.body.associationSource)].findOne({where: {id: req.body.associationFlag}}).then(function (association) {
                if (!association) {
                    e_c_r_a.destroy();
                    var err = new Error();
                    err.message = "Association not found."
                    return error500(err, req, res, "/");
                }

                var modelName = req.body.associationAlias.charAt(0).toUpperCase() + req.body.associationAlias.slice(1).toLowerCase();
                if (typeof association['add' + modelName] !== 'undefined')
                    association['add' + modelName](e_c_r_a.id);
                else {
                    var obj = {};
                    obj[req.body.associationForeignKey] = e_c_r_a.id;
                    association.update(obj);
                }
            });
        }

        // We have to find value in req.body that are linked to an hasMany or belongsToMany association
        // because those values are not updated for now
        model_builder.setAssocationManyValues(e_c_r_a, req.body, createObject, options);

        res.redirect(redirect);
    }).catch(function (err) {
        error500(err, req, res, '/c_r_a/create_form');
    });
});

router.get('/update_form', block_access.actionAccessMiddleware("c_r_a", "write"), function (req, res) {
    id_e_c_r_a = req.query.id;
    var data = {
        menu: "e_c_r_a",
        sub_menu: "list_e_c_r_a",
        enum: enums.translated("e_c_r_a", req.session.lang_user)
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
        models.E_c_r_a.findOne({where: {id: id_e_c_r_a}, include: [{all: true}]}).then(function (e_c_r_a) {
            if (!e_c_r_a) {
                data.error = 404;
                return res.render('common/error', data);
            }

            data.e_c_r_a = e_c_r_a;
            var name_global_list = "";

            for (var i = 0; i < found.length; i++) {
                var model = found[i].model;
                var rows = found[i].rows;
                data[model] = rows;

                // Example : Gives all the adresses in the context Personne for the UPDATE field, because UPDATE field is in the context Personne.
                // So in the context Personne we can found adresse.findAll through {#adresse_global_list}{/adresse_global_list}
                name_global_list = model + "_global_list";
                data.e_c_r_a[name_global_list] = rows;

                if (rows.length > 1) {
                    for (var j = 0; j < data[model].length; j++) {
                        if (e_c_r_a[model] != null) {
                            for (var k = 0; k < e_c_r_a[model].length; k++) {
                                if (data[model][j].id == e_c_r_a[model][k].id) {
                                    data[model][j].dataValues.associated = true;
                                }
                            }
                        }
                    }
                }
            }

            data.toastr = req.session.toastr;
            req.session.toastr = [];
            res.render('e_c_r_a/update', data);
        }).catch(function (err) {
            error500(err, req, res, "/");
        });
    }).catch(function (err) {
        error500(err, req, res, "/");
    });
});

router.post('/update', block_access.actionAccessMiddleware("c_r_a", "write"), function (req, res) {
    var id_e_c_r_a = parseInt(req.body.id);

    if (typeof req.body.version !== "undefined" && req.body.version != null && !isNaN(req.body.version))
        req.body.version = parseInt(req.body.version) + 1;
    else
        req.body.version = 0;

    var updateObject = model_builder.buildForRoute(attributes, options, req.body);
    updateObject = enums.values("e_c_r_a", updateObject, req.body);

    models.E_c_r_a.findOne({where: {id: id_e_c_r_a}}).then(function (e_c_r_a) {
        if (!e_c_r_a) {
            data.error = 404;
            logger.debug("Not found - Update");
            return res.render('common/error', data);
        }

        e_c_r_a.update(updateObject, {where: {id: id_e_c_r_a}}).then(function () {

            // We have to find value in req.body that are linked to an hasMany or belongsToMany association
            // because those values are not updated for now
            model_builder.setAssocationManyValues(e_c_r_a, req.body, updateObject, options);

            var redirect = '/c_r_a/show?id=' + id_e_c_r_a;
            if (typeof req.body.associationFlag !== 'undefined')
                redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;

            req.session.toastr = [{
                message: 'message.update.success',
                level: "success"
            }];

            res.redirect(redirect);
        }).catch(function (err) {
            error500(err, req, res, '/c_r_a/update_form?id=' + id_e_c_r_a);
        });
    }).catch(function (err) {
        error500(err, req, res, '/c_r_a/update_form?id=' + id_e_c_r_a);
    });
});

router.post('/delete', block_access.actionAccessMiddleware("c_r_a", "delete"), function (req, res) {
    var id_e_c_r_a = req.body.id;

    models.E_c_r_a.destroy({
        where: {
            id: id_e_c_r_a
        }
    }).then(function () {
        req.session.toastr = [{
                message: 'message.delete.success',
                level: "success"
            }];
        var redirect = '/c_r_a/list';
        if (typeof req.body.associationFlag !== 'undefined')
            redirect = '/' + req.body.associationUrl + '/show?id=' + req.body.associationFlag + '#' + req.body.associationAlias;
        res.redirect(redirect);
    }).catch(function (err) {
        error500(err, req, res, '/c_r_a/list');
    });
});

module.exports = router;