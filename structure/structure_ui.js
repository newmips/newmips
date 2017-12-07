var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');

exports.setColumnVisibility = function (attr, callback) {
    var pathToViews = __dirname + '/../workspace/' + attr.id_application + '/views/' + attr.name_data_entity;

    var possibilityShow = ["show", "visible"];
    var possibilityHide = ["hide", "hidden", "non visible", "caché"];

    var attributes = attr.options.word.toLowerCase();
    var hide;

    if (possibilityHide.indexOf(attributes) != -1) {
        hide = true;
    } else if (possibilityShow.indexOf(attributes) != -1) {
        hide = false;
    } else {
        var err = new Error();
        err.message = "structure.field.attributes.notUnderstand";
        return callback(err);
    }

    domHelper.read(pathToViews + '/list_fields.dust').then(function ($) {
        if(attr.options.value == "f_id")
            attr.options.value = "id";
        if($("*[data-field='" + attr.options.value + "']").length > 0){
            $("*[data-field='" + attr.options.value + "']")[hide ? 'hide' : 'show']();
            domHelper.write(pathToViews + '/list_fields.dust', $).then(function () {
                var info = {};
                info.message = hide ? "structure.ui.columnVisibility.hide" : "structure.ui.columnVisibility.show";
                info.messageParams = [attr.options.showValue];
                callback(null, info);
            });
        } else{
            var err = new Error();
            err.message = "structure.ui.columnVisibility.noColumn";
            err.messageParams = [attr.options.showValue];
            return callback(err);
        }
    }).catch(function (err) {
        callback(err, null);
    });
}

exports.setLayout = function(attr, callback) {

    var idApplication = attr.id_application;
    var askedLayout = attr.options.value.toLowerCase().trim().replace(/ /g, "-");

    var layoutPath = __dirname + '/../workspace/' + idApplication + '/public/css/AdminLteV2/layouts';
    var layoutsDir = fs.readdirSync(layoutPath).filter(function(file) {
        return (file.indexOf('.') !== 0) && (file.slice(-4) === '.css' && (file.slice(0, 1) !== '_'));
    });

    var layoutListAvailable = [];

    layoutsDir.forEach(function(file) {
        var layout = file.slice(7, -4);
        layoutListAvailable.push(layout);
    });

    if(layoutListAvailable.indexOf(askedLayout) != -1){

        var mainLayoutPath = __dirname + '/../workspace/' + idApplication + '/views/main_layout.dust';

        domHelper.read(mainLayoutPath).then(function($) {
            var oldLayout = $("link[data-type='layout']").attr("data-layout");
            $("link[data-type='layout']").replaceWith("<link href='/css/AdminLteV2/layouts/layout-"+askedLayout+".css' rel='stylesheet' type='text/css' data-type='layout' data-layout='"+askedLayout+"'>\n");
            $("body").removeClass("layout-"+oldLayout);
            $("body").addClass("layout-"+askedLayout);
            domHelper.writeMainLayout(mainLayoutPath, $).then(function() {
                var info = {};
                info.message = "Layout set to " + attr.options.value + " !";
                callback(null, info);
            });
        }).catch(function(err){
            callback(err, null);
        });
    }
    else{
        var err = new Error();
        err.message = "structure.ui.layout.cannotFind";
        var msgParams = "";
        for(var i=0; i<layoutListAvailable.length; i++){
            msgParams += "-  " + layoutListAvailable[i] + "<br>";
        }
        err.messageParams = [msgParams];
        callback(err, null);
    }
}

exports.setTheme = function(attr, callback) {

    var idApplication = attr.id_application;
    var askedTheme = attr.options.value.toLowerCase();
    askedTheme = askedTheme.trim().replace(/ /g, "-");

    var themePath = __dirname + '/../workspace/' + idApplication + '/public/themes';
    var themesDir = fs.readdirSync(themePath).filter(function(folder) {
        return (folder.indexOf('.') == -1);
    });

    var themeListAvailable = [];

    themesDir.forEach(function(theme) {
        themeListAvailable.push(theme);
    });

    if(themeListAvailable.indexOf(askedTheme) != -1){

        var mainLayoutPath = __dirname + '/../workspace/' + idApplication + '/views/main_layout.dust';

        domHelper.read(mainLayoutPath).then(function($) {
            var oldTheme = $("link[data-type='theme']").attr("data-theme");
            $("link[data-type='theme']").replaceWith("<link href='/themes/"+askedTheme+"/css/style.css' rel='stylesheet' type='text/css' data-type='theme' data-theme='"+askedTheme+"'>");
            //$("body").removeClass("theme-"+oldTheme);
            //$("body").addClass("theme-"+askedTheme);
            domHelper.writeMainLayout(mainLayoutPath, $).then(function() {
                var info = {};
                info.message = "Theme set to " + attr.options.value + " !";
                callback(null, info);
            });
        }).catch(function(err){
            callback(err, null);
        });
    } else {
        var err = new Error();
        err.message = "structure.ui.theme.cannotFind";
        var msgParams = "";
        for(var i=0; i<themeListAvailable.length; i++){
            msgParams += "-  " + themeListAvailable[i] + "<br>";
        }
        err.messageParams = [msgParams];
        callback(err, null);
    }
}

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
    var layout_filename = 'layout_'+attr.module.codeName+'.dust';

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

            domHelper.read(workspacePath+'/views/default/'+attr.module.codeName+'.dust').then(function($) {
                $('i.'+attr.entity.codeName.substring(2)+'-icon').removeClass().addClass('fa fa-'+iconClass+' '+attr.entity.codeName.substring(2)+'-icon');
                domHelper.write(workspacePath+'/views/default/'+attr.module.codeName+'.dust', $).then(function() {
                    callback(null, info);
                });
            });
        });
    }).catch(function(err) {
        callback(err);
    });
}

