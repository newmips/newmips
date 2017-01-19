// ******* BASIC Actions ******* //
exports.showSession = function(result) {

    console.log("ACTION : showSession");

    var attr = {};
    attr.function = "showSession";
    return attr;
};

exports.help = function(result) {

    console.log("ACTION : help");

    var attr = {};
    attr.function = "help";
    return attr;
};

exports.deploy = function(result) {

    console.log("ACTION : deploy");

    var attr = {};
    attr.function = "deploy";
    return attr;
};

// ******* SELECT Actions ******* //
exports.selectProject = function(result) {

    console.log("ACTION : selectProject");

    var value = result[1];
    var options = {
        "value": value
    };

    var attr = {
        function: "selectProject",
        options: options
    };
    return attr;
};

exports.selectApplication = function(result) {

    console.log("ACTION : selectApplication");

    var value = result[1];
    var options = {
        value: value
    };

    var attr = {
        function: "selectApplication",
        options: options
    };
    return attr;
};

exports.selectModule = function(result) {

    console.log("ACTION : selectModule");

    var value = result[1];
    var options = {
        value: value
    };

    var attr = {
        function: "selectModule",
        options: options
    };
    return attr;
};

exports.selectDataEntity = function(result) {

    console.log("ACTION : selectDataEntity");

    var value = result[1];
    var options = {
        value: value
    };

    var attr = {
        function: "selectDataEntity",
        options: options
    };
    return attr;
};

// ******* FIELD ATTRIBUTES Actions ******* //
exports.setRequiredAttribute = function(result) {

    console.log("ACTION : setRequiredAttribute");

    // Set entity name as the first option in options array
    var options = {
        field_name: result[1],
        word: result[2]
    };

    var attr = {
        function: "setRequiredAttribute",
        options: options
    };
    return attr;
};

exports.setColumnVisibility = function(result) {

    console.log("ACTION : setColumnVisibility");

    // Set entity name as the first option in options array
    var options = {
        field_name: result[1],
        word: result[2]
    };

    var attr = {
        function: "setColumnVisibility",
        options: options
    };
    return attr;
};

// ******* CREATE Actions ******* //
exports.createNewProject = function(result) {

    console.log("ACTION : createNewProject");

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "createNewProject",
        options: options
    };
    return attr;
};

exports.createNewApplication = function(result) {

    console.log("ACTION : createNewApplication");

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "createNewApplication",
        options: options
    };
    return attr;
};

exports.createNewModule = function(result) {

    console.log("ACTION : createNewModule");

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "createNewModule",
        options: options
    };
    return attr;
};

exports.createNewDataEntity = function(result) {

    console.log("ACTION : createNewDataEntity");

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "createNewDataEntity",
        options: options
    };
    return attr;
};

exports.createNewDataField = function(result) {

    console.log("ACTION : createNewDataField");

    // Field name has not been defined
    if (result[1] == '') {
        var attr = {
            function: "askNameOfDataField"
        };
    } else {

        var value = result[1];
        var options = {
            value: value,
            processValue: true
        };

        var attr = {
            function: "createNewDataField",
            options: options
        };
    }

    return attr;
};

exports.createNewDataFieldWithType = function(result) {

    console.log("ACTION : createNewDataFieldWithType");

    var value = result[1];
    var type = result[2];

    // Preparing Options
    var options = {
        value: value,
        type: type,
        processValue: true
    };

    var attr = {
        function: "createNewDataField",
        options: options
    };
    return attr;
};

exports.createNewDataFieldWithTypeEnum = function(result) {

    console.log("ACTION : createNewDataFieldWithTypeEnum");

    var value = result[1];
    var type = "enum";
    var allValues = result[2];

    var options = {
        value: value,
        type: type,
        allValues: allValues,
        processValue: true
    };

    var attr = {
        function: "createNewDataField",
        options: options
    };
    return attr;
};

exports.createNewDataFieldWithTypeRadio = function(result) {

    console.log("ACTION : createNewDataFieldWithTypeRadio");

    var value = result[1];
    var type = "radio";
    var allValues = result[2];

    var options = {
        value: value,
        type: type,
        allValues: allValues,
        processValue: true
    };

    var attr = {
        function: "createNewDataField",
        options: options
    };
    return attr;
};

// ******* DELETE Actions ******* //
exports.deleteProject = function(result) {

    console.log("ACTION : deleteProject");

    var value = result[1];

    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "deleteProject",
        options: options
    };
    return attr;
};

