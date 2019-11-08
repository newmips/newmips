function checkAndCreateAttr(instructionsFunction, options, valueToCheck) {

    let data = {
        function: instructionsFunction,
        options: options
    };

    if (!isNaN(valueToCheck)) {
        data.error = "error.oneLetter";
    }

    if (valueToCheck.length > 30) {
        console.log("Value is too long => " + valueToCheck + "(" + valueToCheck.length + ")");
        data.error = "error.valueTooLong";
        data.errorParams = [valueToCheck];
    }

    return data;
}

// ******* BASIC Actions ******* //
exports.showSession = result => {

    let data = {};
    data.function = "showSession";
    return data;
};

exports.help = result => {

    let data = {};
    data.function = "help";
    return data;
};

exports.deploy = result => {

    let data = {};
    data.function = "deploy";
    return data;
};

exports.restart = result => {
    let data = {};
    data.function = "restart";
    return data;
};

exports.installNodePackage = result => {
    let data = {
        specificModule: null
    };

    // Specific module
    if(typeof result[1] !== "undefined")
        data.specificModule = result[1].trim();

    data.function = "installNodePackage";
    return data;
};

exports.gitPush = result => {
    let data = {};
    data.function = "gitPush";
    return data;
};

exports.gitPull = result => {
    let data = {};
    data.function = "gitPull";
    return data;
};

exports.gitCommit = result => {
    let data = {};
    data.function = "gitCommit";
    return data;
};

exports.gitStatus = result => {
    let data = {};
    data.function = "gitStatus";
    return data;
};

// ******* SELECT Actions ******* //

exports.selectApplication = result => {

    let value = result[1];
    let options = {
        value: value
    };

    let data = {
        function: "selectApplication",
        options: options
    };
    return data;
};

exports.selectModule = result => {

    let value = result[1];
    let options = {
        value: value.trim(),
        processValue: true
    };

    let data = {
        function: "selectModule",
        options: options
    };
    return data;
};

exports.selectEntity = result => {

    let value = result[1];
    let options = {
        value: value.trim(),
        processValue: true
    };

    let data = {
        function: "selectEntity",
        options: options
    };
    return data;
};

// ******* FIELD ATTRIBUTES Actions ******* //
exports.setFieldAttribute = result => {

    // Set entity name as the first option in options array
    let options = {
        value: result[1],
        word: result[2],
        attributeValue: result[3],
        processValue: true
    };

    let data = {
        function: "setFieldAttribute",
        options: options
    };
    return data;
};

exports.setFieldKnownAttribute = result => {

    // Set entity name as the first option in options array
    let options = {
        value: result[1],
        word: result[2],
        processValue: true
    };

    let data = {
        function: "setFieldKnownAttribute",
        options: options
    };
    return data;
};

// ******* DATALIST Actions ******* //
exports.setColumnVisibility = result => {

    // Set entity name as the first option in options array
    let options = {
        value: result[1],
        word: result[2],
        processValue: true
    };

    let data = {
        function: "setColumnVisibility",
        options: options
    };
    return data;
};

exports.setColumnHidden = result => {

    // Set entity name as the first option in options array
    let options = {
        value: result[1],
        word: "hidden",
        processValue: true
    };

    let data = {
        function: "setColumnVisibility",
        options: options
    };
    return data;
};

exports.setColumnVisible = result => {

    // Set entity name as the first option in options array
    let options = {
        value: result[1],
        word: "visible",
        processValue: true
    };

    let data = {
        function: "setColumnVisibility",
        options: options
    };
    return data;
};

// ******* CREATE Actions ******* //
exports.createNewProject = result => {

    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewProject", options, value);
};

exports.createNewApplication = result => {

    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewApplication", options, value);
};

exports.createNewModule = result => {

    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewModule", options, value);
};

exports.createNewEntity = result => {

    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewEntity", options, value);
};

