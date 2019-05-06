const globalConf = require('./global');

let config = {
    cloud: {
    	url: "",
    	login: "",
    	password: ""
    }
}

module.exports = config[globalConf.env];