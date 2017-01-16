
// Attributes for response
var attr = new Array();



// ******* Add Actions *******
exports.showSessionAction = function(result) {

    console.log("ACTION : showSessionAction");

    options = new Array();
    attr = { "function": "showSession", "options": options };
    return attr;
};

exports.helpAction = function(result) {

    console.log("ACTION : helpAction");

    options = new Array();
    attr = { "function": "help", "options": options };
    return attr;
};

exports.deployAction = function(result) {

    console.log("ACTION : deployAction");

    options = new Array();
    attr = { "function": "deploy", "options": options };
    return attr;
};

exports.selectProjectAction = function(result) {

    console.log("ACTION : selectProjectAction");

    options = new Array();

    // Set entity name as the first option in options array
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "selectProject", "options": options };
    return attr;
};

exports.selectApplicationAction = function(result) {

    console.log("ACTION : selectApplicationAction");

    options = new Array();

    // Set entity name as the first option in options array
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "selectApplication", "options": options };
    return attr;
};


exports.selectModuleAction = function(result) {

    console.log("ACTION : selectModuleAction");

    options = new Array();

    // Set entity name as the first option in options array
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "selectModule", "options": options };
    return attr;
};

exports.selectDataEntityAction = function(result) {

    console.log("ACTION : selectDataEntityAction");

    options = new Array();

    // Set entity name as the first option in options array
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "selectDataEntity", "options": options };
    return attr;
};

exports.setRequiredAttributeAction = function(result) {

    console.log("ACTION : setRequiredAttributeAction");

    // Set entity name as the first option in options array
    var options = {
      field_name: result[1],
      word: result[2]
    };

    attr = { "function": "setRequiredAttribute", "options": options };
    return attr;
};

exports.setColumnVisibilityAction = function(result) {

    console.log("ACTION : setColumnVisibilityAction");

    // Set entity name as the first option in options array
    var options = {
      field_name: result[1],
      word: result[2]
    };

    attr = { "function": "setColumnVisibility", "options": options };
    return attr;
};


exports.createNewProjectAction = function(result) {

    console.log("ACTION : createNewProjectAction");

    options = new Array();

    // Set name of entity
    property = "entity";
    value = result[2];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "createNewProject", "options": options };
    return attr;
};

exports.createNewApplicationAction = function(result) {

    console.log("ACTION : createNewApplicationAction");

    options = new Array();

    // Set name of entity
    property = "entity";
    value = result[2];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "createNewApplication", "options": options };
    return attr;
};


exports.createNewModuleAction = function(result) {

    console.log("ACTION : createNewModuleAction");

    options = new Array();

    // Set name of entity
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "createNewModule", "options": options };
    return attr;
};



exports.createNewDataEntityAction = function(result) {

    console.log("ACTION : createNewDataEntityAction");

    options = new Array();

    console.log(result);

    // Set name of entity
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "createNewDataEntity", "options": options };
    return attr;
};

exports.createNewDataFieldAction = function(result) {

    console.log("ACTION : createNewDataFieldAction");

    options = new Array();


    // Field name has not been defined
    if (result == null) {
      attr = { "function": "askNameOfDataField" };
    }
    else {

      // Set name of field
      property = "name";
      value = result[1];
      json = { "property": property, "value": value };
      options.push(json);

      attr = { "function": "createNewDataField", "options": options };
      return attr;
    }

};

exports.createNewDataFieldWithTypeAction = function(result) {

    console.log("ACTION : createNewDataFieldWithTypeAction");

    options = new Array();


    // Set name of field
    property = "name";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    // Set type of field
    property = "type";
    value = result[2];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "createNewDataField", "options": options };
    return attr;
};


exports.createNewDataFieldWithTypeEnumAction = function(result) {

    console.log("ACTION : createNewDataFieldWithTypeEnumAction");

    options = new Array();

    // Set name of field
    property = "name";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    // Set type of field
    property = "type";
    value = "enum";
    json = { "property": property, "value": value };
    options.push(json);

    // Set values
    property = "and values";
    value = result[2];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "createNewDataField", "options": options };
    return attr;
};


exports.createNewDataFieldWithTypeRadioAction = function(result) {

    console.log("ACTION : createNewDataFieldWithTypeRadioAction");

    options = new Array();

    // Set name of field
    property = "name";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    // Set type of field
    property = "type";
    value = "radio";
    json = { "property": property, "value": value };
    options.push(json);

    // Set values
    property = "values";
    value = result[2];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "createNewDataField", "options": options };
    return attr;
};


