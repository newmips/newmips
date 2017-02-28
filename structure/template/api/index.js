var fs = require('fs');
var path = require('path');
var basename = path.basename(module.filename);
var block_access = require('../utils/block_access');

module.exports = function(app) {
	fs.readdirSync(__dirname).filter(function(file){
		return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
	}).forEach(function(file){
		file = file.slice(0, -3);
		app.use('/'+file, block_access.apiAuthentication, require('./'+file));
	});
}