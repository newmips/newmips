// Global configuration file
var fs = require('fs');

var env = 'develop';
var config = {
	'develop': {
		env: 'develop',
		protocol: 'http',
		protocol_iframe: 'http',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		slack_chat_enabled: true
	},
	'recette': {
		env: 'recette',
		protocol: 'https',
		protocol_iframe: 'https',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/"toRemove",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"toRemove",
			passphrase : ''
		},
		slack_chat_enabled: false
	},
	'production': {
		env: 'production',
		protocol: 'https',
		protocol_iframe: 'https',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/"toRemove",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"toRemove",
			passphrase : ''
		},
		slack_chat_enabled: false
	},
	'cloud': {
		env: 'cloud',
		protocol: 'http',
		protocol_iframe: 'https',
		host: process.env.HOSTNAME,
		dns: '.newmips.cloud',
		port: process.env.PORT || 1337,
		slack_chat_enabled: false
	}
}

module.exports = config[env]
