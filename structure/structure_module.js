var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');
var translateHelper = require("../utils/translate");
var attrHelper = require('../utils/attr_helper');

exports.setupModule = function (attr, callback) {
    var idApp = attr.id_application;

    // Initialize variables according to options
    var options = attr.options;
    var name_module = options.value;
    var show_name_module = options.showValue;
    var url_name_module = options.urlValue;

    // Read routes/default.js file
    var file = __dirname + '/../workspace/' + idApp + '/routes/default.js';
    fs.readFile(file, 'utf8', function (err, data) {
        if (err)
            return callback(err, null);

        // Add new module route to routes/default.js file
        var str = '// *** Dynamic Module | Do not remove ***\n\n';
        str += 'router.get(\'/' + url_name_module.toLowerCase() + '\', block_access.isLoggedIn, block_access.moduleAccessMiddleware("' + url_name_module + '"), function(req, res) {\n';
        str += '    entity_helper.widgetsData("'+name_module+'").then((data)=> {\n';
        str += '        res.render(\'default/' + name_module.toLowerCase() + '\', data);\n';
        str += '    });\n'
        str += '});';
        var result = data.replace('// *** Dynamic Module | Do not remove ***', str);

        fs.writeFile(file, result, 'utf8', function (err) {
            if (err)
                return callback(err, null);

            // Create views/default/MODULE_NAME.dust file
            var fileToCreate = __dirname + '/../workspace/' + idApp + '/views/default/' + name_module.toLowerCase() + '.dust';
            fs.copy(__dirname + '/pieces/views/default/custom_module.dust', fileToCreate, function (err) {
                if (err)
                    return callback(err, null);

                //Replace all variables 'custom_module' in new created file
                fs.readFile(fileToCreate, 'utf8', function (err, dataDust) {
                    if (err)
                        return callback(err, null);

                    // Replace custom_module occurence and write to file
                    var resultDust = dataDust.replace(/custom_module/g, name_module.toLowerCase());
                    if (name_module.toLowerCase() != "m_home") {
                        var moduleAriane = "" +
                                "<li class='active'>" +
                                "   {@__ key=\"module." + name_module.toLowerCase() + "\"/}" +
                                "</li>";
                        resultDust = resultDust.replace(/<!-- NEW MODULE -->/g, moduleAriane);
                    }
                    resultDust = resultDust.replace(/custom_show_module/g, show_name_module.toLowerCase());
                    fs.writeFile(fileToCreate, resultDust, 'utf8', function (err) {
                        if (err)
                            return callback(err, null);

                        translateHelper.writeLocales(idApp, "module", name_module, show_name_module, attr.googleTranslate, function () {
                            // Create module's layout file
                            file = __dirname + '/../workspace/' + idApp + '/views/layout_' + name_module.toLowerCase() + '.dust';
                            fs.copy(__dirname + '/pieces/views/layout_custom_module.dust', file, function (err) {
                                if (err)
                                    return callback(err, null);

                                // Loop over module list to add new module's <option> tag in all modules <select> tags
                                var promises = [];
                                var modules = attr.modules;
                                var option;

                                for (var i = 0; i < modules.length; i++) {
                                    promises.push(new Promise(function (resolve, reject) {
                                        (function (ibis) {
                                            var fileName = __dirname + '/../workspace/' + idApp + '/views/layout_' + modules[ibis].codeName.toLowerCase() + '.dust';
                                            domHelper.read(fileName).then(function ($) {
                                                $("#dynamic_select").empty();
                                                option = "";
                                                for (var j = 0; j < modules.length; j++) {
                                                    option += '{@moduleAccess module="' + attrHelper.removePrefix(modules[j].codeName, "module") + '"}';
                                                    option += '<option data-module="' + modules[j].codeName.toLowerCase() + '" value="/default/' + attrHelper.removePrefix(modules[j].codeName, "module") + '" ' + (modules[ibis].name.toLowerCase() == modules[j].name.toLowerCase() ? 'selected' : '') + '>';
                                                    option += '{@__ key="module.' + modules[j].codeName.toLowerCase() + '" /}';
                                                    option += '</option>';
                                                    option += '{/moduleAccess}';
                                                }

                                                $("#dynamic_select").append(option);

                                                domHelper.write(fileName, $).then(function () {
                                                    resolve();
                                                });
                                            });
                                        })(i);
                                    }));
                                }

                                // Wait for all the layouts to be modified before calling `callback()`
                                Promise.all(promises).then(function () {
                                    var accessPath = __dirname + '/../workspace/' + idApp + '/config/access.json';
                                    var accessLockPath = __dirname + '/../workspace/' + idApp + '/config/access.lock.json';
                                    var accessObject = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
                                    accessObject[url_name_module.toLowerCase()] = {groups: [], entities: []};
                                    fs.writeFileSync(accessPath, JSON.stringify(accessObject, null, 4), "utf8");
                                    fs.writeFileSync(accessLockPath, JSON.stringify(accessObject, null, 4), "utf8");
                                    callback();
                                }).catch(function (err) {
                                    callback(err, null);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

exports.deleteModule = function (attr, callback) {
    var moduleFilename = 'layout_' + attr.module_name.toLowerCase() + '.dust';
    var layoutsPath = __dirname + '/../workspace/' + attr.id_application + '/views/';

    // Remove layout
    fs.unlinkSync(layoutsPath + moduleFilename);
    fs.unlinkSync(layoutsPath + "/default/" + attr.module_name.toLowerCase() + ".dust");

    // Clean default.js route GET
    var defaultRouteContent = fs.readFileSync(__dirname + '/../workspace/' + attr.id_application + '/routes/default.js', "utf8");
    var regex = new RegExp("router\\.get\\('\\/"+attr.module_name.toLowerCase().substring(2)+"'([\\s\\S]*?)(?=router)");
    defaultRouteContent = defaultRouteContent.replace(regex, "");
    fs.writeFileSync(__dirname + '/../workspace/' + attr.id_application + '/routes/default.js', defaultRouteContent);

    // Clean up access config
    var access = JSON.parse(fs.readFileSync(__dirname + '/../workspace/' + attr.id_application + '/config/access.json', 'utf8'));
    for (var module in access) {
        if (module == attr.module_name.toLowerCase().substring(2))
            delete access[module];
    }
    fs.writeFileSync(__dirname + '/../workspace/' + attr.id_application + '/config/access.json', JSON.stringify(access, null, 4));
    fs.writeFileSync(__dirname + '/../workspace/' + attr.id_application + '/config/access.lock.json', JSON.stringify(access, null, 4));

    function done(cpt, lenght) {
        if (cpt == lenght) {
            translateHelper.removeLocales(attr.id_application, "module", attr.module_name.toLowerCase(), function () {
                callback();
            });
        }
    }

    var cpt = 0;

    var layoutFiles = fs.readdirSync(layoutsPath).filter(function (file) {
        return file.indexOf('.') !== 0 && file.indexOf('layout_') === 0;
    });

    layoutFiles.forEach(function (file) {
        domHelper.read(layoutsPath + file).then(function ($) {
            $("option[data-module='" + attr.module_name.toLowerCase() + "']").remove();
            domHelper.write(layoutsPath + file, $).then(function () {
                done(++cpt, layoutFiles.length);
            });
        }).catch(function (err) {
            return callback(err, null);
        });
    });
}

exports.addNewMenuEntry = function (idApplication, nameDataEntity, urlDataEntity, nameModule, faIcon, callback) {
    var fileName = __dirname + '/../workspace/' + idApplication + '/views/layout_' + nameModule.toLowerCase() + '.dust';
    // Read file and get jQuery instance
    domHelper.read(fileName).then(function ($) {
        var li = '';
        // Create new html
        li += '<!--{@entityAccess entity="' + urlDataEntity.toLowerCase() + '"}-->\n';
        li += "     <li id='" + urlDataEntity.toLowerCase() + "_menu_item' style='display:block;' class='treeview'>\n";
        li += '         <a href="#">\n';
        li += '             <i class="fa fa-' + faIcon + '"></i>\n';
        li += '             <span><!--{@__ key="entity.' + nameDataEntity.toLowerCase() + '.label_entity" /}--></span>\n';
        li += '             <i class="fa fa-angle-left pull-right"></i>\n';
        li += '         </a>\n';
        li += '         <ul class="treeview-menu">\n';
        li += '             <!--{@actionAccess entity="' + urlDataEntity.toLowerCase() + '" action="create"}-->';
        li += '                 <li>\n';
        li += "                     <a href='/" + urlDataEntity.toLowerCase() + "/create_form'>\n";
        li += '                         <i class="fa fa-angle-double-right"></i>\n';
        li += '                         <!--{@__ key="operation.create" /}--> \n';
        li += '                     </a>\n';
        li += '                 </li>';
        li += '             <!--{/actionAccess}-->';
        li += '             <!--{@actionAccess entity="' + urlDataEntity.toLowerCase() + '" action="read"}-->';
        li += '                 <li>\n';
        li += "                     <a href='/" + urlDataEntity.toLowerCase() + "/list'>\n";
        li += '                         <i class="fa fa-angle-double-right"></i>\n';
        li += '                         <!--{@__ key="operation.list" /}--> \n';
        li += '                     </a>\n';
        li += '                 </li>\n';
        li += '             <!--{/actionAccess}-->';
        li += '         </ul>\n';
        li += '     </li>\n';
        li += '<!--{/entityAccess}-->\n';

        // Add new html to document
        $('#sortable').append(li);
        // Write back to file
        domHelper.write(fileName, $).then(function () {
            callback(null);
        });
    }).catch(function (err) {
        callback(err, null);
    });
}

exports.removeMenuEntry = function (attr, moduleName, entityName, callback) {
    var fileName = __dirname + '/../workspace/' + attr.id_application + '/views/layout_m_' + moduleName.toLowerCase() + '.dust';
    // Read file and get jQuery instance
    domHelper.read(fileName).then(function ($) {
        $('#' + entityName + '_menu_item').remove();
        // Write back to file
        domHelper.write(fileName, $).then(function () {
            callback(null);
        }).catch(function (e) {
            callback(e);
        });
    }).catch(function (err) {
        callback(err, null);
    });
};