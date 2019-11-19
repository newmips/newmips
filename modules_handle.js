const exec = require('child_process').exec;
const fs = require('fs');
const helpers = require('./utils/helpers');

let cmd = 'npm install';

if (!fs.existsSync('workspace'))
	fs.mkdirSync('workspace');
if (fs.existsSync('workspace/node_modules')) {
	helpers.rmdirSyncRecursive('workspace/node_modules');
	fs.chmodSync('workspace', '0755');
}
exec(cmd, {cwd: 'structure/template/'}, function(err) {
	if(err)
		console.error(err)
	cmd = 'cp -r structure/template/node_modules workspace/ || xcopy /e structure\\template\\node_modules workspace\\node_modules\\';
	exec(cmd, {cwd: process.cwd(), maxBuffer: 1024 * 1000}, function(err) {
		if(err)
			return console.error(err);
		exec('rm -r structure/template/node_modules', function() {
			console.log('node_modules successfuly initialized');
		});
	});
});