const globalConf = require('./global');

const databaseConf = {
	develop: {
		host: process.env.APP_DB_IP || process.env.DATABASE_IP || '127.0.0.1',
		port: process.env.APP_DB_PORT || '3306', // mysql: 3306 - postgres: 5432
		user: process.env.APP_DB_USER || 'newmips',
		password: process.env.APP_DB_PWD || 'newmips',
		database: process.env.APP_DB_NAME || 'newmips',
		dialect: process.env.APP_DB_DIALECT || 'mysql'
	},
	test: {
		host: process.env.APP_DB_IP || process.env.DATABASE_IP || '127.0.0.1',
		port: process.env.APP_DB_PORT || '3306', // mysql: 3306 - postgres: 5432
		user: process.env.APP_DB_USER || 'newmips',
		password: process.env.APP_DB_PWD || 'newmips',
		database: process.env.APP_DB_NAME || 'newmips',
		dialect: process.env.APP_DB_DIALECT || 'mysql'
	},
	production: {
		host: process.env.APP_DB_IP || process.env.DATABASE_IP || '127.0.0.1',
		port: process.env.APP_DB_PORT || '3306', // mysql: 3306 - postgres: 5432
		user: process.env.APP_DB_USER || 'newmips',
		password: process.env.APP_DB_PWD || 'newmips',
		database: process.env.APP_DB_NAME || 'newmips',
		dialect: process.env.APP_DB_DIALECT || 'mysql'
	},
	studio: {
		host: process.env.APP_DB_IP || process.env.DATABASE_IP || '127.0.0.1',
		port: process.env.APP_DB_PORT || '3306', // mysql: 3306 - postgres: 5432
		user: process.env.APP_DB_USER || 'newmips',
		password: process.env.APP_DB_PWD || 'newmips',
		database: process.env.APP_DB_NAME || 'newmips',
		dialect: process.env.APP_DB_DIALECT || 'mysql'
	},
	cloud: {
		host: process.env.APP_DB_IP || process.env.DATABASE_IP || '127.0.0.1',
		port: process.env.APP_DB_PORT || '3306', // mysql: 3306 - postgres: 5432
		user: process.env.APP_DB_USER || 'newmips',
		password: process.env.APP_DB_PWD || 'newmips',
		database: process.env.APP_DB_NAME || 'newmips',
		dialect: process.env.APP_DB_DIALECT || 'mysql'
	},
	tablet: {
		dialect: 'sqlite',
		// iOS
		// storage: process.env.CORDOVA_APP_DIR + '/../Library/LocalDatabase/newmips.db'
		// ANDROID :
		storage: __dirname + '/newmips.db'
	}
}

module.exports = databaseConf[globalConf.env];