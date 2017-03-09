var fs = require('fs');
var path = require('path');
var basename = path.basename(module.filename);
var block_access = require('../utils/block_access');

function isApiEnabled(req, res, next) {
	var appConf = require('../config/application.json');
	if (appConf.api_enabled)
		return next();
	res.status(404).json({error: 'API not enabled'});
}

module.exports = function(app) {
	fs.readdirSync(__dirname).filter(function(file){
		return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
	}).forEach(function(file){
		file = file.slice(0, -3);
		if (file == 'default')
			app.use('/api/', isApiEnabled, require('./'+file));
		else
			app.use('/api/'+file.substring(2), isApiEnabled, block_access.apiAuthentication, require('./'+file));
	});
}