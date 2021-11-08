const globalConf = require('./global');

const databaseConf = {
	develop: {
		host: process.env.DATABASE_IP || '127.0.0.1',
		port: process.env.DATABASE_PORT || '3306',
		user: process.env.DATABASE_USER || 'newmips',
		password: process.env.DATABASE_PWD || 'newmips',
		database: process.env.DATABASE_NAME || 'newmips',
		dialect: process.env.DATABASE_DIALECT || 'mysql' //mysql || mariadb || postgres
	},
	studio: {
		host: process.env.DATABASE_IP || '127.0.0.1',
		port: process.env.DATABASE_PORT || '3306',
		user: process.env.DATABASE_USER || 'newmips',
		password: process.env.DATABASE_PWD || 'newmips',
		database: process.env.DATABASE_NAME || 'newmips',
		dialect: process.env.DATABASE_DIALECT || 'mysql'
	}
}

module.exports = databaseConf[globalConf.env];