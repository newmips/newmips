const mailConfig = require('../config/mail');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport(mailConfig.transport);

function sendMailAsync(mailOptions) {
	return new Promise((resolve, reject) => {
		transporter.sendMail(mailOptions, err => {
			if (err)
				return reject(err);
			resolve(true);
		});
	});
}

exports.sendMailResetPassword = data => {
	const mailOptions = {
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