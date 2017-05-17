var exec = require('child_process').exec;
var fs = require('fs');

var cmd = 'npm install';

exec(cmd, {cwd: 'structure/template/'}, function(error, stdout, stderr) {
	cmd = 'mv structure/template/node_modules workspace/';
	if (!fs.existsSync('workspace'))
		fs.mkdirSync('workspace');
	exec(cmd, function(error, stdout, stderr) {
		if(error)
			console.log(error);
		else
			console.log('node_modules successfuly initialized');
	});
});