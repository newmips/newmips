var globalConf = require('./global');

var slack = {
	develop: {
		'SLACK_API_URL': '',
		'SLACK_API_INVITE_URL': '',
		'SLACK_API_USER_TOKEN': '',
		'SLACK_API_TOKEN': ''
	},
	recette: {
		'SLACK_API_URL': '',
		'SLACK_API_INVITE_URL': '',
		'SLACK_API_USER_TOKEN': '',
		'SLACK_API_TOKEN': ''
	},
	production: {
		'SLACK_API_URL': '',
		'SLACK_API_INVITE_URL': '',
		'SLACK_API_USER_TOKEN': '',
		'SLACK_API_TOKEN': ''
	},
}

module.exports = slack[globalConf.env];
