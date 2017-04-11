var fs = require('fs');
var global = require('../config/global');


exports.deleteEntityFile = function (options) {
    if (options) {
        switch (options.type) {
            case "local":
            case "file":
            case 'picture':
                deleteEntityLocalFile(options);
                break;
            case "cloudfile":
                deleteEntityCloudFile(options);
                break;
            default:
                console.log("Store type not found");
                break;
        }
    }
};

exports.getFileBuffer64 = function (path, callback) {
    if (typeof path == 'undefined')
        return callback(false, '');
    fs.readFile(global.localstorage + path, function (err, data) {
        if (!err)
            return callback(true, new Buffer(data).toString('base64'));
        return callback(false, '');
    });
};
var deleteEntityLocalFile = function (options) {
    if (!!options.value && !!options.entityName) {
        var partOfValue = options.value.split('-');
        if (partOfValue.length) {
            var filePath = global.localstorage + options.entityName + '/' + partOfValue[0] + '/' + options.value;
            fs.unlink(filePath, function (err) {
                if (!err) {
                    if (options.type == 'picture') {
                        //remove thumbnail picture
                        var fileThumnailPath = global.localstorage + global.thumbnail.folder + options.entityName + '/' + partOfValue[0] + '/' + options.value;
                        fs.unlink(fileThumnailPath, function (err) {
                            if (err)
                                console.log(err);
                        });
                    }
                }
            });
        }

    }
};

var deleteEntityCloudFile = function (options) {
    if (!!options.value && !!options.entity) {

    }
};

