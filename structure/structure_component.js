const fs = require("fs-extra");
const domHelper = require('../utils/jsDomHelper');
const translateHelper = require("../utils/translate");
const helpers = require("../utils/helpers");
const moment = require("moment");

async function addTab(entity, file, newLi, newTabContent) {
    let $ = await domHelper.read(file);

    // Tabs structure doesn't exist, create it
    var tabs = '';
    var context;
    if ($("#tabs").length == 0) {
        tabs = '\
        <div class="nav-tabs-custom" id="tabs">\n\
            <!--{^hideTab}-->\n\
                <ul class="nav nav-tabs">\n\
                    <li class="active">\n\
                        <a data-toggle="tab" href="#home">\n\
                            <!--{#__ key="entity.' + entity + '.label_entity" /}-->\n\
                        </a>\n\
                    </li>\n\
                </ul>\n\
            <!--{/hideTab}-->\n\
            <div class="tab-content" style="min-height:275px;">\n\
                <div id="home" class="tab-pane fade in active"></div>\n\
            </div>\n\
        </div>\n';

        context = $(tabs);
        $("#home", context).append($("#fields"));
        $("#home", context).append($(".actions"));
    } else
        context = $("#tabs");

    // Append created elements to `context` to handle presence of tab or not
    $(".nav-tabs", context).append(newLi);
    $(".tab-content", context).append('<!--{^hideTab}-->');
    $(".tab-content", context).append(newTabContent);
    $(".tab-content", context).append('<!--{/hideTab}-->');
    $('body').empty().append(context);

    return await domHelper.write(file, $);
}

function addAccessManagment(appName, urlComponent, urlModule) {
    // Write new data entity to access.json file, within module's context
    let accessPath = __dirname + '/../workspace/' + appName + '/config/access.json';
    let accessLockPath = __dirname + '/../workspace/' + appName + '/config/access.lock.json';
    let accessObject = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
    accessObject[urlModule.toLowerCase()].entities.push({
        name: urlComponent,
        groups: [],
        actions: {
            create: [],
            update: [],
            read: [],
            delete: []
        }
    });
    fs.writeFileSync(accessPath, JSON.stringify(accessObject, null, 4), "utf8");
    fs.writeFileSync(accessLockPath, JSON.stringify(accessObject, null, 4), "utf8");
}

function deleteAccessManagment(idApplication, urlComponent, urlModule, callback) {
    // Write new data entity to access.json file, within module's context
    var accessPath = __dirname + '/../workspace/' + idApplication + '/config/access.json';
    var accessLockPath = __dirname + '/../workspace/' + idApplication + '/config/access.lock.json';
    var accessObject = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
    if (accessObject[urlModule.toLowerCase()] && accessObject[urlModule.toLowerCase()].entities) {
        var entities = accessObject[urlModule.toLowerCase()].entities;
        var dataIndexToRemove = -1;
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].name === urlComponent) {
                dataIndexToRemove = i;
                break;
            }
        }
        if (dataIndexToRemove !== -1)
            entities.splice(dataIndexToRemove, 1);
        fs.writeFileSync(accessPath, JSON.stringify(accessObject, null, 4), "utf8");
        fs.writeFileSync(accessLockPath, JSON.stringify(accessObject, null, 4), "utf8");
        callback();
    } else
        callback();
}

function replaceValuesInFile(filePath, valueToFind, replaceWith) {
    var fileContent = fs.readFileSync(filePath, 'utf8');
    var reg = new RegExp(valueToFind, "g");
    fileContent = fileContent.replace(reg, replaceWith);
    fs.writeFileSync(filePath, fileContent);
}

exports.newLocalFileStorage = async (data) => {

    let componentName = data.options.value;
    let urlComponent = data.options.urlValue;
    let showComponentName = data.options.showValue;
    let source = data.entity.name;
    let urlSource = data.options.urlSource;
    let workspacePath = __dirname + '/../workspace/' + data.application.name;

    // CREATE MODEL FILE
    let modelTemplate = fs.readFileSync(__dirname + '/pieces/component/local_file_storage/models/model_local_file_storage.js', 'utf8');
    modelTemplate = modelTemplate.replace(/COMPONENT_NAME_LOWER/g, componentName);
    modelTemplate = modelTemplate.replace(/COMPONENT_NAME/g, componentName.charAt(0).toUpperCase() + componentName.toLowerCase().slice(1));
    modelTemplate = modelTemplate.replace(/TABLE_NAME/g, componentName);
    fs.writeFileSync(workspacePath + '/models/' + componentName + '.js', modelTemplate);

    // CREATE MODEL ATTRIBUTES FILE
    let attributesTemplate = fs.readFileSync(__dirname + '/pieces/component/local_file_storage/models/attributes/attributes_local_file_storage.json', 'utf8');
    fs.writeFileSync(workspacePath + '/models/attributes/' + componentName + '.json', attributesTemplate);

    // CREATE MODEL OPTIONS (ASSOCIATIONS) FILE
    let optionsTemplate = fs.readFileSync(__dirname + '/pieces/component/local_file_storage/models/options/options_local_file_storage.json', 'utf8');
    optionsTemplate = optionsTemplate.replace(/SOURCE_ENTITY_LOWER/g, source);
    fs.writeFileSync(workspacePath + '/models/options/' + componentName + '.json', optionsTemplate);

    // CREATE ROUTE FILE
    let routeTemplate = fs.readFileSync(__dirname + '/pieces/component/local_file_storage/routes/route_local_file_storage.js', 'utf8');
    routeTemplate = routeTemplate.replace(/COMPONENT_NAME_LOWER/g, componentName);
    routeTemplate = routeTemplate.replace(/COMPONENT_NAME_URL/g, componentName.substring(2));
    routeTemplate = routeTemplate.replace(/COMPONENT_NAME/g, componentName.charAt(0).toUpperCase() + componentName.slice(1));
    routeTemplate = routeTemplate.replace(/SOURCE_ENTITY_LOWER/g, source);
    routeTemplate = routeTemplate.replace(/SOURCE_URL_ENTITY_LOWER/g, urlSource);

    fs.writeFileSync(workspacePath + '/routes/' + componentName + '.js', routeTemplate);

    // Add access managment to the component route
    addAccessManagment(data.application.name, urlComponent, data.module_name.substring(2));

    /* --------------- New translation --------------- */
    await translateHelper.writeLocales(data.application.name, "component", componentName, showComponentName, data.googleTranslate);

    // GET COMPONENT PIECES TO BUILD STRUCTURE FILE
    let componentPiece = fs.readFileSync('./structure/pieces/component/local_file_storage/views/view_local_file_storage.dust', 'utf8');

    let componentContent = componentPiece.replace(/COMPONENT_NAME_LOWER/g, componentName);
    componentContent = componentContent.replace(/COMPONENT_URL_NAME_LOWER/g, urlComponent);
    componentContent = componentContent.replace(/SOURCE_LOWER/g, source);
    fs.mkdirSync(workspacePath + '/views/' + componentName, 0766);
    fs.writeFileSync(workspacePath + '/views/' + componentName + '/list_fields.dust', componentContent, 'utf8');

    let newLi = '<li><a id="' + componentName + '-click" data-toggle="tab" href="#' + componentName + '"><!--{#__ key="component.' + componentName + '.label_component" /}--></a></li>';
    let file = workspacePath + '/views/' + source + '/show_fields.dust';

    // CREATE THE TAB IN SHOW FIELDS
    let newTab = '<div id="' + componentName + '" class="ajax-tab tab-pane fade" data-tabtype="localfilestorage" data-asso-flag="{' + source + '.id}" data-asso-alias="' + componentName + '"><div class="ajax-content"></div></div>';
    await addTab(data.entity.name, file, newLi, newTab);
}

