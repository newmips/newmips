const globalConf = require('./global');

let mailConf = {
    develop: {
        transport: {
            host: 'mail',
            port: 465,
            secure: true,
            auth: {
                user: '',
                pass: ''
            }
        },
        expediteur: 'NoReply <no-reply@newmips.com>',
        administrateur: 'Responsable Newmips <contact@newmips.com>',
        host: 'http://127.0.0.1:' + globalConf.port
    },
    recette: {
        transport: {
            host: 'mail',
            port: 465,
            secure: true,
            auth: {
                user: '',
                pass: ''
            }
        },
        expediteur: 'NoReply <no-reply@newmips.com>',
        administrateur: 'Responsable Newmips <contact@newmips.com>',
        host: 'host'
    },
    production: {
        transport: {
            host: 'mail',
            port: 465,
            secure: true,
            auth: {
                user: '',
                pass: ''
            }
        },
        expediteur: 'NoReply <no-reply@newmips.com>',
        administrateur: 'Responsable Newmips <contact@newmips.com>',
        host: 'host'
    },
    docker: {
        transport: {
            host: 'mail',
            port: 465,
            secure: true,
            auth: {
                user: '',
                pass: ''
            }
        },
        expediteur: 'NoReply <no-reply@newmips.com>',
        administrateur: 'Responsable Newmips <contact@newmips.com>',
        host: 'https://'+process.env.SUB_DOMAIN+'.newmips.studio'
    },
    cloud: {
        transport: {
            host: 'mail',
            port: 465,
            secure: true,
            auth: {
                user: '',
                pass: ''
            }
        },
        expediteur: 'NoReply <no-reply@newmips.com>',
        administrateur: 'Responsable Newmips <contact@newmips.com>',
        host: 'https://'+process.env.SUB_DOMAIN+'.newmips.studio'
    }
}

module.exports = mailConf[globalConf.env];