exports.deleteApplication = function(result) {

    console.log("ACTION : deleteApplication");

    var value = result[1];

    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "deleteApplication",
        options: options
    };
    return attr;
};

exports.deleteModule = function(result) {

    console.log("ACTION : deleteModule");

    var value = result[1];

    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "deleteModule",
        options: options
    };
    return attr;
};

exports.deleteDataEntity = function(result) {

    console.log("ACTION : deleteDataEntity");

    var value = result[1];

    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "deleteDataEntity",
        options: options
    };
    return attr;
};

exports.deleteDataField = function(result) {

    console.log("ACTION : deleteDataFiel");

    var value = result[1];

    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "deleteDataField",
        options: options
    };
    return attr;
};

exports.deleteTab = function(result) {

    console.log("ACTION : deleteTab");

    var value = result[1];

    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "deleteTab",
        options: options
    };
    return attr;
};

// ******* LIST Actions ******* //
exports.listProject = function(result) {

    console.log("ACTION : listProject");

    var attr = {
        function: "listProject"
    };
    return attr;
};

exports.listApplication = function(result) {

    console.log("ACTION : listApplication");

    var attr = {
        function: "listApplication"
    };
    return attr;
};

exports.listModule = function(result) {

    console.log("ACTION : listModule");

    var attr = {
        function: "listModule"
    };
    return attr;
};

exports.listDataEntity = function(result) {

    console.log("ACTION : listDataEntity");

    var attr = {
        function: "listDataEntity"
    };
    return attr;
};

exports.listDataField = function(result) {

    console.log("ACTION : listDataFiel");

    var attr = {
        function: "listDataField"
    };
    return attr;
};

// ******* ASSOCIATION Actions ******* //
exports.relationshipHasOne = function(result) {

    console.log("ACTION : relationshipHasOne");

    var source = result[1];
    var target = result[2];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_"+target,
        as: target,
        processValue: true
    };

    var attr = {
        function: "createNewHasOne",
        options: options
    };
    return attr;
};

exports.relationshipHasOneWithName = function(result) {

    console.log("ACTION : relationshipHasOneWithName");

    var source = result[1];
    var target = result[2];
    var as = result[3];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_"+target,
        as: as,
        processValue: true
    };

    var attr = {
        function: "createNewHasOne",
        options: options
    };
    return attr;
};

exports.relationshipHasMany = function(result) {

    console.log("ACTION : relationshipHasMany");

    var source = result[1];
    var target = result[2];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_"+source.toLowerCase(),
        as: target,
        processValue: true
    };

    var attr = {
        function: "createNewHasMany",
        options: options
    };
    return attr;
};

exports.relationshipHasManyWithName = function(result) {

    console.log("ACTION : relationshipHasManyWithName");

    var source = result[1];
    var target = result[2];
    var as = result[3];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_"+source.toLowerCase(),
        as: as,
        processValue: true
    };

    var attr = {
        function: "createNewHasMany",
        options: options
    };
    return attr;
};

exports.createFieldRelatedTo = function(result) {

    console.log("ACTION : createFieldRelatedTo");

    var as = result[1];
    var target = result[2];

    var options = {
        target: target,
        foreignKey: "id_"+as,
        as: as,
        processValue: true
    };

    var attr = {
        function: "createNewFieldRelatedTo",
        options: options
    };
    return attr;
};

exports.createFieldRelatedToUsing = function(result) {

    console.log("ACTION : createFieldRelatedTo");

    var as = result[1];
    var target = result[2];
    var usingField = result[3];

    var options = {
        target: target,
        foreignKey: "id_"+as,
        as: as,
        usingField: usingField,
        processValue: true
    };

    var attr = {
        function: "createNewFieldRelatedTo",
        options: options
    };
    return attr;
};

exports.createFieldRelatedToPreset = function(result) {

    console.log("ACTION : createFieldRelatedToPreset");

    var source = result[1];
    var target = result[2];
    var as = result[3];
    var usingField = result[4];

    var options = {
        source: source,
        target: target,
        foreignKey: "id_"+as,
        as: as,
        usingField: usingField,
        processValue: true
    };

    var attr = {
        function: "createNewFieldRelatedTo",
        options: options
    };
    return attr;
};

exports.createFieldset = function(result) {

    console.log("ACTION : createFieldset");

    var as = result[1];
    var target = result[2];

    // Preparing Options
    var options = {
        target: target,
        foreignKey: "id_"+as,
        as: as,
        processValue: true
    };

    var attr = {
        "function": "createNewFieldset",
        "options": options
    };
    return attr;
};

