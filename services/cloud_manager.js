const fetch = require('node-fetch');
const json2yaml = require('json2yaml');
const fs = require('fs-extra');
const math = require('math');
const moment = require('moment');

const globalConf = require('../config/global.js');
const portainerCloudConfig = require('../config/cloud_portainer.js');
const gitlab = require('./code_platform');
const gitHelper = require("../utils/git_helper");
const dataHelper = require("../utils/data_helper");
let token = "";

async function request(url, options) {
	const response = await fetch(url, options);
	let result;
	if (response.status < 200 || response.status >= 300) {
		try {
			result = await response.json();
			result = result.message ? result.message : response.statusText;
		} catch (err) {
			result = response;
		}
		throw result;
	}

	try {
		result = await response.json();
	} catch (err) {
		result = response;
	}
	return result;
}

async function authenticate() {
	console.log("CALL => Authentication");

	const callResults = await request(portainerCloudConfig.url + "/auth", {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			Username: portainerCloudConfig.login,
			Password: portainerCloudConfig.password
		})
	});

	// Return full token
	return "Bearer " + callResults.jwt;
}

async function getStack(stackName) {

	console.log("CALL => Stack list");
	let callResults = await request(portainerCloudConfig.url + "/stacks", {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token
		}
	});

	// Looking for stack with given stackName
	callResults = callResults.filter(x => x.Name == stackName);

	if(callResults.length == 0)
		return false;

	// Return found stack
	return callResults[0];
}

// Generate gitlab url used to clone with access token integrated
async function generateCloneUrl(data) {
	// 1 - Generate temporary personnal access token to clone repository on cloud env
	const today = moment().format('YYYY-MM-DD');
	// Expire tomorrow
	const expireAt = moment().add(1, 'd').format('YYYY-MM-DD');
	const tokenName = 'deploy_token_' + today;
	const accessToken = await gitlab.generateAccessToken(data.code_platform.user, tokenName, ['read_repository', 'write_repository'], expireAt);

	// Get repository name using app remote (more precise)
	const remotes = await gitHelper.gitRemotes(data);
	let remote;
	if(remotes.length > 0 && remotes[0].refs && remotes[0].refs.fetch){
		// Getting actuel .git fetch remote
		remote = remotes[0].refs.fetch;
		data.repoName = remote.split('/').pop();
		if(data.repoName.endsWith('.git'))
			data.repoName = data.repoName.slice(0, -4);
	}

	let git_url = ""
	if(data.application && data.application.codePlatformRepoHTTP) {
		// Use metadata codePlatformRepoHTTP key
		// Cut http remote to inject accessToken
		let splitRemote = data.application.codePlatformRepoHTTP.split(gitlab.config.url + '/')[1];
		if(!splitRemote)
			throw new Error('Unable to build http gitlab URL needed for cloning repository on cloud.');

		if(splitRemote.endsWith('.git'))
			splitRemote = splitRemote.slice(0, -4);
		git_url = gitlab.config.protocol + '://' + accessToken + '@' + gitlab.config.url + '/' + splitRemote + '.git';
	} else if(remote) {
		// Use git remote
		let splitRemote = remote.split(gitlab.config.url + '/')[1];
		if(!splitRemote)
			throw new Error('Unable to build http gitlab URL needed for cloning repository on cloud.');

		if(splitRemote.endsWith('.git'))
			splitRemote = splitRemote.slice(0, -4);
		git_url = gitlab.config.protocol + '://' + accessToken + '@' + gitlab.config.url + '/' + splitRemote + '.git';
	} else {
		throw new Error('Unable to build http gitlab URL needed for cloning repository on cloud.')
	}

	return git_url;
}

