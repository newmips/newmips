var fs = require('fs');
var crypto = require("crypto");
var models = require('../models/');

function getNbInstruction(callback) {
    var query = "SELECT (SELECT COUNT(*) FROM project) AS projects, "+
    "(SELECT COUNT(*) FROM application) AS applications, "+
    "(SELECT COUNT(*) FROM module) AS modules, "+
    "(SELECT COUNT(*) FROM data_entity) AS entities, "+
    "(SELECT COUNT(*) FROM data_field) AS field, "+
    "(SELECT COUNT(*) FROM component) AS components "+
    "FROM project, application, module, data_entity, data_field "+
    "GROUP BY projects;";

    models.sequelize.query(query, {type: models.sequelize.QueryTypes.SELECT}).then(function(result){
        if(result.length == 0)
            return callback(0);
        callback(result[0].projects + result[0].applications + result[0].modules + result[0].entities + result[0].field + result[0].components)
    });
}

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
    rmdirSyncRecursive: rmdirSyncRecursive,
    readdirSyncRecursive: readdirSyncRecursive,
    getNbInstruction: getNbInstruction,
    sortEditorFolder: sortEditorFolder
}