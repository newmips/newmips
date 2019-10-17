var fs = require('fs');
var path = require('path');
var basename = path.basename(module.filename);
var block_access = require('../utils/block_access');

module.exports = function(app) {
	fs.readdirSync(__dirname).filter(function(file){
		return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
	}).forEach(function(file){
		file = file.slice(0, -3);
		switch (file) {
			case 'routes':
				app.use('/', require('./'+file));
				break;

			case 'default':
			case 'db_tool':
				app.use('/'+file, require('./'+file));
				break;

			case 'chat':
			case 'e_notification':
				app.use('/'+file.substring(2), block_access.isLoggedIn, require('./'+file));
				break;

			default:
				app.use('/'+file.substring(2), block_access.isLoggedIn, block_access.entityAccessMiddleware(file.substring(2)), require('./'+file));
				break;
		}
	});
}