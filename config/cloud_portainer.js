const globalConf = require('./global');

const config = {
	develop: {
		url: process.env.CLOUD_PORTAINER_URL || "",
		login: process.env.CLOUD_PORTAINER_LOGIN || "",
		password: process.env.CLOUD_PORTAINER_PWD || ""
	},
	studio: {
		url: process.env.CLOUD_PORTAINER_URL || "",
		login: process.env.CLOUD_PORTAINER_LOGIN || "",
		password: process.env.CLOUD_PORTAINER_PWD || ""
	}
}

module.exports = config[globalConf.env];