exports.deleteProjectAction = function(result) {

    console.log("ACTION : deleteProjectAction");

    options = new Array();

    // Set name of entity
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "deleteProject", "options": options };
    return attr;
};

exports.deleteApplicationAction = function(result) {

    console.log("ACTION : deleteApplicationAction");

    options = new Array();

    // Set name of entity
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "deleteApplication", "options": options };
    return attr;
};


exports.deleteModuleAction = function(result) {

    console.log("ACTION : deleteModuleAction");

    options = new Array();

    // Set name of entity
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "deleteModule", "options": options };
    return attr;
};



exports.deleteDataEntityAction = function(result) {

    console.log("ACTION : deleteDataEntityAction");

    options = new Array();

    // Set name of entity
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "deleteDataEntity", "options": options };
    return attr;
};

exports.deleteDataFieldAction = function(result) {

    console.log("ACTION : deleteDataFieldAction");

    options = new Array();

    // Set name of field
    property = "entity";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "deleteDataField", "options": options };
    return attr;
};

exports.deleteTabAction = function(result) {

    console.log("ACTION : deleteTabAction");

    options = new Array();

    // Set name of field
    property = "name";
    value = result[1];
    json = { "property": property, "value": value };
    options.push(json);

    attr = { "function": "deleteTab", "options": options };
    return attr;
};


exports.listProjectAction = function(result) {

    console.log("ACTION : listProjectAction");

    options = new Array();

    attr = { "function": "listProject", "options": options };
    return attr;
};

exports.listApplicationAction = function(result) {

    console.log("ACTION : listApplicationAction");

    options = new Array();

    attr = { "function": "listApplication", "options": options };
    return attr;
};


exports.listModuleAction = function(result) {

    console.log("ACTION : listModuleAction");

    options = new Array();

    attr = { "function": "listModule", "options": options };
    return attr;
};

exports.listDataEntityAction = function(result) {

    console.log("ACTION : listDataEntityAction");

    options = new Array();

    attr = { "function": "listDataEntity", "options": options };
    return attr;
};


exports.listDataFieldAction = function(result) {

    console.log("ACTION : listDataFieldAction");

    options = new Array();

    attr = { "function": "listDataField", "options": options };
    return attr;
};

exports.relationshipHasOneAction = function(result) {

    console.log("ACTION : relationshipHasOneAction");

    source = result[1];
    target = result[2];
    as = target;

    options = {
      source: source,
      target: target,
      foreignKey: "id_"+target,
      as: as
    };

    attr = { "function": "createNewBelongsTo", "options": options };
    return attr;
};

exports.relationshipHasOneWithNameAction = function(result) {

    console.log("ACTION : relationshipHasOneWithNameAction");

    // Set options
    source = result[1];
    target = result[2];
    as = result[3];

    options = {
      target: target,
      source: source,
      foreignKey: "id_"+target,
      as: as
    };

    attr = { "function": "createNewBelongsTo", "options": options };
    return attr;
};


exports.relationshipHasManyAction = function(result) {

    console.log("ACTION : relationshipHasManyAction");

    source = result[1];
    target = result[2];
    as = target;

    options = {
      target: target,
      source: source,
      foreignKey: "id_"+source.toLowerCase(),
      as: as
    };

    attr = { "function": "createNewHasMany", "options": options };
    return attr;
};



exports.relationshipHasManyWithNameAction = function(result) {

    console.log("ACTION : relationshipHasManyWithNameAction");

    // Set options
    source = result[1];
    target = result[2];
    as = result[3];

    options = {
      target: target,
      source: source,
      foreignKey: "id_"+source.toLowerCase(),
      as: as
    };

    attr = { "function": "createNewHasMany", "options": options };
    return attr;
};


exports.associationHasOneAction = function(result) {

    console.log("ACTION : associationHasOneAction");

    as = result[1];
    target = result[2];

    options = {
      target: target,
      foreignKey: "id_"+as,
      as: as
    }

    attr = { "function": "createNewFieldRelatedTo", "options": options };
    return attr;
};

