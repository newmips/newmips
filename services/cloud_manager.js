const request = require('request-promise');
const json2yaml = require('json2yaml');
const fs = require('fs-extra');
const globalConf = require('../config/global.js');
const portainerConfig = require('../config/portainer.js');
const gitlabConfig = require('../config/gitlab.js');
const math = require('math');
const gitHelper = require("../utils/git_helper");
let token = "";

// Portainer do not like camelCase and - , _ cf https://github.com/portainer/portainer/issues/2020
function clearStackname(stackName){
	return stackName.replace(/[-_.]/g, "").toLowerCase();
}

// Getting authentication token from portainer with login and pwd
async function authenticate() {
	const options = {
		uri: portainerConfig.url + "/auth",
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: {
			Username: portainerConfig.login,
			Password: portainerConfig.password
		},
		json: true // Automatically stringifies the body to JSON
	};

	console.log("CALL => Authentication");
	const callResults = await request(options);

	// Return full token
	return "Bearer "+ callResults.jwt;
}

async function getStack(stackName) {
	const options = {
		uri: portainerConfig.url + "/stacks",
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token
		},
		json: true // Automatically stringifies the body to JSON
	};

	console.log("CALL => Stack list");
	let callResults = await request(options);

	// Looking for stack with given stackName
	callResults = callResults.filter(x => x.Name == stackName)

	if(callResults.length == 0)
		return false;

	// Return found stack
	return callResults[0];
}

async function updateStack(currentStack, cloudUrl) {

	console.log("updateStack");

	let options = {
		uri: portainerConfig.url + "/endpoints/1/docker/containers/json",
		method: "GET",
		headers: {
			'Content-Type': 'multipart/form-data',
			'Authorization': token
		},
		json: true
	};

	console.log("CALL => Docker container list");
	const allContainers = await request(options);

	// Looking for our container ID
	let ourContainerID = null;
	for (let i = 0; i < allContainers.length; i++) {
		for(const item in allContainers[i].Labels){
			// Matching on traefik labels for cloud application DNS
			if(item.indexOf("traefik.frontend.rule") != -1 && allContainers[i].Labels[item].indexOf(cloudUrl) != -1){
				ourContainerID = allContainers[i].Id;
				break;
			}
		}
	}

	if(!ourContainerID)
		throw new Error("Cannot find the container to update.");

	console.log("Current container ID: "+ourContainerID);

	options = {
		uri: portainerConfig.url + "/endpoints/1/docker/containers/"+ourContainerID+"/restart",
		method: "POST",
		headers: {
			'Content-Type': 'multipart/form-data',
			'Authorization': token
		},
		json: true
	};

	console.log("CALL => Docker container restart");
	await request(options);

	// Return generated stack
	return currentStack;
}

async function generateStack(stackName, gitlabUrl, repoName, cloudDbConf, cloudUrl) {

	console.log("generateStack");

	// CLOUD APP COMPOSE CONTENT
	const composeContent = json2yaml.stringify({
		"version": "2",
		"services": {
			"container": {
				"image": "dockside/container:latest",
				"links": [
					"database:database"
				],
				"environment": {
					"GITURL": gitlabUrl,
					"APPNAME": repoName
				},
				"networks": [
					"proxy"
				],
				"volumes": [
					stackName+"_app:/app"
				],
				"labels": [
					"traefik.enable=true",
					"traefik.frontend.rule=Host:"+cloudUrl,
					"traefik.port=1337"
				]
			},
			"database": {
				"image": "dockside/newmips-mysql:latest",
				"environment": {
					"MYSQL_DATABASE": cloudDbConf.dbName,
					"MYSQL_USER": cloudDbConf.dbUser,
					"MYSQL_PASSWORD": cloudDbConf.dbPwd,
					"MYSQL_ROOT_PASSWORD": cloudDbConf.dbRootPwd
				},
				"networks": [
					"proxy"
				],
				"volumes": [
					stackName+"_db_data:/var/lib/mysql",
					stackName+"_db_log:/var/log/mysql"
				]
			}
		},
		"networks": {
			"proxy": {
				"external": {
					"name": "proxy"
				}
			}
		}
	});

	const options = {
		uri: portainerConfig.url + "/stacks",
		headers: {
			'Content-Type': 'multipart/form-data',
			'Authorization': token
		},
		qs: {
			type: 2, // Compose stack (1 is for swarm stack)
			method: "string", // Could be file or repository
			endpointId: 1
		},
		body: {
			"Name": stackName,
			"StackFileContent": composeContent
		},
		json: true // Automatically stringifies the body to JSON
	};

	console.log("CALL => Stack generation");
	const callResults = await request.post(options);

	// Return generated stack
	return callResults;
}

