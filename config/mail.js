const globalConf = require('./global');

const mailConf = {
	develop: {
		transport: {
			host: process.env.MAIL_HOST || 'mail',
			port: process.env.MAIL_PORT || 465,
			secure: true,
			auth: {
				user: process.env.MAIL_USER || '',
				pass: process.env.MAIL_PWD || ''
			}
		},
		from: process.env.MAIL_FROM || 'NoReply <no-reply@newmips.com>',
		host: process.env.MAIL_ENV_HOST || 'host'
	},
	studio: {
		transport: {
			host: process.env.MAIL_HOST || 'mail',
			port: process.env.MAIL_PORT || 465,
			secure: true,
			auth: {
				user: process.env.MAIL_USER || '',
				pass: process.env.MAIL_PWD || ''
			}
		},
		from: process.env.MAIL_FROM || 'NoReply <no-reply@newmips.com>',
		host: process.env.MAIL_ENV_HOST || 'https://' + process.env.SUB_DOMAIN + '.newmips.studio'
	}
}

module.exports = mailConf[globalConf.env];