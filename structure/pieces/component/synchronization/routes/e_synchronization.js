var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var fs = require('fs-extra');
var globalConf = require('../config/global');
var dbconfig = require('../config/database');
var request = require('request');
var moment = require('moment');
var models = require('../models/');
var exec = require('child_process');
var entity_helper = require('../utils/entity_helper');
var model_builder = require('../utils/model_builder');
var language = require('../services/language');

// Mysql Dump & Import functions
// var mysqlDump = require('mysqldump-with-drop');
// var mysqlImporter = require('node-mysql-importer');
var sqliteImporter = require('../utils/sqlite_importer');

// Datalist
var filterDataTable = require('../utils/filter_datatable');

// Winston logger
var logger = require('../utils/logger');

router.get('/show', block_access.actionAccessMiddleware("synchronization", "read"), (req, res) => {
    var id_e_user = req.query.id;
    var tab = req.query.tab;
    var data = {
        menu: "e_synchronization",
        sub_menu: "list_e_synchronization",
        tab: tab,
        env: globalConf.env
    };

    // Load list of entities to select for synchronyzation
    // Filter list depending on config/application.json - ignore_list array
    var entities = [];
    var dumpConfigEntities = JSON.parse(fs.readFileSync(__dirname+'/../config/synchro_dump.json', 'utf8'));
    fs.readdirSync(__dirname+'/../models/attributes/').filter(function(file) {
        return file.indexOf('.') !== 0
            && file.slice(-5) === '.json'
            && file.substring(0, 2) == 'e_'
            && globalConf.synchronization.ignore_list.indexOf(file.slice(0, -5)) == -1;
    }).forEach(function(file) {

        var fields = [];
        var entityName = file.substring(0, file.length-5);
        var modelName = entityName.charAt(0).toUpperCase() + entityName.slice(1);
        var tableName = models[modelName].getTableName();

        var entityObject = {tradKey: 'entity.'+entityName+'.label_entity', entity: entityName, fields: fields, tableName: tableName};
        for (var i = 0; i < dumpConfigEntities.length; i++)
            if (dumpConfigEntities[i] == entityName)
                entityObject.checked = true;

        entities.push(entityObject);
    });

    data.entities = entities;

    res.render('e_synchronization/show', data);
});

router.get('/list_dump', block_access.actionAccessMiddleware('synchronization', 'read'), (req, res) => {
    res.render('e_synchronization/list_synchronization', {
        menu: "e_synchronization",
        sub_menu: "list_e_synchronization"
    });
});

router.post('/datalist', block_access.actionAccessMiddleware('synchronization', 'read'), (req, res) => {
    var include = model_builder.getDatalistInclude(models, require(__dirname+'/../models/options/e_synchronization'), req.body.columns);
    filterDataTable("E_synchronization", req.body, include).then(function (rawData) {
        entity_helper.prepareDatalistResult('e_synchronization', rawData, req.session.lang_user).then(function (preparedData) {
            res.send(preparedData).end();
        }).catch(function (err) {
            console.log(err);
            logger.debug(err);
            res.end();
        });
    }).catch(function (err) {
        console.log(err);
        logger.debug(err);
        res.end();
    });
});

router.post('/delete', block_access.actionAccessMiddleware("synchronization", "delete"), function (req, res) {
    var id = parseInt(req.body.id);

    models.E_synchronization.findOne({where: {id: id}}).then(function (deleteObject) {
        models.E_synchronization.destroy({
            where: {
                id: id
            }
        }).then(function () {
            req.session.toastr = [{
                    message: 'message.delete.success',
                    level: "success"
                }];

            var redirect = '/synchronization/list_dump';
            res.redirect(redirect);
        }).catch(function (err) {
            entity_helper.error500(err, req, res, '/synchronization/list_dump');
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/synchronization/list_dump');
    });
});

// Write process stdout to given file
// To avoid buffer overflow, we use two streams that read/write on data event
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
            });
            // Child Error output
            childProcess.stderr.on('data', function(stderr) {
                // There is no difference between error and warning
                // If we find a warning label, ignore error (which is not one)
                if (stderr.indexOf("Warning:") == 0)
                    return;
                console.error(stderr);
                fileStream.end();
                childProcess.kill();
                reject(stderr);
            });

            // Child error
            childProcess.on('error', function(error) {
                console.error(error);
                fileStream.end();
                childProcess.kill();
                reject(error);
            });
            // Child close
            childProcess.on('close', function(code) {
                fileStream.end();
                resolve();
            });
        });
    });
}