async function portainerDeploy(repoName, subdomain, appName, gitlabUrl){
	// Preparing all needed values
	let stackName = globalConf.sub_domain + "-" + appName.substring(2) + "-" + globalConf.dns_cloud.replace(".", "-");
	const cloudUrl = globalConf.sub_domain + "-" + appName.substring(2) + "." + globalConf.dns_cloud;

	// Cloud db conf
	const cloudDbConf = {
		dbName: "np_" + appName,
		dbUser: "np_" + appName,
		dbPwd: "np_" + appName,
		dbRootPwd: "p@ssw0rd"
	};

	// Portainer fix #2020
	stackName = clearStackname(stackName);

	// Authenticate in portainer API
	token = await authenticate();

	// Trying to get if exist the current stack in cloud portainer
	let currentStack = await getStack(stackName);

	// Generate new cloud stack
	if(!currentStack){
		console.log("NO STACK FOUND => GENERATING IT...")
		currentStack = await generateStack(stackName, gitlabUrl, repoName, cloudDbConf, cloudUrl);
	} else {
		console.log("STACK ALREADY EXIST => UPDATING IT...")
		// Updating a stack
		currentStack = await updateStack(currentStack, cloudUrl);
	}

	console.log("DEPLOY DONE");
	return {
		url: "/waiting?redirect=https://" + globalConf.sub_domain + "-" + appName.substring(2) + "." + globalConf.dns_cloud
	};
}

exports.deploy = async (data) => {

	console.log("STARTING DEPLOY");

	const appName = data.application.name;

	// If local/develop environnement, then just give the generated application url
	if (globalConf.env != 'cloud') {
		const port = math.add(9000, data.appID);
		const url = globalConf.protocol + "://" + globalConf.host + ":" + port;
		return {
			message: "botresponse.applicationavailable",
			messageParams: [url, url]
		};
	}

	// Get and increment application's version
	const applicationPath = 'workspace/' + appName;
	const applicationConf = JSON.parse(fs.readFileSync(applicationPath +'/config/application.json'));
	applicationConf.version++;
	fs.writeFileSync(applicationPath +'/config/application.json', JSON.stringify(applicationConf, null, 4), 'utf8');

	// Create toSyncProd.lock file
	if (fs.existsSync(applicationPath + '/models/toSyncProd.lock.json'))
		fs.unlinkSync(applicationPath + '/models/toSyncProd.lock.json');
	fs.copySync(applicationPath + '/models/toSyncProd.json', applicationPath + '/models/toSyncProd.lock.json');

	// Clear toSyncProd (not locked) file
	fs.writeFileSync(applicationPath + '/models/toSyncProd.json', JSON.stringify({queries: []}, null, 4), 'utf8');

	// Create deploy.txt file to trigger cloud deploy actions
	fs.writeFileSync(applicationPath + '/deploy.txt', applicationConf.version, 'utf8');

	// Push on git before deploy
	await gitHelper.gitCommit(data);
	await gitHelper.gitTag(appName, applicationConf.version, applicationPath);
	await gitHelper.gitPush(data);

	const appNameWithoutPrefix = data.application.name.substring(2);
	const nameRepo = globalConf.host + '-' + appNameWithoutPrefix;
	const subdomain = globalConf.sub_domain + '-' + appNameWithoutPrefix + '-' + globalConf.dns_cloud.replace('.', '-');

	const remotes = await gitHelper.gitRemotes(data);

	// Gitlab url handling
	let gitlabUrl = "";
	if(remotes.length > 0 && remotes[0].refs && remotes[0].refs.fetch)
		gitlabUrl = remotes[0].refs.fetch; // Getting actuel .git fetch remote
	else
		gitlabUrl = gitlabConfig.sshUrl + ":" + data.gitlabUser.username + "/" + nameRepo + ".git"; // Generating manually the remote, can generate clone error if the connected user is note the owning user of the gitlab repo

	console.log('Cloning in cloud: ' + gitlabUrl);
	let {url} = await portainerDeploy(nameRepo, subdomain, data.application.name, gitlabUrl);
	return {
		message: "botresponse.deployment",
		messageParams: [url, url]
	};
}