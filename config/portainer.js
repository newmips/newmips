const globalConf = require('./global');

let config = {
	docker: {
    	url: "",
    	login: "",
    	password: ""
    },
    cloud: {
    	url: "",
    	login: "",
    	password: ""
    }
}

module.exports = config[globalConf.env];