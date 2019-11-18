const fs = require('fs-extra');
const globalConf = require('../config/global');


exports.deleteFile = function (options) {
	return new Promise((resolve, reject) => {
		if (typeof options === 'undefined')
			return reject(new Error('Delete options must be set'));

		switch (options.type) {
			case 'local':
			case 'file':
			case 'picture':
				resolve(deleteLocalFile(options));
				break;
			case 'cloudfile':
				resolve(deleteCloudFile(options));
				break;
			default:
				return reject(new Error('File type not found'));
		}
	});
};


exports.getFileBuffer = function (path, options) {
	return new Promise((resolve, reject) => {
		const completeFilePath = globalConf.localstorage + path;
		if (typeof path == 'undefined' || !fs.existsSync(globalConf.localstorage + path))
			return reject(new Error({code: 404, message: 'File not found'}));
		const encoding = typeof options !== 'undefined' && options.encoding ? options.encoding : 'base64';
		resolve(Buffer.from(fs.readFileSync(completeFilePath)).toString(encoding));
	});
};

const deleteLocalFile = function (options) {
	return new Promise((resolve, reject) => {
		if (typeof options === 'undefined')
			return reject(new Error('Delete options must be set'));
		if (!options.value || !options.entityName)
			return reject(new Error('Field value and entityName are required'));

		const partOfValue = options.value.split('-');

		if (partOfValue.length) {
			const filePath = globalConf.localstorage + options.entityName + '/' + partOfValue[0] + '/' + options.value;
			fs.unlink(filePath, function (err) {
				if (err)
					return reject(err);
				if (options.type === 'picture') {
					//remove picture thumbnail 
					const fileThumnailPath = globalConf.localstorage + globalConf.thumbnail.folder + options.entityName + '/' + partOfValue[0] + '/' + options.value;
					fs.unlink(fileThumnailPath, function (err) {
						if (err)
							console.error(err);
					});
				}
				resolve();
			});
		} else
			reject(new Error('File syntaxe not valid'));
	});
};

var deleteCloudFile = function (options) {
	return new Promise((resolve, reject) => {
		resolve();
	});
};

