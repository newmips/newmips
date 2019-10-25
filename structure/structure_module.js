const fs = require("fs-extra");
const domHelper = require('../utils/jsDomHelper');
const translateHelper = require("../utils/translate");
const dataHelper = require('../utils/data_helper');

exports.setupModule = async (data) => {

    let appName = data.app_name;

    // Initialize variables according to options
    let name_module = data.options.value;
    let show_name_module = data.options.showValue;
    let url_name_module = data.options.urlValue;

    // Read routes/default.js file
    let file = __dirname + '/../workspace/' + appName + '/routes/default.js';

    let defaultjs = fs.readFileSync(file, 'utf8');
    // Add new module route to routes/default.js file
    let str = '// *** Dynamic Module | Do not remove ***\n\n';
    str += 'router.get(\'/' + url_name_module.toLowerCase() + '\', block_access.isLoggedIn, block_access.moduleAccessMiddleware("' + url_name_module + '"), function(req, res) {\n';
    str += '    res.render(\'default/' + name_module.toLowerCase() + '\');\n';
    str += '});';
    let result = defaultjs.replace('// *** Dynamic Module | Do not remove ***', str);

    fs.writeFileSync(file, result, 'utf8');

    // Create views/default/MODULE_NAME.dust file
    let fileToCreate = __dirname + '/../workspace/' + appName + '/views/default/' + name_module.toLowerCase() + '.dust';
    fs.copySync(__dirname + '/pieces/views/default/custom_module.dust', fileToCreate);

    // Replace all variables 'custom_module' in new created file
    let dataDust = fs.readFileSync(fileToCreate, 'utf8');

    // Replace custom_module occurence and write to file
    let resultDust = dataDust.replace(/custom_module/g, name_module.toLowerCase());
    if (name_module.toLowerCase() != "m_home") {
        let moduleAriane = "" +
            "<li class='active'>" +
            "   <!--{#__ key=\"module." + name_module.toLowerCase() + "\"/}-->" +
            "</li>";
        resultDust = resultDust.replace(/<!-- NEW MODULE -->/g, moduleAriane);
    }
    resultDust = resultDust.replace(/custom_show_module/g, show_name_module.toLowerCase());

    fs.writeFileSync(fileToCreate, resultDust, 'utf8');

    await translateHelper.writeLocales(appName, "module", name_module, show_name_module, data.googleTranslate)

    // Create module's layout file
    file = __dirname + '/../workspace/' + appName + '/views/layout_' + name_module.toLowerCase() + '.dust';
    fs.copySync(__dirname + '/pieces/views/layout_custom_module.dust', file);

    // Loop over module list to add new module's <option> tag in all modules <select> tags
    let promises = [];
    let modules = data.modules;

    for (let i = 0; i < modules.length; i++) {
        promises.push((async () => {
            let fileName = __dirname + '/../workspace/' + appName + '/views/layout_' + modules[i].name + '.dust';
            let $ = await domHelper.read(fileName);
            $("#dynamic_select").empty();
            let option = "\n";
            for (let j = 0; j < modules.length; j++) {
                option += '<!--{#moduleAccess module="' + modules[j].name.substring(2) + '"}-->\n';
                option += '     <option data-module="' + modules[j].name + '" value="/default/' + dataHelper.removePrefix(modules[j].name, "module") + '" ' + (modules[i].name == modules[j].name ? 'selected' : '') + '>\n';
                option += '         <!--{#__ key="module.' + modules[j].name + '" /}-->\n';
                option += '     </option>\n';
                option += '<!--{/moduleAccess}-->\n';
            }
            $("#dynamic_select").append(option);
            await domHelper.write(fileName, $);
        })());
    }

    // Wait for all the layouts to be modified before calling `callback()`
    await Promise.all(promises);

    // Access settings handling
    let accessPath = __dirname + '/../workspace/' + appName + '/config/access.json';
    let accessLockPath = __dirname + '/../workspace/' + appName + '/config/access.lock.json';
    let accessObject = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
    accessObject[url_name_module.toLowerCase()] = {groups: [], entities: []};
    fs.writeFileSync(accessPath, JSON.stringify(accessObject, null, 4), "utf8");
    fs.writeFileSync(accessLockPath, JSON.stringify(accessObject, null, 4), "utf8");

    return true;
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
        li += '<!--{#entityAccess entity="' + urlDataEntity.toLowerCase() + '"}-->\n';
        li += "     <li id='" + urlDataEntity.toLowerCase() + "_menu_item' style='display:block;' class='treeview'>\n";
        li += '         <a href="#">\n';
        li += '             <i class="fa fa-' + faIcon + '"></i>\n';
        li += '             <span><!--{#__ key="entity.' + nameDataEntity.toLowerCase() + '.label_entity" /}--></span>\n';
        li += '             <i class="fa fa-angle-left pull-right"></i>\n';
        li += '         </a>\n';
        li += '         <ul class="treeview-menu">\n';
        li += '             <!--{#actionAccess entity="' + urlDataEntity.toLowerCase() + '" action="create"}-->';
        li += '                 <li>\n';
        li += "                     <a href='/" + urlDataEntity.toLowerCase() + "/create_form'>\n";
        li += '                         <i class="fa fa-angle-double-right"></i>\n';
        li += '                         <!--{#__ key="operation.create" /}--> \n';
        li += '                     </a>\n';
        li += '                 </li>';
        li += '             <!--{/actionAccess}-->';
        li += '             <!--{#actionAccess entity="' + urlDataEntity.toLowerCase() + '" action="read"}-->';
        li += '                 <li>\n';
        li += "                     <a href='/" + urlDataEntity.toLowerCase() + "/list'>\n";
        li += '                         <i class="fa fa-angle-double-right"></i>\n';
        li += '                         <!--{#__ key="operation.list" /}--> \n';
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