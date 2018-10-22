var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');
var structure_field = require('./structure_data_field');
var helpers = require('../utils/helpers');
var translateHelper = require("../utils/translate");

//Create association between the models
exports.setupAssociation = function (associationOption, callback) {

    var idApp = associationOption.idApp;
    var source = associationOption.source;
    var target = associationOption.target;
    var foreignKey = associationOption.foreignKey;
    var as = associationOption.as;
    var showAs = associationOption.showAs;
    var relation = associationOption.relation;
    var through = associationOption.through;
    var toSync = associationOption.toSync;
    var type = associationOption.type;
    var targetType = associationOption.targetType;

    // SETUP MODEL OPTIONS FILE
    var optionsFileName = __dirname+'/../workspace/' + idApp + '/models/options/' + source.toLowerCase() + '.json';
    var optionsFile = fs.readFileSync(optionsFileName);
    var optionsObject = JSON.parse(optionsFile);

    var baseOptions = {target: target.toLowerCase(), relation: relation};
    baseOptions.foreignKey = foreignKey;
    baseOptions.as = as;
    baseOptions.showAs = showAs;

    if (relation == "belongsToMany") {
        baseOptions.through = through;
        baseOptions.foreignKey = "fk_id_" + source;
        baseOptions.otherKey = "fk_id_" + target;
        if(source == target)
            baseOptions.otherKey += "_bis";
    }
    if (typeof targetType !== "undefined")
        baseOptions.targetType = targetType;
    if (type != null)
        baseOptions.structureType = type;
    else
        baseOptions.structureType = "";

    // Save using field in related to and related to many fields
    if (typeof associationOption.usingField !== "undefined")
        baseOptions.usingField = associationOption.usingField;

    // Load this association directly in standard route data
    if (typeof associationOption.loadOnStart !== "undefined" && associationOption.loadOnStart)
        baseOptions.loadOnStart = true;

    optionsObject.push(baseOptions);

    if (toSync) {
        // SETUP toSync.json
        var toSyncFileName = __dirname+'/../workspace/' + idApp + '/models/toSync.json';
        var toSyncFile = fs.readFileSync(toSyncFileName);
        var toSyncObject = JSON.parse(toSyncFile);

        if (typeof toSyncObject[idApp + "_" + source.toLowerCase()] === "undefined") {
            toSyncObject[idApp + "_" + source.toLowerCase()] = {};
            toSyncObject[idApp + "_" + source.toLowerCase()].options = [];
        }
        else if (typeof toSyncObject[idApp + "_" + source.toLowerCase()].options === "undefined")
            toSyncObject[idApp + "_" + source.toLowerCase()].options = [];

        toSyncObject[idApp + "_" + source.toLowerCase()].options.push(baseOptions);
    }

    var writeStream = fs.createWriteStream(optionsFileName);
    writeStream.write(JSON.stringify(optionsObject, null, 4));
    writeStream.end();
    writeStream.on('finish', function () {
        if (toSync) {
            var writeStream2 = fs.createWriteStream(toSyncFileName);
            writeStream2.write(JSON.stringify(toSyncObject, null, 4));
            writeStream2.end();
            writeStream2.on('finish', function () {
                callback();
            });
        } else
            callback();
    });
}

