const fs = require('fs-extra');
const path = require('path');
const basename = path.basename(module.filename);
const block_access = require('../utils/block_access');

module.exports = app => {
	fs.readdirSync(__dirname).filter(file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js').forEach(file => {
		file = file.slice(0, -3);
		switch (file) {
			case 'routes':
				app.use('/', require('./' + file)); // eslint-disable-line
				break;
			case 'chat':
			case 'default':
			case 'import_export':
				app.use('/' + file, require('./' + file)); // eslint-disable-line
				break;
			case 'e_notification':
				app.use('/' + file.substring(2), block_access.isLoggedIn, require('./' + file)); // eslint-disable-line
				break;
			default:
				app.use('/' + file.substring(2), block_access.isLoggedIn, block_access.entityAccessMiddleware(file.substring(2)), require('./' + file)); // eslint-disable-line
				break;
		}
	});
}