exports.newContactForm = function (attr, callback) {
    var idApp = attr.id_application;

    // Contact Form entity
    var codeName = attr.options.value;
    var showName = attr.options.showValue;
    var urlName = attr.options.urlValue.toLowerCase();

    // Contact Form Settings entity
    var codeNameSettings = attr.options.valueSettings;
    var showNameSettings = attr.options.showValueSettings;
    var urlNameSettings = attr.options.urlValueSettings;

    var workspacePath = __dirname + '/../workspace/' + idApp;
    var piecesPath = __dirname + '/../structure/pieces/component/contact_form';

    var toSyncObject = JSON.parse(fs.readFileSync(workspacePath + '/models/toSync.json'));
    if (typeof toSyncObject.queries !== "object")
        toSyncObject.queries = [];
    toSyncObject[idApp + "_" + codeNameSettings] = {};

    var mailConfigPath = workspacePath + "/config/mail.js";
    delete require.cache[require.resolve(mailConfigPath)];
    var mailConfig = require(mailConfigPath);

    let isSecure = mailConfig.transport.secure ? 1 : 0;
    var insertSettings = "INSERT INTO `" + idApp + "_" + codeNameSettings + "`(`version`, `f_transport_host`, `f_port`, `f_secure`, `f_user`, `f_pass`, `f_form_recipient`, `createdAt`, `updatedAt`)" +
            " VALUES(1,'" + mailConfig.transport.host + "'," +
            "'" + mailConfig.transport.port + "'," +
            isSecure + "," +
            "'" + mailConfig.transport.auth.user + "'," +
            "'" + mailConfig.transport.auth.pass + "'," +
            "'" + mailConfig.administrateur + "'," +
            "'" + moment().format("YYYY-MM-DD HH:mm:ss") + "'," +
            "'" + moment().format("YYYY-MM-DD HH:mm:ss") + "');";

    toSyncObject.queries.push(insertSettings);
    fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify(toSyncObject, null, 4));

    // Contact Form View
    fs.copySync(piecesPath + '/views/', workspacePath + '/views/' + codeName + '/');
    fs.unlinkSync(workspacePath + '/views/' + codeName + '/update.dust');
    fs.unlinkSync(workspacePath + '/views/' + codeName + '/update_fields.dust');

    // Contact Form Route
    // Unlink generated route to replace with our custom route file
    fs.unlinkSync(workspacePath + '/routes/' + codeName + '.js');
    fs.copySync(piecesPath + '/routes/route_contact_form.js', workspacePath + '/routes/' + codeName + '.js');

    var workspaceRoutePath = workspacePath + '/routes/' + codeName + '.js';
    var workspaceViewPath = workspacePath + '/views/' + codeName;

    replaceValuesInFile(workspaceRoutePath, "URL_VALUE_CONTACT", urlName);
    replaceValuesInFile(workspaceRoutePath, "URL_VALUE_SETTINGS", urlNameSettings);
    replaceValuesInFile(workspaceRoutePath, "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspaceRoutePath, "CODE_VALUE_SETTINGS", codeNameSettings);
    replaceValuesInFile(workspaceRoutePath, "MODEL_VALUE_CONTACT", codeName.charAt(0).toUpperCase() + codeName.toLowerCase().slice(1));
    replaceValuesInFile(workspaceRoutePath, "MODEL_VALUE_SETTINGS", codeNameSettings.charAt(0).toUpperCase() + codeNameSettings.toLowerCase().slice(1));

    replaceValuesInFile(workspaceViewPath + '/create.dust', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspaceViewPath + '/create.dust', "URL_VALUE_CONTACT", urlName);
    replaceValuesInFile(workspaceViewPath + '/create.dust', "CODE_VALUE_MODULE", attr.options.moduleName);

    replaceValuesInFile(workspaceViewPath + '/create_fields.dust', "CODE_VALUE_CONTACT", codeName);

    replaceValuesInFile(workspaceViewPath + '/show_fields.dust', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspaceViewPath + '/show_fields.dust', "URL_VALUE_CONTACT", urlName);

    replaceValuesInFile(workspaceViewPath + '/list.dust', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspaceViewPath + '/list.dust', "URL_VALUE_CONTACT", urlName);
    replaceValuesInFile(workspaceViewPath + '/list.dust', "CODE_VALUE_MODULE", attr.options.moduleName);

    replaceValuesInFile(workspaceViewPath + '/list_fields.dust', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspaceViewPath + '/list_fields.dust', "URL_VALUE_CONTACT", urlName);

    replaceValuesInFile(workspaceViewPath + '/settings.dust', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspaceViewPath + '/settings.dust', "URL_VALUE_CONTACT", urlName);
    replaceValuesInFile(workspaceViewPath + '/settings.dust', "CODE_VALUE_MODULE", attr.options.moduleName);

    replaceValuesInFile(workspaceViewPath + '/settings_fields.dust', "CODE_VALUE_SETTINGS", codeNameSettings);

    // Delete Contact Form Settings Route and Views
    fs.unlinkSync(workspacePath + '/routes/' + codeNameSettings + '.js');
    helpers.rmdirSyncRecursive(workspacePath + '/views/' + codeNameSettings + '/');

    // Locales FR
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "f_name"], "Nom");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "f_sender"], "Expediteur");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "f_recipient"], "Destinataire");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "r_user"], "Utilisateur");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "f_title"], "Titre");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "f_content"], "Contenu");

    translateHelper.updateLocales(idApp, "en-EN", ["entity", codeName, "sendMail"], "Send a mail");
    translateHelper.updateLocales(idApp, "en-EN", ["entity", codeName, "inbox"], "Sent box");
    translateHelper.updateLocales(idApp, "en-EN", ["entity", codeName, "settings"], "Settings");
    translateHelper.updateLocales(idApp, "en-EN", ["entity", codeName, "successSendMail"], "The email has been sent!");

    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "sendMail"], "Envoyer un mail");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "inbox"], "Boîte de réception");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "settings"], "Paramètres");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "successSendMail"], "Le mail a bien été envoyé !");

    translateHelper.updateLocales(idApp, "en-EN", ["entity", codeNameSettings, "label_entity"], "Settings");
    translateHelper.updateLocales(idApp, "en-EN", ["entity", codeNameSettings, "name_entity"], "Settings");
    translateHelper.updateLocales(idApp, "en-EN", ["entity", codeNameSettings, "plural_entity"], "Settings");

    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "label_entity"], "Paramètres");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "name_entity"], "Paramètres");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "plural_entity"], "Paramètres");

    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_transport_host"], "Hôte");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_port"], "Port");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_secure"], "Sécurisé");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_user"], "Utilisateur");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_pass"], "Mot de passe");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_form_recipient"], "Destinataire du formulaire");

    // If default name
    if (codeName == "e_contact_form")
        translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "label_entity"], "Formulaire de contact");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "name_entity"], "Formulaire de contact");
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "plural_entity"], "Formulaires de contact");

    var layoutFileName = __dirname + '/../workspace/' + idApp + '/views/layout_' + attr.options.moduleName.toLowerCase() + '.dust';
    domHelper.read(layoutFileName).then(function ($) {

        $("#" + urlName + "_menu_item").remove();
        $("#" + urlNameSettings + "_menu_item").remove();

        var li = '';
        li += "<!--{#entityAccess entity=\"" + urlName + "\"}-->\n";
        li += "		<li id=\"" + urlName + "_menu_item\" style=\"display:block;\" class=\"treeview\">\n";
        li += "			<a href=\"#\">\n";
        li += "    			<i class=\"fa fa-envelope\"></i>\n";
        li += "    			<span><!--{#__ key=\"entity." + codeName + ".label_entity\" /}--></span>\n";
        li += "    			<i class=\"fa fa-angle-left pull-right\"></i>\n";
        li += "			</a>\n";
        li += "			<ul class=\"treeview-menu\">\n";
        li += "    			<!--{#actionAccess entity=\"" + urlName + "\" action=\"create\"}-->\n";
        li += "    			<li>\n";
        li += "        			<a href=\"/" + urlName + "/create_form\">\n";
        li += "            			<i class=\"fa fa-paper-plane\"></i>\n";
        li += "            			<!--{#__ key=\"entity." + codeName + ".sendMail\" /}-->\n";
        li += "        			</a>\n";
        li += "    			</li>\n";
        li += "    			<!--{/actionAccess}-->\n";
        li += "    			<!--{#actionAccess entity=\"" + urlName + "\" action=\"read\"}-->\n";
        li += "    			<li>\n";
        li += "        			<a href=\"/" + urlName + "/list\">\n";
        li += "            			<i class=\"fa fa-inbox\"></i>\n";
        li += "            			<!--{#__ key=\"entity." + codeName + ".inbox\" /}-->\n";
        li += "        			</a>\n";
        li += "    			</li>\n";
        li += "    			<!--{/actionAccess}-->\n";
        li += "    			<!--{#actionAccess entity=\"" + urlNameSettings + "\" action=\"create\"}-->\n";
        li += "    			<li>\n";
        li += "        			<a href=\"/" + urlName + "/settings\">\n";
        li += "            			<i class=\"fa fa-cog\"></i>\n";
        li += "            			<!--{#__ key=\"entity." + codeName + ".settings\" /}-->\n";
        li += "        			</a>\n";
        li += "    			</li>\n";
        li += "    			<!--{/actionAccess}-->\n";
        li += "			</ul>\n";
        li += "		</li>\n\n";
        li += "<!--{/entityAccess}-->\n";

        // Add new html to document
        $('#sortable').append(li);

        // Write back to file
        domHelper.write(layoutFileName, $).then(function () {
            // Clean empty and useless dust helper created by removing <li>
            var layoutContent = fs.readFileSync(layoutFileName, 'utf8');

            // Remove empty dust helper
            layoutContent = layoutContent.replace(/{#entityAccess entity=".+"}\W*{\/entityAccess}/g, "");

            var writeStream = fs.createWriteStream(layoutFileName);
            writeStream.write(layoutContent);
            writeStream.end();
            writeStream.on('finish', function () {
                callback();
            });
        });
    }).catch(function (err) {
        callback(err, null);
    });
}

exports.newAgenda = function (attr, callback) {

    function setupComponentRouteForAgenda(idApplication, valueAgenda, valueEvent, valueCategory, callback) {

        var valueAgendaModel = valueAgenda.charAt(0).toUpperCase() + valueAgenda.toLowerCase().slice(1);
        var valueEventModel = valueEvent.charAt(0).toUpperCase() + valueEvent.toLowerCase().slice(1);
        var valueCategoryModel = valueCategory.charAt(0).toUpperCase() + valueCategory.toLowerCase().slice(1);

        var urlRouteAgenda = valueAgenda.substring(2).toLowerCase();

        // CREATE ROUTE FILE
        var routeTemplate = fs.readFileSync('./structure/pieces/component/agenda/routes/route_agenda.js', 'utf8');

        routeTemplate = routeTemplate.replace(/CODE_NAME_LOWER/g, valueAgenda);
        routeTemplate = routeTemplate.replace(/URL_ROUTE/g, urlRouteAgenda);

        routeTemplate = routeTemplate.replace(/CODE_NAME_EVENT_MODEL/g, valueEventModel);
        routeTemplate = routeTemplate.replace(/CODE_NAME_EVENT_URL/g, valueEvent.substring(2));

        routeTemplate = routeTemplate.replace(/CODE_NAME_CATEGORY_MODEL/g, valueCategoryModel);
        routeTemplate = routeTemplate.replace(/CODE_NAME_CATEGORY_URL/g, valueCategory.substring(2));

        var writeStream = fs.createWriteStream('./workspace/' + idApplication + '/routes/' + valueAgenda + '.js');
        writeStream.write(routeTemplate);
        writeStream.end();
        writeStream.on('finish', function () {
            callback();
        });
    }

    function setupComponentViewForAgenda(idApplication, valueComponent, valueEvent, moduleName, callback) {

        // Calendar View
        var codeName = valueComponent.toLowerCase();

        var componentViewFolder = __dirname + '/pieces/component/agenda/views';
        var viewsFolder = __dirname + '/../workspace/' + idApplication + '/views/' + codeName;
        fs.copySync(componentViewFolder, viewsFolder);

        var viewPiece = __dirname + '/../workspace/' + idApplication + '/views/agenda/view_agenda.dust';
        var viewFile = __dirname + '/../workspace/' + idApplication + '/views/' + codeName + '/view_agenda.dust';
        var urlEvent = valueEvent.toLowerCase().substring(2);

        var viewTemplate = fs.readFileSync(viewFile, 'utf8');
        viewTemplate = viewTemplate.replace(/CODE_NAME_LOWER/g, codeName);
        viewTemplate = viewTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);
        viewTemplate = viewTemplate.replace(/MODULE_NAME/g, moduleName);
        viewTemplate = viewTemplate.replace(/URL_ROUTE/g, codeName.substring(2));
        viewTemplate = viewTemplate.replace(/URL_EVENT/g, urlEvent);

        var writeStream = fs.createWriteStream(viewFile);
        writeStream.write(viewTemplate);
        writeStream.end();
        writeStream.on('finish', function () {

            // Copy the event view folder
            var componentEventViewFolder = __dirname + '/pieces/component/agenda/views_event';
            var eventViewsFolder = __dirname + '/../workspace/' + idApplication + '/views/' + valueEvent;

            fs.copySync(componentEventViewFolder, eventViewsFolder);

            // Replace variable in each files
            var fileToReplace = ["show_fields", "create_fields", "update_fields", "create", "update"];

            for (var i = 0; i < fileToReplace.length; i++) {
                var eventFile = __dirname + '/../workspace/' + idApplication + '/views/' + valueEvent + '/' + fileToReplace[i] + '.dust';
                var eventTemplate = fs.readFileSync(eventFile, 'utf8');

                eventTemplate = eventTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);
                eventTemplate = eventTemplate.replace(/URL_EVENT/g, urlEvent);
                eventTemplate = eventTemplate.replace(/MODULE_NAME/g, moduleName);

                fs.writeFileSync(eventFile, eventTemplate, 'utf8');
            }

            // Inject custom_js
            // var fileToInject = ["create", "update"];

            // for (var i = 0; i < fileToInject.length; i++) {
            //     var eventFile = __dirname + '/../workspace/' + idApplication + '/views/' + valueEvent + '/' + fileToInject[i] + '.dust';
            //     var eventTemplate = fs.readFileSync(eventFile, 'utf8');

            //     eventTemplate += "\n\n" +
            //             "{<custom_js}\n" +
            //             "    <script type='text/javascript'>\n" +
            //             "        var format;\n" +
            //             "        if (lang_user == 'fr-FR')\n" +
            //             "            format = 'DD/MM/YYYY HH:mm';\n" +
            //             "        else\n" +
            //             "            format = 'YYYY-MM-DD HH:mm';\n" +
            //             "        $(document).on('click', 'button[type=\"submit\"]', function(){\n" +
            //             "            if($('input[name=\"f_start_date\"]').val() != '' && $('input[name=\"f_end_date\"]').val() != ''){\n" +
            //             "                var start = moment($('input[name=\"f_start_date\"]').val(), format);\n" +
            //             "                var end = moment($('input[name=\"f_end_date\"]').val(), format);\n" +
            //             "                if(end.diff(start) < 0){\n" +
            //             "                    toastr.error(\"Error: Start date is after end date.\");\n" +
            //             "                    return false;\n" +
            //             "                }\n" +
            //             "            }\n" +
            //             "            if($('input[name=\"f_end_date\"]').val() != '' && $('input[name=\"f_start_date\"]').val() != ''){\n" +
            //             "                var start = moment($('input[name=\"f_start_date\"]').val(), format);\n" +
            //             "                var end = moment($('input[name=\"f_end_date\"]').val(), format);\n" +
            //             "                if(end.diff(start) < 0){\n" +
            //             "                    toastr.error(\"Error: End date is before start date.\");\n" +
            //             "                    return false;\n" +
            //             "                }\n" +
            //             "            }\n" +
            //             "            return true;" +
            //             "        });\n" +
            //             "        $(document).on('dp.change', 'input[name=\"f_start_date\"]', function(){\n" +
            //             "            if($(this).val() != '' && $('input[name=\"f_end_date\"]').val() != ''){\n" +
            //             "                var start = moment($(this).val(), format);\n" +
            //             "                var end = moment($('input[name=\"f_end_date\"]').val(), format);\n" +
            //             "                if(end.diff(start) < 0){\n" +
            //             "                    $(this).val('');\n" +
            //             "                }\n" +
            //             "            }\n" +
            //             "        });\n" +
            //             "        $(document).on('dp.change', 'input[name=\"f_end_date\"]', function(){\n" +
            //             "            if($(this).val() != '' && $('input[name=\"f_start_date\"]').val() != ''){\n" +
            //             "                var start = moment($('input[name=\"f_start_date\"]').val(), format);\n" +
            //             "                var end = moment($(this).val(), format);\n" +
            //             "                if(end.diff(start) < 0){\n" +
            //             "                    $(this).val('');\n" +
            //             "                }\n" +
            //             "            }\n" +
            //             "        });\n" +
            //             "    </script>\n" +
            //             "{/custom_js}\n";

            //     fs.writeFileSync(eventFile, eventTemplate, 'utf8');
            // }
            callback();
        });
    }

    var idApplication = attr.id_application;

    var valueComponent = attr.options.value;
    var valueComponentLower = valueComponent.toLowerCase();

    var showComponentName = attr.options.showValue;
    var showComponentNameLower = showComponentName.toLowerCase();

    var urlComponent = attr.options.urlValue.toLowerCase();

    var valueEvent = "e_" + urlComponent + "_event";
    var valueCategory = "e_" + urlComponent + "_category";

    var urlEvent = valueEvent.substring(2);
    var urlCategory = valueCategory.substring(2);

    // Update the event options.json to add an belongsToMany relation between event and user
    // var eventOptionsPath = './workspace/' + idApplication + '/models/options/' + valueEvent.toLowerCase() + '.json';
    // var eventOptionFile = fs.readFileSync(eventOptionsPath);
    // var eventOptionObj = JSON.parse(eventOptionFile);

    // eventOptionObj.push({
    //     "target": "e_user",
    //     "relation": "belongsToMany",
    //     "through": idApplication + "_" + urlComponent + "_event_user",
    //     "as": "r_users",
    //     "foreignKey": "event_id",
    //     "otherKey": "user_id"
    // });

    // fs.writeFileSync(eventOptionsPath, JSON.stringify(eventOptionObj, null, 4));

    // Agenda Route
    setupComponentRouteForAgenda(idApplication, valueComponent, valueEvent, valueCategory, function () {
        // Agenda view
        setupComponentViewForAgenda(idApplication, valueComponent, valueEvent, attr.options.moduleName, function () {
            // Add access managment to Agenda
            addAccessManagment(idApplication, urlComponent, attr.options.moduleName.substring(2), function () {
                // Add Event translation
                translateHelper.writeLocales(idApplication, "component", valueComponentLower, showComponentName, attr.googleTranslate, function () {

                    // FR translation of the component
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "label_entity"], "Événement");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "name_entity"], "Événement");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "plural_entity"], "Événement");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "f_title"], "Titre");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "f_place"], "Lieu");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "f_start_date"], "Date de début");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "f_end_date"], "Date de fin");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "f_all_day"], "Toute la journée");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "r_category"], "Catégorie");

                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueCategory, "label_entity"], "Catégorie");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueCategory, "name_entity"], "Catégorie");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueCategory, "plural_entity"], "Catégorie");
                    translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueCategory, "f_color"], "Couleur");

                    var layoutFileName = __dirname + '/../workspace/' + idApplication + '/views/layout_' + attr.options.moduleName.toLowerCase() + '.dust';
                    domHelper.read(layoutFileName).then(function ($) {

                        $("#" + urlEvent + "_menu_item").remove();
                        $("#" + urlCategory + "_menu_item").remove();

                        var li = '';
                        li += "<li id='" + urlComponent + "_menu_item' style='display:block;' class='treeview'>\n";
                        li += "    <a href='#'>\n";
                        li += "        <i class='fa fa-calendar-o'></i> <span><!--{#__ key=\"component." + valueComponentLower + ".label_component\" /}--></span>\n";
                        li += "            <i class='fa fa-angle-left pull-right'></i>\n";
                        li += "    </a>\n";
                        li += "    <ul class='treeview-menu'>\n";
                        li += "        <li><a href='/" + urlComponent + "'><i class='fa fa-calendar'></i> <!--{#__ key=\"global_component.agenda.menu\" /}--></a></li>\n";
                        li += "        <li id='" + urlEvent + "_menu_item' style='display:block;' class='treeview'>\n";
                        li += "            <a href='#'><i class='fa fa-calendar-plus-o'></i> <!--{#__ key=\"entity." + valueEvent + ".label_entity\" /}-->\n";
                        li += "                    <i class='fa fa-angle-left pull-right'></i>\n";
                        li += "            </a>\n";
                        li += "            <ul class='treeview-menu'>\n";
                        li += "                <li><a href='/" + urlEvent + "/create_form'><i class='fa fa-plus'></i><!--{#__ key=\"operation.create\" /}-->&nbsp;<!--{#__ key=\"entity." + valueEvent + ".label_entity\" /}--></a></li>\n";
                        li += "                <li><a href='/" + urlEvent + "/list'><i class='fa fa-list'></i><!--{#__ key=\"operation.list\" /}-->&nbsp;<!--{#__ key=\"entity." + valueEvent + ".plural_entity\" /}--></a></li>\n";
                        li += "            </ul>\n";
                        li += "        </li>\n";
                        li += "        <li id='" + urlCategory + "_menu_item' style='display:block;' class='treeview'>\n";
                        li += "            <a href='#'><i class='fa fa-bookmark'></i> <!--{#__ key=\"entity." + valueCategory + ".label_entity\" /}-->\n";
                        li += "                    <i class='fa fa-angle-left pull-right'></i>\n";
                        li += "            </a>\n";
                        li += "            <ul class='treeview-menu'>\n";
                        li += "                <li><a href='/" + urlCategory + "/create_form'><i class='fa fa-plus'></i><!--{#__ key=\"operation.create\" /}-->&nbsp;<!--{#__ key=\"entity." + valueCategory + ".label_entity\" /}--></a></li>\n";
                        li += "                <li><a href='/" + urlCategory + "/list'><i class='fa fa-list'></i><!--{#__ key=\"operation.list\" /}-->&nbsp;<!--{#__ key=\"entity." + valueCategory + ".plural_entity\" /}--></a></li>\n";
                        li += "            </ul>\n";
                        li += "        </li>\n";
                        li += "    </ul>\n";
                        li += "</li>\n";

                        // Add new html to document
                        $('#sortable').append(li);

                        // Write back to file
                        domHelper.write(layoutFileName, $).then(function () {

                            // Clean empty and useless dust helper created by removing <li>
                            var layoutContent = fs.readFileSync(layoutFileName, 'utf8');

                            // Remove empty dust helper
                            layoutContent = layoutContent.replace(/{#entityAccess entity=".+"}\W*{\/entityAccess}/g, "");

                            var writeStream = fs.createWriteStream(layoutFileName);
                            writeStream.write(layoutContent);
                            writeStream.end();
                            writeStream.on('finish', function () {
                                callback();
                            });
                        });
                    }).catch(function (err) {
                        callback(err, null);
                    });
                });
            });
        });
    });
}

