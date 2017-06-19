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
        localstorage: __dirname + "/../upload/",
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
    'recette': {
        env: 'recette',
        protocol: 'https',
        host: '127.0.0.1',
        port: process.env.PORT || 1337,
        localstorage: "/var/data/localstorage/",
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
            key: /*fs.readFileSync('./cacerts/private.key')*/"toRemove",
            cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"toRemove",
            passphrase: ''
        }
    },
    'production': {
        env: 'production',
        protocol: 'https',
        host: '127.0.0.1',
        port: process.env.PORT || 1337,
        localstorage: "/var/data/localstorage/",
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
            key: /*fs.readFileSync('./cacerts/private.key')*/"toRemove",
            cert: /*fs.readFileSync('./cacerts/wildcard_newmips.crt')*/"toRemove",
            passphrase: ''
        }
    }
}

// Merge applicationConf with the returned globalConf object
// After requiring config/global.js, the returned object contain the properties of config/application.json
var currentConfig = config[env];
for (var appConf in applicationConf) {
    currentConfig[appConf] = applicationConf[appConf];
}

module.exports = currentConfig;
