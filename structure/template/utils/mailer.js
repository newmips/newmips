var mailConfig = require('../config/mail');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport(mailConfig.transport);

exports.config = mailConfig;

function sendMailAsync(mailOptions) {
    return new Promise(function(resolve, reject) {
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.error(error);
                reject(false);
            }
            resolve(true);
        });
    });
}

exports.sendMailResetPassword = function(data, res) {
    var mailOptions = {
        from: mailConfig.expediteur,
        to: data.email,
        subject: 'Newmips, modification de mot de passe',
        html: '<html>' +
            '<head><meta content="text/html; charset=utf-8" http-equiv="Content-Type"></head>' +
            '<body>' +
            'Bonjour, ' +
            '<br />' +
            '<br />' +
            'Une demande de réinitialisation de mot de passe a été effectuée pour votre compte : ' + data.email + '.' +
            '<br />' +
            'Si vous êtes à l\'origine de cette demande, veuillez cliquer sur le lien suivant :' +
            '<br />' +
            '<a href="' + mailConfig.host + '/reset_password/' + data.token + '">Réinitialisation du mot de passe</a>.' +
            '<br />' +
            '<br />' +
            'Si vous n\'êtes pas à l\'origine de cette demande, veuillez ignorer cet email.' +
            '<br />' +
            '<br />' +
            'Newmips' +
            '</body></html>'
    };
    return sendMailAsync(mailOptions);
}

// Just send a mail
exports.sendMailAsync = function(mailOptions) {
    return new Promise(function(resolve, reject) {
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.error(error);
                reject(false);
            }
            resolve(true);
        });
    });
}

// Send mail with custom transporteur
exports.sendMailAsyncCustomTransport = function(mailOptions, config) {
    return new Promise(function(resolve, reject) {
        var customTransporter = nodemailer.createTransport(config.transport);
        customTransporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.error(error);
                reject(error);
            }
            console.log(info);
            resolve(info);
        });
    });
}