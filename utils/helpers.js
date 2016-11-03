var fs = require('fs');

function rmdirSyncRecursive(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                rmdirSyncRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
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
    rmdirSyncRecursive: rmdirSyncRecursive
}