exports.createFieldsetUsing = function(result) {

    console.log("ACTION : createFieldsetUsing");

    var as = result[1];
    var target = result[2];
    var usingField = result[3];

    var options = {
        target: target,
        foreignKey: "id_"+as,
        as: as,
        usingField: usingField,
        processValue: true
    };

    var attr = {
        function: "createNewFieldset",
        options: options
    };
    return attr;
};

exports.createFieldsetPreset = function(result) {

    console.log("ACTION : createFieldsetPreset");

    var source = result[1];
    var target = result[2];

    var options = {
        source: source,
        target: target,
        foreignKey: "id_"+target,
        as: target,
        processValue: true
    };

    var attr = {
        function: "createNewFieldset",
        options: options
    };
    return attr;
};

// ******* COMPONENT Actions ******* //
exports.createNewComponentLocalFileStorage = function(result) {

    console.log("ACTION : createNewComponentLocalFileStorage");

    var options = {};

    var attr = {
        function: "createNewComponentLocalFileStorage",
        options: options
    };
    return attr;
};

exports.createNewComponentLocalFileStorageWithName = function(result) {

    console.log("ACTION : createNewComponentLocalFileStorageWithName");

    var options = {
        value: result[1],
        processValue: true
    };

    var attr = {
        function: "createNewComponentLocalFileStorage",
        options: options
    };
    return attr;
};

exports.createNewComponentContactForm = function(result) {

    console.log("ACTION : createNewComponentContactForm");

    var options = {};

    var attr = {
        function: "createNewComponentContactForm",
        options: options
    };
    return attr;
};

exports.createNewComponentContactFormWithName = function(result) {

    console.log("ACTION : createNewComponentContactFormWithName");

    var options = {
        value: result[1],
        processValue: true
    };

    var attr = {
        function: "createNewComponentContactForm",
        options: options
    };
    return attr;
};


