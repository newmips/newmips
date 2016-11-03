var globalConf = require('./global');

var mailConf = {
  develop: {
    transport: {
      host : 'YOURHOSTNAMESMTPSERVER',
      port : 465,
      secure : true,
      auth: {
        user: 'YOURLOGIN',
        pass: 'YOURPASSWORD'
      }
    },
    expediteur: 'NoReply <no-reply@newmips.com>',
    administrateur: 'Responsable Newmips <contact@newmips.com>',
    host: 'COMPLETEURL'+globalConf.port
  },

  production: {
    transport: {
      host : 'YOURHOSTNAMESMTPSERVER',
      port : 465,
      secure : true,
      auth: {
        user: 'YOURLOGIN',
        pass: 'YOURPASSWORD'
      }
    },
    expediteur: 'NoReply <no-reply@newmips.com>',
    administrateur: 'Responsable Newmips <contact@newmips.com>',
    host: 'COMPLETEURL'+globalConf.port
  },

  recette: {
    transport: {
      host : 'YOURHOSTNAMESMTPSERVER',
      port : 465,
      secure : true,
      auth: {
        user: 'YOURLOGIN',
        pass: 'YOURPASSWORD'
      }
    },
    expediteur: 'NoReply <no-reply@newmips.com>',
    administrateur: 'Responsable Newmips <contact@newmips.com>',
    host: 'COMPLETEURL'+globalConf.port
  }
}

module.exports = mailConf[globalConf.env];
