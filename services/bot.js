function checkAndCreateAttr(instructionsFunction, options, valueToCheck){

    var attr = {
        function: instructionsFunction,
        options: options
    };

    if(!isNaN(valueToCheck)){
        attr.error = "There must be at least one letter in the name."
    }

    if(valueToCheck.length > 30){
        attr.error = "Sorry, the given value is too long (>30)."
    }

    return attr;
}

// ******* BASIC Actions ******* //
exports.showSession = function(result) {

    var attr = {};
    attr.function = "showSession";
    return attr;
};

exports.help = function(result) {

    var attr = {};
    attr.function = "help";
    return attr;
};

exports.deploy = function(result) {

    var attr = {};
    attr.function = "deploy";
    return attr;
};

exports.restart = function(result) {

    var attr = {};
    attr.function = "restart";
    return attr;
};

exports.gitPush = function(result) {

    var attr = {};
    attr.function = "gitPush";
    return attr;
};

// ******* SELECT Actions ******* //
exports.selectProject = function(result) {

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

    // Set entity name as the first option in options array
    var options = {
        value: result[1],
        word: result[2],
        processValue: true
    };

    var attr = {
        function: "setRequiredAttribute",
        options: options
    };
    return attr;
};

// ******* DATALIST Actions ******* //
exports.setColumnVisibility = function(result) {

    // Set entity name as the first option in options array
    var options = {
        value: result[1],
        word: result[2],
        processValue: true
    };

    var attr = {
        function: "setColumnVisibility",
        options: options
    };
    return attr;
};

// ******* CREATE Actions ******* //
exports.createNewProject = function(result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewProject", options, value);
};

exports.createNewApplication = function(result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewApplication", options, value);
};

exports.createNewModule = function(result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewModule", options, value);
};

exports.createNewDataEntity = function(result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataEntity", options, value);
};

exports.createNewDataField = function(result) {

    // Field name has not been defined
    if (result[1] == '') {
        var attr = {
            function: "askNameOfDataField"
        };

        return attr;
    } else {

        var value = result[1];
        var options = {
            value: value,
            processValue: true
        };

        return checkAndCreateAttr("createNewDataField", options, value);
    }
};

