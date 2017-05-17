var globalConf = require('./global');

var slack = {
	develop: {
		'SLACK_API_URL': 'https://slack.com/api/channels.join',
		'SLACK_API_INVITE_URL': 'https://slack.com/api/channels.invite',
		'SLACK_API_USER_TOKEN': '',
		'SLACK_API_TOKEN': ''
	},
	recette: {
		'SLACK_API_URL': 'https://slack.com/api/channels.join',
		'SLACK_API_INVITE_URL': 'https://slack.com/api/channels.invite',
		'SLACK_API_USER_TOKEN': '',
		'SLACK_API_TOKEN': ''
	},
	production: {
		'SLACK_API_URL': 'https://slack.com/api/channels.join',
		'SLACK_API_INVITE_URL': 'https://slack.com/api/channels.invite',
		'SLACK_API_USER_TOKEN': '',
		'SLACK_API_TOKEN': ''
	},
}

module.exports = slack[globalConf.env];
