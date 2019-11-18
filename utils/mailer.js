const mailConfig = require('../config/mail');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport(mailConfig.transport);

function sendMail(mailOptions, res) {
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			res("Problème d'envoi du mail.");
		} else {
			res("Mail envoyé.");
		}
	});
}

function sendMailAsync(mailOptions) {
	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.error(error);
				reject(error);
			}
			resolve(true);
		});
	});
}

exports.sendMail_Reset_Password = (data, res) => {
	let mailOptions = {
		from: mailConfig.expediteur,
		to: data.mail_user,
		subject: 'Newmips, modification de mot de passe',
		html: '\
		<html>\
			<head>\
				<meta content="text/html; charset=utf-8" http-equiv="Content-Type">\
			</head>\
			<body>\
				Bonjour,\
				<br><br>\
				Une demande de réinitialisation de mot de passe a été effectuée pour votre compte : ' + data.mail_user + '.\
				<br>\
				Si vous êtes à l\'origine de cette demande, veuillez cliquer sur le lien suivant :\
				<br><br>\
				<a href="' + mailConfig.host + '/reset_password_form/' + data.token + '">Réinitialisation du mot de passe</a>.\
				<br><br>\
				Si vous n\'êtes pas à l\'origine de cette demande, veuillez ignorer cet email.\
				<br><br>\
				Newmips\
			</body>\
		</html>'
	};
	return sendMailAsync(mailOptions);
}

// Mails relatifs à la connexion d'un utilisation
exports.sendMail_Activation_Compte = (data, res) => {
	let mailOptions = {
		from: mailConfig.expediteur,
		to: data.mail_user,
		subject: 'Bienvenue sur Newmips',
		html: '\
		<html>\
			<head>\
				<meta content="text/html; charset=utf-8" http-equiv="Content-Type">\
			</head>\
			<body>\
				Bonjour,\
				<br><br>\
				Vous trouverez ci-joint votre identifiant de connexion sur l\'espace privé Newmips.\
				<br>\
				Identifiant : ' + data.login + '\
				<br>\
				Pour activer votre compte, vous devez créer un mot de passe en utilisant le lien ci-dessous.\
				<br>\
				<a href="' + mailConfig.host + '/first_connection">Première connexion</a>.\
				<br><br>\
				Newmips\
			</body>\
		</html>'
	};
	return sendMail(mailOptions, res);
}