const fs = require('fs');
const path = require('path');
const basename = path.basename(module.filename);

module.exports = app => {
	fs.readdirSync(__dirname).filter(file => file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js').forEach(function(file){
		file = file.slice(0, -3);
		if (file === 'routes')
			app.use('/', require('./'+file)); // eslint-disable-line
		else
			app.use('/'+file, require('./'+file)); // eslint-disable-line
	});
}