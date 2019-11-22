console.log('Executing 2.9 js patch...');
const fs = require('fs-extra');

fs.readdirSync(__dirname + '/../../workspace/').forEach(yolo => {
	console.log(yolo);
});