exports.deleteAgenda = (attr, callback) => {

    let appID = attr.id_application;
    let urlComponent = attr.options.urlValue.toLowerCase();

    let baseFolder = __dirname + '/../workspace/' + appID;
    let layoutFileName = baseFolder + '/views/layout_' + attr.options.moduleName.toLowerCase() + '.dust';

    // Remove agenda controller
    fs.unlinkSync(baseFolder + '/routes/' + attr.options.value + '.js');

    // Delete views folder
    helpers.rmdirSyncRecursive(baseFolder + '/views/' + attr.options.value);

    domHelper.read(layoutFileName).then($ => {
        $("#" + urlComponent + "_menu_item").remove();
        // Write back to file
        domHelper.write(layoutFileName, $).then(_ => {

            // Clean empty and useless dust helper created by removing <li>
            let layoutContent = fs.readFileSync(layoutFileName, 'utf8');
            // Remove empty dust helper
            layoutContent = layoutContent.replace(/{#entityAccess entity=".+"}\W*{\/entityAccess}/g, "");

            let writeStream = fs.createWriteStream(layoutFileName);
            writeStream.write(layoutContent);
            writeStream.end();
            writeStream.on('finish', _ => {
                callback();
            });
        });
    }).catch(err => {
        callback(err, null);
    });
}

exports.newCra = function (attr, callback) {
    try {
        var workspacePath = __dirname + '/../workspace/' + attr.id_application;
        var piecesPath = __dirname + '/../structure/pieces/component/cra';

        // Copy pieces
        fs.copySync(piecesPath + '/routes/e_cra.js', workspacePath + '/routes/e_cra.js');
        fs.copySync(piecesPath + '/routes/e_cra_team.js', workspacePath + '/routes/e_cra_team.js');
        fs.copySync(piecesPath + '/views/e_cra/', workspacePath + '/views/e_cra/');
        fs.copySync(piecesPath + '/js/', workspacePath + '/public/js/Newmips/component/');

        // Replace layout to point to current module
        var files = ['admin_declare.dust', 'declare.dust', 'list.dust'];
        for (var i = 0; i < files.length; i++) {
            var view = fs.readFileSync(piecesPath + '/views/e_cra/' + files[i], 'utf8');
            view = view.replace(/MODULE_NAME/g, attr.module.codeName);
            fs.writeFileSync(workspacePath + '/views/e_cra/' + files[i], view, 'utf8');
        }

        // Create belongsToMany relation between team and activity for default activities
        var teamOptionsPath = workspacePath + '/models/options/e_cra_team.json';
        var teamOptionObj = require(teamOptionsPath);
        teamOptionObj.push({
            "target": "e_cra_activity",
            "relation": "belongsToMany",
            "through": attr.id_application + "_cra_activity_team",
            "as": "r_default_cra_activity",
            "foreignKey": "team_id",
            "otherKey": "activity_id"
        });
        fs.writeFileSync(teamOptionsPath, JSON.stringify(teamOptionObj, null, 4));

        var teamAttributesPath = workspacePath + '/models/attributes/e_cra_team.json';
        var teamAttributesObj = require(teamAttributesPath);
        teamAttributesObj.fk_id_admin_user = {type: "INTEGER", newmipsType: "integer"};
        fs.writeFileSync(teamAttributesPath, JSON.stringify(teamAttributesObj, null, 4));

        // Update user translations
        translateHelper.updateLocales(attr.id_application, "fr-FR", ["entity", "e_user", "as_r_users"], "Utilisateurs");
        translateHelper.updateLocales(attr.id_application, "fr-FR", ["entity", "e_user", "as_r_user"], "Utilisateur");

        // Add all cra locales EN/FR
        translateHelper.writeTree(attr.id_application, require(piecesPath + '/locales/en-EN'), 'en-EN');
        translateHelper.writeTree(attr.id_application, require(piecesPath + '/locales/fr-FR'), 'fr-FR');

        // Change CRA sidebar entry in current layout
        domHelper.read(workspacePath + '/views/layout_' + attr.module.codeName + '.dust').then(function ($) {
            var newLayoutLI = '';
            newLayoutLI += '<li>\n';
            newLayoutLI += '    <a href="/cra/declare">\n';
            newLayoutLI += '        <i class="fa fa-angle-double-right"></i>\n';
            newLayoutLI += '        <!--{#__ key="entity.e_cra.custom_button_declare" /}-->\n';
            newLayoutLI += '    </a>\n';
            newLayoutLI += '</li>\n';
            $("#cra_menu_item").find('li:first').replaceWith(newLayoutLI);
            domHelper.write(workspacePath + '/views/layout_' + attr.module.codeName + '.dust', $).then(function () {

                // Remove unwanted tab from user
                domHelper.read(workspacePath + '/views/e_user/show_fields.dust').then(function ($) {
                    $("#r_cra-click").parents('li').remove();
                    $("#r_cra").remove();
                    domHelper.write(workspacePath + '/views/e_user/show_fields.dust', $).then(function () {
                        callback(null, {message: 'Module C.R.A created'});
                    }).catch(callback);
                }).catch(callback);
            }).catch(callback);
        }).catch(callback);
    } catch (err) {
        callback(err);
    }
};

exports.newStatus = async (data) => {
    let workspacePath = __dirname + '/../workspace/' + data.application.name;
    let piecesPath = __dirname + '/../structure/pieces/component/status';
    let source = data.entity.name;

    // Rename history model, options, attributes files and view folder
    fs.renameSync(workspacePath + '/models/e_' + data.history_table_db_name + '.js', workspacePath + '/models/e_' + data.history_table + '.js');
    fs.renameSync(workspacePath + '/models/attributes/e_' + data.history_table_db_name + '.json', workspacePath + '/models/attributes/e_' + data.history_table + '.json');
    fs.renameSync(workspacePath + '/models/options/e_' + data.history_table_db_name + '.json', workspacePath + '/models/options/e_' + data.history_table + '.json');
    fs.renameSync(workspacePath + '/views/e_' + data.history_table_db_name, workspacePath + '/views/e_' + data.history_table);
    // Delete useless route and api history controllers
    fs.unlinkSync(workspacePath + '/routes/e_' + data.history_table_db_name + '.js');
    fs.unlinkSync(workspacePath + '/api/e_' + data.history_table_db_name + '.js');

    // Change model name of history table
    let historyModel = fs.readFileSync(workspacePath + '/models/e_' + data.history_table + '.js', 'utf8');
    historyModel = historyModel.replace(/e_[^_]_history_[^.]+.json/g, 'e_' + data.history_table + '.json');
    historyModel = historyModel.replace(/(buildAssociation\(')([^']+)'/, '$1E_' + data.history_table + '\'');
    historyModel = historyModel.replace(/(sequelize.define\(')([^']+)'/, '$1E_' + data.history_table + '\'');
    historyModel = historyModel.replace(/(addHooks\(Model, ')([^']+)'/, '$1' + data.history_table + '\'');
    fs.writeFileSync(workspacePath + '/models/e_' + data.history_table + '.js', historyModel, 'utf8');

    // Add virtual status field to source entity (s_statusName)
    let attributesObj = JSON.parse(fs.readFileSync(workspacePath + '/models/attributes/' + source + '.json'));
    attributesObj[data.options.value] = {
        type: "VIRTUAL",
        history_table: 'e_' + data.history_table_db_name,
        history_model: 'e_' + data.history_table
    };
    fs.writeFileSync(workspacePath + '/models/attributes/' + source + '.json', JSON.stringify(attributesObj, null, 4), 'utf8');

    // Replace history table name with history model name in access file
    let access = JSON.parse(fs.readFileSync(workspacePath + '/config/access.json', 'utf8'));
    for (let npsModule in access)
        for (let i = 0; i < access[npsModule].entities.length; i++)
            if (access[npsModule].entities[i].name == data.history_table_db_name)
                access[npsModule].entities[i].name = data.history_table;

    fs.writeFileSync(workspacePath + '/config/access.json', JSON.stringify(access, null, 4), 'utf8');
    fs.writeFileSync(workspacePath + '/config/access.lock.json', JSON.stringify(access, null, 4), 'utf8');

    // Change target of source entity to match history MODEL name (instead of TABLE name)
    let optionsObj = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + source + '.json'));
    for (let opt in optionsObj)
        if (optionsObj[opt].target == 'e_' + data.history_table_db_name)
            {optionsObj[opt].target = 'e_' + data.history_table;break;}
    fs.writeFileSync(workspacePath + '/models/options/' + source + '.json', JSON.stringify(optionsObj, null, 4), 'utf8');

    // Remove useless options on e_status
    let statusModel = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_status.json'));
    for (let i = 0; i < statusModel.length; i++)
        if (statusModel[i].target == 'e_' + data.history_table_db_name)
            {statusModel.splice(i, 1);break;}
    fs.writeFileSync(workspacePath + '/models/options/e_status.json', JSON.stringify(statusModel, null, 4), 'utf8');

    // Remove useless options on e_user (association hasMany with history table needs to be removed)
    let userModel = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_user.json'));
    for (let i = 0; i < userModel.length; i++)
        if (userModel[i].target == 'e_' + data.history_table_db_name)
            {userModel.splice(i, 1);break;}
    fs.writeFileSync(workspacePath + '/models/options/e_user.json', JSON.stringify(userModel, null, 4), 'utf8');

    // Remove useless options in toSync
    let toSync = JSON.parse(fs.readFileSync(workspacePath + '/models/toSync.json', 'utf8'));
    for (let prop in toSync) {
        if (prop.indexOf('_e_status') > 0) {
            for (let i = 0; i < toSync[prop].options.length; i++) {
                if (toSync[prop].options[i].target.indexOf("e_history_") != -1) {
                    toSync[prop].options.splice(i, 1);
                }
            }
        }
        if (prop.indexOf('_e_history_') > 0)
            toSync[prop].options = undefined;
    }

    fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify(toSync, null, 4), 'utf8');

    // Remove useless history tab from Status views
    let $ = await domHelper.read(workspacePath + "/views/e_status/show_fields.dust")

    let historyId = 'r_' + data.history_table;
    $("#" + historyId + "-click").parent().remove();
    $("#" + historyId).remove();
    await domHelper.write(workspacePath + "/views/e_status/show_fields.dust", $);

    // Replace traduction keys in show_fields
    let show_fieldsFILE = fs.readFileSync(workspacePath + "/views/" + source + "/show_fields.dust", 'utf8');
    let reg = new RegExp(data.history_table_db_name, 'g');
    show_fieldsFILE = show_fieldsFILE.replace(reg, data.history_table);
    fs.writeFileSync(workspacePath + "/views/" + source + "/show_fields.dust", show_fieldsFILE, 'utf8');
    let statusAlias = 'r_' + data.options.value.substring(2);
    let statusAliasHTML = 'f_' + data.options.value.substring(2);
    let statusAliasSubstring = statusAlias.substring(2);
    // Customize history tab list
    $ = await domHelper.read(workspacePath + '/views/e_' + data.history_table + '/list_fields.dust');

    // History list
    {
        // Remove buttons i.e last two th/td
        $("tbody tr td").slice(5, 7).remove();
        $("thead").each(function () {
            $(this).find("tr th").slice(5, 7).remove();
        });
        // Remove id column
        $("[data-field=id]").remove();
        // Add createdAt column in thead/tbody
        let newTh = '';
        newTh += '<th data-field="createdAt" data-col="createdAt" data-type="date">\n';
        newTh += '    <!--{#__ key="defaults.createdAt"/}-->\n';
        newTh += '</th>\n';
        $(".fields").each(function () {
            $(this).find("th:eq(0)").before(newTh);
        });
        $("#bodyTR td:eq(2)").after('<td data-field="createdAt" data-type="text">{createdAt|datetime}</td>');
        // Remove delete button
        $("#bodyTR td:last").remove();
    }

    // LOCALS
    {
        // Change history tab locales
        let localesFR = JSON.parse(fs.readFileSync(workspacePath + '/locales/fr-FR.json', 'utf8'));
        localesFR.entity['e_' + data.history_table_db_name]['as_r_history_' + data.options.urlValue] = "Historique " + data.options.showValue;
        localesFR.entity['e_' + data.history_table_db_name]['f_comment'] = "Commentaire";
        localesFR.entity['e_' + data.history_table_db_name]['r_modified_by'] = "Modifié par";
        localesFR.entity['e_' + data.history_table_db_name]['as_r_' + data.history_table] = "Historique " + statusAliasSubstring + " " + source.substring(2);
        localesFR.entity['e_' + data.history_table_db_name].label_entity = "Historique " + statusAliasSubstring + " " + source.substring(2);
        localesFR.entity['e_' + data.history_table_db_name].name_entity = "Historique " + statusAliasSubstring + " " + source.substring(2);
        localesFR.entity['e_' + data.history_table_db_name].plural_entity = "Historique " + statusAliasSubstring + " " + source.substring(2);
        // Rename traduction key to use history MODEL value, delete old traduction key
        localesFR.entity['e_' + data.history_table] = localesFR.entity['e_' + data.history_table_db_name];
        localesFR.entity['e_' + data.history_table_db_name] = undefined;
        // Change entity's status tab name for FR (Historique instead of History)
        localesFR.entity[source]['r_history_'+data.options.urlValue] = "Historique "+data.options.showValue;
        fs.writeFileSync(workspacePath + '/locales/fr-FR.json', JSON.stringify(localesFR, null, 4), 'utf8');

        let localesEN = JSON.parse(fs.readFileSync(workspacePath + '/locales/en-EN.json', 'utf8'));
        localesEN.entity['e_' + data.history_table_db_name]['as_r_' + data.history_table] = "History " + source.substring(2) + " " + statusAliasSubstring;
        localesEN.entity['e_' + data.history_table_db_name].label_entity = "History " + source.substring(2) + " " + statusAliasSubstring;
        localesEN.entity['e_' + data.history_table_db_name].name_entity = "History " + source.substring(2) + " " + statusAliasSubstring;
        localesEN.entity['e_' + data.history_table_db_name].plural_entity = "History " + source.substring(2) + " " + statusAliasSubstring;
        // Rename traduction key to use history MODEL value, delete old traduction key
        localesEN.entity['e_' + data.history_table] = localesEN.entity['e_' + data.history_table_db_name];
        localesEN.entity['e_' + data.history_table_db_name] = undefined;
        fs.writeFileSync(workspacePath + '/locales/en-EN.json', JSON.stringify(localesEN, null, 4), 'utf8');
    }

    await domHelper.write(workspacePath + '/views/e_' + data.history_table + '/list_fields.dust', $);

    // Replace history traductions with history_table key
    let listFields = fs.readFileSync(workspacePath + '/views/e_' + data.history_table + '/list_fields.dust', 'utf8');
    reg = new RegExp(data.history_table_db_name, 'g');
    listFields = listFields.replace(reg, data.history_table);
    fs.writeFileSync(workspacePath + '/views/e_' + data.history_table + '/list_fields.dust', listFields, 'utf8');

    // Display status as a badge instead of an input
    // Also add next status buttons after status field
    $ = await domHelper.read(workspacePath + '/views/' + source + '/show_fields.dust');

    let statusBadgeHtml = '<br>\n<span class="badge" style="background: {' + statusAlias + '.f_color};">{' + statusAlias + '.f_name}</span>';
    let nextStatusHtml = '';
    nextStatusHtml += '<div class="form-group">\n';
    nextStatusHtml += '     {#' + statusAlias + '.r_children ' + source.substring(2) + 'id=id}\n';
    nextStatusHtml += '         {#checkStatusPermission status=.}\n';
    nextStatusHtml += '             <a data-href="/' + source.substring(2) + '/set_status/{' + source.substring(2) + 'id}/{f_field}/{id}" data-comment="{f_comment}" class="status btn btn-info" style="margin-right: 5px;"><!--{^f_button_label}{f_name}{:else}{f_button_label}{/f_button_label}--></a>\n';
    nextStatusHtml += '         {/checkStatusPermission}\n';
    nextStatusHtml += '     {/' + statusAlias + '.r_children}\n';
    nextStatusHtml += '</div>\n';
    $("div[data-field='" + statusAliasHTML + "']").find('input').replaceWith(statusBadgeHtml);
    $("div[data-field='" + statusAliasHTML + "']").append(nextStatusHtml);
    // Input used for default ordering

    // Remove create button
    let historyTabId = "#r_history_" + data.options.urlValue;
    $(historyTabId).find('a.btn-success').remove();
    await domHelper.write(workspacePath + '/views/' + source + '/show_fields.dust', $);

    // Remove status field from update_fields and create_fields
    $ = await domHelper.read(workspacePath + '/views/' + source + '/create_fields.dust');
    $("div[data-field='" + statusAliasHTML + "']").remove();
    await domHelper.write(workspacePath + '/views/' + source + '/create_fields.dust', $);

    $ = await domHelper.read(workspacePath + '/views/' + source + '/update_fields.dust');
    $("div[data-field='" + statusAliasHTML + "']").remove();
    await domHelper.write(workspacePath + '/views/' + source + '/update_fields.dust', $);

    // Update list field to show status color in datalist
    $ = await domHelper.read(workspacePath + '/views/' + source + '/list_fields.dust');

    $("th[data-field='" + statusAlias + "']").each(function () {
        $(this).data("data-type", "status");
    });
    $("td[data-field='" + statusAlias + "']").data("data-type", "status");
    $("td[data-field='" + statusAlias + "']").data("data-color", "{" + statusAlias + ".f_color}");

    await domHelper.write(workspacePath + '/views/' + source + '/list_fields.dust', $)
    return await translateHelper.writeLocales(data.application.name, 'field', source, [data.options.value, data.options.showValue], false)
}

