var crypto = require('crypto');
var studioConfig = require('../config/studio_manager.json');
var cloudConfig = require('../config/cloud_manager.json');
var request = require('request');

var algorithm = 'aes-256-ctr';

function encrypt(text){
	var cipher = crypto.createCipher(algorithm, studioConfig.securityKey);
	var crypted = cipher.update(text,'utf8','hex')
	crypted += cipher.final('hex');
	return crypted;
}

function decrypt(text) {
	var decipher = crypto.createDecipher(algorithm, studioConfig.securityKey)
	var dec = decipher.update(text,'hex','utf8')
	dec += decipher.final('utf8');
	return dec;
}

function getAuthorization() {
	var cryptedLogin = encrypt(studioConfig.login);
	var cryptedPassword = encrypt(studioConfig.password);
	var auth = "Basic "+ new Buffer(cryptedLogin+":"+cryptedPassword).toString("base64");

	return auth;
}

exports.createApplicationDns = function(subdomain, name_application) {
	return new Promise(function(resolve, reject) {
		var url = studioConfig.url+'/api/environment/application/create';
		request.post({
			headers: {
				"Authorization": getAuthorization(),
				'content-type' : 'application/json'
			},
			url: url,
		    form: {subdomain: subdomain, application_name: name_application}
		}, function(error, response, body) {
			if (error)
				return reject({error: error, response: response});
			resolve({response: response, body: body});
		});
	});
}

exports.createCloudDns = function(subdomain) {
	return new Promise(function(resolve, reject) {
		var url = cloudConfig.url+'/api/environment/create';
		request.post({
			headers: {
				"Authorization": getAuthorization(),
				'content-type' : 'application/json'
			},
			url: url,
		    form: {subdomain: subdomain}
		}, function(error, response, body) {
			if (error)
				return reject({error: error, response: response});
			resolve({response: response, body: body});
		});
	});
}
