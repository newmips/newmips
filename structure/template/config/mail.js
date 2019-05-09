var globalConf = require('./global');

var mailConf = {
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
        expediteur: 'Newmips App <no-reply@newmips.com>',
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
        expediteur: 'Newmips App <no-reply@newmips.com>',
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
        expediteur: 'Newmips App <no-reply@newmips.com>',
        administrateur: 'Responsable Newmips <contact@newmips.com>',
        host: 'host'
    },
    tablet: {
        transport: {
            host: 'mail',
            port: 465,
            secure: true,
            auth: {
                user: '',
                pass: ''
            }
        },
        expediteur: 'Newmips App <no-reply@newmips.com>',
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
        expediteur: 'Newmips App <no-reply@newmips.com>',
        administrateur: 'Responsable Newmips <contact@newmips.com>',
        host: 'host'
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
        expediteur: 'Newmips App <no-reply@newmips.com>',
        administrateur: 'Responsable Newmips <contact@newmips.com>',
        host: 'host'
    }
}

module.exports = mailConf[globalConf.env];