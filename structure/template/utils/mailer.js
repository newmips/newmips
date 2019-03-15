var mailConfig = require('../config/mail');
var nodemailer = require('nodemailer');
var fs = require('fs');
var dust = require('dustjs-linkedin');
var path = require('path');

var appDir = path.dirname(require.main.filename);
var transporter = nodemailer.createTransport(mailConfig.transport);
var templatePath = __dirname+'/../mails/';

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

exports.sendTemplate = function(templateName, options, attachments) {
	return new Promise(function(resolve, reject) {
		templateName = templateName.substring(-5)  != '.dust' ? templateName+'.dust' : templateName;
		// Read mail template
		fs.readFile(templatePath+templateName, 'utf8', function (err,template) {
			if (err) {
				console.error(err);
				return reject(err);
			}

			// Generate mail model, then render mail to html
			dust.renderSource(template, options.data, function(err, rendered) {
				options.html = rendered;

				if (attachments)
					options.attachments = attachments;

				// Send mail
				transporter.sendMail(options, function(error, info){
					if(error) {
						console.error(error);
						return reject(error);
					}
					return resolve(info);
				});
			});
		});
	});
}

exports.sendHtml = function(html, options, attachments) {
	return new Promise(function(resolve, reject) {
		// Generate mail model, then render mail to html
		dust.renderSource(html, options.data, function(err, rendered) {
			options.html = rendered;

			if (attachments)
				options.attachments = attachments;

			// Send mail
			transporter.sendMail(options, function(error, info){
				if(error) {
					console.error(error);
					return reject(error);
				}
				return resolve(info);
			});
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
