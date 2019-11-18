// Global configuration file
const env = 'develop';
const applicationConf = require('./application.json');

const config = {
	develop: {
		env: 'develop',
		protocol: 'http',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		localstorage: __dirname + "/../upload/",
		authStrategy: 'local',
		thumbnail: {
			folder: 'thumbnail/',
			height: 30,
			width: 30,
			quality: 60
		},
		pictureField: {
			height: 200, //px
			width: 200
		}
	},
	recette: {
		env: 'recette',
		protocol: 'https',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		localstorage: "/var/data/localstorage/",
		authStrategy: 'local',
		thumbnail: {
			folder: 'thumbnail/',
			height: 30,
			width: 30,
			quality: 60
		},
		pictureField: {
			height: 200, //px
			width: 200
		},
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/ "toRemove",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/ "toRemove",
			passphrase: ''
		}
	},
	production: {
		env: 'production',
		protocol: 'https',
		host: '127.0.0.1',
		port: process.env.PORT || 1337,
		localstorage: "/var/data/localstorage/",
		authStrategy: 'local',
		thumbnail: {
			folder: 'thumbnail/',
			height: 30,
			width: 30,
			quality: 60
		},
		pictureField: {
			height: 200, //px
			width: 200
		},
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/ "toRemove",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/ "toRemove",
			passphrase: ''
		}
	},
	tablet: {
		env: 'tablet',
		protocol: 'http',
		protocol_iframe: 'https',
		host: '127.0.0.1',
		localstorage: __dirname + "/../upload/",
		syncfolder: __dirname + '/../sync/',
		port: process.env.PORT || 1338,
		authStrategy: 'local',
		thumbnail: {
			folder: 'thumbnail/',
			height: 30,
			width: 30,
			quality: 60
		},
		pictureField: {
			height: 200, //px
			width: 200
		},
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/ "toRemove",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/ "toRemove",
			passphrase: ''
		}
	},
	docker: {
		env: 'docker',
		protocol: 'http',
		protocol_iframe: 'http',
		host: '127.0.0.1',
		localstorage: __dirname + "/../upload/",
		syncfolder: __dirname + '/../sync/',
		port: process.env.PORT || 1337,
		authStrategy: 'local',
		thumbnail: {
			folder: 'thumbnail/',
			height: 30,
			width: 30,
			quality: 60
		},
		pictureField: {
			height: 200, //px
			width: 200
		},
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/ "toRemove",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/ "toRemove",
			passphrase: ''
		}
	},
	cloud: {
		env: 'cloud',
		protocol: 'http',
		protocol_iframe: 'https',
		host: '127.0.0.1',
		localstorage: __dirname + "/../upload/",
		syncfolder: __dirname + '/../sync/',
		port: process.env.PORT || 1337,
		authStrategy: 'local',
		thumbnail: {
			folder: 'thumbnail/',
			height: 30,
			width: 30,
			quality: 60
		},
		pictureField: {
			height: 200, //px
			width: 200
		},
		ssl: {
			key: /*fs.readFileSync('./cacerts/private.key')*/ "toRemove",
			cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/ "toRemove",
			passphrase: ''
		}
	}
}

// Merge applicationConf with the returned globalConf object
// After requiring config/global.js, the returned object contain the properties of config/application.json
const currentConfig = config[env];
for (const appConf in applicationConf)
	currentConfig[appConf] = applicationConf[appConf];

module.exports = currentConfig;
