var process_server = null;
var spawn = require('cross-spawn');
var psTree = require('ps-tree');

exports.launchChildProcess = function(id_information_system, env) {

    // process_server = spawn('nodemon', [__dirname + '/../workspace/' + id_information_system + '/server.js'], {CREATE_NO_WINDOW: true, env: env});
    // process_server = spawn('nodemon', [__dirname + '/../workspace/' + id_information_system + '/server.js'], {detached: true, env: env});

    process_server = spawn('node', [__dirname + "/../workspace/" + id_information_system + "/server.js"], {
        CREATE_NO_WINDOW: true,
        env: env
    });

    process_server.stdout.on('data', function(data){
      console.log('\x1b[36m%s\x1b[0m', 'App Log: ' + data);
    });

    process_server.stderr.on('data', function(data){
      console.log('\x1b[31m%s\x1b[0m', 'App Err: ' + data);
    });

    process_server.on('close', function(code){
      console.log('\x1b[31m%s\x1b[0m', 'Child process exited');
    });

    // process_server = spawn('node', [__dirname + '/../workspace/' + id_information_system + '/server.js'], {detached: true, env: env});
    exports.process_server = process_server;
    return process_server;
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
        signal = 'SIGKILL';
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
                    } catch (ex) {}
                });
                callback();
            });
        } else {
            try {
                process.kill(pid, signal)
            } catch (ex) {}
            callback();
        }

    }
}


// exports.terminate = function(pid, callback) {
//   if(!pid) {
//     throw new Error("No pid supplied to Terminate!")
//   }
//   psTree(pid, function (err, children) {
//     var cp = require('child_process');
//     cp.spawn('kill', ['-9'].concat(children.map(function (p) { return p.PID })))
//     if(callback && typeof callback === 'function') {
//       callback(err, true);
//     } else { // do nothing
//       console.log(children.length + " Processes Terminated!");
//     }
//   });
// }


module.exports = exports;