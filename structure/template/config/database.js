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
        dialect: 'mysql' //mysql or postgres
    },
    production: {
        host: '127.0.0.1',
        port: '3306',
        user: 'newmips',
        password: 'newmips',
        database: 'newmips',
        dialect: 'mysql' //mysql or postgres
    }
}

module.exports = databaseConf[globalConf.env];