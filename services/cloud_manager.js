const request = require('request-promise');
const json2yaml = require('json2yaml');
const fs = require('fs-extra');
const globalConfig = require('../config/global.js');
const portainerConfig = require('../config/portainer.js');
const gitlabConfig = require('../config/gitlab.js');
const math = require('math');
const gitHelper = require("../utils/git_helper");
let token = "";

exports.deploy = (attr, callback) => {

	console.log("STARTING DEPLOY");

	if (typeof attr.id_application === 'undefined' || !attr.id_application)
		throw new Error("Missing application ID.");

	let appID = attr.id_application

	// If local/develop environnement, then just give the generated application url
    if (globalConfig.env != 'cloud') {
        let port = math.add(9000, appID);
        let url = globalConfig.protocol + "://" + globalConfig.host + ":" + port;
        let info = {
        	message: "botresponse.applicationavailable",
        	messageParams: [url, url]
        };
        return callback(null, info);
    }

    // Get and increment application's version
    let applicationPath = 'workspace/'+appID;
    let applicationConf = JSON.parse(fs.readFileSync(applicationPath +'/config/application.json'));
    applicationConf.version++;
    fs.writeFileSync(applicationPath +'/config/application.json', JSON.stringify(applicationConf, null, 4), 'utf8');

    // Create toSyncProd.lock file
    if (fs.existsSync(applicationPath +'/models/toSyncProd.lock.json'))
        fs.unlinkSync(applicationPath +'/models/toSyncProd.lock.json');
    fs.copySync(applicationPath +'/models/toSyncProd.json', applicationPath +'/models/toSyncProd.lock.json');

    // Clear toSyncProd (not locked) file
    fs.writeFileSync(applicationPath+'/models/toSyncProd.json', JSON.stringify({queries: []}, null, 4), 'utf8');

    // Create deploy.txt file to trigger cloud deploy actions
    fs.writeFileSync(applicationPath+'/deploy.txt', applicationConf.version, 'utf8');

    // Push on git before deploy
    gitHelper.gitCommit(attr, err => {
        if (err)
        	return callback(err);

        gitHelper.gitTag(appID, applicationConf.version, applicationPath).then(_ => {
            gitHelper.gitPush(attr, (err, infoGit) => {
                if(err)
                	return callback(err, null);

                gitHelper.gitRemotes(attr, (err, remotes) => {
                    console.log("TEST REMOTES");
                    console.log(remotes);

                    let appName = attr.appCodeName.split("_").slice(1).join("_");
                    let nameRepo = globalConfig.host + '-' + appName;
                    let subdomain = globalConfig.sub_domain + '-' + appName + '-' + globalConfig.dns_cloud.replace('.', '-');

                    portainerDeploy(nameRepo, subdomain, appID, appName, attr.gitlabUser).then(data => {
                        return callback(null, {
                            message: "botresponse.deployment",
                            messageParams: [data.url, data.url]
                        });
                    }).catch(err => {
                        if(typeof err.message !== "undefined")
                            console.error(err.message);
                        else
                            console.error(err);

                        return callback(err);
                    });
                })
            });
        }).catch(function(e) {
            console.log(e);
            return callback(e);
        });
    });
}

async function portainerDeploy(repoName, subdomain, appID, appName, gitlabUser){
	// Preparing all needed values
	let gitlabUrl = gitlabConfig.sshUrl + ":" + gitlabUser.username + "/" + repoName + ".git";
    let stackName = globalConfig.sub_domain + "-" + appName + "-" + globalConfig.dns_cloud.replace(".", "-");
    let cloudUrl = globalConfig.sub_domain + "-" + appName + "." + globalConfig.dns_cloud;

    // Cloud db conf
    let cloudDbConf = {
    	dbName: "workspace_" + appID,
		dbUser: "workspace_" + appID,
		dbPwd: "workspace_" + appID,
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
        url: "/waiting?redirect=https://" + globalConfig.sub_domain + "-" + appName + "." + globalConfig.dns_cloud
    };
}

// Getting authentication token from portainer with login and pwd
async function authenticate() {
	let options = {
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
	let callResults = await request(options);

	// Return full token
	return "Bearer "+ callResults.jwt;
}

async function getStack(stackName) {
	let options = {
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

async function generateStack(stackName, gitlabUrl, repoName, cloudDbConf, cloudUrl) {

	console.log("generateStack");

	// CLOUD APP COMPOSE CONTENT
	let composeContent = json2yaml.stringify({
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

	let options = {
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
	let callResults = await request.post(options);

	// Return generated stack
	return callResults;
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
	let allContainers = await request(options);

	// Looking for our container ID
	let ourContainerID = null;
	for (var i = 0; i < allContainers.length; i++) {
		for(let item in allContainers[i].Labels){
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

// Portainer do not like camelCase and - , _ cf https://github.com/portainer/portainer/issues/2020
function clearStackname(stackName){
	return stackName.replace(/[-_.]/g, "").toLowerCase();
}