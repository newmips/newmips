const fs = require('fs-extra');
const crypto = require("crypto");
const models = require('../models/');
const admzip = require('adm-zip');
const moment = require('moment');
const exec = require('child_process').exec;
const path = require('path');

function rmdirSyncRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
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
    //console.log(workspaceFolder);

    var underArray = [];
    var fileArray = [];
    var answer = [];

    if (!workspaceFolder)
        return [];
    workspaceFolder.forEach(function (file, index) {
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
    var workspace = [];
    if (fs.existsSync(path)) {
        if (path.substr(path.length - 1) == "/") {
            path = path.slice(0, -1);
        }
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            var splitPath = curPath.split("/");
            if (excludeFolder.indexOf(file) == -1) {
                if (fs.lstatSync(curPath).isDirectory()) {
                    var obj = {
                        title: splitPath[splitPath.length - 1],
                        under: readdirSyncRecursive(curPath, excludeFolder, excludeFile)
                    }
                    workspace.push(obj);
                } else {
                    if (excludeFile.indexOf(splitPath[splitPath.length - 1]) == -1) {
                        var obj = {
                            title: splitPath[splitPath.length - 1],
                            path: curPath
                        }
                        workspace.push(obj);
                    }
                }
            }
        });

        return workspace;
    }
}

function unzipSync(url, folder, entry) {
    var tmpFilename = moment().format('YY-MM-DD-HH_mm_ss')+"_template_archive.zip";
    var tmpPath = __dirname+'/../upload/'+tmpFilename;
    var file = fs.createWriteStream(tmpPath);

    var cmd = 'wget -O ' + tmpPath + ' ' + url;
    exec(cmd, function (error, stdout, stderr) {

        if (error !== null) {
            console.log('exec error: ' + error);
        }
        var zip = new admzip(tmpPath);
        zip.extractAllTo(folder);
        // zip.extractEntryTo(entry, folder, /*maintainEntryPath*/false, /*overwrite*/true);

        var cmd1 = 'cp -r ' + folder + entry + '-master/* ' + folder;
        exec(cmd1, function (err, stdo, stde) {
            if (err !== null) {
                console.log('exec error: ' + err);
            }

            var cmd2 = 'rm -r ' + folder + entry + '-master';
            exec(cmd2, function (err2, stdo2, stde2) {
                if (err2 !== null) {
                    console.log('exec error: ' + err2);
                }
                return true;
            });
        });

    });
}

// Returns a flat array of absolute paths of all files recursively contained in the dir
// Using JSZIP module
function buildZipFromDirectory(dir, zip, root) {
    const list = fs.readdirSync(dir);

    for (let file of list) {
        file = path.resolve(dir, file)
        let stat = fs.statSync(file)
        if (stat && stat.isDirectory()) {
            this.buildZipFromDirectory(file, zip, root)
        } else {
            const filedata = fs.readFileSync(file);
            zip.file(path.relative(root, file), filedata);
        }
    }
}

module.exports = {
    queuedPromises: function queuedAll(headPromises) {
        return new Promise(function(headResolve, headReject) {
            var returnedValues = [];
            function execPromise(promises, idx) {
                if (!promises[idx])
                    return headResolve(returnedValues);
                promises[idx].then(function(returnedValue) {
                    returnedValues.push({done: true, value: returnedValue});
                    execPromise(promises, idx+1);
                }).catch(function(err) {
                    returnedValues.push({done: false, value: err});
                    execPromise(promises, idx+1);
                });
            }
            execPromise(headPromises, 0);
        })
    },
    encrypt: function (text) {
        var cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq');
        var crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    }
    ,
    decrypt: function (text) {
        var decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq');
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    },
    generate_key: function () {
        var sha = crypto.createHash('sha256');
        sha.update(Math.random().toString());
        return sha.digest('hex');
    },
    randomString: function (length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++) {
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
            error = new Error();
            error.message = "Sorry, file not found";
        }
    },
    getDatalistStructure: function (options, attributes, mainEntity, idApplication) {
        var structureDatalist = [];

        /* Get first attributes from the main entity */
        for (var attr in attributes) {
            structureDatalist.push({
                field: attr,
                type: attributes[attr].newmipsType,
                entityCode: mainEntity,
                traductionKey: "entity." + mainEntity + "." + attr,
                associated: false
            });
        }

        /* Then get attributes from other entity associated to main entity */
        for (var j = 0; j < options.length; j++) {
            if (options[j].relation.toLowerCase() == "hasone" || options[j].relation.toLowerCase() == "belongsto") {
                var currentAttributes = require(__dirname + '/../workspace/' + idApplication + '/models/attributes/' + options[j].target);
                for (var currentAttr in currentAttributes) {
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
            let logContent = fs.readFileSync(__dirname + "/../workspace/logs/app_" + appName + ".log", "utf8");
            // First line of last error in app logs
            if (logContent.indexOf("Error:") == -1)
                return "No error detected.";
            else
                return logContent.split("Error:")[logContent.split("Error:").length - 1].split("\n")[0];
        } catch (err) {
            console.error(err);
            return err;
        }
    },
    rmdirSyncRecursive: rmdirSyncRecursive,
    readdirSyncRecursive: readdirSyncRecursive,
    sortEditorFolder: sortEditorFolder,
    unzipSync: unzipSync,
    buildZipFromDirectory: buildZipFromDirectory
}