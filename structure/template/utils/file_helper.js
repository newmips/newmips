var wfs = require('webdav');
var fs = require('fs');
var global = require('../config/global');


exports.deleteEntityFile = function (options) {
    console.log(options)
    if (options) {
        switch (options.type) {
            case "local":
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

var deleteEntityLocalFile = function (options) {
    if (!!options.value && !!options.entityName) {
        var partOfValue = options.value.split('-');
        if (partOfValue.length) {
            var filePath = global.localStorage + options.entityName + '/' + partOfValue[0] + '/' + options.value;
            console.log(filePath)
            fs.unlink(filePath, function (err) {
                if (err)
                    console.log(err);
            });
        }

    }
};

var deleteEntityCloudFile = function (options) {
    if (!!options.value && !!options.entity) {

    }
};

