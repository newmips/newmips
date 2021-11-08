const globalConf = require('../config/global.js');
const cp = require('child_process');
const spawn = require('cross-spawn');
const fs = require("fs-extra");
const path = require('path');
const fetch = require('node-fetch');
const AnsiToHTML = require('ansi-to-html');
const ansiToHtml = new AnsiToHTML();
const moment = require('moment');
const childsUrlsStorage = {};

function setDefaultChildUrl(sessionID, appName){
	if(typeof childsUrlsStorage[sessionID] === "undefined")
		childsUrlsStorage[sessionID] = {};
	if(typeof childsUrlsStorage[sessionID][appName] === "undefined")
		childsUrlsStorage[sessionID][appName] = "";
}

function setChildUrl(sessionID, appName, url){
	setDefaultChildUrl(sessionID, appName);
	childsUrlsStorage[sessionID][appName] = url;
}
exports.setChildUrl = setChildUrl;

exports.process_server_per_app = [];

exports.launchChildProcess = function(sessionID, appName, port) {

	setDefaultChildUrl(sessionID, appName);

	const env = Object.create(process.env);
	env.PORT = port;

	const process_server = spawn('node', [__dirname + "/../workspace/" + appName + "/server.js", 'autologin'], {
		env: env
	});

	/* Generate app logs in /workspace/logs folder */
	fs.mkdirsSync(__dirname + "/../workspace/logs/");
	const allLogStream = fs.createWriteStream(path.join(__dirname + "/../workspace/logs/", 'app_' + appName + '.log'), {
		flags: 'a'
	});

	process_server.stdout.on('data', function(data) {
		data = data.toString();
		// Check for child process log specifying current url. child_url will then be used to redirect
		// child process after restart
		if (data.indexOf("IFRAME_URL") != -1) {
			if (data.indexOf("/status") == -1){
				childsUrlsStorage[sessionID][appName] = data.split('::')[1];
			}
		} else {
			const cleaned = data.replace(/(.*)\n*$/, '$1');
			if (!cleaned.length)
				return;
			allLogStream.write('<span style="color:#00ffff;">' + moment().format("YYYY-MM-DD HH:mm:ss-SSS") + ':</span>  ' + ansiToHtml.toHtml(cleaned) + '\n');
			console.log('\x1b[36m%s\x1b[0m', appName + ' ' + moment().format("YYYY-MM-DD HH:mm:ss-SSS") + ': ' + cleaned);
		}
	});

	process_server.stderr.on('data', function(data) {
		data = data.toString();
		allLogStream.write('<span style="color: red;">'+moment().format("YYYY-MM-DD HH:mm:ss-SSS")+':</span>  ' + ansiToHtml.toHtml(data) + '\n');
		console.log('\x1b[31m%s\x1b[0m', 'Err '+appName+' '+moment().format("YYYY-MM-DD HH:mm:ss-SSS")+': ' + data.replace(/(.*)\n*$/, '$1'));
	});

	process_server.on('close', _ => {
		if (allLogStream)
			allLogStream.end();
		console.log('\x1b[31m%s\x1b[0m', 'Child process exited');
	});

	return process_server;
}

async function checkServer(iframe_url, initialTimestamp, timeoutServer) {

	// Server Timeout
	if (new Date().getTime() - initialTimestamp > timeoutServer) {
		console.error('Timeout server on url => ' + iframe_url);
		throw new Error('preview.server_timeout');
	}

	let response;
	try {
		response = await fetch(iframe_url, {
			method: "GET"
		});
	} catch(err) {
		return await checkServer(iframe_url, initialTimestamp, timeoutServer);
	}

	// Handling standard server error (404, 501, 502)
	if(typeof response === 'undefined' || [404, 501, 502].includes(response.status))
		return await checkServer(iframe_url, initialTimestamp, timeoutServer);

	// Unusual error, log it
	if (response.status != 200) {
		console.warn('Server not ready - Invalid Status Code Returned:', response.status);
		return await checkServer(iframe_url, initialTimestamp, timeoutServer);
	}

	// Everything's ok
	console.log("Server status is OK");
	return true;
}
exports.checkServer = checkServer;

exports.childUrl = (req, appID) => {

	setDefaultChildUrl(req.sessionID, req.session.app_name);

	let url = globalConf.protocol + '://' + globalConf.host + ':' + (9000 + parseInt(appID)) + childsUrlsStorage[req.sessionID][req.session.app_name];
	if (globalConf.env == 'studio')
		url = 'https://' + globalConf.sub_domain + '-' + req.session.app_name.substring(2) + "." + globalConf.dns + childsUrlsStorage[req.sessionID][req.session.app_name];

	return url;
}

exports.killChildProcess = (process) => new Promise(resolve => {
	console.log("Kill child process: " + process.pid);
	// OS handling
	const isWin = /^win/.test(process.platform);
	if (isWin) {
		cp.exec('taskkill /PID ' + process.pid + ' /T /F', err => {
			if(err){
				console.error("Cannot kill process with pid " + process.pid);
				console.error(err);
			}
			resolve();
		});
	} else {
		try {
			process.kill(); // SIGTERM the process
		} catch(err) {
			console.error("Cannot kill process with pid " + process.pid);
			console.error(err);
		}
		resolve();
	}
})

module.exports = exports;