// *********** Cloud function *************
// This method is called to generate data that must be sent to tablets
// *****************************************
router.post('/generate', block_access.actionAccessMiddleware("synchronization", "create"), function(req, res) {

    var tables = [], entityList = [];
    // Build to synchronize entity list from client form
    for (var key in req.body)
        if (req.body[key] == "true") {
            var tableName = models[entity_helper.capitalizeFirstLetter(key)].getTableName();
            tables.push(tableName);
            entityList.push(key);
        }

    var cmd = "mysqldump";
    // Build process arguments array, each one need to be in a separate array cell
    // "--add-drop-table",
    var cmdArgs = [
        "--default-character-set=utf8",
        "-u",
        dbconfig.user,
        "-p" + dbconfig.password,
        dbconfig.database,
        "-h" + dbconfig.host,
    ];

    // Export selected tables
    if (cmdArgs.length) {
        cmdArgs.push("--tables");
        cmdArgs = cmdArgs.concat(tables);
    }

    // Execute dump and write output to file
    fullStdoutToFile(cmd, cmdArgs, globalConf.syncfolder + '/dump_mysql_data.sql').then(() => {
        console.log('Cloud data file generated');
        req.session.toastr = [{
            message: 'synchro.process.dumped',
            level: "success"
        }];

        // Write entity dump list to config file
        fs.writeFileSync(__dirname+'/../config/synchro_dump.json', JSON.stringify(entityList, null, 4), 'utf8');

        var exec = require('child_process').exec;
        var cwd = globalConf.syncfolder;

        // Check if windows of linux for exec syntax
        exec('./mysql2sqlite.sh ' + cwd + '/dump_mysql_data.sql > ' + cwd + '/dump_cloud_data.sql', {cwd: cwd}, (error, stdout, stderr) => {
            // work with result
            if (error)
                console.log(error);
            return res.redirect('/synchronization/show');
        });
    }).catch((err)=> {
        // node couldn't execute the command
        req.session.toastr = [{
            message: 'message.update.failure',
            level: "error"
        }];
        console.error(err);

        return res.redirect('/synchronization/show');
    });
});

// *********** Tablet function *************
// This method is called in AJAX by Tablet to synchronize its data with the Cloud instance
// *****************************************
var SYNCHRO_STATE;
// Route called by tablet's client to check for synchro status.
// Just return global var SYNCHRO_STATE to query, content is set in /synchronize
router.get('/check_state', block_access.actionAccessMiddleware("synchronization", "read"), function(req, res) {
    res.json(SYNCHRO_STATE).end();
});

