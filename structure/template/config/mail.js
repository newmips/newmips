const globalConf = require('./global');

const mailConf = {
	develop: {
		transport: {
			host: 'mail',
			port: 465,
			secure: true,
			auth: {
				user: '',
				pass: ''
			}
		},
		from: 'Newmips App <no-reply@newmips.com>',
		host: 'http://127.0.0.1:' + globalConf.port
	},
	test: {
		transport: {
			host: 'mail',
			port: 465,
			secure: true,
			auth: {
				user: '',
				pass: ''
			}
		},
		from: 'Newmips App <no-reply@newmips.com>',
		host: 'host'
	},
	production: {
		transport: {
			host: 'mail',
			port: 465,
			secure: true,
			auth: {
				user: '',
				pass: ''
			}
		},
		from: 'Newmips App <no-reply@newmips.com>',
		host: 'host'
	},
	studio: {
		transport: {
			host: 'mail',
			port: 465,
			secure: true,
			auth: {
				user: '',
				pass: ''
			}
		},
		from: 'Newmips App <no-reply@newmips.com>',
		host: 'host'
	},
	cloud: {
		transport: {
			host: 'mail',
			port: 465,
			secure: true,
			auth: {
				user: '',
				pass: ''
			}
		},
		from: 'Newmips App <no-reply@newmips.com>',
		host: 'host'
	},
	tablet: {
		transport: {
			host: 'mail',
			port: 465,
			secure: true,
			auth: {
				user: '',
				pass: ''
			}
		},
		from: 'Newmips App <no-reply@newmips.com>',
		host: 'host'
	}
}

module.exports = mailConf[globalConf.env];