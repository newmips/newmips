/* ------------------ Lexical grammar ------------------ */
%lex
%%

/* ------------------ First common ------------------ */
\s+                   /* skip whitespace */

/* ---------------------------------------------------- */
/* ------------------ English grammar ----------------- */
/* ---------------------------------------------------- */

"help"                  return 'HELP';
"show"                  return 'SHOW';
"deploy"                return 'DEPLOY';
"select"                return 'SELECT';
"create"                return 'CREATE';
"add"                   return 'CREATE';
"delete"                return 'DELETE';
"remove"                return 'DELETE';
"list"                  return 'LIST';
"session"               return 'SESSION';

"project"               return 'ENTITY';
"projects"              return 'ENTITY';
"PROJECT"               return 'ENTITY';
"PROJECTS"              return 'ENTITY';

"module"                return 'ENTITY';
"modules"               return 'ENTITY';
"MODULE"                return 'ENTITY';
"MODULES"               return 'ENTITY';

"application"           return 'ENTITY';
"applications"          return 'ENTITY';
"APPLICATION"           return 'ENTITY';
"APPLICATIONS"          return 'ENTITY';

"tab"                   return 'ENTITY';
"TAB"                   return 'ENTITY';

"data entity"           return 'ENTITY';
"data entities"         return 'ENTITY';
"entity"                return 'ENTITY';
"entities"              return 'ENTITY';

"DATA ENTITY"           return 'ENTITY';
"DATA ENTITIES"         return 'ENTITY';
"ENTITY"                return 'ENTITY';
"ENTITIES"              return 'ENTITY';

"data field"            return 'ENTITY';
"datafield"             return 'ENTITY';
"data fields"           return 'ENTITY';
"field"                 return 'ENTITY';
"fields"                return 'ENTITY';

"DATA FIELD"            return 'ENTITY';
"DATAFIELD"             return 'ENTITY';
"DATA FIELDS"           return 'ENTITY';
"FIELD"                 return 'ENTITY';
"FIELDS"                return 'ENTITY';

"component"             return 'COMPONENT';
"column"                return 'COLUMN';

"COMPONENT"             return 'COMPONENT';
"COLUMN"                return 'COLUMN';

"with name"             return 'WITH_NAME';
"with"                  return 'WITH';
"related to"            return 'RELATED_TO';
"called"                return 'CALLED';
"id"                    return 'PROPERTY';
"using"                 return 'USING';
"selected on"           return 'USING';
"class"                 return 'PROPERTY';
"type"                  return 'PROPERTY';
"and values"            return 'PROPERTY';
"fieldset"              return 'FIELDSET';
"set"                   return 'SET';
"belongs to"            return 'HAS_ONE';
"has one"               return 'HAS_ONE';
"has many"              return 'HAS_MANY';
"preset"                return 'PRESET';

"WITH NAME"             return 'WITH_NAME';
"WITH"                  return 'WITH';
"RELATED TO"            return 'RELATED_TO';
"CALLED"                return 'CALLED';
"USING"                 return 'USING';
"AND VALUES"            return 'PROPERTY';
"FIELDSET"              return 'FIELDSET';
"SET"                   return 'SET';
"BELONGS TO"            return 'HAS_ONE';
"HAS ONE"               return 'HAS_ONE';
"HAS MANY"              return 'HAS_MANY';


/* ---------------------------------------------------- */
/* ------------------ French grammar ------------------ */
/* ---------------------------------------------------- */

"aide"                      return "HELP";
"afficher"                  return 'SHOW';
"deployer"                  return 'DEPLOY';
"lister"                    return 'LIST';
"sélectionner"              return 'SELECT';
"créer"                     return 'CREATE';
"ajouter"                   return 'CREATE';
"supprimer"                 return 'DELETE';
"session"                   return 'SESSION';
"la session"                return 'SESSION';

"projet"                    return 'ENTITY';
"un projet"                 return 'ENTITY';
"les projets"               return 'ENTITY';

"application"               return 'ENTITY';
"une application"           return 'ENTITY';
"les applications"          return 'ENTITY';

"onglet"                    return 'ENTITY';

"module"                    return 'ENTITY';
"un module"                 return 'ENTITY';
"le module"                 return 'ENTITY';
"modules"                   return 'ENTITY';
"les modules"               return 'ENTITY';

