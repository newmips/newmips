var fs = require('fs');
var path = require('path');
var basename = path.basename(module.filename);
var attrHelper = require('../utils/attr_helper');

module.exports = function(app) {
	fs.readdirSync(__dirname).filter(function(file){
		return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
	}).forEach(function(file){
		file = file.slice(0, -3);
		if (file === 'routes')
			app.use('/', require('./'+file));
		else
			app.use('/'+attrHelper.removePrefix(file, "entityOrComponent"), require('./'+file));
	});
}