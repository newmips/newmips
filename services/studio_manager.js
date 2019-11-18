const globalConfig = require('../config/global.js');
const gitlabConfig = require('../config/gitlab.js');

const request = require('request');
const fs = require("fs-extra");

exports.createApplicationDns = async (appName, appID) => {

	// Checking if traefik rules folder config exist
	if(typeof globalConfig.server_ip === "undefined" || !globalConfig.server_ip || globalConfig.server_ip == "")
		throw new Error("Missing server IP in global config.");

	let appDomain = globalConfig.sub_domain + "-" + appName;
	let tomlFilename = appDomain + ".toml";
	let serverPort = 9000 + parseInt(appID);

	// Checking if a .toml already exist => Conflict
	if(fs.existsSync(globalConfig.traefik_rules + "/" + tomlFilename))
		throw new Error("A .toml file with the name "+tomlFilename+" already exist !");

	let tomlContent = '\n\
	[backends]\n\
		[backends.'+appDomain+']\n\
			[backends.'+appDomain+'.servers.server1]\n\
				url = "http://'+globalConfig.server_ip+':'+serverPort+'"\n\
	[frontends]\n\
		[frontends.' + appDomain + ']\n\
		backend = "' + appDomain + '"\n\
			[frontends.' + appDomain + '.routes.' + appDomain + ']\n\
			rule = "Host:' + appDomain + '.' + globalConfig.dns + '"';

	// Generate .toml file in traefik rules folder
	fs.writeFileSync(__dirname + "/../workspace/rules/" + tomlFilename, tomlContent);
	return;
}