exports.createWidget = function(attr, callback) {
    var workspacePath = __dirname+'/../workspace/'+attr.id_application;
    var piecesPath = __dirname+'/pieces/';

    // Add widget's query to routes/default controller
    var defaultFile = fs.readFileSync(workspacePath+'/routes/default.js', 'utf8');
    var modelName = attr.entity.codeName.charAt(0).toUpperCase() + attr.entity.codeName.toLowerCase().slice(1);
    var insertCode = '';
    insertCode += "// *** Widget call "+attr.entity.codeName+" "+attr.widgetType+" start | Do not remove ***\n";
    insertCode += "\twidgetPromises.push(new Promise(function(resolve, reject){\n";
    insertCode += "\t\tmodels."+modelName+'.count().then(function(result){\n';
    insertCode += "\t\t\tresolve({"+attr.entity.codeName+'_'+attr.widgetType+': result});\n';
    insertCode += "\t\t});\n";
    insertCode += "\t}));\n";
    insertCode += "\t// *** Widget call "+attr.entity.codeName+" "+attr.widgetType+" end | Do not remove ***\n\n";
    insertCode += "\t// *** Widget module "+attr.module.codeName+" | Do not remove ***\n";

    insertCode = defaultFile.replace("// *** Widget module "+attr.module.codeName+" | Do not remove ***", insertCode);
    fs.writeFileSync(workspacePath+'/routes/default.js', insertCode);

    var layout_filename = 'layout_'+attr.module.codeName+'.dust';
    // Get entity's icon
    domHelper.read(workspacePath+'/views/'+layout_filename).then(function($) {
        var entityIconClass = $("#"+attr.entity.codeName.substring(2)+'_menu_item').find('a:first').find('i:first').attr('class');
        var layout_view_filename = workspacePath+'/views/default/'+attr.module.codeName+'.dust';

        // Add widget to module's layout
        domHelper.read(layout_view_filename).then(function($) {
            domHelper.read(piecesPath+'/views/widget/'+attr.widgetType+'.dust').then(function($2) {
                var widgetElemId = attr.widgetType+'_'+attr.entity.codeName+'_widget';

                // Create widget's html
                var newHtml = "";
                newHtml += "<div id='"+widgetElemId+"' class='col-sm-3 col-xs-12'>\n";
                newHtml += '<!--{@entityAccess entity="'+attr.entity.codeName.substring(2)+'" }-->';
                newHtml +=      $2("body")[0].innerHTML+"\n";
                newHtml += '<!--{/entityAccess}-->';
                newHtml += "</div>";
                newHtml = newHtml.replace(/ENTITY_NAME/g, attr.entity.codeName);
                newHtml = newHtml.replace(/ENTITY_URL_NAME/g, attr.entity.codeName.substring(2));
                $("#widgets").append(newHtml);

                // Set entity's icon class to widget
                $('i.'+attr.entity.codeName.substring(2)+'-icon').removeClass().addClass(entityIconClass+' '+attr.entity.codeName.substring(2)+'-icon');

                domHelper.write(layout_view_filename, $).then(function() {
                    callback(null, {message: "structure.ui.widget.success", messageParams: [attr.widgetInputType, attr.module.name]});
                }).catch(function(err) {
                    console.log(err)
                    callback(err);
                });
            });
        });
    });
}

