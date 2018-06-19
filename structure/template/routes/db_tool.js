var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
// Datalist
var filterDataTable = require('../utils/filterDataTable');

// Sequelize
var models = require('../models/');
var attributes = require('../models/attributes/e_action');
var options = require('../models/options/e_action');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');
var file_helper = require('../utils/file_helper');
var globalConfig = require('../config/global');
var dbConfig = require('../config/database');
var fs = require('fs-extra');
var dust = require('dustjs-linkedin');

// Enum and radio managment
var enums_radios = require('../utils/enum_radio.js');
var moment = require("moment");

// Winston logger
var logger = require('../utils/logger');

var exec = require('child_process');

router.get('/show', block_access.isLoggedIn, block_access.actionAccessMiddleware("db_tool", "read"), function(req, res) {
    var data = {};

    var entities = []
    fs.readdirSync(__dirname+'/../models/attributes/').filter(function(file) {
        return file.indexOf('.') !== 0
            && file.slice(-5) === '.json'
            && file.substring(0, 2) == 'e_';
    }).forEach(function(file) {
        var fields = [];
        var entityName = file.substring(0, file.length-5);
        var modelName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
        var tableName = models[modelName].getTableName();
        var entityObject = {tradKey: 'entity.'+entityName+'.label_entity', entity: entityName, fields: fields, tableName: tableName};
        entities.push(entityObject);
    })

    data.entities = entities;
    res.render('db_tool/show', data);
})

router.post('/export', block_access.isLoggedIn, block_access.actionAccessMiddleware("db_tool", "create"), function(req, res) {
    if(dbConfig.password != req.body.db_password){
        req.session.toastr = [{
            message: 'settings.db_tool.wrong_db_pwd',
            level: "error"
        }];
        return res.redirect("/db_tool/show")
    }

    var tables = [];

    for(var prop in req.body)
        if(req.body[prop] == "true")
            tables.push(prop);

    var cmd = "mysqldump";
    var cmdArgs = [
        "--default-character-set=utf8",
        "--add-drop-table",
        "-u",
        dbConfig.user,
        "-p" + dbConfig.password,
        dbConfig.database,
        "-h" + dbConfig.host,
    ];

    // Export selected tables
    if (cmdArgs.length) {
        cmdArgs.push("--tables");
        cmdArgs = cmdArgs.concat(tables);
    }

    function fullStdoutToFile(cmd, args, filePath) {
        return new Promise((resolve, reject) => {
            // Create and open file writeStream
            var fileStream = fs.createWriteStream(filePath);
            fileStream.on('open', function(fd) {

                // Exec instruction
                var childProcess = exec.spawn(cmd, args);
                childProcess.stdout.setEncoding('utf8');
                childProcess.stderr.setEncoding('utf8');

                // Child Success output
                childProcess.stdout.on('data', function(stdout) {
                    fileStream.write(stdout);
                })
                // Child Error output
                childProcess.stderr.on('data', function(stderr) {
                    // Avoid reject if only warngin
                    if (stderr.toLowerCase().indexOf("warning") != -1){
                        console.log("!! mysqldump ignored warning !!: "+stderr)
                        return;
                    }
                    fileStream.end();
                    childProcess.kill();
                    reject(stderr);
                })

                // Child error
                childProcess.on('error', function(error) {
                    console.error(error);
                    fileStream.end();
                    childProcess.kill();
                    reject(error);
                })
                // Child close
                childProcess.on('close', function(code) {
                    fileStream.end();
                    resolve();
                })
            })
        })
    }

    var dumpName = 'dump_db_data_'+moment().format("YYYYMMDD-HHmmss")+'.sql';
    var dumpPath = __dirname + '/../' + dumpName;

    fullStdoutToFile(cmd, cmdArgs, dumpPath).then(function(){
        res.download(dumpPath, dumpName, function (err) {
            if (err)
                console.log(err);
            fs.unlinkSync(dumpPath);
        })
    }).catch(function(err){
        console.log(err);
    })
})

router.post('/import', block_access.isLoggedIn, block_access.actionAccessMiddleware("db_tool", "create"), function(req, res) {

    var filename = req.body.import_file;
    if(filename == ""){
        req.session.toastr = [{
            message: 'settings.db_tool.file_needed',
            level: "error"
        }];
        return res.redirect("/db_tool/show")
    }

    var baseFile = filename.split('-')[0];
    var completeFilePath = globalConfig.localstorage + '/db_import/' + baseFile + '/' + filename;

    if(dbConfig.password != req.body.db_password){
        req.session.toastr = [{
            message: 'settings.db_tool.wrong_db_pwd',
            level: "error"
        }];
        fs.unlinkSync(completeFilePath);
        return res.redirect("/db_tool/show")
    }

    var cmd = "mysql";
    var cmdArgs = [
        "-u",
        dbConfig.user,
        "-p" + dbConfig.password,
        dbConfig.database,
        "-h" + dbConfig.host,
        "<",
        completeFilePath
    ];

    function handleExecStdout(cmd, args) {
        return new Promise((resolve, reject) => {

            // Exec instruction
            var childProcess = exec.spawn(cmd, args, {shell: true, detached: true});
            childProcess.stdout.setEncoding('utf8');
            childProcess.stderr.setEncoding('utf8');

            // Child Success output
            childProcess.stdout.on('data', function(stdout) {
                console.log(stdout)
            })

            // Child Error output
            childProcess.stderr.on('data', function(stderr) {
                // Avoid reject if only warngin
                if (stderr.toLowerCase().indexOf("warning") != -1) {
                    console.log("!! mysql ignored warning !!: " + stderr)
                    return;
                }
                console.log(stderr);
                childProcess.kill();
                reject(stderr);
            })

            // Child error
            childProcess.on('error', function(error) {
                console.error(error);
                childProcess.kill();
                reject(error);
            })

            // Child close
            childProcess.on('close', function(code) {
                resolve();
            })
        })
    }

    handleExecStdout(cmd, cmdArgs).then(function(){
        fs.unlinkSync(completeFilePath);
        req.session.toastr = [{
            message: 'settings.db_tool.import_success',
            level: "success"
        }];
        res.redirect("/db_tool/show")
    }).catch(function(err){
        console.log(err);
        req.session.toastr = [{
            message: JSON.stringify(err),
            level: "error"
        }];
        res.redirect("/db_tool/show")
    })
})

module.exports = router;