var translateHelper = require("../utils/translate");

exports.setupProject = function(attr, callback) {
    /* --------------- Add application translation in generator for list --------------- */
    translateHelper.writeGeneratorsLocales("project", attr.insertIdProject, attr.options.showValue, function(){
        callback();
    });
}