exports.createWidgetLastRecords = function(attr, callback) {
    var workspacePath = __dirname+'/../workspace/'+attr.id_application;
    var piecesPath = __dirname+'/pieces/';

    // Add widget's query to routes/default controller
    var defaultFile = fs.readFileSync(workspacePath+'/routes/default.js', 'utf8');
    var modelName = attr.entity.codeName.charAt(0).toUpperCase() + attr.entity.codeName.toLowerCase().slice(1)
    var insertCode = '';
    insertCode += "// *** Widget call "+attr.entity.codeName+" "+attr.widgetType+" start | Do not remove ***\n";
    insertCode += "\twidgetPromises.push(new Promise(function(resolve, reject){\n";
    insertCode += "\t\tmodels."+modelName+'.findAll({limit: '+attr.limit+', order: "id DESC"}).then(function(result){\n';
    insertCode += "\t\t\tresolve({"+attr.entity.codeName+'_'+attr.widgetType+': result});\n';
    insertCode += "\t\t});\n";
    insertCode += "\t}));\n";
    insertCode += "\t// *** Widget call "+attr.entity.codeName+" "+attr.widgetType+" end | Do not remove ***\n\n";
    insertCode += "\t// *** Widget module "+attr.module.codeName+" | Do not remove ***\n";

    insertCode = defaultFile.replace("// *** Widget module "+attr.module.codeName+" | Do not remove ***", insertCode);
    fs.writeFileSync(workspacePath+'/routes/default.js', insertCode);

    var layout_view_filename = workspacePath+'/views/default/'+attr.module.codeName+'.dust';
    domHelper.read(layout_view_filename).then(function($) {
        domHelper.read(piecesPath+'/views/widget/'+attr.widgetType+'.dust').then(function($template) {
            var widgetElemId = attr.widgetType+'_'+attr.entity.codeName+'_widget';
            var newHtml = "";
            newHtml += "<div id='"+widgetElemId+"' class='col-xs-12 col-sm-"+(attr.columns.length > 4 ? '12' : '6')+"'>\n";
            newHtml += '<!--{@entityAccess entity="'+attr.entity.codeName.substring(2)+'" }-->';
            newHtml +=      $template("body")[0].innerHTML+"\n";
            newHtml += '<!--{/entityAccess}-->';
            newHtml += "</div>";
            newHtml = newHtml.replace(/ENTITY_NAME/g, attr.entity.codeName);
            newHtml = newHtml.replace(/ENTITY_URL_NAME/g, attr.entity.codeName.substring(2));

            $("#widgets").append(newHtml);

            domHelper.read(workspacePath+'/views/'+attr.entity.codeName+'/list_fields.dust').then(function($list) {
                try {
                    var thead = '<thead><tr>', tbody = '<tbody><!--{#'+attr.entity.codeName+'_lastrecords}--><tr class="widget-row hover" data-href="/'+attr.entity.codeName.substring(2)+'/show?id={id}">';
                    for (var i = 0; i < attr.columns.length; i++) {
                        var field = attr.columns[i].codeName.toLowerCase();
                        var type = $list('[data-field="'+field+'"]').data('type');
                        thead += '<th data-type="'+type+'"><!--{@__ key="entity.'+attr.entity.codeName+'.'+field+'" /}--></th>';
                        tbody += '<td data-type="'+type+'">{'+field+'}</td>';
                    }
                    thead += '</tr></thead>';
                    tbody += '</tr><!--{/'+attr.entity.codeName+'_lastrecords}--></tbody>';

                    $("#"+attr.entity.codeName.substring(2)+'_lastrecords').html(thead+tbody);
                    $("#"+attr.entity.codeName.substring(2)+'_lastrecords').attr('data-entity', attr.entity.codeName);
                    domHelper.write(layout_view_filename, $).then(function() {
                        callback(null, {message: 'structure.ui.widget.success', messageParams: [attr.widgetInputType, attr.module.name]});
                    });
                } catch(e) {
                    console.log(e);
                    callback(e);
                }
            });
        });
    });
}

exports.deleteWidget = function(attr, callback) {
    var workspacePath = __dirname+'/../workspace/'+attr.id_application;

    // Delete from controller
    var defaultFile = fs.readFileSync(workspacePath+'/routes/default.js', 'utf8');
    var regex = new RegExp("([^]*)(\\/\\/ \\*\\*\\* Widget call "+attr.entity.codeName+" "+attr.widgetType+" start \\| Do not remove \\*\\*\\*)([^]*)(\\/\\/ \\*\\*\\* Widget call "+attr.entity.codeName+" "+attr.widgetType+" end \\| Do not remove \\*\\*\\*)([^]*)", "g");
    defaultFile = defaultFile.replace(regex, '$1\n\t$5');
    fs.writeFileSync(workspacePath+'/routes/default.js', defaultFile, 'utf8');

    // Delete from view
    domHelper.read(workspacePath+'/views/default/'+attr.module.codeName+'.dust').then(function($) {

        for (var i = 0; i < attr.widgetTypes.length; i++) {
            var widgetElemId = attr.widgetTypes[i]+'_'+attr.entity.codeName+'_widget';

            // It is possible to have the same widgetType for the same entity
            // It results in a duplication of the ID, so we loop until there is none left
            while ($("#"+widgetElemId).length > 0)
                $("#"+widgetElemId).remove();
        }

        domHelper.write(workspacePath+'/views/default/'+attr.module.codeName+'.dust', $).then(function() {
            callback(null, {message: "structure.ui.widget.delete", messageParams: [attr.widgetInputType]});
        });
    }).catch(function(e) {
        callback(e);
    });
}