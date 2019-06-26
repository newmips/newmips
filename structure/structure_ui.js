var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');

exports.setColumnVisibility = function (attr, callback) {
    var pathToViews = __dirname + '/../workspace/' + attr.id_application + '/views/' + attr.name_data_entity;

    var possibilityShow = ["show", "visible"];
    var possibilityHide = ["hide", "hidden", "non visible", "caché"];

    var attributes = attr.options.word.toLowerCase();
    var hide;

    if (possibilityHide.indexOf(attributes) != -1)
        hide = true;
    else if (possibilityShow.indexOf(attributes) != -1)
        hide = false;
    else {
        var err = new Error();
        err.message = "structure.field.attributes.notUnderstand";
        return callback(err);
    }

    domHelper.read(pathToViews + '/list_fields.dust').then(function ($) {
        if(attr.options.value == "f_id")
            attr.options.value = "id";
        if($("*[data-field='" + attr.options.value + "']").length > 0){
            //$("*[data-field='" + attr.options.value  + "']")[hide ? 'hide' : 'show']();
            $("*[data-field='" + attr.options.value + "']").attr("data-hidden", hide ? '1' : '0');
            domHelper.write(pathToViews + '/list_fields.dust', $).then(function () {
                var info = {};
                info.message = hide ? "structure.ui.columnVisibility.hide" : "structure.ui.columnVisibility.show";
                info.messageParams = [attr.options.showValue];
                callback(null, info);
            });
        }
        else {

            // Check if it's a related to field
            var fieldCodeName = "r_" + attr.options.value.substring(2);

            if($("*[data-field='" + fieldCodeName + "']").length > 0){
                //$("*[data-field='" + fieldCodeName + "']")[hide ? 'hide' : 'show']();
                $("*[data-field='" + fieldCodeName + "']").attr("data-hidden", hide ? '1' : '0');
                domHelper.write(pathToViews + '/list_fields.dust', $).then(function () {
                    var info = {};
                    info.message = hide ? "structure.ui.columnVisibility.hide" : "structure.ui.columnVisibility.show";
                    info.messageParams = [attr.options.showValue];
                    callback(null, info);
                });
            }
            else {
                // No column found
                var err = new Error();
                err.message = "structure.ui.columnVisibility.noColumn";
                err.messageParams = [attr.options.showValue];
                return callback(err);
            }
        }
    }).catch(function (err) {
        callback(err, null);
    });
}

exports.setLogo = function(attr, callback) {
    var idApplication = attr.id_application;
    var mainLayoutPath = __dirname + '/../workspace/' + idApplication + '/views/main_layout.dust';
    attr.options.value = attr.options.value.trim();

    //Check if logo exist
    if (!fs.existsSync(__dirname + '/../workspace/' + idApplication + '/public/img/logo/'+attr.options.value)) {
        var err = new Error();
        err.message = "preview.logo.notExist";
        return callback(err, null);
    }

    // Login Layout
    var loginPath = __dirname + '/../workspace/' + idApplication + '/views/login/';
    var loginFiles = ["login.dust", "first_connection.dust", "reset_password.dust"];
    for(var i=0; i<loginFiles.length; i++){
        (function(ibis){
            domHelper.read(loginPath+loginFiles[i]).then(function($) {
                if($("form .body center img").length > 0)
                    $("form .body center img").remove();
                $("form .body center").prepend("<img src='/img/logo/"+attr.options.value+"' alt='Login logo' width=\"50%\" height=\"50%\">");
                domHelper.write(loginPath+loginFiles[ibis], $).catch(function(err){
                    return callback(err, null);
                })
            }).catch(function(err){
                return callback(err, null);
            })
        })(i)
    }

    // Main Layout
    domHelper.read(mainLayoutPath).then(function($) {
        if($(".main-sidebar .sidebar .user-panel .image img").length > 0)
            $(".main-sidebar .sidebar .user-panel .image img").remove();
        $("body link[rel='icon']").remove();
        $("head link[rel='icon']").remove();
        $(".main-sidebar .sidebar .user-panel .image").prepend("<a href='/'><img src='/img/logo/"+attr.options.value+"' alt='Logo' ></a>");
        $("head").append("<link href='/img/logo/thumbnail/"+attr.options.value+"' rel=\"icon\" >");
        domHelper.writeMainLayout(mainLayoutPath, $).then(function() {
            var info = {};
            info.message = "preview.logo.add";
            callback(null, info);
        }).catch(function(err){
            callback(err, null);
        })
    }).catch(function(err){
        callback(err, null);
    })
}

