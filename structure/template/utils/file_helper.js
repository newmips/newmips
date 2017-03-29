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

var deleteEntityLocalFile = function (options) {
    if (!!options.value && !!options.entityName) {
        var partOfValue = options.value.split('-');
        if (partOfValue.length) {
            var filePath = global.localstorage + options.entityName + '/' + partOfValue[0] + '/' + options.value;
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

