var fs = require('fs');
//Sequelize
var models = require('../models/');

function getNbInstruction(callback) {
    models.Project.findAndCountAll().then(function(projects) {
        models.Application.findAndCountAll().then(function(applications) {
            models.Module.findAndCountAll().then(function(modules) {
                models.DataEntity.findAndCountAll().then(function(dataEntities) {
                    models.Component.findAndCountAll().then(function(components) {
                        models.DataField.findAndCountAll().then(function(dataFields) {
                            var totalInstruction = projects.count + applications.count + modules.count + dataEntities.count + components.count + dataFields.count;
                            callback(totalInstruction);
                        });
                    });
                });
            });
        });
    });
}

function rmdirSyncRecursive(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file, index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) {
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

function sortEditorFolder(workspaceFolder){
    //console.log(workspaceFolder);

    var underArray = [];
    var fileArray = [];
    var answer = [];

    workspaceFolder.forEach(function(file, index){
        if(typeof file.under !== "undefined"){
            file.under = sortEditorFolder(file.under);
            underArray.push(file);
        }
        else{
            fileArray.push(file);
        }
    });

    underArray.sort(compare);
    fileArray.sort(compare);

    return underArray.concat(fileArray);
}

function readdirSyncRecursive(path, exclude) {
    var workspace = [];
    if(fs.existsSync(path)){
        if(path.substr(path.length - 1) == "/"){
            path = path.slice(0,-1);
        }
        fs.readdirSync(path).forEach(function(file, index){
            var curPath = path + "/" + file;
            var splitPath = curPath.split("/");
            if(exclude.indexOf(file) == -1){
                if(fs.lstatSync(curPath).isDirectory()) {
                    var obj = {
                        title: splitPath[splitPath.length-1],
                        under: readdirSyncRecursive(curPath, exclude)
                    }
                    workspace.push(obj);
                } else {
                    var obj = {
                        title: splitPath[splitPath.length-1],
                        path: curPath
                    }
                    workspace.push(obj);
                }
            }
        });

        return workspace;
    }
}

module.exports = {
    randomString: function(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    },
    randomNumber: function(low, high) {
        return Math.floor(Math.random() * (high - low) + low);
    },
    readFileSyncWithCatch: function(path) {
        try {
            return fs.readFileSync(path, 'utf8');
        } catch (err) {
            console.log(err);
            error = new Error();
			error.message = "Sorry, file not found";
        }
    },
    rmdirSyncRecursive: rmdirSyncRecursive,
    readdirSyncRecursive: readdirSyncRecursive,
    getNbInstruction: getNbInstruction,
    sortEditorFolder: sortEditorFolder
}