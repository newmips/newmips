var fs = require('fs');
var path = require('path');
var basename = path.basename(module.filename);
var basicbot = require('../../../utils/basicbot');

module.exports = function(app) {
	fs.readdirSync(__dirname).filter(function(file){
		return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
	}).forEach(function(file){
		file = file.slice(0, -3);
		if (file === 'routes')
			app.use('/', require('./'+file));
		else
			app.use('/'+basicbot.removePrefix(file, "entity"), require('./'+file));
	});
}