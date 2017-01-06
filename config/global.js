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
		limitInstruction: 500 /* 0 = infinite */
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
		limitInstruction: 500 /* 0 = infinite */
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
		limitInstruction: 500 /* 0 = infinite */
	},
	'cloud': {
		env: 'cloud',
		protocol: 'http',
		protocol_iframe: 'https',
		host: process.env.HOSTNAME + '.newmips.cloud',
		port: process.env.PORT || 1337,
		limitInstruction: 500 /* 0 = infinite */
	}
}

module.exports = config[env]
