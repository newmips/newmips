const fs = require('fs');
const path = require('path');
const basename = path.basename(module.filename);
const block_access = require('../utils/block_access');
const appConf = require('../config/application.json');
const matomoTracker = require('../utils/matomo_api_tracker');

function isApiEnabled(req, res, next) {
	if (appConf.api_enabled)
		return next();
	res.status(501).json({error: 'API not enabled'});
}

module.exports = function(app) {
	fs.readdirSync(__dirname).filter(function(file){
		return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
	}).forEach(function(file){
		file = file.slice(0, -3);
		/* eslint-disable */
		if (file == 'default')
			app.use('/api/', isApiEnabled, require('./'+file));
		else if (file == 'synchronization')
			app.use('/api/synchronization', isApiEnabled, block_access.apiAuthentication, require('./'+file));
		else
			app.use('/api/'+file.substring(2), isApiEnabled, block_access.apiAuthentication, matomoTracker, require('./'+file));
		/* eslint-enable */
	});
}