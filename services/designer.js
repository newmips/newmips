var designer = {};

// Database Generator
var db_project = require("../database/project");
var db_application = require("../database/application");
var db_module = require("../database/module");
var db_entity = require("../database/data_entity");
var db_field = require("../database/data_field");
var db_component = require("../database/component");
var database = require("../database/database");

// Session
var session = require("./session");

// Structure
var structure_application = require("../structure/structure_application");
var structure_module = require("../structure/structure_module");
var structure_data_entity = require("../structure/structure_data_entity");
var structure_data_field = require("../structure/structure_data_field");
var structure_component = require("../structure/structure_component");

// Other
var helpers = require("../utils/helpers");
var fs = require('fs');
var sequelize = require('../models/').sequelize;

/* --------------------------------------------------------------- */
/* --------------------------- Help ------------------------------ */
/* --------------------------------------------------------------- */
exports.help = function(attr, callback) {
    session.help(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Session ----------------------------- */
/* --------------------------------------------------------------- */
exports.showSession = function(attr, callback) {
    session.showSession(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Deploy ------------------------------ */
/* --------------------------------------------------------------- */
exports.deploy = function(attr, callback) {
    session.deploy(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Project ----------------------------- */
/* --------------------------------------------------------------- */
exports.selectProject = function(attr, callback) {
    db_project.selectProject(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.createNewProject = function(attr, callback) {
    db_project.createNewProject(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.listProject = function(attr, callback) {
    db_project.listProject(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.deleteProject = function(attr, callback) {
    db_project.getProjectApplications(attr.options.showValue, function(err, applications) {
        if (err)
            return callback(err, null);
        var appIds = [];
        for (var i=0; i<applications.length; i++)
            appIds.push(applications[i].id);
        deleteApplicationRecursive(appIds, 0).then(function() {
            db_project.deleteProject(attr, function(err, info) {
                if (err)
                    return callback(err, null);

                callback(null, info);
            });
        });
    });
}

/* --------------------------------------------------------------- */
/* ----------------------- Application --------------------------- */
/* --------------------------------------------------------------- */
exports.selectApplication = function(attr, callback) {
    db_application.selectApplication(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.createNewApplication = function(attr, callback) {
    // Data
    db_application.createNewApplication(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            // Structure application
            attr.id_application = info.insertId;
            structure_application.setupApplication(attr, function() {
                callback(null, info);
            });
        }
    });
}

exports.listApplication = function(attr, callback) {
    db_application.listApplication(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

// Declare this function not directly within exports to be able to use it from deleteApplicationRecursive()
function deleteApplication(attr, callback) {
    function doDelete(id_application){
        structure_application.deleteApplication(id_application, function(err, infoStructure) {
            if (err)
                return callback(err, null);
            sequelize.query("SHOW TABLES LIKE '"+id_application+"_%'").spread(function(results, metada){
                db_application.deleteApplication(id_application, function(err, infoDB) {
                    if (err)
                        return callback(err, null);
                    for (var i = 0; i < results.length; i++) {
                        for (var prop in results[i]) {
                            // For each request disable foreign key checks, drop table. Foreign key check
                            // last only for the time of the request
                            sequelize.query("SET FOREIGN_KEY_CHECKS = 0; DROP TABLE "+results[i][prop]);
                        }
                    }
                    callback(null, infoDB);
                });
            });
        });
    }
    if (isNaN(attr.options.showValue))
        db_application.getIdApplicationByName(attr.options.showValue, function(err, id_application){
            if(err)
                return callback(err, null);
            doDelete(id_application);
        });
    else{
        doDelete(attr.options.showValue);
    }
}
exports.deleteApplication = deleteApplication;

function deleteApplicationRecursive(appIds, idx) {
    return new Promise(function(resolve, reject) {
        if (!appIds[idx])
            return resolve();
        attr.options.showValue = appIds[idx];
        deleteApplication(attr, function() {
            return (appIds[++idx]) ? resolve(deleteApplicationRecursive(appIds, idx)) : resolve();
        });
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Module ------------------------------ */
/* --------------------------------------------------------------- */
exports.selectModule = function(attr, callback) {
    db_module.selectModule(attr, function(err, infoDB) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, infoDB);
        }
    });
}

exports.createNewModule = function(attr, callback) {
    db_module.createNewModule(attr, function(err, infoDB) {
        if (err) {
            callback(err, null);
        } else {
            infoDB.moduleName = attr.options.urlValue;
            // Retrieve list of application modules to update them all
            db_module.listModuleByApplication(attr, function(err, modules) {
                if (err) {
                    callback(err, null);
                } else {

                    // Assign list of existing application modules
                    // Needed to recreate the dropdown list of modules in the interface
                    attr.modules = modules;

                    // Structure
                    structure_module.setupModule(attr, function(err, data) {
                        callback(null, infoDB);
                    });
                }
            });
        }
    });
}

exports.listModule = function(attr, callback) {
    db_module.listModule(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.deleteModule = function(attr, callback) {
    var moduleName = attr.options.showValue;
    if (moduleName.toLowerCase() == 'home'){
        var err = new Error();
        err.message = "You can't delete the home module.";
        return callback(err, null);
    }

    db_module.getEntityListByModuleName(attr.id_application, moduleName, function(err, entities) {
        if (err)
            return callback(err, null);
        var promises = [];
        for (var i = 0; i < entities.length; i++) {
            var tmpAttr = {
                id_application: attr.id_application,
                id_module: attr.id_module,
                id_project: attr.id_project,
                options: {
                    value: entities[i].name
                }
            }

            promises.push(new Promise(function(resolve, reject) {
                (function(tmpAttrIn){
                    deleteDataEntity(tmpAttrIn, function(err) {
                        if (err){
                            return reject(err);
                        }
                        resolve();
                    })
                })(tmpAttr);
            }));
        }

        Promise.all(promises).then(function() {
            attr.module_name = attr.options.value;
            structure_module.deleteModule(attr, function(err) {
                if(err)
                    return callback(err, null);
                db_module.deleteModule(moduleName, function(err, info) {
                    if(err)
                        return callback(err, null);
                    callback(null, info);
                });
            });
        }).catch(function(err){
            callback(err, null);
        });
    });
}

/* --------------------------------------------------------------- */
/* --------------------------- Entity ---------------------------- */
/* --------------------------------------------------------------- */
exports.selectDataEntity = function(attr, callback) {
    db_entity.selectDataEntity(attr, function(err, info) {
        if(err){
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.createNewDataEntity = function(attr, callback) {

    // Get active application module name
    db_module.getModuleById(attr.id_module, function(err, module) {
        if(err){
            callback(err, null);
        } else {

            attr.show_name_module = module.name;
            attr.name_module = module.codeName;
            // Generator database
            db_entity.createNewDataEntity(attr, function(err, infoDB) {
                if(err){
                    callback(err, null);
                } else {
                    structure_data_entity.setupDataEntity(attr, function(err, data) {
                        callback(null, infoDB);
                    });
                }
            });
        }
    });
}

exports.listDataEntity = function(attr, callback) {
    db_entity.listDataEntity(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

function deleteDataEntity(attr, callback) {
    var id_application = attr.id_application;
    var name_data_entity = attr.options.value.toLowerCase();
    var show_name_data_entity = attr.options.showValue.toLowerCase();

    var name_module = "";

    var promises = [];
    var workspacePath = __dirname+'/../workspace/'+id_application;

    db_entity.getIdDataEntityByName(show_name_data_entity, function(err, entityId){
        if(err){
            callback(err, null);
        }
        else{
            var entityOptions = require(workspacePath+'/models/options/'+name_data_entity+'.json');
            for (var i = 0; i < entityOptions.length; i++) {
                if (entityOptions[i].relation == 'hasMany') {
                    var tmpAttr = {
                        options: {
                            value: entityOptions[i].as
                        },
                        id_project: attr.id_project,
                        id_application: attr.id_application,
                        id_module: attr.id_module,
                        id_data_entity: entityId
                    }
                    promises.push(new Promise(function(resolve, reject) {
                        (function(tmpAttrIn) {
                            deleteTab(tmpAttrIn, function() {
                                resolve();
                            })
                        })(tmpAttr);
                    }));
                }
            }

            fs.readdirSync(workspacePath+'/models/options/').filter(function(file) {
                return file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file.slice(0, -5) != name_data_entity;
            }).forEach(function(file) {
                var source = file.slice(0, -5);
                var options = require(workspacePath+'/models/options/'+file);
                for (var i = 0; i < options.length; i++) {
                    if (options[i].target != name_data_entity)
                        continue;
                    if (options[i].relation == 'hasMany') {
                        var tmpAttr = {
                            options: {
                                value: options[i].as
                            },
                            id_project: attr.id_project,
                            id_application: attr.id_application,
                            id_module: attr.id_module
                        }
                        promises.push(new Promise(function(resolve, reject) {
                            (function(tmpAttrIn) {
                                db_entity.getIdDataEntityByName(source, function(err, sourceID) {
                                    tmpAttrIn.id_data_entity = sourceID;
                                    deleteTab(tmpAttrIn, function() {
                                        resolve();
                                    });
                                });
                            })(tmpAttr)
                        }));
                    } else if (options[i].relation == 'belongsTo') {
                        var tmpAttr = {
                            options: {
                                value: options[i].as
                            },
                            id_project: attr.id_project,
                            id_application: attr.id_application,
                            id_module: attr.id_module
                        }
                        promises.push(new Promise(function(resolve, reject) {
                            (function(tmpAttrIn) {
                                db_entity.getIdDataEntityByName(source, function(err, sourceID) {
                                    tmpAttrIn.id_data_entity = sourceID;
                                    deleteDataField(tmpAttrIn, function() {
                                        resolve();
                                    });
                                });
                            })(tmpAttr)
                        }));
                    }
                }
            });

            Promise.all(promises).then(function() {
                db_entity.getModuleCodeNameByEntityName(show_name_data_entity, function(err, name_module) {
                    if (err){
                        return callback(err, null);
                    }
                    database.dropDataEntity(id_application, name_data_entity, function(err) {
                        if (err)
                            return callback(err);
                        attr.name_data_entity = name_data_entity;
                        attr.show_name_data_entity = show_name_data_entity;
                        db_entity.deleteDataEntity(attr, function(err, infoDB) {
                            if (err)
                                return callback(err);
                            var url_name_data_entity = attr.options.urlValue;
                            structure_data_entity.deleteDataEntity(id_application, name_module, name_data_entity, url_name_data_entity, function(){
                                callback(null, infoDB);
                            });
                        });
                    });
                });
            });
        }
    });
}
exports.deleteDataEntity = deleteDataEntity;

/* --------------------------------------------------------------- */
/* --------------------------- Field ----------------------------- */
/* --------------------------------------------------------------- */
exports.createNewDataField = function(attr, callback) {
    // Get active data entity name
    db_entity.getNameDataEntityById(attr.id_data_entity, function(err, name_data_entity) {
        if (err) {
            callback(err, null);
        } else {

            // Get active application module name
            db_module.getNameModuleById(attr.id_module, function(err, name_module) {
                if (err) {
                    callback(err, null);
                } else {

                    attr.name_module = name_module;
                    db_field.createNewDataField(attr, function(err, info) {
                        if (err) {
                            callback(err, null);
                        } else {

                            attr.name_data_entity = name_data_entity;
                            structure_data_field.setupDataField(attr, function(err, data) {
                                callback(null, info);
                            });
                        }
                    });
                }
            });
        }
    });
}

exports.askNameOfDataField = function(attr, callback) {
  var info = {
    message: "What is the name of data field to add ?"
  };
  callback(null, info);
}

function deleteTab(attr, callback) {
    db_entity.getNameDataEntityById(attr.id_data_entity, function(err, name_data_entity) {
        if (err)
            return callback(err, null);

        attr.name_data_entity = name_data_entity;
        structure_data_field.deleteTab(attr, function(err, fk, target) {
            if (err)
                return callback(err, null);

            attr.fieldToDrop = fk;
            attr.name_data_entity = target;
            database.dropFKDataField(attr, function(err, infoDatabase){
                if (err)
                    return callback(err, null);

                db_field.deleteDataField(attr, function(err, infoDB) {
                    if (err)
                        return callback(err, null);

                    var infoDesigner = {};
                    infoDesigner.message = "Tab "+attr.options.value+" deleted.";
                    callback(null, infoDesigner);
                });
            });
        });
    });
}
exports.deleteTab = deleteTab;

// Delete
function deleteDataField(attr, callback) {

    // Get Entity or Type Id
    db_entity.getNameDataEntityById(attr.id_data_entity, function(err, name_data_entity) {
        if (err)
            return callback(err, null);

        // Set name of data entity in attributes
        attr.name_data_entity = name_data_entity;

        // Get field name
        var options = attr.options;
        var name_data_field = options.value;

        try {
            // Delete field from views and models
            structure_data_field.deleteDataField(attr, function(err, infoStructure) {
                if (err)
                    return callback(err, null);

                // Alter database
                attr.fieldToDrop = infoStructure.fieldToDrop;
                attr.name_data_entity = name_data_entity;
                var dropFunction = infoStructure.isConstraint ? 'dropFKDataField' : 'dropDataField';
                database[dropFunction](attr, function(err, info) {
                    if (err)
                        return callback(err, null);

                    // Delete record from software
                    db_field.deleteDataField(attr, function(err, infoDB) {
                        if (err)
                            return callback(err, null);

                        callback(null, infoDB);
                    });
                });
            });
        } catch(err){
            callback(err, null);
        }
    });
}
exports.deleteDataField = deleteDataField;

exports.listDataField = function(attr, callback) {
    db_field.listDataField(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

/* --------------------------------------------------------------- */
/* ---------------------- Field Attributes ----------------------- */
/* --------------------------------------------------------------- */

exports.setRequiredAttribute = function(attr, callback) {
    db_entity.getNameDataEntityById(attr.id_data_entity, function(err, entityName) {
        if (err)
            return callback(err);

        attr.name_data_entity = entityName;
        structure_data_field.setRequiredAttribute(attr, function(err) {
            if (err)
                return callback(err);

            return callback(null, {message: 'Data Field attribute added.'});
        });
    });
}

exports.setColumnVisibility = function(attr, callback) {
    db_entity.getNameDataEntityById(attr.id_data_entity, function(err, entityName) {
        if (err)
            return callback(err);

        attr.name_data_entity = entityName;
        structure_data_field.setColumnVisibility(attr, function(err) {
            if (err)
                return callback(err);

            return callback(null, {message: 'Column visibility modified.'});
        });
    });
}

/* --------------------------------------------------------------- */
/* -------------------- ASSOCIATION / RELATION ------------------- */
/* --------------------------------------------------------------- */

// Create a tab with an add button to create one new object associated to source entity
exports.createNewBelongsTo = function(attr, callback) {

    var info = {};
    function structureCreation(attr, callback){

        // Vérification si une relation existe déjà de la source VERS la target
        var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.source.toLowerCase()+'.json');
        var optionsSourceObject = JSON.parse(optionsSourceFile);

        for (var i = 0; i < optionsSourceObject.length; i++) {
            if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()){
                if(optionsSourceObject[i].relation == "hasMany"){
                    var err = new Error();
                    err.message = 'Source entity already has many target entity, impossible to create belongs to association';
                    return callback(err, null);
                }
                else if(attr.options.as == optionsSourceObject[i].as){
                    var err = new Error();
                    err.message = 'Association already exists between these entities with this alias';
                    return callback(err, null);
                }
            }
        }

        // Vérification si une relation existe déjà de la target VERS la source
        var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
        var optionsObject = JSON.parse(optionsFile);
        for(var i=0; i<optionsObject.length; i++){
            if(optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "hasMany"){
                var err = new Error();
                err.message = 'Bad Entity association, you can\'t set circular \'belongs to\'';
                return callback(err, null);
            }
        }


        // Ajout de la foreign key dans la BDD Newmips
        db_field.createNewForeignKey(attr, function(err, created_foreignKey){
            if(err){
                return callback(err, null);
            }
            // Créer le lien belongsTo en la source et la target
            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsTo", null, true, function(){
                // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                structure_data_field.setupBelongsToTab(attr, function(err, data){
                    if(err){
                        return callback(err, null);
                    }
                    callback(null, info);
                });
            });
        });
    }

    // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
    // CREATION DE SOUS ENTITE OU NON
    db_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
        if (err) {
            //Si c'est bien l'error de data entity qui n'existe pas
            if(err.level == 0){
                // Si l'entité target n'existe pas, on la crée
                db_entity.createNewDataEntityTarget(attr, function(err, created_dataEntity) {
                    // On se dirige en sessions vers l'entité crée
                    //info = created_dataEntity;
                    // Stay on the source entity, even if the target has been created
                    info.insertId = attr.id_data_entity;
                    info.message = "New relation has one / belongs to with subEntity "+created_dataEntity.name+" created.";
                    if (err) {
                        return callback(err, null);
                    }

                    db_module.getNameModuleById(attr.id_module, function(err, name_module) {
                        if (err) {
                            return callback(err, null);
                        }
                        attr.name_module = name_module;

                        // Création de l'entité target dans le workspace
                        structure_data_entity.setupDataEntity(attr, function(err, data) {
                            if (err) {
                                return callback(err, null);
                            }
                            structureCreation(attr, callback);
                        });
                    });

                });
            }
            else{
                callback(err, null);
            }
        } else {
            // Select the target if it already exist
            //info.insertId = dataEntity.id;
            // Stay on the source entity
            info.insertId = attr.id_data_entity;
            info.message = "New relation has one / belongs to with entity "+dataEntity.name+" created.";
            structureCreation(attr, callback);
        }
    });
}

// Create a tab with an add button to create multiple new object associated to source entity
exports.createNewHasMany = function(attr, callback) {

    var info = {};
    var toSync = true;
    function structureCreation(attr, callback){

        var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.source.toLowerCase()+'.json');
        var optionsSourceObject = JSON.parse(optionsSourceFile);

        // Vérification si une relation existe déjà de la source VERS la target
        for (var i = 0; i < optionsSourceObject.length; i++) {
            if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()){

                if(optionsSourceObject[i].relation == "belongsTo"){
                    var err = new Error();
                    err.message = 'Source entity already belongs to target entity, it is impossible to create has many association';
                    return callback(err, null);
                }
                else if(attr.options.as == optionsSourceObject[i].as){
                    var err = new Error();
                    err.message = 'Association already exists between these entities with this name';
                    return callback(err, null);
                }
            }
        }

        var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
        var optionsObject = JSON.parse(optionsFile);

        // Vérification si une relation existe déjà de la target VERS la source
        for(var i=0; i<optionsObject.length; i++){
            if(optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo"){
                var err = new Error();
                err.message = 'Bad Entity association, you can\'t set circular \'has many\'';
                return callback(err, null);
            }
        }

        var reversedAttr = {
            options: {
                source: attr.options.target,
                target: attr.options.source
            },
            id_module: attr.id_module,
            id_application: attr.id_application
        };

        db_field.createNewForeignKey(reversedAttr, function(err, created_foreignKey){
            // Créer le lien belongsTo en la source et la target
            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "hasMany", null, toSync, function(){
                // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                structure_data_field.setupHasManyTab(attr, function(){
                    callback(null, info);
                });
            });
        });
    }

    // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
    db_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
        // Si l'entité target n'existe pas, on la crée
        if (err) {
            //Si c'est bien l'error de data entity qui n'existe pas
            if(err.level == 0){
                db_entity.createNewDataEntityTarget(attr, function(err, created_dataEntity) {
                    // On se dirige en sessions vers l'entité crée
                    //info = created_dataEntity;
                    // Stay on the source entity, even if the target has been created
                    info.insertId = attr.id_data_entity;
                    info.message = "New relation has many with subEntity "+created_dataEntity.name+" created.";
                    if (err) {
                        return callback(err, null);
                    }

                    db_module.getNameModuleById(attr.id_module, function(err, name_module) {
                        if (err) {
                            return callback(err, null);
                        }
                        attr.name_module = name_module;

                        // Création de l'entité target dans le workspace
                        structure_data_entity.setupDataEntity(attr, function(err, data) {
                            if (err) {
                                return callback(err, null);
                            }
                            // There is no need to custom sync the foreign key field because it will be created with the new data entity with Sequelize.sync()
                            toSync = false;
                            structureCreation(attr, callback);
                        });
                    });
                });
            }
            else{
                callback(err, null);
            }
        } else {
            // Select the target if it already exist
            //info.insertId = dataEntity.id;
            //Stay on the source entity
            info.insertId = attr.id_data_entity;
            info.message = "New relation has many with "+dataEntity.name+" created.";
            structureCreation(attr, callback);
        }
    });
}

// Create a tab with a select of existing object and a list associated to it
exports.createNewFieldset = function(attr, callback) {

    // Instruction is add fieldset _FOREIGNKEY_ related to _TARGET_ -> We don't know the source entity name
    db_entity.getNameDataEntityById(attr.id_data_entity, function(err, name_entity_source) {
        if (err)
            return callback(err, null);
        attr.options.source = name_entity_source;

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
            // Si l'entité target n'existe pas ou autre
            if (err) {
                return callback(err, null);
            } else {

                var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.source.toLowerCase() + '.json');
                var optionsSourceObject = JSON.parse(optionsSourceFile);

                // Vérification si une relation existe déjà de la source VERS la target
                for (var i = 0; i < optionsSourceObject.length; i++) {
                    if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()) {

                        if (optionsSourceObject[i].relation == "belongsTo") {
                            var err = new Error();
                            err.message = 'Source entity already belongs to target entity, impossible to create has many association';
                            return callback(err, null);
                        } else if (attr.options.as == optionsSourceObject[i].as) {
                            var err = new Error();
                            err.message = 'Association already exists between these entities with this name';
                            return callback(err, null);
                        }
                    }
                }

                var optionsFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
                var optionsObject = JSON.parse(optionsFile);

                // Vérification si une relation existe déjà de la target VERS la source
                for (var i = 0; i < optionsObject.length; i++) {
                    if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo"){
                        var err = new Error();
                        err.message = 'Bad Entity association, you can\'t set circular \'has many\'';
                        return callback(err, null);
                    }
                }

                var reversedAttr = {
                    options: {
                        source: attr.options.target,
                        target: attr.options.source,
                        foreignKey: attr.options.foreignKey
                    },
                    id_module: attr.id_module,
                    id_application: attr.id_application
                };

                db_field.createNewForeignKey(reversedAttr, function(err, created_foreignKey) {
                    // Créer le lien belongsTo en la source et la target
                    structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "hasMany", null, true, function() {
                        // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                        structure_data_field.setupFieldsetTab(attr, function() {

                            var info = {};
                            info.insertId = attr.id_data_entity;
                            info.message = "New fieldset created.";
                            callback(null, info);
                        });
                    });
                });
            }
        });
    });
}

// Create a field in create/show/update related to target entity
exports.createNewFieldRelatedTo = function(attr, callback) {

    // Instruction is add field _FOREIGNKEY_ related to _TARGET_ -> We don't know the source entity name
    db_entity.getNameDataEntityById(attr.id_data_entity, function(err, name_entity_source) {
        if(err)
            return callback(err, null);
        attr.options.source = name_entity_source;

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
            if (err) {
                // Si l'entité target n'existe pas, on remonte une erreur
                callback(err, null);
            } else {

                // Vérification si une relation existe déjà de la source VERS la target
                var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.source.toLowerCase()+'.json');
                var optionsSourceObject = JSON.parse(optionsSourceFile);

                for (var i=0; i < optionsSourceObject.length; i++) {
                    if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()) {
                        if (optionsSourceObject[i].relation == "hasMany") {
                            var err = new Error();
                            err.message = 'Source entity already has many target entity, impossible to create belongs to association';
                            return callback(err, null);
                        } else if (attr.options.as == optionsSourceObject[i].as) {
                            var err = new Error();
                            err.message = 'Association already exists between these entities with this alias';
                            return callback(err, null);
                        }
                    }
                }

                // Vérification si une relation existe déjà de la target VERS la source
                var optionsFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
                var optionsObject = JSON.parse(optionsFile);
                for (var i=0; i < optionsObject.length; i++) {
                    if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "hasMany"){
                        var err = new Error();
                        err.message = 'Bad Entity association, you can\'t set circular \'belongs to\'';
                        return callback(err, null);
                    }
                }

                // Ajout de la foreign key dans la BDD Newmips
                db_field.createNewForeignKey(attr, function(err, created_foreignKey) {
                    if(err)
                        return callback(err, null);
                    // Créer le lien belongsTo en la source et la target dans models/options/source.json
                    structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsTo", null, true, function() {
                        // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                        structure_data_field.setupRelatedToField(attr, function(err, data) {
                            if(err)
                                return callback(err, null);
                            // Stay on the source entity in session
                            var info = {};
                            info.insertId = attr.id_data_entity;
                            info.message = "New field related to " + dataEntity.name + " created.";
                            callback(null, info);
                        });
                    });
                });
            }
        });
    });
}

