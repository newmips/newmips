const globalConf = require('../config/global.js');
const spawn = require('cross-spawn');
const psTree = require('ps-tree');
const fs = require("fs-extra");
const path = require('path');

const AnsiToHTML = require('ansi-to-html');
const ansiToHtml = new AnsiToHTML();
const moment = require('moment');

let process_server = null;
let childsUrlsStorage = {};
let process_server_per_app = new Array();

function setDefaultChildUrl(sessionID, appName){
    if(typeof childsUrlsStorage[sessionID] === "undefined")
        childsUrlsStorage[sessionID] = {};

    if(typeof childsUrlsStorage[sessionID][appName] === "undefined")
        childsUrlsStorage[sessionID][appName] = "";
}

exports.process_server_per_app = process_server_per_app;
exports.launchChildProcess = function(req, appName, env) {

    setDefaultChildUrl(req.sessionID, appName);

    process_server = spawn('node', [__dirname + "/../workspace/" + appName + "/server.js", 'autologin'], {
        CREATE_NO_WINDOW: true,
        env: env
    });

    /* Generate app logs in /workspace/logs folder */
    fs.mkdirsSync(__dirname + "/../workspace/logs/");
    var allLogStream = fs.createWriteStream(path.join(__dirname + "/../workspace/logs/", 'app_'+appName+'.log'), {flags: 'a'});

    process_server.stdout.on('data', function(data) {
        // Check for child process log specifying current url. child_url will then be used to redirect
        // child process after restart
        if ((data + '').indexOf("IFRAME_URL") != -1) {
            if ((data + '').indexOf("/status") == -1){
                childsUrlsStorage[req.sessionID][appName] = (data + '').split('::')[1];
            }
        } else if(data.toString().length > 15) { // Not just the date, mean avoid empty logs
            allLogStream.write('<span style="color:#00ffff;">'+moment().format("YY-MM-DD HH:mm:ss")+':</span>  ' + ansiToHtml.toHtml(data.toString()) + '\n');
            console.log('\x1b[36m%s\x1b[0m', 'Log '+appName+': ' + data.toString().replace(/\r?\n|\r/, ''));
        }
    });

    process_server.stderr.on('data', function(data) {
        allLogStream.write('<span style="color: red;">'+moment().format("YY-MM-DD HH:mm:ss")+':</span>  ' + ansiToHtml.toHtml(data.toString()) + '\n');
        console.log('\x1b[31m%s\x1b[0m', 'Err '+appName+': ' + data.toString().replace(/\r?\n|\r/, ''));
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

const cp = require('child_process');
exports.killChildProcess = (pid) => {
    return new Promise((resolve, reject) => {

        console.log("Killed child process was called : " + pid);

        // OS is Windows
        let isWin = /^win/.test(process.platform);
        if (isWin) {
            // **** Commands that works fine on WINDOWS ***
            cp.exec('taskkill /PID ' + process_server.pid + ' /T /F', function(error, stdout, stderr) {
                console.log("Killed child process");
                exports.process_server = null;
                resolve();
            });
        } else {
            // **** Commands that works fine on UNIX ***
            let signal = 'SIGKILL';

            /* Kill all the differents child process */
            let killTree = true;
            if (killTree) {
                psTree(pid, function(err, children) {
                    let pidArray = [pid].concat(children.map(function(p) {
                        return p.PID;
                    }));

                    for (let i = 0; i < pidArray.length; i++) {
                        console.log("TPID : " + pidArray[i]);
                        process.kill(pidArray[i], signal);
                    }
                    resolve();
                });
            } else {
                /* Kill just one child */
                process.kill(pid, signal);
                resolve();
            }
        }
    })
}

module.exports = exports;