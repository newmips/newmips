var globalConf = require('./global');

var databaseConf = {
    develop: {
        connection: {
            host: 'mysql',
            port: '3306',
            user: 'newmips',
            password: 'newmips',
            database: 'newmips',
            users_table: 'user',
            dateStrings: 'true'
        }
    },

    production: {
        connection: {
            host: 'mysql',
            port: '3306',
            user: 'newmips',
            password: 'newmips',
            database: 'newmips',
            users_table: 'user',
            dateStrings: 'true'
        }
    },

    recette: {
        connection: {
            host: 'mysql',
            port: '3306',
            user: 'newmips',
            password: 'newmips',
            database: 'newmips',
            users_table: 'user',
            dateStrings: 'true'
        }
    }
}

module.exports = databaseConf[globalConf.env];