const globalConf = require('./global');

const smsConf = {
	develop: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	},
	test: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	},
	production: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	},
	studio: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	},
	cloud: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	},
	tablet: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	}
}

module.exports = smsConf[globalConf.env] || {};
