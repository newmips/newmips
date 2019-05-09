var globalConf = require('./global');

var webdav = {
	develop: {
		url: '', // Owncloud URL
		host: '',
		port: '',
		user_name: '',
		password: ''
	},
	recette: {
		url: '',
		host: '',
		port: '',
		user_name: '',
		password: ''
	},
	production: {
		url: '',
		host: '',
		port: '',
		user_name: '',
		password: ''
	},
	tablet: {
		url: '',
		host: '',
		port: '',
		user_name: '',
		password: ''
	},
	docker: {
		url: '',
		host: '',
		port: '',
		user_name: '',
		password: ''
	},
	cloud: {
		url: '',
		host: '',
		port: '',
		user_name: '',
		password: ''
	}
}

module.exports = webdav[globalConf.env];
