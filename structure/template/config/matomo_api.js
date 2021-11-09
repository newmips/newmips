const globalConf = require('./global');

const matomoApiConf = {
	develop: {
		enabled: false,
		// Tracking in bulk when limit or timeout is reached
		bulk_limit: 1000,
		bulk_timeout: 10000,
		token_auth: '', // Available in matomo client
		host: '', // Host of the tracked api
		site_id: -1, // Available in matomo client
		host_matomo: '' // https://matomo.newmips.com/matomo.php /!\ Expected to end with `matomo.php`
	},
	test: {
		enabled: false,
		bulk_limit: 1000,
		bulk_timeout: 1000,
		token_auth: '',
		host: '',
		site_id: -1,
		host_matomo: ''
	},
	production: {
		enabled: false,
		bulk_limit: 1000,
		bulk_timeout: 1000,
		token_auth: '',
		host: '',
		site_id: -1,
		host_matomo: ''
	},
	studio: {
		enabled: false,
		bulk_limit: 1000,
		bulk_timeout: 1000,
		token_auth: '',
		host: '',
		site_id: -1,
		host_matomo: ''
	},
	cloud: {
		enabled: false,
		bulk_limit: 1000,
		bulk_timeout: 1000,
		token_auth: '',
		host: '',
		site_id: -1,
		host_matomo: ''
	},
	tablet: {
		enabled: false,
		bulk_limit: 1000,
		bulk_timeout: 1000,
		token_auth: '',
		host: '',
		site_id: -1,
		host_matomo: ''
	}
}

module.exports = matomoApiConf[globalConf.env];
