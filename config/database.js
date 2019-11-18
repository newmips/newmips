const globalConf = require('./global');

const databaseConf = {
    develop: {
        host: '127.0.0.1',
        port: '3306', //mysql: 3306 - postgres: 5432
        user: 'newmips',
        password: 'newmips',
        database: 'newmips',
        dialect: 'mysql' //mysql or postgres
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
    docker: {
        host: process.env.DATABASE_IP,
        port: '3306',
        user: 'newmips',
        password: 'newmips',
        database: 'newmips',
        dialect: 'mysql'
    },
    cloud: {
        host: process.env.DATABASE_IP,
        port: '3306',
        user: 'newmips',
        password: 'newmips',
        database: 'newmips',
        dialect: 'mysql'
    }
}

module.exports = databaseConf[globalConf.env];