exports.associationHasOneUsingAction = function(result) {

    console.log("ACTION : associationHasOneAction");

    as = result[1];
    target = result[2];
    usingField = result[3];

    options = {
      target: target,
      foreignKey: "id_"+as,
      as: as,
      usingField: usingField
    }

    attr = { "function": "createNewFieldRelatedTo", "options": options };
    return attr;
};

exports.associationHasOnePresetAction = function(result) {

    console.log("ACTION : associationHasOnePresetAction");

    // Set options
    source = result[1];
    target = result[2];
    as = result[3];
    usingField = result[4];

    options = {
      target: target,
      source: source,
      foreignKey: "id_"+as,
      as: as,
      usingField: usingField
    };

    attr = { "function": "createNewFieldRelatedTo", "options": options };
    return attr;
};


exports.associationHasManyAction = function(result) {

    console.log("ACTION : associationHasManyAction");

    // Set options
    source = result[1];
    target = result[2];
    as = target;

    options = {
      source: source,
      target: target,
      foreignKey: "id_"+as,
      as: as
    }

    attr = { "function": "createNewFieldset", "options": options };
    return attr;
};

exports.associationHasManyUsingAction = function(result) {

    console.log("ACTION : associationHasManyUsingAction");

    // Set options
    source = result[1];
    target = result[2];
    as = result[3];

    options = {
      source: source,
      target: target,
      foreignKey: "id_"+as,
      as: as
    }

    attr = { "function": "createNewFieldset", "options": options };
    return attr;
};

exports.associationHasManyPresetAction = function(result) {

    console.log("ACTION : associationHasManyPresetAction");

    // Set options
    source = result[1];
    target = result[2];
    as = result[3];

    options = {
      source: source,
      target: target,
      foreignKey: "id_"+as,
      as: as
    }

    attr = { "function": "createNewFieldset", "options": options };
    return attr;
};

exports.createNewComponentLocalFileStorageAction = function(result) {

    console.log("ACTION : createNewComponentLocalFileStorageAction");

    var options = {
      component: "localfilestorage",
      name: result[1]
    };

    attr = { "function": "createNewComponentLocalFileStorage", "options": options };
    return attr;
};

exports.createNewComponentContactFormAction = function(result) {

    console.log("ACTION : createNewComponentContactFormAction");

    var options = {
      component: "contactform"
    };

    attr = { "function": "createNewComponentContactForm", "options": options };
    return attr;
};

exports.createNewComponentContactFormWithNameAction = function(result) {

    console.log("ACTION : createNewComponentContactFormWithNameAction");

    var options = {
      component: "contactform",
      name: result[1]
    };

    attr = { "function": "createNewComponentContactForm", "options": options };
    return attr;
};


