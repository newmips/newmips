var fs = require("fs");
var globalConf = require('../config/global.js');
var gitlabConf = require('../config/gitlab.json');

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

module.exports = {
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
                if(!gitlabConf.useSSH){
                    repoUrl = gitlabConf.url+"/"+gitlabConf.adminUser+"/"+nameRepo+".git";
                } else{
                    repoUrl = gitlabConf.sshUrl+":"+gitlabConf.adminUser+"/"+nameRepo+".git";
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
                            if(err)
                                console.log(err);
                            gitProcesses[originName] = false;
                            console.log(answer);
                        });
                    } else{
                        err = new Error();
                        err.message = "structure.global.error.alreadyInProcess";
                    }
                } else if(typeof attr.function !== "undefined" && attr.function != "gitPull" && attr.function != "restart"){
                    // We are just after a new instruction
                    console.log("GIT: Git commit after new instruction.");
                    console.log(repoUrl);

                    var commitMsg = "New commit: Function:"+attr.function+" Project:"+attr.id_project+" App:"+idApplication+" Module:"+attr.id_module+" Entity:"+attr.id_data_entity;
                    simpleGit.add('.')
                    .commit(commitMsg, function(err, answer){
                        if(err)
                            console.log(err);
                        console.log(answer);
                    });
                }
                callback(err);
            });
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
                if(!gitlabConf.useSSH){
                    repoUrl = gitlabConf.url+"/"+gitlabConf.adminUser+"/"+nameRepo+".git";
                } else{
                    repoUrl = gitlabConf.sshUrl+":"+gitlabConf.adminUser+"/"+nameRepo+".git";
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
                            if(err)
                                return callback(err, null);
                            gitProcesses[originName] = false;
                            callback(null, answer);
                        });
                    } else{
                        err = new Error();
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
                            if(err)
                                return callback(err, null);
                            gitProcesses[originName] = false;
                            callback(null, answer);
                        });
                    } else{
                        err = new Error();
                        err.message = "structure.global.error.alreadyInProcess";
                        return callback(err, null);
                    }
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
                        if(err)
                            return callback(err, null);
                        gitProcesses[originName] = false;
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