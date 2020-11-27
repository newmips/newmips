const matomoConf = require('../config/matomo_api');
const MatomoTracker = require('matomo-tracker');
const responseTime = require('response-time');

const BULK_LIMIT = matomoConf.bulk_limit || 1000,
	BULK_TIMEOUT = matomoConf.bulk_timeout || 10000,
	TOKEN = matomoConf.token_auth,
	HOST = matomoConf.host,
	SITE_ID = matomoConf.site_id,
	HOST_MATOMO = matomoConf.host_matomo;

let matomo, initSucess = true;
try {
	if (matomoConf.enabled)
		matomo = new MatomoTracker(SITE_ID, `${HOST_MATOMO}?${TOKEN}`, true);
} catch(err) {
	initSucess = false;
	console.error("Unable to initialize MatomoTracker :");
	console.error(err);
	matomo.on('error', err => {
		console.error("Matomo error : ", err);
	});
}

const isId = /^[0-9]+$/;
let events = [], bulkTimeout;

function handleBulk() {
	const eventsLength = events.length;
	// No events, reset timeout
	if (eventsLength == 0)
		return bulkTimeout = setTimeout(handleBulk, BULK_TIMEOUT);

	// Bulk track events
	matomo.trackBulk(events, result => {
		try {
			result = JSON.parse(result);
			if (result.status != 'success' || result.invalid != 0) {
				console.error("Matomo ERROR tracking failed :")
				console.error(result);
			}
		} catch(e) {
			if (result.includes('<title>Sign in - Matomo</title>'))
				console.error("Matomo ERROR token_auth seems to be invalid");
			else {
				console.error("Couldn't parse matomo result :");
				console.error(e);
				console.error(`Result was :\n${result}`);
			}
		}
		// Clear events and reset timeout
		events = [];
		bulkTimeout = setTimeout(handleBulk, BULK_TIMEOUT);
	})
}
bulkTimeout = setTimeout(handleBulk, BULK_TIMEOUT);

function track(opts) {
	events.push(opts);
	if (events.length >= BULK_LIMIT) {
		clearTimeout(bulkTimeout);
		handleBulk();
	}
}

// Determine request action label based on REST policies
function redifineRESTAction(method, parameter, rest) {
	// If no parameter, request is either GET or POST of entity
	if (parameter === undefined)
		switch (method) { /* eslint-disable-line */
			case 'GET':
				return 'FIND ALL';
			case 'POST':
				return 'CREATE';
		}

	if (isId.test(parameter)) {
		// If there is params left after `/:id/`, request is fetching subentity
		if (rest && rest.length && !isId.test(rest[0]))
			return 'GET '+rest.join(' ');

		switch (method) { /* eslint-disable-line */
			case 'GET':
				return 'FIND ONE';
			case 'PUT':
				return 'UPDATE';
			case 'DELETE':
				return 'DELETE';
		}
	}

	// Not REST complient, no custom action label required
	return parameter;
}

// Format action name to provide matomo with meaningful categories
// Ex:
//   - tracked url : `GET /api/user/:id/` -> actionName categories : 'API / USER / FIND ONE'
//   - tracked url : `DELETE /api/user/:id/` -> actionName categories : 'API / USER / DELETE'
//   - tracked url : `GET /api/user/customUrl` -> actionName categories : 'API / USER / CUSTOMURL'
function buildActionName(req) {
	// Decompose url path
	const [api, entity, parameter, ...rest] = req._parsedOriginalUrl.pathname.split('/').filter(x => x != '');

	// Replace potential `/:id` parameter by the action it represents
	const customAction = redifineRESTAction(req.method, parameter, rest);

	// Filter out empty actions and format string for matomo actionName param
	return [api, entity, customAction, ...rest].filter(x => x && x != '').map(x => x.toUpperCase()).join(' / ');
}

module.exports = matomoConf.enabled && initSucess
	// Export responseTime middleWare with matomo tracking as callback
	// Callback takes `time` instead of the usual `next()` param, since it's the end of the middleWare stack and response is sent
	? responseTime((req, res, time) => {
		try {
			const trackObject = {
				url: HOST+req.originalUrl,
				action_name: buildActionName(req),
				gt_ms: Math.floor(time || 0)
			};

			if (req.user)
				trackObject._id = req.user.id;

			track(trackObject);
		} catch(err) {
			console.error("Matomo API tracking error :");
			console.error(err);
		}
	})
	// Tracking disabled. Don't use responseTime and call next middleWare
	: (req, res, next) => {next()}