// Global configuration file
const fs = require('fs');
let env = 'develop';

let config = {
	'develop': {
		env: 'develop',
		protocol: 'http',
		protocol_iframe: 'http',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		authStrategy: 'local',
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
		authStrategy: 'local',
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
		authStrategy: 'local',
		slack_chat_enabled: false
	},
	'docker': {
		env: 'docker',
		protocol: 'http',
		protocol_iframe: 'http',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/"fakeKey",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"fakeCert",
			passphrase : ''
		},
		authStrategy: 'local',
		slack_chat_enabled: false
	}
}

let fullConfig = config[env];
fullConfig.version = "2.8";

module.exports = fullConfig;
