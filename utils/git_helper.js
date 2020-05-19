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

function writeAllLogs(title, content = ''){
	let toWriteInLog = title+":\n";
	toWriteInLog += JSON.stringify(content).replace(/,/g, ",\n");
	toWriteInLog += "\n";
	fs.writeFileSync(__dirname + '/../all.log', fs.readFileSync(__dirname + '/../all.log') + "\n" + toWriteInLog + "\n");
}

function getRepoInfo(appName, gitlabUser) {
	const nameApp = appName.substring(2); // Remove prefix a_
	const cleanHost = globalConf.host.replace(/\./g, "-"); // . becomes -
	const nameRepo = cleanHost + "-" + nameApp;

	let repoUrl = "";
	if (gitlabConf.useSSH) {
		// SSH URL
		repoUrl = gitlabConf.sshUrl + ":" + gitlabUser + "/" + nameRepo + ".git";
	} else {
		// HTTP URL
		repoUrl = gitlabConf.protocol + "://" + gitlabConf.url + "/" + gitlabUser + "/" + nameRepo + ".git";
	}

	return {
		name: nameRepo,
		origin: "origin-" + cleanHost + "-" + nameApp,
		url: repoUrl
	};
}

async function initializeGit(repoInfo) {
	console.log("GIT => INIT");
	console.log(repoInfo);

	if (gitProcesses[repoInfo.origin].isProcessing)
		throw new Error("structure.global.error.alreadyInProcessGit");

	// Set isProcessing to prevent any other git command during this process
	gitProcesses[repoInfo.origin].isProcessing = true;
	await gitProcesses[repoInfo.origin].simpleGit.init();
	await gitProcesses[repoInfo.origin].simpleGit.add('.');
	const commitSummary = await gitProcesses[repoInfo.origin].simpleGit.commit("First commit - Workspace initialization");
	console.log(commitSummary);
	await gitProcesses[repoInfo.origin].simpleGit.addRemote(repoInfo.origin, repoInfo.url);
	await gitProcesses[repoInfo.origin].simpleGit.push(['-u', repoInfo.origin, 'master']);
	gitProcesses[repoInfo.origin].isProcessing = false;
	writeAllLogs("Git first commit + push", commitSummary);
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
			console.log("GIT => Git commit after new instruction.");
			console.log(repoInfo);

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
			await gitProcesses[repoInfo.origin].simpleGit.add('.')
			const commitSummary = await gitProcesses[repoInfo.origin].simpleGit.commit(commitMsg);
			console.log(commitSummary);

			gitProcesses[repoInfo.origin].isProcessing = false;
			writeAllLogs("Git commit", commitSummary);
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
			console.log("GIT => PUSH");
			console.log(repoInfo);
			await gitProcesses[repoInfo.origin].simpleGit.push(['-u', repoInfo.origin, 'master']);
			gitProcesses[repoInfo.origin].isProcessing = false;
			writeAllLogs("Git push");
		}
	},
	gitPull: async (data) => {

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

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => PULL");
		console.log(repoInfo);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		const pullSummary = await gitProcesses[repoInfo.origin].simpleGit.pull(repoInfo.origin, "master")
		console.log(pullSummary);
		gitProcesses[repoInfo.origin].isProcessing = false;
		writeAllLogs("Git pull", pullSummary);
	},
	gitCommit: async (data) => {

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

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => COMMIT");
		console.log(repoInfo);

		let commitMsg = data.function;
		commitMsg += "(App: " + appName;
		if(typeof data.module_name !== 'undefined')
			commitMsg += " Module: " + data.module_name;
		if(typeof data.entity_name !== 'undefined')
			commitMsg += " Entity: " + data.entity_name;
		commitMsg += ")";

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		await gitProcesses[repoInfo.origin].simpleGit.add('.')
		const commitSummary = await gitProcesses[repoInfo.origin].simpleGit.commit(commitMsg);
		console.log(commitSummary);
		gitProcesses[repoInfo.origin].isProcessing = false;
		writeAllLogs("Git commit", commitSummary);
	},
	gitStatus: async (data) => {

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

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => STATUS");
		console.log(repoInfo);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		const status = await gitProcesses[repoInfo.origin].simpleGit.status();
		console.log(status);
		gitProcesses[repoInfo.origin].isProcessing = false;
		writeAllLogs("Git push", status);
		return status;
	},
	gitTag: async (data, tagName) => {

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

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => TAG " + tagName);
		console.log(repoInfo);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		await gitProcesses[repoInfo.origin].simpleGit.addAnnotatedTag(tagName, 'Tagging ' + tagName);
		await gitProcesses[repoInfo.origin].simpleGit.pushTags(['-u', repoInfo.origin, 'master']);
		gitProcesses[repoInfo.origin].isProcessing = false;

		writeAllLogs("Git tag");
	},
	gitRemotes: async (data) => {
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

		if (gitProcesses[repoInfo.origin].isProcessing)
			throw new Error('structure.global.error.alreadyInProcessGit');

		console.log("GIT => REMOTES");
		console.log(repoInfo);

		// Set gitProcesses to prevent any other git command during this process
		gitProcesses[repoInfo.origin].isProcessing = true;
		const remotes = await gitProcesses[repoInfo.origin].simpleGit.getRemotes(true);
		gitProcesses[repoInfo.origin].isProcessing = false;
		writeAllLogs("Git remote", remotes);
		return remotes;
	}
}