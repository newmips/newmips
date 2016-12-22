var globalConf = require('./global');

var mailConf = {
  develop: {
    transport: {
      host : '',
      port : ,
      secure : true,
      auth: {
        user: '',
        pass: ''
      }
    },
    expediteur: '',
    administrateur: '',
    host: ""
  },

  production: {
    transport: {
      host : '',
      port : ,
      secure : true,
      auth: {
        user: '',
        pass: ''
      }
    },
    expediteur: '',
    administrateur: '',
    host: ''
  },

  recette: {
    transport: {
      host : '',
      port : ,
      secure : true,
      auth: {
        user: '',
        pass: ''
      }
    },
    expediteur: '',
    administrateur: '',
    host: ""
  }
}

module.exports = mailConf[globalConf.env];
