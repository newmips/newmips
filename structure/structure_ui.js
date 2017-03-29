var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');

exports.setSkin = function(attr, callback) {

    var idApplication = attr.id_application;
    var askedSkin = attr.options.value.toLowerCase();

    var skinPath = __dirname + '/../workspace/' + idApplication + '/public/css/AdminLteV2/skins';
    var skinsDir = fs.readdirSync(skinPath).filter(function(file) {
        return (file.indexOf('.') !== 0) && (file.slice(-7) === 'min.css' && (file.slice(0, 1) !== '_'));
    });

    var skinListAvailable = [];

    skinsDir.forEach(function(file) {
        var skin = file.slice(5, -8);
        skinListAvailable.push(skin);
    });

    if(skinListAvailable.indexOf(askedSkin) != -1){

    	var mainLayoutPath = __dirname + '/../workspace/' + idApplication + '/views/main_layout.dust';

    	domHelper.read(mainLayoutPath).then(function($) {
    		var oldSkin = $("link[data-type='skin']").attr("data-skin");
			$("link[data-type='skin']").replaceWith("<link href='/css/AdminLteV2/skins/skin-"+askedSkin+".min.css' rel='stylesheet' type='text/css' data-type='skin' data-skin='"+askedSkin+"'>");
			$("body").removeClass("skin-"+oldSkin);
			$("body").addClass("skin-"+askedSkin);
			domHelper.writeMainLayout(mainLayoutPath, $).then(function() {
				var info = {};
			    info.message = "Skin set to " + attr.options.value + " !";
			    callback(null, info);
			});
		}).catch(function(err){
			callback(err, null);
		});
    }
    else{
    	var err = new Error();
    	err.message = "structure.ui.skin.cannotFind";
        var msgParams = "";
    	for(var i=0; i<skinListAvailable.length; i++){
    		msgParams += "-  " + skinListAvailable[i] + "<br>";
    	}
        err.messageParams = [msgParams];
    	callback(err, null);
    }
}

exports.listSkin = function(attr, callback) {

    var idApplication = attr.id_application;

    var skinPath = __dirname + '/../workspace/' + idApplication + '/public/css/AdminLteV2/skins';
    var skinsDir = fs.readdirSync(skinPath).filter(function(file) {
        return (file.indexOf('.') !== 0) && (file.slice(-7) === 'min.css' && (file.slice(0, 1) !== '_'));
    });

    var skinListAvailable = [];

    skinsDir.forEach(function(file) {
        var skin = file.slice(5, -8);
        skinListAvailable.push(skin);
    });

    var info = {};
    info.message = "structure.ui.skin.list";
    var msgParams = "";
    for(var i=0; i<skinListAvailable.length; i++){
        msgParams += "-  " + skinListAvailable[i] + "<br>";
    }
    info.messageParams = [msgParams];
    callback(null, info);
}