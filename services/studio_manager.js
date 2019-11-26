const globalConf = require('../config/global.js');
const fs = require("fs-extra");

exports.createApplicationDns = (appName, appID) => {

	// Checking if traefik rules folder config exist
	if(typeof globalConf.server_ip === "undefined" || !globalConf.server_ip || globalConf.server_ip == "")
		throw new Error("Missing server IP in global config.");

	const appDomain = globalConf.sub_domain + "-" + appName;
	const tomlFilename = appDomain + ".toml";
	const serverPort = 9000 + parseInt(appID);

	// Checking if a .toml already exist => Conflict
	if (fs.existsSync(globalConf.traefik_rules + "/" + tomlFilename))
		return;

	const tomlContent = '\n\
	[backends]\n\
		[backends.'+appDomain+']\n\
			[backends.'+appDomain+'.servers.server1]\n\
				url = "http://'+globalConf.server_ip+':'+serverPort+'"\n\
	[frontends]\n\
		[frontends.' + appDomain + ']\n\
		backend = "' + appDomain + '"\n\
			[frontends.' + appDomain + '.routes.' + appDomain + ']\n\
			rule = "Host:' + appDomain + '.' + globalConf.dns + '"';

	// Generate .toml file in traefik rules folder
	fs.writeFileSync(__dirname + "/../workspace/rules/" + tomlFilename, tomlContent);
	return;
}