var globalConf = require('./global');

var webdav = {
	develop: {
		'url': 'http://cloud.newmips.com:8090/owncloud/remote.php/webdav/newmips-dev/',
		'host': 'cloud.newmips.com',
		'port': '8090',
		'user_name': '',
		'password': ''
	},
	recette: {
		'url': 'http://cloud.newmips.com:8090/owncloud/remote.php/webdav/newmips-dev/',
		'host': 'cloud.newmips.com',
		'port': '8090',
		'user_name': '',
		'password': ''
	},
	production: {
		'url': 'http://cloud.newmips.com:8090/owncloud/remote.php/webdav/newmips-dev/',
		'host': '5.196.91.69',
		'port': '8090',
		'user_name': '',
		'password': ''
	}
}

module.exports = webdav[globalConf.env];
