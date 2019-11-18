const fs = require("fs-extra");
const globalConf = require('../config/global.js');
const gitlabConf = require('../config/gitlab.js');

//Sequelize
const models = require('../models/');

let gitProcesses = {};

function checkAlreadyInit(idApplication){
	let dotGitPath = __dirname+'/../workspace/'+idApplication+'/.git';
	if (fs.existsSync(dotGitPath))
		return true;
	else
		return false;
}

function writeAllLogs(title, content, err){
	let toWriteInLog = title+":\n";
	toWriteInLog += JSON.stringify(content).replace(/,/g, ",\n");
	toWriteInLog += "\nError:\n";
	toWriteInLog += JSON.stringify(err).replace(/,/g, ",\n");
	toWriteInLog += "\n";
	fs.writeFileSync(__dirname + '/../all.log', fs.readFileSync(__dirname + '/../all.log') + "\n" + toWriteInLog + "\n");
}

module.exports = {
	gitTag: (appName, tagName, workspacePath) => {
		return new Promise((resolve, reject) => {
			if (!gitlabConf.doGit)
				return resolve();
			const simpleGit = require('simple-git')(workspacePath);
			models.Application.findOne({where:{name: appName}}).then(application => {
				// . becomes -
				let cleanHost = globalConf.host.replace(/\./g, "-");

				// Remove prefix
				let nameApp = application.codeName.substring(2);
				let nameRepo = cleanHost+"-"+nameApp;
				let originName = "origin-"+cleanHost+"-"+nameApp;
				simpleGit.addAnnotatedTag(tagName, 'Tagging '+tagName)
				.pushTags(['-u', originName, 'master'], function(err) {
					if (err)
						return reject(err);
					resolve();
				});
			});
		});
	},
	doGit: (data) => {
		// We push code on gitlab only in our cloud env
		if(gitlabConf.doGit){
			let appName = data.application.name;

			// Workspace path
			let workspacePath = __dirname + '/../workspace/' + appName;

			// Init simple-git in the workspace path
			let simpleGit = require('simple-git')(workspacePath);

			// . becomes -
			let cleanHost = globalConf.host.replace(/\./g, "-");

			// Remove prefix
			let nameApp = application.name.substring(2);
			let nameRepo = cleanHost + "-" + nameApp;
			let originName = "origin-" + cleanHost + "-" + nameApp;
			let repoUrl = "";

			if(data.gitlabUser != null){
				let usernameGitlab = data.gitlabUser.username;

				if (!gitlabConf.useSSH) {
					repoUrl = gitlab.protocol + "://" + gitlabConf.url + "/" + usernameGitlab + "/" + nameRepo + ".git";
				} else {
					repoUrl = gitlabConf.sshUrl + ":" + usernameGitlab + "/" + nameRepo + ".git";
				}

				if(typeof gitProcesses[originName] === "undefined")
					gitProcesses[originName] = false;

				let err = null;

				// Is the workspace already git init ?
				if(!checkAlreadyInit(appName)){
					console.log("GIT: Git init in new workspace directory.");
					console.log(repoUrl);

					if(!gitProcesses[originName]){
						// Set gitProcesses to prevent any other git command during this process
						gitProcesses[originName] = true;

						simpleGit.init()
						.add('.')
						.commit("First commit!")
						.addRemote(originName, repoUrl)
						.push(['-u', originName, 'master'], function(err, answer){
							gitProcesses[originName] = false;
							if(err)
								console.error(err);
							console.log(answer);
							writeAllLogs("Git first commit / push", answer, err);
						});
					} else {
						throw new Error("structure.global.error.alreadyInProcess");
					}
				} else if(typeof data.function !== "undefined" && data.function != "gitPull" && data.function != "restart"){
					// We are just after a new instruction
					console.log("GIT: Git commit after new instruction.");
					console.log(repoUrl);

					let commitMsg = data.function+" -> App:"+appName+" Module:"+data.id_module+" Entity:"+data.id_data_entity;
					simpleGit.add('.')
					.commit(commitMsg, function(err, answer){
						if(err)
							console.error(err);
						console.log(answer);
						writeAllLogs("Git commit", answer, err);
					});
				}
				throw err;
			} else{
				throw new Error("Missing gitlab user in server session.");
			}
		}
	},
	gitPush: (data) => {
		return new Promise((resolve, reject) => {
			if(!gitlabConf.doGit)
				return reject(new Error('structure.global.error.notDoGit'));

			let appName = data.application.name;

			// Workspace path
			let workspacePath = __dirname+'/../workspace/'+appName;

			// Init simple-git in the workspace path
			const simpleGit = require('simple-git')(workspacePath);

			// Get current application values
			models.Application.findOne({where:{name: appName}}).then(application => {
				// . becomes -
				let cleanHost = globalConf.host.replace(/\./g, "-");

				// Remove prefix
				let nameApp = application.codeName.substring(2);
				let nameRepo = cleanHost + "-" + nameApp;
				let originName = "origin-" + cleanHost + "-" + nameApp;
				let repoUrl = "";

				if(!data.gitlabUser || data.gitlabUser == null)
					return reject(new Error('Missing gitlab user in server session.'));

				let usernameGitlab = data.gitlabUser.username;

				if(!gitlabConf.useSSH){
					repoUrl = gitlabConf.url+"/"+usernameGitlab+"/"+nameRepo+".git";
				} else {
					repoUrl = gitlabConf.sshUrl+":"+usernameGitlab+"/"+nameRepo+".git";
				}

				if(typeof gitProcesses[originName] === "undefined")
					gitProcesses[originName] = false;

				if(gitProcesses[originName])
					return reject(new Error('structure.global.error.alreadyInProcess'));

				// Set gitProcesses to prevent any other git command during this process
				gitProcesses[originName] = true;

				// Is the workspace already git init ?
				if(!checkAlreadyInit(appName)){
					console.log("GIT: Git init in new workspace directory...");
					console.log(repoUrl);

					simpleGit.init()
					.add('.')
					.commit("First commit!")
					.addRemote(originName, repoUrl)
					.push(['-u', originName, 'master'], (err, answer) => {
						gitProcesses[originName] = false;
						console.log(answer);
						writeAllLogs("Git push", answer, err);
						if(err)
							return reject(err);
						resolve(answer);
					});
				} else if(typeof data.function !== "undefined"){
					// We are just after a new instruction
					console.log("GIT: Doing Git push...");
					console.log(repoUrl);

					simpleGit.push(['-u', originName, 'master'], (err, answer) => {
						gitProcesses[originName] = false;
						console.log(answer);
						writeAllLogs("Git push", answer, err);
						if(err)
							return reject(err);
						resolve(answer);
					});
				}
			});
		});
	},
	gitPull: (data) => {
		return new Promise((resolve, reject) => {

			if(!gitlabConf.doGit)
				return reject(new Error('structure.global.error.notDoGit'));

			// We push code on gitlab only in our cloud env
			let appName = data.application.name;

			// Workspace path
			let workspacePath = __dirname+'/../workspace/'+appName;

			// Init simple-git in the workspace path
			let simpleGit = require('simple-git')(workspacePath);

			// Get current application values
			models.Application.findOne({where:{name: appName}}).then(application => {
				// . becomes -
				let cleanHost = globalConf.host.replace(/\./g, "-");

				// Remove prefix
				let nameApp = application.codeName.substring(2);
				let nameRepo = cleanHost+"-"+nameApp;
				let originName = "origin-"+cleanHost+"-"+nameApp;

				if(typeof gitProcesses[originName] === "undefined")
					gitProcesses[originName] = false;

				if(gitProcesses[originName])
					return reject(new Error('structure.global.error.alreadyInProcess'));

				// Set gitProcesses to prevent any other git command during this process
				gitProcesses[originName] = true;
				simpleGit.pull(originName, "master", function(err, answer){
					gitProcesses[originName] = false;
					console.log(answer);
					writeAllLogs("Git pull", answer, err);
					if(err)
						return reject(err);
					resolve(answer);
				});
			});
		})
	},
	gitCommit: (data) => {
		return new Promise((resolve, reject) => {

			if(!gitlabConf.doGit)
				return reject(new Error('structure.global.error.notDoGit'));

			// We push code on gitlab only in our cloud env
			let appName = data.application.name;

			// Workspace path
			let workspacePath = __dirname+'/../workspace/'+appName;

			// Init simple-git in the workspace path
			let simpleGit = require('simple-git')(workspacePath);

			// Get current application values
			models.Application.findOne({where:{name: appName}}).then(application => {
				// . becomes -
				let cleanHost = globalConf.host.replace(/\./g, "-");

				// Remove prefix
				let nameApp = application.codeName.substring(2);
				let nameRepo = cleanHost + "-" + nameApp;
				let originName = "origin-" + cleanHost + "-" + nameApp;

				if(typeof gitProcesses[originName] === "undefined")
					gitProcesses[originName] = false;

				if(gitProcesses[originName])
					return reject(new Error('structure.global.error.alreadyInProcess'))

				// Set gitProcesses to prevent any other git command during this process
				gitProcesses[originName] = true;
				let commitMsg = data.function+" -> App:" + appName + " Module:" + data.module_name + " Entity:" + data.entity_name;
				simpleGit.add('.')
				.commit(commitMsg, function(err, answer){
					gitProcesses[originName] = false;
					console.log(answer);
					writeAllLogs("Git commit", answer, err);
					if(err)
						return reject(err);

					resolve(answer);
				});
			});
		})
	},
	gitStatus: (data) => {
		return new Promise((resolve, reject) => {

			// We push code on gitlab only in our cloud env
			if(!gitlabConf.doGit)
				return reject(new Error('structure.global.error.notDoGit'));

			let appName = attr.application.name;
			// Workspace path
			let workspacePath = __dirname + '/../workspace/' + appName;
			// Init simple-git in the workspace path
			let simpleGit = require('simple-git')(workspacePath);
			// Get current application values
			models.Application.findOne({where:{id: appName}}).then(application => {
				// . becomes -
				let cleanHost = globalConf.host.replace(/\./g, "-");

				// Remove prefix
				let nameApp = application.codeName.substring(2);
				let nameRepo = cleanHost + "-" + nameApp;
				let originName = "origin-" + cleanHost + "-" + nameApp;

				if(typeof gitProcesses[originName] === "undefined")
					gitProcesses[originName] = false;

				if(gitProcesses[originName])
					return reject(new Error('structure.global.error.alreadyInProcess'));

				// Set gitProcesses to prevent any other git command during this process
				gitProcesses[originName] = true;
				simpleGit.status((err, answer) => {
					gitProcesses[originName] = false;
					console.log(answer);
					writeAllLogs("Git push", answer, err);
					if(err)
						return reject(err);
					resolve(answer);
				});
			});
		});
	},
	gitRemotes: (data) => {
		return new Promise((resolve, reject) => {
			// Workspace path
			let workspacePath = __dirname + '/../workspace/' + data.application.name;
			// Init simple-git in the workspace path
			const simpleGit = require('simple-git')(workspacePath);
			simpleGit.getRemotes(true, (err, answer) => {
				if (err)
					return reject(err);
				reject(answer);
			})
		})
	}
}