var globalConf = require('./global');

var smsConf = {
	develop: {
	  "appKey": "",
	  "appSecret": "",
	  "consumerKey": ""
	}
}

module.exports = smsConf[globalConf.env] || {};
