const fs = require('fs-extra');
const globalConf = require('../config/global');


exports.deleteEntityFile = function (options) {
    if (!options)
        return;
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
};

exports.getFileBuffer64 = function (path, callback) {
    if (typeof path == 'undefined' || !fs.existsSync(globalConf.localstorage+path))
        return callback(false, '');
    fs.readFile(globalConf.localstorage + path, function (err, data) {
        if (!err)
            return callback(true, new Buffer(data).toString('base64'));
        return callback(false, '');
    });
};
const deleteEntityLocalFile = function (options) {
    if (!!options.value && !!options.entityName) {
        const partOfValue = options.value.split('-');
        if (partOfValue.length) {
            const filePath = globalConf.localstorage + options.entityName + '/' + partOfValue[0] + '/' + options.value;
            fs.unlink(filePath, function (err) {
                if (err)
                    return console.error(err);
                if (options.type == 'picture') {
                    //remove thumbnail picture
                    const fileThumnailPath = globalConf.localstorage + globalConf.thumbnail.folder + options.entityName + '/' + partOfValue[0] + '/' + options.value;
                    fs.unlink(fileThumnailPath, function (err) {
                        if (err)
                            console.error(err);
                    });
                }
            });
        }

    }
};

var deleteEntityCloudFile = function (options) {
    if (!!options.value && !!options.entity) {

    }
};