"entité de données"         return 'ENTITY';
"une entité de données"     return 'ENTITY';
"l'entité de données"       return 'ENTITY';
"entités de données"        return 'ENTITY';
"les entités de données"    return 'ENTITY';
"entité"                    return 'ENTITY';
"l'entité"                  return 'ENTITY';
"une entité"                return 'ENTITY';
"entités"                   return 'ENTITY';
"les entités"               return 'ENTITY';

"champ de données"          return 'ENTITY';
"un champ de données"       return 'ENTITY';
"les champs de données"     return 'ENTITY';
"champ"                     return 'ENTITY';
"un champ"                  return 'ENTITY';
"le champ"                  return 'ENTITY';
"les champs"                return 'ENTITY';

"composant"                 return 'COMPONENT';
"colonne"                   return 'COLUMN';

"nommé"                     return 'WITH_NAME';
"avec"                      return 'WITH';
"de"                        return 'WITH';
"classe"                    return 'PROPERTY';
"type"                      return 'PROPERTY';
"les valeurs"               return 'PROPERTY';
"comme une liste de"        return 'SET_OF';
"affecte"                   return 'SET';
"mettre"                    return 'SET';
"ayant"                     return 'HAVING';

"relié à"                   return 'RELATED_TO';
"appartient à"              return 'HAS_ONE';
"a un"                      return 'HAS_ONE';
"appartient à plusieurs"    return 'BELONGS_TO_MANY';
"a plusieurs"               return 'HAS_MANY';
"et valeurs"                return 'PROPERTY';
"et valeur"                 return 'PROPERTY';
"valeurs"                   return 'PROPERTY';
"en utilisant"              return 'USING';
"en affichant"              return 'USING';
"liste de"                  return 'FIELDSET';
"une liste de"              return 'FIELDSET';
"appelé"                    return 'CALLED';


