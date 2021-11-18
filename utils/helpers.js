const fs = require('fs-extra');
const crypto = require("crypto");
const path = require('path');
const exec = require('child_process');

function rmdirSyncRecursive(path) {
	if (fs.existsSync(path)) {
		fs.readdirSync(path).forEach(file => {
			const curPath = path + "/" + file;
			if (fs.lstatSync(curPath).isDirectory()) {
				// recurse
				rmdirSyncRecursive(curPath);
			} else {
				// delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
}

function compare(a, b) {
	if (a.title < b.title)
		return -1;
	if (a.title > b.title)
		return 1;
	return 0;
}

function sortEditorFolder(workspaceFolder) {
	const underArray = [];
	const fileArray = [];

	if (!workspaceFolder)
		return [];

	workspaceFolder.forEach(file => {
		if (typeof file.under !== "undefined") {
			file.under = sortEditorFolder(file.under);
			underArray.push(file);
		} else {
			fileArray.push(file);
		}
	});

	underArray.sort(compare);
	fileArray.sort(compare);
	return underArray.concat(fileArray);
}

function readdirSyncRecursive(path, excludeFolder, excludeFile) {
	const workspace = [];
	if (fs.existsSync(path)) {
		if (path.substr(path.length - 1) == "/") {
			path = path.slice(0, -1);
		}
		let obj;
		fs.readdirSync(path).forEach(file => {
			const curPath = path + "/" + file;
			const splitPath = curPath.split("/");
			if (excludeFolder.indexOf(file) == -1) {
				if (fs.lstatSync(curPath).isDirectory()) {
					obj = {
						title: splitPath[splitPath.length - 1],
						under: readdirSyncRecursive(curPath, excludeFolder, excludeFile)
					}
					workspace.push(obj);
				} else if (excludeFile.indexOf(splitPath[splitPath.length - 1]) == -1) {
					obj = {
						title: splitPath[splitPath.length - 1],
						path: curPath
					}
					workspace.push(obj);
				}
			}
		});

		return workspace;
	}
}

// Returns a flat array of absolute paths of all files recursively contained in the dir
function buildZipFromDirectory(dir, zip, root, excludedFiles = []) {
	const list = fs.readdirSync(dir);

	for (let file of list) {
		file = path.resolve(dir, file)
		const stat = fs.statSync(file)
		if (stat && stat.isDirectory()) {
			this.buildZipFromDirectory(file, zip, root, excludedFiles)
		} else {
			if(excludedFiles.filter(x => file.includes(x)).length != 0)
				continue;
			const filedata = fs.readFileSync(file);
			zip.file(path.relative(root, file), filedata);
		}
	}
}

module.exports = {
	encrypt: function (text) {
		const cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq');
		let crypted = cipher.update(text, 'utf8', 'hex');
		crypted += cipher.final('hex');
		return crypted;
	},
	decrypt: function (text) {
		const decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq');
		let dec = decipher.update(text, 'hex', 'utf8');
		dec += decipher.final('utf8');
		return dec;
	},
	generate_key: function () {
		const sha = crypto.createHash('sha256');
		sha.update(Math.random().toString());
		return sha.digest('hex');
	},
	randomString: function (length) {
		let text = "";
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < length; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	},
	randomNumber: function (low, high) {
		return Math.floor(Math.random() * (high - low) + low);
	},
	readFileSyncWithCatch: function (path) {
		try {
			return fs.readFileSync(path, 'utf8');
		} catch (err) {
			console.error(err);
			throw new Error('Sorry, file not found');
		}
	},
	getDatalistStructure: function (options, attributes, mainEntity, idApplication) {
		const structureDatalist = [];

		/* Get first attributes from the main entity */
		for (const attr in attributes) {
			structureDatalist.push({
				field: attr,
				type: attributes[attr].newmipsType,
				entityCode: mainEntity,
				traductionKey: "entity." + mainEntity + "." + attr,
				associated: false
			});
		}

		/* Then get attributes from other entity associated to main entity */
		for (let j = 0; j < options.length; j++) {
			if (options[j].relation.toLowerCase() == "hasone" || options[j].relation.toLowerCase() == "belongsto") {
				const currentAttributes = require(__dirname + '/../workspace/' + idApplication + '/models/attributes/' + options[j].target); // eslint-disable-line
				for (const currentAttr in currentAttributes) {
					structureDatalist.push({
						field: currentAttr,
						type: currentAttributes[currentAttr].newmipsType,
						entity: options[j].as,
						entityCode: options[j].target,
						traductionKey: "entity." + options[j].target + "." + currentAttr,
						associated: true
					});
				}
			}
		}
		return structureDatalist;
	},
	getLastLoggedError: function(appName) {
		try {
			const logFilePath = __dirname + "/../workspace/logs/app_" + appName + ".log";

			if(!fs.existsSync(logFilePath))
				fs.writeFileSync(logFilePath, '', 'utf8');

			const logContent = fs.readFileSync(logFilePath, 'utf8');
			// First line of last error in app logs
			if (logContent.indexOf("Error:") == -1)
				return "No error detected.";
			return logContent.split("Error:")[logContent.split("Error:").length - 1].split("\n")[0];
		} catch (err) {
			console.error(err);
			return err;
		}
	},
	detectCyclicDependency: (source, target, workspacePath) => {

		function recursiveSearching(target, entityList = [source, target]) {

			const currentOption = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + target + '.json'));
			for (let i = 0; i < currentOption.length; i++) {
				if(currentOption[i].relation != 'hasMany')
					continue;

				entityList.push(currentOption[i].target + ' (' + currentOption[i].as + ')');

				if(currentOption[i].target == source)
					return entityList;

				return recursiveSearching(currentOption[i].target, entityList);
			}
		}

		const result = recursiveSearching(target);
		if(typeof result !== 'undefined' && result.length > 0) {
			console.error('Cyclic Dependency Found => ' + result.join(' -> '));
			return true;
		}
		return false;
	},
	exec: (cmd, args, cwd = undefined) => new Promise((resolve, reject) => {
		// Exec instruction
		const childProcess = exec.spawn(cmd, args, {
			shell: true,
			detached: true,
			cwd: cwd
		});
		childProcess.stdout.setEncoding('utf8');
		childProcess.stderr.setEncoding('utf8');

		// Child Success output
		childProcess.stdout.on('data', stdout => {
			console.log(stdout);
		});

		// Child Error output
		childProcess.stderr.on('data', stderr => {
			// Avoid reject if only warning
			if (stderr.toLowerCase().indexOf("warning") || stderr.toLowerCase().indexOf("warn")) {
				console.warn(stderr)
				return;
			}
			childProcess.kill();
			reject(stderr);
		});

		// Child error
		childProcess.on('error', error => {
			console.error(error);
			childProcess.kill();
			reject(error);
		});

		// Child close
		childProcess.on('close', _ => {
			resolve();
		});
	}),
	rmdirSyncRecursive: rmdirSyncRecursive,
	readdirSyncRecursive: readdirSyncRecursive,
	sortEditorFolder: sortEditorFolder,
	buildZipFromDirectory: buildZipFromDirectory
}