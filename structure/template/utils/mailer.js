const mailConfig = require('../config/mail');
const nodemailer = require('nodemailer');
const fs = require('fs');
const dust = require('dustjs-linkedin');
const transporter = nodemailer.createTransport(mailConfig.transport);
const templatePath = __dirname + '/../mails/';

exports.config = mailConfig;

// Parameters :
//	// The template file name (will be concatenated with `templatePath`)
// 	- templateName: 'template' || 'template.dust';
//
// 	// The mail options
//	- options: {
// 		from: 'STRING',
// 		to: 'STRING',
// 		subject: 'STRING'
//
//		// The data object represente the mail's dust template parameters. Example:
// 		data: {
// 			name: 'Name',
// 			href: '/validate'
// 		}
// 	}

// Attachment Example :
// - options.attachments = [{
// 	  filename: 'logo.jpg',
// 	  path: __dirname + '/../public/img/logo.jpg',
// 	  cid: '-logo'
// }];

exports.sendTemplate = (templateName, options, attachments) => new Promise((resolve, reject) => {
	templateName = templateName.substring(-5) != '.dust' ? templateName + '.dust' : templateName;
	// Read mail template
	fs.readFile(templatePath + templateName, 'utf8', (err, template) => {
		if (err) {
			console.error(err);
			return reject(err);
		}

		// Generate mail model, then render mail to html
		dust.renderSource(template, options.data, (err, rendered) => {
			if (err) {
				console.error(err);
				return reject(err);
			}

			options.html = rendered;

			if (attachments)
				options.attachments = attachments;

			// Send mail
			transporter.sendMail(options, (error, info) => {
				if (error) {
					console.error(error);
					return reject(error);
				}
				return resolve(info);
			});
		});
	});
});

exports.sendHtml = (html, options, attachments) => new Promise((resolve, reject) => {
	// Generate mail model, then render mail to html
	dust.renderSource(html, options.data, (err, rendered) => {
		options.html = rendered;

		if (attachments)
			options.attachments = attachments;

		// Send mail
		transporter.sendMail(options, (error, info) => {
			if (error) {
				console.error(error);
				return reject(error);
			}
			return resolve(info);
		});
	});
});

// Send mail with custom transporteur
exports.sendMailAsyncCustomTransport = (mailOptions, config) => new Promise((resolve, reject) => {
	const customTransporter = nodemailer.createTransport(config.transport);
	customTransporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.error(error);
			return reject(error);
		}
		console.log(info);
		resolve(info);
	});
});