// ******* Parse *******
exports.parse = function (instruction) {

  var training = {
        "showSessionAction": [
          "show session",
          "show the session",
          "show session values",
          "afficher la session",
          "afficher session"
        ],
        "helpAction": [
          "how could you assist me",
          "help",
          "à l'aide",
          "aidez-moi",
          "aide",
          "au secours"
        ],
        "deployAction": [
          "deploy",
          "déploy"
        ],
        "selectProjectAction": [
          "select project (.*)",
          "select the project (.*)",
          "sélectionner le projet (.*)",
          "sélectionner projet (.*)"
        ],
        "selectApplicationAction": [
          "select application (.*)",
          "select the application (.*)",
          "sélectionner l'application (.*)",
          "sélectionner application (.*)"
        ],
        "selectModuleAction": [
          "select module (.*)",
          "select the module (.*)",
          "sélectionner le module (.*)",
          "sélectionner module (.*)"
        ],
        "selectDataEntityAction": [
          "select entity (.*)",
          "select data entity (.*)",
          "sélectionner l'entité (.*)",
          "sélectionner entité (.*)"
        ],
        "setRequiredAttributeAction": [
          "set field (.*) (.*)",
          "set the field (.*) (.*)",
          "mettre champ (.*) (.*)",
          "mettre le champ (.*) (.*)",
          "mettre le champ (.*) en (.*)"
        ],
        "setColumnVisibilityAction": [
          "set column (.*) (.*)",
          "mettre la colonne (.*) en (.*)"
        ],
        "createNewProjectAction": [
          "create project (.*)",
          "add project (.*)",
          "créer projet (.*)",
          "créer un projet (.*)",
          "ajouter projet (.*)",
          "ajouter un projet (.*)"
        ],
        "createNewApplicationAction": [
          "create application (.*)",
          "add application (.*)",
          "créer application (.*)",
          "créer une application (.*)",
          "ajouter application (.*)",
          "ajouter une application (.*)"
        ],
        "createNewModuleAction": [
          "create module (.*)",
          "add module (.*)",
          "créer module (.*)",
          "créer un module (.*)",
          "ajouter module (.*)",
          "ajouter un module (.*)"
        ],
        "createNewDataEntityAction": [
          "create entity (.*)",
          "create data entity (.*)",
          "add entity (.*)",
          "add data entity (.*)",
          "créer entité (.*)",
          "créer une entité (.*)",
          "ajouter entité (.*)",
          "ajouter une entité (.*)"
        ],
        "createNewDataFieldWithTypeEnumAction": [
          "create field (.*) with type enum and values (.*)",
          "create data field (.*) with type enum and values (.*)",
          "add field (.*) with type enum and values (.*)",
          "add data field (.*) with type enum and values (.*)",
          "créer champ (.*) de type enum avec les valeurs (.*)",
          "créer un champ (.*) de type enum avec les valeurs (.*)",
          "ajouter champ (.*) de type enum avec les valeurs (.*)",
          "ajouter un champ (.*) de type enum avec les valeurs (.*)"
        ],
        "createNewDataFieldWithTypeRadioAction": [
          "create field (.*) with type radio and values (.*)",
          "create data field (.*) with type radio and values (.*)",
          "add field (.*) with type radio and values (.*)",
          "add data field (.*) with type radio and values (.*)",
          "créer champ (.*) de type radio avec les valeurs (.*)",
          "créer un champ (.*) de type radio avec les valeurs (.*)",
          "ajouter champ (.*) de type radio avec les valeurs (.*)",
          "ajouter un champ (.*) de type radio avec les valeurs (.*)"
        ],
        "createNewDataFieldWithTypeAction": [
          "create field (.*) with type (.*)",
          "create data field (.*) with type (.*)",
          "add field (.*) with type (.*)",
          "add data field (.*) with type (.*)",
          "créer champ (.*) de type (.*)",
          "créer un champ (.*) de type (.*)",
          "ajouter champ (.*) de type (.*)",
          "ajouter un champ (.*) de type (.*)"
        ],
        "createNewDataFieldAction": [
          "create field (.*)",
          "create data field (.*)",
          "add field (.*)",
          "add data field (.*)",
          "créer champ (.*)",
          "créer un champ (.*)",
          "ajouter champ (.*)",
          "ajouter un champ (.*)"
        ],
        "deleteProjectAction": [
          "delete project (.*)",
          "drop project (.*)",
          "remove project (.*)",
          "supprimer projet (.*)",
          "supprimer le projet (.*)"
        ],
        "deleteApplicationAction": [
          "delete application (.*)",
          "drop application (.*)",
          "remove application (.*)",
          "supprimer application (.*)",
          "supprimer l'application (.*)"
        ],
        "deleteModuleAction": [
          "delete module (.*)",
          "drop module (.*)",
          "remove module (.*)",
          "supprimer module (.*)",
          "supprimer le module (.*)"
        ],
        "deleteDataEntityAction": [
          "delete entity (.*)",
          "drop entity (.*)",
          "remove entity (.*)",
          "delete data entity (.*)",
          "drop data entity (.*)",
          "remove data entity (.*)",
          "supprimer entité (.*)",
          "supprimer l'entité (.*)"
        ],
        "deleteDataFieldAction": [
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
        "listProjectAction": [
          "list project",
          "list projects",
          "lister projet",
          "lister projets",
          "lister les projets"
        ],
        "listApplicationAction": [
          "list application",
          "list applications",
          "lister application",
          "lister applications",
          "lister les applications"
        ],
        "listModuleAction": [
          "list module",
          "list modules",
          "lister module",
          "lister modules",
          "lister les modules"
        ],
        "listDataEntityAction": [
          "list data entity",
          "list data entities",
          "list entity",
          "list entities",
          "lister entité",
          "lister entités",
          "lister les entités"
        ],
        "listDataFieldAction": [
          "list data field",
          "list data fields",
          "list field",
          "list fields",
          "lister champ",
          "lister champs",
          "lister les champs"
        ],
        "relationshipHasOneWithNameAction": [
          "entity (.*) has one (.*) called (.*)",
          "entité (.*) possède un (.*) appelé (.*)",
          "entité (.*) possède une (.*) appelée (.*)",
          "entité (.*) a un (.*) appelé (.*)",
          "entité (.*) a une (.*) appelée (.*)"
        ],
        "relationshipHasOneAction": [
          "entity (.*) has one (.*)",
          "entité (.*) possède un (.*)",
          "entité (.*) possède une (.*)",
          "entité (.*) a un (.*)",
          "entité (.*) a une (.*)"
        ],
        "relationshipHasManyWithNameAction": [
          "entity (.*) has many (.*) called (.*)",
          "entité (.*) possède plusieurs (.*) appelés (.*)",
          "entité (.*) a plusieurs (.*) appelés (.*)"
        ],
        "relationshipHasManyAction": [
          "entity (.*) has many (.*)",
          "entité (.*) possède plusieurs (.*)",
          "entité (.*) a plusieurs (.*)"
        ],
        "associationHasOneUsingAction": [
          "create field (.*) related to (.*) using (.*)",
          "add field (.*) related to (.*) using (.*)",
          "create data field (.*) related to (.*) using (.*)",
          "add data field (.*) related to (.*) using (.*)",
          "créer un champ (.*) relié à (.*) en utilisant (.*)",
          "créer un champ (.*) relié à (.*) en affichant (.*)",
          "ajouter un champ (.*) relié à (.*) en utilisant (.*)",
          "ajouter un champ (.*) relié à (.*) en affichant (.*)"
        ],
        "associationHasOnePresetAction": [
          "entity (.*) has one preset (.*) called (.*) using (.*)"
        ],
        "associationHasOneAction": [
          "create field (.*) related to (.*)",
          "add field (.*) related to (.*)",
          "create data field (.*) related to (.*)",
          "add data field (.*) related to (.*)",
          "créer un champ (.*) relié à (.*)",
          "ajouter un champ (.*) relié à (.*)"
        ],
        "associationHasManyUsingAction": [
          "create fieldset (.*) related to (.*) using (.*)",
          "add fieldset (.*) related to (.*) using (.*)",
          "créer une liste de (.*) reliée à (.*) en affichant (.*)",
          "créer une liste de (.*) liée à (.*) en affichant (.*)",
          "ajouter une liste de (.*) reliée à (.*) en affichant (.*)",
          "ajouter une liste de (.*) liée à (.*) en affichant (.*)"
        ],
        "associationHasManyPresetAction": [
          "entity (.*) has many preset (.*)"
        ],
        "associationHasManyAction": [
          "create fieldset (.*) related to (.*)",
          "add fieldset (.*) related to (.*)",
          "créer une liste de (.*) reliée à (.*)",
          "créer une liste de (.*) liée à (.*)",
          "ajouter une liste de (.*) reliée à (.*)",
          "ajouter une liste de (.*) liée à (.*)"
        ],
        "createNewComponentLocalFileStorageAction": [
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
        "createNewComponentContactFormAction": [
          "create component contactform",
          "create component contact form",
          "add component contactform",
          "add component contact form",
          "créer un composant formulaire de contact",
          "ajouter un composant formulaire de contact",
          "créer un formulaire de contact",
          "ajouter un formulaire de contact",

        ],
        "createNewComponentContactFormWithNameAction": [
          "create component contactform with name (.*)",
          "create component contact form with name (.*)",
          "add component contactform with name (.*)",
          "add component contact form with name (.*)",
          "créer un composant formulaire de contact nommé (.*)",
          "ajouter un composant formulaire de contact nommé (.*)",
          "créer un formulaire de contact nommé (.*)",
          "ajouter un formulaire de contact nommé (.*)"
        ]
  };

  // Assign instruction for a global visibility
  attr.instruction = instruction;

  var i = 0;
  var l = 0;
  var result = null;
  var selected_key = "";
  for (var key in training) {

    elt = training[key];

    i = 0;
    l = elt.length;
    while ((i < l) && (result == null)) {
      var exp = new RegExp(elt[i], "ig");
      result = exp.exec(attr.instruction);

      if (result == null) {
        i++;
      }
      else {
        selected_key = key;
        console.log(result);
        console.log(key);
      }
    }
  }


  return this[selected_key](result);


}

module.exports = exports;
