var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');


exports.setSkin = function(attr, callback) {

	console.log("attr");

	var info = {};
	info.message = "Skin set to "+attr.options.value+" !";
	callback(null, info);
}