exports.createNewDataField = result => {

    // Field name has not been defined
    let value = result[1];
    let defaultValue = null;

    // Default value ?
    if (typeof result[2] !== "undefined")
        defaultValue = result[2];

    let options = {
        value: value,
        defaultValue: defaultValue,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

exports.createNewDataFieldWithType = result => {

    let value = result[1];
    let type = result[2].toLowerCase().trim();
    let defaultValue = null;

    // Default value ?
    if (typeof result[3] !== "undefined")
        defaultValue = result[3];
        // if(type == 'text')
        //     console.warn("Default value for type text is not available, it will be ignored.");
        // else
        //     defaultValue = result[3];

    // Preparing Options
    let options = {
        value: value,
        type: type,
        defaultValue: defaultValue,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

exports.createNewDataFieldWithTypeEnum = result => {

    let value = result[1];
    let allValues = result[2];
    let defaultValue = null;

    // Default value ?
    if (typeof result[3] !== "undefined")
        defaultValue = result[3];

    let options = {
        value: value,
        type: "enum",
        allValues: allValues,
        defaultValue: defaultValue,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

exports.createNewDataFieldWithTypeRadio = result => {

    let value = result[1];
    let allValues = result[2];
    let defaultValue = null;

    // Default value ?
    if (typeof result[3] !== "undefined")
        defaultValue = result[3];

    let options = {
        value: value,
        type: "radio",
        allValues: allValues,
        defaultValue: defaultValue,
        processValue: true
    };

    return checkAndCreateAttr("createNewDataField", options, value);
};

// ******* DELETE Actions ******* //
exports.deleteProject = result => {

    let value = result[1];

    let options = {
        value: value,
        processValue: true
    };

    let data = {
        function: "deleteProject",
        options: options
    };
    return data;
};

exports.deleteApplication = result => {

    let value = result[1];

    let options = {
        value: value,
        processValue: true
    };

    let data = {
        function: "deleteApplication",
        options: options
    };
    return data;
};

exports.deleteModule = result => {

    let value = result[1];

    let options = {
        value: value,
        processValue: true
    };

    let data = {
        function: "deleteModule",
        options: options
    };
    return data;
};

exports.deleteDataEntity = result => {

    let value = result[1];

    let options = {
        value: value,
        processValue: true
    };

    let data = {
        function: "deleteDataEntity",
        options: options
    };
    return data;
};

exports.deleteField = result => {

    let value = result[1];

    let options = {
        value: value,
        processValue: true
    };

    let data = {
        function: "deleteField",
        options: options
    };
    return data;
};

exports.deleteTab = result => {

    let value = result[1];

    let options = {
        value: value,
        processValue: true
    };

    let data = {
        function: "deleteTab",
        options: options
    };
    return data;
};

// ******* LIST Actions ******* //
exports.listApplication = result => {

    let data = {
        function: "listApplication"
    };
    return data;
};

exports.listModule = result => {

    let data = {
        function: "listModule"
    };
    return data;
};

exports.listEntity = result => {

    let data = {
        function: "listEntity"
    };
    return data;
};

exports.listField = result => {

    let data = {
        function: "listField"
    };
    return data;
};

// ******* ASSOCIATION Actions ******* //

// --------- One to One ---------
// Tabs in show
exports.relationshipHasOne = result => {

    let source = result[1];
    let target = result[2];

    let options = {
        target: target,
        source: source,
        foreignKey: "id_" + target.toLowerCase(),
        as: target,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasOne", options, target);
};

exports.relationshipHasOneWithName = result => {

    let source = result[1];
    let target = result[2];
    let as = result[3];

    let options = {
        target: target,
        source: source,
        foreignKey: "id_" + target.toLowerCase() + "_" + as.toLowerCase(),
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasOne", options, as);
};


// --------- Field in create / update / show ---------
exports.createFieldRelatedTo = result => {

    let as = result[1];
    let target = result[2];

    let options = {
        target: target,
        foreignKey: "id_" + target.toLowerCase() + "_" + as.toLowerCase(),
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedTo", options, as);
};

exports.createFieldRelatedToUsing = result => {

    let as = result[1];
    let target = result[2];
    let usingField = result[3];

    let options = {
        target: target,
        foreignKey: "id_" + target.toLowerCase() + "_" + as.toLowerCase(),
        as: as,
        usingField: usingField,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedTo", options, as);
};

exports.createFieldRelatedToMultiple = result => {

    let as = result[1];
    let target = result[2];

    // Preparing Options
    let options = {
        target: target,
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedToMultiple", options, as);
};

exports.createFieldRelatedToMultipleUsing = result => {

    let as = result[1];
    let target = result[2];
    let usingField = result[3];

    let options = {
        target: target,
        as: as,
        usingField: usingField,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedToMultiple", options, as);
};

exports.createFieldRelatedToMultipleCheckbox = result => {

    let as = result[1];
    let target = result[2];

    // Preparing Options
    let options = {
        target: target,
        isCheckbox: true,
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedToMultiple", options, as);
};

exports.createFieldRelatedToMultipleCheckboxUsing = result => {

    let as = result[1];
    let target = result[2];
    let usingField = result[3];

    let options = {
        target: target,
        as: as,
        usingField: usingField,
        isCheckbox: true,
        processValue: true
    };

    return checkAndCreateAttr("createNewFieldRelatedToMultiple", options, as);
};

// --------- One to Many ---------
// Tabs in show
exports.relationshipHasMany = result => {

    let source = result[1];
    let target = result[2];

    let options = {
        target: target,
        source: source,
        foreignKey: "id_" + source.toLowerCase(),
        as: target,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasMany", options, target);
};

exports.relationshipHasManyWithName = result => {

    let source = result[1];
    let target = result[2];
    let as = result[3];

    let options = {
        target: target,
        source: source,
        foreignKey: "id_" + source.toLowerCase() + "_" + as.toLowerCase(),
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasMany", options, as);
};

exports.relationshipHasManyPreset = result => {
    let source = result[1];
    let target = result[2];
    let as = target;
    let foreignKey = "id_" + source.toLowerCase();

    if (typeof result[3] !== "undefined")
        as = result[3];
    foreignKey = "id_" + source.toLowerCase() + "_" + as.toLowerCase()

    let options = {
        target: target,
        source: source,
        foreignKey: foreignKey,
        as: as,
        processValue: true
    };

    return checkAndCreateAttr("createNewHasManyPreset", options, target);
};

exports.relationshipHasManyPresetUsing = result => {
    let source = result[1];
    let target = result[2];
    let usingField = result[3];
    let as = target;
    let foreignKey = "id_" + source.toLowerCase();

    if (typeof result[4] !== "undefined")
        as = result[4];
    foreignKey = "id_" + source.toLowerCase() + "_" + as.toLowerCase()

    let options = {
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

/* STATUS */
exports.createNewComponentStatus = result => {
    let defaultValue = result[0].indexOf("component") != -1 ? "Status" : "Statut";
    return {
        function: "createNewComponentStatus",
        options: {value: defaultValue, processValue: true}
    };
}

exports.createNewComponentStatusWithName = result => {
    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewComponentStatus", options, value);
}

exports.deleteComponentStatus = result => {

    let options = {};

    let data = {
        function: "deleteComponentStatus",
        options: options
    };
    return data;
};

exports.deleteComponentStatusWithName = result => {
    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("deleteComponentStatus", options, value);
};

/* LOCAL FILE STORAGE */
exports.createNewComponentLocalFileStorage = result => {

    let options = {};

    let data = {
        function: "createNewComponentLocalFileStorage",
        options: options
    };
    return data;
};

exports.createNewComponentLocalFileStorageWithName = result => {

    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewComponentLocalFileStorage", options, value);
};

/* CONTACT FORM */
exports.createNewComponentContactForm = result => {

    let options = {};

    let data = {
        function: "createNewComponentContactForm",
        options: options
    };
    return data;
};

exports.createNewComponentContactFormWithName = result => {

    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewComponentContactForm", options, value);
};

exports.deleteComponentContactForm = result => {

    let options = {};

    let data = {
        function: "deleteComponentContactForm",
        options: options
    };
    return data;
};

exports.deleteComponentContactFormWithName = result => {
    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("deleteComponentContactForm", options, value);
};

/* AGENDA */
exports.createNewComponentAgenda = result => {

    let options = {};

    let data = {
        function: "createNewComponentAgenda",
        options: options
    };
    return data;
};

exports.createNewComponentAgendaWithName = result => {

    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("createNewComponentAgenda", options, value);
};

exports.deleteAgenda = result => {

    let options = {};

    let data = {
        function: "deleteAgenda",
        options: options
    };
    return data;
};

exports.deleteAgendaWithName = result => {

    let value = result[1];
    let options = {
        value: value,
        processValue: true
    };

    return checkAndCreateAttr("deleteAgenda", options, value);
};

/* CRA */
exports.createNewComponentCra = result => {
    return {
        function: "createNewComponentCra"
    };
};

/**
 * Component Address
 * @param {type} result of bot analyzer (this.parse)
 * @returns {function name and user instruction}
 */
exports.createNewComponentAddress = result => {
    let options = {
        componentName: "Address",
        instruction: result[0]
    };
    return checkAndCreateAttr("createNewComponentAddress", options, "Address");
};

/**
 * Component Address
 * @param {type} result of bot analyzer (this.parse)
 * @returns {function name and user instruction}
 */
exports.createNewComponentAddressWithName = result => {
    let options = {
        componentName: result[1],
        instruction: result[0]
    };
    return checkAndCreateAttr("createNewComponentAddress", options, result[1]);
};

/**
 * Delete component address
 */
exports.deleteComponentAddress = result => {
    return {
        function: "deleteComponentAddress",
        options: result
    };
};

/**
 * create component DocumentTemplate
 */
exports.createComponentDocumentTemplate = result => {
    return {
        function: "createComponentDocumentTemplate",
        options: result
    };
};

exports.createComponentDocumentTemplateWithName = result => {
    let options = {
        instruction: result[0],
        componentName: result[1]
    };
    return checkAndCreateAttr("createComponentDocumentTemplate", options, result[1]);
};
/**
 * Delete component DocumentTemplate
 */
exports.deleteComponentDocumentTemplate = result => {
    return {
        function: "deleteComponentDocumentTemplate",
        options: result
    };
};

/* CHAT */
exports.createComponentChat = result => {
    return {
        function: "createComponentChat"
    }
}

// ******* INTERFACE Actions ******* //
exports.setLogo = result => {
    let value = result[1];
    let options = {
        value: value
    };

    let data = {
        function: "setLogo",
        options: options
    };
    return data;
};

exports.removeLogo = result => {
    let data = {};
    data.function = "removeLogo";
    return data;
};

exports.setLayout = result => {

    let value = result[1];
    let options = {
        value: value
    };

    let data = {
        function: "setLayout",
        options: options
    };
    return data;
};

exports.listLayout = result => {

    let data = {
        function: "listLayout"
    };
    return data;
};

exports.setTheme = result => {

    let value = result[1];
    let options = {
        value: value
    };

    let data = {
        function: "setTheme",
        options: options
    };
    return data;
};

exports.listTheme = result => {

    let data = {
        function: "listTheme"
    };
    return data;
};

exports.listIcon = result => {
    return {function: 'listIcon'};
}

exports.setIcon = result => {
    let data = {
        function: "setIcon",
        iconValue: result[1],
        options: {
            value: result[2],
            processValue: true
        }
    };
    return data;
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

        default:
            return -1;
    }
}

function buildDataForPiechart(result) {
    let data = {
        function: 'createWidgetPiechart',
        widgetType: 'piechart',
        widgetInputType: 'Piechart'
    }
    // Current entity as target
    if (result.length == 2)
        data.givenField = result[1];
    // Defined target entity
    else if (result.length == 3) {
        data.entityTarget = result[1].trim();
        data.givenField = result[2].trim();
    }

    return data;
}

exports.createWidgetPiechart = result => {
    let data = buildDataForPiechart(result);
    data.legend = true;

    return data;
}

exports.createWidgetPiechartWithoutLegend = result => {
    let data = buildDataForPiechart(result);
    data.legend = false;

    return data;
}

exports.createWidgetLastRecordsWithLimit = result => {
    let data = {
        function: 'createWidgetLastRecords',
        widgetType: 'lastrecords',
        widgetInputType: 'last records'
    }
    // Current entity as target
    if (result.length == 3) {
        data.limit = result[1];
        data.columns = result[2].split(',');
    }
    // Defined target entity
    else if (result.length == 4) {
        data.entityTarget = result[1];
        data.limit = result[2];
        data.columns = result[3].split(',');
    }

    // Remove unwanted spaces from columns
    for (let i = 0; i < data.columns.length; i++)
        data.columns[i] = data.columns[i].trim();

    return data;
}

exports.createWidgetLastRecords = result => {
    let data = {
        function: 'createWidgetLastRecords',
        widgetType: 'lastrecords',
        widgetInputType: 'last records',
        limit: 10
    }

    // Current entity as target
    if (result.length == 2)
        data.columns = result[1].split(',');
    // Defined target entity
    else if (result.length == 3) {
        data.entityTarget = result[1];
        data.columns = result[2].split(',');
    }

    // Remove unwanted spaces from columns
    for (let i = 0; i < data.columns.length; i++)
        data.columns[i] = data.columns[i].trim();

    return data;
}

exports.createWidgetOnEntity = result => {
    let originalType = result[1];
    let finalType = getRightWidgetType(originalType);

    if (finalType == -1)
        return {error: 'error.missingParametersInstruction'};

    return {
        function: 'createWidgetOnEntity',
        widgetInputType: originalType,
        widgetType: finalType,
        entityTarget: 'e_' + result[2].toLowerCase()
    }
}

exports.createWidget = result => {
    let originalType = result[1];
    let finalType = getRightWidgetType(originalType);

    if (finalType == -1)
        return {error: 'error.missingParametersInstruction'};

    return {
        function: 'createWidget',
        widgetInputType: originalType,
        widgetType: finalType
    }
}

exports.deleteWidget = result => {
    return {
        function: 'deleteWidget',
        widgetTypes: [result[1] == 'piechart' ? 'piechart' : getRightWidgetType(result[1])],
        widgetInputType: result[1]
    }
}

exports.deleteEntityWidgets = result => {
    return {
        function: 'deleteEntityWidgets',
        entityTarget: result[1]
    }
}

exports.addTitle = result => {
    let value = result[1];
    let afterField = null;
    if (typeof result[2] !== "undefined")
        afterField = result[2];
    return {
        function: "addTitle",
        options: {
            value: value,
            afterField: afterField
        }
    };
}

// --- FUN --- //
exports.apero = result => {
    return {
        function: "apero"
    }
}

let training = {
    "apero": [
        "Apéro !"
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
    "installNodePackage": [
        "npm install",
        "npm install (.*)",
        "installer les modules node",
        "installer le module node (.*)",
        "install node package"
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
        "set field (.*) attribute (.*) (.*)",
        "set field (.*) with attribute (.*) (.*)",
        "set the field (.*) with attribute (.*) (.*)",
        "set field (.*) attribute (.*) = (.*)",
        "set field (.*) with attribute (.*) = (.*)",
        "set the field (.*) with attribute (.*) = (.*)",
        "set field (.*) attribute (.*)=(.*)",
        "set field (.*) with attribute (.*)=(.*)",
        "set the field (.*) with attribute (.*)=(.*)",
        "mettre le champ (.*) avec l'attribut (.*) (.*)",
        "ajouter sur le champ (.*) l'attribut (.*) (.*)",
        "mettre le champ (.*) avec l'attribut (.*) = (.*)",
        "ajouter sur le champ (.*) l'attribut (.*) = (.*)",
        "mettre le champ (.*) avec l'attribut (.*)=(.*)",
        "ajouter sur le champ (.*) l'attribut (.*)=(.*)"
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
        "add field (.*) with type enum and values (.*)",
        "create field (.*) with type enum with values (.*)",
        "add field (.*) with type enum with values (.*)",
        "créer champ (.*) de type enum avec les valeurs (.*)",
        "créer un champ (.*) de type enum avec les valeurs (.*)",
        "ajouter champ (.*) de type enum avec les valeurs (.*)",
        "ajouter un champ (.*) de type enum avec les valeurs (.*)",
        "ajouter le champ (.*) de type enum avec les valeurs (.*)",
        "create field (.*) with type enum and values (.*) and default value (.*)",
        "add field (.*) with type enum and values (.*) and default value (.*)",
        "create field (.*) with type enum with values (.*) and default value (.*)",
        "add field (.*) with type enum with values (.*) and default value (.*)",
        "create field (.*) with type enum and values (.*) with default value (.*)",
        "add field (.*) with type enum and values (.*) with default value (.*)",
        "créer champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)",
        "créer un champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)",
        "créer le champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter un champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter le champ (.*) de type enum avec les valeurs (.*) et la valeur par défaut (.*)"
    ],
    "createNewDataFieldWithTypeRadio": [
        "create field (.*) with type radio and values (.*)",
        "add field (.*) with type radio and values (.*)",
        "create field (.*) with type radio with values (.*)",
        "add field (.*) with type radio with values (.*)",
        "créer champ (.*) de type radio avec les valeurs (.*)",
        "créer un champ (.*) de type radio avec les valeurs (.*)",
        "créer le champ (.*) de type radio avec les valeurs (.*)",
        "ajouter champ (.*) de type radio avec les valeurs (.*)",
        "ajouter un champ (.*) de type radio avec les valeurs (.*)",
        "ajouter le champ (.*) de type radio avec les valeurs (.*)",
        "create field (.*) with type radio with values (.*) and default value (.*)",
        "add field (.*) with type radio with values (.*) and default value (.*)",
        "create field (.*) with type radio and values (.*) with default value (.*)",
        "add field (.*) with type radio and values (.*) with default value (.*)",
        "create field (.*) with type radio and values (.*) and default value (.*)",
        "add field (.*) with type radio and values (.*) and default value (.*)",
        "créer champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)",
        "créer un champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)",
        "créer le champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter un champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)",
        "ajouter le champ (.*) de type radio avec les valeurs (.*) et la valeur par défaut (.*)"
    ],
    "createNewDataFieldWithType": [
        "create field (.*) with type (.*)",
        "add field (.*) with type (.*)",
        "créer champ (.*) de type (.*)",
        "créer un champ (.*) de type (.*)",
        "ajouter champ (.*) de type (.*)",
        "ajouter un champ (.*) de type (.*)",
        "ajouter le champ (.*) de type (.*)",
        "create field (.*) with type (.*) and default value (.*)",
        "add field (.*) with type (.*) and default value (.*)",
        "créer champ (.*) de type (.*) avec la valeur par défaut (.*)",
        "créer un champ (.*) de type (.*) avec la valeur par défaut (.*)",
        "créer le champ (.*) de type (.*) avec la valeur par défaut (.*)",
        "ajouter champ (.*) de type (.*) avec la valeur par défaut (.*)",
        "ajouter un champ (.*) de type (.*) avec la valeur par défaut (.*)",
        "ajouter le champ (.*) de type (.*) avec la valeur par défaut (.*)"
    ],
    "createNewDataField": [
        "create field ?(.*)",
        "add field (.*)",
        "créer champ (.*)",
        "créer un champ (.*)",
        "créer le champ (.*)",
        "ajouter champ (.*)",
        "ajouter un champ (.*)",
        "ajouter le champ (.*)",
        "create field ?(.*) and default value (.*)",
        "add field (.*) and default value (.*)",
        "create field ?(.*) with default value (.*)",
        "add field (.*) with default value (.*)",
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
    "deleteField": [
        "delete field (.*)",
        "drop field (.*)",
        "remove field (.*)",
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
    "listModule": [
        "list module",
        "list modules",
        "lister module",
        "lister modules",
        "lister les modules"
    ],
    "listEntity": [
        "list data entity",
        "list data entities",
        "list entity",
        "list entities",
        "lister entité",
        "lister entités",
        "lister les entités"
    ],
    "listField": [
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
        "créer un champ (.*) relié à (.*)",
        "ajouter un champ (.*) relié à (.*)",
        "créer champ (.*) relié à (.*)",
        "ajouter champ (.*) relié à (.*)"
    ],
    "createFieldRelatedToUsing": [
        "create field (.*) related to (.*) using (.*)",
        "add field (.*) related to (.*) using (.*)",
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
        "entité (.*) possède plusieurs (.*) appelé (.*)",
        "entité (.*) possède plusieurs (.*) appelés (.*)",
        "entité (.*) possède plusieurs (.*) appelées (.*)",
        "entité (.*) possède plusieurs (.*) nommé (.*)",
        "entité (.*) possède plusieurs (.*) nommés (.*)",
        "entité (.*) possède plusieurs (.*) nommées (.*)",
        "entité (.*) a plusieurs (.*) appelé (.*)",
        "entité (.*) a plusieurs (.*) appelés (.*)",
        "entité (.*) a plusieurs (.*) appelées (.*)",
        "entité (.*) a plusieurs (.*) nommé (.*)",
        "entité (.*) a plusieurs (.*) nommés (.*)",
        "entité (.*) a plusieurs (.*) nommées (.*)",
        "l'entité (.*) possède plusieurs (.*) appelé (.*)",
        "l'entité (.*) possède plusieurs (.*) appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) nommé (.*)",
        "l'entité (.*) possède plusieurs (.*) nommés (.*)",
        "l'entité (.*) possède plusieurs (.*) nommées (.*)",
        "l'entité (.*) a plusieurs (.*) appelé (.*)",
        "l'entité (.*) a plusieurs (.*) appelés (.*)",
        "l'entité (.*) a plusieurs (.*) appelées (.*)",
        "l'entité (.*) a plusieurs (.*) nommé (.*)",
        "l'entité (.*) a plusieurs (.*) nommés (.*)",
        "l'entité (.*) a plusieurs (.*) nommées (.*)",
    ],
    "relationshipHasManyPreset": [
        "entity (.*) has many preset (.*)",
        "entity (.*) has many existing (.*)",

        "entity (.*) has many preset (.*) called (.*)",
        "entity (.*) has many existing (.*) called (.*)",
        "entity (.*) has many preset (.*) with name (.*)",
        "entity (.*) has many existing (.*) with name (.*)",

        "l'entité (.*) a plusieurs (.*) prédéfini",
        "l'entité (.*) a plusieurs (.*) prédéfinis",
        "l'entité (.*) a plusieurs (.*) prédéfinie",
        "l'entité (.*) a plusieurs (.*) prédéfinies",
        "l'entité (.*) a plusieurs (.*) déjà prédéfini",
        "l'entité (.*) a plusieurs (.*) déjà prédéfinis",
        "l'entité (.*) a plusieurs (.*) déjà prédéfinie",
        "l'entité (.*) a plusieurs (.*) déjà prédéfinies",
        "l'entité (.*) a plusieurs (.*) existant",
        "l'entité (.*) a plusieurs (.*) existants",
        "l'entité (.*) a plusieurs (.*) existante",
        "l'entité (.*) a plusieurs (.*) existantes",
        "l'entité (.*) a plusieurs (.*) déjà existant",
        "l'entité (.*) a plusieurs (.*) déjà existants",
        "l'entité (.*) a plusieurs (.*) déjà existante",
        "l'entité (.*) a plusieurs (.*) déjà existantes",

        "entité (.*) a plusieurs (.*) prédéfini",
        "entité (.*) a plusieurs (.*) prédéfinis",
        "entité (.*) a plusieurs (.*) prédéfinie",
        "entité (.*) a plusieurs (.*) prédéfinies",
        "entité (.*) a plusieurs (.*) existant",
        "entité (.*) a plusieurs (.*) existants",
        "entité (.*) a plusieurs (.*) existante",
        "entité (.*) a plusieurs (.*) existantes",
        "entité (.*) a plusieurs (.*) déjà prédéfini",
        "entité (.*) a plusieurs (.*) déjà prédéfinis",
        "entité (.*) a plusieurs (.*) déjà prédéfinie",
        "entité (.*) a plusieurs (.*) déjà prédéfinies",
        "entité (.*) a plusieurs (.*) déjà existant",
        "entité (.*) a plusieurs (.*) déjà existants",
        "entité (.*) a plusieurs (.*) déjà existante",
        "entité (.*) a plusieurs (.*) déjà existantes",

        "l'entité (.*) a plusieurs (.*) prédéfini appelé (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfinis appelés (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfinie appelée (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfinies appelées (.*)",
        "l'entité (.*) a plusieurs (.*) déjà prédéfini appelé (.*)",
        "l'entité (.*) a plusieurs (.*) déjà prédéfinis appelés (.*)",
        "l'entité (.*) a plusieurs (.*) déjà prédéfinie appelée (.*)",
        "l'entité (.*) a plusieurs (.*) déjà prédéfinies appelées (.*)",
        "l'entité (.*) a plusieurs (.*) existant appelé (.*)",
        "l'entité (.*) a plusieurs (.*) existants appelés (.*)",
        "l'entité (.*) a plusieurs (.*) existante appelée (.*)",
        "l'entité (.*) a plusieurs (.*) existantes appelées (.*)",
        "l'entité (.*) a plusieurs (.*) déjà existant appelé (.*)",
        "l'entité (.*) a plusieurs (.*) déjà existants appelés (.*)",
        "l'entité (.*) a plusieurs (.*) déjà existante appelée (.*)",
        "l'entité (.*) a plusieurs (.*) déjà existantes appelées (.*)",

        "entité (.*) a plusieurs (.*) prédéfini appelé (.*)",
        "entité (.*) a plusieurs (.*) prédéfinis appelés (.*)",
        "entité (.*) a plusieurs (.*) prédéfinie appelée (.*)",
        "entité (.*) a plusieurs (.*) prédéfinies appelées (.*)",
        "entité (.*) a plusieurs (.*) existant appelé (.*)",
        "entité (.*) a plusieurs (.*) existants appelés (.*)",
        "entité (.*) a plusieurs (.*) existante appelée (.*)",
        "entité (.*) a plusieurs (.*) existantes appelées (.*)",
        "entité (.*) a plusieurs (.*) déjà prédéfini appelé (.*)",
        "entité (.*) a plusieurs (.*) déjà prédéfinis appelés (.*)",
        "entité (.*) a plusieurs (.*) déjà prédéfinie appelée (.*)",
        "entité (.*) a plusieurs (.*) déjà prédéfinies appelées (.*)",
        "entité (.*) a plusieurs (.*) déjà existant appelé (.*)",
        "entité (.*) a plusieurs (.*) déjà existants appelés (.*)",
        "entité (.*) a plusieurs (.*) déjà existante appelée (.*)",
        "entité (.*) a plusieurs (.*) déjà existantes appelées (.*)",

        "l'entité (.*) a plusieurs (.*) prédéfini nommé (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfinis nommés (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfinie nommée (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfinies nommées (.*)",
        "l'entité (.*) a plusieurs (.*) déjà prédéfini nommé (.*)",
        "l'entité (.*) a plusieurs (.*) déjà prédéfinis nommés (.*)",
        "l'entité (.*) a plusieurs (.*) déjà prédéfinie nommée (.*)",
        "l'entité (.*) a plusieurs (.*) déjà prédéfinies nommées (.*)",
        "l'entité (.*) a plusieurs (.*) existant nommé (.*)",
        "l'entité (.*) a plusieurs (.*) existants nommés (.*)",
        "l'entité (.*) a plusieurs (.*) existante nommée (.*)",
        "l'entité (.*) a plusieurs (.*) existantes nommées (.*)",
        "l'entité (.*) a plusieurs (.*) déjà existant nommé (.*)",
        "l'entité (.*) a plusieurs (.*) déjà existants nommés (.*)",
        "l'entité (.*) a plusieurs (.*) déjà existante nommée (.*)",
        "l'entité (.*) a plusieurs (.*) déjà existantes nommées (.*)",

        "entité (.*) a plusieurs (.*) prédéfini nommé (.*)",
        "entité (.*) a plusieurs (.*) prédéfinis nommés (.*)",
        "entité (.*) a plusieurs (.*) prédéfinie nommée (.*)",
        "entité (.*) a plusieurs (.*) prédéfinies nommées (.*)",
        "entité (.*) a plusieurs (.*) existant nommé (.*)",
        "entité (.*) a plusieurs (.*) existants nommés (.*)",
        "entité (.*) a plusieurs (.*) existante nommée (.*)",
        "entité (.*) a plusieurs (.*) existantes nommées (.*)",
        "entité (.*) a plusieurs (.*) déjà prédéfini nommé (.*)",
        "entité (.*) a plusieurs (.*) déjà prédéfinis nommés (.*)",
        "entité (.*) a plusieurs (.*) déjà prédéfinie nommée (.*)",
        "entité (.*) a plusieurs (.*) déjà prédéfinies nommées (.*)",
        "entité (.*) a plusieurs (.*) déjà existant nommé (.*)",
        "entité (.*) a plusieurs (.*) déjà existants nommés (.*)",
        "entité (.*) a plusieurs (.*) déjà existante nommée (.*)",
        "entité (.*) a plusieurs (.*) déjà existantes nommées (.*)",

        "l'entité (.*) possède plusieurs (.*) prédéfini",
        "l'entité (.*) possède plusieurs (.*) prédéfinis",
        "l'entité (.*) possède plusieurs (.*) prédéfinie",
        "l'entité (.*) possède plusieurs (.*) prédéfinies",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfini",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfinis",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfinie",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfinies",
        "l'entité (.*) possède plusieurs (.*) existant",
        "l'entité (.*) possède plusieurs (.*) existants",
        "l'entité (.*) possède plusieurs (.*) existante",
        "l'entité (.*) possède plusieurs (.*) existantes",
        "l'entité (.*) possède plusieurs (.*) déjà existant",
        "l'entité (.*) possède plusieurs (.*) déjà existants",
        "l'entité (.*) possède plusieurs (.*) déjà existante",
        "l'entité (.*) possède plusieurs (.*) déjà existantes",

        "entité (.*) possède plusieurs (.*) prédéfini",
        "entité (.*) possède plusieurs (.*) prédéfinis",
        "entité (.*) possède plusieurs (.*) prédéfinie",
        "entité (.*) possède plusieurs (.*) prédéfinies",
        "entité (.*) possède plusieurs (.*) existant",
        "entité (.*) possède plusieurs (.*) existants",
        "entité (.*) possède plusieurs (.*) existante",
        "entité (.*) possède plusieurs (.*) existantes",
        "entité (.*) possède plusieurs (.*) déjà prédéfini",
        "entité (.*) possède plusieurs (.*) déjà prédéfinis",
        "entité (.*) possède plusieurs (.*) déjà prédéfinie",
        "entité (.*) possède plusieurs (.*) déjà prédéfinies",
        "entité (.*) possède plusieurs (.*) déjà existant",
        "entité (.*) possède plusieurs (.*) déjà existants",
        "entité (.*) possède plusieurs (.*) déjà existante",
        "entité (.*) possède plusieurs (.*) déjà existantes",

        "l'entité (.*) possède plusieurs (.*) prédéfini appelé (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfinis appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfinie appelée (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfinies appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfini appelé (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfinis appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfinie appelée (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfinies appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) existant appelé (.*)",
        "l'entité (.*) possède plusieurs (.*) existants appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) existante appelée (.*)",
        "l'entité (.*) possède plusieurs (.*) existantes appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà existant appelé (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà existants appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà existante appelée (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà existantes appelées (.*)",

        "entité (.*) possède plusieurs (.*) prédéfini appelé (.*)",
        "entité (.*) possède plusieurs (.*) prédéfinis appelés (.*)",
        "entité (.*) possède plusieurs (.*) prédéfinie appelée (.*)",
        "entité (.*) possède plusieurs (.*) prédéfinies appelées (.*)",
        "entité (.*) possède plusieurs (.*) existant appelé (.*)",
        "entité (.*) possède plusieurs (.*) existants appelés (.*)",
        "entité (.*) possède plusieurs (.*) existante appelée (.*)",
        "entité (.*) possède plusieurs (.*) existantes appelées (.*)",
        "entité (.*) possède plusieurs (.*) déjà prédéfini appelé (.*)",
        "entité (.*) possède plusieurs (.*) déjà prédéfinis appelés (.*)",
        "entité (.*) possède plusieurs (.*) déjà prédéfinie appelée (.*)",
        "entité (.*) possède plusieurs (.*) déjà prédéfinies appelées (.*)",
        "entité (.*) possède plusieurs (.*) déjà existant appelé (.*)",
        "entité (.*) possède plusieurs (.*) déjà existants appelés (.*)",
        "entité (.*) possède plusieurs (.*) déjà existante appelée (.*)",
        "entité (.*) possède plusieurs (.*) déjà existantes appelées (.*)",

        "l'entité (.*) possède plusieurs (.*) prédéfini nommé (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfinis nommés (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfinie nommée (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfinies nommées (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfini nommé (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfinis nommés (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfinie nommée (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà prédéfinies nommées (.*)",
        "l'entité (.*) possède plusieurs (.*) existant nommé (.*)",
        "l'entité (.*) possède plusieurs (.*) existants nommés (.*)",
        "l'entité (.*) possède plusieurs (.*) existante nommée (.*)",
        "l'entité (.*) possède plusieurs (.*) existantes nommées (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà existant nommé (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà existants nommés (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà existante nommée (.*)",
        "l'entité (.*) possède plusieurs (.*) déjà existantes nommées (.*)",

        "entité (.*) possède plusieurs (.*) prédéfini nommé (.*)",
        "entité (.*) possède plusieurs (.*) prédéfinis nommés (.*)",
        "entité (.*) possède plusieurs (.*) prédéfinie nommée (.*)",
        "entité (.*) possède plusieurs (.*) prédéfinies nommées (.*)",
        "entité (.*) possède plusieurs (.*) existant nommé (.*)",
        "entité (.*) possède plusieurs (.*) existants nommés (.*)",
        "entité (.*) possède plusieurs (.*) existante nommée (.*)",
        "entité (.*) possède plusieurs (.*) existantes nommées (.*)",
        "entité (.*) possède plusieurs (.*) déjà prédéfini nommé (.*)",
        "entité (.*) possède plusieurs (.*) déjà prédéfinis nommés (.*)",
        "entité (.*) possède plusieurs (.*) déjà prédéfinie nommée (.*)",
        "entité (.*) possède plusieurs (.*) déjà prédéfinies nommées (.*)",
        "entité (.*) possède plusieurs (.*) déjà existant nommé (.*)",
        "entité (.*) possède plusieurs (.*) déjà existants nommés (.*)",
        "entité (.*) possède plusieurs (.*) déjà existante nommée (.*)",
        "entité (.*) possède plusieurs (.*) déjà existantes nommées (.*)"
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

        "l'entité (.*) a plusieurs (.*) prédéfini en utilisant (.*)",
        "l'entité (.*) a plusieurs (.*) existant en utilisant (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini en affichant (.*)",
        "l'entité (.*) a plusieurs (.*) existant en affichant (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini en utilisant le champ (.*)",
        "l'entité (.*) a plusieurs (.*) existant en utilisant le champ (.*)",
        "l'entité (.*) a plusieurs (.*) prédéfini en affichant le champ (.*)",
        "l'entité (.*) a plusieurs (.*) existant en affichant le champ (.*)",

        "entité (.*) a plusieurs (.*) prédéfini en utilisant (.*)",
        "entité (.*) a plusieurs (.*) existant en utilisant (.*)",
        "entité (.*) a plusieurs (.*) prédéfini en affichant (.*)",
        "entité (.*) a plusieurs (.*) existant en affichant (.*)",
        "entité (.*) a plusieurs (.*) prédéfini en utilisant le champ (.*)",
        "entité (.*) a plusieurs (.*) existant en utilisant le champ (.*)",
        "entité (.*) a plusieurs (.*) prédéfini en affichant le champ (.*)",
        "entité (.*) a plusieurs (.*) existant en affichant le champ (.*)",

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

        "entité (.*) a plusieurs (.*) prédéfini en utilisant (.*) appelés (.*)",
        "entité (.*) a plusieurs (.*) existant en utilisant (.*) appelés (.*)",
        "entité (.*) a plusieurs (.*) prédéfini en affichant (.*) appelés (.*)",
        "entité (.*) a plusieurs (.*) existant en affichant (.*) appelés (.*)",
        "entité (.*) a plusieurs (.*) prédéfini en utilisant le champ (.*) appelés (.*)",
        "entité (.*) a plusieurs (.*) existant en utilisant le champ (.*) appelés (.*)",
        "entité (.*) a plusieurs (.*) prédéfini en affichant le champ (.*) appelés (.*)",
        "entité (.*) a plusieurs (.*) existant en affichant le champ (.*) appelés (.*)",
        "entité (.*) a plusieurs (.*) prédéfini en utilisant (.*) appelées (.*)",
        "entité (.*) a plusieurs (.*) existant en utilisant (.*) appelées (.*)",
        "entité (.*) a plusieurs (.*) prédéfini en affichant (.*) appelées (.*)",
        "entité (.*) a plusieurs (.*) existant en affichant (.*) appelées (.*)",
        "entité (.*) a plusieurs (.*) prédéfini en utilisant le champ (.*) appelées (.*)",
        "entité (.*) a plusieurs (.*) existant en utilisant le champ (.*) appelées (.*)",
        "entité (.*) a plusieurs (.*) prédéfini en affichant le champ (.*) appelées (.*)",
        "entité (.*) a plusieurs (.*) existant en affichant le champ (.*) appelées (.*)",

        "l'entité (.*) possède plusieurs (.*) prédéfini en utilisant (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en utilisant (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfini en affichant (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en affichant (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfini en utilisant le champ (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en utilisant le champ (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfini en affichant le champ (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en affichant le champ (.*)",

        "entité (.*) possède plusieurs (.*) prédéfini en utilisant (.*)",
        "entité (.*) possède plusieurs (.*) existant en utilisant (.*)",
        "entité (.*) possède plusieurs (.*) prédéfini en affichant (.*)",
        "entité (.*) possède plusieurs (.*) existant en affichant (.*)",
        "entité (.*) possède plusieurs (.*) prédéfini en utilisant le champ (.*)",
        "entité (.*) possède plusieurs (.*) existant en utilisant le champ (.*)",
        "entité (.*) possède plusieurs (.*) prédéfini en affichant le champ (.*)",
        "entité (.*) possède plusieurs (.*) existant en affichant le champ (.*)",

        "l'entité (.*) possède plusieurs (.*) prédéfini en utilisant (.*) appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en utilisant (.*) appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfini en affichant (.*) appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en affichant (.*) appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfini en utilisant le champ (.*) appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en utilisant le champ (.*) appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfini en affichant le champ (.*) appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en affichant le champ (.*) appelés (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfini en utilisant (.*) appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en utilisant (.*) appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfini en affichant (.*) appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en affichant (.*) appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfini en utilisant le champ (.*) appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en utilisant le champ (.*) appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) prédéfini en affichant le champ (.*) appelées (.*)",
        "l'entité (.*) possède plusieurs (.*) existant en affichant le champ (.*) appelées (.*)",

        "entité (.*) possède plusieurs (.*) prédéfini en utilisant (.*) appelés (.*)",
        "entité (.*) possède plusieurs (.*) existant en utilisant (.*) appelés (.*)",
        "entité (.*) possède plusieurs (.*) prédéfini en affichant (.*) appelés (.*)",
        "entité (.*) possède plusieurs (.*) existant en affichant (.*) appelés (.*)",
        "entité (.*) possède plusieurs (.*) prédéfini en utilisant le champ (.*) appelés (.*)",
        "entité (.*) possède plusieurs (.*) existant en utilisant le champ (.*) appelés (.*)",
        "entité (.*) possède plusieurs (.*) prédéfini en affichant le champ (.*) appelés (.*)",
        "entité (.*) possède plusieurs (.*) existant en affichant le champ (.*) appelés (.*)",
        "entité (.*) possède plusieurs (.*) prédéfini en utilisant (.*) appelées (.*)",
        "entité (.*) possède plusieurs (.*) existant en utilisant (.*) appelées (.*)",
        "entité (.*) possède plusieurs (.*) prédéfini en affichant (.*) appelées (.*)",
        "entité (.*) possède plusieurs (.*) existant en affichant (.*) appelées (.*)",
        "entité (.*) possède plusieurs (.*) prédéfini en utilisant le champ (.*) appelées (.*)",
        "entité (.*) possède plusieurs (.*) existant en utilisant le champ (.*) appelées (.*)",
        "entité (.*) possède plusieurs (.*) prédéfini en affichant le champ (.*) appelées (.*)",
        "entité (.*) possède plusieurs (.*) existant en affichant le champ (.*) appelées (.*)"
    ],
    "createFieldRelatedToMultipleCheckbox": [
        "create field (.*) related to multiple (.*) with type checkbox",
        "add field (.*) related to multiple (.*) with type checkbox",
        "create field (.*) related to many (.*) with type checkbox",
        "add field (.*) related to many (.*) with type checkbox",
        "créer un champ (.*) relié à plusieurs (.*) avec le type case à cocher",
        "ajouter un champ (.*) relié à plusieurs (.*) avec le type case à cocher",
        "créer champ (.*) relié à plusieurs (.*) avec le type case à cocher",
        "ajouter champ (.*) relié à plusieurs (.*) avec le type case à cocher"
    ],
    "createFieldRelatedToMultipleCheckboxUsing": [
        "create field (.*) related to multiple (.*) with type checkbox using (.*)",
        "add field (.*) related to multiple (.*) with type checkbox using (.*)",
        "create field (.*) related to many (.*) with type checkbox using (.*)",
        "add field (.*) related to many (.*) with type checkbox using (.*)",
        "créer un champ (.*) relié à plusieurs (.*) avec le type case à cocher en utilisant (.*)",
        "créer champ (.*) relié à plusieurs (.*) avec le type case à cocher en utilisant (.*)",
        "créer un champ (.*) relié à plusieurs (.*) avec le type case à cocher en affichant (.*)",
        "créer champ (.*) relié à plusieurs (.*) avec le type case à cocher en affichant (.*)",
        "ajouter un champ (.*) relié à plusieurs (.*) avec le type case à cocher en utilisant (.*)",
        "ajouter un champ (.*) relié à plusieurs (.*) avec le type case à cocher en affichant (.*)",
        "ajouter champ (.*) relié à plusieurs (.*) avec le type case à cocher en utilisant (.*)",
        "ajouter champ (.*) relié à plusieurs (.*) avec le type case à cocher en affichant (.*)"
    ],
    "createFieldRelatedToMultiple": [
        "create field (.*) related to multiple (.*)",
        "add field (.*) related to multiple (.*)",
        "create field (.*) related to many (.*)",
        "add field (.*) related to many (.*)",
        "créer un champ (.*) relié à plusieurs (.*)",
        "ajouter un champ (.*) relié à plusieurs (.*)",
        "créer champ (.*) relié à plusieurs (.*)",
        "ajouter champ (.*) relié à plusieurs (.*)"
    ],
    "createFieldRelatedToMultipleUsing": [
        "create field (.*) related to multiple (.*) using (.*)",
        "add field (.*) related to multiple (.*) using (.*)",
        "create field (.*) related to many (.*) using (.*)",
        "add field (.*) related to many (.*) using (.*)",
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
        "add component status with name (.*)",
        "ajouter un composant statut appelé (.*)",
        "ajouter composant statut appelé (.*)",
        "créer composant statut appelé (.*)",
        "créer un composant statut appelé (.*)"
    ],
    "createNewComponentStatus": [
        "create component status",
        "add component status",
        "ajouter un composant statut",
        "créer un composant statut",
        "ajouter composant statut",
        "créer composant statut"
    ],
    "deleteComponentStatus": [
        "delete component status",
        "remove component status",
        "supprimer un composant statut",
        "supprimer un statut",
        "supprimer composant statut",
        "supprimer statut"
    ],
    "deleteComponentStatusWithName": [
        "delete component status with name (.*)",
        "remove component status with name (.*)",

        "delete component status called (.*)",
        "remove component status called (.*)",

        "supprimer un composant statut appelé (.*)",
        "supprimer composant statut appelé (.*)",
        "supprimer le composant statut appelé (.*)",
        "supprimer un statut appelé (.*)",
        "supprimer le statut appelé (.*)",
        "supprimer statut appelé (.*)",

        "supprimer un composant statut nommé (.*)",
        "supprimer composant statut nommé (.*)",
        "supprimer le composant statut nommé (.*)",
        "supprimer un statut nommé (.*)",
        "supprimer le statut nommé (.*)",
        "supprimer statut nommé (.*)"
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
    "deleteComponentContactFormWithName": [
        "delete component contactform with name (.*)",
        "delete component contact form with name (.*)",
        "remove component contactform with name (.*)",
        "remove component contact form with name (.*)",

        "delete component contactform called (.*)",
        "delete component contact form called (.*)",
        "remove component contactform called (.*)",
        "remove component contact form called (.*)",

        "supprimer un composant formulaire de contact appelé (.*)",
        "supprimer composant formulaire de contact appelé (.*)",
        "supprimer le composant formulaire de contact appelé (.*)",
        "supprimer un formulaire de contact appelé (.*)",
        "supprimer le formulaire de contact appelé (.*)",
        "supprimer formulaire de contact appelé (.*)",

        "supprimer un composant formulaire de contact nommé (.*)",
        "supprimer composant formulaire de contact nommé (.*)",
        "supprimer le composant formulaire de contact nommé (.*)",
        "supprimer un formulaire de contact nommé (.*)",
        "supprimer le formulaire de contact nommé (.*)",
        "supprimer formulaire de contact nommé (.*)"
    ],
    "deleteComponentContactForm": [
        "delete component contactform",
        "delete component contact form",
        "remove component contactform",
        "remove component contact form",
        "supprimer un composant formulaire de contact",
        "supprimer un formulaire de contact",
        "supprimer composant formulaire de contact",
        "supprimer formulaire de contact"
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
    "deleteAgenda": [
        "delete component agenda",
        "remove component agenda",
        "remove an agenda",
        "delete an agenda",
        "remove agenda",
        "delete agenda",
        "delete component timeline",
        "remove component timeline",
        "remove an timeline",
        "remove timeline",

        "supprimer composant agenda",
        "supprimer le composant agenda",
        "supprimer agenda",
        "supprimer l'agenda",
        "supprimer le composant ligne de temps",
        "supprimer la ligne de temps"
    ],
    "deleteAgendaWithName": [
        "delete component agenda with name (.*)",
        "remove component agenda with name (.*)",
        "remove an agenda with name (.*)",
        "delete an agenda with name (.*)",
        "remove agenda with name (.*)",
        "delete agenda with name (.*)",
        "delete component timeline with name (.*)",
        "remove component timeline with name (.*)",
        "remove an timeline with name (.*)",
        "remove timeline with name (.*)",
        "delete component agenda called (.*)",
        "remove component agenda called (.*)",
        "remove an agenda called (.*)",
        "delete an agenda called (.*)",
        "remove agenda called (.*)",
        "delete agenda called (.*)",
        "delete component timeline called (.*)",
        "remove component timeline called (.*)",
        "remove an timeline called (.*)",
        "remove timeline called (.*)",

        "supprimer composant agenda appelé (.*)",
        "supprimer le composant agenda appelé (.*)",
        "supprimer agenda appelé (.*)",
        "supprimer l'agenda appelé (.*)",
        "supprimer le composant ligne de temps appelée (.*)",
        "supprimer la ligne de temps appelée (.*)",
        "supprimer composant agenda nommé (.*)",
        "supprimer le composant agenda nommé (.*)",
        "supprimer agenda nommé (.*)",
        "supprimer l'agenda nommé (.*)",
        "supprimer le composant ligne de temps nommée (.*)",
        "supprimer la ligne de temps nommée (.*)"
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
    "createNewComponentAddress": [
        "add component address",
        "create component address",
        "ajouter un composant adresse",
        "créer un composant adresse",
        "ajouter composant adresse",
        "créer composant adresse"
    ],
    "createNewComponentAddressWithName": [
        "add component address with name (.*)",
        "add component address called (.*)",
        "create component address with name (.*)",
        "create component address called (.*)",
        "ajouter un composant adresse nommé (.*)",
        "ajouter un composant adresse appelé (.*)",
        "ajouter composant adresse nommé (.*)",
        "ajouter composant adresse appelé (.*)"
    ],
    "deleteComponentAddress": [
        "delete component address",
        "supprimer composant adresse",
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
    "setLogo": [
        "add logo (.*)",
        "add a logo (.*)",
        "set a logo (.*)",
        "set logo (.*)",
        "mettre un logo (.*)",
        "mettre logo (.*)",
        "ajouter logo (.*)",
        "ajouter un logo (.*)"
    ],
    "removeLogo": [
        "remove logo",
        "remove the logo",
        "delete the logo",
        "delete logo",
        "supprimer un logo",
        "supprimer logo",
        "enlever le logo",
        "enlever logo"
    ],
    "setLayout": [
        "set layout (.*)",
        "appliquer le layout (.*)",
        "appliquer la disposition (.*)",
        "appliquer layout (.*)",
        "appliquer disposition (.*)",
        "mettre le layout (.*)",
        "mettre la disposition (.*)",
        "mettre layout (.*)",
        "mettre disposition (.*)"
    ],
    "listLayout": [
        "list layout",
        "list all layout",
        "lister les layout",
        "lister disposition",
        "lister les dispositions",
        "afficher les dispositions"
    ],
    "setTheme": [
        "set theme (.*)",
        "appliquer le thème (.*)",
        "appliquer thème (.*)",
        "mettre le thème (.*)",
        "mettre thème (.*)"
    ],
    "listIcon": [
        "list icon",
        "list icons",
        "lister les icones",
        "lister icones",
        "lister icone",
        "lister icon",
        "lister icônes",
        "lister icône"
    ],
    "setIcon": [
        "set icon (.*)",
        "mettre l'icône (.*)",
        "mettre l'icone (.*)",
        "mettre icône (.*)",
        "mettre icone (.*)",
        "mettre une icône (.*)",
        "mettre une icone (.*)",
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
    "createWidgetPiechart": [
        "create widget piechart on entity (.*) for field (.*)",
        "add widget piechart on entity (.*) for field (.*)",
        "create widget piechart on entity (.*) for (.*)",
        "add widget piechart on entity (.*) for (.*)",
        "create widget piechart for field (.*)",
        "add widget piechart for field (.*)",
        "create widget piechart for (.*)",
        "add widget piechart for (.*)",
        "ajouter widget piechart sur l\’entité (.*) pour le champ (.*)",
        "ajouter widget piechart sur entité (.*) pour le champ (.*)",
        "ajouter widget piechart pour le champ (.*)"
    ],
    "createWidgetPiechartWithoutLegend": [
        "create widget piechart on entity (.*) for field (.*) without legend",
        "create widget piechart on entity (.*) for (.*) without legend",
        "create widget piechart for field (.*) without legend",
        "create widget piechart for (.*) without legend",
        "add widget piechart on entity (.*) for field (.*) without legend",
        "add widget piechart on entity (.*) for (.*) without legend",
        "add widget piechart for field (.*) without legend",
        "add widget piechart for (.*) without legend",
        "ajouter widget piechart pour le champ (.*) sans légende",
        "ajouter widget piechart sur l\’entité (.*) pour le champ (.*) sans légende",
        "ajouter widget piechart sur entité (.*) pour le champ (.*) sans légende"
    ],
    "createWidgetLastRecordsWithLimit": [
        "create widget last records limited to (.*) records with columns (.*)",
        "create widget last records on entity (.*) limited to (.*) records with columns (.*)",
        "add widget last records limited to (.*) records with columns (.*)",
        "add widget last records on entity (.*) limited to (.*) records with columns (.*)",
        "ajouter un widget derniers enregistrements sur l'entité (.*) limité à (.*) enregistrements avec les colonnes (.*)",
        "ajouter widget derniers enregistrements sur l'entité (.*) limité à (.*) enregistrements avec les colonnes (.*)",
        "créer un widget derniers enregistrements limité à (.*) enregistrements avec les colonnes (.*)",
        "créer un widget derniers enregistrements sur l'entité (.*) limité à (.*) enregistrements avec les colonnes (.*)",
        "créer widget derniers enregistrements limité à (.*) enregistrements avec les colonnes (.*)",
        "créer widget derniers enregistrements sur l'entité (.*) limité à (.*) enregistrements avec les colonnes (.*)"
    ],
    "createWidgetLastRecords": [
        "create widget last records with columns (.*)",
        "create widget last records on entity (.*) with columns (.*)",
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
        "créer widget (.*) sur l'entité (.*)",
        "ajouter (.*) sur l'entité (.*)",
        "ajouter widget (.*) sur l'entité (.*)",
        "add widget (.*) on entity (.*)",
        "create widget (.*) on entity (.*)",
        "add a widget (.*) on entity (.*)",
        "create a widget (.*) on entity (.*)"
    ],
    "createWidget": [
        "add widget (.*)",
        "create widget (.*)",
        "ajouter widget (.*)",
        "créer widget (.*)",
        "ajouter une (.*)",
        "ajouter un widget (.*)",
        "créer une (.*)",
        "créer un widget (.*)"
    ],
    "deleteWidget": [
        "delete widget (.*)",
        "delete widget (.*)",
        "delete widget (.*)",
        "delete widget (.*)",
        "supprimer widget (.*)",
        "supprimer le widget (.*)",
        "supprimer le widget (.*)"
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
    ],
    "createComponentDocumentTemplate": [
        "add component document template",
        "ajouter un composant document template",
        "ajouter le composant document template",
        "ajouter composant document template",
        "ajouter composant modèle de document",
        "ajouter un composant modèle de document",
        "ajouter le composant modèle de document"
    ],
    "deleteComponentDocumentTemplate": [
        "delete component document template",
        "supprimer le composant document template",
        "supprimer composant document template",
        "supprimer composant modèle de document",
        "supprimer un composant modèle de document"
    ],
    "createComponentDocumentTemplateWithName": [
        "add component document template with name (.*)",
        "ajouter un composant modèle de document appelé (.*)",
        "ajouter un composant modèle de document nommé (.*)",
        "ajouter composant modèle de document appelé (.*)",
        "ajouter composant modèle de document nommé (.*)",
        "ajouter le composant modèle de document appelé (.*)"
    ],
    "addTitle": [
        "add title (.*)",
        "add title (.*) after (.*)",
        "add title (.*) after field (.*)",

        "ajouter titre (.*)",
        "ajouter titre (.*) après (.*)",
        "ajouter un titre (.*)",
        "ajouter un titre (.*) après (.*)",
        "ajouter un titre (.*) après le champ (.*)"
    ]
};

// ******* Parse *******
exports.parse = (instruction) => {

    let instructionResult = {
        instructionLength: 0
    };

    for (let action in training) {
        for (let i = 0; i < training[action].length; i++) {
            let regStr = training[action][i];
            let regExp = new RegExp(regStr, "ig");

            let result = regExp.exec(instruction);
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

    let data = {};
    if (typeof instructionResult.action !== "undefined") {
        data = this[instructionResult.action](instructionResult.result);
        data.instruction = instruction;
    } else {
        throw new Error('error.cannotFindInstruction');
    }

    return data;
}

// ******* Completion *******
exports.complete = function (instruction) {

    let answers = [];
    let p = 0;

    // Check all training key phrases
    for (let action in training) {

        // Check each blocks
        for (let i = 0; i < training[action].length; i++) {

            // Template to compare to
            let template = training[action][i].split(" ");

            // Split current key phrase and instructions into arrays to loop
            let instr = instruction.trim().split(" ");

            let k = 0; // index in template
            let m = 0; // index in instruction

            let l = instr.length;
            let n = template.length;

            let answer = " ";
            let valid = true;
            let letiable = false;
            while ((m < l) && (k < n) && (valid)) {
                // Check if words are the same, goto next word
                if (template[k] == "(.*)" || template[k] == instr[m]) {
                    letiable = false;
                    k++;
                } else {
                    // Check if beginning of word are the same
                    let sublen = instr[m].length;
                    if (template[k].substring(0, sublen) == instr[m]) {
                        // Do not increment k, we are still on keyword
                        letiable = false;
                    } else {
                        // If we parse the letiable value
                        if (template[k] == "(.*)") {
                            // Check next word
                            if (template[k + 1]) {
                                k++;
                                letiable = true;
                            }
                        } else {
                            // If we are not parsing a letiable, it means template is not appropriate => Exit
                            if (!letiable)
                                valid = false;
                        }
                    }
                }

                m++;
            }

            // Instruction has respected template, so send next keyword if any
            if ((valid) && (m == l)) {
                let found = false;
                let firstLoop = true;

                while ((k < n) && !found) {
                    // Return next keyword
                    if (template[k] != "(.*)")
                        answer = answer + template[k] + " ";
                    else {
                        if (template[k - 1] == "type")
                            answer = answer + "[type] ";
                        // Return [letiable] to explain this is something dynamic
                        else
                            answer = answer + "[letiable] ";

                        // If first loop on letiable, we need to display possible end of instruction
                        // Else, it means we have keyword at the beginning of suggestion, so we cut on letiable step
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
                    answers.push("regular text");
                    answers.push("number");
                    answers.push("big number");
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
    let i, j, len = answers.length,
            out = [],
            obj = {};
    for (i = 0; i < len; i++)
        obj[answers[i]] = 0;
    for (j in obj)
        out.push(j);

    // Sort array of results
    out.sort();
    // out.reverse();
    return out;
}

module.exports = exports;
