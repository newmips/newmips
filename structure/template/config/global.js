// Global configuration file

var fs = require('fs');
var env = 'develop';
var applicationConf = require('./application.json');

var config = {
	'develop': {
		env: 'develop',
		protocol: 'http',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
                localstorage : __dirname + "/../upload/"
	},
	'recette': {
		env: 'recette',
		protocol: 'https',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
                localstorage : "/var/data/localstorage/",
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
                localstorage : "/var/data/localstorage/",
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/"toRemove",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"toRemove",
			passphrase : ''
		}
	}
}

var currentConfig = config[env];
for (var appConf in applicationConf) {
	currentConfig[appConf] = applicationConf[appConf];
}

module.exports = currentConfig;