exports.createNewDataFieldWithType = function(result) {

    var value = result[1];
    var type = result[2];

    // Preparing Options
    var options = {
        value: value,
        type: type,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

exports.createNewDataFieldWithTypeEnum = function(result) {

    var value = result[1];
    var type = "enum";
    var allValues = result[2];

    var options = {
        value: value,
        type: type,
        allValues: allValues,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

exports.createNewDataFieldWithTypeRadio = function(result) {

    var value = result[1];
    var type = "radio";
    var allValues = result[2];

    var options = {
        value: value,
        type: type,
        allValues: allValues,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

// ******* DELETE Actions ******* //
exports.deleteProject = function(result) {

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

    var attr = {
        function: "listProject"
    };
    return attr;
};

exports.listApplication = function(result) {

    var attr = {
        function: "listApplication"
    };
    return attr;
};

exports.listModule = function(result) {

    var attr = {
        function: "listModule"
    };
    return attr;
};

exports.listDataEntity = function(result) {

    var attr = {
        function: "listDataEntity"
    };
    return attr;
};

exports.listDataField = function(result) {

    var attr = {
        function: "listDataField"
    };
    return attr;
};

// ******* ASSOCIATION Actions ******* //

// --------- One to One ---------
// Tabs in show
exports.relationshipHasOne = function(result) {

    var source = result[1];
    var target = result[2];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_"+target.toLowerCase(),
        as: target,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasOne", options, target);
};

exports.relationshipHasOneWithName = function(result) {

    var source = result[1];
    var target = result[2];
    var as = result[3];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_"+target.toLowerCase()+"_"+as.toLowerCase(),
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasOne", options, as);
};

// Field in create
exports.createFieldRelatedTo = function(result) {

    var as = result[1];
    var target = result[2];

    var options = {
        target: target,
        foreignKey: "id_"+target.toLowerCase()+"_"+as.toLowerCase(),
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedTo", options, as);
};

exports.createFieldRelatedToUsing = function(result) {

    var as = result[1];
    var target = result[2];
    var usingField = result[3];

    var options = {
        target: target,
        foreignKey: "id_"+target.toLowerCase()+"_"+as.toLowerCase(),
        as: as,
        usingField: usingField,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedTo", options, as);
};

// --------- One to Many ---------
// Tabs in show
exports.relationshipHasMany = function(result) {

    var source = result[1];
    var target = result[2];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_"+source.toLowerCase(),
        as: target,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasMany", options, target);
};

exports.relationshipHasManyWithName = function(result) {

    var source = result[1];
    var target = result[2];
    var as = result[3];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_"+source.toLowerCase()+"_"+as.toLowerCase(),
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasMany", options, as);
};

exports.relationshipHasManyPreset = function(result) {
    var source = result[1];
    var target = result[2];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_"+source.toLowerCase(),
        as: target,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldset", options, target);
};

exports.relationshipHasManyPresetUsing = function(result) {
    var source = result[1];
    var target = result[2];
    var usingField = result[3];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_"+source.toLowerCase(),
        as: target,
        usingField: usingField,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldset", options, target);
};

exports.createFieldset = function(result) {

    var as = result[1];
    var target = result[2];

    // Preparing Options
    var options = {
        target: target,
        foreignKey: "id_"+as.toLowerCase(),
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldset", options, as);
};

exports.createFieldsetUsing = function(result) {

    var as = result[1];
    var target = result[2];
    var usingField = result[3];

    var options = {
        target: target,
        foreignKey: "id_"+as.toLowerCase(),
        as: as,
        usingField: usingField,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldset", options, as);
};

// ******* COMPONENT Actions ******* //
exports.createNewComponentLocalFileStorage = function(result) {

    var options = {};

    var attr = {
        function: "createNewComponentLocalFileStorage",
        options: options
    };
    return attr;
};

exports.createNewComponentLocalFileStorageWithName = function(result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewComponentLocalFileStorage", options, value);
};

exports.createNewComponentContactForm = function(result) {

    var options = {};

    var attr = {
        function: "createNewComponentContactForm",
        options: options
    };
    return attr;
};

exports.createNewComponentContactFormWithName = function(result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewComponentContactForm", options, value);
};

// ******* INTERFACE Actions ******* //
exports.setSkin = function(result) {

    var value = result[1];
    var options = {
        value: value
    };

    var attr = {
        function: "setSkin",
        options: options
    };
    return attr;
};

exports.listSkin = function(result) {

    var attr = {
        function: "listSkin"
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
            "déployer",
            "déploiment"
        ],
        "restart": [
            "restart server",
            "restart",
            "redémarrer",
            "redémarrer serveur",
            "redémarrer le serveur"
        ],
        "gitPush": [
            "save",
            "save on git",
            "push",
            "push on git",
            "save the application",
            "sauvergarder",
            "sauvergarder l'application"
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
            "ajouter un projet (.*)",
            "ajouter le projet (.*)"
        ],
        "createNewApplication": [
            "create application (.*)",
            "add application (.*)",
            "créer application (.*)",
            "créer une application (.*)",
            "ajouter application (.*)",
            "ajouter l'application (.*)",
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
            "ajouter une entité (.*)",
            "ajouter l'entité (.*)"
        ],
        "createNewDataFieldWithTypeEnum": [
            "create field (.*) with type enum and values (.*)",
            "create data field (.*) with type enum and values (.*)",
            "add field (.*) with type enum and values (.*)",
            "add data field (.*) with type enum and values (.*)",
            "créer champ (.*) de type enum avec les valeurs (.*)",
            "créer un champ (.*) de type enum avec les valeurs (.*)",
            "ajouter champ (.*) de type enum avec les valeurs (.*)",
            "ajouter un champ (.*) de type enum avec les valeurs (.*)",
            "ajouter le champ (.*) de type enum avec les valeurs (.*)"
        ],
        "createNewDataFieldWithTypeRadio": [
            "create field (.*) with type radio and values (.*)",
            "create data field (.*) with type radio and values (.*)",
            "add field (.*) with type radio and values (.*)",
            "add data field (.*) with type radio and values (.*)",
            "créer champ (.*) de type radio avec les valeurs (.*)",
            "créer un champ (.*) de type radio avec les valeurs (.*)",
            "ajouter champ (.*) de type radio avec les valeurs (.*)",
            "ajouter un champ (.*) de type radio avec les valeurs (.*)",
            "ajouter le champ (.*) de type radio avec les valeurs (.*)"
        ],
        "createNewDataFieldWithType": [
            "create field (.*) with type (.*)",
            "create data field (.*) with type (.*)",
            "add field (.*) with type (.*)",
            "add data field (.*) with type (.*)",
            "créer champ (.*) de type (.*)",
            "créer un champ (.*) de type (.*)",
            "ajouter champ (.*) de type (.*)",
            "ajouter un champ (.*) de type (.*)",
            "ajouter le champ (.*) de type (.*)"
        ],
        "createNewDataField": [
            "create field ?(.*)",
            "create data field (.*)",
            "add field (.*)",
            "add data field (.*)",
            "créer champ (.*)",
            "créer un champ (.*)",
            "ajouter champ (.*)",
            "ajouter un champ (.*)",
            "ajouter le champ (.*)"
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
        "listSkin": [
            "list all skin",
            "list skin",
            "list available skin",
            "lister les skins",
            "lister les skin",
            "lister skin",
            "lister skins"
        ],
        "relationshipHasOne": [
            "entity (.*) has one (.*)",
            "entité (.*) possède un (.*)",
            "entité (.*) possède une (.*)",
            "entité (.*) a un (.*)",
            "entité (.*) a une (.*)"
        ],
        "relationshipHasOneWithName": [
            "entity (.*) has one (.*) called (.*)",
            "entité (.*) possède un (.*) appelé (.*)",
            "entité (.*) possède une (.*) appelée (.*)",
            "entité (.*) a un (.*) appelé (.*)",
            "entité (.*) a une (.*) appelée (.*)"
        ],
        "createFieldRelatedTo": [
            "create field (.*) related to (.*)",
            "add field (.*) related to (.*)",
            "create data field (.*) related to (.*)",
            "add data field (.*) related to (.*)",
            "créer un champ (.*) relié à (.*)",
            "ajouter un champ (.*) relié à (.*)"
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
        "relationshipHasMany": [
            "entity (.*) has many (.*)",
            "entité (.*) possède plusieurs (.*)",
            "entité (.*) a plusieurs (.*)"
        ],
        "relationshipHasManyWithName": [
            "entity (.*) has many (.*) called (.*)",
            "entité (.*) possède plusieurs (.*) appelés (.*)",
            "entité (.*) a plusieurs (.*) appelés (.*)"
        ],
        "relationshipHasManyPreset": [
            "entity (.*) has many preset (.*)",
            "entity (.*) has many existing (.*)",
            "l'entité (.*) a plusieurs (.*) prédéfini",
            "l'entité (.*) a plusieurs (.*) existant",
            "l'entité (.*) a plusieurs (.*) déjà prédéfini",
            "l'entité (.*) a plusieurs (.*) déjà existant",
        ],
        "relationshipHasManyPresetUsing": [
            "entity (.*) has many preset (.*) using (.*)",
            "entity (.*) has many existing (.*) using (.*)",
            "entity (.*) has many preset (.*) through (.*)",
            "entity (.*) has many existing (.*) through (.*)",
            "entity (.*) has many preset (.*) using field (.*)",
            "entity (.*) has many existing (.*) using field (.*)",
            "entity (.*) has many preset (.*) through field (.*)",
            "entity (.*) has many existing (.*) through field (.*)",
            "entity (.*) has many preset (.*) using the field (.*)",
            "entity (.*) has many existing (.*) using the field (.*)",
            "entity (.*) has many preset (.*) through the field (.*)",
            "entity (.*) has many existing (.*) through the field (.*)",
            "l'entité (.*) a plusieurs (.*) prédéfini en utilisant (.*)",
            "l'entité (.*) a plusieurs (.*) existant en utilisant (.*)",
            "l'entité (.*) a plusieurs (.*) prédéfini en affichant (.*)",
            "l'entité (.*) a plusieurs (.*) existant en affichant (.*)",
            "l'entité (.*) a plusieurs (.*) prédéfini en utilisant le champ (.*)",
            "l'entité (.*) a plusieurs (.*) existant en utilisant le champ (.*)",
            "l'entité (.*) a plusieurs (.*) prédéfini en affichant le champ (.*)",
            "l'entité (.*) a plusieurs (.*) existant en affichant le champ (.*)",
        ],
        "createFieldset": [
            "create fieldset (.*) related to (.*)",
            "add fieldset (.*) related to (.*)",
            "créer une liste de (.*) reliée à (.*)",
            "créer une liste de (.*) liée à (.*)",
            "ajouter une liste de (.*) reliée à (.*)",
            "ajouter une liste de (.*) liée à (.*)"
        ],
        "createFieldsetUsing": [
            "create fieldset (.*) related to (.*) using (.*)",
            "add fieldset (.*) related to (.*) using (.*)",
            "créer une liste de (.*) reliée à (.*) en affichant (.*)",
            "créer une liste de (.*) liée à (.*) en affichant (.*)",
            "ajouter une liste de (.*) reliée à (.*) en affichant (.*)",
            "ajouter une liste de (.*) liée à (.*) en affichant (.*)"
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
            "ajouter composant de stockage appelé (.*)",
            "ajouter le composant de stockage de fichier appelé (.*)",
            "ajouter le composant de stockage appelé (.*)",
            "ajouter le composant localfilestorage appelé (.*)"
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
            "ajouter composant de stockage local",
            "ajouter un stockage de documents"
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
        ],
        "setSkin": [
            "set skin (.*)",
            "set color (.*)",
            "set colour (.*)",
            "appliquer le style (.*)",
            "appliquer la couleur (.*)",
            "mettre la couleur (.*)"
        ]
    };

    var instructionResult = {
        insctructionLength: 0
    };

    for (var action in training) {
        for (var i=0; i<training[action].length; i++) {
            var regStr = training[action][i];
            var regExp = new RegExp(regStr, "ig");

            var result = regExp.exec(instruction);
            if (result !== null){

                /* Get the most complicated instruction found */
                if(instructionResult.insctructionLength < regStr.length){
                    instructionResult = {
                        action: action,
                        result: result,
                        insctructionLength: regStr.length
                    };
                }
            }
        }
    }

    var attr = {};

    if(typeof instructionResult.action !== "undefined"){
        attr = this[instructionResult.action](instructionResult.result);
        attr.instruction = instruction;
    }
    else{
        attr.error = "Unable to find a matching instruction.";
    }

    return attr;
}

module.exports = exports;