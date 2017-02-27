var mailConfig = require('../config/mail');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport(mailConfig.transport);

exports.config = mailConfig;

function sendMail(mailOptions, res) {
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            res("Problème d'envoi du mail.");
        } else {
            res("Mail envoyé.");
        }
    });
}

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

exports.sendMail_Reset_Password = function(data, res) {
    var mailOptions = {
        from: mailConfig.expediteur,
        to: data.f_email,
        subject: 'Newmips, modification de mot de passe',
        html: '<html>' +
            '<head><meta content="text/html; charset=utf-8" http-equiv="Content-Type"></head>' +
            '<body>' +
            'Bonjour, ' +
            '<br />' +
            '<br />' +
            'Une demande de réinitialisation de mot de passe a été effectuée pour votre compte : ' + data['email'] + '.' +
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

// Mails relatifs à la connexion d'un utilisation
exports.sendMail_Activation_Compte = function(data, res) {
    var mailOptions = {
        from: mailConfig.expediteur,
        to: data["mail_user"],
        subject: 'Bienvenue sur Newmips',
        html: '<html>' +
            '<head><meta content="text/html; charset=utf-8" http-equiv="Content-Type"></head>' +
            '<body>' +
            'Bonjour, ' +
            '<br />' +
            '<br />' +
            'Vous trouverez ci-joint votre identifiant de connexion sur l\'espace privé Newmips.' +
            '<br />' +
            'Identifiant : ' + data["login_user"] +
            '<br />' +
            'Pour activer votre compte, vous devez créer un mot de passe en utilisant le lien ci-dessous.' +
            '<br />' +
            '<a href="' + mailConfig.host + '/first_connection">Première connexion</a>.' +
            '<br />' +
            '<br />' +
            'Newmips' +
            '</body></html>'
    };
    return sendMail(mailOptions, res);
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