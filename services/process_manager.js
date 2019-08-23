var process_server = null;
var process_server_per_app = new Array();
var spawn = require('cross-spawn');
var psTree = require('ps-tree');
var globalConf = require('../config/global.js');
var fs = require("fs-extra");
var path = require('path');

var AnsiToHTML = require('ansi-to-html');
var ansiToHtml = new AnsiToHTML();
var moment = require('moment');

let childsUrlsStorage = {};

function setDefaultChildUrl(sessionID, idApp){
    if(typeof childsUrlsStorage[sessionID] === "undefined")
        childsUrlsStorage[sessionID] = {};

    if(typeof childsUrlsStorage[sessionID][idApp] === "undefined")
        childsUrlsStorage[sessionID][idApp] = "";
}

exports.process_server_per_app = process_server_per_app;
exports.launchChildProcess = function(req, idApp, env) {

    setDefaultChildUrl(req.sessionID, idApp);

    process_server = spawn('node', [__dirname + "/../workspace/" + idApp + "/server.js", 'autologin'], {
        CREATE_NO_WINDOW: true,
        env: env
    });

    /* Generate app logs in /workspace/logs folder */
    fs.mkdirsSync(__dirname + "/../workspace/logs/");
    var allLogStream = fs.createWriteStream(path.join(__dirname + "/../workspace/logs/", 'app_'+idApp+'.log'), {flags: 'a'});

    process_server.stdout.on('data', function(data) {
        // Check for child process log specifying current url. child_url will then be used to redirect
        // child process after restart
        if ((data + '').indexOf("IFRAME_URL") != -1) {
            if ((data + '').indexOf("/status") == -1){
                childsUrlsStorage[req.sessionID][idApp] = (data + '').split('::')[1];
            }
        } else if(data.toString().length > 15) { // Not just the date, mean avoid empty logs
            allLogStream.write('<span style="color:#00ffff;">'+moment().format("YY-MM-DD HH:mm:ss")+':</span>  ' + ansiToHtml.toHtml(data.toString()) + '\n');
            console.log('\x1b[36m%s\x1b[0m', 'Log '+idApp+': ' + data.toString().replace(/\r?\n|\r/, ''));
        }
    });

    process_server.stderr.on('data', function(data) {
        allLogStream.write('<span style="color: red;">'+moment().format("YY-MM-DD HH:mm:ss")+':</span>  ' + ansiToHtml.toHtml(data.toString()) + '\n');
        console.log('\x1b[31m%s\x1b[0m', 'Err '+idApp+': ' + data.toString().replace(/\r?\n|\r/, ''));
    });

    process_server.on('close', function(code) {
        console.log('\x1b[31m%s\x1b[0m', 'Child process exited');
    });

    exports.process_server = process_server;
    return process_server;
}

exports.childUrl = function(req, instruction) {

    setDefaultChildUrl(req.sessionID, req.session.id_application);

    // On entity delete, reset child_url to avoid 404
    if (instruction == 'deleteDataEntity')
        childsUrlsStorage[req.sessionID][req.session.id_application] = "/default/home";

    let url =  globalConf.protocol_iframe + '://';
    if (globalConf.env == 'cloud')
        url += globalConf.sub_domain + '-' + req.session.name_application + "." + globalConf.dns + childsUrlsStorage[req.sessionID][req.session.id_application];
    else
        url += globalConf.host + ':' + (9000 + parseInt(req.session.id_application)) + childsUrlsStorage[req.sessionID][req.session.id_application];

    return url;
}

exports.killChildProcess = function(pid, callback) {

    var cp = require('child_process');

    console.log("Killed child process was called : " + pid);

    // OS is Windows
    var isWin = /^win/.test(process.platform);

    if(isWin){
        // **** Commands that works fine on WINDOWS ***
        cp.exec('taskkill /PID ' + process_server.pid + ' /T /F', function(error, stdout, stderr) {
            console.log("Killed child process");
            exports.process_server = null;
            callback();
        });
    } else {
        // **** Commands that works fine on UNIX ***
        var signal = 'SIGKILL';

        /* Kill all the differents child process */
        var killTree = true;
        if (killTree) {
            psTree(pid, function(err, children) {
                var pidArray = [pid].concat(children.map(function(p) {
                    return p.PID;
                }));

                try {
                    for(var i=0; i<pidArray.length; i++){
                        process.kill(pidArray[i], signal);
                        console.log("TPID : " + pidArray[i]);
                    }
                } catch(err){
                    return callback(err);
                }

                callback();
            });
        } else {
            /* Kill just one child */
            try {
                process.kill(pid, signal);
                callback();
            } catch (err) {
                return callback(err);
            }
        }
    }
}

module.exports = exports;