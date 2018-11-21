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
		slack_chat_enabled: false
	},
	'recette': {
		env: 'recette',
		protocol: 'https',
		protocol_iframe: 'https',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/"fakeKey",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"fakeCert",
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
			key: /*fs.readFileSync('./cacerts/private.key')*/"fakeKey",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"fakeCert",
			passphrase : ''
		},
		slack_chat_enabled: false
	}
}

module.exports = config[env]