exports.removeLogo = function(attr, callback) {
    var idApplication = attr.id_application;
    var mainLayoutPath = __dirname + '/../workspace/' + idApplication + '/views/main_layout.dust';
    var info = {};

    // Login Layout
    var loginPath = __dirname + '/../workspace/' + idApplication + '/views/login/';
    var loginFiles = ["login.dust", "first_connection.dust", "reset_password.dust"];
    for(var i=0; i<loginFiles.length; i++){
        (function(ibis){
            domHelper.read(loginPath+loginFiles[i]).then(function($) {
                if($("form .body center img").length > 0)
                    $("form .body center img").remove();
                $("form .body center").prepend("<img src='/img/logo_newmips.png' alt='Login logo' width=\"50%\" height=\"50%\">");
                domHelper.write(loginPath+loginFiles[ibis], $).catch(function(err){
                    return callback(err, null);
                })
            }).catch(function(err){
                return callback(err, null);
            })
        })(i)
    }

    // Main Layout
    domHelper.read(mainLayoutPath).then(function($) {
        if($(".main-sidebar .sidebar .user-panel .image img").length > 0){
            $(".main-sidebar .sidebar .user-panel .image img").remove();
            $("body link[rel='icon']").remove();
            $("head link[rel='icon']").remove();
            $("head").append("<link href=\"/FAVICON-COULEUR-01.png\" rel=\"icon\" type=\"image/png\"> ");
            info.message = "preview.logo.remove";
        }
        else
            info.message = "preview.logo.noLogo";
        domHelper.writeMainLayout(mainLayoutPath, $).then(function() {
            callback(null, info);
        }).catch(function(err){
            callback(err, null);
        })
    }).catch(function(err){
        callback(err, null);
    })
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

    if(layoutListAvailable.indexOf(askedLayout) != -1) {

        //var mainLayoutPath = __dirname + '/../workspace/' + idApplication + '/views/main_layout.dust';
        var moduleLayout = __dirname + '/../workspace/' + idApplication + '/views/layout_'+attr.currentModule.codeName+'.dust';

        domHelper.read(moduleLayout).then(function($) {
            var oldLayout = $("link[data-type='layout']").attr("data-layout");
            $("link[data-type='layout']").replaceWith("<link href='/css/AdminLteV2/layouts/layout-"+askedLayout+".css' rel='stylesheet' type='text/css' data-type='layout' data-layout='"+askedLayout+"'>\n");
            //$("body").removeClass("layout-"+oldLayout);
            //$("body").addClass("layout-"+askedLayout);
            domHelper.write(moduleLayout, $).then(function() {
                var info = {};
                info.message = "structure.ui.layout.success";
                info.messageParams = [attr.options.value, attr.currentModule.name];
                callback(null, info);
            });
        }).catch(function(err){
            callback(err, null);
        });
    }
    else {
        var err = new Error();
        err.message = "structure.ui.layout.cannotFind";
        var msgParams = "";
        for(var i=0; i<layoutListAvailable.length; i++)
            msgParams += "-  " + layoutListAvailable[i] + "<br>";
        err.messageParams = [msgParams];
        callback(err, null);
    }
}

exports.listLayout = function(attr, callback) {

    var idApplication = attr.id_application;

    var layoutPath = __dirname + '/../workspace/' + idApplication + '/public/css/AdminLteV2/layouts';
    var layoutsDir = fs.readdirSync(layoutPath).filter(function(file) {
        return (file.indexOf('.') !== 0) && (file.slice(-4) === '.css' && (file.slice(0, 1) !== '_'));
    });

    var layoutListAvailable = [];

    layoutsDir.forEach(function(file) {
        var layout = file.slice(7, -4);
        layoutListAvailable.push(layout);
    });

    var info = {};
    info.message = "structure.ui.layout.list";
    var msgParams = "";
    for(var i=0; i<layoutListAvailable.length; i++)
        msgParams += "-  " + layoutListAvailable[i] + "<br>";
    info.messageParams = [msgParams];
    callback(false, info);
}

