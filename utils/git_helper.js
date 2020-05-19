const fs = require("fs-extra");
const globalConf = require('../config/global.js');
const gitlabConf = require('../config/gitlab.js');
const models = require('../models/');
const gitProcesses = {};

function checkAlreadyInit(idApplication) {
	const dotGitPath = __dirname + '/../workspace/' + idApplication + '/.git';
	if (fs.existsSync(dotGitPath))
		return true;
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
	gitTag: (appName, tagName, workspacePath) => new Promise((resolve, reject) => {
		if (!gitlabConf.doGit)
			return resolve();
		const simpleGit = require('simple-git')(workspacePath); // eslint-disable-line
		models.Application.findOne({
			where: {
				name: appName
			}
		}).then(application => {
			// . becomes -
			const cleanHost = globalConf.host.replace(/\./g, "-");

			// Remove prefix
			const nameApp = application.name.substring(2);
			const originName = "origin-" + cleanHost + "-" + nameApp;
			simpleGit.addAnnotatedTag(tagName, 'Tagging ' + tagName).pushTags(['-u', originName, 'master'], err => {
				if (err)
					return reject(err);
				resolve();
			});
		});
	}),
	doGit: (data) => {
		// We push code on gitlab only in our cloud env
		if(!gitlabConf.doGit)
			return;

		const appName = data.application.name;

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;

		// Init simple-git in the workspace path
		const simpleGit = require('simple-git')(workspacePath); // eslint-disable-line

		// . becomes -
		const cleanHost = globalConf.host.replace(/\./g, "-");

		// Remove prefix
		const nameApp = appName.substring(2);
		const nameRepo = cleanHost + "-" + nameApp;
		const originName = "origin-" + cleanHost + "-" + nameApp;
		let repoUrl = "";

		if(!data.gitlabUser)
			throw new Error("Missing gitlab user in server session.");

		const usernameGitlab = data.gitlabUser.username;

		if (!gitlabConf.useSSH) {
			repoUrl = gitlabConf.protocol + "://" + gitlabConf.url + "/" + usernameGitlab + "/" + nameRepo + ".git";
		} else {
			repoUrl = gitlabConf.sshUrl + ":" + usernameGitlab + "/" + nameRepo + ".git";
		}

		if(typeof gitProcesses[originName] === "undefined")
			gitProcesses[originName] = false;

		// Is the workspace already git init ?
		if(!checkAlreadyInit(appName)){
			console.log("GIT: Git init in new workspace directory.");
			console.log(repoUrl);

			if(gitProcesses[originName])
				throw new Error("structure.global.error.alreadyInProcessGit");

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

		} else if(typeof data.function !== "undefined" && data.function != "gitPull" && data.function != "restart"){
			// We are just after a new instruction
			console.log("GIT: Git commit after new instruction.");
			console.log(repoUrl);

			if(gitProcesses[originName])
				throw new Error("structure.global.error.alreadyInProcessGit");

			// Set gitProcesses to prevent any other git command during this process
			gitProcesses[originName] = true;

			let commitMsg = data.function;
			commitMsg += "(App: " + appName;
			if(typeof data.module_name !== 'undefined')
				commitMsg += " Module: " + data.module_name;
			if(typeof data.entity_name !== 'undefined')
				commitMsg += " Entity: " + data.entity_name;
			commitMsg += ")";

			simpleGit.add('.')
				.commit(commitMsg, function(err, answer){
					gitProcesses[originName] = false;
					if(err)
						console.error(err);
					console.log(answer);
					writeAllLogs("Git commit", answer, err);
				});
		}
	},
	gitPush: (data) => new Promise((resolve, reject) => {
		if(!gitlabConf.doGit)
			return reject(new Error('structure.global.error.notDoGit'));

		const appName = data.application.name;

		// Workspace path
		const workspacePath = __dirname+'/../workspace/'+appName;

		// Init simple-git in the workspace path
		const simpleGit = require('simple-git')(workspacePath); // eslint-disable-line

		// . becomes -
		const cleanHost = globalConf.host.replace(/\./g, "-");

		// Remove prefix
		const nameApp = appName.substring(2);
		const nameRepo = cleanHost + "-" + nameApp;
		const originName = "origin-" + cleanHost + "-" + nameApp;
		let repoUrl = "";

		if(!data.gitlabUser || data.gitlabUser == null)
			return reject(new Error('Missing gitlab user in server session.'));

		const usernameGitlab = data.gitlabUser.username;

		if(!gitlabConf.useSSH){
			repoUrl = gitlabConf.url+"/"+usernameGitlab+"/"+nameRepo+".git";
		} else {
			repoUrl = gitlabConf.sshUrl+":"+usernameGitlab+"/"+nameRepo+".git";
		}

		if(typeof gitProcesses[originName] === "undefined")
			gitProcesses[originName] = false;

		if(gitProcesses[originName])
			return reject(new Error('structure.global.error.alreadyInProcessGit'));

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
	}),
	gitPull: (data) => new Promise((resolve, reject) => {

		if (!gitlabConf.doGit)
			return reject(new Error('structure.global.error.notDoGit'));

		// We push code on gitlab only in our cloud env
		const appName = data.application.name;
		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		// Init simple-git in the workspace path
		const simpleGit = require('simple-git')(workspacePath); // eslint-disable-line
		// . becomes -
		const cleanHost = globalConf.host.replace(/\./g, "-");
		// Remove prefix
		const nameApp = appName.substring(2);
		const originName = "origin-" + cleanHost + "-" + nameApp;

		if (typeof gitProcesses[originName] === "undefined")
			gitProcesses[originName] = false;

		if (gitProcesses[originName])
			return reject(new Error('structure.global.error.alreadyInProcessGit'));

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[originName] = true;
		simpleGit.pull(originName, "master", (err, answer) => {
			gitProcesses[originName] = false;
			console.log(answer);
			writeAllLogs("Git pull", answer, err);
			if (err)
				return reject(err);
			resolve(answer);
		});
	}),
	gitCommit: (data) => new Promise((resolve, reject) => {

		if(!gitlabConf.doGit)
			return resolve();

		// We push code on gitlab only in our cloud env
		const appName = data.application.name;
		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		// Init simple-git in the workspace path
		const simpleGit = require('simple-git')(workspacePath); // eslint-disable-line
		// . becomes -
		const cleanHost = globalConf.host.replace(/\./g, "-");

		// Remove prefix
		const nameApp = appName.substring(2);
		const originName = "origin-" + cleanHost + "-" + nameApp;

		if(typeof gitProcesses[originName] === "undefined")
			gitProcesses[originName] = false;

		if(gitProcesses[originName])
			return reject(new Error('structure.global.error.alreadyInProcessGit'))

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[originName] = true;

		let commitMsg = data.function;
		commitMsg += "(App: " + appName;
		if(typeof data.module_name !== 'undefined')
			commitMsg += " Module: " + data.module_name;
		if(typeof data.entity_name !== 'undefined')
			commitMsg += " Entity: " + data.entity_name;
		commitMsg += ")";

		simpleGit.add('.').commit(commitMsg, (err, answer) => {
			gitProcesses[originName] = false;
			console.log(answer);
			writeAllLogs("Git commit", answer, err);
			if(err)
				return reject(err);
			resolve(answer);
		});
	}),
	gitStatus: (data) => new Promise((resolve, reject) => {

		// We push code on gitlab only in our cloud env
		if(!gitlabConf.doGit)
			return reject(new Error('structure.global.error.notDoGit'));

		const appName = data.application.name;
		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		// Init simple-git in the workspace path
		const simpleGit = require('simple-git')(workspacePath); // eslint-disable-line
		// . becomes -
		const cleanHost = globalConf.host.replace(/\./g, "-");

		// Remove prefix
		const nameApp = appName.substring(2);
		const originName = "origin-" + cleanHost + "-" + nameApp;

		if(typeof gitProcesses[originName] === "undefined")
			gitProcesses[originName] = false;

		if(gitProcesses[originName])
			return reject(new Error('structure.global.error.alreadyInProcessGit'));

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
	}),
	gitRemotes: (data) => new Promise((resolve, reject) => {
		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + data.application.name;
		// Init simple-git in the workspace path
		const simpleGit = require('simple-git')(workspacePath); // eslint-disable-line
		simpleGit.getRemotes(true, (err, answer) => {
			if (err)
				return reject(err);
			resolve(answer);
		})
	})
}