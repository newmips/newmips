var request = require('request');

// API credentials
var clientKey =  'zIlcFSmzVRM7wS1';
var clientSecret = 'EhJqBcTr9ULGAK7';
var defaultOptions = {
	rejectUnauthorized: false,
	json: true,
	headers: {'content-type': 'application/json'}
}
var BEARER_TOKEN = 'fakeInitToken';
var MAX_TOKEN_TRY = 20

function getToken() {
	return new Promise(function(resolve, reject) {
		request({
			url: 'http://127.0.0.1:9140' + '/api/getToken',
			headers: {
				Authorization: 'Basic ' + new Buffer(clientKey + ':' + clientSecret).toString('base64')
			}
		}, function(error, response, body) {
			if (error)
				return reject(error);
			try {
				BEARER_TOKEN = JSON.parse(body).token;
			} catch(e) {
				return reject(e)
			}
			resolve();
		});
	});
}

function call(callOptions, loopCount) {
	return new Promise(function(resolve, reject) {
		if (loopCount >= MAX_TOKEN_TRY)
			return reject("Couldn't get Bearer Token");

		// Add bearer token to url
		callOptions.url = callOptions.originUrl.indexOf('?') != -1 ?
						'http://127.0.0.1:9140' + callOptions.originUrl + '&token='+BEARER_TOKEN :
						'http://127.0.0.1:9140' + callOptions.originUrl + '?token='+BEARER_TOKEN;

		if (!request[callOptions.method])
			return reject("Bad method "+callOptions.method+' for API request');

		request[callOptions.method.toLowerCase()](callOptions, function(error, response, body) {
			if (error)
				return reject(error);

			// Bad or expired Token, refresh token and call again
			if (response.statusCode == '403' || response.statusCode == '401') {
				getToken().then(function() {
					call(callOptions, ++loopCount).then(resolve).catch(reject);
				}).catch(reject);
			}
			else
				resolve({error: error, response: response, body: body});
		});
	});
}

var api = {
	call: function (callOptions) {
		return new Promise(function(resolve, reject) {
			// Merge default and provided options
			for (var defaultOpt in defaultOptions)
				if (!callOptions[defaultOpt])
					callOptions[defaultOpt] = defaultOptions[defaultOpt];

			if (!callOptions.method)
				callOptions.method = 'get';
			if (!callOptions.url)
				return reject("No URL for API call");

			callOptions.originUrl = callOptions.url;

			call(callOptions, 0)
			.then(resolve)
			.catch(function(error) {
				console.error(error);
				reject(error);
			});
		});
	},

	token: function() {
		return BEARER_TOKEN;
	}
}

api.call({
	url: '/api/secretdesaffaires?f_aberation=aaa&f_aberation=ccc&include=r_lol'
}).then(function(response) {
	console.log(response.body);
}).catch(function(err) {
	console.error(err);
});