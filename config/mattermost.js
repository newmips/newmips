const globalConf = require('./global');

const mattermost = {
	develop: {
		api_url: process.env.MATTERMOST_API_URL || '',
		team: process.env.MATTERMOST_TEAM || '',
		support_members: process.env.MATTERMOST_SUPPORT_MEMBERS || '',
		login: process.env.MATTERMOST_LOGIN || '',
		password: process.env.MATTERMOST_PWD || ''
	},
	studio: {
		api_url: process.env.MATTERMOST_API_URL || '',
		team: process.env.MATTERMOST_TEAM || '',
		support_members: process.env.MATTERMOST_SUPPORT_MEMBERS || '',
		login: process.env.MATTERMOST_LOGIN || '',
		password: process.env.MATTERMOST_PWD || ''
	}
}

module.exports = mattermost[globalConf.env];