/* --------------------------------------------------------------- */
/* -------------------------- COMPONENT -------------------------- */
/* --------------------------------------------------------------- */

// Componant that we can add on an entity to store local documents
exports.createNewComponentLocalFileStorage = function(attr, callback) {

    /* If there is no defined name for the module */
    if(typeof attr.options.value === "undefined"){
        attr.options.value = "local_file_storage"
        attr.options.showValue = "Local File Storage"
    }

    // Check if component with this name is already created on this entity
    db_component.getComponentByNameInEntity(attr, function(err, component){
        if(component){
            err = new Error();
            err.message = "Sorry, a component with this name is already associate to this entity in this module.";
            return callback(err, null);
        }
        else{
            // Check if a table as already the composant name
            db_entity.getDataEntityByName(attr, function(err, dataEntity) {
                if(dataEntity){
                    err = new Error();
                    err.message = "Sorry, an other entity with this component name already exist in this application.";
                    return callback(err, null);
                }
                else{
                    // Create the component in newmips database
                    db_component.createNewComponentOnEntity(attr, function(err, info){
                        // Get Data Entity Name needed for structure
                        db_entity.getNameDataEntityById(attr.id_data_entity, function(err, dataEntityName){
                            attr.options.source = dataEntityName;
                            // setup the hasMany association in the source entity
                            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.value.toLowerCase(), "id_"+attr.options.source.toLowerCase(), attr.options.value.toLowerCase(), "hasMany", null, false, function(){
                                structure_component.newLocalFileStorage(attr, function(err){
                                    if(err)
                                        return callback(err, null);

                                    callback(null, info);
                                });
                            });
                        });
                    });
                }
            });
        }
    });
}

// Componant to create a contact form in a module
exports.createNewComponentContactForm = function(attr, callback) {

    /* If there is no defined name for the module */
    if(typeof attr.options.value === "undefined"){
        attr.options.value = "contact_form"
        attr.options.showValue = "Contact Form"
    }

    // Check if component with this name is already created on this entity
    db_component.getComponentByNameInModule(attr, function(err, component){
        if(component){
            err = new Error();
            err.message = "Sorry, a component with this name is already associate to this module.";
            return callback(err, null);
        }
        else{
            // Check if a table as already the composant name
            db_entity.getDataEntityByName(attr, function(err, dataEntity) {
                if(dataEntity){
                    err = new Error();
                    err.message = "Sorry, a other entity with this component name already exist in this application.";
                    return callback(err, null);
                }
                else{
                    // Create the component in newmips database
                    db_component.createNewComponentOnModule(attr, function(err, info){
                        // Get Data Entity Name needed for structure
                        db_module.getNameModuleById(attr.id_module, function(err, moduleName){
                            attr.options.moduleName = moduleName;
                            structure_component.newContactForm(attr, function(err){
                                if(err)
                                    return callback(err, null);

                                callback(null, info);
                            });
                        });
                    });
                }
            });
        }
    });
}

return designer;
