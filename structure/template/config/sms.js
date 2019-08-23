let globalConf = require('./global');

let smsConf = {
	develop: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	},
	recette: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	},
	production: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	},
	tablet: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	},
	docker: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	},
	cloud: {
		appKey: "",
		appSecret: "",
		consumerKey: ""
	}
}

module.exports = smsConf[globalConf.env] || {};