async function updateStack(data) {

	const allContainers = await request(portainerCloudConfig.url + "/endpoints/1/docker/containers/json", {
		method: "GET",
		headers: {
			'Content-Type': 'multipart/form-data',
			'Authorization': token
		}
	});

	// Looking for our container ID
	let ourContainerID = null;
	for (let i = 0; i < allContainers.length; i++) {
		if(allContainers[i].Labels['nodea.stackname'] && allContainers[i].Labels['nodea.stackname'] == data.currentStack.Name) {
			ourContainerID = allContainers[i].Id;
			break;
		}
	}

	if(!ourContainerID)
		throw new Error("Cannot find the container to update.");

	// Getting repository remote url
	data.git_url = await generateCloneUrl(data);

	console.log("CALL => Docker container exec flag update");
	const execCmd = await request(portainerCloudConfig.url + "/endpoints/1/docker/containers/" + ourContainerID + "/exec", {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token
		},
		body: JSON.stringify({
			"AttachStdin": true,
			"AttachStdout": true,
			"AttachStderr": true,
			"DetachKeys": "ctrl-p,ctrl-q",
			"Tty": true,
			"Cmd": [
				"/bin/bash", "-c", 'echo "'+ data.git_url +'" > update.txt'
			],
			"Privileged": true,
			"User": "root"
		})
	});

	await request(portainerCloudConfig.url + "/endpoints/1/docker/exec/" + execCmd.Id + "/start", {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token
		},
		body: JSON.stringify({
			"Detach": true,
			"Tty": false
		})
	});

	console.log("CALL => Docker container restart");
	await request(portainerCloudConfig.url + "/endpoints/1/docker/containers/" + ourContainerID + "/restart", {
		method: "POST",
		headers: {
			'Content-Type': 'multipart/form-data',
			'Authorization': token
		}
	});

	// Return generated stack
	return true;
}

// Ask portainer for current network, and analyse network availability on nodea_network_*
async function getLastNodeaNetwork() {
	let allNetworks = await request(portainerCloudConfig.url + "/endpoints/1/docker/networks", {
		method: "GET",
		headers: {
			'Content-Type': 'multipart/form-data',
			'Authorization': token
		}
	});

	allNetworks = allNetworks.filter(x => x.Name.includes('nodea_network'));

	let network_number = 0, network_id, network_name, network_baseIP;
	for (let i = 0; i < allNetworks.length; i++) {
		const number = parseInt(allNetworks[i].Name.split('nodea_network_')[1]);
		if(number > network_number) {
			network_number = number;
			network_id = allNetworks[i].Id;
			network_name = allNetworks[i].Name;
			network_baseIP = allNetworks[i].IPAM.Config[0].Gateway.slice(0, -1)
		}
	}

	const inspectNetwork = await request(portainerCloudConfig.url + "/endpoints/1/docker/networks/" + network_id, {
		method: "GET",
		headers: {
			'Content-Type': 'multipart/form-data',
			'Authorization': token
		}
	});

	// Inspect network container to find pair IP not used
	const IPused = [];
	for(const containerID in inspectNetwork.Containers) {
		const container = inspectNetwork.Containers[containerID];
		const ipv4IP = container.IPv4Address.replace('/16', '').split('.').pop();
		IPused.push(parseInt(ipv4IP));
	}

	let appIP, databaseIP;
	for (let ip = 1; ip < 100; ip++) {
		if(!IPused.includes(ip) && !IPused.includes(ip + 1)){
			appIP = ip
			databaseIP = ip + 1;
			break;
		}
	}

	return {
		name: network_name,
		appIP: network_baseIP + appIP,
		databaseIP: network_baseIP + databaseIP
	};
}

