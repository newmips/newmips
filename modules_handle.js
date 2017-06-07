var exec = require('child_process').exec;
var fs = require('fs');
var helpers = require('./utils/helpers');

var cmd = 'npm install';

if (!fs.existsSync('workspace'))
	fs.mkdirSync('workspace');
if (fs.existsSync('workspace/node_modules')) {
	helpers.rmdirSyncRecursive('workspace/node_modules');
	fs.chmodSync('workspace', '0755');
}
exec(cmd, {cwd: 'structure/template/'}, function(error, stdout, stderr) {
	cmd = 'cp -r structure/template/node_modules workspace/';
	exec(cmd, {cwd: process.cwd()}, function(error, stdout, stderr) {
		if(error)
			return console.log(error);
		exec('rm -r structure/template/node_modules', function() {
			console.log('node_modules successfuly initialized');
		});
	});
});