exports.deleteStatus = async (data) => {

    let workspacePath = __dirname + '/../workspace/' + data.application.name;

    // Delete history views
    helpers.rmdirSyncRecursive(workspacePath + '/views/' + data.historyName);
    // Delete history model
    fs.unlinkSync(workspacePath + '/models/' + data.historyName + '.js');
    fs.unlinkSync(workspacePath + '/models/attributes/' + data.historyName + '.json');
    fs.unlinkSync(workspacePath + '/models/options/' + data.historyName + '.json');

    // Add DROP TABLE query in toSync.json
    let toSyncObject = JSON.parse(fs.readFileSync(workspacePath + '/models/toSync.json', 'utf8'));
    if (typeof toSyncObject.queries !== "object")
        toSyncObject.queries = [];

    toSyncObject.queries.push("DROP TABLE " + data.historyTableName);
    fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify(toSyncObject, null, 4), 'utf8');

    // Clean attribute status field
    let attributesPath = workspacePath + '/models/attributes/' + data.entity + '.json';
    let attributes = JSON.parse(fs.readFileSync(attributesPath), 'utf8');
    for(let attribute in attributes)
        if(attribute == data.status_field)
            delete attributes[attribute];
    fs.writeFileSync(attributesPath, JSON.stringify(attributes, null, 4), 'utf8');

    // Clean options
    let source, options, idxToRemove;
    fs.readdirSync(workspacePath + '/models/options/').filter(file => {
        return file.indexOf('.') !== 0 && file.slice(-5) === '.json';
    }).forEach(file => {
        source = file.slice(0, -5);
        options = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + file));
        idxToRemove = [];

        // Looking for option link with history table
        for (let i = 0; i < options.length; i++){
            if(data.fk_status == options[i].foreignKey){
                // Status field relation
                idxToRemove.push(i);
            } else if (options[i].target == data.historyName){
                // History table relation
                idxToRemove.push(i);
            }
        }

        options = options.filter((val, idx, arr) => {
            return idxToRemove.indexOf(idx) == -1
        });

        fs.writeFileSync(workspacePath + '/models/options/' + file, JSON.stringify(options, null, 4), 'utf8')
    });

    let statusName = data.status_field.substring(2);

    // Remove status from views
    let $ = await domHelper.read(workspacePath + '/views/' + data.entity + '/show_fields.dust');
    $("div[data-field='f_" + statusName + "']").remove();
    $("a#r_history_" + statusName + "-click").parent().remove();
    $("div#r_history_" + statusName).remove();
    await domHelper.write(workspacePath + '/views/' + data.entity + '/show_fields.dust', $);

    $ = await domHelper.read(workspacePath + '/views/' + data.entity + '/print_fields.dust');
    $("div[data-field='f_" + statusName + "']").remove();
    $("a#r_history_" + statusName + "-click").parent().remove();
    $("div#r_history_" + statusName + "_print").remove();
    await domHelper.write(workspacePath + '/views/' + data.entity + '/print_fields.dust', $);

    $ = await domHelper.read(workspacePath + '/views/' + data.entity + '/list_fields.dust');
    $("th[data-field='r_" + statusName + "']").remove();
    await domHelper.write(workspacePath + '/views/' + data.entity + '/list_fields.dust', $);

    // Clean locales
    translateHelper.removeLocales(data.appID, 'entity', data.historyName, _ => {});
    translateHelper.removeLocales(data.appID, 'field', [data.entity, "r_history_" + statusName], _ => {});
    translateHelper.removeLocales(data.appID, 'field', [data.entity, "r_" + statusName], _ => {});
    translateHelper.removeLocales(data.appID, 'field', [data.entity, "s_" + statusName], _ => {});

    // Clean access
    let access = JSON.parse(fs.readFileSync(workspacePath + '/config/access.lock.json', 'utf8'));
    let idToRemove;
    for (let npsModule in access){
        idToRemove = false;
        for (let i = 0; i < access[npsModule].entities.length; i++)
            if (access[npsModule].entities[i].name == data.historyName.substring(2))
                idToRemove = i;

        if(idToRemove)
            access[npsModule].entities = access[npsModule].entities.filter((x, idx) => idx != idToRemove);
    }

    fs.writeFileSync(workspacePath + '/config/access.lock.json', JSON.stringify(access, null, 4), 'utf8');

    return true;
}

