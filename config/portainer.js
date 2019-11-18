const globalConf = require('./global');

const config = {
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