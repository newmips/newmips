var globalConf = require('./global');

var databaseConf = {
    develop: {
        host: '127.0.0.1',
        port: '3306', //mysql: 3306 - postgres: 5432
        user: 'newmips',
        password: 'newmips',
        database: 'newmips',
        dialect: 'mysql'  //mysql or postgres
    },
    recette: {
        host: '127.0.0.1',
        port: '3306',
        user: 'newmips',
        password: 'newmips',
        database: 'newmips',
        dialect: 'mysql'
    },
    production: {
        host: '127.0.0.1',
        port: '3306',
        user: 'newmips',
        password: 'newmips',
        database: 'newmips',
        dialect: 'mysql'
    },
    tablet: {
        dialect: 'sqlite',
        // iOS
        // storage: process.env.CORDOVA_APP_DIR + '/../Library/LocalDatabase/newmips.db'
        // ANDROID :
        storage: __dirname + '/newmips.db'
    },
    docker: {
        host: 'database',
        port: '3306',
        user: 'newmips',
        password: 'newmips',
        database: 'newmips',
        dialect: 'mysql'
    },
    cloud: {
        host: 'database',
        port: '3306',
        user: 'newmips',
        password: 'newmips',
        database: 'newmips',
        dialect: 'mysql'
    }
}

module.exports = databaseConf[globalConf.env];