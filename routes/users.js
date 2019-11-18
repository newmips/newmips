const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const models = require('../models/');
const fs = require('fs-extra');
const moment = require("moment");

// Gitlab API
const gitlab = require('../services/gitlab_api');
const gitlabConf = require('../config/gitlab.js');
const globalConf = require('../config/global.js');

router.get('/', block_access.isAdmin, (req, res) => {
	data = {};
	models.User.findAll({
		where: {
			id: {
				[models.$ne]: 1
			}
		},
		include: [{all: true}]
	}).then(users => {
		data.users = users;
		res.render('users/list', data);
	})
})

router.get('/show/:id', block_access.isAdmin, (req, res) => {
	const user_id = req.params.id;
	models.User.findOne({
		where: {
			id: user_id
		},
		include: [{all: true}]
	}).then(user => {
		const idAppUser = [];
		for (let i = 0; i < user.Applications.length; i++)
			idAppUser.push(user.Applications[i].id)
		models.Application.findAll({
			where: {
				id: {
					[models.$notIn]: idAppUser
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
			login: req.body.login.toLowerCase(),
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
		login: req.body.login.toLowerCase(),
		last_name: req.body.last_name,
		id_role: req.body.role,
		phone: req.body.phone,
		email: req.body.email
	}, {
		where: {
			id: req.body.id
		}
	}).then(_ => {
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
	}).then(_ => {
		req.session.toastr = [{
			message: 'action.success.destroy',
			level: "success"
		}];
		res.redirect("/users")
	})
})

router.post('/assign', block_access.isAdmin, (req, res) => {
	(async () => {
		let appID = req.body.app;
		const userID = req.body.id_user;
		const user = await models.User.findByPk(userID);

		if (!user)
			throw new Error("User not found");

		await user.addApplication(appID);

		// Add user to gitlab project too
		if(gitlabConf.doGit){
			if(!Array.isArray(appID))
				appID = [appID];

			const gitlabUser = await gitlab.getUser(user.email);

			for (let i = 0; i < appID.length; i++) {
				const application = await models.Application.findByPk(appID[i]);
				const projectName = globalConf.host + "-" + application.codeName.substring(2);
				const gitlabProject = await gitlab.getProject(projectName);
				await gitlab.addUserToProject(gitlabUser.id, gitlabProject.id);
			}
		}

		return userID;
	})().then(userID => {
		res.redirect('/users/show/'+userID+"#applications");
	}).catch(err => {
		console.error(err);
		return res.render('common/error', {
			code: 500
		});
	})
})

router.post('/remove_access', block_access.isAdmin, (req, res) => {

	(async () => {
		const appID = req.body.id_app;
		const userID = req.body.id_user;
		const user = await models.User.findByPk(userID);

		const data = {};
		if (!user)
			throw new Error('404 - User not found');

		const applications = await user.getApplications();

		// Remove entity from association array
		for (let i = 0; i < applications.length; i++)
			if (applications[i].id == appID) {
				applications.splice(i, 1);
				break;
			}

		await user.setApplications(applications);

		// Remove gitlab access
		if(gitlabConf.doGit){
			const application = await models.Application.findByPk(appID);
			const projectName = globalConf.host + "-" + application.codeName.substring(2);
			const gitlabProject = await gitlab.getProject(projectName);
			const gitlabUser = await gitlab.getUser(user.email);
			await gitlab.removeUserFromProject(gitlabUser.id, gitlabProject.id);
		}

		return user.id;
	})().then(userID => {
		res.redirect('/users/show/'+userID+"#applications");
	}).catch(err => {
		console.error(err);
		return res.render('common/error', {
			code: 500
		});
	})
})

module.exports = router;