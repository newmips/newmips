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

exports.setIcon = function(attr, callback) {
    var workspacePath = __dirname+'/../workspace/'+attr.id_application;
    var layout_filename = 'layout_m_'+attr.module_name+'.dust';

    var iconClass = attr.iconValue.split(' ').join('-');
    domHelper.read(workspacePath+'/views/'+layout_filename).then(function($) {
        var elementI = $("#"+attr.entity.codeName.substring(2)+'_menu_item').find('a:first').find('i:first');
        elementI.removeClass();
        elementI.addClass('fa fa-'+iconClass);

        domHelper.write(workspacePath+'/views/'+layout_filename, $).then(function() {

            var info = {
                message: "structure.ui.icon.success",
                messageParams: [attr.entity.name, iconClass]
            }

            domHelper.read(workspacePath+'/views/default/m_'+attr.module_name+'.dust').then(function($) {
                $('i.'+attr.entity.codeName.substring(2)+'-icon').removeClass().addClass('fa fa-'+iconClass+' '+attr.entity.codeName.substring(2)+'-icon');
                domHelper.write(workspacePath+'/views/default/m_'+attr.module_name+'.dust', $).then(function() {
                    callback(null, info);
                });
            });
        });
    }).catch(function(err) {
        callback(err);
    });
}

// REGEX USEFUL FOR WIDGET DELETION
// var regexString = "([^]*)(\/\/ \*\*\* Widget call "+attr.entity.codeName+" "+attr.widgetType+" start \| Do not remove \*\*\*)([^]*)(\/\/ \*\*\* Widget call "+attr.entity.codeName+" "+attr.widgetType+" end \| Do not remove \*\*\*)([^]*)";
// defaultFile = defaultFile.replace(regexString, '$1$2\n\t'+insertCode+'\n\t$4$5')

exports.createWidget = function(attr, callback) {
    var workspacePath = __dirname+'/../workspace/'+attr.id_application;
    var piecesPath = __dirname+'/pieces/';

    // Add widget's query to routes/default controller
    var defaultFile = fs.readFileSync(workspacePath+'/routes/default.js', 'utf8');
    var modelName = attr.entity.codeName.charAt(0).toUpperCase() + attr.entity.codeName.toLowerCase().slice(1)
    var insertCode = '';
    insertCode += "// *** Widget call "+attr.entity.codeName+" "+attr.widgetType+" start | Do not remove ***\n";
    insertCode += "\twidgetPromises.push(new Promise(function(resolve, reject){\n";
    insertCode += "\t\tmodels."+modelName+'.count().then(function(result){\n';
    insertCode += "\t\t\tresolve({"+attr.widgetType+attr.entity.codeName+': result});\n';
    insertCode += "\t\t});\n";
    insertCode += "\t}));\n";
    insertCode += "\t// *** Widget call "+attr.entity.codeName+" "+attr.widgetType+" end | Do not remove ***\n\n";
    insertCode += "\t// *** Widget module "+attr.module.codeName+" | Do not remove ***\n";

    insertCode = defaultFile.replace("// *** Widget module "+attr.module.codeName+" | Do not remove ***", insertCode);
    fs.writeFileSync(workspacePath+'/routes/default.js', insertCode);

    var layout_view_filename = workspacePath+'/views/default/'+attr.module.codeName+'.dust';
    // Add widget to module's layout
    domHelper.read(layout_view_filename).then(function($) {
        domHelper.read(piecesPath+'/views/widget/'+attr.widgetType+'.dust').then(function($2) {
            var widgetElemId = attr.widgetType+'_'+attr.entity.name+'_widget';

            var newHtml = "";
            newHtml += '<!--{@entityAccess entity="'+attr.entity.codeName.substring(2)+'" }-->';
            newHtml += "<div id='"+widgetElemId+"' class='col-xs-4'>\n"
            newHtml +=      $2("body")[0].innerHTML+"\n";
            newHtml += "</div>";
            newHtml += '<!--{/entityAccess}-->';
            newHtml = newHtml.replace(/ENTITY_NAME/g, attr.entity.codeName);
            newHtml = newHtml.replace(/ENTITY_URL_NAME/g, attr.entity.codeName.substring(2));

            $("#widgets").append(newHtml);
            domHelper.write(layout_view_filename, $).then(function() {
                callback(null, {message: "structure.ui.widget.success", messageParams: [attr.widgetInputType, attr.module.name]});
            }).catch(function(err) {
                console.log(err)
                callback(err);
            });
        });
    });
}