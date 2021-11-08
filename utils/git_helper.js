const fs = require("fs-extra");
const globalConf = require('../config/global.js');
const code_platform = require('../services/code_platform');
const models = require('../models');
const gitProcesses = {};

function checkAlreadyInit(workspace) {
	const dotGitPath = __dirname + '/../workspace/' + workspace + '/.git';
	if (fs.existsSync(dotGitPath))
		return true;
	return false;
}

async function getRepoInfo(appName) {
	const nameApp = appName.substring(2); // Remove prefix a_
	const cleanHost = globalConf.host.replace(/\./g, "-"); // . becomes -
	const nameRepo = cleanHost + "-" + nameApp;
	let repoUrl = null, tokenUrl = null;

	// Get current env admin
	// Because he is the one who own the projects
	const admin = await models.User.findByPk(1);
	const repoName = admin.email.replace(/@/g, "-").replace(/\./g, "-").trim();

	repoUrl = `${code_platform.config.protocol}://${code_platform.config.url}/${repoName}/${nameRepo}`;
	tokenUrl = `${code_platform.config.protocol}://$TOKEN$@${code_platform.config.url}/${repoName}/${nameRepo}`;

	return {
		name: nameRepo,
		origin: "origin-" + cleanHost + "-" + nameApp,
		url: repoUrl,
		tokenUrl: tokenUrl
	};
}

async function initializeGit(repoInfo, user) {
	console.log("GIT => INIT " + repoInfo.origin);

	if (gitProcesses[repoInfo.origin].isProcessing)
		throw new Error("structure.global.error.alreadyInProcessGit");

	// Set isProcessing to prevent any other git command during this process
	gitProcesses[repoInfo.origin].isProcessing = true;
	try {
		await gitProcesses[repoInfo.origin][user.id].simpleGit.init();
		await gitProcesses[repoInfo.origin][user.id].simpleGit.addRemote(repoInfo.origin, repoInfo.tokenUrl);
		await gitProcesses[repoInfo.origin][user.id].simpleGit.add('.');
		const commitSummary = await gitProcesses[repoInfo.origin][user.id].simpleGit.commit("First commit - Workspace initialization");
		console.log(commitSummary);
		gitProcesses[repoInfo.origin][user.id].simpleGit.push(['-u', repoInfo.origin, 'master']);
	} catch(err) {
		gitProcesses[repoInfo.origin].isProcessing = false;
		throw err;
	}
	gitProcesses[repoInfo.origin].isProcessing = false;
}

function initRepoGitProcess(repoInfo, data, workspacePath) {
	console.log("GIT => INIT USER " + repoInfo.origin);

	if (typeof gitProcesses[repoInfo.origin] === 'undefined')
		gitProcesses[repoInfo.origin] = {
			isProcessing: false
		};

	if (typeof gitProcesses[repoInfo.origin][data.currentUser.id] === 'undefined'){
		repoInfo.tokenUrl = repoInfo.tokenUrl.replace('$TOKEN$', data.code_platform.user.accessToken);
		// Git process per origin and per nodea user
		gitProcesses[repoInfo.origin][data.currentUser.id] = {
			simpleGit: require('simple-git/promise')(workspacePath, { // eslint-disable-line
				config: [
					`url.${repoInfo.tokenUrl}.insteadOf=${repoInfo.url}`,
					`user.name=${data.code_platform.user.username}`,
					`user.email=${data.code_platform.user.email}`
				]
			})
		};
	}
}

function checkRequirements(data) {
	// Only if a code platform conf is ready
	if (!code_platform.config.enabled)
		return false;

	if (!data.currentUser)
		throw new Error("Missing current user in data object.");

	if (!data.code_platform.user)
		throw new Error("Missing code platform user in session.");

	if (!data.code_platform.user.accessToken || data.code_platform.user.accessToken == '')
		throw new Error("Missing code platform access token in session.");

	return true;
}

