const fs = require("fs-extra");
const jsdom = require("jsdom/lib/old-api.js");
const html = require('html');
const jquery = fs.readFileSync(__dirname + "/../public/js/jQuery/jquery.min.js", "utf-8");
const helpers = require("./helpers");
const beautify = require('js-beautify').html;

function read(fileName) {
	return new Promise(function(resolve, reject) {
		let fileData = helpers.readFileSyncWithCatch(fileName);

		if(typeof fileData !== "undefined"){
			// Comment `dust` elements. We need to comment them to allow jsdom to parse the file correctly
			fileData = fileData.replace(/({[<@^:#\/].+?})/g, '<!--$1-->');
			// Replace {@__ key=""} in placeholder by {@__ key=||} to avoid jsDom to fail parsing
			fileData = fileData.replace(/placeholder='(.+?)(")(.+?)(")(.+?)'/g, "placeholder='$1|$3|$5'");

			jsdom.env({
				html: fileData,
				src: [jquery],
				done: function (err, window) {
					if(err)
						return reject(err);
					resolve(window.$);
				}
			});

		} else {
			const err = new Error();
			err.message = "Unable to read the file: " + fileName.split("/workspace/").pop();
			reject(err);
		}
	});
}
exports.read = read;

exports.loadFromHtml = function(html) {
	return new Promise(function(resolve, reject) {
		jsdom.env({
			html: html,
			src: [jquery],
			done: function(err, window) {
				if (err)
					return reject(err);
				resolve(window.$);
			}
		})
	});
}

exports.replace = function(filename, element, $insert) {
	return new Promise(function(resolve, reject) {
		read(filename).then(function($) {
			$(element).replaceWith($insert(element));

			write(filename, $).then(function(){
				resolve();
			}).catch(function(err) {
				reject(err);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}

exports.insertHtml = function(filename, element, html) {
	return new Promise(function(resolve, reject) {
		read(filename).then(function($) {
			$(element).html(html);

			write(filename, $).then(function(){
				resolve();
			}).catch(function(err) {
				reject(err);
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}

function write(fileName, $) {
	return new Promise(function(resolve, reject) {
		let newFileData = $("body")[0].innerHTML;

		// Fix a bug caused by JSDOM that append &nbsp; at the beginning of the document
		if (newFileData.substring(0, 6) == "&nbsp;")
			newFileData = newFileData.substring(6);

		// Replace escaped characters and script inclusion
		newFileData = newFileData.replace(/&gt;/g, '>');
		newFileData = newFileData.replace(/&quot;/g, "\"");
		newFileData = newFileData.replace('<script class="jsdom" src="http://code.jquery.com/jquery.js"></script>', '');

		// Fix beautify
		newFileData = newFileData.replace(/{#__/g, '{__');
		// Indent generated html
		newFileData = beautify(newFileData, {
			indent_size: 4,
			indent_char: " ",
			indent_with_tabs: false
		});
		newFileData = newFileData.replace(/{__/g, '{#__');

		// Uncomment dust tags
		newFileData = newFileData.replace(/<!--({[<>@^?:#\/].+?})-->/g, '$1');

		// Replace placeholder double quote by simple quote to be able to put double quote for {@__ key=""}
		// Ex: placeholder="{@__ key=||}" -> placeholder='{@__ key=||}'
		newFileData = newFileData.replace(/placeholder=(")(.+?)(")/g, "placeholder='$2'");
		// Replace pipes added when we read the file by double quotes
		// Ex: placeholder='{@__ key=||}' -> placeholder='{@__ key=""}'
		newFileData = newFileData.replace(/placeholder=(.+?)(\|)(.+?)(\|)/g, 'placeholder=$1"$3"');

		// Write back to file
		fs.writeFileSync(fileName, newFileData, 'utf8');
		resolve();
	});
}
exports.write = write;

exports.writeMainLayout = function(fileName, $) {
	return new Promise(function(resolve, reject) {

		let newFileData = "<!DOCTYPE html>";
		newFileData += $("html")[0].outerHTML;

		// Replace escaped characters and script inclusion
		newFileData = newFileData.replace(/&gt;/g, '>');
		newFileData = newFileData.replace(/&lt;/g, '<');
		newFileData = newFileData.replace(/&quot;/g, "\"");
		newFileData = newFileData.replace('<script class="jsdom" src="http://code.jquery.com/jquery.js"></script>', '');

		// Fix beautify
		newFileData = newFileData.replace(/{#__/g, '{__');
		// Indent generated html
		newFileData = beautify(newFileData, {
			indent_size: 4,
			indent_char: " ",
			indent_with_tabs: false
		});
		newFileData = newFileData.replace(/{__/g, '{#__');

		// Uncomment dust tags
		newFileData = newFileData.replace(/<!--({[<>@^:#\/].+?})-->/g, '$1');

		// Replace placeholder double quote by simple quote to be able to put double quote for {@__ key=""}
		// Ex: placeholder="{@__ key=||}" -> placeholder='{@__ key=||}'
		newFileData = newFileData.replace(/placeholder=(")(.+?)(")/g, "placeholder='$2'");
		// Replace pipes added when we read the file by double quotes
		// Ex: placeholder='{@__ key=||}' -> placeholder='{@__ key=""}'
		newFileData = newFileData.replace(/placeholder=(.+?)(\|)(.+?)(\|)/g, 'placeholder=$1"$3"');

		// Write back to file
		const writeStream = fs.createWriteStream(fileName);
		writeStream.write(newFileData);
		writeStream.end();
		writeStream.on('finish', function() {
			resolve();
		});
	});
}