exports.setupChat = function (attr, callback) {
    try {
        let workspacePath = __dirname + '/../workspace/' + attr.id_application;
        var piecesPath = __dirname + '/../structure/pieces/component/socket';

        // Copy chat files
        fs.copySync(piecesPath + '/chat/js/chat.js', workspacePath + '/public/js/Newmips/component/chat.js');
        fs.copySync(piecesPath + '/chat/chat_utils.js', workspacePath + '/utils/chat.js');
        fs.copySync(piecesPath + '/chat/routes/chat.js', workspacePath + '/routes/chat.js');

        // Copy chat models
        var chatModels = ['e_channel', 'e_channelmessage', 'e_chatmessage', 'e_user_channel', 'e_user_chat', 'e_chat'];
        for (var i = 0; i < chatModels.length; i++) {
            fs.copySync(piecesPath + '/chat/models/' + chatModels[i] + '.js', workspacePath + '/models/' + chatModels[i] + '.js');
            var model = fs.readFileSync(workspacePath + '/models/' + chatModels[i] + '.js', 'utf8');
            model = model.replace(/ID_APPLICATION/g, attr.id_application);
            fs.writeFileSync(workspacePath + '/models/' + chatModels[i] + '.js', model, 'utf8');
        }
        // Copy attributes
        fs.copySync(piecesPath + '/chat/models/attributes/', workspacePath + '/models/attributes/');
        // Copy options
        fs.copySync(piecesPath + '/chat/models/options/', workspacePath + '/models/options/');

        // Add belongsToMany with e_channel to e_user, belongsToMany with e_user to e_chat
        var userOptions = JSON.parse(fs.readFileSync(workspacePath + '/models/options/e_user.json'));
        userOptions.push({
            target: 'e_chat',
            relation: 'belongsToMany',
            foreignKey: 'id_user',
            otherKey: 'id_chat',
            through: attr.id_application + '_chat_user_chat',
            as: 'r_chat'
        });
        userOptions.push({
            target: "e_channel",
            relation: "belongsToMany",
            foreignKey: "id_user",
            otherKey: "id_channel",
            through: attr.id_application + "_chat_user_channel",
            as: "r_user_channel"
        });
        fs.writeFileSync(workspacePath + '/models/options/e_user.json', JSON.stringify(userOptions, null, 4), 'utf8')

        // Replace ID_APPLICATION in channel.json and chat.json
        var option = fs.readFileSync(workspacePath + '/models/options/e_channel.json', 'utf8');
        option = option.replace(/ID_APPLICATION/g, attr.id_application);
        fs.writeFileSync(workspacePath + '/models/options/e_channel.json', option, 'utf8');
        var option = fs.readFileSync(workspacePath + '/models/options/e_chat.json', 'utf8');
        option = option.replace(/ID_APPLICATION/g, attr.id_application);
        fs.writeFileSync(workspacePath + '/models/options/e_chat.json', option, 'utf8');

        // Set socket and chat config to enabled/true
        var appConf = JSON.parse(fs.readFileSync(workspacePath + '/config/application.json'));
        appConf.socket.enabled = true;
        appConf.socket.chat = true;
        fs.writeFileSync(workspacePath + '/config/application.json', JSON.stringify(appConf, null, 4), 'utf8');

        // Add custom user_channel/user_chat columns to toSync file
        // Id will not be used but is required by sequelize to be able to query on the junction table
        var toSync = JSON.parse(fs.readFileSync(workspacePath + '/models/toSync.json'));
        toSync[attr.id_application + '_chat_user_channel'] = {
            attributes: {
                id_last_seen_message: {type: 'INTEGER', default: 0},
                id: {
                    type: "INTEGER",
                    autoIncrement: true,
                    primaryKey: true
                }
            },
            force: true
        };
        toSync[attr.id_application + '_chat_user_chat'] = {
            attributes: {
                id_last_seen_message: {type: 'INTEGER', default: 0},
                id: {
                    type: "INTEGER",
                    autoIncrement: true,
                    primaryKey: true
                }
            },
            force: true
        };
        fs.writeFileSync(workspacePath + '/models/toSync.json', JSON.stringify(toSync, null, 4), 'utf8');

        // Add chat locales
        var newLocalesEN = JSON.parse(fs.readFileSync(piecesPath + '/chat/locales/en-EN.json'));
        translateHelper.writeTree(attr.id_application, newLocalesEN, 'en-EN');
        var newLocalesFR = JSON.parse(fs.readFileSync(piecesPath + '/chat/locales/fr-FR.json'));
        translateHelper.writeTree(attr.id_application, newLocalesFR, 'fr-FR');

        // Add chat dust template to main_layout
        domHelper.read(workspacePath + '/views/main_layout.dust').then(function ($layout) {
            domHelper.read(piecesPath + '/chat/views/chat.dust').then(function ($chat) {
                $layout("#chat-placeholder").html($chat("body")[0].innerHTML);

                domHelper.writeMainLayout(workspacePath + '/views/main_layout.dust', $layout).then(function () {
                    callback(null);
                });
            });
        }).catch(function (e) {
            console.log(e);
            callback(e);
        });

    } catch (e) {
        console.log(e);
        callback(e);
    }
};

