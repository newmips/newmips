var globalConf = require('./global');

var webdav = {
	develop: {
		'url': 'http://cloud.newmips.com:8090/owncloud/remote.php/webdav/newmips-dev/',
		'host': 'cloud.newmips.com',
		'port': '8090',
		'user_name': 'newmips',
		'password': 'new20mips16$'
	},
	recette: {
		'url': 'http://cloud.newmips.com:8090/owncloud/remote.php/webdav/newmips-dev/',
		'host': 'cloud.newmips.com',
		'port': '8090',
		'user_name': 'newmips',
		'password': 'new20mips16$'
	},
	production: {
		'url': 'http://cloud.newmips.com:8090/owncloud/remote.php/webdav/newmips-dev/',
		'host': '5.196.91.69',
		'port': '8090',
		'user_name': 'newmips',
		'password': 'new20mips16$'
	}
}

module.exports = webdav[globalConf.env];