async function generateStack(data) {

	// Getting repository remote url
	data.git_url = await generateCloneUrl(data);

	// Generate final deployed app cloud URL
	const cloudUrl = data.stackName + "." + globalConf.dns_cloud;

	// Setup cloud database conf
	const cloudDbConf = {
		dbName: "nodea_" + data.application.name,
		dbUser: "nodea_" + data.application.name,
		dbPwd: "nodea_" + data.application.name,
		dbRootPwd: "nodea",
		dialect: data.appDialect
	};

	// Specify database container image depeding of current app dialect
	let dbImage, dbPort;
	switch(cloudDbConf.dialect) {
		case 'mysql':
			dbImage = 'nodeasoftware/nodea-database-mysql';
			dbPort = 3306;
			break;
		case 'mariadb':
			dbImage = 'nodeasoftware/nodea-database-mariadb';
			dbPort = 3306;
			break;
		case 'postgres':
			dbImage = 'nodeasoftware/nodea-database-postgres';
			dbPort = 5432;
			break;
		default:
			dbImage = 'nodeasoftware/nodea-database-mariadb';
			dbPort = 3306;
			break;
	}

	// 7 - Getting last nodea_network_* available
	const chosenNetwork = await getLastNodeaNetwork();

	// 8 - Create docker-compose.yml file
	const composeContent = json2yaml.stringify({
		"version": "3.3",
		"services": {
			"application": {
				"container_name": data.stackName + '_app',
				"image": "nodeasoftware/application:latest",
				"environment": {
					"GIT_URL": data.git_url,
					"APP_NAME": data.repoName,
					"BRANCH": data.branch,
					"NODEA_ENV": 'cloud',
					"APP_DB_IP": chosenNetwork.databaseIP,
					"APP_DB_PORT": dbPort,
					"APP_DB_USER": cloudDbConf.dbUser,
					"APP_DB_PWD": cloudDbConf.dbPwd,
					"APP_DB_NAME": cloudDbConf.dbName,
					"APP_DB_DIALECT": cloudDbConf.dialect
				},
				"networks": {
					[chosenNetwork.name]: {
						"ipv4_address": chosenNetwork.appIP
					}
				},
				"volumes": [
					"app:/app/" + data.repoName
				],
				"labels": [
					"traefik.enable=true",
					"traefik.docker.network=proxy",
					"traefik.http.routers." + data.stackName + ".rule=Host(`" + cloudUrl + "`)",
					"traefik.http.routers." + data.stackName + ".entrypoints=websecure",
					"traefik.http.services." + data.stackName + ".loadbalancer.server.port=1337",
					"traefik.http.routers." + data.stackName + ".service=" + data.stackName + "",
					"traefik.http.routers." + data.stackName + ".tls=true",
					"traefik.http.routers." + data.stackName + ".tls.options=intermediate@file",
					"traefik.http.routers." + data.stackName + ".middlewares=secure-headers@file",
					"nodea.stackname=" + data.stackName
				]
			},
			"database": {
				"container_name": data.stackName + '_db',
				"image": dbImage,
				"environment": {
					"MYSQL_DATABASE": cloudDbConf.dbName,
					"MYSQL_USER": cloudDbConf.dbUser,
					"MYSQL_PASSWORD": cloudDbConf.dbPwd,
					"MYSQL_ROOT_PASSWORD": cloudDbConf.dbRootPwd,
					"PG_DATA": "/var/lib/postgresql/data/pgdata",
					"POSTGRES_DB": cloudDbConf.dbName,
					"POSTGRES_USER": cloudDbConf.dbUser,
					"POSTGRES_PASSWORD": cloudDbConf.dbPwd,
					"POSTGRES_ROOT_PASSWORD": cloudDbConf.dbRootPwd
				},
				"networks": {
					[chosenNetwork.name]: {
						"ipv4_address": chosenNetwork.databaseIP
					}
				},
				"volumes": [
					"db_data:/var/lib/mysql",
					"db_log:/var/log/mysql"
				]
			}
		},
		"networks": {
			[chosenNetwork.name]: {
				"external": {
					"name": chosenNetwork.name
				}
			}
		},
		"volumes": {
			'app': {},
			'db_data': {},
			'db_log': {},
		}
	});

	console.log("CALL => Stack generation");
	return await request(portainerCloudConfig.url + "/stacks?type=2&method=string&endpointId=1", {
		method: 'POST',
		headers: {
			'Content-Type': 'multipart/form-data',
			'Authorization': token
		},
		body: JSON.stringify({
			"Name": data.stackName,
			"StackFileContent": composeContent
		})
	});
}

