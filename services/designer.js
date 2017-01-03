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
    db_project.getProjectApplications(attr.options[0].value, function(err, applications) {
        if (err)
            return callback(err, null);
        var appIds = [];
        for (var i = 0; i < applications.length; i++)
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
            attr['id_application'] = info.insertId;
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
                db_application.deleteApplication(id_application, function(err, infoDBG) {
                    if (err)
                        return callback(err, null);
                    for (var i = 0; i < results.length; i++) {
                        for (var prop in results[i]) {
                            // For each request disable foreign key checks, drop table. Foreign key check
                            // last only for the time of the request
                            sequelize.query("SET FOREIGN_KEY_CHECKS = 0; DROP TABLE "+results[i][prop]);
                        }
                    }
                    callback(null, info);
                });
            });
        });
    }
    if (isNaN(attr.options[0].value))
        db_application.getIdApplicationByName(attr.options[0].value, function(err, id_application){
            if (!id_application)
                return callback(err, null);
            doDelete(id_application);
        });
    else
        doDelete(attr.options[0].value);
}
exports.deleteApplication = deleteApplication;

function deleteApplicationRecursive(appIds, idx) {
    return new Promise(function(resolve, reject) {
        if (!appIds[idx])
            return resolve();
        var attr = {
            options: [{property: 'entity', value: appIds[idx]}]
        }
        deleteApplication(attr, function() {
            return (appIds[++idx]) ? resolve(deleteApplicationRecursive(appIds, idx)) : resolve();
        });
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Module ------------------------------ */
/* --------------------------------------------------------------- */
exports.selectModule = function(attr, callback) {
    db_module.selectModule(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.createNewModule = function(attr, callback) {
    db_module.createNewModule(attr, function(err, info_create) {
        if (err) {
            callback(err, null);
        } else {
            info_create.moduleName = attr.options[0].value;
            // Retrieve list of application modules to update them all
            db_module.listModuleByApplication(attr, function(err, modules) {
                if (err) {
                    callback(err, null);
                } else {

                    // Assign list of existing application modules
                    attr.modules = modules;

                    // Structure
                    structure_module.setupModule(attr, function(err, data) {
                        callback(null, info_create);
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
    var moduleName = attr.options[0].value;
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
                options: [{value: entities[i].name}]
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
            attr.module_name = moduleName;
            structure_module.deleteModule(attr, function(err) {
                if (err)
                    return callback(err, null);
                db_module.deleteModule(moduleName, function(err, info) {
                    if (err)
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
/* ------------------------- DataEntity -------------------------- */
/* --------------------------------------------------------------- */
exports.selectDataEntity = function(attr, callback) {
    db_entity.selectDataEntity(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.createNewDataEntity = function(attr, callback) {

    // Get active application module name
    db_module.getNameModuleById(attr['id_module'], function(err, name_module) {
        if (err) {
            callback(err, null);
        } else {
            var json = {
                "property": "name_module",
                "value": name_module
            };
            attr['options'].push(json);

            // API
            db_entity.createNewDataEntity(attr, function(err, info) {
                if(err){
                    callback(err, null);
                } else {
                    structure_data_entity.setupDataEntity(attr, function(err, data) {
                        callback(null, info);
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
    var name_data_entity = attr.options[0].value.toLowerCase();
    var name_module = "";

    var promises = [];
    var workspacePath = __dirname + '/../workspace/' + id_application;

    db_entity.getIdDataEntityByName(name_data_entity, function(err, entityId){
        if(err){
            callback(err.message, null);
        }
        else{
            var entityOptions = require(workspacePath + '/models/options/' + name_data_entity + '.json');
            for (var i = 0; i < entityOptions.length; i++) {
                if (entityOptions[i].relation == 'hasMany') {
                    var tmpAttr = {
                        options: [{
                            property: 'entity',
                            value: entityOptions[i].as
                        }],
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

            fs.readdirSync(workspacePath + '/models/options/').filter(function(file) {
                return file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file.slice(0, -5) != name_data_entity;
            }).forEach(function(file) {
                var source = file.slice(0, -5);
                var options = require(workspacePath + '/models/options/' + file);
                for (var i = 0; i < options.length; i++) {
                    if (options[i].target != name_data_entity)
                        continue;
                    if (options[i].relation == 'hasMany') {
                        var tmpAttr = {
                            options: [{
                                property: 'entity',
                                value: options[i].as
                            }],
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
                            options: [{
                                property: 'entity',
                                value: options[i].as
                            }],
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
                db_entity.getModuleNameByEntityName(name_data_entity, function(err, name_module) {
                    if (err)
                        return callback(err, null);
                    database.dropDataEntity(id_application, name_data_entity, function(err) {
                        if (err)
                            return callback(err);
                        attr.name_data_entity = name_data_entity;
                        db_entity.deleteDataEntity(attr, function(err, info) {
                            if (err)
                                return callback(err);
                            structure_data_entity.deleteDataEntity(id_application, name_module, name_data_entity, function() {
                                callback(null, info);
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
/* ------------------------- DataField -------------------------- */
/* --------------------------------------------------------------- */
exports.createNewDataField = function(attr, callback) {
    db_field.createNewDataField(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {

            // Get active application module name
            db_module.getNameModuleById(attr['id_module'], function(err, name_module) {
                if (err) {
                    callback(err, null);
                } else {
                    json = {
                        "property": "name_module",
                        "value": name_module
                    };
                    attr['options'].push(json);

                    // Get active data entity name
                    db_entity.getNameDataEntityById(attr['id_data_entity'], function(err, name_data_entity) {
                        if (err) {
                            callback(err, null);
                        } else {
                            json = {
                                "property": "name_data_entity",
                                "value": name_data_entity
                            };
                            attr['options'].push(json);

                            // *** 1 - Initialize variables according to options ***
                            options = attr['options'];
                            i = 0;
                            type_data_field = "";
                            while (i < options.length) {
                                if (options[i].property == "type") type_data_field = options[i].value;
                                i++;
                            }

                            attr.options.push({property: 'type', value: type_data_field});

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
            attr.options.push({
                "property": "name_data_entity",
                "value": target
            });
            database.dropFKDataField(attr, function(err, info){
                if (err)
                    return callback(err, null);

                db_field.deleteDataField(attr, function(err, info) {
                    if (err)
                        return callback(err, null);
                    callback(null, info);
                });
            })
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
        property = "name_data_entity";
        value = name_data_entity;
        json = {
            "property": property,
            "value": value
        };
        attr.options.push(json);

        // Get field name
        var options = attr.options;
        var name_data_field = "";
        for (var i = 0; i < options.length; i++)
            if (options[i].property == "entity") name_data_field = options[i].value;

        try {
            // Delete field from views and models
            structure_data_field.deleteDataField(attr, function(err, info) {
                if (err)
                    return callback(err, null);

                console.log("START - database.dropDataField");

                // Alter database
                attr.fieldToDrop = info.fieldToDrop;
                attr.options.push({
                    "property": "name_data_entity",
                    "value": name_data_entity
                });
                var dropFunction = info.isConstraint ? 'dropFKDataField' : 'dropDataField';
                database[dropFunction](attr, function(err, info) {
                    if (err)
                        return callback(err, null);

                    console.log("START - db_field.deleteDataField");

                    // Delete record from software
                    db_field.deleteDataField(attr, function(err, info) {
                        if (err)
                            return callback(err, null);
                        callback(null, info);
                    });
                });
            });
        } catch(e){
            console.error(e);
            callback(e, null);
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

// Belongs To With Source Entity creation
exports.createNewEntityWithBelongsTo = function(attr, callback) {
    // Vérification si une relation existe déjà de la target VERS la source
    var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
    optionsObject = JSON.parse(optionsFile);
    for(var i=0; i<optionsObject.length; i++){
        if(optionsObject[i].target == attr.options.source && optionsObject[i].relation != "hasMany")
            return callback('Bad Entity association, you can\'t set circular \'belongs to\'', null);
    }

    // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
    db_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            // Ajout de l'entité source dans la BDD Newmips
            db_entity.createNewDataEntitySource(attr, function(err, created_dataEntity) {
                if (err) {
                    console.log(err);
                    callback(err, null);
                } else {
                    // Ajout de la foreign key dans la BDD Newmips
                    db_field.createNewForeignKey(attr, function(err, created_foreignKey){
                        // Récupère le nom du module, necessaire au bon fonctionnement des fichiers structures
                        db_module.getNameModuleById(attr.id_module, function(err, name_module) {
                            attr.name_module = name_module;
                            // Création de l'entité source dans le workspace
                            structure_data_entity.setupDataEntity(attr, function(err, data) {
                                // Créer le lien belongsTo en la source et la target
                                structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsTo", null, true, function(){
                                    // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                                    structure_data_field.setupAssociationField(attr, 'belongsTo', function(err, data){
                                        callback(null, created_dataEntity);
                                    });
                                });
                            });
                        });
                    });
                }
            });
        }
    });
}

// Has Many With Source Entity creation
exports.createNewEntityWithHasMany = function(attr, callback) {
    // Vérification si une relation existe déjà de la target VERS la source
    var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
    optionsObject = JSON.parse(optionsFile);
    for(var i=0; i<optionsObject.length; i++){
        if(optionsObject[i].target == attr.options.source && optionsObject[i].relation != "belongsTo")
            return callback('Bad Entity association, you can\'t set circular \'has many\'', null);
    }

    // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
    db_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            // Ajout de l'entité source dans la BDD Newmips
            db_entity.createNewDataEntitySource(attr, function(err, created_dataEntity) {
                if (err) {
                    console.log(err);
                    callback(err, null);
                } else {
                    // Ajout de la foreign key dans la BDD Newmips, reverse needed to handle hasMany relation
                    var reversedAttr = {
                        options: {
                            source: attr.options.target,
                            target: attr.options.source
                        },
                        id_module: attr.id_module,
                        id_application: attr.id_application
                    };
                    db_field.createNewForeignKey(reversedAttr, function(err, created_foreignKey){
                        // Récupère le nom du module, necessaire au bon fonctionnement des fichiers structures
                        db_module.getNameModuleById(attr.id_module, function(err, name_module) {
                            attr.name_module = name_module;
                            // Création de l'entité source dans le workspace
                            structure_data_entity.setupDataEntity(attr, function(err, data) {
                                // Créer le lien belongsTo en la source et la target
                                structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "hasMany", null, true, function(){
                                    // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                                    structure_data_field.setupAssociationField(attr, 'hasMany', function(err, data){
                                        callback(null, created_dataEntity);
                                    });
                                });
                            });
                        });
                    });
                }
            });
        }
    });
}

// Belongs To
exports.createNewBelongsTo = function(attr, callback) {

    var info = {};

    function structureCreation(attr, callback){

        // Vérification si une relation existe déjà de la source VERS la target
        var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.source.toLowerCase()+'.json');
        var optionsSourceObject = JSON.parse(optionsSourceFile);

        for (var i = 0; i < optionsSourceObject.length; i++) {
            if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()){
                if(optionsSourceObject[i].relation == "hasMany"){
                    return callback('Source entity already has many target entity, impossible to create belongs to association', null);
                }
                else if(attr.options.as == optionsSourceObject[i].as){
                    return callback('Association already exists between these entities with this alias', null);
                }
            }
        }

        // Vérification si une relation existe déjà de la target VERS la source
        var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
        var optionsObject = JSON.parse(optionsFile);
        for(var i=0; i<optionsObject.length; i++){
            if(optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "hasMany")
                return callback('Bad Entity association, you can\'t set circular \'belongs to\'', null);
        }


        // Ajout de la foreign key dans la BDD Newmips
        db_field.createNewForeignKey(attr, function(err, created_foreignKey){
            if(err){
                console.log(err);
                callback(err, null);
            }
            // Créer le lien belongsTo en la source et la target
            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsTo", null, true, function(){
                // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                structure_data_field.setupBelongsToTab(attr, function(err, data){
                    if(err){
                        console.log(err);
                        callback(err, null);
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
                        console.log(err);
                        callback(err, null);
                    }

                    db_module.getNameModuleById(attr.id_module, function(err, name_module) {
                        if (err) {
                            console.log(err);
                            callback(err, null);
                        }
                        attr.name_module = name_module;

                        // Création de l'entité target dans le workspace
                        structure_data_entity.setupDataEntity(attr, function(err, data) {
                            if (err) {
                                console.log(err);
                                callback(err, null);
                            }
                            structureCreation(attr, callback);
                        });
                    });

                });
            }
            else{
                console.log(err);
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

// Create a tab with a add button
exports.createNewHasMany = function(attr, callback) {

    var info = {};

    function structureCreation(attr, callback){

        var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.source.toLowerCase()+'.json');
        var optionsSourceObject = JSON.parse(optionsSourceFile);

        // Vérification si une relation existe déjà de la source VERS la target
        for (var i = 0; i < optionsSourceObject.length; i++) {
            if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()){

                if(optionsSourceObject[i].relation == "belongsTo"){
                    return callback('Source entity already belongs to target entity, it is impossible to create has many association', null);
                }
                else if(attr.options.as == optionsSourceObject[i].as){
                    return callback('Association already exists between these entities with this name', null);
                }
            }
        }

        var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
        var optionsObject = JSON.parse(optionsFile);

        // Vérification si une relation existe déjà de la target VERS la source
        for(var i=0; i<optionsObject.length; i++){
            if(optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo")
                return callback('Bad Entity association, you can\'t set circular \'has many\'', null);
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
            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "hasMany", null, true, function(){
                // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                structure_data_field.setupHasManyTab(attr, function(err, data){
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
                        console.log(err);
                        callback(err, null);
                    }

                    db_module.getNameModuleById(attr.id_module, function(err, name_module) {
                        if (err) {
                            console.log(err);
                            callback(err, null);
                        }
                        attr.name_module = name_module;

                        // Création de l'entité target dans le workspace
                        structure_data_entity.setupDataEntity(attr, function(err, data) {
                            if (err) {
                                console.log(err);
                                callback(err, null);
                            }
                            structureCreation(attr, callback);
                        });
                    });
                });
            }
            else{
                console.log(err);
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

// Belongs To Many
exports.createNewBelongsToMany = function(attr, callback) {
    // Vérification si une relation existe déjà de la target VERS la source
    var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
    optionsObject = JSON.parse(optionsFile);
    for(var i=0; i<optionsObject.length; i++){
        if(optionsObject[i].target == attr.options.source)
            return callback('Bad Entity association, you can\'t set circular \'as a list of / belongs to many\'', null);
    }

    // Vérification si une relation existe déjà de la source VERS la target
    var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.source.toLowerCase()+'.json');
    var optionsSourceObject = JSON.parse(optionsSourceFile);
    for (var i = 0; i < optionsSourceObject.length; i++) {
        if (optionsSourceObject[i].target == attr.options.target)
            return callback('Association already exists between these entities', null);
    }
    // Vérifie que la target existe bien avant de creer la source et la table fonctionnelle contenant les 2 clées étrangères
    db_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            // Create the through table name, which must be the same for the two tables
            var through = attr.id_application + "_" + attr.options.source.toLowerCase() + "_" + attr.options.target.toLowerCase();
            // Créer le lien belongsToMany entre la source et la target
            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsToMany", through, true, function(){
                structure_data_entity.setupAssociation(attr.id_application, attr.options.target, attr.options.source, attr.options.foreignKey, attr.options.as, "belongsToMany", through, true, function(){
                    // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                    structure_data_field.setupAssociationField(attr, 'belongsToMany', function(err, data){
                        var tmp = attr.options.source;
                        attr.options.source = attr.options.target;
                        attr.options.target = tmp;
                        structure_data_field.setupAssociationField(attr, 'belongsToMany', function(err, data){
                            callback(null, attr);
                        });
                    });
                });
            });
        }
    });
}

// Create a tab with a select and a list
exports.createNewFieldset = function(attr, callback) {

    // Instruction is add fieldset _FOREIGNKEY_ related to _TARGET_ -> We don't know the source entity name
    db_entity.getNameDataEntityById(attr.id_data_entity, function(err, name_entity_source) {
        attr.options.source = name_entity_source;

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
            // Si l'entité target n'existe pas ou autre
            if (err) {
                console.log(err);
                callback(err, null);
            } else {

                var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.source.toLowerCase() + '.json');
                var optionsSourceObject = JSON.parse(optionsSourceFile);

                // Vérification si une relation existe déjà de la source VERS la target
                for (var i = 0; i < optionsSourceObject.length; i++) {
                    if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()) {

                        if (optionsSourceObject[i].relation == "belongsTo") {
                            return callback('Source entity already belongs to target entity, impossible to create has many association', null);
                        } else if (attr.options.as == optionsSourceObject[i].as) {
                            return callback('Association already exists between these entities with this name', null);
                        }
                    }
                }

                var optionsFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
                var optionsObject = JSON.parse(optionsFile);

                // Vérification si une relation existe déjà de la target VERS la source
                for (var i = 0; i < optionsObject.length; i++) {
                    if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo")
                        return callback('Bad Entity association, you can\'t set circular \'has many\'', null);
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
                        structure_data_field.setupFieldsetTab(attr, function(err, data) {

                            var info = {};
                            info.insertId = attr.id_data_entity;
                            info.message = "New relation created.";
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
        attr.options.source = name_entity_source;

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
            if (err) {
                // Si l'entité target n'existe pas, on remonte une erreur
                console.log(err);
                callback(err, null);
            } else {

                // Vérification si une relation existe déjà de la source VERS la target
                var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.source.toLowerCase() + '.json');
                var optionsSourceObject = JSON.parse(optionsSourceFile);

                for (var i = 0; i < optionsSourceObject.length; i++) {
                    if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()) {
                        if (optionsSourceObject[i].relation == "hasMany") {
                            return callback('Source entity already has many target entity, impossible to create belongs to association', null);
                        } else if (attr.options.as == optionsSourceObject[i].as) {
                            return callback('Association already exists between these entities with this alias', null);
                        }
                    }
                }

                // Vérification si une relation existe déjà de la target VERS la source
                var optionsFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
                var optionsObject = JSON.parse(optionsFile);
                for (var i = 0; i < optionsObject.length; i++) {
                    if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "hasMany")
                        return callback('Bad Entity association, you can\'t set circular \'belongs to\'', null);
                }

                // Ajout de la foreign key dans la BDD Newmips
                db_field.createNewForeignKey(attr, function(err, created_foreignKey) {
                    if (err) {
                        console.log(err);
                        callback(err, null);
                    }
                    // Créer le lien belongsTo en la source et la target dans models/options/source.json
                    structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsTo", null, true, function() {
                        // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                        structure_data_field.setupRelatedToField(attr, function(err, data) {
                            if (err) {
                                console.log(err);
                                callback(err, null);
                            }
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

/* -------------------------------------------------- */
/* -------------------- COMPONENT ------------------- */
/* -------------------------------------------------- */

// Componant that we can add on an entity to store local documents
exports.createNewComponentLocalFileStorage = function(attr, callback) {

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
                            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.name.toLowerCase(), "id_"+attr.options.source.toLowerCase(), attr.options.name.toLowerCase(), "hasMany", null, false, function(){
                                structure_component.newLocalFileStorage(attr, function(err){
                                    if(err){
                                        callback(err, null);
                                    }
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
                                if(err){
                                    callback(err, null);
                                }
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
