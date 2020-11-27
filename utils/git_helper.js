const fs = require("fs-extra");
const globalConf = require('../config/global.js');
const gitlabConf = require('../config/gitlab.js');
const gitProcesses = {};

function checkAlreadyInit(workspace) {
	const dotGitPath = __dirname + '/../workspace/' + workspace + '/.git';
	if (fs.existsSync(dotGitPath))
		return true;
	return false;
}

function getRepoInfo(appName, gitlabUser = null) {
	const nameApp = appName.substring(2); // Remove prefix a_
	const cleanHost = globalConf.host.replace(/\./g, "-"); // . becomes -
	const nameRepo = cleanHost + "-" + nameApp;

	let repoUrl = null;
	if(gitlabUser) {
		if (gitlabConf.useSSH) {
			// SSH URL
			repoUrl = gitlabConf.sshUrl + ":" + gitlabUser + "/" + nameRepo + ".git";
		} else {
			// HTTP URL
			repoUrl = gitlabConf.protocol + "://" + gitlabConf.url + "/" + gitlabUser + "/" + nameRepo + ".git";
		}
	}

	return {
		name: nameRepo,
		origin: "origin-" + cleanHost + "-" + nameApp,
		url: repoUrl
	};
}

async function initializeGit(repoInfo) {
	console.log("GIT => INIT " + repoInfo.origin);

	if (gitProcesses[repoInfo.origin].isProcessing)
		throw new Error("structure.global.error.alreadyInProcessGit");

	// Set isProcessing to prevent any other git command during this process
	gitProcesses[repoInfo.origin].isProcessing = true;
	try {
		await gitProcesses[repoInfo.origin].simpleGit.init();
		await gitProcesses[repoInfo.origin].simpleGit.add('.');
		const commitSummary = await gitProcesses[repoInfo.origin].simpleGit.commit("First commit - Workspace initialization");
		console.log(commitSummary);
		await gitProcesses[repoInfo.origin].simpleGit.addRemote(repoInfo.origin, repoInfo.url);
		await gitProcesses[repoInfo.origin].simpleGit.push(['-u', repoInfo.origin, 'master']);
	} catch(err) {
		gitProcesses[repoInfo.origin].isProcessing = false;
		throw err;
	}
	gitProcesses[repoInfo.origin].isProcessing = false;
}