router.get('/synchronize', block_access.actionAccessMiddleware("synchronization", "read"), function(req, res) {
    // End request right away to monitor synchro through `/check_state`
    res.end();

    var data = {};
    SYNCHRO_STATE = {done: false, error: null};

    // Récupération du token
    var token = '';
    models.E_synchro_credentials.findAll().then((credentials) => {

        // API credentials
        var cloudHost = "", clientKey =  "", clientSecret = "";
        if (!credentials || credentials.length == 0) {
            SYNCHRO_STATE.error = language(req.session.lang_user).__("synchro.process.no_credentials");
            return console.error("Synchronize: No Synchro credentials found");
        }
        cloudHost = credentials[0].f_cloud_host;
        clientKey = credentials[0].f_client_key;
        clientSecret = credentials[0].f_client_secret;

        // Base64 encoding
        var auth = 'Basic ' + new Buffer(clientKey + ':' + clientSecret).toString('base64');
        var apiBaseUrl = cloudHost + "/api";

        request({
            url : apiBaseUrl + "/getToken",
            headers : {"Authorization" : auth}
        }, function (error, response, body) {
            if (error || response.statusCode != 200) {
                SYNCHRO_STATE.error = language(req.session.lang_user).__("synchro.process.connection_failed");
                return console.error("Synchronize: API /getToken failed");
            }

            body = JSON.parse(body);
            token = body.token;

            // Send journal file to cloud
            var requestCall = request.post({
                url: apiBaseUrl+'/synchronization/situation?token='+token
            }, function(err, response, body) {
                if (err || response.statusCode != 200) {
                    SYNCHRO_STATE.error = "Couldn't send `journal.json` to API";
                    return console.error(err);
                }

                // Save Journal locally
                var current_date = new moment().format("DDMMYYYYHHmmssSSS");
                fs.copySync(globalConf.syncfolder + '/journal.json', globalConf.syncfolder + '/journal' + current_date + '.json');

                // Empty journal
                fs.writeFile(globalConf.syncfolder + '/journal.json', '{"transactions":[]}', (err) => {
                    if (error) {
                        console.log('Synchronize: Journal couldn\'t be emptied');
                        console.error(error);
                    }
                    else
                        console.log('Synchronize: Journal emptied');
                });

                // Write Cloud dump into file
                fs.writeFile(globalConf.syncfolder + '/dump_cloud_data.sql', response.body, (err) => {
                    if (err) {
                        SYNCHRO_STATE.error = "Impossible to create MySQL dump file";
                        return console.error(err);
                    }

                    console.log('Synchronize: Cloud data file stored locally');

                    // Only manual Dump enables to define relevant options
                    sqliteImporter.importSQL(globalConf.syncfolder + '/dump_cloud_data.sql').then( () => {

                        console.log('Synchronize: Cloud database loaded');

                        // Start file uploads to CLOUD
                        var daysFoldersPath = [];
                        try {
                            // Recusively parse upload folder to get all files URI
                            fs.readdirSync(globalConf.localstorage).filter((entityFolder) => {
                                return entityFolder != 'thumbnail';
                            }).forEach(function(entityFolder) {
                                if (!fs.statSync(globalConf.localstorage+entityFolder).isDirectory())
                                    return;
                                fs.readdirSync(globalConf.localstorage+entityFolder).forEach((dayFolder) => {
                                    daysFoldersPath.push({entity: entityFolder, URI: __dirname+'/../upload/'+entityFolder+'/'+dayFolder});
                                });
                            });
                        } catch(e) {
                            if (e.code != 'ENOENT')
                                console.error(e);
                        }

                        // Build object with URI/entityName
                        var fullPathFiles = [];
                        for (var i = 0; i < daysFoldersPath.length; i++) {
                            fs.readdirSync(daysFoldersPath[i].URI).forEach((file) => {
                                fullPathFiles.push({URI: daysFoldersPath[i].URI+'/'+file, entity: daysFoldersPath[i].entity});
                            });
                        }
                        // Send each file and delete it when done
                        if (fullPathFiles.length > 0) {
                            function sendFile(fileList, idx) {
                                var current = fileList[idx];
                                var requestCall = request.post({
                                    url: apiBaseUrl+'/synchronization/file_upload?token='+token+'&entity='+current.entity,
                                }, function(err, resp, body) {
                                    if (err) {
                                        console.error(err);
                                        console.error("Synchronize: Couldn't send file "+current.URI);
                                    }
                                    else
                                        fs.unlink(current.URI, (err) => {if (err) console.error('Couldn\'t delete '+current.URI);});

                                    console.log("File ["+current.URI+"] uploaded");
                                    if (!fileList[idx+1]) {
                                        console.log("Synchronize: Upload done");
                                        SYNCHRO_STATE.done = true;
                                    }
                                    else
                                        sendFile(fileList, idx+1);
                                });
                                var requestForm = requestCall.form();
                                requestForm.append('file', fs.createReadStream(current.URI));
                            }
                            console.log("Synchronize: Starting files upload");
                            sendFile(fullPathFiles, 0);
                        }
                        else {
                            console.log("Synchronize: Nothing to upload");
                            SYNCHRO_STATE.done = true;
                        }
                    });
                });
            });
            var requestForm = requestCall.form();
            // requestForm.append('file', fs.createReadStream(__dirname + '/../sync/journal.json'));
            requestForm.append('file', fs.createReadStream(globalConf.syncfolder + '/journal.json'));
        });
    }).catch(function (err) {
        entity_helper.error500(err, req, res, '/synchronization/list_dump');
    });
});

module.exports = router;