exports.setTheme = function(attr, callback) {

    var idApplication = attr.id_application;
    var askedTheme = attr.options.value.toLowerCase();
    askedTheme = askedTheme.trim().replace(/ /g, "-");

    function retrieveTheme(themePath) {
        var themesDir = fs.readdirSync(themePath).filter(function(folder) {
            return (folder.indexOf('.') == -1);
        });

        var themeListAvailable = [];

        themesDir.forEach(function(theme) {
            themeListAvailable.push(theme);
        });

        return themeListAvailable;
    }

    var themeWorkspacePath = __dirname + '/../workspace/' + idApplication + '/public/themes';
    var themeListAvailableWorkspace = retrieveTheme(themeWorkspacePath);

    if (themeListAvailableWorkspace.indexOf(askedTheme) != -1)
        themeReady();
    else {
        // If not found in workspace, look for not imported theme exisiting in structure/template
        var themeTemplatePath = __dirname + '/../structure/template/public/themes';
        var themeListAvailableTemplate = retrieveTheme(themeTemplatePath);
        if (themeListAvailableTemplate.indexOf(askedTheme) != -1) {
            fs.copySync(themeTemplatePath + "/" + askedTheme + "/", themeWorkspacePath + "/" + askedTheme + "/");
            themeReady();
        } else {
            var err = new Error();
            err.message = "structure.ui.theme.cannotFind";
            var msgParams = "";
            for (var i = 0; i < themeListAvailableWorkspace.length; i++)
                msgParams += "-  " + themeListAvailableWorkspace[i] + "<br>";
            err.messageParams = [msgParams];
            callback(err, null);
        }
    }

    function themeReady() {
        let themeInformation = JSON.parse(fs.readFileSync(__dirname + "/../workspace/" + idApplication + "/public/themes/" + askedTheme + "/infos.json"));
        let promises = [];
        let layoutToWrite = ["main_layout", "login_layout"];

        for (let i = 0; i < layoutToWrite.length; i++) {
            promises.push(new Promise((resolve, reject) => {
                let layoutPath = __dirname + '/../workspace/' + idApplication + '/views/'+layoutToWrite[i]+'.dust';
                domHelper.read(layoutPath).then(function($) {
                    let oldTheme = $("link[data-type='theme']").attr("data-theme");
                    $("link[data-type='theme']").replaceWith("<link href='/themes/" + askedTheme + "/css/style.css' rel='stylesheet' type='text/css' data-type='theme' data-theme='" + askedTheme + "'>");
                    // If the theme need js inclusion
                    if (typeof themeInformation.js !== "undefined")
                        for (let j = 0; j < themeInformation.js.length; j++) {
                            $("body script:last").after("<script type='text/javascript'></script>");
                            $("body script:last").attr('src', "/themes/" + askedTheme + "/js/" + themeInformation.js[j]);
                        }
                    domHelper.writeMainLayout(layoutPath, $).then(_ => {
                        resolve();
                    });
                }).catch(function(err) {
                    reject(err);
                });
            }))
        }

        Promise.all(promises).then(_ => {
            callback(null, {
                message: "structure.ui.theme.successInstall",
                messageParams: [attr.options.value]
            });
        }).catch(err => {
            callback(err, null);
        })
    }
}

exports.listTheme = function(attr, callback) {

    var idApplication = attr.id_application;

    var themePath = __dirname + '/../workspace/' + idApplication + '/public/themes';
    var themesDir = fs.readdirSync(themePath).filter(function(folder) {
        return (folder.indexOf('.') == -1);
    });

    var themeListAvailable = [];

    themesDir.forEach(function(theme) {
        themeListAvailable.push(theme);
    });

    var info = {};
    info.message = "structure.ui.theme.list";
    var msgParams = "";
    for(var i=0; i<themeListAvailable.length; i++)
        msgParams += "-  " + themeListAvailable[i] + "<br>";
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

exports.addTitle = function (attr, callback) {

    let entityCodeName = attr.entityCodeName.toLowerCase();
    let pathToViews = __dirname + '/../workspace/' + attr.id_application + '/views/' + entityCodeName;
    let viewsToProcess = ["create_fields", "update_fields", "show_fields"];
    let processPromises = [];

    let title = "<div class='col-xs-12 text-center'>\n<div class='form-group form-title'>\n<h3>"+attr.options.value+"</h3>\n</div>\n</div>\n";

    for (var i = 0; i < viewsToProcess.length; i++) {
        processPromises.push(new Promise((resolve, reject) => {
            let currentView = viewsToProcess[i];
            domHelper.read(pathToViews + '/'+currentView+'.dust').then(function ($) {
                if(attr.options.afterField){
                    $("div[data-field="+attr.fieldCodeName+"]").after(title);
                } else {
                    $("#fields").append(title);
                }
                domHelper.write(pathToViews + '/'+currentView+'.dust', $).then(function () {
                    resolve();
                }).catch(e => {
                    var err = new Error();
                    err.message = "structure.field.attributes.fieldNoFound";
                    err.messageParams = [attr.options.showValue];
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        }))
    }

    Promise.all(processPromises).then(() => {
        callback(null, {
            message: "structure.ui.title.success"
        })
    }).catch(err => {
        callback(err);
    })
}

exports.createWidget = function(attr, callback) {
    var workspacePath = __dirname+'/../workspace/'+attr.id_application;
    var piecesPath = __dirname+'/pieces/';

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
                newHtml += '<!--{#entityAccess entity="'+attr.entity.codeName.substring(2)+'" }-->';
                newHtml += "<div id='"+widgetElemId+"' data-entity='"+attr.entity.codeName+"' data-widget-type='"+attr.widgetType+"' class='ajax-widget col-sm-3 col-xs-12'>\n";
                newHtml +=      $2("body")[0].innerHTML+"\n";
                newHtml += "</div>";
                newHtml += '<!--{/entityAccess}-->';
                newHtml = newHtml.replace(/ENTITY_NAME/g, attr.entity.codeName);
                newHtml = newHtml.replace(/ENTITY_URL_NAME/g, attr.entity.codeName.substring(2));
                $("#widgets").append(newHtml);

                // Set entity's icon class to widget
                $('i.'+attr.entity.codeName.substring(2)+'-icon').removeClass().addClass(entityIconClass+' '+attr.entity.codeName.substring(2)+'-icon');

                domHelper.write(layout_view_filename, $).then(function() {
                    callback(null, {message: "structure.ui.widget.success", messageParams: [attr.widgetInputType, attr.module.name]});
                }).catch(function(err) {
                    console.error(err)
                    callback(err);
                });
            });
        });
    });
}

