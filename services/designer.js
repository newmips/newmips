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

// Bot
var bot = require('../services/bot.js');

// Structure
var structure_application = require("../structure/structure_application");
var structure_module = require("../structure/structure_module");
var structure_data_entity = require("../structure/structure_data_entity");
var structure_data_field = require("../structure/structure_data_field");
var structure_component = require("../structure/structure_component");
var structure_ui = require("../structure/structure_ui");

// Other
var helpers = require("../utils/helpers");
var attrHelper = require("../utils/attr_helper");
var gitHelper = require("../utils/git_helper");

var fs = require('fs-extra');
var sequelize = require('../models/').sequelize;

/* --------------------------------------------------------------- */
/* ------------------------- Function ---------------------------- */
/* --------------------------------------------------------------- */
// Execute an array of instructions
exports.recursiveInstructionExecute = function (sessionAttr, instructions, idx, callback) {
    var exportsContext = this;
    // Create the attr obj
    var recursiveAttr = bot.parse(instructions[idx]);
    // Rework the attr obj
    recursiveAttr = attrHelper.reworkAttr(recursiveAttr);

    // Add current session info in attr object
    recursiveAttr.id_project = sessionAttr.id_project;
    recursiveAttr.id_application = sessionAttr.id_application;
    recursiveAttr.id_module = sessionAttr.id_module;
    recursiveAttr.id_data_entity = sessionAttr.id_data_entity;

    // Execute the designer function
    this[recursiveAttr.function](recursiveAttr, function(err, info) {
        if(err)
            return callback(err, info);

        session.setSessionInAttr(recursiveAttr, info);
        idx += 1;
        if (instructions.length == idx)
            return callback(err, info);
        exportsContext.recursiveInstructionExecute(recursiveAttr, instructions, idx, callback);
    });
}