exports.addNewComponentAddress = function (attr, callback) {
    try {
        var application_path = __dirname + '/../workspace/' + attr.id_application + '/';
        var address_path = __dirname + '/pieces/component/address/';
        var address_utils = require(__dirname + '/pieces/component/address/utils/address_utils');
        var componentCodeName = attr.componentCodeName;
        var componentName = attr.componentName;
        var source = attr.entityCodeName;
        var componentUrl = 'e_address_' + attr.id_data_entity;
        var address_settings = "e_address_settings";
        //models
        var modelAttributes = JSON.parse(fs.readFileSync(address_path + 'models/attributes/e_address.json', 'utf8'));

        //generate views data
        var fields = address_utils.generateFields(componentName, componentCodeName);
        //Update model attributes
        for (var attribute in fields.db_fields) {
            modelAttributes[attribute] = fields.db_fields[attribute];
        }
        //save new model component attributes file
        fs.writeFileSync(application_path + 'models/attributes/' + componentCodeName + '.json', JSON.stringify(modelAttributes, null, 4), 'utf8');
        fs.copySync(address_path + 'models/options/e_address.json', application_path + 'models/options/' + componentCodeName + '.json');

        var createFieldsFile = application_path + 'views/' + source + '/' + 'create_fields.dust';
        var updateFieldsFile = application_path + 'views/' + source + '/' + 'update_fields.dust';
        var showFieldsFile = application_path + 'views/' + source + '/' + 'show_fields.dust';
        var printFieldsFile = application_path + 'views/' + source + '/' + 'print_fields.dust';

        var showHtml = fs.readFileSync(address_path + 'views/show.dust', 'utf8');
        showHtml = showHtml.replace(/COMPONENT_NAME/g, componentCodeName);

        var appendTo = '#fields';
        var mapsHtml = '<div id="' + componentCodeName + '" class="address_maps ' + componentCodeName + '" mapsid="' + componentCodeName + '" style="margin-top: 25px !important"></div>';
        fs.mkdirpSync(application_path + 'views/' + componentCodeName);
        fs.writeFileSync(application_path + 'views/' + componentCodeName + '/maps.dust', mapsHtml);
        fs.writeFileSync(application_path + 'views/' + componentCodeName + '/create_fields.dust', fields.createHtml);
        fs.writeFileSync(application_path + 'views/' + componentCodeName + '/update_fields.dust', fields.updateHtml);
        fs.writeFileSync(application_path + 'views/' + componentCodeName + '/fields.dust', fields.showFieldsHtml);
        fs.writeFileSync(application_path + 'views/' + componentCodeName + '/show.dust', showHtml);
        fs.writeFileSync(application_path + 'views/' + componentCodeName + '/list_fields.dust', fields.headers);

        domHelper.read(createFieldsFile).then(function ($createFieldsFile) {
            domHelper.read(updateFieldsFile).then(function ($updateFieldsFile) {
                domHelper.read(showFieldsFile).then(function ($showFieldsFile) {
                    domHelper.read(printFieldsFile).then(function ($printFieldsFile) {
                        $createFieldsFile(appendTo).append('<div data-field="' + componentCodeName + '" class="' + componentCodeName + ' fieldLineHeight col-xs-12">{>"' + componentCodeName + '/create_fields"/}</div>');
                        $updateFieldsFile(appendTo).append('<div data-field="' + componentCodeName + '" class="' + componentCodeName + ' fieldLineHeight col-xs-12">{>"' + componentCodeName + '/update_fields"/}</div>');
                        $showFieldsFile(appendTo).append('<div data-field="' + componentCodeName + '" class="' + componentCodeName + ' fieldLineHeight col-xs-12">{>"' + componentCodeName + '/show"/}</div>');
                        $printFieldsFile(appendTo).append('<div data-field="' + componentCodeName + '" class="' + componentCodeName + ' fieldLineHeight col-xs-12">{>"' + componentCodeName + '/show"/}</div>');
                        domHelper.write(createFieldsFile, $createFieldsFile).then(function () {
                            domHelper.write(updateFieldsFile, $updateFieldsFile).then(function () {
                                domHelper.write(showFieldsFile, $showFieldsFile).then(function () {
                                    domHelper.write(printFieldsFile, $printFieldsFile).then(function () {
                                        var parentBaseFile = application_path + 'views/' + attr.entityCodeName;
                                        require('./structure_field').updateListFile(parentBaseFile, 'list_fields', fields.singleAddressTableDFields.header, fields.singleAddressTableDFields.body, function () {
                                            //update locales
                                            var langFR = JSON.parse(fs.readFileSync(application_path + 'locales/fr-FR.json', 'utf8'));
                                            var langEN = JSON.parse(fs.readFileSync(application_path + 'locales/en-EN.json', 'utf8'));
                                            langFR.entity[componentCodeName] = fields.locales.fr;
                                            langFR.entity[source].r_address = 'Adresse';
                                            langEN.entity[componentCodeName] = fields.locales.en;
                                            langEN.entity[source].r_address = 'Address';

                                            // CREATE MODEL FILE
                                            let modelTemplate = fs.readFileSync(__dirname + '/../structure/pieces/component/address/models/model_address.js', 'utf8');
                                            modelTemplate = modelTemplate.replace(/COMPONENT_NAME_LOWER/g, componentCodeName);
                                            modelTemplate = modelTemplate.replace(/COMPONENT_NAME/g, componentCodeName.charAt(0).toUpperCase() + componentCodeName.toLowerCase().slice(1));
                                            modelTemplate = modelTemplate.replace(/TABLE_NAME/g, componentCodeName);
                                            fs.writeFileSync(application_path + 'models/' + componentCodeName + '.js', modelTemplate);

                                            //Check if component config exist, if not we create it
                                            var address_settings_config;
                                            var p = new Promise(function (resolve, reject) {
                                                fs.readFile(application_path + 'config/' + address_settings.substring(2) + '.json', function (err, config) {
                                                    if (err) {
                                                        //files doesn't exist
                                                        address_settings_config = {entities: {}};
                                                        //add settings locales
                                                        langFR.component[address_settings.substring(2)] = {
                                                            "label_component": "Configuration adresse",
                                                            "position": "Position de la carte",
                                                            "top": "Au dessus",
                                                            "right": "A droite",
                                                            "bottom": "En dessous",
                                                            "left": "A gauche",
                                                            "distance": "Afficher la distance",
                                                            "settings": "Configurer",
                                                            "enableMaps": "Activer la carte",
                                                            "entity": "Entité",
                                                            "zoomBar": "Afficher panneau de zoom",
                                                            "navigation": "Activer la navigation",
                                                            "mousePosition": "Afficher les coordonnées de la souris",
                                                            "addressNotValid": "Adresse non valide",
                                                            "info_address_maps": "Pour avoir une carte valide, veuillez utiliser le champ ci-dessous pour saisir l'adresse"
                                                        };
                                                        langEN.component[address_settings.substring(2)] = {
                                                            "label_component": "Addresses settings",
                                                            "position": "Map position",
                                                            "top": "Top",
                                                            "right": "Right",
                                                            "bottom": "Bottom",
                                                            "left": "Left",
                                                            "distance": "Display distance",
                                                            "settings": "Settings",
                                                            "enableMaps": "Enable Map",
                                                            "entity": "Entity",
                                                            "zoomBar": "Display zoom bar",
                                                            "navigation": "Enable navigation",
                                                            "mousePosition": "Display mouse coordinate",
                                                            "addressNotValid": "Not valid address",
                                                            "info_address_maps": "To have a valid map, please use the field below to enter the address"
                                                        };
                                                        //add component address files
                                                        fs.mkdirpSync(application_path + 'views/' + address_settings);
                                                        fs.copySync(address_path + 'views/config.dust', application_path + 'views/' + address_settings + '/config.dust');
                                                        fs.copySync(address_path + 'views/config_fields.dust', application_path + 'views/' + address_settings + '/config_fields.dust');
                                                        fs.copySync(address_path + 'route/' + address_settings.substring(2) + '.js', application_path + 'routes/' + address_settings + '.js');
                                                        addAccessManagment(attr.id_application, "address_settings", 'administration', function (err) {
                                                            if (err)
                                                                return reject(err);
                                                            //add new menu in administration for address settings
                                                            addMenuComponentAddressSettings(attr, address_settings, function (err) {
                                                                if (err)
                                                                    return reject(err);
                                                                resolve();
                                                            });
                                                        });
                                                    } else {
                                                        address_settings_config = JSON.parse(config);
                                                        resolve();
                                                    }
                                                });
                                            });
                                            p.then(function () {
                                                address_settings_config.entities[attr.entityCodeName] = {
                                                    "enableMaps": false,
                                                    "mapsPosition": {
                                                        "top": false,
                                                        "right": true,
                                                        "bottom": false,
                                                        "left": false
                                                    },
                                                    "estimateDistance": false,
                                                    "zoomBar": false,
                                                    "navigation": true,
                                                    "mousePosition": false
                                                };
                                                //set locales
                                                fs.writeFileSync(application_path + 'locales/fr-FR.json', JSON.stringify(langFR, null, 4), 'utf8');
                                                fs.writeFileSync(application_path + 'locales/en-EN.json', JSON.stringify(langEN, null, 4), 'utf8');
                                                //update or create address settings
                                                fs.writeFileSync(application_path + 'config/' + address_settings.substring(2) + '.json', JSON.stringify(address_settings_config, null, 4));
                                                callback(null);
                                            }).catch(function (e) {
                                                return callback(e);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    } catch (e) {
        callback(e);
    }
};

exports.deleteComponentAddress = function (attr, callback) {
    try {
        var componentName = 'address_' + attr.id_data_entity;
        let e_componentName='e_'+componentName;
        var source = attr.entityName;
        var application_path = __dirname + '/../workspace/' + attr.id_application + '/';
        fs.remove(application_path + 'views/' + e_componentName);
        fs.remove(application_path + 'models/' + e_componentName + '.js');
        fs.remove(application_path + 'models/attributes/' + e_componentName + '.json');
        fs.remove(application_path + 'models/options/' + e_componentName + '.json');
        var address_settings = "address_settings";
        //remove association
        var relations = JSON.parse(fs.readFileSync(application_path + 'models/options/' + source + '.json', 'utf8'));
        for (var i = 0; i < relations.length; i++) {
            var relation = relations[i];
            if (relation.as == 'r_address') {
                relations.splice(i, 1);
                break;
            }
        }
        //update relation file
        fs.writeFileSync(application_path + 'models/options/' + attr.entityName + '.json', JSON.stringify(relations, null, 4), 'utf8');
        var removeDiv = '.' + 'e_'+componentName;
        var createFieldsFile = application_path + 'views/' + source + '/' + 'create_fields.dust';
        var updateFieldsFile = application_path + 'views/' + source + '/' + 'update_fields.dust';
        var showFieldsFile = application_path + 'views/' + source + '/' + 'show_fields.dust';
        domHelper.read(createFieldsFile).then(function ($createFieldsFile) {
            domHelper.read(updateFieldsFile).then(function ($updateFieldsFile) {
                domHelper.read(showFieldsFile).then(function ($showFieldsFile) {
                    $createFieldsFile(removeDiv).remove();
                    $updateFieldsFile(removeDiv).remove();
                    $showFieldsFile(removeDiv).remove();
                    domHelper.write(createFieldsFile, $createFieldsFile).then(function () {
                        domHelper.write(updateFieldsFile, $updateFieldsFile).then(function () {
                            domHelper.write(showFieldsFile, $showFieldsFile).then(function () {
                                removeFieldInParentListField(application_path + 'views/' + attr.entityName + '/list_fields.dust', 'r_address', function () {
                                    //update locales
                                    var langFR = JSON.parse(fs.readFileSync(application_path + 'locales/fr-FR.json', 'utf8'));
                                    var langEN = JSON.parse(fs.readFileSync(application_path + 'locales/en-EN.json', 'utf8'));
                                    delete langFR.entity[e_componentName];
                                    delete langEN.entity[e_componentName];
                                    //update address settings file
                                    var address_settingsJson = JSON.parse(fs.readFileSync(application_path + 'config/address_settings.json'));
                                    for (var item in address_settingsJson.entities) {
                                        if (item === attr.entityName)
                                            delete address_settingsJson.entities[item];
                                    }
                                    var p = new Promise(function (resolve, reject) {
                                        if (Object.keys(address_settingsJson.entities).length === 0) {
                                            fs.remove(application_path + 'views/e_' + address_settings);
                                            fs.remove(application_path + 'routes/e_' + address_settings + '.js');
                                            fs.remove(application_path + 'config/' + address_settings + '.json');
                                            delete langFR.component[address_settings];
                                            delete langEN.component[address_settings];
                                            deleteAccessManagment(attr.id_application, "address_settings", "administration", function () {
                                                require('./structure_module').removeMenuEntry(attr, "administration", 'e_'+address_settings, function (err) {
                                                    if (err)
                                                        reject(err);
                                                    else
                                                        resolve();
                                                });
                                            });
                                        } else {
                                            fs.writeFileSync(application_path + 'config/address_settings.json', JSON.stringify(address_settingsJson, null, 4), 'utf8');
                                            resolve();
                                        }
                                    });
                                    p.then(function () {
                                        fs.writeFileSync(application_path + 'locales/fr-FR.json', JSON.stringify(langFR, null, 4), 'utf8');
                                        fs.writeFileSync(application_path + 'locales/en-EN.json', JSON.stringify(langEN, null, 4), 'utf8');
                                        callback(null);
                                    }).catch(function (e) {
                                        callback(e);
                                    });
                                });


                                function removeFieldInParentListField(viewsPath, name_data_field, callback) {
                                    domHelper.read(viewsPath).then(function ($) {
                                        $("th[data-field='" + name_data_field + "']").remove();
                                        $("td[data-field='" + name_data_field + "']").remove();
                                        domHelper.write(viewsPath, $).then(function () {
                                            callback();
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });
    } catch (e) {
        return callback(e);
    }
};

exports.createComponentDocumentTemplate = function (attr, callback) {
    try {
        var entity_name = 'document_template';
        var entity_code_name = "e_document_template";
        var application_path = __dirname + '/../workspace/' + attr.id_application + '/';
        if (attr.is_new_component_entity) {
            //Add structure files(models,route,views etc.
            var entity_path = __dirname + '/pieces/component/document_template/';
            var module_name = 'administration';
            var entity_url = 'document_template';
            var table_name = attr.id_application + '_' + entity_code_name;
            //models
            var modelContent = fs.readFileSync(entity_path + 'models/e_document_template.js', 'utf8');
            modelContent = modelContent.replace(/TABLE_NAME/g, table_name);
            modelContent = modelContent.replace(/MODEL_CODE_NAME/g, entity_code_name);
            //Now copy model files
            fs.copySync(entity_path + 'models/attributes/e_document_template.json', application_path + 'models/attributes/e_document_template.json');
            fs.copySync(entity_path + 'models/options/e_document_template.json', application_path + 'models/options/e_document_template.json');
            fs.writeFileSync(application_path + 'models/e_document_template.js', modelContent, 'utf8');
            //copy views files. To do after=> move directory
            fs.copySync(entity_path + 'views/create.dust', application_path + 'views/' + entity_code_name + '/create.dust');
            fs.copySync(entity_path + 'views/create_fields.dust', application_path + 'views/' + entity_code_name + '/create_fields.dust');
            fs.copySync(entity_path + 'views/list.dust', application_path + 'views/' + entity_code_name + '/list.dust');
            fs.copySync(entity_path + 'views/list_fields.dust', application_path + 'views/' + entity_code_name + '/list_fields.dust');
            fs.copySync(entity_path + 'views/show.dust', application_path + 'views/' + entity_code_name + '/show.dust');
            fs.copySync(entity_path + 'views/show_fields.dust', application_path + 'views/' + entity_code_name + '/show_fields.dust');
            fs.copySync(entity_path + 'views/update.dust', application_path + 'views/' + entity_code_name + '/update.dust');
            fs.copySync(entity_path + 'views/update_fields.dust', application_path + 'views/' + entity_code_name + '/update_fields.dust');
            fs.copySync(entity_path + 'views/readme.dust', application_path + 'views/' + entity_code_name + '/readme.dust');
            fs.copySync(entity_path + 'views/entity_helper_template.dust', application_path + 'views/' + entity_code_name + '/entity_helper_template.dust');
            fs.copySync(entity_path + 'views/global_variable_template.dust', application_path + 'views/' + entity_code_name + '/global_variable_template.dust');
            fs.copySync(entity_path + 'views/layout_document_template.dust', application_path + 'views/layout_document_template.dust');
            //copy helper
            fs.copySync(entity_path + 'utils/document_template_helper.js', application_path + 'utils/document_template_helper.js');
            fs.copySync(entity_path + 'locales/document_template_locales.js', application_path + 'locales/document_template_locales.js');
            //copy route file
            fs.copySync(entity_path + 'routes/e_document_template.js', application_path + 'routes/e_document_template.js');

            //add new entry for access
            addAccessManagment(attr.id_application, entity_url, module_name, function () {
                //now add tab for doc generation
                addNewTabComponentDocumentTemplate(attr, entity_name, function () {
                    //Set traduction
                    var lang_fr = {
                        label_entity: "Modèle de document",
                        name_entity: "Modèle de document",
                        plural_entity: "Modèle de documents",
                        id_entity: "ID",
                        f_name: "Nom du fichier",
                        f_file: "Fichier",
                        f_entity: "Entité",
                        f_exclude_relations: "Sous entités"
                    };
                    lang_fr[ "tab_name_e_" + attr.id_data_entity] = typeof attr.options.componentName !== "undefined" ? attr.options.componentName : "Modèle de document";
                    var lang_en = {
                        label_entity: "Document template",
                        name_entity: "Document template",
                        plural_entity: "Document templates",
                        id_entity: "ID",
                        f_name: "Filename",
                        f_file: "File",
                        f_entity: "Entity",
                        f_exclude_relations: "Sub entities"
                    };
                    lang_en[ "tab_name_e_" + attr.id_data_entity] = typeof attr.options.componentName !== "undefined" ? attr.options.componentName : "Document template";
                    //update locales
                    var langFR = JSON.parse(fs.readFileSync(application_path + 'locales/fr-FR.json', 'utf8'));
                    var langEN = JSON.parse(fs.readFileSync(application_path + 'locales/en-EN.json', 'utf8'));
                    langFR.entity[entity_code_name] = lang_fr;
                    langEN.entity[entity_code_name] = lang_en;
                    fs.writeFileSync(application_path + 'locales/fr-FR.json', JSON.stringify(langFR, null, 4), 'utf8');
                    fs.writeFileSync(application_path + 'locales/en-EN.json', JSON.stringify(langEN, null, 4), 'utf8');
                    //Now new Menu For Entity DocumentTemplate
                    require('./structure_module').addNewMenuEntry(attr.id_application, entity_code_name, entity_url, 'm_' + module_name, 'file-text', function () {
                        return callback(null);
                    });
                });
            });
        } else {
            //Update locales
            var langFR = JSON.parse(fs.readFileSync(application_path + 'locales/fr-FR.json', 'utf8'));
            var langEN = JSON.parse(fs.readFileSync(application_path + 'locales/en-EN.json', 'utf8'));
            langFR.entity[entity_code_name][ "tab_name_e_" + attr.id_data_entity] = typeof attr.options.componentName !== "undefined" ? attr.options.componentName : "Modèle de document";
            langEN.entity[entity_code_name][ "tab_name_e_" + attr.id_data_entity] = typeof attr.options.componentName !== "undefined" ? attr.options.componentName : "Document template";
            fs.writeFileSync(application_path + 'locales/fr-FR.json', JSON.stringify(langFR, null, 4), 'utf8');
            fs.writeFileSync(application_path + 'locales/en-EN.json', JSON.stringify(langEN, null, 4), 'utf8');
            addNewTabComponentDocumentTemplate(attr, entity_name, function (e) {
                return callback(e);
            });
        }
    } catch (e) {
        return callback(e);
    }
};

exports.deleteComponentDocumentTemplateOnEntity = function (attr, callback) {
    var application_path = __dirname + '/../workspace/' + attr.id_application + '/';
    var componentName = 'document_template';
    domHelper.read(application_path + 'views/' + attr.entityName + '/show_fields.dust').then(function ($showFieldsView) {
        $showFieldsView('#r_' + componentName + '-click').parent().remove(); //remove li tab
        $showFieldsView('#r_' + componentName).remove(); //remove tab content div
        domHelper.write(application_path + 'views/' + attr.entityName + '/show_fields.dust', $showFieldsView).then(function () {
            return callback(null);
        }).catch(function (e) {
            return callback(e);
        });
    }).catch(function (e) {
        return callback(e);
    });
}

exports.deleteComponentDocumentTemplate = function (attr, callback) {
    var application_path = __dirname + '/../workspace/' + attr.id_application + '/';
    var componentName = 'document_template';
    fs.remove(application_path + 'views/e_' + componentName);
    fs.remove(application_path + 'views/layout_document_template.dust');
    fs.remove(application_path + 'routes/e_' + componentName + '.js');
    fs.remove(application_path + 'models/e_' + componentName + '.js');
    fs.remove(application_path + 'models/attributes/e_' + componentName + '.json');
    fs.remove(application_path + 'models/options/e_' + componentName + '.json');

    //update locales
    var langFR = JSON.parse(fs.readFileSync(application_path + 'locales/fr-FR.json', 'utf8'));
    var langEN = JSON.parse(fs.readFileSync(application_path + 'locales/en-EN.json', 'utf8'));
    delete langFR.entity['e_' + componentName];
    delete langEN.entity['e_' + componentName];
    fs.writeFileSync(application_path + 'locales/fr-FR.json', JSON.stringify(langFR, null, 4), 'utf8');
    fs.writeFileSync(application_path + 'locales/en-EN.json', JSON.stringify(langEN, null, 4), 'utf8');
    //delete access json
    deleteAccessManagment(attr.id_application, componentName, "administration", function () {
        require('./structure_module').removeMenuEntry(attr, "administration", componentName, function (err) {
            callback(err);
        });
    });
}

function addNewTabComponentDocumentTemplate(attr, entity_name, callback) {
    var source = attr.options.source;
    var application_path = __dirname + '/../workspace/' + attr.id_application + '/';
    var entity_path = __dirname + '/pieces/component/document_template/';
    var relationEntityShowFieldsFile = application_path + 'views' + '/' + source + '/show_fields.dust';

    // New entry for source relation view
    var newLi = '<li><a id="r_' + entity_name + '-click" data-toggle="tab" href="#r_' + entity_name + '"><!--{#__ key="entity.e_document_template.tab_name_e_' + attr.id_data_entity + '" /}--></a></li>';
    var newTabContent = fs.readFileSync(entity_path + 'views/generate_doc.dust', 'utf8');
    var sourceDoc = source.substring(2);
    sourceDoc = sourceDoc.charAt(0).toUpperCase() + sourceDoc.slice(1);
    newTabContent = newTabContent.replace(/ENTITY_DOC/g, sourceDoc);
    newTabContent = newTabContent.replace(/ENTITY/g, source);
    addTab(attr.options.source, relationEntityShowFieldsFile, newLi, newTabContent).then(function () {
        callback(null);
    }).catch(function (e) {
        callback(e);
    });
}

function addMenuComponentAddressSettings(attr, urlDataEntity, callback) {
    var fileName = __dirname + '/../workspace/' + attr.id_application + '/views/layout_m_administration.dust';
    // Read file and get jQuery instance
    domHelper.read(fileName).then(function ($) {
        var li = '';
        // Create new html
        li += '<!--{#entityAccess entity="address_settings"}-->\n';
        li += '     <!--{#actionAccess entity="address_settings" action="create"}-->';
        li += "         <li id='" + urlDataEntity.toLowerCase() + "_menu_item' style='display:block;'>\n";
        li += '             <a href="/address_settings/config">\n';
        li += '                 <i class="fa fa-map-marker"></i>\n';
        li += '                 <span><!--{#__ key="component.' + urlDataEntity.substring(2).toLowerCase() + '.label_component" /}--></span>\n';
        li += '                 <i class="fa fa-angle-right pull-right"></i>\n';
        li += '             </a>\n';
        li += '         </li>\n';
        li += '     <!--{/actionAccess}-->';
        li += '<!--{/entityAccess}-->\n';

        // Add new html to document
        $('#sortable').append(li);
        // Write back to file
        domHelper.write(fileName, $).then(function () {
            callback(null);
        });
    });
}