/* ------------------ Last common ------------------ */
[a-zA-Z0-9àâäèéêëîïôœùûüÿçÀÂÄÈÉÊËÎÏÔŒÙÛÜŸÇ_\',]+             return 'STRING';
<<EOF>>                  return 'EOF'

/lex

%start expressions

%{
  // Used to store the parsed data
  var chaine = "";
%}

%%

/* ------------------ Language grammar ------------------ */

expressions
 : instr EOF
	{return $1;}
 ;


instr :
  | CREATE ENTITY STRING
  %{

      value = $3;
      // Supprime les retours à la ligne
      value = value.replace(/\s+/g, '');

      // Preparing Options
      options = {
        value: value,
        processValue: true
      };

      switch ($2.toLowerCase()) {
        case "project":
        case "projet":
        case "un projet":
          return createNewProject(options);
          break;

        case 'application':
        case 'une application':
          return createNewApplication(options);
          break;

        case 'module':
        case 'un module':
          return createNewModule(options);
          break;

        case 'data entity':
        case 'entity':
        case 'entité':
        case 'une entité':
        case "entité de données":
        case "une entité de données":
          return createNewDataEntity(options);
          break;

        case 'data field':
        case 'field':
        case "champ de données":
        case "un champ de données":
        case "champ":
        case "un champ":
        case "le champ":
          return createNewDataField(options);
          break;

        default:
          break;
      }
  %}
  | CREATE ENTITY STRING WITH PROPERTY STRING
  %{

      value = $3;
      type = $6;

      // Preparing Options
      options = {
        value: value,
        type: type,
        processValue: true
      };

      // Creating entity
      switch ($2.toLowerCase()) {
        case 'data field':
        case 'field':
        case "champ de données":
        case "un champ de données":
        case "champ":
        case "un champ":
        case "le champ":
          return createNewDataField(options);
          break;
        default :
          break;
      }
  %}
   | CREATE ENTITY STRING WITH PROPERTY STRING PROPERTY plus
  %{

      value = $3;
      type = $6;

      // Preparing Options
      options = {
        value: value,
        type: type,
        allValues: chaine,
        processValue: true
      };

      chaine = "";

      switch ($2.toLowerCase()) {
        case 'data field' :
        case 'field' :
        case "champ de données":
        case "un champ de données":
        case "champ":
        case "un champ":
        case "le champ":
          return createNewDataField(options);
          break;
        default :
          break;
      }
  %}
  | CREATE COMPONENT STRING
  %{

      // Preparing Options
      options = {}

      switch ($3.toLowerCase()) {
        case "localfilestorage":
          return createNewComponentLocalFileStorage(options);
        case "contactform":
          return createNewComponentContactForm(options);
        default :
          break;
      }
  %}
  | CREATE COMPONENT STRING WITH_NAME STRING
  %{
      // Set name foreign key
      name = $5;

      // Preparing Options
      options = {
        value: name,
        processValue: true
      }

      switch ($3.toLowerCase()) {
        case "localfilestorage":
          return createNewComponentLocalFileStorage(options);
        case "contactform":
          return createNewComponentContactUs(options);
        default :
          break;
      }
  %}
  | CREATE ENTITY STRING RELATED_TO STRING
  %{
      // **** Association One to One ***

      // Set target entity
      target = $5;

      // Set name foreign key
      as = $3;

      // Preparing Options
      options = {
        target: target,
        foreignKey: "id_"+as,
        as: as
      }

      // Creating entity
      switch($2.toLowerCase()) {
        case 'data field' :
        case 'field' :
        case "champ de données":
        case "un champ de données":
        case "champ":
        case "un champ":
        case "le champ":
          return createNewFieldRelatedTo(options);
        default :
          break;
      }
  %}
  | ENTITY STRING HAS_ONE PRESET STRING CALLED STRING USING STRING
  %{
      // **** Association One to One ***

      // Set target entity
      target = $5;

      // Set source entity
      source = $2;

      // Set name foreign key
      as = $5;

      // Set name usingField
      usingField = $7;

      // Preparing Options
      options = {
        target: target,
        source: source,
        foreignKey: "id_"+as,
        as: as,
        usingField: usingField
      }

      return createNewFieldRelatedTo(options);
  %}
  | CREATE ENTITY STRING RELATED_TO STRING USING STRING
  %{
      // **** Association One to One ***

      // Set target entity
      target = $5;

      // Set name foreign key
      as = $3;

      // Set name usingField
      usingField = $7;

      // Preparing Options
      options = {
        target: target,
        foreignKey: "id_"+as,
        as: as,
        usingField: usingField
      }

      switch($2.toLowerCase()) {
        case 'data field' :
        case 'field' :
        case "champ de données":
        case "un champ de données":
        case "champ":
        case "un champ":
        case "le champ":
          return createNewFieldRelatedTo(options);
        default :
          break;
      }
  %}
  | CREATE ENTITY STRING HAS_ONE STRING
  %{
      // **** Relationship One to One ***

      // Set target entity
      target = $5;

      // Set source entity
      source = $3;

      // Preparing Options
      options = {
        target: target,
        source: source
      }

      switch ($2.toLowerCase()) {
        case 'data entity':
        case 'entity' :
        case 'entité':
        case "l'entité":
        case "entité de données":
        case "l'entité de données":
          return createNewEntityWithBelongsTo(options);
        default :
          break;
      }
  %}
  | ENTITY STRING HAS_ONE STRING
  %{
      // **** Relationship One to One ***

      // Set target entity
      target = $4;

      // Set source entity
      source = $2;

      // Preparing Options
      options = {
        target: target,
        source: source,
        foreignKey: "id_"+target,
        as: target
      }

      switch ($1.toLowerCase()) {
        case 'data entity':
        case 'entity' :
        case 'entité':
        case "l'entité":
        case "entité de données":
        case "l'entité de données":
          return createNewBelongsTo(options);
        default :
          break;
      }
  %}
  | ENTITY STRING HAS_ONE STRING CALLED STRING
  %{

      // **** Relationship One to One ***

      // Set target entity
      target = $4;

      // Set source entity
      source = $2;

      // Set name foreign key
      as = $6;

      // Preparing Options
      options = {
        target: target,
        source: source,
        foreignKey: "id_"+as,
        as: as
      }

      switch($1.toLowerCase()) {
        case 'data entity':
        case 'entity' :
        case 'entité':
        case "l'entité":
        case "entité de données":
        case "l'entité de données":
          return createNewBelongsTo(options);
        default :
          break;
      }
  %}
  | CREATE ENTITY STRING HAS_MANY STRING
  %{

      // **** Relationship One to Many ***

      if($2 == "field"){
        // Set target entity
        target = $5;

        // Set name alias
        as = $3;

        // Preparing Options
        options = {
          target: target,
          as: as
        }
      }
      else if($2 == "entity"){
        // Set target entity
        target = $5;

        // Set source entity
        source = $3;

        // Preparing Options
        options = {
          target: target,
          source: source
        }
      }

      switch ($2.toLowerCase()) {
        case 'data field' :
        case 'field' :
        case "champ de données":
        case "un champ de données":
        case "champ":
        case "un champ":
        case "le champ":
          return createNewHasMany(options);

        case 'data entity':
        case 'entity' :
        case 'entité':
        case "l'entité":
        case "entité de données":
        case "l'entité de données":
          return createNewEntityWithHasMany(options);
        default :
          break;
      }
  %}
  | ENTITY STRING HAS_MANY STRING
  %{
      // **** Relationship One to Many ***

      // Set target entity
      target = $4;

      // Set source entity
      source = $2;

      // Preparing Options
      options = {
        target: target,
        source: source,
        foreignKey: "id_"+source.toLowerCase(),
        as: target
      };

      // Creating entity
      switch ($1.toLowerCase()) {
        case 'data entity':
        case 'entity' :
        case 'entité':
        case "l'entité":
        case "entité de données":
        case "l'entité de données":
          return createNewHasMany(options);
        default :
          break;
      }
  %}
  | ENTITY STRING HAS_MANY STRING CALLED STRING
  %{
      // **** Relationship One to Many ***

      // Set target entity
      target = $4;

      // Set source entity
      source = $2;

      // Set name alias
      as = $6;

      // Preparing Options
      options = {
        target: target,
        source: source,
        foreignKey: "id_"+source.toLowerCase()+"_"+as,
        as: as
      }

      switch ($1.toLowerCase()) {
        case 'data entity':
        case 'entity' :
        case 'entité':
        case "l'entité":
        case "entité de données":
        case "l'entité de données":
          return createNewHasMany(options);
        default :
          break;
      }
  %}
  | ENTITY STRING BELONGS_TO_MANY STRING
  %{
      // **** Association One to Many ***

      // Set target entity
      target = $4;

      // Set source entity
      source = $2;

      // Preparing Options
      options = {
        target: target,
        source: source
      }

      switch ($1.toLowerCase()) {
        case 'data entity':
        case 'entity' :
        case 'entité':
        case "l'entité":
        case "entité de données":
        case "l'entité de données":
          return createNewBelongsToMany(options);
        default :
          break;
      }
  %}
  | CREATE FIELDSET STRING RELATED_TO STRING
  %{
      // **** Association One to Many ***

      // Set target entity
      target = $5;

      // Set name alias
      as = $3;

      // Preparing Options
      options = {
        target: target,
        foreignKey: "id_"+as,
        as: as
      }

      switch ($2.toLowerCase()) {
        case 'fieldset' :
        case "liste de":
        case "une liste de":
          return createNewFieldset(options);
        default :
          break;
      }
  %}
  | CREATE FIELDSET STRING RELATED_TO STRING USING STRING
  %{
      // **** Association One to Many ***

      // Set target entity
      target = $5;

      // Set name alias
      as = $3;

      // Set name usingField
      usingField = $7;

      // Preparing Options
      options = {
        target: target,
        foreignKey: "id_"+as,
        as: as,
        usingField: usingField
      }

      switch ($2.toLowerCase()) {
        case 'fieldset' :
        case "liste de":
        case "une liste de":
          return createNewFieldset(options);
        default :
          break;
      }
  %}
  | DELETE ENTITY STRING
  %{

      value = $3;

      // Preparing Options
      options = {
        value: value
      };

      switch($2.toLowerCase()){
        case 'project' :
        case 'un projet' :
          return deleteProject(options);
          break;
        case "application" :
        case "une application" :
          return deleteApplication(options);
          break;
        case 'data field' :
        case 'field' :
        case "champ de données":
        case "un champ de données":
        case "champ":
        case "un champ":
        case "le champ":
          return deleteDataField(options);
          break;
        case 'data entity':
        case 'entity' :
        case 'entité':
        case "l'entité":
        case "entité de données":
        case "l'entité de données":
          return deleteDataEntity(options);
          break;
        case 'tab':
        case 'onglet':
          return deleteTab(options);
          break;
        case "module":
        case "un module":
        case "le module":
        case 'module':
          return deleteModule(options);
          break;
        default :
          break;
      }
  %}
  | SELECT ENTITY STRING
  %{

      value = $3;

      // Preparing Options
      options = {
        value: value
      };

      switch ($2.toLowerCase()) {
        case 'project' :
          return selectProject(options);
          break;
        case "application" :
        case "une application" :
          return selectApplication(options);
          break;
        case 'module' :
        case 'le module' :
          return selectModule(options);
          break;
        case 'data entity' :
          return selectDataEntity(options);
          break;
        case 'data entity':
        case 'entity' :
        case 'entité':
        case "l'entité":
        case "entité de données":
        case "l'entité de données":
          return selectDataEntity(options);
          break;
        default :
          break;
      }
  %}
  | LIST ENTITY
  %{
     // Preparing Options
     options = {};

     switch ($2.toLowerCase()) {
      case 'project' :
      case 'les projets' :
         return listProject(options);

      case "applications":
      case "application":
      case "les applications":
        return listApplication(options);

      case 'module' :
      case 'modules' :
      case 'les modules' :
        return listModule(options);

      case 'data entity' :
      case 'data entities' :
      case 'entity' :
      case 'entities' :
      case 'entités' :
      case 'les entités' :
      case "entité de données":
      case "entités de données":
      case 'les entités de données' :
        return listDataEntity(options);

      case 'data field' :
      case 'data fields' :
      case 'field' :
      case 'fields' :
      case "champs de données":
      case "les champs de données":
      case "champs":
      case "les champs":
        return listDataField(options);
      default :
        break;
     }
  %}
  | SET ENTITY STRING STRING
  %{
      // Preparing Options
      var options = {
        field_name: $3,
        word: $4
      };

      return setRequiredAttribute(options);
  %}
  | SET COLUMN STRING STRING
  %{
      // Preparing Options
      var options = {
        field_name: $3,
        word: $4
      };

      return setColumnVisibility(options);
  %}
  | SHOW SESSION
  %{
    return showSession();
  %}
  | HELP
  %{
    return help();
  %}
  | DEPLOY
  %{
    return deploy();
  %};

plus : %{  %}
  | STRING plus
  %{
    if (chaine == ""){
      chaine = $1;
    }
    else{
      chaine = $1 + " " + chaine;
    }
  %};
%%

function help(options) { return { "function": "help", "options": options }; }
function showSession(options) { return { "function": "showSession", "options": options }; }
function deploy(options) { return { "function": "deploy", "options": options }; }

function selectProject(options) { return { "function": "selectProject", "options": options }; }
function selectApplication(options) { return { "function": "selectApplication", "options": options }; }
function selectModule(options) { return { "function": "selectModule", "options": options }; }
function selectDataEntity(options) { return { "function": "selectDataEntity", "options": options }; }

function setRequiredAttribute(options) { return { "function": "setRequiredAttribute", "options": options};}
function setColumnVisibility(options) { return { "function": "setColumnVisibility", "options": options};}

function createNewProject(options) {  return { "function": "createNewProject", "options": options }; }
function createNewApplication(options) { return { "function": "createNewApplication", "options": options }; }
function createNewModule(options) { return { "function": "createNewModule", "options": options }; }
function createNewDataEntity(options) { return { "function": "createNewDataEntity", "options": options }; }
function createNewDataField(options) { return { "function": "createNewDataField", "options": options }; }

function deleteProject(options) { return { "function": "deleteProject", "options": options }; }
function deleteApplication(options) { return { "function": "deleteApplication", "options": options }; }
function deleteDataField(options) { return { "function": "deleteDataField", "options": options }; }
function deleteDataEntity(options) { return { "function": "deleteDataEntity", "options": options }; }
function deleteTab(options) { return { "function": "deleteTab", "options": options }; }
function deleteModule(options) { return { "function": "deleteModule", "options": options }; }

function listProject(options) {  return { "function": "listProject", "options": options }; }
function listApplication(options) {  return { "function": "listApplication", "options": options }; }
function listModule(options) {  return { "function": "listModule", "options": options }; }
function listDataEntity(options) {  return { "function": "listDataEntity", "options": options }; }
function listDataField(options) {  return { "function": "listDataField", "options": options }; }

function createNewEntityWithBelongsTo(options) {  return { "function": "createNewEntityWithBelongsTo", "options": options }; }
function createNewEntityWithHasMany(options) {  return { "function": "createNewEntityWithHasMany", "options": options }; }
function createNewBelongsTo(options) {  return { "function": "createNewBelongsTo", "options": options }; }
function createNewHasMany(options) {  return { "function": "createNewHasMany", "options": options }; }
function createNewBelongsToMany(options) {  return { "function": "createNewBelongsToMany", "options": options }; }

function createNewFieldRelatedTo(options) {  return { "function": "createNewFieldRelatedTo", "options": options }; }
function createNewFieldset(options) {  return { "function": "createNewFieldset", "options": options }; }

function createNewComponentLocalFileStorage(options) {  return { "function": "createNewComponentLocalFileStorage", "options": options }; }
function createNewComponentContactForm(options) {  return { "function": "createNewComponentContactForm", "options": options }; }