// DataEntity
exports.setupDataEntity = function (attr, callback) {

    var id_application = attr.id_application;

    var name_module = attr.name_module;
    var show_name_module = attr.show_name_module;

    var displaySidebar = "block";

    // Creation d'entité dans le cas d'un related to, si l'entité target n'existe pas -> SubEntity
    if (attr.function === "createNewHasOne" || attr.function === 'createNewHasMany') {
        var name_data_entity = attr.options.target;
        var show_name_data_entity = attr.options.showTarget;
        var url_name_data_entity = attr.options.urlTarget;
        displaySidebar = "none";
    }
    // Creation d'une simple d'entité
    else {
        var name_data_entity = attr.options.value;
        // Value that will be put in traduction file and show in application
        var show_name_data_entity = attr.options.showValue;
        // Value that will be put in url
        var url_name_data_entity = attr.options.urlValue;
    }

    function createModelFile(idApplication, nameDataEntity, callback) {
        // CREATE MODEL FILE
        var modelTemplate = fs.readFileSync(`${__dirname}/pieces/models/data_entity.js`, 'utf8');
        modelTemplate = modelTemplate.replace(/MODEL_NAME_LOWER/g, nameDataEntity.toLowerCase());
        modelTemplate = modelTemplate.replace(/MODEL_NAME/g, nameDataEntity.charAt(0).toUpperCase() + nameDataEntity.toLowerCase().slice(1));
        modelTemplate = modelTemplate.replace(/TABLE_NAME/g, idApplication + '_' + nameDataEntity.toLowerCase());
        var writeStream = fs.createWriteStream(`${__dirname}/../workspace/${idApplication}/models/${nameDataEntity.toLowerCase()}.js`);
        writeStream.write(modelTemplate);
        writeStream.end();
        writeStream.on('finish', function () {
            callback();
        });
    }

    function createModelAttributesFile(idApplication, nameDataEntity, callback) {
        // CREATE MODEL ATTRIBUTES FILE
        var writeStream = fs.createWriteStream(__dirname+'/../workspace/' + idApplication + '/models/attributes/' + nameDataEntity.toLowerCase() + '.json');
        var baseAttributes = {
            "id": {
                "type": "INTEGER",
                "autoIncrement": true,
                "primaryKey": true
            },
            "version": {
                "type": "INTEGER",
                "defaultValue": 1
            }
        };
        writeStream.write(JSON.stringify(baseAttributes, null, 4));
        writeStream.end();
        writeStream.on('finish', function () {
            // CREATE MODEL OPTIONS (ASSOCIATIONS) FILE
            var writeStreamOption = fs.createWriteStream(__dirname+'/../workspace/' + idApplication + '/models/options/' + nameDataEntity.toLowerCase() + '.json');
            var baseOptions = [];
            writeStreamOption.write(JSON.stringify(baseOptions, null, 4));
            writeStreamOption.end();
            writeStreamOption.on('finish', function () {
                callback();
            });
        });
    }

    function createRouteFile(idApplication, nameDataEntity, urlDataEntity, callback) {
        // CREATE ROUTE FILE
        var routeTemplate = fs.readFileSync(__dirname+'/pieces/routes/data_entity.js', 'utf8');
        routeTemplate = routeTemplate.replace(/ENTITY_NAME/g, nameDataEntity.toLowerCase());
        routeTemplate = routeTemplate.replace(/ENTITY_URL_NAME/g, urlDataEntity.toLowerCase());
        routeTemplate = routeTemplate.replace(/MODEL_NAME/g, nameDataEntity.charAt(0).toUpperCase() + nameDataEntity.toLowerCase().slice(1));
        var writeStream = fs.createWriteStream(__dirname+'/../workspace/' + idApplication + '/routes/' + nameDataEntity.toLowerCase() + '.js');
        writeStream.write(routeTemplate);
        writeStream.end();
        writeStream.on('finish', function () {
            callback();
        });
    }

    function createApiFile(idApplication, nameDataEntity, callback) {
        // CREATE ROUTE FILE
        var apiTemplate = fs.readFileSync(__dirname+'/pieces/api/api_entity.js', 'utf8');
        apiTemplate = apiTemplate.replace(/ENTITY_NAME/g, nameDataEntity.toLowerCase());
        apiTemplate = apiTemplate.replace(/MODEL_NAME/g, nameDataEntity.charAt(0).toUpperCase() + nameDataEntity.toLowerCase().slice(1));
        var writeStream = fs.createWriteStream(__dirname+'/../workspace/' + idApplication + '/api/' + nameDataEntity.toLowerCase() + '.js');
        writeStream.write(apiTemplate);
        writeStream.end();
        writeStream.on('finish', function () {
            callback();
        });
    }

    function createLayoutFile(idApplication, nameDataEntity, urlDataEntity, nameModule, callback) {
        var fileName = __dirname + '/../workspace/' + idApplication + '/views/layout_' + nameModule.toLowerCase() + '.dust';
        // Read file and get jQuery instance
        domHelper.read(fileName).then(function ($) {
            var li = '';
            // Create new html
            li += '<!--{@entityAccess entity="' + urlDataEntity.toLowerCase() + '"}-->\n';
            li += "     <li id='" + urlDataEntity.toLowerCase() + "_menu_item' style='display:" + displaySidebar + ";' class='treeview'>\n";
            li += '         <a href="#">\n';
            li += '             <i class="fa fa-folder"></i>\n';
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
                callback();
            });
        }).catch(function (err) {
            console.error(err);
            callback(err, null);
        });
    }

    function replaceCustomModule(fileBase, file, nameModule, showNameModule, callback) {
        var fileToWrite = fileBase + '/' + file;
        data = fs.readFileSync(fileToWrite, 'utf8');
        var result = data.replace(/custom_module/g, nameModule.toLowerCase());
        result = result.replace(/custom_show_module/g, showNameModule.toLowerCase());

        if (nameModule.toLowerCase() != "m_home") {
            var htmlToAdd = "" +
                    "<li>" +
                    "   <a class='sub-module-arianne' href='/default/" + nameModule.toLowerCase().substring(2) + "'>" +
                    "       {@__ key=\"module." + nameModule.toLowerCase() + "\"/}" +
                    "   </a>" +
                    "</li>";

            result = result.replace(/<!-- SUB MODULE - DO NOT REMOVE -->/g, htmlToAdd);
        }

        var stream_file = fs.createWriteStream(fileToWrite);
        /* Node.js 0.10+ emits finish when complete */
        stream_file.write(result);
        stream_file.end();
        stream_file.on('finish', function () {
            callback();
        });
    }

    function replaceCustomDataEntity(fileBase, file, nameDataEntity, showNameDataEntity, urlDataEntity, callback) {
        var fileToWrite = fileBase + '/' + file;

        var data = fs.readFileSync(fileToWrite, 'utf8');
        var result = data.replace(/custom_data_entity/g, nameDataEntity.toLowerCase());
        result = result.replace(/custom_show_data_entity/g, showNameDataEntity.toLowerCase());
        result = result.replace(/custom_url_data_entity/g, urlDataEntity.toLowerCase());

        var stream_file = fs.createWriteStream(fileToWrite);

        stream_file.write(result);
        stream_file.end();
        stream_file.on('finish', function () {
            callback();
        });
    }

    createModelFile(id_application, name_data_entity, function () {
        createModelAttributesFile(id_application, name_data_entity, function () {
            createRouteFile(id_application, name_data_entity, url_name_data_entity, function () {
                createApiFile(id_application, name_data_entity, function () {
                    createLayoutFile(id_application, name_data_entity, url_name_data_entity, name_module, function () {
                        /* *** 5 - Copy CRUD view folder and customize them according to data entity properties *** */
                        fs.copySync(__dirname + '/pieces/views/entity', __dirname + '/../workspace/' + id_application + '/views/' + name_data_entity.toLowerCase());
                        var fileBase = __dirname + '/../workspace/' + id_application + '/views/' + name_data_entity.toLowerCase();

                        /* Replace all variables 'custom_module' in create.dust */
                        replaceCustomModule(fileBase, "create.dust", name_module, show_name_module, function () {
                            /* Replace all variables 'custom_data_entity' in create.dust */
                            replaceCustomDataEntity(fileBase, "create.dust", name_data_entity, show_name_data_entity, url_name_data_entity, function () {
                                /* Replace all variables 'custom_data_entity' in create_fields.dust */
                                replaceCustomDataEntity(fileBase, "create_fields.dust", name_data_entity, show_name_data_entity, url_name_data_entity, function () {
                                    /* Replace all variables 'custom_module' in show.dust */
                                    replaceCustomModule(fileBase, "show.dust", name_module, show_name_module, function () {
                                        /* Replace all variables 'custom_data_entity' in show.dust */
                                        replaceCustomDataEntity(fileBase, "show.dust", name_data_entity, show_name_data_entity, url_name_data_entity, function () {
                                            /* Replace all variables 'custom_data_entity' in show.dust */
                                            replaceCustomDataEntity(fileBase, "print_fields.dust", name_data_entity, show_name_data_entity, url_name_data_entity, function () {
                                                /* Replace all variables 'custom_data_entity' in show_fields.dust */
                                                replaceCustomDataEntity(fileBase, "show_fields.dust", name_data_entity, show_name_data_entity, url_name_data_entity, function () {
                                                    /* Replace all variables 'custom_module' in update.dust */
                                                    replaceCustomModule(fileBase, "update.dust", name_module, show_name_module, function () {
                                                        /* Replace all variables 'custom_data_entity' in update.dust */
                                                        replaceCustomDataEntity(fileBase, "update.dust", name_data_entity, show_name_data_entity, url_name_data_entity, function () {
                                                            /* Replace all variables 'custom_data_entity' in update_fields.dust */
                                                            replaceCustomDataEntity(fileBase, "update_fields.dust", name_data_entity, show_name_data_entity, url_name_data_entity, function () {
                                                                /* Replace all variables 'custom_module' in list.dust */
                                                                replaceCustomModule(fileBase, "list.dust", name_module, show_name_module, function () {
                                                                    /* Replace all variables 'custom_data_entity' in list.dust */
                                                                    replaceCustomDataEntity(fileBase, "list.dust", name_data_entity, show_name_data_entity, url_name_data_entity, function () {
                                                                        /* Replace all variables 'custom_data_entity' in list_fields.dust */
                                                                        replaceCustomDataEntity(fileBase, "list_fields.dust", name_data_entity, show_name_data_entity, url_name_data_entity, function () {

                                                                            // Write new data entity to access.json file, within module's context
                                                                            var accessPath = __dirname + '/../workspace/' + id_application + '/config/access.json';
                                                                            var accessLockPath = __dirname + '/../workspace/' + id_application + '/config/access.lock.json';
                                                                            var accessObject = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
                                                                            accessObject[name_module.substring(2).toLowerCase()].entities.push({
                                                                                name: url_name_data_entity,
                                                                                groups: [],
                                                                                actions: {
                                                                                    read: [],
                                                                                    create: [],
                                                                                    delete: [],
                                                                                    update: []
                                                                                }
                                                                            });
                                                                            fs.writeFileSync(accessPath, JSON.stringify(accessObject, null, 4), "utf8");
                                                                            fs.writeFileSync(accessLockPath, JSON.stringify(accessObject, null, 4), "utf8");
                                                                            /* --------------- New translation --------------- */
                                                                            translateHelper.writeLocales(id_application, "entity", name_data_entity, show_name_data_entity, attr.googleTranslate, function () {
                                                                                callback();
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
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

exports.deleteDataEntity = function (id_application, name_module, name_data_entity, url_name_data_entity, callback) {
    var baseFolder = __dirname + '/../workspace/' + id_application;

    // Delete views folder
    helpers.rmdirSyncRecursive(baseFolder + '/views/' + name_data_entity);
    // Delete route file
    fs.unlinkSync(baseFolder + '/routes/' + name_data_entity + '.js');
    // Delete API file
    fs.unlinkSync(baseFolder + '/api/' + name_data_entity + '.js');
    // Delete model file
    fs.unlinkSync(baseFolder + '/models/' + name_data_entity + '.js');
    // Delete options
    fs.unlinkSync(baseFolder + '/models/options/' + name_data_entity + '.json');
    // Delete attributes
    fs.unlinkSync(baseFolder + '/models/attributes/' + name_data_entity + '.json');

    // Remove relationships in options.json files
    var optionFiles = fs.readdirSync(baseFolder + '/models/options/');
    for (var file in optionFiles) {
        var options = require(baseFolder + '/models/options/' + optionFiles[file]);
        var optionsCpy = [];
        for (var i = 0; i < options.length; i++)
            if (options[i].target != name_data_entity)
                optionsCpy.push(options[i]);
        if (optionsCpy.length != options.length)
            fs.writeFileSync(baseFolder + '/models/options/' + optionFiles[file], JSON.stringify(optionsCpy, null, 4));
    }

    name_module = name_module.toLowerCase();

    // Clean up access config
    var access = JSON.parse(fs.readFileSync(baseFolder + '/config/access.json', 'utf8'));
    for (var i = 0; i < access[name_module.substring(2)].entities.length; i++)
        if (access[name_module.substring(2)].entities[i].name == url_name_data_entity)
            access[name_module.substring(2)].entities.splice(i, 1);
    fs.writeFileSync(baseFolder + '/config/access.json', JSON.stringify(access, null, 4));
    fs.writeFileSync(baseFolder + '/config/access.lock.json', JSON.stringify(access, null, 4));

    // Remove entity entry from layout select
    var filePath = __dirname + '/../workspace/' + id_application + '/views/layout_' + name_module + '.dust';
    domHelper.read(filePath).then(function ($) {
        $("#" + url_name_data_entity + '_menu_item').remove();
        domHelper.write(filePath, $).then(function () {
            translateHelper.removeLocales(id_application, "entity", name_data_entity, function () {
                callback();
            });
        });
    });
};