// ******* Parse *******
exports.parse = function(instruction) {

    var training = {
        "showSession": [
            "show session",
            "show the session",
            "show session values",
            "afficher la session",
            "afficher session"
        ],
        "help": [
            "how could you assist me",
            "help",
            "à l'aide",
            "aidez-moi",
            "aide",
            "au secours"
        ],
        "deploy": [
            "deploy",
            "déploy"
        ],
        "selectProject": [
            "select project (.*)",
            "select the project (.*)",
            "sélectionner le projet (.*)",
            "sélectionner projet (.*)"
        ],
        "selectApplication": [
            "select application (.*)",
            "select the application (.*)",
            "sélectionner l'application (.*)",
            "sélectionner application (.*)"
        ],
        "selectModule": [
            "select module (.*)",
            "select the module (.*)",
            "sélectionner le module (.*)",
            "sélectionner module (.*)"
        ],
        "selectDataEntity": [
            "select entity (.*)",
            "select data entity (.*)",
            "sélectionner l'entité (.*)",
            "sélectionner entité (.*)"
        ],
        "setRequiredAttribute": [
            "set field (.*) (.*)",
            "set the field (.*) (.*)",
            "mettre champ (.*) (.*)",
            "mettre le champ (.*) (.*)",
            "mettre le champ (.*) en (.*)"
        ],
        "setColumnVisibility": [
            "set column (.*) (.*)",
            "mettre la colonne (.*) en (.*)"
        ],
        "createNewProject": [
            "create project (.*)",
            "add project (.*)",
            "créer projet (.*)",
            "créer un projet (.*)",
            "ajouter projet (.*)",
            "ajouter un projet (.*)"
        ],
        "createNewApplication": [
            "create application (.*)",
            "add application (.*)",
            "créer application (.*)",
            "créer une application (.*)",
            "ajouter application (.*)",
            "ajouter une application (.*)"
        ],
        "createNewModule": [
            "create module (.*)",
            "add module (.*)",
            "créer module (.*)",
            "créer un module (.*)",
            "ajouter module (.*)",
            "ajouter un module (.*)"
        ],
        "createNewDataEntity": [
            "create entity (.*)",
            "create data entity (.*)",
            "add entity (.*)",
            "add data entity (.*)",
            "créer entité (.*)",
            "créer une entité (.*)",
            "ajouter entité (.*)",
            "ajouter une entité (.*)"
        ],
        "createNewDataFieldWithTypeEnum": [
            "create field (.*) with type enum and values (.*)",
            "create data field (.*) with type enum and values (.*)",
            "add field (.*) with type enum and values (.*)",
            "add data field (.*) with type enum and values (.*)",
            "créer champ (.*) de type enum avec les valeurs (.*)",
            "créer un champ (.*) de type enum avec les valeurs (.*)",
            "ajouter champ (.*) de type enum avec les valeurs (.*)",
            "ajouter un champ (.*) de type enum avec les valeurs (.*)"
        ],
        "createNewDataFieldWithTypeRadio": [
            "create field (.*) with type radio and values (.*)",
            "create data field (.*) with type radio and values (.*)",
            "add field (.*) with type radio and values (.*)",
            "add data field (.*) with type radio and values (.*)",
            "créer champ (.*) de type radio avec les valeurs (.*)",
            "créer un champ (.*) de type radio avec les valeurs (.*)",
            "ajouter champ (.*) de type radio avec les valeurs (.*)",
            "ajouter un champ (.*) de type radio avec les valeurs (.*)"
        ],
        "createNewDataFieldWithType": [
            "create field (.*) with type (.*)",
            "create data field (.*) with type (.*)",
            "add field (.*) with type (.*)",
            "add data field (.*) with type (.*)",
            "créer champ (.*) de type (.*)",
            "créer un champ (.*) de type (.*)",
            "ajouter champ (.*) de type (.*)",
            "ajouter un champ (.*) de type (.*)"
        ],
        "createNewDataField": [
            "create field ?(.*)",
            "create data field (.*)",
            "add field (.*)",
            "add data field (.*)",
            "créer champ (.*)",
            "créer un champ (.*)",
            "ajouter champ (.*)",
            "ajouter un champ (.*)"
        ],
        "deleteProject": [
            "delete project (.*)",
            "drop project (.*)",
            "remove project (.*)",
            "supprimer projet (.*)",
            "supprimer le projet (.*)"
        ],
        "deleteApplication": [
            "delete application (.*)",
            "drop application (.*)",
            "remove application (.*)",
            "supprimer application (.*)",
            "supprimer l'application (.*)"
        ],
        "deleteModule": [
            "delete module (.*)",
            "drop module (.*)",
            "remove module (.*)",
            "supprimer module (.*)",
            "supprimer le module (.*)"
        ],
        "deleteDataEntity": [
            "delete entity (.*)",
            "drop entity (.*)",
            "remove entity (.*)",
            "delete data entity (.*)",
            "drop data entity (.*)",
            "remove data entity (.*)",
            "supprimer entité (.*)",
            "supprimer l'entité (.*)"
        ],
        "deleteDataField": [
            "delete field (.*)",
            "drop field (.*)",
            "remove field (.*)",
            "delete data field (.*)",
            "drop data field (.*)",
            "remove data field (.*)",
            "supprimer champ (.*)",
            "supprimer le champ (.*)"
        ],
        "deleteTab": [
            "delete tab (.*)",
            "drop tab (.*)",
            "remove tab (.*)",
            "supprimer onglet (.*)",
            "supprimer l'onglet (.*)"
        ],
        "listProject": [
            "list project",
            "list projects",
            "lister projet",
            "lister projets",
            "lister les projets"
        ],
        "listApplication": [
            "list application",
            "list applications",
            "lister application",
            "lister applications",
            "lister les applications"
        ],
        "listModule": [
            "list module",
            "list modules",
            "lister module",
            "lister modules",
            "lister les modules"
        ],
        "listDataEntity": [
            "list data entity",
            "list data entities",
            "list entity",
            "list entities",
            "lister entité",
            "lister entités",
            "lister les entités"
        ],
        "listDataField": [
            "list data field",
            "list data fields",
            "list field",
            "list fields",
            "lister champ",
            "lister champs",
            "lister les champs"
        ],
        "relationshipHasOneWithName": [
            "entity (.*) has one (.*) called (.*)",
            "entité (.*) possède un (.*) appelé (.*)",
            "entité (.*) possède une (.*) appelée (.*)",
            "entité (.*) a un (.*) appelé (.*)",
            "entité (.*) a une (.*) appelée (.*)"
        ],
        "relationshipHasOne": [
            "entity (.*) has one (.*)",
            "entité (.*) possède un (.*)",
            "entité (.*) possède une (.*)",
            "entité (.*) a un (.*)",
            "entité (.*) a une (.*)"
        ],
        "relationshipHasManyWithName": [
            "entity (.*) has many (.*) called (.*)",
            "entité (.*) possède plusieurs (.*) appelés (.*)",
            "entité (.*) a plusieurs (.*) appelés (.*)"
        ],
        "relationshipHasMany": [
            "entity (.*) has many (.*)",
            "entité (.*) possède plusieurs (.*)",
            "entité (.*) a plusieurs (.*)"
        ],
        "createFieldRelatedToUsing": [
            "create field (.*) related to (.*) using (.*)",
            "add field (.*) related to (.*) using (.*)",
            "create data field (.*) related to (.*) using (.*)",
            "add data field (.*) related to (.*) using (.*)",
            "créer un champ (.*) relié à (.*) en utilisant (.*)",
            "créer un champ (.*) relié à (.*) en affichant (.*)",
            "ajouter un champ (.*) relié à (.*) en utilisant (.*)",
            "ajouter un champ (.*) relié à (.*) en affichant (.*)"
        ],
        "createFieldRelatedToPreset": [
            "entity (.*) has one preset (.*) called (.*) using (.*)"
        ],
        "createFieldRelatedTo": [
            "create field (.*) related to (.*)",
            "add field (.*) related to (.*)",
            "create data field (.*) related to (.*)",
            "add data field (.*) related to (.*)",
            "créer un champ (.*) relié à (.*)",
            "ajouter un champ (.*) relié à (.*)"
        ],
        "createFieldsetUsing": [
            "create fieldset (.*) related to (.*) using (.*)",
            "add fieldset (.*) related to (.*) using (.*)",
            "créer une liste de (.*) reliée à (.*) en affichant (.*)",
            "créer une liste de (.*) liée à (.*) en affichant (.*)",
            "ajouter une liste de (.*) reliée à (.*) en affichant (.*)",
            "ajouter une liste de (.*) liée à (.*) en affichant (.*)"
        ],
        "createFieldsetPreset": [
            "entity (.*) has many preset (.*)"
        ],
        "createFieldset": [
            "create fieldset (.*) related to (.*)",
            "add fieldset (.*) related to (.*)",
            "créer une liste de (.*) reliée à (.*)",
            "créer une liste de (.*) liée à (.*)",
            "ajouter une liste de (.*) reliée à (.*)",
            "ajouter une liste de (.*) liée à (.*)"
        ],
        "createNewComponentLocalFileStorageWithName": [
            "create component local file storage with name (.*)",
            "create component localfilestorage with name (.*)",
            "add component local file storage with name (.*)",
            "add component localfilestorage with name (.*)",
            "créer composant localfilestorage appelé (.*)",
            "ajouter composant localfilestorage appelé (.*)",
            "créer un composant localfilestorage appelé (.*)",
            "ajouter un composant localfilestorage appelé (.*)",
            "créer composant de stockage de fichier appelé (.*)",
            "ajouter composant de stockage de fichier appelé (.*)",
            "créer composant de stockage appelé (.*)",
            "ajouter composant de stockage appelé (.*)"
        ],
        "createNewComponentLocalFileStorage": [
            "create component local file storage",
            "create component localfilestorage",
            "add component local file storage",
            "add component localfilestorage",
            "créer composant localfilestorage",
            "ajouter composant localfilestorage",
            "créer un composant localfilestorage",
            "ajouter un composant localfilestorage",
            "créer composant de stockage de fichier local",
            "ajouter composant de stockage de fichier local",
            "créer composant de stockage local",
            "ajouter composant de stockage local"
        ],
        "createNewComponentContactFormWithName": [
            "create component contactform with name (.*)",
            "create component contact form with name (.*)",
            "add component contactform with name (.*)",
            "add component contact form with name (.*)",
            "créer un composant formulaire de contact nommé (.*)",
            "ajouter un composant formulaire de contact nommé (.*)",
            "créer un formulaire de contact nommé (.*)",
            "ajouter un formulaire de contact nommé (.*)"
        ],
        "createNewComponentContactForm": [
            "create component contactform",
            "create component contact form",
            "add component contactform",
            "add component contact form",
            "créer un composant formulaire de contact",
            "ajouter un composant formulaire de contact",
            "créer un formulaire de contact",
            "ajouter un formulaire de contact",
        ]
    };

    for (var action in training) {
        for (var i = 0; i < training[action].length; i++) {
            var regStr = training[action][i];
            var regExp = new RegExp(regStr, "ig");

            var result = regExp.exec(instruction);
            if (result !== null){
                var resultInstruction = this[action](result);
                resultInstruction.instruction = instruction;
                console.log(resultInstruction);
                return resultInstruction;
            }
        }
    }

    return {};
}

module.exports = exports;