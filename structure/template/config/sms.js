var globalConf = require('./global');

var smsConf = {
	develop: {
	  "appKey": "",
	  "appSecret": "",
	  "consumerKey": ""
	},
	recette: {
	  "appKey": "",
	  "appSecret": "",
	  "consumerKey": ""
	},
	production: {
	  "appKey": "",
	  "appSecret": "",
	  "consumerKey": ""
	},
	docker: {
      "appKey": "",
      "appSecret": "",
      "consumerKey": ""
    }
}

module.exports = smsConf[globalConf.env] || {};
