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

	const tomlContent = "[http]\n\
	[http.routers]\n\
		[http.routers." + appDomain + "]\n\
			entryPoints = [\"websecure\"]\n\
			service = \"service-" + appDomain + "\"\n\
			rule = \"Host(`" + appDomain + "." + globalConf.dns + "`)\"\n\
			[[http.routers." + appDomain + ".tls.domains]]\n\
				main = \"*.nodea.studio\"\n\
	[http.services.service-" + appDomain + "]\n\
		[http.services.service-" + appDomain + ".loadBalancer]\n\
			[[http.services.service-" + appDomain + ".loadBalancer.servers]]\n\
				url = \"http://" + globalConf.server_ip + ":" + serverPort + "\"";

	// Generate .toml file in traefik rules folder
	fs.writeFileSync(__dirname + "/../workspace/rules/" + tomlFilename, tomlContent);
	return;
}