const globalConf = require('./global');

const config = {
	develop: {
		enabled: false,
		platform: process.env.CODE_PLATFORM || "gitlab",
		protocol: process.env.GITLAB_PROTOCOL || "http",
		url: process.env.GITLAB_URL || "",
		token: process.env.GITLAB_PRIVATE_TOKEN || ""
	},
	studio: {
		enabled: true,
		platform: process.env.CODE_PLATFORM || "gitlab",
		protocol: process.env.GITLAB_PROTOCOL || "http",
		url: process.env.GITLAB_URL || "",
		token: process.env.GITLAB_PRIVATE_TOKEN || ""
	}
}

module.exports = config[globalConf.env];