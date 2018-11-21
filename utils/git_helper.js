var fs = require("fs");
var globalConf = require('../config/global.js');
var gitlabConf = require('../config/gitlab.js');

//Sequelize
var models = require('../models/');

var gitProcesses = {};

function checkAlreadyInit(idApplication){
    var dotGitPath = __dirname+'/../workspace/'+idApplication+'/.git';
    if (fs.existsSync(dotGitPath))
        return true;
    else
        return false;
}

function writeAllLogs(title, content, err){
    var toWriteInLog = title+":\n";
    toWriteInLog += JSON.stringify(content).replace(/,/g, ",\n");
    toWriteInLog += "\nError:\n";
    toWriteInLog += JSON.stringify(err).replace(/,/g, ",\n");
    toWriteInLog += "\n";
    fs.writeFileSync(__dirname + '/../all.log', fs.readFileSync(__dirname + '/../all.log') + "\n" + toWriteInLog + "\n");
}

module.exports = {
    gitTag: function(idApplication, tagName, workspacePath) {
        return new Promise(function(resolve, reject) {
            if (!gitlabConf.doGit)
                resolve();
            var simpleGit = require('simple-git')(workspacePath);
            models.Application.findOne({where:{id: idApplication}}).then(function(application){
                // . becomes -
                var cleanHost = globalConf.host.replace(/\./g, "-");

                // Remove prefix
                var nameApp = application.codeName.substring(2);
                var nameRepo = cleanHost+"-"+nameApp;
                var originName = "origin-"+cleanHost+"-"+nameApp;
                simpleGit.addAnnotatedTag(tagName, 'Tagging '+tagName)
                .pushTags(['-u', originName, 'master'], function(err) {
                    if (err) {
                        console.log(err);
                        return reject(err);
                    }
                    resolve();
                });
            });
        });
    },
    doGit: function(attr, callback){
        // We push code on gitlab only in our cloud env
        if(gitlabConf.doGit){
            var idApplication = attr.id_application;

            // Workspace path
            var workspacePath = __dirname+'/../workspace/'+idApplication;

            // Init simple-git in the workspace path
            var simpleGit = require('simple-git')(workspacePath);

            // Get current application values
            models.Application.findOne({where:{id: idApplication}}).then(function(application){
                // . becomes -
                var cleanHost = globalConf.host.replace(/\./g, "-");

                // Remove prefix
                var nameApp = application.codeName.substring(2);
                var nameRepo = cleanHost+"-"+nameApp;
                var originName = "origin-"+cleanHost+"-"+nameApp;
                var repoUrl = "";

                if(attr.gitlabUser != null){
                    var usernameGitlab = attr.gitlabUser.username;

                    if(!gitlabConf.useSSH){
                        repoUrl = gitlab.protocol+"://"+gitlabConf.url+"/"+usernameGitlab+"/"+nameRepo+".git";
                    } else{
                        repoUrl = gitlabConf.sshUrl+":"+usernameGitlab+"/"+nameRepo+".git";
                    }

                    if(typeof gitProcesses[originName] === "undefined")
                        gitProcesses[originName] = false;

                    var err = null;

                    // Is the workspace already git init ?
                    if(!checkAlreadyInit(idApplication)){
                        console.log("GIT: Git init in new workspace directory.");
                        console.log(repoUrl);

                        if(!gitProcesses[originName]){
                            // Set gitProcesses to prevent any other git command during this process
                            gitProcesses[originName] = true;

                            simpleGit.init()
                            .add('.')
                            .commit("First commit!")
                            .addRemote(originName, repoUrl)
                            .push(['-u', originName, 'master'], function(err, answer){
                                gitProcesses[originName] = false;
                                if(err)
                                    console.log(err);
                                console.log(answer);
                                writeAllLogs("Git first commit / push", answer, err);
                            });
                        } else{
                            err = new Error();
                            err.message = "structure.global.error.alreadyInProcess";
                        }
                    } else if(typeof attr.function !== "undefined" && attr.function != "gitPull" && attr.function != "restart"){
                        // We are just after a new instruction
                        console.log("GIT: Git commit after new instruction.");
                        console.log(repoUrl);

                        var commitMsg = "New commit: Function:"+attr.function+" App:"+idApplication+" Module:"+attr.id_module+" Entity:"+attr.id_data_entity;
                        simpleGit.add('.')
                        .commit(commitMsg, function(err, answer){
                            if(err)
                                console.log(err);
                            console.log(answer);
                            writeAllLogs("Git commit", answer, err);
                        });
                    }
                    callback(err);
                } else{
                    var err = new Error();
                    err.message = "Missing gitlab user in server session.";
                    return callback(err, null);
                }
            }).catch(function(err){
                callback(err);
            });
        } else{
            callback();
        }
    },
    gitPush: function(attr, callback){
        // We push code on gitlab only in our cloud env
        if(gitlabConf.doGit){
            var idApplication = attr.id_application;

            // Workspace path
            var workspacePath = __dirname+'/../workspace/'+idApplication;

            // Init simple-git in the workspace path
            var simpleGit = require('simple-git')(workspacePath);

            // Get current application values
            models.Application.findOne({where:{id: idApplication}}).then(function(application){
                // . becomes -
                var cleanHost = globalConf.host.replace(/\./g, "-");

                // Remove prefix
                var nameApp = application.codeName.substring(2);
                var nameRepo = cleanHost+"-"+nameApp;
                var originName = "origin-"+cleanHost+"-"+nameApp;
                var repoUrl = "";

                if(attr.gitlabUser != null){

                    var usernameGitlab = attr.gitlabUser.username;

                    if(!gitlabConf.useSSH){
                        repoUrl = gitlabConf.url+"/"+usernameGitlab+"/"+nameRepo+".git";
                    } else{
                        repoUrl = gitlabConf.sshUrl+":"+usernameGitlab+"/"+nameRepo+".git";
                    }

                    if(typeof gitProcesses[originName] === "undefined")
                        gitProcesses[originName] = false;

                    // Is the workspace already git init ?
                    if(!checkAlreadyInit(idApplication)){
                        console.log("GIT: Git init in new workspace directory...");
                        console.log(repoUrl);

                        if(!gitProcesses[originName]){
                            // Set gitProcesses to prevent any other git command during this process
                            gitProcesses[originName] = true;

                            simpleGit.init()
                            .add('.')
                            .commit("First commit!")
                            .addRemote(originName, repoUrl)
                            .push(['-u', originName, 'master'], function(err, answer){
                                gitProcesses[originName] = false;
                                console.log(answer);
                                writeAllLogs("Git push", answer, err);
                                if(err)
                                    return callback(err, null);
                                callback(null, answer);
                            });
                        } else{
                            var err = new Error();
                            err.message = "structure.global.error.alreadyInProcess";
                            return callback(err, null);
                        }
                    } else if(typeof attr.function !== "undefined"){
                        // We are just after a new instruction
                        console.log("GIT: Doing Git push...");
                        console.log(repoUrl);

                        if(!gitProcesses[originName]){
                            // Set gitProcesses to prevent any other git command during this process
                            gitProcesses[originName] = true;
                            simpleGit.push(['-u', originName, 'master'], function(err, answer){
                                gitProcesses[originName] = false;
                                console.log(answer);
                                writeAllLogs("Git push", answer, err);
                                if(err)
                                    return callback(err, null);
                                callback(null, answer);
                            });
                        } else{
                            err = new Error();
                            err.message = "structure.global.error.alreadyInProcess";
                            return callback(err, null);
                        }
                    }
                } else{
                    var err = new Error();
                    err.message = "Missing gitlab user in server session.";
                    return callback(err, null);
                }
            });
        } else{
            var err = new Error();
            err.message = "structure.global.error.notDoGit";
            callback(err, null);
        }
    },
    gitPull: function(attr, callback){
        // We push code on gitlab only in our cloud env
        if(gitlabConf.doGit){
            var idApplication = attr.id_application;

            // Workspace path
            var workspacePath = __dirname+'/../workspace/'+idApplication;

            // Init simple-git in the workspace path
            var simpleGit = require('simple-git')(workspacePath);

            // Get current application values
            models.Application.findOne({where:{id: idApplication}}).then(function(application){
                // . becomes -
                var cleanHost = globalConf.host.replace(/\./g, "-");

                // Remove prefix
                var nameApp = application.codeName.substring(2);
                var nameRepo = cleanHost+"-"+nameApp;
                var originName = "origin-"+cleanHost+"-"+nameApp;

                if(typeof gitProcesses[originName] === "undefined")
                    gitProcesses[originName] = false;

                if(!gitProcesses[originName]){
                    // Set gitProcesses to prevent any other git command during this process
                    gitProcesses[originName] = true;
                    simpleGit.pull(originName, "master", function(err, answer){
                        gitProcesses[originName] = false;
                        console.log(answer);
                        writeAllLogs("Git pull", answer, err);
                        if(err)
                            return callback(err, null);
                        callback(null, answer);
                    });
                } else{
                    err = new Error();
                    err.message = "structure.global.error.alreadyInProcess";
                    return callback(err, null);
                }
            });
        } else{
            var err = new Error();
            err.message = "structure.global.error.notDoGit";
            callback(err, null);
        }
    },
    gitCommit: function(attr, callback){
        // We push code on gitlab only in our cloud env
        if(gitlabConf.doGit){
            var idApplication = attr.id_application;

            // Workspace path
            var workspacePath = __dirname+'/../workspace/'+idApplication;

            // Init simple-git in the workspace path
            var simpleGit = require('simple-git')(workspacePath);

            // Get current application values
            models.Application.findOne({where:{id: idApplication}}).then(function(application){
                // . becomes -
                var cleanHost = globalConf.host.replace(/\./g, "-");

                // Remove prefix
                var nameApp = application.codeName.substring(2);
                var nameRepo = cleanHost+"-"+nameApp;
                var originName = "origin-"+cleanHost+"-"+nameApp;

                if(typeof gitProcesses[originName] === "undefined")
                    gitProcesses[originName] = false;

                if(!gitProcesses[originName]){
                    // Set gitProcesses to prevent any other git command during this process
                    gitProcesses[originName] = true;
                    var commitMsg = "New commit: Function:"+attr.function+" App:"+idApplication+" Module:"+attr.id_module+" Entity:"+attr.id_data_entity;
                    simpleGit.add('.')
                    .commit(commitMsg, function(err, answer){
                        gitProcesses[originName] = false;
                        console.log(answer);
                        writeAllLogs("Git commit", answer, err);
                        if(err)
                            return callback(err, null);
                        callback(null, answer);
                    });
                } else{
                    err = new Error();
                    err.message = "structure.global.error.alreadyInProcess";
                    return callback(err, null);
                }
            });
        } else{
            var err = new Error();
            err.message = "structure.global.error.notDoGit";
            callback(err, null);
        }
    },
    gitStatus: function(attr, callback){
        // We push code on gitlab only in our cloud env
        if(gitlabConf.doGit){
            var idApplication = attr.id_application;

            // Workspace path
            var workspacePath = __dirname+'/../workspace/'+idApplication;

            // Init simple-git in the workspace path
            var simpleGit = require('simple-git')(workspacePath);

            // Get current application values
            models.Application.findOne({where:{id: idApplication}}).then(function(application){
                // . becomes -
                var cleanHost = globalConf.host.replace(/\./g, "-");

                // Remove prefix
                var nameApp = application.codeName.substring(2);
                var nameRepo = cleanHost+"-"+nameApp;
                var originName = "origin-"+cleanHost+"-"+nameApp;

                if(typeof gitProcesses[originName] === "undefined")
                    gitProcesses[originName] = false;

                if(!gitProcesses[originName]){
                    // Set gitProcesses to prevent any other git command during this process
                    gitProcesses[originName] = true;
                    simpleGit.status(function(err, answer){
                        gitProcesses[originName] = false;
                        console.log(answer);
                        writeAllLogs("Git push", answer, err);
                        if(err)
                            return callback(err, null);
                        callback(null, answer);
                    });
                } else{
                    err = new Error();
                    err.message = "structure.global.error.alreadyInProcess";
                    return callback(err, null);
                }
            });
        } else{
            var err = new Error();
            err.message = "structure.global.error.notDoGit";
            callback(err, null);
        }
    }
}