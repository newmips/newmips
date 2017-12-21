function checkAndCreateAttr(instructionsFunction, options, valueToCheck) {

    var attr = {
        function: instructionsFunction,
        options: options
    };

    if (!isNaN(valueToCheck)) {
        attr.error = "There must be at least one letter in the name."
    }

    if(valueToCheck.length > 30){
        console.log("Value is too long => "+valueToCheck+"("+valueToCheck.length+")");
        attr.error = "error.valueTooLong";
    }

    return attr;
}

// ******* BASIC Actions ******* //
exports.showSession = function (result) {

    var attr = {};
    attr.function = "showSession";
    return attr;
};

exports.help = function (result) {

    var attr = {};
    attr.function = "help";
    return attr;
};

exports.deploy = function (result) {

    var attr = {};
    attr.function = "deploy";
    return attr;
};

exports.restart = function (result) {

    var attr = {};
    attr.function = "restart";
    return attr;
};

exports.gitPush = function (result) {
    var attr = {};
    attr.function = "gitPush";
    return attr;
};

exports.gitPull = function (result) {
    var attr = {};
    attr.function = "gitPull";
    return attr;
};

exports.gitCommit = function (result) {
    var attr = {};
    attr.function = "gitCommit";
    return attr;
};

exports.gitStatus = function (result) {
    var attr = {};
    attr.function = "gitStatus";
    return attr;
};

