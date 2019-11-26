const fs = require('fs-extra')
const models = require('../models/');

function arraySplit(str) {
	console.log('arraySplit')
	return new Promise((resolve, reject) => {
		if (str.indexOf(';') === -1) {
			return reject('each SQL statement must terminate with a semicolon (;)')
		}
		str = str.trim();
		str = str.replace(/--*(\n|\r)/g, ' ');
		str = str.replace(/(?:\r\n|\r|\n)/g, ' ');
		str = str.replace(/\s\s+/g, ' ').trim();
		str = str.substring(0, str.length - 1);

		const arr = str.split(';').map(v => v.replace(/--.*-+/g, ' ').replace(/CREATE TABLE\s/g, 'CREATE TABLE IF NOT EXISTS ').trim())

		for (let i = 0; i < arr.length; i++)
			if (arr[i] == "") {
				arr.splice(i, 1);
				i--;
			}
		resolve(arr)
	})
}

function runQueries(arr) {
	Promise.all(arr.map(item => models.sequelize.query(item, (err, rows) => {
		if (err)
			throw err;
		return 'ROWS: ' + rows
	}))).then(_ => {
		console.log('DONE!')
	}).catch(err => {
		console.error(err);
	})
}

exports.importSQL = filename => new Promise((resolve, reject) => {
	console.log(`importSQL start: ${filename}`);
	fs.readFile(filename, 'utf8').then(arraySplit).then(runQueries).then(_ => {
		console.log(`importSQL done: ${filename}`)
		resolve('all tables created')
	}).catch(err => {
		console.log(`error with: ${filename}`)
		console.log(err)
		reject(`error: ${err}`)
	})
})