const dnsRegex = new RegExp(/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/);
async function portainerDeploy(data){
	const appNameWithoutPrefix = data.application.name.substring(2);
	const repoName = globalConf.host + '-' + appNameWithoutPrefix;
	data.repoName = repoName.replace(/[.]/g, '-');

	// Preparing all needed values
	data.stackName = globalConf.sub_domain + "-" + appNameWithoutPrefix;
	// Portainer do not like camelCase and - , _ cf https://github.com/portainer/portainer/issues/2020
	// data.stackName = data.stackName.replace(/[-_.]/g, "").toLowerCase();

	// Looking for given branch if not master default
	if(data.branch != 'master') {
		const branch = await gitlab.getProjectBranch(data.application.repoID);
		if(!branch.find(x => x.name == data.branch || x.name.endsWith(data.branch)))
			throw new Error('Specified branch "' + data.branch + '" do not exist on repository.');

		// Cleaning branch name and adding it to stackName
		data.stackName = data.stackName + '-' + dataHelper.clearString(data.branch).replace(/[_./]/g, "-");
	}

	// Validate DNS regex
	if(data.stackName.length > 60 || !dnsRegex.test(data.stackName))
		throw new Error('DNS validation error for URL:<br>' + data.stackName + '<br>Please check, simplify, reduce your git branch name in order to be URL compatible.');

	// Authenticate in portainer API
	token = await authenticate();

	if(!data.code_platform.user)
		data.code_platform.user = await gitlab.getUser(data.currentUser);

	// Trying to get if exist the current stack in cloud portainer
	data.currentStack = await getStack(data.stackName);
	if(!data.currentStack){
		// Generate new cloud stack
		console.log("NO STACK FOUND => GENERATING IT...");
		await generateStack(data);
	} else {
		// Updating a stack
		console.log("STACK ALREADY EXIST => UPDATING IT...")
		await updateStack(data);
	}

	console.log("DEPLOY DONE");
	return {
		url: "/waiting?redirect=https://" + data.stackName + "." + globalConf.dns_cloud
	};
}

exports.deploy = async (data) => {

	console.log("STARTING DEPLOY");

	// If local/develop environnement, then just give the generated application url
	if (globalConf.env != 'studio') {
		const port = math.add(9000, data.appID);
		const url = globalConf.protocol + "://" + globalConf.host + ":" + port;
		return {
			message: "botresponse.applicationavailable",
			messageParams: [url, url]
		};
	}

	const appName = data.application.name;
	const workspacePath = __dirname + '/../workspace/' + appName;

	// Get and increment application's deploy count
	const applicationConf = JSON.parse(fs.readFileSync(workspacePath + '/config/application.json'));
	applicationConf.build++;
	fs.writeFileSync(workspacePath +'/config/application.json', JSON.stringify(applicationConf, null, 4), 'utf8');

	// public/version.txt generation
	const deployVersion = applicationConf.version + "b" + applicationConf.build;
	const versionTxtContent = moment().format('YYYY-MM-DD HH:mm') + " - " + deployVersion;
	fs.writeFileSync(workspacePath + '/app/public/version.txt', versionTxtContent, 'utf8');

	// Workspace database dialect
	data.appDialect = require(workspacePath + '/config/database').dialect; // eslint-disable-line

	// Create toSyncProd.lock file
	if (fs.existsSync(workspacePath + '/app/models/toSyncProd.lock.json'))
		fs.unlinkSync(workspacePath + '/app/models/toSyncProd.lock.json');
	fs.copySync(workspacePath + '/app/models/toSyncProd.json', workspacePath + '/app/models/toSyncProd.lock.json');

	// Clear toSyncProd (not locked) file
	fs.writeFileSync(workspacePath + '/app/models/toSyncProd.json', JSON.stringify({queries: []}, null, 4), 'utf8');

	// Push on git before deploy
	await gitHelper.gitCommit(data);
	await gitHelper.gitPull(data);
	await gitHelper.gitTag(data, deployVersion);
	await gitHelper.gitPush(data);

	const {url} = await portainerDeploy(data);
	return {
		message: "botresponse.deployment",
		messageParams: [url, url]
	};
}