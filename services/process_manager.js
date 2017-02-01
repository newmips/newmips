var process_server = null;
var spawn = require('cross-spawn');
var psTree = require('ps-tree');

var child_url = '';
exports.launchChildProcess = function(id_application, env) {

    process_server = spawn('node', [__dirname + "/../workspace/" + id_application + "/server.js", 'autologin'], {
        CREATE_NO_WINDOW: true,
        env: env
    });

    process_server.stdout.on('data', function(data){
        // Check for child process log specifying current url. child_url will then be used to redirect
        // child process after restart
        if ((data+'').indexOf("IFRAME_URL") != -1) {
            if ((data+'').indexOf("/status") == -1)
                child_url = (data+'').split('::')[1];
        }
        else
            console.log('\x1b[36m%s\x1b[0m', 'App Log: ' + data);
    });

    process_server.stderr.on('data', function(data){
        console.log('\x1b[31m%s\x1b[0m', 'App Err: ' + data);
    });

    process_server.on('close', function(code){
        console.log('\x1b[31m%s\x1b[0m', 'Child process exited');
    });

    exports.process_server = process_server;
    return process_server;
}
exports.childUrl = function() {
    return child_url;
}

exports.killChildProcess = function(pid, callback) {

    var cp = require('child_process');

    console.log("Killed child process was called : " + pid);

    // OS is Windows
    var isWin = /^win/.test(process.platform);

    if (isWin) {

        // **** Commands that works fine on WINDOWS ***
        cp.exec('taskkill /PID ' + process_server.pid + ' /T /F', function(error, stdout, stderr) {
            console.log("Killed child process");
            exports.process_server = null;
            callback();
        });

    } else {

        // **** Commands that works fine on UNIX ***
        var signal = 'SIGKILL';
        var killTree = true;
        if (killTree) {
            psTree(pid, function(err, children) {
                [pid].concat(
                    children.map(function(p) {
                        return p.PID;
                    })
                ).forEach(function(tpid) {
                    try {
                        process.kill(tpid, signal);
                        console.log("TPID : " + tpid)
                    } catch (err) {
                        return callback(err);
                    }
                });
                callback();
            });
        } else {
            try {
                process.kill(pid, signal)
            } catch (err) {
                return callback(err);
            }
            callback();
        }
    }
}

module.exports = exports;