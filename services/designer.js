var designer = {};

var api_project = require("../api/project");
var api_application = require("../api/application");
var api_module = require("../api/module");
var api_data_entity = require("../api/data_entity");
var api_data_field = require("../api/data_field");
var api_component = require("../api/component");
var session = require("./session");
var structure_application = require("../structure/structure_application");
var structure_module = require("../structure/structure_module");
var structure_data_entity = require("../structure/structure_data_entity");
var structure_data_field = require("../structure/structure_data_field");
var structure_component = require("../structure/structure_component");
var database = require("./database");
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
/* ------------------------- Project ----------------------------- */
/* --------------------------------------------------------------- */
exports.selectProject = function(attr, callback) {
    api_project.selectProject(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.createNewProject = function(attr, callback) {
    api_project.createNewProject(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.listProject = function(attr, callback) {
    api_project.listProject(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.deleteProject = function(attr, callback) {
    api_project.getProjectApplications(attr.options[0].value, function(err, applications) {
        if (err)
            return callback(err, null);
        var appIds = [];
        for (var i = 0; i < applications.length; i++)
            appIds.push(applications[i].id);
        deleteApplicationRecursive(appIds, 0).then(function() {
            api_project.deleteProject(attr, function(err, info) {
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
    api_application.selectApplication(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.createNewApplication = function(attr, callback) {
    // Data
    api_application.createNewApplication(attr, function(err, info) {
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
    api_application.listApplication(attr, function(err, info) {
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
        structure_application.deleteApplication(id_application, function(err, info) {
            if (err)
                return callback(err, null);
            sequelize.query("SHOW TABLES LIKE '"+id_application+"_%'").spread(function(results, metada){
                api_application.deleteApplication(id_application, function(err) {
                    if (err)
                        return callback(err, null);
                    for (var i = 0; i < results.length; i++) {
                        for (var prop in results[i]) {
                            // For each request disable foreign key checks, drop table. Foreign key check
                            // last only for the time of the request
                            sequelize.query("SET FOREIGN_KEY_CHECKS = 0; DROP TABLE "+results[i][prop]);
                        }
                    }
                    callback(null, {message: "Application "+id_application+" | "+attr.options[0].value+" deleted"});
                });
            });
        });
    }
    if (isNaN(attr.options[0].value))
        api_application.getIdApplicationByName(attr.options[0].value, function(err, id_application){
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
    api_module.selectModule(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.createNewModule = function(attr, callback) {
    api_module.createNewModule(attr, function(err, info_create) {
        if (err) {
            callback(err, null);
        } else {
            info_create.moduleName = attr.options[0].value;
            // Retrieve list of application modules to update them all
            api_module.listModuleByApplication(attr, function(err, modules) {
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
    api_module.listModule(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.deleteModule = function(attr, callback) {
    var moduleName = attr.options[0].value;
    if (moduleName.toLowerCase() == 'home')
        return callback("You can't delete home module");

    api_module.getEntityListByModuleName(attr.id_application, moduleName, function(err, entities) {
        if (err)
            return callback(err);
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
                        console.log()
                        if (err)
                            return reject(err);
                        resolve();
                    })
                })(tmpAttr);
            }));
        }

        Promise.all(promises).then(function() {
            attr.module_name = moduleName;
            structure_module.deleteModule(attr, function(err) {
                if (err)
                    return callback(err);
                api_module.deleteModule(moduleName, function(err) {
                    if (err)
                        return callback(err);
                    callback(null, {message: "Module deleted"});
                });
            });
        }).catch(callback);
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- DataEntity -------------------------- */
/* --------------------------------------------------------------- */
exports.selectDataEntity = function(attr, callback) {
    api_data_entity.selectDataEntity(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.createNewDataEntity = function(attr, callback) {

    // Get active application module name
    api_module.getNameModuleById(attr['id_module'], function(err, name_module) {
        if (err) {
            callback(err, null);
        } else {
            json = {
                "property": "name_module",
                "value": name_module
            };
            attr['options'].push(json);

            // API
            api_data_entity.createNewDataEntity(attr, function(err, info) {
                if (err) {
                    callback(err, null);
                } else {
                    // Structure
                    structure_data_entity.setupDataEntity(attr, function(err, data) {
                        callback(null, info);
                    });
                }
            });
        }
    });
}

exports.listDataEntity = function(attr, callback) {
    api_data_entity.listDataEntity(attr, function(err, info) {
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
    var workspacePath = __dirname + '/../workspace/'+id_application;

    api_data_entity.getIdDataEntityByName(name_data_entity, function(err, entityId) {
        var entityOptions = require(workspacePath+'/models/options/'+name_data_entity+'.json');
        for (var i = 0; i < entityOptions.length; i++) {
            if (entityOptions[i].relation == 'hasMany') {
                var tmpAttr = {
                    options: [{property: 'entity', value: entityOptions[i].as}],
                    id_project: attr.id_project,
                    id_application: attr.id_application,
                    id_module: attr.id_module,
                    id_data_entity: entityId
                }
                promises.push(new Promise(function(resolve, reject){
                    (function(tmpAttrIn){
                        deleteTab(tmpAttrIn, function() {
                            resolve();
                        })
                    })(tmpAttr);
                }));
            }
        }

        fs.readdirSync(workspacePath+'/models/options/').filter(function(file){
            return file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file.slice(0, -5) != name_data_entity;
        }).forEach(function(file) {
            var source = file.slice(0,-5);
            var options = require(workspacePath+'/models/options/'+file);
            for (var i = 0; i < options.length; i++){
                if (options[i].target != name_data_entity)
                    continue;
                if (options[i].relation == 'hasMany') {
                    var tmpAttr = {
                        options: [{property: 'entity', value: options[i].as}],
                        id_project: attr.id_project,
                        id_application: attr.id_application,
                        id_module: attr.id_module
                    }
                    promises.push(new Promise(function(resolve, reject){
                        (function(tmpAttrIn) {
                            api_data_entity.getIdDataEntityByName(source, function(err, sourceID) {
                                tmpAttrIn.id_data_entity = sourceID;
                                deleteTab(tmpAttrIn, function(){
                                    resolve();
                                });
                            });
                        })(tmpAttr)
                    }));
                }
                else if (options[i].relation == 'belongsTo') {
                    var tmpAttr = {
                        options: [{property: 'entity', value: options[i].as}],
                        id_project: attr.id_project,
                        id_application: attr.id_application,
                        id_module: attr.id_module
                    }
                    promises.push(new Promise(function(resolve, reject){
                        (function(tmpAttrIn) {
                            api_data_entity.getIdDataEntityByName(source, function(err, sourceID) {
                                tmpAttrIn.id_data_entity = sourceID;
                                deleteDataField(tmpAttrIn, function(){
                                    resolve();
                                });
                            });
                        })(tmpAttr)
                    }));
                }
            }
        });

        Promise.all(promises).then(function() {
            api_data_entity.getModuleNameByEntityName(name_data_entity, function(err, name_module) {
                if (err)
                    return callback(err, null);
                database.dropDataEntity(id_application, name_data_entity, function(err) {
                    if (err)
                        return callback(err);
                    attr.name_data_entity = name_data_entity;
                    api_data_entity.deleteDataEntity(attr, function(err) {
                        if (err)
                            return callback(err);
                        structure_data_entity.deleteDataEntity(id_application, name_module, name_data_entity, function() {
                            callback(null, {message: "Data Entity deleted"});
                        });
                    });
                });
            });
        });
    })
}
exports.deleteDataEntity = deleteDataEntity;

/* --------------------------------------------------------------- */
/* ------------------------- DataField -------------------------- */
/* --------------------------------------------------------------- */
exports.createNewDataField = function(attr, callback) {
    api_data_field.createNewDataField(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {

            // Get active application module name
            api_module.getNameModuleById(attr['id_module'], function(err, name_module) {
                if (err) {
                    callback(err, null);
                } else {
                    json = {
                        "property": "name_module",
                        "value": name_module
                    };
                    attr['options'].push(json);

                    // Get active data entity name
                    api_data_entity.getNameDataEntityById(attr['id_data_entity'], function(err, name_data_entity) {
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

function deleteTab(attr, callback) {
    api_data_entity.getNameDataEntityById(attr.id_data_entity, function(err, name_data_entity) {
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

                api_data_field.deleteDataField(attr, function(err, info) {
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
    api_data_entity.getNameDataEntityById(attr.id_data_entity, function(err, name_data_entity) {
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

                    console.log("START - api_data_field.deleteDataField");

                    // Delete record from software
                    api_data_field.deleteDataField(attr, function(err, info) {
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
    api_data_field.listDataField(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, info);
        }
    });
}

exports.setRequiredAttribute = function(attr, callback) {
    api_data_entity.getNameDataEntityById(attr.id_data_entity, function(err, entityName) {
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
    api_data_entity.getNameDataEntityById(attr.id_data_entity, function(err, entityName) {
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
    api_data_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            // Ajout de l'entité source dans la BDD Newmips
            api_data_entity.createNewDataEntitySource(attr, function(err, created_dataEntity) {
                if (err) {
                    console.log(err);
                    callback(err, null);
                } else {
                    // Ajout de la foreign key dans la BDD Newmips
                    api_data_field.createNewForeignKey(attr, function(err, created_foreignKey){
                        // Récupère le nom du module, necessaire au bon fonctionnement des fichiers structures
                        api_module.getNameModuleById(attr.id_module, function(err, name_module) {
                            attr.name_module = name_module;
                            // Création de l'entité source dans le workspace
                            structure_data_entity.setupDataEntity(attr, function(err, data) {
                                // Créer le lien belongsTo en la source et la target
                                structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsTo", null, function(){
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
    api_data_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            // Ajout de l'entité source dans la BDD Newmips
            api_data_entity.createNewDataEntitySource(attr, function(err, created_dataEntity) {
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
                    api_data_field.createNewForeignKey(reversedAttr, function(err, created_foreignKey){
                        // Récupère le nom du module, necessaire au bon fonctionnement des fichiers structures
                        api_module.getNameModuleById(attr.id_module, function(err, name_module) {
                            attr.name_module = name_module;
                            // Création de l'entité source dans le workspace
                            structure_data_entity.setupDataEntity(attr, function(err, data) {
                                // Créer le lien belongsTo en la source et la target
                                structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "hasMany", null, function(){
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
        api_data_field.createNewForeignKey(attr, function(err, created_foreignKey){
            if(err){
                console.log(err);
                callback(err, null);
            }
            // Créer le lien belongsTo en la source et la target
            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsTo", null, function(){
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
    api_data_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
        if (err) {
            //Si c'est bien l'error de data entity qui n'existe pas
            if(err.level == 0){
                // Si l'entité target n'existe pas, on la crée
                api_data_entity.createNewDataEntityTarget(attr, function(err, created_dataEntity) {
                    // On se dirige en sessions vers l'entité crée
                    //info = created_dataEntity;
                    // Stay on the source entity, even if the target has been created
                    info.insertId = attr.id_data_entity;
                    info.message = "New relation has one / belongs to with subEntity "+created_dataEntity.name+" created.";
                    if (err) {
                        console.log(err);
                        callback(err, null);
                    }

                    api_module.getNameModuleById(attr.id_module, function(err, name_module) {
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

        api_data_field.createNewForeignKey(reversedAttr, function(err, created_foreignKey){
            // Créer le lien belongsTo en la source et la target
            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "hasMany", null, function(){
                // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                structure_data_field.setupHasManyTab(attr, function(err, data){
                    callback(null, info);
                });
            });
        });
    }

    // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
    api_data_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
        // Si l'entité target n'existe pas, on la crée
        if (err) {
            //Si c'est bien l'error de data entity qui n'existe pas
            if(err.level == 0){
                api_data_entity.createNewDataEntityTarget(attr, function(err, created_dataEntity) {
                    // On se dirige en sessions vers l'entité crée
                    //info = created_dataEntity;
                    // Stay on the source entity, even if the target has been created
                    info.insertId = attr.id_data_entity;
                    info.message = "New relation has one / belongs to with "+created_dataEntity.name+" created.";
                    if (err) {
                        console.log(err);
                        callback(err, null);
                    }

                    api_module.getNameModuleById(attr.id_module, function(err, name_module) {
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
    api_data_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {
            // Create the through table name, which must be the same for the two tables
            var through = attr.id_application + "_" + attr.options.source.toLowerCase() + "_" + attr.options.target.toLowerCase();
            // Créer le lien belongsToMany entre la source et la target
            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsToMany", through, function(){
                structure_data_entity.setupAssociation(attr.id_application, attr.options.target, attr.options.source, attr.options.foreignKey, attr.options.as, "belongsToMany", through, function(){
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
    api_data_entity.getNameDataEntityById(attr.id_data_entity, function(err, name_entity_source) {
        attr.options.source = name_entity_source;

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        api_data_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
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

                api_data_field.createNewForeignKey(reversedAttr, function(err, created_foreignKey) {
                    // Créer le lien belongsTo en la source et la target
                    structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "hasMany", null, function() {
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
    api_data_entity.getNameDataEntityById(attr.id_data_entity, function(err, name_entity_source) {
        attr.options.source = name_entity_source;

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        api_data_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
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
                api_data_field.createNewForeignKey(attr, function(err, created_foreignKey) {
                    if (err) {
                        console.log(err);
                        callback(err, null);
                    }
                    // Créer le lien belongsTo en la source et la target dans models/options/source.json
                    structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsTo", null, function() {
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

// Componant that we can add on an entity that let to store local documents
exports.createNewComponentLocalFileStorage = function(attr, callback) {

    // Check if component with this name is already created on this entity
    api_component.getComponentByName(attr, function(err, component){
        if(component){
            err = new Error();
            err.message = "Sorry, a component with this name is already associate to this entity.";
            return callback(err, null);
        }
        else{
            // Check if a table as already the composant name
            api_data_entity.getDataEntityByName(attr, function(err, dataEntity) {
                if(dataEntity){
                    err = new Error();
                    err.message = "Sorry, a table with this component name already exist in this application.";
                    return callback(err, null);
                }
                else{
                    // Create the component in newmips database
                    api_component.createNewComponent(attr, function(err, info){
                        // Get Data Entity Name needed for structure
                        api_data_entity.getNameDataEntityById(attr.id_data_entity, function(err, dataEntityName){
                            attr.options.source = dataEntityName;
                            // setup the hasMany association in the source entity
                            structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.name.toLowerCase(), "id_"+attr.options.source.toLowerCase(), attr.options.name.toLowerCase(), "hasMany", null, function(){
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

return designer;
