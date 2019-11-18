const globalConfig = require('../config/global.js');
const gitlabConfig = require('../config/gitlab.js');

const request = require('request');
const fs = require("fs-extra");

exports.createApplicationDns = async (appName, appID) => {

	// Checking if traefik rules folder config exist
	if(typeof globalConfig.server_ip === "undefined" || !globalConfig.server_ip || globalConfig.server_ip == "")
		throw new Error("Missing server IP in global config.");

	const appDomain = globalConfig.sub_domain + "-" + appName;
	const tomlFilename = appDomain + ".toml";
	const serverPort = 9000 + parseInt(appID);

	// Checking if a .toml already exist => Conflict
	if(fs.existsSync(globalConfig.traefik_rules + "/" + tomlFilename))
		throw new Error("A .toml file with the name "+tomlFilename+" already exist !");

	const tomlContent = '\n\
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