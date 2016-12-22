// Global configuration file

var fs = require('fs');
var env = 'develop';

var config = {
	'develop': {
		env: 'develop',
		protocol: 'http',
		host: '127.0.0.1',
		port: process.env.PORT || 1337
	},
	'recette': {
		env: 'recette',
		protocol: 'https',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/"toRemove",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"toRemove",
			passphrase : ''
		}
	},
	'production': {
		env: 'production',
		protocol: 'https',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/"toRemove",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"toRemove",
			passphrase : ''
		}
	}
}

module.exports = config[env]
