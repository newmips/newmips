const fs = require("fs-extra");
const domHelper = require('../utils/jsDomHelper');
const structure_field = require('./structure_field');
const helpers = require('../utils/helpers');
const translateHelper = require("../utils/translate");

// Create entity associations between the models
exports.setupAssociation = (data) => {

    let workspacePath = __dirname+'/../workspace/' + data.application.name;
    let source = data.source;
    let target = data.target;
    let foreignKey = data.foreignKey;
    let as = data.as;
    let showAs = data.showAs;
    let relation = data.relation;
    let through = data.through;
    let toSync = data.toSync;
    let type = data.type;
    let constraints = data.constraints;
    let targetType = data.targetType;

    // SETUP MODEL OPTIONS FILE
    let optionsFileName = workspacePath + '/models/options/' + source + '.json';
    let optionsObject = JSON.parse(fs.readFileSync(optionsFileName));

    // If we are generating automatically a key and the alias is already used, then cancel
    for (let i = 0; i < optionsObject.length; i++)
        if(type == "auto_generate" && optionsObject[i].as == as)
            return;

    // Check for other auto_generate keys with same alias, if exist, remove it
    for (let i = 0; i < optionsObject.length; i++)
        if(optionsObject[i].as == as && optionsObject[i].type == "auto_generate")
            optionsObject.splice(i, 1);

    let baseOptions = {target: target, relation: relation};
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

    baseOptions.structureType = "";
    if (typeof targetType !== "undefined")
        baseOptions.targetType = targetType;
    if (type != null)
        baseOptions.structureType = type;

    if (constraints != null && !constraints)
        baseOptions.constraints = constraints;

    // Save using field in related to and related to many fields
    if (typeof data.usingField !== "undefined")
        baseOptions.usingField = data.usingField;

    // Load this association directly in standard route data
    if (typeof data.loadOnStart !== "undefined" && data.loadOnStart)
        baseOptions.loadOnStart = true;

    optionsObject.push(baseOptions);

    if (toSync) {
        // SETUP toSync.json
        let toSyncFileName = workspacePath + '/models/toSync.json';
        let toSyncObject = JSON.parse(fs.readFileSync(toSyncFileName));

        if (typeof toSyncObject[source] === "undefined") {
            toSyncObject[source] = {};
            toSyncObject[source].options = [];
        }
        else if (typeof toSyncObject[source].options === "undefined")
            toSyncObject[source].options = [];

        toSyncObject[source].options.push(baseOptions);
        fs.writeFileSync(toSyncFileName, JSON.stringify(toSyncObject, null, 4));
    }

    fs.writeFileSync(optionsFileName, JSON.stringify(optionsObject, null, 4));
    return;
}