/* --------------------------------------------------------------- */
/* --------------------------- Help ------------------------------ */
/* --------------------------------------------------------------- */
exports.help = function(attr, callback) {
    session.help(attr, function(err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Session ----------------------------- */
/* --------------------------------------------------------------- */
exports.showSession = function(attr, callback) {
    session.showSession(attr, function(err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Deploy ------------------------------ */
/* --------------------------------------------------------------- */
exports.deploy = function(attr, callback) {
    session.deploy(attr, function(err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Restart ----------------------------- */
/* --------------------------------------------------------------- */
exports.restart = function(attr, callback) {
    var info = {
        message: "structure.global.restart.success"
    };
    callback(null, info);
}

/* --------------------------------------------------------------- */
/* --------------------------- Git ------------------------------- */
/* --------------------------------------------------------------- */

exports.gitPush = function(attr, callback) {
    gitHelper.gitPush(attr, function(err, infoGit){
        if(err)
            return callback(err, null);
        var info = {};
        info.message = "structure.global.gitPush.success";
        callback(null, info);
    });
}

exports.gitPull = function(attr, callback) {
    gitHelper.gitPull(attr, function(err, infoGit){
        if(err)
            return callback(err, null);
        var info = {};
        info.message = "structure.global.gitPull.success";
        callback(null, info);
    });
}

exports.gitCommit = function(attr, callback) {
    gitHelper.gitCommit(attr, function(err, infoGit){
        if(err)
            return callback(err, null);
        var info = {};
        info.message = "structure.global.gitCommit.success";
        callback(null, info);
    });
}

exports.gitStatus = function(attr, callback) {
    gitHelper.gitStatus(attr, function(err, infoGit){
        if(err)
            return callback(err, null);
        var info = {};
        info.message = JSON.stringify(infoGit);
        info.message = info.message.replace(/,/g, ",<br>");
        callback(null, info);
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Project ----------------------------- */
/* --------------------------------------------------------------- */
exports.selectProject = function(attr, callback) {
    db_project.selectProject(attr, function(err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.createNewProject = function(attr, callback) {
    db_project.createNewProject(attr, function(err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.listProject = function(attr, callback) {
    db_project.listProject(attr, function(err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
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
            db_project.deleteProject(attr.options.showValue, function(err, info) {
                if (err)
                    return callback(err, null);

                callback(null, info);
            });
        }).catch(function(err){
            callback(err, null);
        });
    });
}

/* --------------------------------------------------------------- */
/* ----------------------- Application --------------------------- */
/* --------------------------------------------------------------- */
exports.selectApplication = function(attr, callback) {
    var exportsContext = this;
    db_application.selectApplication(attr, function(err, info) {
        if (err) {
            callback(err, null);
        } else {
            var instructions = [
                "select module home"
            ];

            attr.id_application = info.insertId;

            // Select the module home automatically after selecting an application
            exportsContext.recursiveInstructionExecute(attr, instructions, 0, function(err){
                if(err)
                    return callback(err, null);
                info.name_application = attr.options.value;
                callback(null, info);
            });
        }
    });
}

exports.createNewApplication = function(attr, callback) {
    // Check if an application with this name alreadyExist or no
    db_application.exist(attr, function(err, exist){
        if(err)
            return callback(err, null);

        if(exist){
            var error = new Error();
            error.message = "database.application.alreadyExist";
            error.messageParams = [attr.options.showValue];
            return callback(error, null);
        }
        else{
            db_application.createNewApplication(attr, function(err, info) {
                if (err) {
                    callback(err, null);
                } else {
                    // Structure application
                    attr.id_application = info.insertId;
                    info.name_application = attr.options.urlValue;
                    structure_application.setupApplication(attr, function() {
                        callback(null, info);
                    });
                }
            });
        }
    });
}

exports.listApplication = function(attr, callback) {
    db_application.listApplication(attr, function(err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
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
                    /* Calculate the length of table to drop */
                    var resultLength = 0;

                    for (var i=0; i<results.length; i++) {
                        for (var prop in results[i]) {
                            resultLength++;
                        }
                    }

                    /* Function when all query are done */
                    function done(currentCpt){
                        if(currentCpt == resultLength){
                            callback(null, infoDB);
                        }
                    }

                    var cpt = 0;
                    for (var i=0; i<results.length; i++) {
                        for (var prop in results[i]) {
                            // For each request disable foreign key checks, drop table. Foreign key check
                            // last only for the time of the request
                            sequelize.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE "+results[i][prop]+";SET FOREIGN_KEY_CHECKS=1;").then(function(){
                                done(++cpt);
                            });
                        }
                    }
                });
            });
        });
    }
    if (isNaN(attr.options.showValue))
        db_application.getIdApplicationByCodeName(attr.options.value, attr.options.showValue, function(err, id_application){
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

        var attr = {
            options: {
                value: appIds[idx],
                showValue: appIds[idx]
            }
        };

        deleteApplication(attr, function(err, info) {
            if(err)
                return reject(err);
            return (appIds[++idx])?resolve(deleteApplicationRecursive(appIds, idx)):resolve();
        });
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Module ------------------------------ */
/* --------------------------------------------------------------- */
exports.selectModule = function(attr, callback) {
    db_module.selectModule(attr, function(err, infoDB) {
        if (err)
            return callback(err, null);
        callback(null, infoDB);
    });
}

exports.createNewModule = function(attr, callback) {
    db_module.createNewModule(attr, function(err, infoDB) {
        if (err)
            return callback(err, null);
        infoDB.moduleName = attr.options.urlValue;
        // Retrieve list of application modules to update them all
        db_module.listModuleByApplication(attr, function(err, modules) {
            if (err)
                return callback(err, null);

            // Assign list of existing application modules
            // Needed to recreate the dropdown list of modules in the interface
            attr.modules = modules;

            // Structure
            structure_module.setupModule(attr, function(err, data) {
                callback(null, infoDB);
            });
        });
    });
}

exports.listModule = function(attr, callback) {
    db_module.listModule(attr, function(err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.deleteModule = function(attr, callback) {
    var moduleName = attr.options.showValue;
    if (moduleName.toLowerCase() == 'home'){
        var err = new Error();
        err.message = "structure.module.error.notHome";
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
                    value: entities[i].codeName,
                    showValue: entities[i].name
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
                db_module.deleteModule(attr.id_application, attr.module_name, moduleName, function(err, info) {
                    if(err)
                        return callback(err, null);

                    db_module.getHomeModuleId(attr.id_application, function(err, homeID){
                        info.homeID = homeID;
                        callback(null, info);
                    });
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
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

function deleteDataEntity(attr, callback) {

    function checkIfIDGiven(attr, callback){
        // If it was the ID instead of the name given in the instruction
        if(!isNaN(attr.options.showValue)){
            db_entity.getDataEntityById(attr.options.showValue, function(err, entity){
                if (err)
                    return callback(err, null);

                attr.options.value = entity.codeName;
                attr.options.showValue = entity.name;
                attr.options.urlValue = entity.codeName.substring(2);
                callback(null, attr);
            });
        } else{
            callback(null, attr);
        }
    }

    checkIfIDGiven(attr, function(err, attr){
        if (err)
            return callback(err, null);

        var id_application = attr.id_application;
        var name_data_entity = attr.options.value.toLowerCase();
        var show_name_data_entity = attr.options.showValue.toLowerCase();

        var name_module = "";

        var promises = [];
        var workspacePath = __dirname+'/../workspace/'+id_application;

        db_entity.getIdDataEntityByCodeName(attr.id_module, name_data_entity, function(err, entityId){
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
                                    db_entity.getIdDataEntityByCodeName(attr.id_module, source, function(err, sourceID) {
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
                                    db_entity.getIdDataEntityByCodeName(attr.id_module, source, function(err, sourceID) {
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

                attr.entityTarget = name_data_entity.substring(2);
                deleteEntityWidgets(attr, function(err) {
                    if (err)
                        return callback(err);

                    Promise.all(promises).then(function() {
                        db_entity.getModuleCodeNameByEntityCodeName(name_data_entity, function(err, name_module) {
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
                });
            }
        });
    });
}
exports.deleteDataEntity = deleteDataEntity;

/* --------------------------------------------------------------- */
/* --------------------------- Field ----------------------------- */
/* --------------------------------------------------------------- */
exports.createNewDataField = function(attr, callback) {
    // Get active data entity name
    db_entity.getDataEntityById(attr.id_data_entity, function(err, data_entity) {
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

                            attr.name_data_entity = data_entity.name;
                            attr.codeName_data_entity = data_entity.codeName;
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
    var infoDesigner = {};
    db_entity.getDataEntityById(attr.id_data_entity, function(err, dataEntity) {
        if (err)
            return callback(err, infoDesigner);

        attr.name_data_entity = dataEntity.codeName;
        attr.show_name_data_entity = dataEntity.name;
        structure_data_field.deleteTab(attr, function(err, fk, target, tabType) {
            if (err)
                return callback(err, infoDesigner);
            infoDesigner.tabType = tabType;

            attr.fieldToDrop = fk;
            attr.name_data_entity = target;
            database.dropFKDataField(attr, function(err, infoDatabase){
                if (err)
                    return callback(err, infoDesigner);

                // Missing id_ in attr.options.value, so we use fieldToDrop
                attr.options.value = attr.fieldToDrop;
                db_field.deleteDataField(attr, function(err, infoDB) {
                    if (err)
                        return callback(err, infoDesigner);

                    infoDesigner.message = "Tab "+attr.options.showValue+" deleted.";
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
    db_entity.getDataEntityById(attr.id_data_entity, function(err, dataEntity) {
        if (err)
            return callback(err, null);

        // Set name of data entity in attributes
        attr.name_data_entity = dataEntity.codeName;
        attr.show_name_data_entity = dataEntity.name;

        // Get field name
        var options = attr.options;
        var name_data_field = options.value;

        try {
            function checkIfIDGiven(attr, callback2){
                // If it was the ID instead of the name given in the instruction
                if(!isNaN(attr.options.showValue)){
                    db_field.getNameDataFieldById(parseInt(attr.options.showValue), function(err, field){
                        if (err)
                            return callback2(err, null);

                        attr.options.value = field.codeName;
                        attr.options.showValue = field.name;
                        callback2(null, attr);
                    });
                }
                else
                    callback2(null, attr);
            }

            checkIfIDGiven(attr, function(err, attr){
                if (err)
                    return callback(err);
                // Delete field from views and models
                structure_data_field.deleteDataField(attr, function(err, infoStructure) {
                    if (err)
                        return callback(err, null);

                    // Alter database
                    attr.fieldToDrop = infoStructure.fieldToDrop;
                    var dropFunction = infoStructure.isConstraint?'dropFKDataField':'dropDataField';
                    database[dropFunction](attr, function(err, info) {
                        if (err)
                            return callback(err, null);

                        // Missing id_ in attr.options.value, so we use fieldToDrop
                        attr.options.value = attr.fieldToDrop;
                        // Delete record from software
                        db_field.deleteDataField(attr, function(err, infoDB) {
                            if (err)
                                return callback(err, null);

                            callback(null, infoDB);
                        });
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
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

/* --------------------------------------------------------------- */
/* ---------------------- Field Attributes ----------------------- */
/* --------------------------------------------------------------- */

exports.setFieldAttribute = function(attr, callback) {
    db_entity.getDataEntityById(attr.id_data_entity, function(err, dataEntity) {
        if (err)
            return callback(err, null);

        attr.name_data_entity = dataEntity.codeName;

        var wordParam = attr.options.word.toLowerCase();
        var requiredAttribute = ["mandatory", "required", "obligatoire", "optionnel", "non-obligatoire", "optional"];
        var uniqueAttribute = ["unique", "not-unique", "non-unique"];

        if(requiredAttribute.indexOf(wordParam) != -1){
            structure_data_field.setRequiredAttribute(attr, function(err) {
                if (err)
                    return callback(err, null);

                callback(null, {
                    message: "structure.field.attributes.success",
                    messageParams: [attr.options.showValue, attr.options.word]
                });
            });
        }
        else if(uniqueAttribute.indexOf(wordParam) != -1){

            var sourceEntity = attr.id_application+"_"+attr.name_data_entity;
            var constraintName = attr.id_application+"_"+attr.name_data_entity+"_"+attr.options.value+"_unique";

            var possibilityUnique = ["unique"];
            var possibilityNotUnique = ["not-unique", "non-unique"];

            var attribute = attr.options.word.toLowerCase();
            var request = "";

            // Add or remove the unique constraint ?
            if (possibilityUnique.indexOf(attribute) != -1) {
                request = "ALTER TABLE `"+sourceEntity+"` ADD CONSTRAINT "+constraintName+" UNIQUE (`" + attr.options.value + "`);";
            } else if (possibilityNotUnique.indexOf(attribute) != -1) {
                request = "ALTER TABLE `"+sourceEntity+"` DROP INDEX `" + constraintName + "`;";
            }

            sequelize.query(request).then(function(){
                structure_data_field.setUniqueField(attr, function(err) {
                    if (err)
                        return callback(err, null);

                    callback(null, {
                        message: "structure.field.attributes.success",
                        messageParams: [attr.options.showValue, attr.options.word]
                    });
                });
            }).catch(function(err){
                if(typeof err.parent !== "undefined" && err.parent.errno == 1062){
                    var err = new Error();
                    err.message = "structure.field.attributes.duplicateUnique";
                }
                callback(err, null);
            });
        }
        else{
            var err = new Error();
            err.message = "structure.field.attributes.notUnderstandGiveAvailable";
            var msgParams = "";
            for(var i=0; i<requiredAttribute.length; i++){
                msgParams += "-  " + requiredAttribute[i] + "<br>";
            }
            for(var j=0; j<uniqueAttribute.length; j++){
                msgParams += "-  " + uniqueAttribute[j] + "<br>";
            }
            err.messageParams = [msgParams];
            callback(err, null);
        }
    });
}

/* --------------------------------------------------------------- */
/* -------------------------- Datalist --------------------------- */
/* --------------------------------------------------------------- */

exports.setColumnVisibility = function(attr, callback) {

    db_entity.getDataEntityById(attr.id_data_entity, function(err, dataEntity) {
        if (err)
            return callback(err);

        attr.name_data_entity = dataEntity.codeName;
        structure_ui.setColumnVisibility(attr, function(err, infoStructure) {
            if (err)
                return callback(err);

            return callback(null, infoStructure);
        });
    });
}

/* --------------------------------------------------------------- */
/* -------------------- ASSOCIATION / RELATION ------------------- */
/* --------------------------------------------------------------- */

// Create a tab with an add button to create one new object associated to source entity
exports.createNewHasOne = function(attr, callback) {

    /* Check if entity source exist before doing anything */
    db_entity.getIdDataEntityByCodeName(attr.id_module, attr.options.source, function(err, IDdataEntitySource) {
        if (err) {
            return callback(err, null);
        }

        var info = {};
        var toSync = true;
        function structureCreation(attr, callback){

            // Vérification si une relation existe déjà de la source VERS la target
            var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.source.toLowerCase()+'.json');
            var optionsSourceObject = JSON.parse(optionsSourceFile);

            for (var i = 0; i < optionsSourceObject.length; i++) {
                if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()){
                    if(optionsSourceObject[i].relation == "hasMany"){
                        var err = new Error();
                        err.message = "structure.association.error.alreadyHasMany";
                        return callback(err, null);
                    }
                    else if(attr.options.as == optionsSourceObject[i].as){
                        var err = new Error();
                        err.message = "structure.association.error.alreadySameAlias";
                        return callback(err, null);
                    }
                }
            }

            // Vérification si une relation existe déjà de la target VERS la source
            var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
            var targetOptionsObject = JSON.parse(optionsFile);
            for(var i=0; i<targetOptionsObject.length; i++){
                if(targetOptionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && targetOptionsObject[i].relation != "hasMany"){
                    var err = new Error();
                    err.message = "structure.association.error.circularBelongsTo";
                    return callback(err, null);
                } else if(attr.options.source.toLowerCase() != attr.options.target.toLowerCase()
                    && (targetOptionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && targetOptionsObject[i].relation == "hasMany")
                    && (targetOptionsObject[i].foreignKey == attr.options.foreignKey)){
                    // We avoid the toSync to append because the already existing has many relation has already created the foreing key in BDD
                    toSync = false;
                }
            }

            // For the newmips generator BDD, needed for db_field.createNewForeignKey
            attr.id_data_entity = IDdataEntitySource;

            // Ajout de la foreign key dans la BDD Newmips
            db_field.createNewForeignKey(attr, function(err, created_foreignKey){
                if(err){
                    return callback(err, null);
                }
                // Créer le lien belongsTo en la source et la target
                structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsTo", null, toSync, function(){
                    // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                    structure_data_field.setupHasOneTab(attr, function(err, data){
                        if(err)
                            return callback(err, null);
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
                        if(err){
                            return callback(err, null);
                        }

                        // On se dirige en sessions vers l'entité crée
                        //info = created_dataEntity;
                        // Stay on the source entity, even if the target has been created
                        info.insertId = attr.id_data_entity;
                        info.message = "structure.association.hasOne.successSubEntity";
                        info.messageParams = [attr.options.showAs, attr.options.showSource, attr.options.showSource, attr.options.showAs];

                        db_module.getModuleById(attr.id_module, function(err, module) {
                            if(err){
                                return callback(err, null);
                            }
                            attr.show_name_module = module.name;
                            attr.name_module = module.codeName;

                            // Création de l'entité target dans le workspace
                            structure_data_entity.setupDataEntity(attr, function(err, data) {
                                if(err){
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
                // KEEP - Select the target if it already exist
                //info.insertId = dataEntity.id;

                // KEEP - Stay on the source entity
                info.insertId = attr.id_data_entity;
                info.message = "structure.association.hasOne.successEntity";
                info.messageParams = [attr.options.showAs, attr.options.showSource, attr.options.showSource, attr.options.showAs];
                structureCreation(attr, callback);
            }
        });
    });
}

function belongsToMany(attr, setupFunction){
    return new Promise(function(resolve, reject) {
        var through = attr.options.through;
        /* We need the same alias for both relation */
        attr.options.as = "r_"+attr.options.source.substring(2)+ "_" + attr.options.target.substring(2);
        structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsToMany", through, false, function(){
            structure_data_entity.setupAssociation(attr.id_application, attr.options.target, attr.options.source, attr.options.foreignKey, attr.options.as, "belongsToMany", through, false, function(){
                structure_data_field[setupFunction](attr, function(){
                    var reversedAttr = {
                        options: {
                            target: attr.options.source,
                            source: attr.options.target,
                            foreignKey: 'fk_id_'+attr.options.target.substring(2),
                            as: attr.options.as,
                            showTarget: attr.options.showSource,
                            urlTarget: attr.options.urlSource,
                            showSource: attr.options.showTarget,
                            urlSource: attr.options.urlTarget,
                            showAs: attr.options.showSource,
                            urlAs: attr.options.urlAs
                        },
                        id_project: attr.id_project,
                        id_application: attr.id_application,
                        id_module: attr.id_module,
                        id_data_entity: attr.id_data_entity
                    };

                    var functionToDo;
                    if(attr.tabType == "hasmany"){
                        structure_data_field.setupHasManyTab(reversedAttr, function(){
                            resolve();
                        });
                    }
                    else if(attr.tabType == "hasmanypreset"){
                        structure_data_field.setupHasManyPresetTab(reversedAttr, function(){
                            resolve();
                        });
                    } else{
                        reject("Error: unknown tab type.")
                    }
                });
            });
        });
    });
}

// Create a tab with an add button to create multiple new object associated to source entity
exports.createNewHasMany = function (attr, callback) {
    var exportsContext = this;
    /* Check if entity source exist before doing anything */
    db_entity.getIdDataEntityByCodeNameWithoutModuleCheck(attr.id_module, attr.options.source, function (err, IDdataEntitySource) {
        if (err) {
            return callback(err, null);
        }

        var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.source.toLowerCase()+'.json');
        var optionsSourceObject = JSON.parse(optionsSourceFile);

        // Vérification si une relation existe déjà de la source VERS la target
        for (var i = 0; i < optionsSourceObject.length; i++) {
            if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()){
                if(optionsSourceObject[i].relation == "belongsTo"){
                    var err = new Error();
                    err.message = "structure.association.error.alreadyHasOne";
                    return callback(err, null);
                }
                else if(attr.options.as == optionsSourceObject[i].as){
                    var err = new Error();
                    err.message = "structure.association.error.alreadySameAlias";
                    return callback(err, null);
                }
            }
        }

        var info = {};
        var toSync = true;
        var optionsObject;
        function structureCreation(attr, callback){
            var doingBelongsToMany = false;
            // Vérification si une relation existe déjà de la target VERS la source
            for(var i=0; i<optionsObject.length; i++){
                if(optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo"){
                    doingBelongsToMany = true;
                    attr.options.through = attr.id_application + "_" + attr.options.source + "_" + attr.options.target;
                    (function(ibis) {
                        /* First we have to save the already existing data to put them in the new relation */
                        db_entity.retrieveWorkspaceHasManyData(attr.id_application, attr.options.source, optionsObject[ibis].foreignKey, function(data, err){
                            if(err && err.code != "ER_NO_SUCH_TABLE")
                                return callback(err, null);
                            structure_data_field.saveHasManyData(attr, data, optionsObject[ibis].foreignKey, function(data, err){
                                /* Secondly we have to remove the already existing has many to create the belongs to many relation */
                                var instructions = [
                                    "select entity "+attr.options.showTarget,
                                    "delete tab "+optionsObject[ibis].as.substring(2)
                                ];

                                // Start doing necessary instruction for component creation
                                exportsContext.recursiveInstructionExecute(attr, instructions, 0, function(err, infoInstruction){
                                    if(err){
                                        console.log(err);
                                        console.log("Maybe we have to destroy a select mutliple");
                                    }
                                    attr.tabType = infoInstruction.tabType;
                                    /* Then lets create the belongs to many association */
                                    belongsToMany(attr, "setupHasManyTab").then(function(){
                                        callback(null, info);
                                    }).catch(function(err){
                                        console.log(err);
                                        return callback(err, null);
                                    });
                                });
                            });
                        });
                    })(i);
                } else if(attr.options.source.toLowerCase() != attr.options.target.toLowerCase()
                    && (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation == "belongsTo")
                    && (optionsObject[i].foreignKey == attr.options.foreignKey)) {
                    // We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
                    toSync = false;
                }
            }

            // If there is a circular has many we have to convert it to a belongsToMany assocation, so we stop the code here.
            // If not we continue doing a simple has many association.
            if(!doingBelongsToMany){
                var reversedAttr = {
                    options: {
                        source: attr.options.target,
                        showSource: attr.options.showTarget,
                        urlSource: attr.options.urlTarget,
                        target: attr.options.source,
                        showTarget: attr.options.showSource,
                        urlTarget: attr.options.urlSource
                    },
                    id_module: attr.id_module,
                    id_application: attr.id_application
                };

                db_field.createNewForeignKey(reversedAttr, function(err, created_foreignKey){
                    // Créer le lien hasMany en la source et la target
                    structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "hasMany", null, toSync, function(){
                        // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                        structure_data_field.setupHasManyTab(attr, function(){
                            callback(null, info);
                        });
                    });
                });
            }
        }

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectDataEntityTarget(attr, function (err, dataEntity) {
            // Si l'entité target n'existe pas, on la crée
            if (err) {
                //Si c'est bien l'error de data entity qui n'existe pas
                if (err.level == 0) {
                    db_entity.createNewDataEntityTarget(attr, function (err, created_dataEntity) {
                        if (err) {
                            return callback(err, null);
                        }
                        // KEEP - On se dirige en sessions vers l'entité crée
                        //info = created_dataEntity;

                        // KEEP - Stay on the source entity, even if the target has been created
                        info.insertId = attr.id_data_entity;

                        info.message = "structure.association.hasMany.successSubEntity";
                        info.messageParams = [attr.options.showAs, attr.options.showSource, attr.options.showSource, attr.options.showAs];

                        db_module.getModuleById(attr.id_module, function (err, module) {
                            if (err) {
                                return callback(err, null);
                            }
                            attr.show_name_module = module.name;
                            attr.name_module = module.codeName;

                            // Création de l'entité target dans le workspace
                            structure_data_entity.setupDataEntity(attr, function (err, data) {
                                if (err) {
                                    return callback(err, null);
                                }
                                var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
                                optionsObject = JSON.parse(optionsFile);
                                structureCreation(attr, callback);
                            });
                        });
                    });
                } else {
                    callback(err, null);
                }
            } else {
                // KEEP - Select the target if it already exist
                //info.insertId = dataEntity.id;
                var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
                optionsObject = JSON.parse(optionsFile);

                var cptExistingHasMany = 0;

                // Check if there is no or just one belongsToMany to do
                for(var i=0; i<optionsObject.length; i++){
                    if(optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo"){
                        if(optionsObject[i].relation == "belongsToMany"){
                            var err = new Error();
                            err.message = "structure.association.error.alreadyBelongsToMany";
                            return callback(err, null);
                        } else{
                            cptExistingHasMany++;
                        }
                    }
                }
                /* If there are multiple has many association from target to source we can't handle on which one we gonna link the belongsToMany association */
                if(cptExistingHasMany > 1){
                    var err = new Error();
                    err.message = "structure.association.error.tooMuchHasMany";
                    return callback(err, null);
                }
                // KEEP - Stay on the source entity
                info.insertId = attr.id_data_entity;

                info.message = "structure.association.hasMany.successEntity";
                info.messageParams = [attr.options.showAs, attr.options.showSource, attr.options.showSource, attr.options.showAs];
                structureCreation(attr, callback);
            }
        });
    });
}

// Create a tab with a select of existing object and a list associated to it
exports.createNewHasManyPreset = function(attr, callback) {
    var exportsContext = this;
    // Instruction is add fieldset _FOREIGNKEY_ related to _TARGET_ -> We don't know the source entity name
    db_entity.getDataEntityById(attr.id_data_entity, function (err, source_entity) {
        if (err && typeof attr.options.source === "undefined")
            return callback(err, null);

        // With preset instruction with already know the source of the related to
        // "entity (.*) has many preset (.*)"
        if (typeof attr.options.source === "undefined") {
            attr.options.source = source_entity.codeName;
            attr.options.showSource = source_entity.name;
            attr.options.urlSource = attrHelper.removePrefix(source_entity.codeName, "entity");
        }

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectDataEntityTarget(attr, function (err, dataEntity) {
            // Si l'entité target n'existe pas ou autre
            if (err) {
                return callback(err, null);
            } else {

                var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.source.toLowerCase() + '.json');
                var optionsSourceObject = JSON.parse(optionsSourceFile);

                var toSync = true;

                // Vérification si une relation existe déjà de la source VERS la target
                for (var i = 0; i < optionsSourceObject.length; i++) {
                    if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()) {

                        if (optionsSourceObject[i].relation == "belongsTo") {
                            var err = new Error();
                            err.message = "structure.association.error.alreadyHasOne";
                            return callback(err, null);
                        } else if (attr.options.as == optionsSourceObject[i].as) {
                            var err = new Error();
                            err.message = "structure.association.error.alreadySameAlias";
                            return callback(err, null);
                        }
                    }
                }

                var optionsFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
                var optionsObject = JSON.parse(optionsFile);

                var cptExistingHasMany = 0;

                // Check if there is no or just one belongsToMany to do
                for(var i=0; i<optionsObject.length; i++){
                    if(optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo"){
                        if(optionsObject[i].relation == "belongsToMany"){
                            var err = new Error();
                            err.message = "structure.association.error.alreadyBelongsToMany";
                            return callback(err, null);
                        } else{
                            cptExistingHasMany++;
                        }
                    }
                }
                /* If there are multiple has many association from target to source we can't handle on which one we gonna link the belongsToMany association */
                if(cptExistingHasMany > 1){
                    var err = new Error();
                    err.message = "structure.association.error.tooMuchHasMany";
                    return callback(err, null);
                }

                var doingBelongsToMany = false;

                // Vérification si une relation existe déjà de la target VERS la source
                for (var i = 0; i < optionsObject.length; i++) {
                    if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo") {
                        doingBelongsToMany = true;
                        attr.options.through = attr.id_application + "_" + attr.options.source + "_" + attr.options.target;
                        (function(ibis) {
                            /* First we have to save the already existing data to put them in the new relation */
                            db_entity.retrieveWorkspaceHasManyData(attr.id_application, attr.options.source, optionsObject[ibis].foreignKey, function(data, err){
                                if(err && err.code != "ER_NO_SUCH_TABLE")
                                    return callback(err, null);
                                structure_data_field.saveHasManyData(attr, data, optionsObject[ibis].foreignKey, function(data, err){
                                    /* Secondly we have to remove the already existing has many to create the belongs to many relation */
                                    var instructions = [
                                        "select entity "+attr.options.showTarget,
                                        "delete tab "+optionsObject[ibis].as.substring(2)
                                    ];

                                    // Start doing necessary instruction for component creation
                                    exportsContext.recursiveInstructionExecute(attr, instructions, 0, function(err, infoInstruction){
                                        if(err){
                                            console.log(err);
                                            console.log("Maybe we have to destroy a select mutliple");
                                        }
                                        attr.tabType = infoInstruction.tabType;
                                        /* Then lets create the belongs to many association */
                                        belongsToMany(attr, "setupHasManyPresetTab").then(function(){
                                            var info = {};
                                            info.insertId = attr.id_data_entity;
                                            info.message = "structure.association.hasManyExisting.success";
                                            info.messageParams = [attr.options.showTarget, attr.options.showSource];
                                            callback(null, info);
                                        }).catch(function(err){
                                            console.log(err);
                                            return callback(err, null);
                                        });
                                    });
                                });
                            });
                        })(i);
                    } else if(attr.options.source.toLowerCase() != attr.options.target.toLowerCase()
                        && (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation == "belongsTo")
                        && (optionsObject[i].foreignKey == attr.options.foreignKey)) {
                        // We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
                        toSync = false;
                    }
                }

                // If there is a circular has many we have to convert it to a belongsToMany assocation, so we stop the code here.
                // If not we continue doing a simple has many association.
                if(!doingBelongsToMany){
                    var reversedAttr = {
                        options: {
                            source: attr.options.target,
                            showSource: attr.options.showTarget,
                            target: attr.options.source,
                            showTarget: attr.options.showSource,
                            foreignKey: attr.options.foreignKey,
                            showForeignKey: attr.options.showForeignKey
                        },
                        id_data_entity: attr.id_data_entity,
                        id_module: attr.id_module,
                        id_application: attr.id_application
                    };

                    db_field.createNewForeignKey(reversedAttr, function (err, created_foreignKey) {
                        if (err) {
                            return callback(err, null);
                        }

                        // Right now we have id_TARGET_as and we want id_SOURCE_as
                        var newForeignKey = "fk_id_" + attr.options.urlSource + "_" + attr.options.as.toLowerCase().substring(2);
                        newForeignKey = newForeignKey.toLowerCase();

                        // Créer le lien belongsTo en la source et la target
                        structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, newForeignKey, attr.options.as, "hasMany", null, toSync, function () {
                            // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                            structure_data_field.setupHasManyPresetTab(attr, function() {

                                var info = {};
                                info.insertId = attr.id_data_entity;
                                info.message = "structure.association.hasManyExisting.success";
                                info.messageParams = [attr.options.showTarget, attr.options.showSource];
                                callback(null, info);
                            });
                        });
                    });
                }
            }
        });
    });
}

// Create a field in create/show/update related to target entity
exports.createNewFieldRelatedTo = function (attr, callback) {
    // Instruction is add field _FOREIGNKEY_ related to _TARGET_ -> We don't know the source entity name
    db_entity.getDataEntityById(attr.id_data_entity, function (err, source_entity) {
        if (err && typeof attr.options.source === "undefined")
            return callback(err, null);

        // With preset instruction with already know the source of the related to
        // "entity (.*) has one preset (.*) called (.*) using (.*)"
        if (typeof attr.options.source === "undefined") {
            attr.options.source = source_entity.codeName;
            attr.options.showSource = source_entity.name;
            attr.options.urlSource = attrHelper.removePrefix(source_entity.codeName, "entity");
        }

        var allUsingExist = true;

        // If a using field or fields has been asked, we have to check if those fields exist in the entity
        if(typeof attr.options.usingField !== "undefined"){
            var attributesPath = __dirname + '/../workspace/' + attr.id_application + '/models/attributes/' + attr.options.target.toLowerCase()
            delete require.cache[require.resolve(attributesPath)];
            var attributeTarget = require(attributesPath);
            for(var i=0; i<attr.options.usingField.length; i++){
                if (typeof attributeTarget[attr.options.usingField[i]] === "undefined") {
                    allUsingExist = false;
                    var missingField = attr.options.showUsingField[i];
                } else{
                    attr.options.usingField[i] = {
                        value: attr.options.usingField[i],
                        type: attributeTarget[attr.options.usingField[i]].newmipsType
                    }
                }
            }
        }

        // If a asked using field doesn't exist in the target entity we send an error
        if (!allUsingExist) {
            var err = new Error();
            err.message = "structure.association.relatedTo.missingField";
            err.messageParams = [missingField, attr.options.showTarget];
            return callback(err, null);
        }


        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectDataEntityTarget(attr, function (err, dataEntity) {
            // If target entity doesn't exists, send error
            if (err)
                return callback(err, null);

            // Check if an association already exists from source to target
            var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.source.toLowerCase() + '.json');
            var optionsSourceObject = JSON.parse(optionsSourceFile);

            var toSync = true;

            for (var i = 0; i < optionsSourceObject.length; i++) {
                if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()) {
                    if (optionsSourceObject[i].relation == "hasMany") {
                        var err = new Error();
                        err.message = "structure.association.error.alreadyHasMany";
                        return callback(err, null);
                    } else if (attr.options.as == optionsSourceObject[i].as) {
                        var err = new Error();
                        err.message = "structure.association.error.alreadySameAlias";
                        return callback(err, null);
                    }
                }
            }

            // Check if an association already exists from target to source
            var optionsFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
            var optionsObject = JSON.parse(optionsFile);
            for (var i = 0; i < optionsObject.length; i++) {
                if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "hasMany") {
                    var err = new Error();
                    err.message = "structure.association.error.circularBelongsTo";
                    return callback(err, null);
                } else if(attr.options.source.toLowerCase() != attr.options.target.toLowerCase()
                    && (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation == "hasMany")
                    && (optionsObject[i].foreignKey == attr.options.foreignKey)){
                    // We avoid the toSync to append because the already existing has many relation has already created the foreign key in BDD
                    toSync = false;
                }
            }

            // Add foreign key to newmips's DB
            db_field.createNewForeignKey(attr, function (err, created_foreignKey) {
                if (err)
                    return callback(err, null);
                // Créer le lien belongsTo en la source et la target dans models/options/source.json
                structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "belongsTo", null, true, function () {
                    // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                    structure_data_field.setupRelatedToField(attr, function (err, data) {
                        if (err)
                            return callback(err, null);
                        // Stay on the source entity in session
                        var info = {};
                        info.insertId = attr.id_data_entity;
                        info.message = "structure.association.relatedTo.success";
                        info.messageParams = [attr.options.showAs, attr.options.showTarget];
                        callback(null, info);
                    });
                });
            });
        });
    });
}

// Select multiple in create/show/update related to target entity
exports.createNewFieldRelatedToMultiple = function(attr, callback) {
    // Instruction is add field _FOREIGNKEY_ related to multiple _TARGET_ -> We don't know the source entity name so we have to find it
    db_entity.getDataEntityById(attr.id_data_entity, function(err, source_entity) {
        if(err && typeof attr.options.source === "undefined")
            return callback(err, null);

        // With preset instruction with already know the source of the related to
        // "entity (.*) has one preset (.*) called (.*) using (.*)"
        if(typeof attr.options.source === "undefined"){
            attr.options.source = source_entity.codeName;
            attr.options.showSource = source_entity.name;
            attr.options.urlSource = attrHelper.removePrefix(source_entity.codeName, "entity");
        }

        // Now we know the source entity, so we can generate the foreign key
        attr.options.foreignKey = "fk_id_"+attr.options.urlSource+"_"+attr.options.as.toLowerCase().substring(2);

        var allUsingExist = true;

        // If a using field or fields has been asked, we have to check if those fields exist in the entity
        if(typeof attr.options.usingField !== "undefined"){
            var attributesPath = __dirname + '/../workspace/' + attr.id_application + '/models/attributes/' + attr.options.target.toLowerCase()
            delete require.cache[require.resolve(attributesPath)];
            var attributeTarget = require(attributesPath);
            for(var i=0; i<attr.options.usingField.length; i++){
                if (typeof attributeTarget[attr.options.usingField[i]] === "undefined") {
                    allUsingExist = false;
                    var missingField = attr.options.showUsingField[i];
                } else{
                    attr.options.usingField[i] = {
                        value: attr.options.usingField[i],
                        type: attributeTarget[attr.options.usingField[i]].newmipsType
                    }
                }
            }
        }

        // If a asked using field doesn't exist in the target entity we send an error
        if (!allUsingExist) {
            var err = new Error();
            err.message = "structure.association.relatedTo.missingField";
            err.messageParams = [missingField, attr.options.showTarget];
            return callback(err, null);
        }


        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectDataEntityTarget(attr, function(err, dataEntity) {
            // If target entity doesn't exists, send error
            if (err)
                return callback(err, null);

            // Check if an association already exists from source to target
            var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.source.toLowerCase()+'.json');
            var optionsSourceObject = JSON.parse(optionsSourceFile);

            var toSync = true;

            for (var i=0; i < optionsSourceObject.length; i++) {
                if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()) {
                    if (attr.options.as == optionsSourceObject[i].as) {
                        var err = new Error();
                        err.message = "structure.association.error.alreadySameAlias";
                        return callback(err, null);
                    }
                }
            }

            // Check if an association already exists from target to source
            var optionsFile = helpers.readFileSyncWithCatch('./workspace/'+attr.id_application+'/models/options/'+attr.options.target.toLowerCase()+'.json');
            var optionsObject = JSON.parse(optionsFile);
            for (var i=0; i < optionsObject.length; i++) {
                if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo"){
                    // TODO - belongsToMany
                    console.log("TODO - BelongsToMany");
                    var err = new Error();
                    err.message = "structure.association.error.circularHasMany";
                    return callback(err, null);
                } else if(attr.options.source.toLowerCase() != attr.options.target.toLowerCase()
                    && (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation == "belongsTo")
                    && (optionsObject[i].foreignKey == attr.options.foreignKey)) {
                    // We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
                    toSync = false;
                }
            }

            var reversedAttr = {
                options: {
                    source: attr.options.target,
                    showSource: attr.options.showTarget,
                    urlSource: attr.options.urlTarget,
                    target: attr.options.source,
                    showTarget: attr.options.showSource,
                    urlTarget: attr.options.urlSource
                },
                id_module: attr.id_module,
                id_application: attr.id_application
            };

            db_field.createNewForeignKey(reversedAttr, function(err, created_foreignKey){
                // Créer le lien hasMany en la source et la target
                structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.target, attr.options.foreignKey, attr.options.as, "hasMany", null, toSync, function(){
                    // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                    structure_data_field.setupRelatedToMultipleField(attr, function(){
                        var info = {};
                        info.message = "structure.association.relatedToMultiple.success";
                        info.messageParams = [attr.options.showAs, attr.options.showTarget, attr.options.showSource];
                        callback(null, info);
                    });
                });
            });
        });
    });
}

/* --------------------------------------------------------------- */
/* -------------------------- COMPONENT -------------------------- */
/* --------------------------------------------------------------- */

// Componant that we can add on an entity to store local documents
exports.createNewComponentLocalFileStorage = function (attr, callback) {

    /* If there is no defined name for the module */
    if(typeof attr.options.value === "undefined"){
        attr.options.value = "c_local_file_storage_"+attr.id_data_entity;
        attr.options.urlValue = "local_file_storage_"+attr.id_data_entity;
        attr.options.showValue = "Local File Storage";
    } else{
        attr.options.value = attr.options.value+"_"+attr.id_data_entity;
        attr.options.urlValue = attr.options.urlValue+"_"+attr.id_data_entity;
    }

    // Check if component with this name is already created on this entity
    db_component.checkIfComponentCodeNameExistOnEntity(attr.options.value, attr.id_module, attr.id_data_entity, function(err, alreadyExist){
        if(err)
            return callback(err, null);
        if(alreadyExist){
            var err = new Error();
            err.message = "structure.component.error.alreadyExistOnEntity";
            return callback(err, null);
        }
        else{
            // Check if a table as already the composant name
            db_entity.getDataEntityByCodeName(attr.id_application, attr.options.value, function(err, dataEntity) {
                if(dataEntity){
                    var err = new Error();
                    err.message = "structure.component.error.alreadyExistInApp";
                    return callback(err, null);
                }
                else{
                    // Get Data Entity Name needed for structure
                    db_entity.getDataEntityById(attr.id_data_entity, function(err, sourceEntity){
                        attr.options.source = sourceEntity.codeName;
                        attr.options.showSource = sourceEntity.name;
                        attr.options.urlSource = attrHelper.removePrefix(sourceEntity.codeName, "entity");
                        // Create the component in newmips database
                        db_component.createNewComponentOnEntity(attr, function(err, info){
                            if(err)
                                return callback(err, null);
                            // Setup the hasMany association in the source entity
                            try{
                                db_entity.createNewDataEntity(attr, function(err, infoDbEntity){
                                    structure_data_entity.setupAssociation(attr.id_application, attr.options.source, attr.options.value.toLowerCase(), "fk_id_"+attr.options.source.toLowerCase(), attr.options.value.toLowerCase(), "hasMany", null, false, function(){
                                        // Get module info needed for structure
                                        db_module.getModuleById(attr.id_module, function(err, module){
                                            if(err)
                                                return callback(err, null);
                                            attr.options.moduleName = module.codeName;
                                            structure_component.newLocalFileStorage(attr, function(err){
                                                if(err)
                                                    return callback(err, null);

                                                callback(null, info);
                                            });
                                        });
                                    });
                                });
                            } catch(err){
                                return callback(err, null);
                            }
                        });
                    });
                }
            });
        }
    });
}

// Componant to create a contact form in a module
exports.createNewComponentContactForm = function (attr, callback) {

    var exportsContext = this;

    /* If there is no defined name for the module */
    if(typeof attr.options.value === "undefined"){
        attr.options.value = "e_contact_form";
        attr.options.urlValue = "contact_form";
        attr.options.showValue = "Contact Form";
    }

    // Check if component with this name is already created on this entity
    db_component.getComponentByCodeNameInModule(attr.id_module, attr.options.value, attr.options.showValue, function(err, component){
        if(component){
            var err = new Error();
            err.message = "structure.component.error.alreadyExistOnModule";
            return callback(err, null);
        }
        else{
            // Check if a table as already the composant name
            db_entity.getDataEntityByCodeName(attr.id_application, attr.options.value, function(err, dataEntity) {
                if(dataEntity){
                    err = new Error();
                    err.message = "structure.component.error.alreadyExistInApp";
                    return callback(err, null);
                } else{

                    attr.options.valueSettings = attr.options.value + "_settings";
                    attr.options.urlValueSettings = attr.options.urlValue + "_settings";
                    attr.options.showValueSettings = attr.options.showValue + " Settings";

                    var instructions = [
                        "add entity "+attr.options.showValue,
                        "add field Name",
                        "set field Name required",
                        "add field Sender with type email",
                        "set field Sender required",
                        "add field Recipient with type email",
                        "add field User related to user using f_login",
                        "add field Title",
                        "set field Title required",
                        "add field Content with type text",
                        "set field Content required",
                        "add entity "+attr.options.showValueSettings,
                        "add field Transport Host",
                        "add field Port with type number",
                        "add field Secure with type boolean and default value true",
                        "add field User",
                        "add field Pass",
                        "add field Form Recipient",
                        "set field Transport Host required",
                        "set field Port required",
                        "set field User required",
                        "set field Pass required",
                        "set field Form Recipient required"
                    ];


                    // Start doing necessary instruction for component creation
                    exportsContext.recursiveInstructionExecute(attr, instructions, 0, function(err){
                        if(err)
                            return callback(err, null);

                        // Create the component in newmips database
                        db_component.createNewComponentOnModule(attr, function(err, info){
                            if(err)
                                return callback(err, null);

                            // Get Data Entity Name needed for structure
                            db_module.getModuleById(attr.id_module, function(err, module){
                                if(err)
                                    return callback(err, null);

                                attr.options.moduleName = module.codeName;
                                structure_component.newContactForm(attr, function(err){
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

// Componant to create an agenda in a module
exports.createNewComponentAgenda = function(attr, callback) {

    var exportsContext = this;

    /* If there is no defined name for the module */
    if(typeof attr.options.value === "undefined"){
        attr.options.value = "c_agenda";
        attr.options.urlValue = "agenda";
        attr.options.showValue = "Agenda";
    }

    // Check if component with this name is already created on this module
    db_component.getComponentByCodeNameInModule(attr.id_module, attr.options.value ,attr.options.showValue, function(err, component){
        if(component){
            var err = new Error();
            err.message = "structure.component.error.alreadyExistOnModule";
            return callback(err, null);
        } else{

            var valueEvent = "e_"+attr.options.urlValue+"_event";
            var valueCategory = "e_"+attr.options.urlValue+"_category";

            var showValueEvent = attr.options.showValue+" Event";
            var showValueCategory = attr.options.showValue+" Category";

            var instructions = [
                "add entity "+showValueCategory,
                "add field Label",
                "add field Color with type color",
                "set field Label required",
                "set field Color required",
                "add entity "+showValueEvent,
                "add field Title",
                "add field Description with type text",
                "add field Place",
                "add field Start date with type datetime",
                "add field End date with type datetime",
                "add field All day with type boolean",
                "add field Category related to "+showValueCategory+" using Label",
                "set field Title required",
                "set field Start date required"
            ];

            // Start doing necessary instruction for component creation
            exportsContext.recursiveInstructionExecute(attr, instructions, 0, function(err){
                if(err)
                    return callback(err, null);

                // Clear toSync.json because all fields will be created with the entity creation
                // var toSyncFileName = './workspace/'+attr.id_application+'/models/toSync.json';
                // var writeStream = fs.createWriteStream(toSyncFileName);
                // var toSyncObject = {};
                // writeStream.write(JSON.stringify(toSyncObject, null, 4));
                // writeStream.end();
                // writeStream.on('finish', function() {
                    // Create the component in newmips database
                    db_component.createNewComponentOnModule(attr, function(err, info){
                        if(err)
                            return callback(err, null);

                        // Link new event entity to component
                        db_entity.addComponentOnEntityByCodeName(valueEvent, info.insertId, attr.id_module, function(err){
                            // Link new category entity to component
                            db_entity.addComponentOnEntityByCodeName(valueCategory, info.insertId, attr.id_module, function(err){
                                // Get Data Entity Name needed for structure
                                db_module.getModuleById(attr.id_module, function(err, module){
                                    if(err)
                                        return callback(err, null);
                                    attr.options.moduleName = module.codeName;

                                    structure_component.newAgenda(attr, function(err){
                                        if(err)
                                            return callback(err, null);

                                        callback(null, info);
                                    });
                                });
                            });
                        });
                    });
                // });
            });
        }
    });
}

// Component to create a C.R.A module
exports.createNewComponentCra = function(attr, callback) {

    var exportsContext = this;

    // Check if component with this name is already created on this module
    db_module.getModuleById(attr.id_module, function(err, module){
        if(err)
            return callback(err, null);

        attr.module = module;
        var instructions = [
            "add entity CRA Team",
            "add field Name",
            "set field Name required",
            "add fieldset Users related to user using login",
            "entity CRA Team has one CRA Calendar Settings",
            "select entity CRA Calendar Settings",
            "add field Monday with type boolean",
            "add field Tuesday with type boolean",
            "add field Wednesday with type boolean",
            "add field Thursday with type boolean",
            "add field Friday with type boolean",
            "add field Saturday with type boolean",
            "add field Sunday with type boolean",
            "entity CRA Team has many CRA Calendar Exception",
            "select entity CRA Calendar Exception",
            "add field Date with type date",
            "add field Label",
            "add entity CRA Activity",
            "add field Name",
            "set field Name required",
            "add field Description with type text",
            "add field Client",
            "add field Active with type boolean",
            "add entity CRA",
            "add field Month with type number",
            "add field Year with type number",
            "add field Open days in month with type number",
            "add field User validated with type boolean",
            "add field Admin validated with type boolean",
            "add field Notification admin with type text",
            "set icon calendar check o",
            "entity user has many CRA",
            "entity CRA has many CRA Task",
            "select entity CRA Task",
            "add field Date with type date",
            "add field Duration with type float",
            "entity CRA Task has one CRA Activity",
            "entity CRA has one user"
        ];

        // Start doing necessary instruction for component creation
        exportsContext.recursiveInstructionExecute(attr, instructions, 0, function(err){
            if(err)
                return callback(err, null);

            // Add fieldset ID in user entity that already exist so toSync doesn't work
            //var request = "ALTER TABLE `"+attr.id_application+"_e_user` ADD `id_e_cra_team_users` INT DEFAULT NULL;";
            //sequelize.query(request).then(function(){
                structure_component.newCra(attr, function(err, infoStructure){
                    if(err)
                        return callback(err, null);
                    callback(null, infoStructure);
                });
            //});
        });
    });
}

// Componant that we can add on an entity to store local documents
exports.createNewComponentPrint = function (attr, callback) {

    /* If there is no defined name for the module */
    if(typeof attr.options.value === "undefined"){
        attr.options.value = "c_print_"+attr.id_data_entity;
        attr.options.urlValue = "print_"+attr.id_data_entity;
        attr.options.showValue = "Print";
    } else{
        attr.options.value = attr.options.value+"_"+attr.id_data_entity;
        attr.options.urlValue = attr.options.urlValue+"_"+attr.id_data_entity;
    }

    // Check if component with this name is already created on this entity
    db_component.checkIfComponentCodeNameExistOnEntity(attr.options.value, attr.id_module, attr.id_data_entity, function(err, alreadyExist){
        if(err)
            return callback(err, null);
        if(alreadyExist){
            var err = new Error();
            err.message = "structure.component.error.alreadyExistOnEntity";
            return callback(err, null);
        }
        else{
            // Get Data Entity Name needed for structure
            db_entity.getDataEntityById(attr.id_data_entity, function(err, sourceEntity){
                attr.options.source = sourceEntity.codeName;
                attr.options.showSource = sourceEntity.name;
                attr.options.urlSource = attrHelper.removePrefix(sourceEntity.codeName, "entity");
                // Create the component in newmips database
                db_component.createNewComponentOnEntity(attr, function(err, info){
                    if(err)
                        return callback(err, null);
                    try{
                       // Get module info needed for structure
                        db_module.getModuleById(attr.id_module, function(err, module){
                            if(err)
                                return callback(err, null);
                            attr.options.moduleName = module.codeName;
                            structure_component.newPrint(attr, function(err){
                                if(err)
                                    return callback(err, null);

                                callback(null, info);
                            });
                        });
                    } catch(err){
                        return callback(err, null);
                    }
                });
            });
        }
    });
}

exports.deleteComponentPrint = function (attr, callback) {

    if(typeof attr.options.value === "undefined"){
        attr.options.value = "c_print_"+attr.id_data_entity;
        attr.options.urlValue = "print_"+attr.id_data_entity;
        attr.options.showValue = "Print";
    } else{
        attr.options.value = attr.options.value+"_"+attr.id_data_entity;
        attr.options.urlValue = attr.options.urlValue+"_"+attr.id_data_entity;
    }

    // Check if component with this name is already created on this entity
    db_component.checkIfComponentCodeNameExistOnEntity(attr.options.value, attr.id_module, attr.id_data_entity, function(err, exist){
        if(err)
            return callback(err, null);
        if(exist){
            // Get Data Entity Name needed for structure
            db_entity.getDataEntityById(attr.id_data_entity, function(err, sourceEntity){
                attr.options.source = sourceEntity.codeName;
                attr.options.showSource = sourceEntity.name;
                attr.options.urlSource = attrHelper.removePrefix(sourceEntity.codeName, "entity");
                structure_component.deletePrint(attr, function(err){
                    if(err)
                        return callback(err, null);
                    db_component.deleteComponentOnEntity(attr.options.value, attr.id_module, sourceEntity.id, function(err, infoDB){
                        if(err){
                            return callback(err, null);
                        }
                        callback(null, infoDB);
                    });
                });
            });
            // Get Data Entity Name needed for structure
            /*db_entity.getDataEntityById(attr.id_data_entity, function(err, sourceEntity){
                attr.options.source = sourceEntity.codeName;
                attr.options.showSource = sourceEntity.name;
                attr.options.urlSource = attrHelper.removePrefix(sourceEntity.codeName, "entity");
                // Create the component in newmips database
                db_component.createNewComponentOnEntity(attr, function(err, info){
                    if(err)
                        return callback(err, null);
                    try{
                       // Get module info needed for structure
                        db_module.getModuleById(attr.id_module, function(err, module){
                            if(err)
                                return callback(err, null);
                            attr.options.moduleName = module.codeName;
                            structure_component.newPrint(attr, function(err){
                                if(err)
                                    return callback(err, null);

                                callback(null, info);
                            });
                        });
                    } catch(err){
                        return callback(err, null);
                    }
                });
            });*/
        }
        else{
            var err = new Error();
            err.message = "structure.component.error.notExisting";
            return callback(err, null);
        }
    });
}

exports.createComponentChat = function(attr, callback) {
    structure_component.setupChat(attr, function(err) {
        if (err)
            return callback(err);
        callback(null, {message: 'structure.component.chat.success'});
    });
}

//Create new component address
exports.createNewComponentAddress = function (attr, callback) {
    var componentCodeName = 'c_address_' + attr.id_data_entity;
    db_component.checkIfComponentCodeNameExistOnEntity(componentCodeName, attr.id_module, attr.id_data_entity, function (err, alreadyExist) {
        if (!err) {
            if (!alreadyExist) {
                db_module.getModuleById(attr.id_module, function (err, module) {
                    if (!err) {
                        db_entity.getDataEntityById(attr.id_data_entity, function (err, entity) {
                            if (!err) {
                                attr.options.value = componentCodeName;
                                attr.options.showValue = attr.options.componentName;
                                db_component.createNewComponentOnEntity(attr, function (err, info) {
                                    if (!err) {
                                        attr.moduleName = module.codeName;
                                        attr.entityName = entity.name;
                                        attr.options.target = componentCodeName;
                                        attr.options.source = entity.codeName;
                                        structure_component.addNewComponentAddress(attr, function (err) {
                                            if (err)
                                                return callback(err);
                                            callback(null, {message: 'database.component.create.success', messageParams: ["Adresse", attr.options.componentName || '']});
                                        });
                                    } else
                                        return callback(err);
                                });
                            } else
                                return callback(err);
                        });
                    } else
                        return callback(err);
                });
            } else {
                var err = new Error();
                err.message = "structure.component.error.alreadyExistOnEntity";
                return callback(err, null);
            }
        } else
            return callback(err);
    });
};

exports.deleteComponentAddress = function (attr, callback) {
    var componentName = 'c_address_' + attr.id_data_entity;
    db_component.checkIfComponentCodeNameExistOnEntity(componentName, attr.id_module, attr.id_data_entity, function (err, componentExist) {
        if (!err) {
            if (componentExist) {
                db_component.deleteComponentOnEntity(componentName, attr.id_module, attr.id_data_entity, function (err, info) {
                    if (!err) {
                        database.dropDataEntity(attr.id_application, componentName, function (err) {
                            db_module.getModuleById(attr.id_module, function (err, module) {
                                if (!err) {
                                    db_entity.getDataEntityById(attr.id_data_entity, function (err, entity) {
                                        if (!err) {
                                            attr.entityName = entity.codeName;
                                            attr.moduleName=module.codeName;
                                            structure_component.deleteComponentAddress(attr, function (err) {
                                                if (err)
                                                    return callback(err);
                                                else
                                                    callback(null, {message: 'database.component.delete.success'});
                                            });
                                        } else
                                            return callback(err);
                                    });
                                } else
                                    return callback(err);
                            });
                        });
                    } else
                        return callback(err);
                });
            } else {
                var err = new Error();
                err.message = "database.component.notFound.notFoundedInModule";
                return callback(err, null);
            }
        } else
            return callback(err);

    });
};

/* --------------------------------------------------------------- */
/* -------------------------- INTERFACE -------------------------- */
/* --------------------------------------------------------------- */
// Set adminLTE skin
exports.setSkin = function(attr, callback) {
    structure_ui.setSkin(attr, function(err, infoStructure){
        if(err)
            return callback(err, null);

        callback(null, infoStructure);
    });
}

exports.listSkin = function(attr, callback) {
    structure_ui.listSkin(attr, function(err, infoStructure){
        if(err)
            return callback(err, null);

        callback(null, infoStructure);
    });
}

exports.listIcon = function(attr, callback) {
    callback(null, {
        message: "structure.ui.icon.list",
        messageParams: ['http://fontawesome.io/icons']
    });
}

exports.setIcon = function(attr, callback) {
    db_entity.getDataEntityById(attr.id_data_entity, function(err, entity) {
        if (err)
            return callback(err);
        db_module.getModuleById(entity.id_module, function(err, module) {
            if (err)
                return callback(err);

            attr.module = module;
            attr.entity = entity;
            structure_ui.setIcon(attr, function(err, info) {
                if (err)
                    return callback(err);
                callback(null, info);
            });
        });
    });
}

exports.setIconToEntity = function(attr, callback) {
    db_entity.getDataEntityByName(attr.entityTarget, function(err, entity) {
        if (err)
            return callback(err);
        db_module.getModuleById(entity.id_module, function(err, module) {
            if (err)
                return callback(err);

            attr.module = module;
            attr.entity = entity;
            structure_ui.setIcon(attr, function(err, info) {
                if (err)
                    return callback(err);
                callback(null, info);
            });
        });
    });
}

exports.createWidgetLastRecords = function(attr, callback) {
    var entityDbFunction = '', param = '';
    if (attr.entityTarget) {
        entityDbFunction = 'getDataEntityByName';
        param = attr.entityTarget;
    }
    else {
        entityDbFunction = 'getDataEntityById';
        param = attr.id_data_entity;
    }

    db_entity[entityDbFunction](param, function(err, entity) {
        if (err)
            return callback(err);
        db_module.getModuleById(entity.id_module, function(err, module) {
            if (err)
                return callback(err);
            attr.entity = entity;
            attr.module = module;

            db_field.getCodeNameByNameArray(attr.columns, entity.id, function(err, columns) {
                if (err)
                    return callback(err);

                // Check for not found fields and build error message
                if (attr.columns.length != columns.length) {
                    var notFound = [];
                    for (var k = 0; k < attr.columns.length; k++) {
                        var kFound = false;
                        for (var i = 0; i < columns.length; i++) {
                            if (attr.columns[k] == columns[i].name) {
                                kFound = true;
                                break;
                            }
                        }
                        if (!kFound)
                            notFound.push(attr.columns[k]);
                    }
                    if (notFound.length > 0)
                        return callback(null, {message: 'structure.ui.widget.unknown_fields', messageParams: [notFound.join(', ')]});
                }

                attr.columns = columns;
                structure_ui.createWidgetLastRecords(attr, function(err, info) {
                    if (err)
                        return callback(err);
                    callback(null, info);
                });
            });

        });
    });
}

exports.createWidgetOnEntity = function(attr, callback) {
    db_entity.getDataEntityByName(attr.entityTarget, function(err, entity) {
        if (err)
            return callback(err);
        attr.id_data_entity = entity.id;
        createWidget(attr, callback);
    });
}

function createWidget(attr, callback) {
    if (attr.widgetType == -1)
        return callback(null, {message: "structure.ui.widget.unknown", messageParams: [attr.widgetInputType]});
    db_entity.getDataEntityById(attr.id_data_entity, function(err, entity) {
        if (err)
            return callback(err);
        db_module.getModuleById(entity.id_module, function(err, module) {
            if (err)
                return callback(err);

            attr.module = module;
            attr.entity = entity;
            structure_ui.createWidget(attr, function(err, info) {
                if (err)
                    return callback(err);
                callback(null, info);
            });
        });
    });
}
exports.createWidget = createWidget;

function deleteWidget(attr, callback) {
    if (attr.widgetType == -1)
        return callback(null, {message: "structure.ui.widget.unkown", messageParams: [attr.widgetInputType]});
    db_entity.getDataEntityByName(attr.entityTarget, function(err, entity) {
        if (err)
            return callback(err);
        db_module.getModuleById(entity.id_module, function(err, module) {
            if (err)
                return callback(err);

            attr.module = module;
            attr.entity = entity;
            structure_ui.deleteWidget(attr, function(err, info) {
                if (err)
                    return callback(err);
                callback(null, info);
            });
        });
    });
}
exports.deleteWidget = deleteWidget;

function deleteEntityWidgets(attr, callback) {
    attr.widgetTypes = ['info','stats', 'lastrecords'];
    deleteWidget(attr, function(err) {
        if (err)
            callback(err);
        callback(null, {message: "structure.ui.widget.all_deleted", messageParams: [attr.entityTarget]});
    });
}
exports.deleteEntityWidgets = deleteEntityWidgets;

return designer;
