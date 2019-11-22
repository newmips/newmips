const fs = require('fs-extra');
const globalConf = require('../config/global');

const deleteLocalFile = (options) => {
	if (typeof options === 'undefined')
		throw new Error('Delete options must be set');

	if (!options.value || !options.entityName)
		throw new Error('Field value and entityName are required');

	const partOfValue = options.value.split('-');
	if (!partOfValue.length)
		throw new Error('File syntaxe not valid')

	const filePath = globalConf.localstorage + options.entityName + '/' + partOfValue[0] + '/' + options.value;
	fs.unlinkSync(filePath);

	// Remove picture thumbnail
	if (options.type === 'picture') {
		const fileThumnailPath = globalConf.localstorage + globalConf.thumbnail.folder + options.entityName + '/' + partOfValue[0] + '/' + options.value;
		fs.unlinkSync(fileThumnailPath)
	}
};

// TODO - No need of async function here
exports.deleteFile = async (options) => { // eslint-disable-line

	if (typeof options === 'undefined')
		throw new Error('Delete options must be set');

	switch (options.type) {
		case 'local':
		case 'file':
		case 'picture':
			return deleteLocalFile(options);
		default:
			throw new Error('File type not found');
	}
};

// TODO - No need of async function here
exports.getFileBuffer = async (path, options) => { // eslint-disable-line
	const completeFilePath = globalConf.localstorage + path;
	if (typeof path == 'undefined' || !fs.existsSync(globalConf.localstorage + path))
		throw new Error({
			code: 404,
			message: 'File not found'
		});

	const encoding = typeof options !== 'undefined' && options.encoding ? options.encoding : 'base64';
	return Buffer.from(fs.readFileSync(completeFilePath)).toString(encoding);
};