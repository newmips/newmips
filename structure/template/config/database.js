var globalConf = require('./global');

var databaseConf = {
	develop: {
		connection: {
      host: 'mysql',
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
      user: 'newmips',
      password: 'newmips',
      database: 'newmips',
      users_table: 'user',
      dateStrings: 'true'
		}
	}
}

module.exports = databaseConf[globalConf.env];