// ******* SELECT Actions ******* //
exports.selectProject = function (result) {

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

exports.selectApplication = function (result) {

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

exports.selectModule = function (result) {

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

exports.selectEntity = function (result) {

    var value = result[1];
    var options = {
        value: value
    };

    var attr = {
        function: "selectEntity",
        options: options
    };
    return attr;
};

// ******* FIELD ATTRIBUTES Actions ******* //
exports.setFieldAttribute = function (result) {

    // Set entity name as the first option in options array
    var options = {
        value: result[1],
        word: result[2],
        attributeValue: result[3],
        processValue: true
    };

    var attr = {
        function: "setFieldAttribute",
        options: options
    };
    return attr;
};

exports.setFieldKnownAttribute = function (result) {

    // Set entity name as the first option in options array
    var options = {
        value: result[1],
        word: result[2],
        processValue: true
    };

    var attr = {
        function: "setFieldKnownAttribute",
        options: options
    };
    return attr;
};

// ******* DATALIST Actions ******* //
exports.setColumnVisibility = function (result) {

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

exports.setColumnHidden = function (result) {

    // Set entity name as the first option in options array
    var options = {
        value: result[1],
        word: "hidden",
        processValue: true
    };

    var attr = {
        function: "setColumnVisibility",
        options: options
    };
    return attr;
};

exports.setColumnVisible = function (result) {

    // Set entity name as the first option in options array
    var options = {
        value: result[1],
        word: "visible",
        processValue: true
    };

    var attr = {
        function: "setColumnVisibility",
        options: options
    };
    return attr;
};

// ******* CREATE Actions ******* //
exports.createNewProject = function (result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewProject", options, value);
};

exports.createNewApplication = function (result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewApplication", options, value);
};

exports.createNewModule = function (result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewModule", options, value);
};

exports.createNewEntity = function (result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewEntity", options, value);
};

exports.createNewDataField = function (result) {

    // Field name has not been defined
    var value = result[1];
    var defaultValue = null;

    // Default value ?
    if (typeof result[2] !== "undefined")
        defaultValue = result[2];

    var options = {
        value: value,
        defaultValue: defaultValue,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

exports.createNewDataFieldWithType = function (result) {

    var value = result[1];
    var type = result[2];
    var defaultValue = null;

    // Default value ?
    if (typeof result[3] !== "undefined")
        defaultValue = result[3];

    // Preparing Options
    var options = {
        value: value,
        type: type,
        defaultValue: defaultValue,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

exports.createNewDataFieldWithTypeEnum = function (result) {

    var value = result[1];
    var allValues = result[2];
    var defaultValue = null;

    // Default value ?
    if (typeof result[3] !== "undefined")
        defaultValue = result[3];

    var options = {
        value: value,
        type: "enum",
        allValues: allValues,
        defaultValue: defaultValue,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

exports.createNewDataFieldWithTypeRadio = function (result) {

    var value = result[1];
    var allValues = result[2];
    var defaultValue = null;

    // Default value ?
    if (typeof result[3] !== "undefined")
        defaultValue = result[3];

    var options = {
        value: value,
        type: "radio",
        allValues: allValues,
        defaultValue: defaultValue,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

// ******* DELETE Actions ******* //
exports.deleteProject = function (result) {

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

exports.deleteApplication = function (result) {

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

exports.deleteModule = function (result) {

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

exports.deleteDataEntity = function (result) {

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

exports.deleteDataField = function (result) {

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

exports.deleteTab = function (result) {

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
exports.listProject = function (result) {

    var attr = {
        function: "listProject"
    };
    return attr;
};

exports.listApplication = function (result) {

    var attr = {
        function: "listApplication"
    };
    return attr;
};

exports.listModule = function (result) {

    var attr = {
        function: "listModule"
    };
    return attr;
};

exports.listDataEntity = function (result) {

    var attr = {
        function: "listDataEntity"
    };
    return attr;
};

exports.listDataField = function (result) {

    var attr = {
        function: "listDataField"
    };
    return attr;
};

// ******* ASSOCIATION Actions ******* //

// --------- One to One ---------
// Tabs in show
exports.relationshipHasOne = function (result) {

    var source = result[1];
    var target = result[2];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_" + target.toLowerCase(),
        as: target,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasOne", options, target);
};

exports.relationshipHasOneWithName = function (result) {

    var source = result[1];
    var target = result[2];
    var as = result[3];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_" + target.toLowerCase() + "_" + as.toLowerCase(),
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasOne", options, as);
};


// --------- Field in create / update / show ---------
exports.createFieldRelatedTo = function(result) {

    var as = result[1];
    var target = result[2];

    var options = {
        target: target,
        foreignKey: "id_" + target.toLowerCase() + "_" + as.toLowerCase(),
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedTo", options, as);
};

exports.createFieldRelatedToUsing = function (result) {

    var as = result[1];
    var target = result[2];
    var usingField = result[3];

    var options = {
        target: target,
        foreignKey: "id_" + target.toLowerCase() + "_" + as.toLowerCase(),
        as: as,
        usingField: usingField,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedTo", options, as);
};

exports.createFieldRelatedToMultiple = function(result) {

    var as = result[1];
    var target = result[2];

    // Preparing Options
    var options = {
        target: target,
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedToMultiple", options, as);
};

exports.createFieldRelatedToMultipleUsing = function(result) {

    var as = result[1];
    var target = result[2];
    var usingField = result[3];

    var options = {
        target: target,
        as: as,
        usingField: usingField,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedToMultiple", options, as);
};

// --------- One to Many ---------
// Tabs in show
exports.relationshipHasMany = function (result) {

    var source = result[1];
    var target = result[2];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_" + source.toLowerCase(),
        as: target,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasMany", options, target);
};

exports.relationshipHasManyWithName = function (result) {

    var source = result[1];
    var target = result[2];
    var as = result[3];

    var options = {
        target: target,
        source: source,
        foreignKey: "id_" + source.toLowerCase() + "_" + as.toLowerCase(),
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasMany", options, as);
};

exports.relationshipHasManyPreset = function (result) {
    var source = result[1];
    var target = result[2];
    var as = target;
    var foreignKey = "id_" + source.toLowerCase();

    if(typeof result[3] !== "undefined")
        as = result[3];
        foreignKey = "id_" + source.toLowerCase() + "_" + as.toLowerCase()

    var options = {
        target: target,
        source: source,
        foreignKey: foreignKey,
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasManyPreset", options, target);
};

exports.relationshipHasManyPresetUsing = function (result) {
    var source = result[1];
    var target = result[2];
    var usingField = result[3];
    var as = target;
    var foreignKey = "id_" + source.toLowerCase();

    if(typeof result[4] !== "undefined")
        as = result[4];
        foreignKey = "id_" + source.toLowerCase() + "_" + as.toLowerCase()

    var options = {
        target: target,
        source: source,
        foreignKey: foreignKey,
        as: as,
        usingField: usingField,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasManyPreset", options, target);
};

// ******* COMPONENT Actions ******* //
exports.createNewComponentStatus = function(result) {
    var defaultValue = result[0].indexOf("component") != -1 ? "Status" : "Statut";
    return {
        function: "createNewComponentStatus",
        options: {value: defaultValue, processValue: true}
    };
}

exports.createNewComponentStatusWithName = function(result) {
    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewComponentStatus", options, value);
}

/* LOCAL FILE STORAGE */
exports.createNewComponentLocalFileStorage = function (result) {

    var options = {};

    var attr = {
        function: "createNewComponentLocalFileStorage",
        options: options
    };
    return attr;
};

exports.createNewComponentLocalFileStorageWithName = function (result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewComponentLocalFileStorage", options, value);
};

/* CONTACT FORM */
exports.createNewComponentContactForm = function (result) {

    var options = {};

    var attr = {
        function: "createNewComponentContactForm",
        options: options
    };
    return attr;
};

exports.createNewComponentContactFormWithName = function (result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewComponentContactForm", options, value);
};

/* AGENDA */
exports.createNewComponentAgenda = function (result) {

    var options = {};

    var attr = {
        function: "createNewComponentAgenda",
        options: options
    };
    return attr;
};

exports.createNewComponentAgendaWithName = function (result) {

    var value = result[1];
    var options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewComponentAgenda", options, value);
};

/* CRA */
exports.createNewComponentCra = function (result) {
    return {
        function: "createNewComponentCra"
    };
};

/**
 * Component Address
 * @param {type} result of bot analyzer (this.parse)
 * @returns {function name and user instruction}
 */
exports.createNewComponentAddress = function (result) {
    var options = {
        componentName: result[1].toLowerCase(),
        instruction: result[0]
    };
    return checkAndCreateAttr("createNewComponentAddress", options, result[1]);
};

/**
 * Delete component address
 */
exports.deleteComponentAddress = function (result) {
    return {
        function :"deleteComponentAddress",
        options:result
    };
};


/* PRINT */
exports.createNewComponentPrint = function (result) {

    var options = {};

    var attr = {
        function: "createNewComponentPrint",
        options: options
    };
    return attr;
};

exports.createNewComponentPrintWithName = function (result) {

    var value = result[1];

    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "createNewComponentPrint",
        options: options
    };
    return attr;
};

exports.deleteComponentPrint = function (result) {

    var options = {};

    var attr = {
        function: "deleteComponentPrint",
        options: options
    };
    return attr;
};

exports.deleteComponentPrintWithName = function (result) {

    var value = result[1];

    var options = {
        value: value,
        processValue: true
    };

    var attr = {
        function: "deleteComponentPrint",
        options: options
    };
    return attr;
};

/* CHAT */
exports.createComponentChat = function (result) {
    return {
        function: "createComponentChat"
    }
}

// ******* INTERFACE Actions ******* //
exports.setLayout = function (result) {

    var value = result[1];
    var options = {
        value: value
    };

    var attr = {
        function: "setLayout",
        options: options
    };
    return attr;
};

exports.setTheme = function (result) {

    var value = result[1];
    var options = {
        value: value
    };

    var attr = {
        function: "setTheme",
        options: options
    };
    return attr;
};

exports.listTheme = function (result) {

    var attr = {
        function: "listTheme"
    };
    return attr;
};

/*exports.setSkin = function (result) {

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

exports.listSkin = function (result) {

    var attr = {
        function: "listSkin"
    };
    return attr;
};*/

exports.listIcon = function (result) {
    return {function: 'listIcon'};
}

exports.setIcon = function (result) {
    var attr = {
        function: "setIcon",
        iconValue: result[1]
    };
    return attr;
}

exports.setIconToEntity = function (result) {
    var attr = {
        function: "setIconToEntity",
        iconValue: result[1],
        entityTarget: result[2]
    };

    return attr;
}

function getRightWidgetType(originalType) {
    switch (originalType) {
        case "boîte d'information":
        case "info box":
        case "info":
        case "information":
            return "info";

        case "boîte de statistiques":
        case "stats box":
        case "stats":
        case "stat":
        case "statistique":
            return "stats";

        case "lastrecords":
        case "last records":
        case "derniers enregistrements":
        case "derniersenregistrements":
            return "lastrecords";

        default:
            return -1;
    }
}

exports.createWidgetLastRecordsWithLimit = function (result) {
    var attr = {
        function: 'createWidgetLastRecords',
        widgetType: 'lastrecords',
        widgetInputType: 'last records'
    }
    console.log(result);
    console.log(result.length);
    // Current entity as target
    if (result.length == 3) {
        attr.limit = result[1];
        attr.columns = result[2].split(',');
    }
    // Defined target entity
    else if (result.length == 4) {
        attr.entityTarget = result[1];
        attr.limit = result[2];
        attr.columns = result[3].split(',');
    }

    // Remove unwanted spaces from columns
    for (var i = 0; i < attr.columns.length; i++)
        attr.columns[i] = attr.columns[i].trim();

    return attr;
}

exports.createWidgetLastRecords = function (result) {
    var attr = {
        function: 'createWidgetLastRecords',
        widgetType: 'lastrecords',
        widgetInputType: 'last records',
        limit: 10
    }

    // Current entity as target
    if (result.length == 2)
        attr.columns = result[1].split(',');
    // Defined target entity
    else if (result.length == 3) {
        attr.entityTarget = result[1];
        attr.columns = result[2].split(',');
    }

    // Remove unwanted spaces from columns
    for (var i = 0; i < attr.columns.length; i++)
        attr.columns[i] = attr.columns[i].trim();

    return attr;
}

exports.createWidgetOnEntity = function (result) {
    var originalType = result[1];
    var finalType = getRightWidgetType(originalType);

    return {
        function: 'createWidgetOnEntity',
        widgetInputType: originalType,
        widgetType: finalType,
        entityTarget: result[2]
    }
}

exports.createWidget = function (result) {
    var originalType = result[1];
    var finalType = getRightWidgetType(originalType);

    return {
        function: 'createWidget',
        widgetInputType: originalType,
        widgetType: finalType
    }
}

exports.deleteWidget = function (result) {
    return {
        function: 'deleteWidget',
        widgetTypes: [getRightWidgetType(result[1])],
        widgetInputType: result[1],
        entityTarget: result[2]
    }
}

exports.deleteEntityWidgets = function (result) {
    return {
        function: 'deleteEntityWidgets',
        entityTarget: result[1]
    }
}

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
        "déploiement"
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
        "sauvegarder",
        "sauvegarder l'application",
        "sauvegarder application",
        "git push"
    ],
    "gitPull": [
        "load",
        "reload",
        "pull",
        "git pull",
        "fetch",
        "recharger"
    ],
    "gitCommit": [
        "commit",
        "git commit"
    ],
    "gitStatus": [
        "status",
        "git status"
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
    "selectEntity": [
        "select entity (.*)",
        "select data entity (.*)",
        "sélectionner l'entité (.*)",
        "sélectionner entité (.*)"
    ],
    "setFieldKnownAttribute": [
        "set field (.*) (.*)",
        "set the field (.*) (.*)",
        "mettre champ (.*) (.*)",
        "mettre le champ (.*) (.*)",
        "mettre le champ (.*) en (.*)",
        "rendre champ (.*) (.*)",
        "rendre le champ (.*) (.*)"
    ],
    "setFieldAttribute": [
        "set field (.*) (.*) (.*)",
        "set the field (.*) (.*) (.*)",
        "mettre champ (.*) (.*) (.*)",
        "mettre le champ (.*) (.*) (.*)",
        "rendre champ (.*) (.*) (.*)",
        "rendre le champ (.*) (.*) (.*)"
    ],
    "setColumnVisibility": [
        "set column (.*) (.*)",
        "mettre la colonne (.*) en (.*)",
        "rendre la colonne (.*) (.*)"
    ],
    "setColumnHidden": [
        "hide column (.*)",
        "hide the column (.*)",
        "cacher la colonne (.*)",
        "cacher colonne (.*)"
    ],
    "setColumnVisible": [
        "show column (.*)",
        "show the column (.*)",
        "afficher la colonne (.*)",
        "afficher colonne (.*)"
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
        "créer le module (.*)",
        "ajouter module (.*)",
        "ajouter un module (.*)",
        "ajouter le module (.*)"
    ],
    "createNewEntity": [
        "create entity (.*)",
        "create data entity (.*)",
        "add entity (.*)",
        "add data entity (.*)",
        "créer entité (.*)",
        "créer une entité (.*)",
        "créer l'entité (.*)",
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
        "ajouter le champ (.*) de type enum avec les valeurs (.*)",
        "create field (.*) with type enum and values (.*) and default value (.*)",
        "create data field (.*) with type enum and values (.*) and default value (.*)",
        "add field (.*) with type enum and values (.*) and default value (.*)",
        "add data field (.*) with type enum and values (.*) and default value (.*)",
        "create field (.*) with type enum with values (.*) and default value (.*)",
        "create data field (.*) with type enum with values (.*) and default value (.*)",
        "add field (.*) with type enum with values (.*) and default value (.*)",
        "add data field (.*) with type enum with values (.*) and default value (.*)",
        "create field (.*) with type enum and values (.*) with default value (.*)",
        "create data field (.*) with type enum and values (.*) with default value (.*)",
        "add field (.*) with type enum and values (.*) with default value (.*)",
        "add data field (.*) with type enum and values (.*) with default value (.*)",
        "créer champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)",
        "créer un champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)",
        "créer le champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter un champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter le champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)"
    ],
    "createNewDataFieldWithTypeRadio": [
        "create field (.*) with type radio and values (.*)",
        "create data field (.*) with type radio and values (.*)",
        "add field (.*) with type radio and values (.*)",
        "add data field (.*) with type radio and values (.*)",
        "créer champ (.*) de type radio avec les valeurs (.*)",
        "créer un champ (.*) de type radio avec les valeurs (.*)",
        "créer le champ (.*) de type radio avec les valeurs (.*)",
        "ajouter champ (.*) de type radio avec les valeurs (.*)",
        "ajouter un champ (.*) de type radio avec les valeurs (.*)",
        "ajouter le champ (.*) de type radio avec les valeurs (.*)",
        "create field (.*) with type radio with values (.*) and default value (.*)",
        "create data field (.*) with type radio with values (.*) and default value (.*)",
        "add field (.*) with type radio with values (.*) and default value (.*)",
        "add data field (.*) with type radio with values (.*) and default value (.*)",
        "create field (.*) with type radio and values (.*) with default value (.*)",
        "create data field (.*) with type radio and values (.*) with default value (.*)",
        "add field (.*) with type radio and values (.*) with default value (.*)",
        "add data field (.*) with type radio and values (.*) with default value (.*)",
        "create field (.*) with type radio and values (.*) and default value (.*)",
        "create data field (.*) with type radio and values (.*) and default value (.*)",
        "add field (.*) with type radio and values (.*) and default value (.*)",
        "add data field (.*) with type radio and values (.*) and default value (.*)",
        "créer champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)",
        "créer un champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)",
        "créer le champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter un champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter le champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)"
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
        "ajouter le champ (.*) de type (.*)",
        "create field (.*) with type (.*) and default value (.*)",
        "create data field (.*) with type (.*) and default value (.*)",
        "add field (.*) with type (.*) and default value (.*)",
        "add data field (.*) with type (.*) and default value (.*)",
        "créer champ (.*) de type (.*) avec la valeur par défaut (.*)",
        "créer un champ (.*) de type (.*) avec la valeur par défaut (.*)",
        "créer le champ (.*) de type (.*) avec la valeur par défaut (.*)",
        "ajouter champ (.*) de type (.*) avec la valeur par défaut (.*)",
        "ajouter un champ (.*) de type (.*) avec la valeur par défaut (.*)",
        "ajouter le champ (.*) de type (.*) avec la valeur par défaut (.*)"
    ],
    "createNewDataField": [
        "create field ?(.*)",
        "create data field (.*)",
        "add field (.*)",
        "add data field (.*)",
        "créer champ (.*)",
        "créer un champ (.*)",
        "créer le champ (.*)",
        "ajouter champ (.*)",
        "ajouter un champ (.*)",
        "ajouter le champ (.*)",
        "create field ?(.*) and default value (.*)",
        "create data field (.*) and default value (.*)",
        "add field (.*) and default value (.*)",
        "add data field (.*) and default value (.*)",
        "create field ?(.*) with default value (.*)",
        "create data field (.*) with default value (.*)",
        "add field (.*) with default value (.*)",
        "add data field (.*) with default value (.*)",
        "créer champ (.*) avec la valeur par défaut (.*)",
        "créer un champ (.*) avec la valeur par défaut (.*)",
        "créer le champ (.*) avec la valeur par défaut (.*)",
        "ajouter champ (.*) avec la valeur par défaut (.*)",
        "ajouter un champ (.*) avec la valeur par défaut (.*)",
        "ajouter le champ (.*) avec la valeur par défaut (.*)"
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
    "listTheme": [
        "list all theme",
        "list theme",
        "list available theme",
        "lister les thèmes",
        "lister les themes",
        "lister thèmes",
        "lister thèmes"
    ],
    "relationshipHasOne": [
        "entity (.*) has one (.*)",
        "entité (.*) possède un (.*)",
        "entité (.*) possède une (.*)",
        "entité (.*) possède (.*)",
        "entité (.*) a un (.*)",
        "entité (.*) a une (.*)",
        "entité (.*) a (.*)"
    ],
    "relationshipHasOneWithName": [
        "entity (.*) has one (.*) called (.*)",
        "entity (.*) has one (.*) with name (.*)",
        "entité (.*) possède un (.*) appelé (.*)",
        "entité (.*) possède une (.*) appelée (.*)",
        "entité (.*) possède (.*) appelé (.*)",
        "entité (.*) possède (.*) appelée (.*)",
        "entité (.*) a un (.*) appelé (.*)",
        "entité (.*) a une (.*) appelée (.*)",
        "entité (.*) a (.*) appelé (.*)",
        "entité (.*) a (.*) appelée (.*)"
    ],
    "createFieldRelatedTo": [
        "create field (.*) related to (.*)",
        "add field (.*) related to (.*)",
        "create data field (.*) related to (.*)",
        "add data field (.*) related to (.*)",
        "créer un champ (.*) relié à (.*)",
        "ajouter un champ (.*) relié à (.*)",
        "créer champ (.*) relié à (.*)",
        "ajouter champ (.*) relié à (.*)"
    ],
    "createFieldRelatedToUsing": [
        "create field (.*) related to (.*) using (.*)",
        "add field (.*) related to (.*) using (.*)",
        "create data field (.*) related to (.*) using (.*)",
        "add data field (.*) related to (.*) using (.*)",
        "créer un champ (.*) relié à (.*) en utilisant (.*)",
        "créer champ (.*) relié à (.*) en utilisant (.*)",
        "créer un champ (.*) relié à (.*) en affichant (.*)",
        "créer champ (.*) relié à (.*) en affichant (.*)",
        "ajouter un champ (.*) relié à (.*) en utilisant (.*)",
        "ajouter un champ (.*) relié à (.*) en affichant (.*)",
        "ajouter champ (.*) relié à (.*) en utilisant (.*)",
        "ajouter champ (.*) relié à (.*) en affichant (.*)",
        "ajouter le champ (.*) relié à (.*) en affichant (.*)",
        "ajouter le champ (.*) relié à (.*) en utilisant (.*)"
    ],
    "relationshipHasMany": [
        "entity (.*) has many (.*)",
        "entité (.*) possède plusieurs (.*)",
        "entité (.*) a plusieurs (.*)"
    ],
    "relationshipHasManyWithName": [
        "entity (.*) has many (.*) called (.*)",
        "entity (.*) has many (.*) with name (.*)",
        "entité (.*) possède plusieurs (.*) appelés (.*)",
        "entité (.*) a plusieurs (.*) appelés (.*)",
        "entité (.*) possède plusieurs (.*) appelées (.*)",
        "entité (.*) a plusieurs (.*) appelées (.*)",
        "entité (.*) possède plusieurs (.*) appelé (.*)",
        "entité (.*) a plusieurs (.*) appelé (.*)"
    ],
    "relationshipHasManyPreset": [
        "entity (.*) has many preset (.*)",
        "entity (.*) has many existing (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini",
        "l'entité (.*) a plusieurs (.*) existant",
        "l'entité (.*) a plusieurs (.*) déjà prédéfini",
        "l'entité (.*) a plusieurs (.*) déjà existant",

        "entity (.*) has many preset (.*) called (.*)",
        "entity (.*) has many existing (.*) called (.*)",
        "entity (.*) has many preset (.*) with name (.*)",
        "entity (.*) has many existing (.*) with name (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini appelés (.*)",
        "l'entité (.*) a plusieurs (.*) existant appelés (.*)",
        "l'entité (.*) a plusieurs (.*) déjà prédéfini appelés (.*)",
        "l'entité (.*) a plusieurs (.*) déjà existant appelés (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini appelées (.*)",
        "l'entité (.*) a plusieurs (.*) existant appelées (.*)",
        "l'entité (.*) a plusieurs (.*) déjà prédéfini appelées (.*)",
        "l'entité (.*) a plusieurs (.*) déjà existant appelées (.*)",
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

        "entity (.*) has many preset (.*) using (.*) called (.*)",
        "entity (.*) has many existing (.*) using (.*) called (.*)",
        "entity (.*) has many preset (.*) through (.*) called (.*)",
        "entity (.*) has many existing (.*) through (.*) called (.*)",
        "entity (.*) has many preset (.*) using field (.*) called (.*)",
        "entity (.*) has many existing (.*) using field (.*) called (.*)",
        "entity (.*) has many preset (.*) through field (.*) called (.*)",
        "entity (.*) has many existing (.*) through field (.*) called (.*)",
        "entity (.*) has many preset (.*) using the field (.*) called (.*)",
        "entity (.*) has many existing (.*) using the field (.*) called (.*)",
        "entity (.*) has many preset (.*) through the field (.*) called (.*)",
        "entity (.*) has many existing (.*) through the field (.*) called (.*)",

        "entity (.*) has many preset (.*) using (.*) with name (.*)",
        "entity (.*) has many existing (.*) using (.*) with name (.*)",
        "entity (.*) has many preset (.*) through (.*) with name (.*)",
        "entity (.*) has many existing (.*) through (.*) with name (.*)",
        "entity (.*) has many preset (.*) using field (.*) with name (.*)",
        "entity (.*) has many existing (.*) using field (.*) with name (.*)",
        "entity (.*) has many preset (.*) through field (.*) with name (.*)",
        "entity (.*) has many existing (.*) through field (.*) with name (.*)",
        "entity (.*) has many preset (.*) using the field (.*) with name (.*)",
        "entity (.*) has many existing (.*) using the field (.*) with name (.*)",
        "entity (.*) has many preset (.*) through the field (.*) with name (.*)",
        "entity (.*) has many existing (.*) through the field (.*) with name (.*)",

        "l'entité (.*) a plusieurs (.*) prédéfini en utilisant (.*) appelés (.*)",
        "l'entité (.*) a plusieurs (.*) existant en utilisant (.*) appelés (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini en affichant (.*) appelés (.*)",
        "l'entité (.*) a plusieurs (.*) existant en affichant (.*) appelés (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini en utilisant le champ (.*) appelés (.*)",
        "l'entité (.*) a plusieurs (.*) existant en utilisant le champ (.*) appelés (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini en affichant le champ (.*) appelés (.*)",
        "l'entité (.*) a plusieurs (.*) existant en affichant le champ (.*) appelés (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini en utilisant (.*) appelées (.*)",
        "l'entité (.*) a plusieurs (.*) existant en utilisant (.*) appelées (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini en affichant (.*) appelées (.*)",
        "l'entité (.*) a plusieurs (.*) existant en affichant (.*) appelées (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini en utilisant le champ (.*) appelées (.*)",
        "l'entité (.*) a plusieurs (.*) existant en utilisant le champ (.*) appelées (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini en affichant le champ (.*) appelées (.*)",
        "l'entité (.*) a plusieurs (.*) existant en affichant le champ (.*) appelées (.*)",
    ],
    "createFieldRelatedToMultiple": [
        "create field (.*) related to multiple (.*)",
        "add field (.*) related to multiple (.*)",
        "create data field (.*) related to multiple (.*)",
        "add data field (.*) related to multiple (.*)",
        "create field (.*) related to many (.*)",
        "add field (.*) related to many (.*)",
        "create data field (.*) related to many (.*)",
        "add data field (.*) related to many (.*)",
        "créer un champ (.*) relié à plusieurs (.*)",
        "ajouter un champ (.*) relié à plusieurs (.*)",
        "créer champ (.*) relié à plusieurs (.*)",
        "ajouter champ (.*) relié à plusieurs (.*)"
    ],
    "createFieldRelatedToMultipleUsing": [
        "create field (.*) related to multiple (.*) using (.*)",
        "add field (.*) related to multiple (.*) using (.*)",
        "create data field (.*) related to multiple (.*) using (.*)",
        "add data field (.*) related to multiple (.*) using (.*)",
        "create field (.*) related to many (.*) using (.*)",
        "add field (.*) related to many (.*) using (.*)",
        "create data field (.*) related to many (.*) using (.*)",
        "add data field (.*) related to many (.*) using (.*)",
        "créer un champ (.*) relié à plusieurs (.*) en utilisant (.*)",
        "créer champ (.*) relié à plusieurs (.*) en utilisant (.*)",
        "créer un champ (.*) relié à plusieurs (.*) en affichant (.*)",
        "créer champ (.*) relié à plusieurs (.*) en affichant (.*)",
        "ajouter un champ (.*) relié à plusieurs (.*) en utilisant (.*)",
        "ajouter un champ (.*) relié à plusieurs (.*) en affichant (.*)",
        "ajouter champ (.*) relié à plusieurs (.*) en utilisant (.*)",
        "ajouter champ (.*) relié à plusieurs (.*) en affichant (.*)"
    ],
    "createNewComponentStatusWithName": [
        "create component status called (.*)",
        "add component status called (.*)",
        "create component status with name (.*)",
        "add component status with name (.*)"
    ],
    "createNewComponentStatus": [
        "create component status",
        "add component status"
    ],
    "createNewComponentLocalFileStorageWithName": [
        "create component local file storage with name (.*)",
        "create component localfilestorage with name (.*)",
        "add component local file storage with name (.*)",
        "add component localfilestorage with name (.*)",
        "create component local file storage called (.*)",
        "create component localfilestorage called (.*)",
        "add component local file storage called (.*)",
        "add component localfilestorage called (.*)",
        "créer composant localfilestorage appelé (.*)",
        "ajouter composant localfilestorage appelé (.*)",
        "créer un composant localfilestorage appelé (.*)",
        "ajouter un composant localfilestorage appelé (.*)",
        "créer le composant localfilestorage appelé (.*)",
        "ajouter le composant localfilestorage appelé (.*)",
        "créer composant de stockage de fichier appelé (.*)",
        "ajouter composant de stockage de fichier appelé (.*)",
        "créer uncomposant de stockage de fichier appelé (.*)",
        "ajouter un composant de stockage de fichier appelé (.*)",
        "créer le composant de stockage de fichier appelé (.*)",
        "ajouter le composant de stockage de fichier appelé (.*)",
        "créer composant de stockage appelé (.*)",
        "ajouter composant de stockage appelé (.*)",
        "créer un composant de stockage appelé (.*)",
        "ajouter un composant de stockage appelé (.*)",
        "créer le composant de stockage appelé (.*)",
        "ajouter le composant de stockage appelé (.*)",
        "ajouter composant stockage fichier appelé (.*)",
        "ajouter composant de stockage appelé (.*)",
        "ajouter composant de stockage de fichier appelé (.*)",
        "ajouter un composant stockage fichier appelé (.*)",
        "ajouter un composant de stockage appelé (.*)",
        "ajouter un composant de stockage de fichier appelé (.*)",
        "ajouter le composant de stockage de fichier appelé (.*)",
        "ajouter le composant de stockage appelé (.*)",
        "créer composant localfilestorage nommé (.*)",
        "ajouter composant localfilestorage nommé (.*)",
        "créer un composant localfilestorage nommé (.*)",
        "ajouter un composant localfilestorage nommé (.*)",
        "créer le composant localfilestorage nommé (.*)",
        "ajouter le composant localfilestorage nommé (.*)",
        "créer composant de stockage de fichier nommé (.*)",
        "ajouter composant de stockage de fichier nommé (.*)",
        "créer uncomposant de stockage de fichier nommé (.*)",
        "ajouter un composant de stockage de fichier nommé (.*)",
        "créer le composant de stockage de fichier nommé (.*)",
        "ajouter le composant de stockage de fichier nommé (.*)",
        "créer composant de stockage nommé (.*)",
        "ajouter composant de stockage nommé (.*)",
        "créer un composant de stockage nommé (.*)",
        "ajouter un composant de stockage nommé (.*)",
        "créer le composant de stockage nommé (.*)",
        "ajouter le composant de stockage nommé (.*)",
        "ajouter composant stockage fichier nommé (.*)",
        "ajouter composant de stockage nommé (.*)",
        "ajouter composant de stockage de fichier nommé (.*)",
        "ajouter un composant stockage fichier nommé (.*)",
        "ajouter un composant de stockage nommé (.*)",
        "ajouter un composant de stockage de fichier nommé (.*)",
        "ajouter le composant de stockage de fichier nommé (.*)",
        "ajouter le composant de stockage nommé (.*)"
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
        "créer le composant localfilestorage",
        "ajouter le composant localfilestorage",
        "créer composant de stockage de fichier local",
        "ajouter composant de stockage de fichier local",
        "créer un composant de stockage de fichier local",
        "ajouter un composant de stockage de fichier local",
        "créer le composant de stockage de fichier local",
        "ajouter le composant de stockage de fichier local",
        "créer composant de stockage de fichier",
        "ajouter composant de stockage de fichier",
        "créer un composant de stockage de fichier",
        "ajouter un composant de stockage de fichier",
        "créer le composant de stockage de fichier",
        "ajouter le composant de stockage de fichier",
        "créer composant de stockage local",
        "ajouter composant de stockage local",
        "créer un composant de stockage local",
        "ajouter un composant de stockage local",
        "créer le composant de stockage local",
        "ajouter le composant de stockage local",
        "ajouter un stockage de documents",
        "créer un stockage de documents",
        "ajouter stockage de documents",
        "créer stockage de documents"
    ],
    "createNewComponentContactFormWithName": [
        "create component contactform with name (.*)",
        "create component contact form with name (.*)",
        "add component contactform with name (.*)",
        "add component contact form with name (.*)",

        "create component contactform called (.*)",
        "create component contact form called (.*)",
        "add component contactform called (.*)",
        "add component contact form called (.*)",

        "créer un composant formulaire de contact appelé (.*)",
        "ajouter un composant formulaire de contact appelé (.*)",
        "créer composant formulaire de contact appelé (.*)",
        "ajouter composant formulaire de contact appelé (.*)",
        "créer le composant formulaire de contact appelé (.*)",
        "ajouter le composant formulaire de contact appelé (.*)",
        "créer un formulaire de contact appelé (.*)",
        "ajouter un formulaire de contact appelé (.*)",
        "créer le formulaire de contact appelé (.*)",
        "ajouter le formulaire de contact appelé (.*)",
        "créer formulaire de contact appelé (.*)",
        "ajouter formulaire de contact appelé (.*)",

        "créer un composant formulaire de contact nommé (.*)",
        "ajouter un composant formulaire de contact nommé (.*)",
        "créer composant formulaire de contact nommé (.*)",
        "ajouter composant formulaire de contact nommé (.*)",
        "créer le composant formulaire de contact nommé (.*)",
        "ajouter le composant formulaire de contact nommé (.*)",
        "créer un formulaire de contact nommé (.*)",
        "ajouter un formulaire de contact nommé (.*)",
        "créer le formulaire de contact nommé (.*)",
        "ajouter le formulaire de contact nommé (.*)",
        "créer formulaire de contact nommé (.*)",
        "ajouter formulaire de contact nommé (.*)"

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
        "créer composant formulaire de contact",
        "ajouter composant formulaire de contact",
        "créer formulaire de contact",
        "ajouter formulaire de contact"
    ],
    "createNewComponentAgenda": [
        "create component agenda",
        "add component agenda",
        "add an agenda",
        "add agenda",
        "créer un composant agenda",
        "ajouter un composant agenda",
        "créer un agenda",
        "ajouter un agenda",
        "créer le composant agenda",
        "ajouter le composant agenda",
        "créer l'agenda",
        "ajouter l'agenda",
        "créer composant agenda",
        "ajouter composant agenda",
        "créer agenda",
        "ajouter agenda",
        "create component timeline",
        "add component timeline",
        "add an timeline",
        "add timeline",
        "créer un composant ligne de temps",
        "ajouter un composant ligne de temps",
        "créer un ligne de temps",
        "ajouter un ligne de temps"
    ],
    "createNewComponentAgendaWithName": [
        "create component agenda with name (.*)",
        "add component agenda with name (.*)",
        "add agenda with name (.*)",
        "create component agenda called (.*)",
        "add component agenda called (.*)",
        "add agenda called (.*)",
        "créer un composant agenda appelé (.*)",
        "ajouter un composant agenda appelé (.*)",
        "créer le composant agenda appelé (.*)",
        "ajouter le composant agenda appelé (.*)",
        "créer composant agenda appelé (.*)",
        "ajouter composant agenda appelé (.*)",
        "créer un agenda appelé (.*)",
        "ajouter un agenda appelé (.*)",
        "créer l'agenda appelé (.*)",
        "ajouter l'agenda appelé (.*)",
        "créer agenda appelé (.*)",
        "ajouter agenda appelé (.*)",
        "créer un composant agenda nommé (.*)",
        "ajouter un composant agenda nommé (.*)",
        "créer le composant agenda nommé (.*)",
        "ajouter le composant agenda nommé (.*)",
        "créer composant agenda nommé (.*)",
        "ajouter composant agenda nommé (.*)",
        "créer un agenda nommé (.*)",
        "ajouter un agenda nommé (.*)",
        "créer l'agenda nommé (.*)",
        "ajouter l'agenda nommé (.*)",
        "créer agenda nommé (.*)",
        "ajouter agenda nommé (.*)",
        "create component timeline with name (.*)",
        "add component timeline with name (.*)",
        "add timeline with name (.*)",
        "créer un composant ligne de temps nommé (.*)",
        "ajouter un composant ligne de temps nommé (.*)",
        "créer une ligne de temps nommé (.*)",
        "ajouter une ligne de temps nommé (.*)",
        "créer une ligne de temps avec le nom (.*)",
        "ajouter une ligne de temps avec le nom (.*)",
        "créer une ligne de temps appelé (.*)",
        "ajouter une ligne de temps appelé (.*)"
    ],
    "createNewComponentCra": [
        "ajouter composant gestion de temps",
        "ajouter un composant gestion de temps",
        "create component cra",
        "add component cra",
        "create component activity report",
        "add component activity report",
        "create component time sheet",
        "add component time sheet",
        "create component timesheet",
        "add component timesheet",
        "créer un composant cra",
        "ajouter un composant cra",
        "créer composant cra",
        "ajouter composant cra",
        "créer le composant cra",
        "ajouter le composant cra",
        "créer un composant compte-rendu d'activité",
        "ajouter un composant compte-rendu d'activité",
        "créer composant compte-rendu d'activité",
        "ajouter composant compte-rendu d'activité",
        "créer un composant compte-rendu d'activités",
        "ajouter un composant compte-rendu d'activités",
        "créer composant compte-rendu d'activités",
        "ajouter composant compte-rendu d'activités"
    ],
    "createNewComponentPrint": [
        "create component print",
        "add component print",
        "créer un composant impression",
        "ajouter un composant impression",
        "créer composant impression",
        "ajouter composant impression"
    ],
    "createNewComponentPrintWithName": [
        "create component print with name (.*)",
        "add component print with name (.*)",
        "add print with name (.*)",
        "create component print called (.*)",
        "add component print called (.*)",
        "add print called (.*)",
        "créer un composant impression appelé (.*)",
        "ajouter un composant impression appelé (.*)",
        "créer le composant impression appelé (.*)",
        "ajouter le composant impression appelé (.*)",
        "créer composant impression appelé (.*)",
        "ajouter composant impression appelé (.*)",
        "créer un impression appelé (.*)",
        "ajouter un impression appelé (.*)",
        "créer impression appelé (.*)",
        "ajouter impression appelé (.*)",
        "créer impression appelé (.*)",
        "ajouter impression appelé (.*)",
        "créer un composant impression nommé (.*)",
        "ajouter un composant impression nommé (.*)",
        "créer le composant impression nommé (.*)",
        "ajouter le composant impression nommé (.*)",
        "créer composant impression nommé (.*)",
        "ajouter composant impression nommé (.*)",
        "créer un impression nommé (.*)",
        "ajouter un impression nommé (.*)",
        "créer impression nommé (.*)",
        "ajouter impression nommé (.*)",
        "créer impression nommé (.*)",
        "ajouter impression nommé (.*)"
    ],
    "deleteComponentPrint": [
        "delete component print",
        "delete print component",
        "supprimer composant impression",
        "supprimer le composant impression"
    ],
    "deleteComponentPrintWithName": [
        "delete component print with name (.*)",
        "delete print component with name (.*)",
        "delete component print called (.*)",
        "delete print component called (.*)",
        "supprimer composant impression nommé (.*)",
        "supprimer composant impression appelé (.*)",
        "supprimer le composant impression nommé (.*)",
        "supprimer le composant impression appelé (.*)"
    ],
    "createNewComponentAddress": [
    	"add component Address with name (.*)",
    	"add component address with name (.*)",
        "add component Address called (.*)",
        "add component address called (.*)",
    	"ajouter un composant adresse nommé (.*)",
    	"ajouter un composant adresse appelé (.*)",
    	"ajouter un composant Adresse nommé (.*)",
    	"ajouter un composant Adresse appelé (.*)",
    	"ajouter composant adresse nommé (.*)",
    	"ajouter composant adresse appelé (.*)",
    	"ajouter composant Adresse nommé (.*)",
    	"ajouter composant Adresse appelé (.*)"
    ],
    "deleteComponentAddress": [
    	"delete component address",
    	"supprimer le composant adresse"
    ],
    "createComponentChat": [
        "add component chat",
        "create component chat",
    	"ajouter le composant Discussion",
    	"ajouter composant Discussion",
    	"ajouter le composant discussion",
    	"ajouter composant discussion"
    ],
    "setLayout": [
        "set layout (.*)",
        "appliquer le layout (.*)"
    ],
    "setTheme": [
        "set theme (.*)",
        "appliquer le theme (.*)",
        "appliquer le thème (.*)",
        "appliquer theme (.*)",
        "appliquer thème (.*)"
    ],
    "setSkin": [
        "set skin (.*)",
        "set color (.*)",
        "set colour (.*)",
        "appliquer le style (.*)",
        "appliquer la couleur (.*)",
        "mettre la couleur (.*)"
    ],
    "listIcon" : [
        "list icon",
        "list icons",
        "lister les icones",
        "lister icones",
        "lister icone",
        "lister icon",
        "lister icônes",
        "lister icône"
    ],
    "setIconToEntity": [
        "set icon (.*) to entity (.*)",
        "set icon (.*) on entity (.*)",
        "set icon (.*) on (.*)",
        "set icon (.*) to (.*)",
        "mettre l'icône (.*) sur l'entité (.*)",
        "mettre l'icone (.*) sur l'entité (.*)",
        "mettre l'icône (.*) sur (.*)",
        "mettre l'icone (.*) sur (.*)",
        "mettre l'icone (.*) a l'entité (.*)",
        "mettre l'icône (.*) à l'entité (.*)",
        "mettre l'icône (.*) à (.*)",
        "mettre une icône (.*) à (.*)",
        "mettre une icône (.*) sur (.*)",
        "mettre icône (.*) à (.*)",
        "mettre icône (.*) sur (.*)",
        "mettre l'icône (.*) sur (.*)",
        "mettre l'icone (.*) à (.*)",
        "mettre l'icone (.*) sur (.*)"
    ],
    "setIcon": [
        "set icon (.*)",
        "mettre l'icône (.*)",
        "mettre l'icone (.*)",
        "mettre icône (.*)",
        "mettre icone (.*)",
        "mettre une icône (.*)",
        "mettre une icone (.*)"
    ],
    "createWidgetLastRecordsWithLimit": [
        "add widget last records limited to (.*) records with columns (.*)",
        "add widget last records on entity (.*) limited to (.*) records with columns (.*)",
        "ajouter un widget derniers enregistrements sur l'entité (.*) limité à (.*) enregistrements avec les colonnes (.*)",
        "ajouter widget derniers enregistrements sur l'entité (.*) limité à (.*) enregistrements avec les colonnes (.*)",
        "créer un widget derniers enregistrements limité à (.*) enregistrements avec les colonnes (.*)",
        "créer un widget derniers enregistrements sur l'entité (.*) limité à (.*) enregistrements avec les colonnes (.*)"
    ],
    "createWidgetLastRecords": [
        "add widget last records with columns (.*)",
        "add widget last records on entity (.*) with columns (.*)",
        "ajouter un widget derniers enregistrements avec les colonnes (.*)",
        "ajouter un widget derniers enregistrements sur l'entité (.*) avec les colonnes (.*)",
        "ajouter widget derniers enregistrements avec les colonnes (.*)",
        "ajouter widget derniers enregistrements sur l'entité (.*) avec les colonnes (.*)",
        "créer un widget derniers enregistrements avec les colonnes (.*)",
        "créer un widget derniers enregistrements sur l'entité (.*) avec les colonnes (.*)",
        "créer widget derniers enregistrements avec les colonnes (.*)",
        "créer widget derniers enregistrements sur l'entité (.*) avec les colonnes (.*)"
    ],
    "createWidgetOnEntity": [
        "créer une (.*) sur l'entité (.*)",
        "créer un widget (.*) sur l'entité (.*)",
        "ajouter une (.*) sur l'entité (.*)",
        "ajouter un widget (.*) sur l'entité (.*)",
        "add widget (.*) on entity (.*)",
        "create widget (.*) on entity (.*)"
    ],
    "createWidget": [
        "add widget (.*)",
        "create widget (.*)",
        "ajouter une (.*)",
        "ajouter un widget (.*)",
        "créer une (.*)",
        "créer un widget (.*)"
    ],
    "deleteWidget": [
        "delete widget (.*) of entity (.*)",
        "delete widget (.*) for entity (.*)",
        "delete widget (.*) of (.*)",
        "delete widget (.*) for (.*)",
        "supprimer widget (.*) de (.*)",
        "supprimer le widget (.*) de (.*)",
        "supprimer le widget (.*) de l'entité (.*)"
    ],
    "deleteEntityWidgets": [
        "delete widgets of (.*)",
        "delete widgets of entity (.*)",
        "delete all widgets of entity (.*)",
        "delete all widgets of (.*)",
        "supprimer les widgets de (.*)",
        "supprimer tous les widgets de (.*)",
        "supprimer les widgets de l'entité (.*)",
        "supprimer tous les widgets de l'entité (.*)"
    ]
};

// ******* Parse *******
exports.parse = function (instruction) {

    var instructionResult = {
        instructionLength: 0
    };

    for (var action in training) {
        for (var i = 0; i < training[action].length; i++) {
            var regStr = training[action][i];
            var regExp = new RegExp(regStr, "ig");

            var result = regExp.exec(instruction);
            if (result !== null) {
                /* Get the most complicated instruction found */
                if (instructionResult.instructionLength < regStr.length) {
                    instructionResult = {
                        action: action,
                        result: result,
                        instructionLength: regStr.length
                    };
                }
            }
        }
    }
    var attr = {};
    if (typeof instructionResult.action !== "undefined") {
        attr = this[instructionResult.action](instructionResult.result);
        attr.instruction = instruction;
    } else {
        attr.error = "error.cannotFindInstruction";
    }

    return attr;
}

// ******* Completion *******
exports.complete = function(instruction) {

    var answers = [];
    var p = 0;

    // Check all training key phrases
    for (var action in training) {

        // Check each blocks
        for (var i = 0; i < training[action].length; i++) {

            // console.log(template);
            // console.log(instr);

            // Template to compare to
            var template = training[action][i].split(" ");

            // Split curent key phrase and instructions into arrays to loop
            var instr = instruction.trim().split(" ");

            var k = 0; // index in template
            var m = 0; // index in instruction

            var l = instr.length;
            var n = template.length;

            var answer = " ";
            var valid = true;
            var variable = false;
            while ((m < l) && (k < n) && (valid)) {
                // Check if words are the same, goto next word
                if (template[k] == instr[m]) {
                    variable = false;
                    k++;
                } else {
                    // Check if beginning of word are the same
                    var sublen = instr[m].length;
                    if (template[k].substring(0, sublen) == instr[m]) {
                        // Do not increment k, we are still on keyword
                        variable = false;
                    } else {
                        // If we parse the variable value
                        if (template[k] == "(.*)") {
                            // Check next word
                            if (template[k + 1]) {
                                k++;
                                variable = true;
                            }
                        } else {
                            // If we are not parsing a variable, it means template is not appropriate => Exit
                            if (!variable)
                                valid = false;
                        }
                    }
                }

                m++;
            }

            // Instruction has respected template, so send next keyword if any
            if ((valid) && (m == l)) {
                var found = false;
                var firstLoop = true;

                while ((k < n) && !found) {
                    // Return next keyword
                    if (template[k] != "(.*)")
                        answer = answer + template[k] + " ";
                    else {
                        if (template[k - 1] == "type")
                            answer = answer + "[type] ";
                        // Return [variable] to explain this is something dynamic
                        else
                            answer = answer + "[variable] ";

                        // If first loop on variable, we need to display possible end of instruction
                        // Else, it means we have keyword at the beginning of suggestion, so we cut on variable step
                        if (!firstLoop)
                            found = true;
                    }

                    firstLoop = false;
                    k++;
                }

                if (answer.trim() == "[type]") {

                    // Add list of types to answer
                    answers.push("string");
                    answers.push("text");
                    answers.push("number");
                    answers.push("decimal");
                    answers.push("date");
                    answers.push("datetime");
                    answers.push("time");
                    answers.push("boolean");
                    answers.push("email");
                    answers.push("tel");
                    answers.push("fax");
                    answers.push("money");
                    answers.push("euro");
                    answers.push("qrcode");
                    answers.push("ean8");
                    answers.push("ean13");
                    answers.push("upc");
                    answers.push("code39");
                    answers.push("alpha39");
                    answers.push("code128");
                    answers.push("url");
                    answers.push("password");
                    answers.push("color");
                    answers.push("file");
                }
                // Build array of string answers
                else
                    answers.push(answer.trim());
            }
        }
    }

    // Filter array of results (remove double values)
    var i, j, len = answers.length,
        out = [],
        obj = {};
    for (i = 0; i < len; i++)
        obj[answers[i]] = 0;
    for (j in obj)
        out.push(j);

    // Sort array of results
    out.sort();

    return out;
}

module.exports = exports;