exports.setupEntity = async (data) => {

    let module_name = data.np_module.name;
    let addInSidebar = true;

    let piecesPath = __dirname + "/pieces";
    let workspacePath = __dirname + '/../workspace/' + data.application.name;

    let entity_name, entity_url;
    if (data.function === "createNewHasOne" || data.function === 'createNewHasMany') {
        // Sub entity generation
        entity_name = data.options.target;
        entity_display_name = data.options.showTarget;
        entity_url = data.options.urlTarget;
        addInSidebar = false;
    } else {
        // Simple entity generation
        entity_name = data.options.value;
        entity_display_name = data.options.showValue;
        entity_url = data.options.urlValue;
    }

    let entity_model = entity_name.charAt(0).toUpperCase() + entity_name.toLowerCase().slice(1);

    // CREATE MODEL FILE
    let modelTemplate = fs.readFileSync(piecesPath + '/models/data_entity.js', 'utf8');
    modelTemplate = modelTemplate.replace(/MODEL_NAME_LOWER/g, entity_name);
    modelTemplate = modelTemplate.replace(/MODEL_NAME/g, entity_model);
    modelTemplate = modelTemplate.replace(/TABLE_NAME/g, entity_name);
    fs.writeFileSync(workspacePath+ '/models/'+entity_name+'.js', modelTemplate);

    // CREATE MODEL ATTRIBUTES FILE
    let baseAttributes = {
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
    fs.writeFileSync(workspacePath + '/models/attributes/' + entity_name + '.json', JSON.stringify(baseAttributes, null, 4));

    // CREATE MODEL OPTIONS (ASSOCIATIONS) FILE
    fs.writeFileSync(workspacePath + '/models/options/' + entity_name + '.json', JSON.stringify([], null, 4));

    // CREATE ROUTE FILE
    let routeTemplate = fs.readFileSync(piecesPath + '/routes/data_entity.js', 'utf8');
    routeTemplate = routeTemplate.replace(/ENTITY_NAME/g, entity_name);
    routeTemplate = routeTemplate.replace(/ENTITY_URL_NAME/g, entity_url);
    routeTemplate = routeTemplate.replace(/MODEL_NAME/g, entity_model);
    fs.writeFileSync(workspacePath + '/routes/' + entity_name + '.js', routeTemplate);

    // CREATE API FILE
    let apiTemplate = fs.readFileSync(piecesPath + '/api/api_entity.js', 'utf8');
    apiTemplate = apiTemplate.replace(/ENTITY_NAME/g, entity_name);
    apiTemplate = apiTemplate.replace(/MODEL_NAME/g, entity_model);
    fs.writeFileSync(workspacePath + '/api/' + entity_name + '.js', apiTemplate);

    // Add entity entry in the application module sidebar
    if(addInSidebar) {
        let fileName = workspacePath + '/views/layout_' + module_name + '.dust';
        // Read file and get jQuery instance
        let $ = await domHelper.read(fileName);
        let li = '';
        // Create new html
        li += '<!--{#entityAccess entity="' + entity_url + '"}-->\n';
        li += "     <li id='" + entity_url + "_menu_item' class='treeview'>\n";
        li += '         <a href="#">\n';
        li += '             <i class="fa fa-folder"></i>\n';
        li += '             <span><!--{#__ key="entity.' + entity_name + '.label_entity" /}--></span>\n';
        li += '             <i class="fa fa-angle-left pull-right"></i>\n';
        li += '         </a>\n';
        li += '         <ul class="treeview-menu">\n';
        li += '             <!--{#actionAccess entity="' + entity_url + '" action="create"}-->';
        li += '                 <li>\n';
        li += "                     <a href='/" + entity_url + "/create_form'>\n";
        li += '                         <i class="fa fa-angle-double-right"></i>\n';
        li += '                         <!--{#__ key="operation.create" /}--> \n';
        li += '                     </a>\n';
        li += '                 </li>';
        li += '             <!--{/actionAccess}-->';
        li += '             <!--{#actionAccess entity="' + entity_url + '" action="read"}-->';
        li += '                 <li>\n';
        li += "                     <a href='/" + entity_url + "/list'>\n";
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
        await domHelper.write(fileName, $);
    }

    // Copy CRUD view folder and customize them according to data entity properties
    fs.copySync(piecesPath + '/views/entity', workspacePath + '/views/' + entity_name);
    let fileBase = workspacePath + '/views/' + entity_name;

    let dustFiles = ["create", "create_fields", "show", "show_fields", "update", "update_fields", "list", "list_fields"];
    let dustPromises = [];

    for (let i = 0; i < dustFiles.length; i++) {
        dustPromises.push((async () => {
            let fileToWrite = fileBase + '/' + dustFiles[i] + ".dust";
            let dustContent = fs.readFileSync(fileToWrite, 'utf8');
            dustContent = dustContent.replace(/custom_module/g, module_name);
            dustContent = dustContent.replace(/custom_data_entity/g, entity_name);
            dustContent = dustContent.replace(/custom_url_data_entity/g, entity_url);

            if (module_name != "m_home") {
                let htmlToAdd = "" +
                    "<li>" +
                    "   <a class='sub-module-arianne' href='/default/" + module_name.substring(2) + "'>" +
                    "       <!--{#__ key=\"module." + module_name + "\"/}-->" +
                    "   </a>" +
                    "</li>";

                dustContent = dustContent.replace(/<!-- SUB MODULE - DO NOT REMOVE -->/g, htmlToAdd);
            }

            return fs.writeFileSync(fileToWrite, dustContent, "utf8");
        })())
    }

    await Promise.all(dustPromises);

    // Write new data entity to access.json file, within module's context
    let accessPath = workspacePath + '/config/access.json';
    let accessLockPath = workspacePath + '/config/access.lock.json';
    let accessObject = JSON.parse(fs.readFileSync(accessPath, 'utf8'));
    accessObject[module_name.substring(2)].entities.push({
        name: entity_url,
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

    // Add entity locals
    await translateHelper.writeLocales(data.application.name, "entity", entity_name, entity_display_name, data.googleTranslate);

    return;
}

exports.deleteDataEntity = async (data) => {
    let baseFolder = __dirname + '/../workspace/' + data.application.name;

    // Delete views folder
    helpers.rmdirSyncRecursive(baseFolder + '/views/' + data.entity.name);
    // Delete route file
    fs.unlinkSync(baseFolder + '/routes/' + data.entity.name + '.js');
    // Delete API file
    fs.unlinkSync(baseFolder + '/api/' + data.entity.name + '.js');
    // Delete model file
    fs.unlinkSync(baseFolder + '/models/' + data.entity.name + '.js');
    // Delete options
    fs.unlinkSync(baseFolder + '/models/options/' + data.entity.name + '.json');
    // Delete attributes
    fs.unlinkSync(baseFolder + '/models/attributes/' + data.entity.name + '.json');

    // Remove relationships in options.json files
    let optionFiles = fs.readdirSync(baseFolder + '/models/options/').filter(x => x.indexOf('.json') != -1);
    for (let file in optionFiles) {
        let options = JSON.parse(fs.readFileSync(baseFolder + '/models/options/' + optionFiles[file]));
        let optionsCpy = [];
        for (let i = 0; i < options.length; i++)
            if (options[i].target != data.entity.name)
                optionsCpy.push(options[i]);
        if (optionsCpy.length != options.length)
            fs.writeFileSync(baseFolder + '/models/options/' + optionFiles[file], JSON.stringify(optionsCpy, null, 4));
    }

    // Clean up access config
    let access = JSON.parse(fs.readFileSync(baseFolder + '/config/access.json', 'utf8'));
    for (let i = 0; i < access[data.np_module.name.substring(2)].entities.length; i++)
        if (access[data.np_module.name.substring(2)].entities[i].name == data.entity.name.substring(2))
            access[data.np_module.name.substring(2)].entities.splice(i, 1);
    fs.writeFileSync(baseFolder + '/config/access.json', JSON.stringify(access, null, 4));
    fs.writeFileSync(baseFolder + '/config/access.lock.json', JSON.stringify(access, null, 4));

    // Remove entity entry from layout select
    let filePath = baseFolder + '/views/layout_' + data.np_module.name + '.dust';
    let $ = await domHelper.read(filePath);

    $("#" + data.entity.name.substring(2) + '_menu_item').remove();

    await domHelper.write(filePath, $);

    translateHelper.removeLocales(data.application.name, "entity", data.entity.name)
    return true;
};