module.exports = {
	isGitActivated: () => code_platform.config.enabled,
	doGit: async (data) => {

		if(!checkRequirements(data))
			return;

		const appName = data.application.name
		const repoInfo = await getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;

		initRepoGitProcess(repoInfo, data, workspacePath);

		// Check if .git is already initialize in the workspace directory
		if (!checkAlreadyInit(appName))
			await initializeGit(repoInfo, data.currentUser); // Do first commit and push
		else if (typeof data.function !== "undefined") {
			// We are just after a new instruction
			console.log("GIT => COMMIT " + repoInfo.origin);

			if (gitProcesses[repoInfo.origin].isProcessing)
				throw new Error("structure.global.error.alreadyInProcessGit");

			let commitMsg = data.function;
			commitMsg += " => "
			if (data.options && typeof data.options.showValue !== 'undefined')
				commitMsg += data.options.showValue;
			if (data.module_name && typeof data.module_name !== 'undefined')
				commitMsg += " | Module: " + data.module_name;
			if (data.entity_name && typeof data.entity_name !== 'undefined')
				commitMsg += " | Entity: " + data.entity_name;

			// Set gitProcesses to prevent any other git command during this process
			gitProcesses[repoInfo.origin].isProcessing = true;
			try {
				await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.add('.')
				const commitSummary = await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.commit(commitMsg);
				console.log(commitSummary);
				gitProcesses[repoInfo.origin].isProcessing = false;
			} catch(err) {
				gitProcesses[repoInfo.origin].isProcessing = false;
				throw err;
			}
		}
	},
	gitPush: async (data) => {

		if(!checkRequirements(data))
			return;

		const appName = data.application.name
		const repoInfo = await getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		initRepoGitProcess(repoInfo, data, workspacePath);

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		// Check if .git is already initialize in the workspace directory
		if (!checkAlreadyInit(appName))
			await initializeGit(repoInfo, data.currentUser); // Do first commit and push
		else if(typeof data.function !== "undefined"){
			// We are just after a new instruction
			console.log("GIT => PUSH " + repoInfo.origin);
			gitProcesses[repoInfo.origin].isProcessing = true;
			try {
				await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.push(['-u', repoInfo.origin, 'master']);
				gitProcesses[repoInfo.origin].isProcessing = false;
			} catch(err) {
				gitProcesses[repoInfo.origin].isProcessing = false;
				throw err;
			}
		}
	},
	gitPull: async (data) => {

		if(!checkRequirements(data))
			return;

		const appName = data.application.name
		const repoInfo = await getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		initRepoGitProcess(repoInfo, data, workspacePath);

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => PULL " + repoInfo.origin);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		try {
			const pullSummary = await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.pull(repoInfo.origin, "master")
			console.log(pullSummary);
			gitProcesses[repoInfo.origin].isProcessing = false;
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
	},
	gitCommit: async (data) => {

		if(!checkRequirements(data))
			return;

		const appName = data.application.name
		const repoInfo = await getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		initRepoGitProcess(repoInfo, data, workspacePath);

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
			await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.add('.')
			const commitSummary = await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.commit(commitMsg);
			console.log(commitSummary);
			gitProcesses[repoInfo.origin].isProcessing = false;
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
	},
	gitStatus: async (data) => {

		if(!checkRequirements(data))
			return;

		const appName = data.application.name
		const repoInfo = await getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		initRepoGitProcess(repoInfo, data, workspacePath);

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => STATUS " + repoInfo.origin);
		console.log(repoInfo);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		try {
			const status = await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.status();
			console.log(status);
			gitProcesses[repoInfo.origin].isProcessing = false;
			return status;
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
	},
	gitTag: async (data, tagName) => {

		if(!checkRequirements(data))
			return;

		const appName = data.application.name
		const repoInfo = await getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		initRepoGitProcess(repoInfo, data, workspacePath);

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => TAG " + repoInfo.origin + ' VERSION => ' + tagName);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		try {
			await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.addAnnotatedTag(tagName, 'Tagging ' + tagName);
			await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.pushTags(['-u', repoInfo.origin, 'master']);
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
		gitProcesses[repoInfo.origin].isProcessing = false;
	},
	gitRemotes: async (data) => {

		if(!checkRequirements(data))
			return;

		const appName = data.application.name
		const repoInfo = await getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		initRepoGitProcess(repoInfo, data, workspacePath);

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => REMOTES " + repoInfo.origin);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		try {
			const remotes = await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.getRemotes(true);
			gitProcesses[repoInfo.origin].isProcessing = false;
			return remotes;
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
	},
	gitBranch: async (data) => {

		if(!checkRequirements(data))
			return;

		const appName = data.application.name
		const repoInfo = await getRepoInfo(appName);

		// Workspace path
		const workspacePath = __dirname + '/../workspace/' + appName;
		initRepoGitProcess(repoInfo, data, workspacePath);

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => BRANCH " + repoInfo.origin);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		try {
			await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.fetch('-a');
			await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.pull();
			const branch = await gitProcesses[repoInfo.origin][data.currentUser.id].simpleGit.branch(['-a']);
			gitProcesses[repoInfo.origin].isProcessing = false;
			return branch;
		} catch(err) {
			gitProcesses[repoInfo.origin].isProcessing = false;
			throw err;
		}
	}
}