module.exports = {
	isGitActivated: () => gitlabConf.doGit,
	doGit: async (data) => {

		// Only if gitlab conf is ready
		if (!gitlabConf.doGit)
			return;

		if (!data.gitlabUser)
			throw new Error("Missing Gitlab user in server session.");

		const appName = data.application.name
		const repoInfo = getRepoInfo(appName, data.gitlabUser.username);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		if (typeof gitProcesses[repoInfo.origin] === 'undefined')
			gitProcesses[repoInfo.origin] = {
				isProcessing: false,
				simpleGit: require('simple-git/promise')(workspacePath) // eslint-disable-line
			}

		// Check if .git is already initialize in the workspace directory
		if (!checkAlreadyInit(appName))
			await initializeGit(repoInfo); // Do first commit and push
		else if (typeof data.function !== "undefined") {
			// We are just after a new instruction
			console.log("GIT => COMMIT " + repoInfo.origin);

			if (gitProcesses[repoInfo.origin].isProcessing)
				throw new Error("structure.global.error.alreadyInProcessGit");

			let commitMsg = data.function;
			commitMsg += "(App: " + appName;
			if (typeof data.module_name !== 'undefined')
				commitMsg += " Module: " + data.module_name;
			if (typeof data.entity_name !== 'undefined')
				commitMsg += " Entity: " + data.entity_name;
			commitMsg += ")";

			// Set gitProcesses to prevent any other git command during this process
			gitProcesses[repoInfo.origin].isProcessing = true;
			try {
				await gitProcesses[repoInfo.origin].simpleGit.add('.')
				const commitSummary = await gitProcesses[repoInfo.origin].simpleGit.commit(commitMsg);
				console.log(commitSummary);
				gitProcesses[repoInfo.origin].isProcessing = false;
			} catch(err) {
				gitProcesses[repoInfo.origin].isProcessing = false;
				throw err;
			}
		}
	},
	gitPush: async (data) => {

		// Only if gitlab conf is ready
		if (!gitlabConf.doGit)
			return;

		if (!data.gitlabUser)
			throw new Error("Missing Gitlab user in server session.");

		const appName = data.application.name
		const repoInfo = getRepoInfo(appName, data.gitlabUser.username);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		if (typeof gitProcesses[repoInfo.origin] === 'undefined')
			gitProcesses[repoInfo.origin] = {
				isProcessing: false,
				simpleGit: require('simple-git/promise')(workspacePath) // eslint-disable-line
			}

		// Check if .git is already initialize in the workspace directory
		if (!checkAlreadyInit(appName))
			await initializeGit(repoInfo); // Do first commit and push
		else if(typeof data.function !== "undefined"){
			// We are just after a new instruction
			console.log("GIT => PUSH " + repoInfo.origin);
			gitProcesses[repoInfo.origin].isProcessing = true;
			try {
				await gitProcesses[repoInfo.origin].simpleGit.push(['-u', repoInfo.origin, 'master']);
				gitProcesses[repoInfo.origin].isProcessing = false;
			} catch(err) {
				gitProcesses[repoInfo.origin].isProcessing = false;
				throw err;
			}
		}
	},
	gitPull: async (data) => {

		// Only if gitlab conf is ready
		if (!gitlabConf.doGit)
			return;

		const appName = data.application.name
		const repoInfo = getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		if (typeof gitProcesses[repoInfo.origin] === 'undefined')
			gitProcesses[repoInfo.origin] = {
				isProcessing: false,
				simpleGit: require('simple-git/promise')(workspacePath) // eslint-disable-line
			}

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => PULL " + repoInfo.origin);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		try {
			const pullSummary = await gitProcesses[repoInfo.origin].simpleGit.pull(repoInfo.origin, "master")
			console.log(pullSummary);
			gitProcesses[repoInfo.origin].isProcessing = false;
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
	},
	gitCommit: async (data) => {

		// Only if gitlab conf is ready
		if (!gitlabConf.doGit)
			return;

		const appName = data.application.name
		const repoInfo = getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		if (typeof gitProcesses[repoInfo.origin] === 'undefined')
			gitProcesses[repoInfo.origin] = {
				isProcessing: false,
				simpleGit: require('simple-git/promise')(workspacePath) // eslint-disable-line
			}

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => COMMIT " + repoInfo.origin);
		let commitMsg = data.function;
		commitMsg += "(App: " + appName;
		if(typeof data.module_name !== 'undefined')
			commitMsg += " Module: " + data.module_name;
		if(typeof data.entity_name !== 'undefined')
			commitMsg += " Entity: " + data.entity_name;
		commitMsg += ")";

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		try {
			await gitProcesses[repoInfo.origin].simpleGit.add('.')
			const commitSummary = await gitProcesses[repoInfo.origin].simpleGit.commit(commitMsg);
			console.log(commitSummary);
			gitProcesses[repoInfo.origin].isProcessing = false;
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
	},
	gitStatus: async (data) => {

		// Only if gitlab conf is ready
		if (!gitlabConf.doGit)
			return;

		const appName = data.application.name
		const repoInfo = getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		if (typeof gitProcesses[repoInfo.origin] === 'undefined')
			gitProcesses[repoInfo.origin] = {
				isProcessing: false,
				simpleGit: require('simple-git/promise')(workspacePath) // eslint-disable-line
			}

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => STATUS " + repoInfo.origin);
		console.log(repoInfo);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		try {
			const status = await gitProcesses[repoInfo.origin].simpleGit.status();
			console.log(status);
			gitProcesses[repoInfo.origin].isProcessing = false;
			return status;
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
	},
	gitTag: async (data, tagName) => {

		// Only if gitlab conf is ready
		if (!gitlabConf.doGit)
			return;

		const appName = data.application.name
		const repoInfo = getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		if (typeof gitProcesses[repoInfo.origin] === 'undefined')
			gitProcesses[repoInfo.origin] = {
				isProcessing: false,
				simpleGit: require('simple-git/promise')(workspacePath) // eslint-disable-line
			}

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => TAG " + repoInfo.origin + ' VERSION => ' + tagName);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		try {
			await gitProcesses[repoInfo.origin].simpleGit.addAnnotatedTag(tagName, 'Tagging ' + tagName);
			await gitProcesses[repoInfo.origin].simpleGit.pushTags(['-u', repoInfo.origin, 'master']);
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
		gitProcesses[repoInfo.origin].isProcessing = false;
	},
	gitRemotes: async (data) => {
		// Only if gitlab conf is ready
		if (!gitlabConf.doGit)
			return;

		const appName = data.application.name
		const repoInfo = getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		if (typeof gitProcesses[repoInfo.origin] === 'undefined')
			gitProcesses[repoInfo.origin] = {
				isProcessing: false,
				simpleGit: require('simple-git/promise')(workspacePath) // eslint-disable-line
			}

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => REMOTES " + repoInfo.origin);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		try {
			const remotes = await gitProcesses[repoInfo.origin].simpleGit.getRemotes(true);
			gitProcesses[repoInfo.origin].isProcessing = false;
			return remotes;
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
	}
}