var globalConf = require('./global');

var mattermost = {
	develop: {
		api_url: 'https://team.newmips.com:8065/api/v4',
		team: "support",
		support_members: "support-newmips", // Other team dissociate from support to determinate who are the persons that will be added to new channel
		login: 'support@newmips.com',
		password: ''
	},
	recette: {
		api_url: 'https://team.newmips.com:8065/api/v4',
		team: "support",
		support_members: "support-newmips",
		login: 'support@newmips.com',
		password: ''
	},
	production: {
		api_url: 'https://team.newmips.com:8065/api/v4',
		team: "support",
		support_members: "support-newmips",
		login: 'support@newmips.com',
		password: ''
	},
	docker: {
		api_url: 'https://team.newmips.com:8065/api/v4',
		team: "support",
		support_members: "support-newmips",
		login: 'support@newmips.com',
		password: ''
	},
	cloud: {
		api_url: 'https://team.newmips.com:8065/api/v4',
		team: "support",
		support_members: "support-newmips",
		login: 'support@newmips.com',
		password: ''
	}
}

module.exports = mattermost[globalConf.env];