exports.createWidgetPiechart = function(attr, callback) {
    var workspacePath = __dirname+'/../workspace/'+attr.id_application;
    var piecesPath = __dirname+'/pieces/';

    if (attr.found === false) {
        let definitlyNotFound = true;
        var options = JSON.parse(fs.readFileSync(workspacePath+'/models/options/'+attr.entity.codeName+'.json', 'utf8'));
        for (var j = 0; j < options.length; j++)
            if (attr.field.toLowerCase() == options[j].showAs.toLowerCase()) {
                attr.field = {name: options[j].showAs, codeName: options[j].as, type: options[j].newmipsType};
                definitlyNotFound = false;
                break;
            }
        if (definitlyNotFound)
            return callback(null, {message: 'structure.ui.widget.unknown_fields', messageParams: [definitlyNotFound.join(', ')]});
    }

    // Add widget to module's layout
    var layout_view_filename = workspacePath+'/views/default/'+attr.module.codeName+'.dust';
    domHelper.read(layout_view_filename).then(function($) {
        domHelper.read(piecesPath+'/views/widget/'+attr.widgetType+'.dust').then(function($2) {
            var widgetElemId = attr.widgetType+'_'+attr.entity.codeName+'_'+attr.field.codeName+'_widget';
            // Widget box title traduction
            $2(".box-title").html('<!--{#__ key="defaults.widgets.piechart.'+widgetElemId+'" /}-->');
            // Create widget's html
            var newHtml = "";
            newHtml += '<!--{#entityAccess entity="'+attr.entity.codeName.substring(2)+'" }-->';
            newHtml += "<div id='"+widgetElemId+"' data-entity='"+attr.entity.codeName+"' data-field-type='"+attr.field.type+"' data-field='"+attr.field.codeName+"' data-legend='"+attr.legend+"' data-widget-type='"+attr.widgetType+"' class='ajax-widget col-sm-4 col-xs-12'>\n";
            newHtml +=      $2("body")[0].innerHTML+"\n";
            newHtml += "</div>";
            newHtml += '<!--{/entityAccess}-->';
            $("#widgets").append(newHtml);
            domHelper.write(layout_view_filename, $).then(function() {

                // Add widget box traduction
                var tradFR = JSON.parse(fs.readFileSync(workspacePath+'/locales/fr-FR.json', 'utf8'));
                tradFR.defaults.widgets.piechart[widgetElemId] = 'Répartition '+attr.entity.name+' par '+attr.field.name;
                fs.writeFileSync(workspacePath+'/locales/fr-FR.json', JSON.stringify(tradFR, null, 4), 'utf8');
                var tradEN = JSON.parse(fs.readFileSync(workspacePath+'/locales/en-EN.json', 'utf8'));
                tradEN.defaults.widgets.piechart[widgetElemId] = attr.entity.name+' grouped by '+attr.field.name;
                fs.writeFileSync(workspacePath+'/locales/en-EN.json', JSON.stringify(tradEN, null, 4), 'utf8');

                callback(null, {message: 'structure.ui.widget.success', messageParams: [attr.widgetInputType, attr.module.name]});
            });
        });
    });
}

