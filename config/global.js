// Global configuration file
// {
// 		env: 'develop'|'production'|'recette',
// 		port: 1337
// }

/*module.exports = {
	env: 'develop',
	protocol: 'http',
	host: '127.0.0.1',
	port: process.env.PORT || 1337
}*/


// Global configuration file

var fs = require('fs');

var env = 'develop';

var config = {
	'develop': {
		env: 'develop',
		protocol: 'http',
		protocol_iframe: 'http',
		host: '127.0.0.1',
		port: process.env.PORT || 1337
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
		}
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
		}
	},
	'cloud': {
		env: 'cloud',
		protocol: 'http',
		protocol_iframe: 'https',
		host: process.env.HOSTNAME + '.newmips.cloud',
		port: process.env.PORT || 1337
	}
}

module.exports = config[env]
