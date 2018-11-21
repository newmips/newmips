var fs = require('fs');
var path = require('path');
var basename = path.basename(module.filename);
var attrHelper = require('../utils/attr_helper');
var block_access = require('../utils/block_access');

module.exports = function(app) {
	fs.readdirSync(__dirname).filter(function(file){
		return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
	}).forEach(function(file){
		file = file.slice(0, -3);
		if (file === 'routes')
			app.use('/', require('./'+file));
		else if (file === 'default' || file === "db_tool")
			app.use('/'+file, require('./'+file));
		else if (file === 'chat')
			app.use('/'+attrHelper.removePrefix(file, "entityOrComponent"), block_access.isLoggedIn, require('./'+file));
		else
			app.use('/'+attrHelper.removePrefix(file, "entityOrComponent"), block_access.isLoggedIn, block_access.entityAccessMiddleware(attrHelper.removePrefix(file, "entityOrComponent")), require('./'+file));
	});
}