exports.createWidgetLastRecords = function(attr, callback) {
    var workspacePath = __dirname+'/../workspace/'+attr.id_application;
    var piecesPath = __dirname+'/pieces/';

    // Look for related to fields in entity's options
    var definitlyNotFound = [];
    var options = JSON.parse(fs.readFileSync(workspacePath+'/models/options/'+attr.entity.codeName+'.json', 'utf8'));
    for (var i = 0; i < attr.columns.length; i++) {
        if (attr.columns[i].found == true)
            continue;
        for (var j = 0; j < options.length; j++)
            if (attr.columns[i].name.toLowerCase() == options[j].showAs.toLowerCase()) {
                attr.columns[i] = {name: options[j].showAs, codeName: options[j].as, found: true};
                break;
            }
        if (!attr.columns[i].found)
            definitlyNotFound.push(attr.columns[i].name);
    }
    if (definitlyNotFound.length > 0)
        return callback(null, {message: 'structure.ui.widget.unknown_fields', messageParams: [definitlyNotFound.join(', ')]});

    if (!attr.columns || attr.columns.length == 0)
        return callback(null, {message: 'structure.ui.widget.no_fields'});

    var layout_view_filename = workspacePath+'/views/default/'+attr.module.codeName+'.dust';
    domHelper.read(layout_view_filename).then(function($) {
        domHelper.read(piecesPath+'/views/widget/'+attr.widgetType+'.dust').then(function($template) {
            var widgetElemId = attr.widgetType+'_'+attr.entity.codeName+'_widget';
            var newHtml = "";
            newHtml += '<!--{#entityAccess entity="'+attr.entity.codeName.substring(2)+'" }-->';
            newHtml += "<div id='"+widgetElemId+"' data-entity='"+attr.entity.codeName+"' data-widget-type='"+attr.widgetType+"' class='col-xs-12 col-sm-"+(attr.columns.length > 4 ? '12' : '6')+"'>\n";
            newHtml +=      $template("body")[0].innerHTML+"\n";
            newHtml += "</div>";
            newHtml += '<!--{/entityAccess}-->';
            newHtml = newHtml.replace(/ENTITY_NAME/g, attr.entity.codeName);
            newHtml = newHtml.replace(/ENTITY_URL_NAME/g, attr.entity.codeName.substring(2));
            $("#widgets").append(newHtml);

            domHelper.read(workspacePath+'/views/'+attr.entity.codeName+'/list_fields.dust').then(function($list) {
                try {
                    var thead = '<thead><tr>';
                    for (var i = 0; i < attr.columns.length; i++) {
                        var field = attr.columns[i].codeName.toLowerCase();
                        var type = $list('th[data-field="'+field+'"]').data('type');
                        var col = $list('th[data-field="'+field+'"]').data('col');
                        var fieldTradKey = field != 'id' ? field : 'id_entity';
                        thead += '<th data-field="'+field+'" data-type="'+type+'" data-col="'+col+'"><!--{#__ key="entity.'+attr.entity.codeName+'.'+fieldTradKey+'" /}--></th>';
                    }
                    thead += '</tr></thead>';

                    $("#"+attr.entity.codeName.substring(2)+'_lastrecords').html(thead);
                    $("#"+attr.entity.codeName.substring(2)+'_lastrecords').attr('data-limit', attr.limit);
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
    const workspacePath = __dirname+'/../workspace/'+attr.id_application;

    // Delete from view
    domHelper.read(workspacePath+'/views/default/'+attr.module.codeName+'.dust').then(function($) {
        let widgetElements = [];
        // For each widgetType, find corresponding divs using a regex on attr id
        for (const widgetType of attr.widgetTypes) {
            widgetElements = $("#widgets > div[data-widget-type="+widgetType+"]").filter(function() {
                // We don't know piechart's field, use regex to match rest of id
                const reg = widgetType == 'piechart' ? new RegExp('piechart_'+attr.entity.codeName+'_.*_widget') : new RegExp(widgetType+'_'+attr.entity.codeName+'_widget');
                return this.id.match(reg);
            });

            // Delete matched widget divs
            for (const elem of widgetElements)
                $(elem).remove();
        }

        domHelper.write(workspacePath+'/views/default/'+attr.module.codeName+'.dust', $).then(function() {
            callback(null, {message: "structure.ui.widget.delete", messageParams: [attr.widgetInputType]});
        });
    }).catch(function(e) {
        callback(e);
    });
}