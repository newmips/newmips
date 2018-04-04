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
var translateHelper = require("../utils/translate");

var fs = require('fs-extra');
var sequelize = require('../models/').sequelize;

/* --------------------------------------------------------------- */
/* -------------------------- General ---------------------------- */
/* --------------------------------------------------------------- */

// Execute an array of newmips instructions
exports.recursiveInstructionExecute = function (sessionAttr, instructions, idx, callback) {
    var exportsContext = this;
    // Create the attr obj
    var recursiveAttr = bot.parse(instructions[idx]);
    if (recursiveAttr.error) {
        console.log(recursiveAttr.error);
        return callback(recursiveAttr.error);
    }

    // Rework the attr obj
    recursiveAttr = attrHelper.reworkAttr(recursiveAttr);

    // Add current session info in attr object
    recursiveAttr.id_project = sessionAttr.id_project;
    recursiveAttr.id_application = sessionAttr.id_application;
    recursiveAttr.id_module = sessionAttr.id_module;
    recursiveAttr.id_data_entity = sessionAttr.id_data_entity;

    // Execute the designer function
    this[recursiveAttr.function](recursiveAttr, function (err, info) {
        if (err)
            return callback(err, info);

        session.setSessionInAttr(recursiveAttr, info);
        idx += 1;
        if (instructions.length == idx)
            return callback(err, info);
        exportsContext.recursiveInstructionExecute(recursiveAttr, instructions, idx, callback);
    });
}

exports.help = function (attr, callback) {
    session.help(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.showSession = function (attr, callback) {
    session.showSession(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.deploy = function (attr, callback) {
    session.deploy(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.restart = function (attr, callback) {
    var info = {
        message: "structure.global.restart.success"
    };
    callback(null, info);
}

exports.installNodePackage = function (attr, callback) {
    structure_application.installAppModules().then(function(){
        var info = {
            message: "structure.global.npmInstall.success"
        };
        callback(null, info);
    });
}

/* --------------------------------------------------------------- */
/* --------------------------- Git ------------------------------- */
/* --------------------------------------------------------------- */

exports.gitPush = function (attr, callback) {
    gitHelper.gitPush(attr, function (err, infoGit) {
        if (err)
            return callback(err, null);
        var info = {};
        info.message = "structure.global.gitPush.success";
        callback(null, info);
    });
}

exports.gitPull = function (attr, callback) {
    gitHelper.gitPull(attr, function (err, infoGit) {
        if (err)
            return callback(err, null);
        var info = {};
        info.message = "structure.global.gitPull.success";
        callback(null, info);
    });
}

exports.gitCommit = function (attr, callback) {
    gitHelper.gitCommit(attr, function (err, infoGit) {
        if (err)
            return callback(err, null);
        var info = {};
        info.message = "structure.global.gitCommit.success";
        callback(null, info);
    });
}

exports.gitStatus = function (attr, callback) {
    gitHelper.gitStatus(attr, function (err, infoGit) {
        if (err)
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
exports.selectProject = function (attr, callback) {
    db_project.selectProject(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.createNewProject = function (attr, callback) {
    db_project.createNewProject(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.listProject = function (attr, callback) {
    db_project.listProject(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.deleteProject = function (attr, callback) {
    db_project.getProjectApplications(attr.options.showValue, function (err, applications) {
        if (err)
            return callback(err, null);
        var appIds = [];
        for (var i = 0; i < applications.length; i++)
            appIds.push(applications[i].id);

        deleteApplicationRecursive(appIds, 0).then(function () {
            db_project.deleteProject(attr.options.showValue, function (err, info) {
                if (err)
                    return callback(err, null);

                callback(null, info);
            });
        }).catch(function (err) {
            callback(err, null);
        });
    });
}

/* --------------------------------------------------------------- */
/* ----------------------- Application --------------------------- */
/* --------------------------------------------------------------- */
exports.selectApplication = function (attr, callback) {
    var exportsContext = this;
    db_application.selectApplication(attr, function (err, info) {
        if (err) {
            callback(err, null);
        } else {
            var instructions = [
                "select module home"
            ];

            attr.id_application = info.insertId;

            // Select the module home automatically after selecting an application
            exportsContext.recursiveInstructionExecute(attr, instructions, 0, function (err) {
                if (err)
                    return callback(err, null);
                info.name_application = attr.options.value;
                callback(null, info);
            });
        }
    });
}

exports.createNewApplication = function (attr, callback) {
    // Check if an application with this name alreadyExist or no
    db_application.exist(attr, function (err, exist) {
        if (err)
            return callback(err, null);

        if (exist) {
            var error = new Error();
            error.message = "database.application.alreadyExist";
            error.messageParams = [attr.options.showValue];
            return callback(error, null);
        } else {
            db_application.createNewApplication(attr, function (err, info) {
                if (err) {
                    callback(err, null);
                } else {
                    // Structure application
                    attr.id_application = info.insertId;
                    info.name_application = attr.options.urlValue;
                    structure_application.setupApplication(attr, function () {
                        callback(null, info);
                    });
                }
            });
        }
    });
}

exports.listApplication = function (attr, callback) {
    db_application.listApplication(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

// Declare this function not directly within exports to be able to use it from deleteApplicationRecursive()
function deleteApplication(attr, callback) {
    function doDelete(id_application) {
        structure_application.deleteApplication(id_application, function (err, infoStructure) {
            if (err)
                return callback(err, null);
            sequelize.query("SHOW TABLES LIKE '" + id_application + "_%'").spread(function (results, metada) {
                db_application.deleteApplication(id_application, function (err, infoDB) {
                    if (err)
                        return callback(err, null);
                    /* Calculate the length of table to drop */
                    var resultLength = 0;

                    for (var i = 0; i < results.length; i++) {
                        for (var prop in results[i]) {
                            resultLength++;
                        }
                    }

                    /* Function when all query are done */
                    function done(currentCpt) {
                        if (currentCpt == resultLength) {
                            callback(null, infoDB);
                        }
                    }

                    var cpt = 0;
                    for (var i = 0; i < results.length; i++) {
                        for (var prop in results[i]) {
                            // For each request disable foreign key checks, drop table. Foreign key check
                            // last only for the time of the request
                            sequelize.query("SET FOREIGN_KEY_CHECKS=0; DROP TABLE " + results[i][prop] + ";SET FOREIGN_KEY_CHECKS=1;").then(function () {
                                done(++cpt);
                            });
                        }
                    }
                });
            });
        });
    }
    if (isNaN(attr.options.showValue))
        db_application.getIdApplicationByCodeName(attr.options.value, attr.options.showValue, function (err, id_application) {
            if (err)
                return callback(err, null);
            doDelete(id_application);
        });
    else {
        doDelete(attr.options.showValue);
    }
}
exports.deleteApplication = deleteApplication;

function deleteApplicationRecursive(appIds, idx) {
    return new Promise(function (resolve, reject) {
        if (!appIds[idx])
            return resolve();

        var attr = {
            options: {
                value: appIds[idx],
                showValue: appIds[idx]
            }
        };

        deleteApplication(attr, function (err, info) {
            if (err)
                return reject(err);
            return (appIds[++idx]) ? resolve(deleteApplicationRecursive(appIds, idx)) : resolve();
        });
    });
}

/* --------------------------------------------------------------- */
/* ------------------------- Module ------------------------------ */
/* --------------------------------------------------------------- */
exports.selectModule = function (attr, callback) {
    db_module.selectModule(attr, function (err, infoDB) {
        if (err)
            return callback(err, null);
        callback(null, infoDB);
    });
}

exports.createNewModule = function (attr, callback) {
    db_module.createNewModule(attr, function (err, infoDB) {
        if (err)
            return callback(err, null);
        infoDB.moduleName = attr.options.urlValue;
        // Retrieve list of application modules to update them all
        db_module.listModuleByApplication(attr, function (err, modules) {
            if (err)
                return callback(err, null);

            // Assign list of existing application modules
            // Needed to recreate the dropdown list of modules in the interface
            attr.modules = modules;

            // Structure
            structure_module.setupModule(attr, function (err, data) {
                callback(null, infoDB);
            });
        });
    });
}

exports.listModule = function (attr, callback) {
    db_module.listModule(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.deleteModule = function (attr, callback) {
    var moduleName = attr.options.showValue;
    if (moduleName.toLowerCase() == 'home') {
        var err = new Error();
        err.message = "structure.module.error.notHome";
        return callback(err, null);
    }

    db_module.getEntityListByModuleName(attr.id_application, moduleName, function (err, entities) {
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

            promises.push(new Promise(function (resolve, reject) {
                (function (tmpAttrIn) {
                    deleteDataEntity(tmpAttrIn, function (err) {
                        if (err) {
                            return reject(err);
                        }
                        resolve();
                    })
                })(tmpAttr);
            }));
        }

        Promise.all(promises).then(function () {
            attr.module_name = attr.options.value;
            structure_module.deleteModule(attr, function (err) {
                if (err)
                    return callback(err, null);
                db_module.deleteModule(attr.id_application, attr.module_name, moduleName, function (err, info) {
                    if (err)
                        return callback(err, null);

                    db_module.getHomeModuleId(attr.id_application, function (err, homeID) {
                        info.homeID = homeID;
                        callback(null, info);
                    });
                });
            });
        }).catch(function (err) {
            callback(err, null);
        });
    });
}

/* --------------------------------------------------------------- */
/* --------------------------- Entity ---------------------------- */
/* --------------------------------------------------------------- */
exports.selectEntity = function(attr, callback) {
    db_entity.selectEntity(attr, function(err, info) {
        if(err)
            return callback(err, null);
        db_module.getModuleById(info.moduleId, function(err, module) {
            if (err)
                return callback(err, null);
            structure_data_field.selectEntity(attr.id_application, module.codeName, info.urlEntity, function(err, doRedirect) {
                if (err)
                    return callback(err, null);
                info.doRedirect = doRedirect;
                callback(null, info);
            });
        });
    });
}

exports.createNewEntity = function (attr, callback) {

    // Get active application module name
    db_module.getModuleById(attr.id_module, function (err, module) {
        if (err) {
            callback(err, null);
        } else {

            attr.show_name_module = module.name;
            attr.name_module = module.codeName;
            // Generator database
            db_entity.createNewEntity(attr, function (err, infoDB) {
                if (err) {
                    callback(err, null);
                } else {
                    structure_data_entity.setupDataEntity(attr, function (err, data) {
                        callback(null, infoDB);
                    });
                }
            });
        }
    });
}

exports.listDataEntity = function (attr, callback) {
    db_entity.listDataEntity(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

function deleteDataEntity(attr, callback) {

    function checkIfIDGiven(attr, callback) {
        // If it was the ID instead of the name given in the instruction
        if (!isNaN(attr.options.showValue)) {
            db_entity.getDataEntityById(attr.options.showValue, function (err, entity) {
                if (err)
                    return callback(err, null);

                attr.options.value = entity.codeName;
                attr.options.showValue = entity.name;
                attr.options.urlValue = entity.codeName.substring(2);
                callback(null, attr);
            });
        } else {
            callback(null, attr);
        }
    }

    checkIfIDGiven(attr, function (err, attr) {
        if (err)
            return callback(err, null);

        var id_application = attr.id_application;
        var name_data_entity = attr.options.value.toLowerCase();
        var show_name_data_entity = attr.options.showValue.toLowerCase();

        var name_module = "";

        var promises = [];
        var workspacePath = __dirname + '/../workspace/' + id_application;

        db_entity.getIdDataEntityByCodeName(attr.id_module, name_data_entity, function (err, entityId) {
            if (err) {
                callback(err, null);
            } else {
                var entityOptions = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + name_data_entity + '.json'));
                for (var i = 0; i < entityOptions.length; i++) {
                    if (entityOptions[i].relation == 'hasMany') {
                        var tmpAttr = {
                            options: {
                                value: entityOptions[i].as,
                                urlValue: entityOptions[i].as.substring(2)
                            },
                            id_project: attr.id_project,
                            id_application: attr.id_application,
                            id_module: attr.id_module,
                            id_data_entity: entityId,
                            structureType: entityOptions[i].structureType
                        };
                        promises.push({func: function (tmpAttrIn, clbk) {
                                if (tmpAttrIn.structureType == "hasMany" || tmpAttrIn.structureType == "hasManyPreset") {
                                    deleteTab(tmpAttrIn, function (err) {
                                        if (err)
                                            console.log(err);
                                        clbk();
                                    });
                                } else if (tmpAttrIn.structureType == "relatedToMultiple") {
                                    tmpAttrIn.options.value = "f_" + tmpAttrIn.options.value.substring(2);
                                    deleteDataField(tmpAttrIn, function (err) {
                                        if (err)
                                            console.log(err);
                                        clbk();
                                    });
                                } else {
                                    console.log("WARNING - Unknown option to delete !");
                                    console.log(tmpAttrIn);
                                    clbk();
                                }
                            }, arg: tmpAttr});
                    }
                }

                fs.readdirSync(workspacePath + '/models/options/').filter(function (file) {
                    return file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file.slice(0, -5) != name_data_entity;
                }).forEach(function (file) {
                    var source = file.slice(0, -5);
                    var options = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + file));
                    for (var i = 0; i < options.length; i++) {
                        if (options[i].target != name_data_entity)
                            continue;
                        if (options[i].relation == 'hasMany') {
                            var tmpAttr = {
                                options: {
                                    value: options[i].as,
                                    urlValue: options[i].as.substring(2)
                                },
                                id_project: attr.id_project,
                                id_application: attr.id_application,
                                id_module: attr.id_module,
                                structureType: options[i].structureType
                            }
                            promises.push({func: function (tmpAttrIn, clbk) {
                                    db_entity.getIdDataEntityByCodeName(attr.id_module, source, function (err, sourceID) {
                                        tmpAttrIn.id_data_entity = sourceID;
                                        if (tmpAttrIn.structureType == "hasMany" || tmpAttrIn.structureType == "hasManyPreset") {
                                            deleteTab(tmpAttrIn, function (err) {
                                                if (err)
                                                    console.log(err);
                                                clbk();
                                            });
                                        } else if (tmpAttrIn.structureType == "relatedToMultiple") {
                                            tmpAttrIn.options.value = "f_" + tmpAttrIn.options.value.substring(2);
                                            deleteDataField(tmpAttrIn, function (err) {
                                                if (err)
                                                    console.log(err);
                                                clbk();
                                            });
                                        } else {
                                            console.log("WARNING - Unknown option to delete !");
                                            console.log(tmpAttrIn);
                                            clbk();
                                        }
                                    });
                                }, arg: tmpAttr});
                        } else if (options[i].relation == 'belongsTo') {
                            var tmpAttr = {
                                options: {
                                    value: options[i].as,
                                    urlValue: options[i].as.substring(2)
                                },
                                id_project: attr.id_project,
                                id_application: attr.id_application,
                                id_module: attr.id_module,
                                structureType: options[i].structureType
                            };
                            promises.push({func: function (tmpAttrIn, clbk) {
                                    db_entity.getIdDataEntityByCodeName(attr.id_module, source, function (err, sourceID) {
                                        tmpAttrIn.id_data_entity = sourceID;
                                        if (tmpAttrIn.structureType == "relatedTo") {
                                            tmpAttrIn.options.value = "f_" + tmpAttrIn.options.value.substring(2);
                                            deleteDataField(tmpAttrIn, function (err) {
                                                if (err)
                                                    console.log(err);
                                                clbk();
                                            });
                                        } else if (tmpAttrIn.structureType == "hasOne") {
                                            deleteTab(tmpAttrIn, function (err) {
                                                if (err)
                                                    console.log(err);
                                                clbk();
                                            });
                                        } else {
                                            console.log("WARNING - Unknown option to delete !");
                                            console.log(tmpAttrIn);
                                            clbk();
                                        }
                                    });
                                }, arg: tmpAttr});
                        }
                    }
                });

                attr.entityTarget = attr.options.showValue;
                deleteEntityWidgets(attr, function (err) {
                    if (err)
                        return callback(err);

                    function orderedTasks(tasks, idx, overClbk) {
                        if (!tasks[idx])
                            return overClbk();
                        tasks[idx].func(tasks[idx].arg, function () {
                            orderedTasks(tasks, idx + 1, overClbk);
                        });
                    }
                    orderedTasks(promises, 0, function () {
                        db_entity.getModuleCodeNameByEntityCodeName(name_data_entity, attr.id_module, function (err, name_module) {
                            if (err)
                                return callback(err, null);
                            database.dropDataEntity(id_application, name_data_entity, function (err) {
                                if (err)
                                    return callback(err);
                                attr.name_data_entity = name_data_entity;
                                attr.show_name_data_entity = show_name_data_entity;
                                db_entity.deleteDataEntity(attr, function (err, infoDB) {
                                    if (err)
                                        return callback(err);
                                    var url_name_data_entity = attr.options.urlValue;
                                    structure_data_entity.deleteDataEntity(id_application, name_module, name_data_entity, url_name_data_entity, function () {
                                        infoDB.deletedEntityId = entityId;
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
exports.createNewDataField = function (attr, callback) {
    // Get active data entity name
    db_entity.getDataEntityById(attr.id_data_entity, function (err, data_entity) {
        if (err) {
            callback(err, null);
        } else {

            // Get active application module name
            db_module.getNameModuleById(attr.id_module, function (err, name_module) {
                if (err) {
                    callback(err, null);
                } else {

                    attr.name_module = name_module;
                    db_field.createNewDataField(attr, function (err, info) {
                        if (err) {
                            callback(err, null);
                        } else {

                            attr.name_data_entity = data_entity.name;
                            attr.codeName_data_entity = data_entity.codeName;
                            structure_data_field.setupDataField(attr, function (err, data) {
                                if (err) {
                                    db_field.deleteDataField(attr, function (error, info) {
                                        callback(err, null);
                                    });
                                } else {
                                    callback(null, info);
                                }
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
    db_entity.getDataEntityById(attr.id_data_entity, function (err, dataEntity) {
        if (err) {
            return callback(err, infoDesigner);
        }

        attr.name_data_entity = dataEntity.codeName;
        attr.show_name_data_entity = dataEntity.name;

        structure_data_field.deleteTab(attr, function (err, fk, target, tabType) {
            if (err) {
                return callback(err, infoDesigner);
            }
            infoDesigner.tabType = tabType;

            attr.fieldToDrop = fk;
            attr.name_data_entity = target;
            database.dropFKDataField(attr, function (err, infoDatabase) {
                if (err) {
                    return callback(err, infoDesigner);
                }

                // Missing id_ in attr.options.value, so we use fieldToDrop
                attr.options.value = attr.fieldToDrop;
                db_field.deleteDataField(attr, function (err, infoDB) {
                    if (err) {
                        return callback(err, infoDesigner);
                    }

                    infoDesigner.message = "structure.association.deleteTab";
                    infoDesigner.messageParams = [attr.options.showValue];

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
    db_entity.getDataEntityById(attr.id_data_entity, function (err, dataEntity) {
        if (err)
            return callback(err, null);

        // Set name of data entity in attributes
        attr.name_data_entity = dataEntity.codeName;
        attr.show_name_data_entity = dataEntity.name;

        // Get field name
        var options = attr.options;
        var name_data_field = options.value;

        try {
            function checkIfIDGiven(attr, callback2) {
                // If it was the ID instead of the name given in the instruction
                if (!isNaN(attr.options.showValue)) {
                    db_field.getNameDataFieldById(parseInt(attr.options.showValue), function (err, field) {
                        if (err)
                            return callback2(err, null);

                        attr.options.value = field.codeName;
                        attr.options.showValue = field.name;
                        callback2(null, attr);
                    });
                } else
                    callback2(null, attr);
            }

            checkIfIDGiven(attr, function (err, attr) {
                if (err)
                    return callback(err);
                // Delete field from views and models
                structure_data_field.deleteDataField(attr, function (err, infoStructure) {
                    if (err)
                        return callback(err, null);

                    // Alter database
                    attr.fieldToDrop = infoStructure.fieldToDrop;
                    var dropFunction = infoStructure.isConstraint ? 'dropFKDataField' : 'dropDataField';

                    // Related To Multiple
                    if (infoStructure.isMultipleConstraint) {
                        attr.target = infoStructure.target;
                        dropFunction = 'dropFKMultipleDataField';
                    }

                    var checkFieldParams = {
                        codeName: attr.fieldToDrop,
                        showValue: attr.options.showValue,
                        idEntity: attr.id_data_entity,
                        showEntity: attr.show_name_data_entity
                    };
                    // Check if field exist
                    db_field.getFieldByCodeName(checkFieldParams, function (err, fieldExist) {
                        if (err)
                            return callback(err, null);

                        database[dropFunction](attr, function (err, info) {
                            if (err)
                                return callback(err, null);

                            // Missing id_ in attr.options.value, so we use fieldToDrop
                            attr.options.value = attr.fieldToDrop;
                            // Delete record from software
                            db_field.deleteDataField(attr, function (err, infoDB) {
                                if (err)
                                    return callback(err, null);

                                callback(null, infoDB);
                            });
                        });
                    });

                });
            });
        } catch (err) {
            callback(err, null);
        }
    });
}
exports.deleteDataField = deleteDataField;

exports.listDataField = function (attr, callback) {
    db_field.listDataField(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

/* --------------------------------------------------------------- */
/* ---------------------- Field Attributes ----------------------- */
/* --------------------------------------------------------------- */

exports.setFieldKnownAttribute = function (attr, callback) {
    db_entity.getDataEntityById(attr.id_data_entity, function (err, dataEntity) {
        if (err)
            return callback(err, null);

        attr.name_data_entity = dataEntity.codeName;

        var wordParam = attr.options.word.toLowerCase();
        var requiredAttribute = ["mandatory", "required", "obligatoire", "optionnel", "non-obligatoire", "optional"];
        var uniqueAttribute = ["unique", "not-unique", "non-unique"];

        var checkFieldParams = {
            codeName: attr.options.value,
            showValue: attr.options.showValue,
            idEntity: attr.id_data_entity,
            showEntity: dataEntity.name
        };
        db_field.getFieldByCodeName(checkFieldParams, function (err, fieldExist) {
            if (err) {
                // Not found as a simple field, look for related to field
                var optionsArray = JSON.parse(helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + dataEntity.codeName + '.json'));
                var founded = false;
                for (var i = 0; i < optionsArray.length; i++) {
                    if (optionsArray[i].showAs == attr.options.showValue) {
                        if (optionsArray[i].structureType == "relatedTo") {
                            // We need the key in DB to set it unique instead of the client side name of the field
                            if (uniqueAttribute.indexOf(wordParam) != -1) {
                                attr.options.value = optionsArray[i].foreignKey;
                            }
                            founded = true;
                        } else if (optionsArray[i].structureType == "relatedToMultiple") {
                            if (uniqueAttribute.indexOf(wordParam) != -1) {
                                var err = new Error();
                                err.message = "structure.field.attributes.notUnique4RelatedToMany"
                                return callback(err, null);
                            } else
                                founded = true;
                        }
                        break;
                    }
                }
                if (!founded)
                    return callback(err, null);
            }

            // Check the attribute asked in the instruction
            if (requiredAttribute.indexOf(wordParam) != -1) {
                structure_data_field.setRequiredAttribute(attr, function (err) {
                    if (err)
                        return callback(err, null);

                    callback(null, {
                        message: "structure.field.attributes.successKnownAttribute",
                        messageParams: [attr.options.showValue, attr.options.word]
                    });
                });
            } else if (uniqueAttribute.indexOf(wordParam) != -1) {

                var sourceEntity = attr.id_application + "_" + attr.name_data_entity;
                var constraintName = attr.id_application + "_" + attr.name_data_entity + "_" + attr.options.value + "_unique";

                var possibilityUnique = ["unique"];
                var possibilityNotUnique = ["not-unique", "non-unique"];

                var attribute = attr.options.word.toLowerCase();
                var request = "";

                // Add or remove the unique constraint ?
                if (possibilityUnique.indexOf(attribute) != -1) {
                    request = "ALTER TABLE `" + sourceEntity + "` ADD CONSTRAINT " + constraintName + " UNIQUE (`" + attr.options.value + "`);";
                } else if (possibilityNotUnique.indexOf(attribute) != -1) {
                    request = "ALTER TABLE `" + sourceEntity + "` DROP INDEX `" + constraintName + "`;";
                }

                sequelize.query(request).then(function () {
                    structure_data_field.setUniqueField(attr, function (err) {
                        if (err)
                            return callback(err, null);

                        callback(null, {
                            message: "structure.field.attributes.successKnownAttribute",
                            messageParams: [attr.options.showValue, attr.options.word]
                        });
                    });
                }).catch(function (err) {
                    if (typeof err.parent !== "undefined" && err.parent.errno == 1062) {
                        var err = new Error();
                        err.message = "structure.field.attributes.duplicateUnique";
                    }
                    callback(err, null);
                });
            } else {
                var err = new Error();
                err.message = "structure.field.attributes.notUnderstandGiveAvailable";
                var msgParams = "";
                for (var i = 0; i < requiredAttribute.length; i++) {
                    msgParams += "-  " + requiredAttribute[i] + "<br>";
                }
                for (var j = 0; j < uniqueAttribute.length; j++) {
                    msgParams += "-  " + uniqueAttribute[j] + "<br>";
                }
                err.messageParams = [msgParams];
                callback(err, null);
            }
        });
    });
}

exports.setFieldAttribute = function (attr, callback) {
    db_entity.getDataEntityById(attr.id_data_entity, function (err, dataEntity) {
        if (err)
            return callback(err, null);

        attr.name_data_entity = dataEntity.codeName;

        structure_data_field.setFieldAttribute(attr, function (err) {
            if (err)
                return callback(err, null);

            callback(null, {
                message: "structure.field.attributes.success",
                messageParams: [attr.options.showValue, attr.options.word, attr.options.attributeValue]
            });
        });
    });
}
/* --------------------------------------------------------------- */
/* -------------------------- Datalist --------------------------- */
/* --------------------------------------------------------------- */

exports.setColumnVisibility = function (attr, callback) {

    db_entity.getDataEntityById(attr.id_data_entity, function (err, dataEntity) {
        if (err)
            return callback(err);

        attr.name_data_entity = dataEntity.codeName;
        structure_ui.setColumnVisibility(attr, function (err, infoStructure) {
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
exports.createNewHasOne = function (attr, callback) {

    /* Check if entity source exist before doing anything */
    db_entity.getIdDataEntityByCodeName(attr.id_module, attr.options.source, function (err, IDdataEntitySource) {
        if (err) {
            return callback(err, null);
        }

        var info = {};
        var toSync = true;
        // For the newmips generator BDD, needed for db_field.createNewForeignKey
        attr.id_data_entity = IDdataEntitySource;

        function structureCreation(attr, callback) {

            // Vérification si une relation existe déjà de la source VERS la target
            var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.source.toLowerCase() + '.json');
            var optionsSourceObject = JSON.parse(optionsSourceFile);
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

            // Vérification si une relation existe déjà de la target VERS la source
            var optionsFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
            var targetOptionsObject = JSON.parse(optionsFile);
            for (var i = 0; i < targetOptionsObject.length; i++) {
                if (targetOptionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && targetOptionsObject[i].relation != "hasMany" && targetOptionsObject[i].relation != "belongsToMany") {
                    var err = new Error();
                    err.message = "structure.association.error.circularBelongsTo";
                    return callback(err, null);
                } else if (attr.options.source.toLowerCase() != attr.options.target.toLowerCase()
                        && (targetOptionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && targetOptionsObject[i].relation == "hasMany")
                        && (targetOptionsObject[i].foreignKey == attr.options.foreignKey)) {
                    // We avoid the toSync to append because the already existing has many relation has already created the foreing key in BDD
                    toSync = false;
                }
            }

            // Ajout de la foreign key dans la BDD Newmips
            db_field.createNewForeignKey(attr, function (err, created_foreignKey) {
                if (err) {
                    return callback(err, null);
                }
                var associationOption = {
                    idApp: attr.id_application,
                    source: attr.options.source,
                    target: attr.options.target,
                    foreignKey: attr.options.foreignKey,
                    as: attr.options.as,
                    showAs: "",
                    relation: "belongsTo",
                    through: null,
                    toSync: toSync,
                    type: "hasOne"
                };
                // Créer le lien belongsTo en la source et la target
                structure_data_entity.setupAssociation(associationOption, function () {
                    // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                    structure_data_field.setupHasOneTab(attr, function (err, data) {
                        if (err)
                            return callback(err, null);
                        callback(null, info);
                    });
                });
            });
        }

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        // CREATION DE SOUS ENTITE OU NON
        db_entity.selectEntityTarget(attr, function (err, dataEntity) {
            if (err) {
                //Si c'est bien l'error de data entity qui n'existe pas
                if (err.level == 0) {
                    // Si l'entité target n'existe pas, on la crée
                    db_entity.createNewEntityTarget(attr, function (err, created_dataEntity) {
                        if (err) {
                            return callback(err, null);
                        }

                        // On se dirige en sessions vers l'entité crée
                        //info = created_dataEntity;
                        // Stay on the source entity, even if the target has been created
                        info.insertId = attr.id_data_entity;
                        info.message = "structure.association.hasOne.successSubEntity";
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

                // KEEP - Stay on the source entity
                info.insertId = attr.id_data_entity;
                info.message = "structure.association.hasOne.successEntity";
                info.messageParams = [attr.options.showAs, attr.options.showSource, attr.options.showSource, attr.options.showAs];
                structureCreation(attr, callback);
            }
        });
    });
}

function belongsToMany(attr, optionObj, setupFunction, exportsContext) {
    return new Promise(function (resolve, reject) {
        attr.options.through = attr.id_application + "_" + attr.options.source + "_" + attr.options.target;
        var through = attr.options.through;

        /* First we have to save the already existing data to put them in the new relation */
        db_entity.retrieveWorkspaceHasManyData(attr.id_application, attr.options.source, optionObj.foreignKey, function (data, err) {
            if (err && err.code != "ER_NO_SUCH_TABLE")
                return reject(err);
            structure_data_field.saveHasManyData(attr, data, optionObj.foreignKey, function (data, err) {
                if (err)
                    return reject(err);
                /* Secondly we have to remove the already existing has many to create the belongs to many relation */
                var instructions = [
                    "select entity " + attr.options.showTarget
                ];

                if (optionObj.structureType == "relatedToMultiple") {
                    instructions.push("delete field " + optionObj.as.substring(2));
                } else {
                    instructions.push("delete tab " + optionObj.as.substring(2));
                }

                // Start doing necessary instruction for component creation
                exportsContext.recursiveInstructionExecute(attr, instructions, 0, function (err, infoInstruction) {
                    if (err)
                        return reject(err);
                    if (typeof infoInstruction.tabType !== "undefined")
                        attr.targetType = infoInstruction.tabType;
                    else
                        attr.targetType = optionObj.structureType;
                    /* Then lets create the belongs to many association */

                    /* We need the same alias for both relation */
                    //attr.options.as = "r_"+attr.options.source.substring(2)+ "_" + attr.options.target.substring(2);

                    var associationOptionOne = {
                        idApp: attr.id_application,
                        source: attr.options.source,
                        target: attr.options.target,
                        foreignKey: attr.options.foreignKey,
                        as: attr.options.as,
                        showAs: attr.options.showAs,
                        relation: "belongsToMany",
                        through: through,
                        toSync: false,
                        type: attr.targetType
                    };
                    structure_data_entity.setupAssociation(associationOptionOne, function () {
                        var associationOptionTwo = {
                            idApp: attr.id_application,
                            source: attr.options.target,
                            target: attr.options.source,
                            foreignKey: attr.options.foreignKey,
                            as: optionObj.as,
                            showAs: optionObj.showAs,
                            relation: "belongsToMany",
                            through: through,
                            toSync: false,
                            type: attr.targetType
                        };
                        structure_data_entity.setupAssociation(associationOptionTwo, function () {
                            structure_data_field[setupFunction](attr, function () {
                                var reversedAttr = {
                                    options: {
                                        target: attr.options.source,
                                        source: attr.options.target,
                                        foreignKey: optionObj.foreignKey,
                                        as: optionObj.as,
                                        showTarget: attr.options.showSource,
                                        urlTarget: attr.options.urlSource.toLowerCase(),
                                        showSource: attr.options.showTarget,
                                        urlSource: attr.options.urlTarget.toLowerCase(),
                                        showAs: optionObj.showAs,
                                        urlAs: optionObj.as.substring(2).toLowerCase()
                                    },
                                    id_project: attr.id_project,
                                    id_application: attr.id_application,
                                    id_module: attr.id_module,
                                    id_data_entity: attr.id_data_entity
                                };

                                if(attr.targetType == "hasMany"){
                                    structure_data_field.setupHasManyTab(reversedAttr, function(){
                                        resolve();
                                    });
                                }
                                else if(attr.targetType == "hasManyPreset"){
                                    structure_data_field.setupHasManyPresetTab(reversedAttr, function(){
                                        resolve();
                                    });
                                } else if (attr.targetType == "relatedToMultiple") {
                                    if (typeof optionObj.usingField !== "undefined")
                                        reversedAttr.options.usingField = optionObj.usingField;
                                    structure_data_field.setupRelatedToMultipleField(reversedAttr, function () {
                                        resolve();
                                    });
                                } else {
                                    reject("Error: Unknown target type for belongsToMany generation.")
                                }
                            });
                        });
                    });
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
        if (err)
            return callback(err, null);

        attr.id_data_entity = IDdataEntitySource;

        var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.source.toLowerCase() + '.json');
        var optionsSourceObject = JSON.parse(optionsSourceFile);

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

        var info = {};
        var toSync = true;
        var optionsObject;
        function structureCreation(attr, callback) {
            var doingBelongsToMany = false;
            // Vérification si une relation existe déjà de la target VERS la source
            for (var i = 0; i < optionsObject.length; i++) {
                if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo") {
                    doingBelongsToMany = true;
                    /* Then lets create the belongs to many association */
                    belongsToMany(attr, optionsObject[i], "setupHasManyTab", exportsContext).then(function () {
                        info.insertId = attr.id_data_entity;
                        info.message = "structure.association.hasMany.successEntity";
                        info.messageParams = [attr.options.showAs, attr.options.showSource, attr.options.showSource, attr.options.showAs];
                        callback(null, info);
                    }).catch(function (err) {
                        console.log(err);
                        return callback(err, null);
                    });
                } else if (attr.options.source.toLowerCase() != attr.options.target.toLowerCase()
                        && (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation == "belongsTo")
                        && (optionsObject[i].foreignKey == attr.options.foreignKey)) {
                    // We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
                    toSync = false;
                }
            }

            // If there is a circular has many we have to convert it to a belongsToMany assocation, so we stop the code here.
            // If not we continue doing a simple has many association.
            if (!doingBelongsToMany) {
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

                db_field.createNewForeignKey(reversedAttr, function (err, created_foreignKey) {
                    // Créer le lien hasMany en la source et la target
                    var associationOption = {
                        idApp: attr.id_application,
                        source: attr.options.source,
                        target: attr.options.target,
                        foreignKey: attr.options.foreignKey,
                        as: attr.options.as,
                        showAs: attr.options.showAs,
                        relation: "hasMany",
                        through: null,
                        toSync: toSync,
                        type: "hasMany"
                    };

                    structure_data_entity.setupAssociation(associationOption, function () {
                        // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                        structure_data_field.setupHasManyTab(attr, function () {
                            callback(null, info);
                        });
                    });
                });
            }
        }

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectEntityTarget(attr, function (err, dataEntity) {
            // Si l'entité target n'existe pas, on la crée
            if (err) {
                //Si c'est bien l'error de data entity qui n'existe pas
                if (err.level == 0) {
                    db_entity.createNewEntityTarget(attr, function (err, created_dataEntity) {
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
                                var optionsFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
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
                var optionsFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
                optionsObject = JSON.parse(optionsFile);

                var cptExistingHasMany = 0;

                // Check if there is no or just one belongsToMany to do
                for (var i = 0; i < optionsObject.length; i++) {
                    if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo") {
                        if (optionsObject[i].relation == "belongsToMany") {
                            //var err = new Error();
                            //err.message = "structure.association.error.alreadyBelongsToMany";
                            //return callback(err, null);
                        } else {
                            cptExistingHasMany++;
                        }
                    }
                }
                /* If there are multiple has many association from target to source we can't handle on which one we gonna link the belongsToMany association */
                if (cptExistingHasMany > 1) {
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
exports.createNewHasManyPreset = function (attr, callback) {
    var exportsContext = this;

    // db_entity.getDataEntityById(attr.id_data_entity, function (err, source_entity) {
    //     if (err && typeof attr.options.source === "undefined")
    //         return callback(err, null);
    /* Check if entity source exist before doing anything */
    db_entity.getIdDataEntityByCodeNameWithoutModuleCheck(attr.id_module, attr.options.source, function (err, IDdataEntitySource) {
        if (err)
            return callback(err, null);

        attr.id_data_entity = IDdataEntitySource;

        // With preset instruction with already know the source of the related to
        // "entity (.*) has many preset (.*)"
        if (typeof attr.options.source === "undefined") {
            attr.options.source = source_entity.codeName;
            attr.options.showSource = source_entity.name;
            attr.options.urlSource = attrHelper.removePrefix(source_entity.codeName, "entity");
        }

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectEntityTarget(attr, function (err, dataEntity) {
            // Si l'entité target n'existe pas ou autre
            if (err)
                return callback(err, null);

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
            for (var i = 0; i < optionsObject.length; i++) {
                if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo") {
                    if (optionsObject[i].relation == "belongsToMany") {
                        //var err = new Error();
                        //err.message = "structure.association.error.alreadyBelongsToMany";
                        //return callback(err, null);
                    } else {
                        cptExistingHasMany++;
                    }
                }
            }

            /* If there are multiple has many association from target to source we can't handle on which one we gonna link the belongsToMany association */
            if (cptExistingHasMany > 1) {
                var err = new Error();
                err.message = "structure.association.error.tooMuchHasMany";
                return callback(err, null);
            }

            var doingBelongsToMany = false;

            // Vérification si une relation existe déjà de la target VERS la source
            for (var i = 0; i < optionsObject.length; i++) {
                if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo") {
                    doingBelongsToMany = true;
                    /* Then lets create the belongs to many association */
                    belongsToMany(attr, optionsObject[i], "setupHasManyPresetTab", exportsContext).then(function () {
                        var info = {};
                        info.insertId = attr.id_data_entity;
                        info.message = "structure.association.hasManyExisting.success";
                        info.messageParams = [attr.options.showTarget, attr.options.showSource];
                        callback(null, info);
                    }).catch(function (err) {
                        console.log(err);
                        return callback(err, null);
                    });
                } else if (attr.options.source.toLowerCase() != attr.options.target.toLowerCase()
                        && (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation == "belongsTo")
                        && (optionsObject[i].foreignKey == attr.options.foreignKey)) {
                    // We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
                    toSync = false;
                }
            }

            // If there is a circular has many we have to convert it to a belongsToMany assocation, so we stop the code here.
            // If not we continue doing a simple has many association.
            if (!doingBelongsToMany) {
                /*var reversedAttr = {
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
                 };*/

                //db_field.createNewForeignKey(reversedAttr, function (err, created_foreignKey) {
                db_field.createNewForeignKey(attr, function (err, created_foreignKey) {
                    if (err) {
                        return callback(err, null);
                    }

                    var associationOption = {
                        idApp: attr.id_application,
                        source: attr.options.source,
                        target: attr.options.target,
                        foreignKey: attr.options.foreignKey,
                        as: attr.options.as,
                        showAs: attr.options.showAs,
                        relation: "hasMany",
                        through: null,
                        toSync: toSync,
                        usingField: attr.options.usingField || undefined,
                        type: "hasManyPreset"
                    };
                    // Créer le lien belongsTo en la source et la target
                    structure_data_entity.setupAssociation(associationOption, function () {
                        // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                        structure_data_field.setupHasManyPresetTab(attr, function () {

                            var info = {};
                            info.insertId = attr.id_data_entity;
                            info.message = "structure.association.hasManyExisting.success";
                            info.messageParams = [attr.options.showTarget, attr.options.showSource];
                            callback(null, info);
                        });
                    });
                });
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
        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectEntityTarget(attr, function (err, dataEntity) {
            // If target entity doesn't exists, send error
            if (err)
                return callback(err, null);
            var allUsingExist = true;
            // If a using field or fields has been asked, we have to check if those fields exist in the entity
            if (typeof attr.options.usingField !== "undefined") {
                var attributesPath = __dirname + '/../workspace/' + attr.id_application + '/models/attributes/' + attr.options.target.toLowerCase()
                delete require.cache[require.resolve(attributesPath)];
                var attributeTarget = require(attributesPath);
                for (var i = 0; i < attr.options.usingField.length; i++) {
                    if (typeof attributeTarget[attr.options.usingField[i]] === "undefined") {
                        allUsingExist = false;
                        var missingField = attr.options.showUsingField[i];
                    } else {
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
                } else if (attr.options.source.toLowerCase() != attr.options.target.toLowerCase()
                        && (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation == "hasMany")
                        && (optionsObject[i].foreignKey == attr.options.foreignKey)) {
                    // We avoid the toSync to append because the already existing has many relation has already created the foreign key in BDD
                    toSync = false;
                }
            }
            // Add foreign key to newmips's DB
            db_field.createNewForeignKey(attr, function (err, created_foreignKey) {
                if (err)
                    return callback(err, null);
                // Créer le lien belongsTo en la source et la target dans models/options/source.json
                var associationOption = {
                    idApp: attr.id_application,
                    source: attr.options.source,
                    target: attr.options.target,
                    foreignKey: attr.options.foreignKey,
                    as: attr.options.as,
                    showAs: attr.options.showAs,
                    relation: "belongsTo",
                    through: null,
                    toSync: true,
                    type: "relatedTo"
                };
                if (typeof attr.options.usingField !== "undefined") {
                    associationOption.usingField = attr.options.usingField;
                }
                structure_data_entity.setupAssociation(associationOption, function () {
                    // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                    structure_data_field.setupRelatedToField(attr, function (err, data) {
                        if (err)
                            return callback(err, null);
                        // Stay on the source entity in session
                        var info = {};
                        info.insertId = attr.id_data_entity;
                        info.message = "structure.association.relatedTo.success";
                        info.messageParams = [attr.options.showAs, attr.options.showTarget, attr.options.showAs, attr.options.showAs, attr.options.showAs];
                        callback(null, info);
                    });
                });
            });
        });
    });
}

// Select multiple in create/show/update related to target entity
exports.createNewFieldRelatedToMultiple = function (attr, callback) {
    var exportsContext = this;
    // Instruction is add field _FOREIGNKEY_ related to multiple _TARGET_ -> We don't know the source entity name so we have to find it
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

        // Now we know the source entity, so we can generate the foreign key
        attr.options.foreignKey = "fk_id_" + attr.options.source + "_" + attr.options.as.toLowerCase().substring(2);

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectEntityTarget(attr, function (err, entityTarget) {
            // If target entity doesn't exists, send error
            if (err)
                return callback(err, null);

            var allUsingExist = true;

            // If a using field or fields has been asked, we have to check if those fields exist in the entity
            if (typeof attr.options.usingField !== "undefined") {
                var attributesPath = __dirname + '/../workspace/' + attr.id_application + '/models/attributes/' + attr.options.target.toLowerCase()
                delete require.cache[require.resolve(attributesPath)];
                var attributeTarget = require(attributesPath);
                for (var i = 0; i < attr.options.usingField.length; i++) {
                    if (typeof attributeTarget[attr.options.usingField[i]] === "undefined") {
                        allUsingExist = false;
                        var missingField = attr.options.showUsingField[i];
                    } else {
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

            // Check if an association already exists from source to target
            var optionsSourceFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.source.toLowerCase() + '.json');
            var optionsSourceObject = JSON.parse(optionsSourceFile);

            var toSync = true;
            var relation = "belongsToMany";

            // Check already exisiting association from source to target entity
            for (var i = 0; i < optionsSourceObject.length; i++) {
                if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()) {
                    if (optionsSourceObject[i].relation == "belongsTo") {
                        console.log("WARNING: Source entity has already a related to association.");
                    } else if (attr.options.as == optionsSourceObject[i].as) {
                        var err = new Error();
                        err.message = "structure.association.error.alreadySameAlias";
                        return callback(err, null);
                    }
                } else if(optionsSourceObject[i].relation == "belongsToMany" && (attr.options.as == optionsSourceObject[i].as)){
                    var err = new Error();
                    err.message = "structure.association.error.alreadySameAlias";
                    return callback(err, null);
                }
            }

            var info = {};
            attr.options.through = attr.id_application + "_" + source_entity.id + "_" + entityTarget.id + "_" + attr.options.as.substring(2);
            if(attr.options.through.length > 55){
                var err = new Error();
                err.message = "error.valueTooLong";
                err.messageParams = [attr.options.through];
                return callback(err, null);
            }

            // Check if an association already exists from target to source
            var optionsFile = helpers.readFileSyncWithCatch('./workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
            var optionsObject = JSON.parse(optionsFile);

            for (var i = 0; i < optionsObject.length; i++) {
                if (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo") {
                    attr.options.through = attr.id_application + "_" + entityTarget.id + "_" + source_entity.id + "_" + attr.options.as.substring(2);
                    if(attr.options.through.length > 55){
                        var err = new Error();
                        err.message = "error.valueTooLong";
                        err.messageParams = [attr.options.through];
                        return callback(err, null);
                    }
                    //BelongsToMany
                    //doingBelongsToMany = true;
                    /* Then lets create the belongs to many association */
                    // belongsToMany(attr, optionsObject[i], "setupRelatedToMultipleField", exportsContext).then(function(){
                    //     info.message = "structure.association.relatedToMultiple.success";
                    //     info.messageParams = [attr.options.showAs, attr.options.showTarget, attr.options.showSource, attr.options.showAs, attr.options.showAs];
                    //     callback(null, info);
                    // }).catch(function(err){
                    //     console.log(err);
                    //     return callback(err, null);
                    // });
                } else if (attr.options.source.toLowerCase() != attr.options.target.toLowerCase()
                        && (optionsObject[i].target.toLowerCase() == attr.options.source.toLowerCase() && optionsObject[i].relation == "belongsTo")) {

                    // Temporary solution ! TODO: Mispy should ask if we want to link the already existing 1,1 with this new 1,n
                    if ((attr.options.target.substring(2) == attr.options.as.substring(2))
                            && (optionsObject[i].target.substring(2) == optionsObject[i].as.substring(2))) {
                        //&& (optionsObject[i].foreignKey == attr.options.foreignKey)
                        // If alias both side are the same that their own target then it trigger the 1,1 / 1,n generation
                        attr.options.foreignKey = optionsObject[i].foreignKey;
                        // We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
                        toSync = false;
                        // If it's already define that target entity belongsTo source entity, then we create a simple hasMany instead of a belongsToMany
                        relation = "hasMany";
                        attr.options.through = null;
                    }
                }
            }

            // If there is a circular has many we have to convert it to a belongsToMany assocation, so we stop the code here.
            // If not we continue doing a simple related to multiple association.
            var reversedAttr = {
                options: {
                    showForeignKey: attr.options.showAs,
                    foreignKey: attr.options.foreignKey,
                    source: attr.options.source,
                },
                id_data_entity: attr.id_data_entity,
                id_application: attr.id_application
            };

            db_field.createNewForeignKey(reversedAttr, function (err, created_foreignKey) {
                if (err)
                    return callback(err, null);
                // Create the belongsToMany link between source and target
                var associationOption = {
                    idApp: attr.id_application,
                    source: attr.options.source,
                    target: attr.options.target,
                    foreignKey: attr.options.foreignKey,
                    as: attr.options.as,
                    showAs: attr.options.showAs,
                    relation: relation,
                    through: attr.options.through,
                    toSync: toSync,
                    type: "relatedToMultiple"
                };
                if (typeof attr.options.usingField !== "undefined") {
                    associationOption.usingField = attr.options.usingField;
                }
                structure_data_entity.setupAssociation(associationOption, function () {
                    // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                    structure_data_field.setupRelatedToMultipleField(attr, function () {
                        var info = {};
                        info.message = "structure.association.relatedToMultiple.success";
                        info.messageParams = [attr.options.showAs, attr.options.showTarget, attr.options.showSource, attr.options.showAs, attr.options.showAs];
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
exports.createNewComponentStatus = function (attr, callback) {
    var self = this;

    db_entity.getDataEntityById(attr.id_data_entity, function (err, source_entity) {
        if (err)
            return callback(err, null);

        // These instructions create a has many with a new entity history_status
        // It also does a hasMany relation with e_status
        attr.source = source_entity.codeName;
        attr.showSource = source_entity.name;
        attr.history_table = 'history_' + attr.source + '_' + attr.options.value;

        if(attr.history_table.length >= 52){
            var err = new Error();
            err.message = "error.valueTooLong";
            err.messageParams = [attr.history_table];
            return callback(err, null);
        }

        var instructions = [
            "entity " + source_entity.name + ' has many ' + attr.history_table + ' called History ' + attr.options.showValue,
            "select entity " + attr.history_table,
            "add field " + attr.options.showValue + " related to Status using name, color",
            "add field Comment with type text",
            "entity status has many " + attr.history_table,
            "select entity " + source_entity.name,
            "add field " + attr.options.showValue + " related to Status using name"
        ];

        self.recursiveInstructionExecute(attr, instructions, 0, function (err) {
            if (err)
                return callback(err, null);

            structure_component.newStatus(attr, function (err) {
                if (err)
                    return callback(err, null);
                callback(null, {message: 'database.component.create.successOnEntity', messageParams: ['status', attr.options.showValue, attr.showSource]});
            });
        });
    });
}

// Componant that we can add on an entity to store local documents
exports.createNewComponentLocalFileStorage = function (attr, callback) {

    /* If there is no defined name for the module */
    if (typeof attr.options.value === "undefined") {
        attr.options.value = "c_local_file_storage_" + attr.id_data_entity;
        attr.options.urlValue = "local_file_storage_" + attr.id_data_entity;
        attr.options.showValue = "Local File Storage";
    } else {
        attr.options.value = attr.options.value + "_" + attr.id_data_entity;
        attr.options.urlValue = attr.options.urlValue + "_" + attr.id_data_entity;
    }

    // Check if component with this name is already created on this entity
    db_component.checkIfComponentCodeNameExistOnEntity(attr.options.value, attr.id_module, attr.id_data_entity, function (err, alreadyExist) {
        if (err)
            return callback(err, null);
        if (alreadyExist) {
            var err = new Error();
            err.message = "structure.component.error.alreadyExistOnEntity";
            return callback(err, null);
        }
        // Check if a table as already the composant name
        db_entity.getDataEntityByCodeName(attr.id_application, attr.options.value, function (err, dataEntity) {
            if (dataEntity) {
                var err = new Error();
                err.message = "structure.component.error.alreadyExistInApp";
                return callback(err, null);
            }
            // Get Data Entity Name needed for structure
            db_entity.getDataEntityById(attr.id_data_entity, function (err, sourceEntity) {
                attr.options.source = sourceEntity.codeName;
                attr.options.showSource = sourceEntity.name;
                attr.options.urlSource = attrHelper.removePrefix(sourceEntity.codeName, "entity");
                // Create the component in newmips database
                db_component.createNewComponentOnEntity(attr, function (err, info) {
                    if (err)
                        return callback(err, null);
                    // Setup the hasMany association in the source entity
                    try {
                        db_entity.createNewEntity(attr, function (err, infoDbEntity) {
                            var associationOption = {
                                idApp: attr.id_application,
                                source: attr.options.source,
                                target: attr.options.value.toLowerCase(),
                                foreignKey: "fk_id_" + attr.options.source.toLowerCase(),
                                as: attr.options.value.toLowerCase(),
                                showAs: attr.options.showValue,
                                relation: "hasMany",
                                through: null,
                                toSync: false,
                                type: 'localfilestorage'
                            };
                            structure_data_entity.setupAssociation(associationOption, function () {
                                // Get module info needed for structure
                                db_module.getModuleById(attr.id_module, function (err, module) {
                                    if (err)
                                        return callback(err, null);
                                    attr.options.moduleName = module.codeName;
                                    structure_component.newLocalFileStorage(attr, function (err) {
                                        if (err)
                                            return callback(err, null);

                                        callback(null, info);
                                    });
                                });
                            });
                        });
                    } catch (err) {
                        return callback(err, null);
                    }
                });
            });
        });
    });
}

// Componant to create a contact form in a module
exports.createNewComponentContactForm = function (attr, callback) {

    var exportsContext = this;

    /* If there is no defined name for the module */
    if (typeof attr.options.value === "undefined") {
        attr.options.value = "e_contact_form";
        attr.options.urlValue = "contact_form";
        attr.options.showValue = "Contact Form";
    }

    // Check if component with this name is already created in this module
    db_component.getComponentByCodeNameInModule(attr.id_module, attr.options.value, attr.options.showValue, function (err, component) {
        if (component) {
            var err = new Error();
            err.message = "structure.component.error.alreadyExistOnModule";
            return callback(err, null);
        } else {
            // Check if a table as already the composant name
            db_entity.getDataEntityByCodeName(attr.id_application, attr.options.value, function (err, dataEntity) {
                if (dataEntity) {
                    err = new Error();
                    err.message = "structure.component.error.alreadyExistInApp";
                    return callback(err, null);
                } else {

                    attr.options.valueSettings = attr.options.value + "_settings";
                    attr.options.urlValueSettings = attr.options.urlValue + "_settings";
                    attr.options.showValueSettings = attr.options.showValue + " Settings";

                    var instructions = [
                        "add entity " + attr.options.showValue,
                        "add field Name",
                        "set field Name required",
                        "add field Sender with type email",
                        "set field Sender required",
                        "add field Recipient with type email",
                        "add field User related to user using login",
                        "add field Title",
                        "set field Title required",
                        "add field Content with type text",
                        "set field Content required",
                        "add entity " + attr.options.showValueSettings,
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
                    exportsContext.recursiveInstructionExecute(attr, instructions, 0, function (err) {
                        if (err)
                            return callback(err, null);

                        // Create the component in newmips database
                        db_component.createNewComponentOnModule(attr, function (err, info) {
                            if (err)
                                return callback(err, null);
                            // Get Module Name needed for structure
                            db_module.getModuleById(attr.id_module, function (err, module) {
                                if (err)
                                    return callback(err, null);

                                attr.options.moduleName = module.codeName;
                                structure_component.newContactForm(attr, function (err) {
                                    if (err)
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

exports.deleteComponentContactForm = function (attr, callback) {

    var exportsContext = this;

    /* If there is no defined name for the module */
    if (typeof attr.options.value === "undefined") {
        attr.options.value = "e_contact_form";
        attr.options.urlValue = "contact_form";
        attr.options.showValue = "Contact Form";
    }

    // Check if component with this name is already created in this module
    db_component.getComponentByCodeNameInModule(attr.id_module, attr.options.value, attr.options.showValue, function (err, component) {
        if (err) {
            return callback(err, null);
        } else {
            attr.options.valueSettings = attr.options.value + "_settings";
            attr.options.urlValueSettings = attr.options.urlValue + "_settings";
            attr.options.showValueSettings = attr.options.showValue + " Settings";

            var instructions = [
                "delete entity " + attr.options.showValue,
                "delete entity " + attr.options.showValueSettings
            ];

            // Create a tmp route file to avoid error during the delete entity, this file was removed at the component generation
            fs.writeFileSync(__dirname + "/../workspace/" + attr.id_application + "/routes/" + attr.options.valueSettings + ".js", "", "utf-8");

            // Start doing necessary instructions for component deletion
            exportsContext.recursiveInstructionExecute(attr, instructions, 0, function (err) {
                if (err)
                    return callback(err, null);

                // Remove the component in newmips database
                db_component.deleteComponentOnModule(attr.options.value, attr.id_module, function (err, info) {
                    if (err)
                        return callback(err, null);

                    callback(null, {message: "database.component.delete.success"});
                });
            });
        }
    });
}

// Componant to create an agenda in a module
exports.createNewComponentAgenda = function (attr, callback) {

    var exportsContext = this;

    /* If there is no defined name for the module */
    if (typeof attr.options.value === "undefined") {
        attr.options.value = "c_agenda";
        attr.options.urlValue = "agenda";
        attr.options.showValue = "Agenda";
    }

    // Check if component with this name is already created on this module
    db_component.getComponentByCodeNameInModule(attr.id_module, attr.options.value, attr.options.showValue, function (err, component) {
        if (component) {
            var err = new Error();
            err.message = "structure.component.error.alreadyExistOnModule";
            return callback(err, null);
        } else {

            var valueEvent = "e_" + attr.options.urlValue + "_event";
            var valueCategory = "e_" + attr.options.urlValue + "_category";

            var showValueEvent = attr.options.showValue + " Event";
            var showValueCategory = attr.options.showValue + " Category";

            var instructions = [
                "add entity " + showValueCategory,
                "add field Label",
                "add field Color with type color",
                "set field Label required",
                "set field Color required",
                "add entity " + showValueEvent,
                "add field Title",
                "add field Description with type text",
                "add field Place",
                "add field Start date with type datetime",
                "add field End date with type datetime",
                "add field All day with type boolean",
                "add field Category related to " + showValueCategory + " using Label",
                "set field Title required",
                "set field Start date required"
            ];

            // Start doing necessary instruction for component creation
            exportsContext.recursiveInstructionExecute(attr, instructions, 0, function (err) {
                if (err)
                    return callback(err, null);

                // Clear toSync.json because all fields will be created with the entity creation
                // var toSyncFileName = './workspace/'+attr.id_application+'/models/toSync.json';
                // var writeStream = fs.createWriteStream(toSyncFileName);
                // var toSyncObject = {};
                // writeStream.write(JSON.stringify(toSyncObject, null, 4));
                // writeStream.end();
                // writeStream.on('finish', function() {
                // Create the component in newmips database
                db_component.createNewComponentOnModule(attr, function (err, info) {
                    if (err)
                        return callback(err, null);

                    // Link new event entity to component
                    db_entity.addComponentOnEntityByCodeName(valueEvent, info.insertId, attr.id_module, function (err) {
                        // Link new category entity to component
                        db_entity.addComponentOnEntityByCodeName(valueCategory, info.insertId, attr.id_module, function (err) {
                            // Get Data Entity Name needed for structure
                            db_module.getModuleById(attr.id_module, function (err, module) {
                                if (err)
                                    return callback(err, null);
                                attr.options.moduleName = module.codeName;

                                structure_component.newAgenda(attr, function (err) {
                                    if (err)
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

exports.deleteAgenda = function (attr, callback) {

    var exportsContext = this;

    /* If there is no defined name for the module */
    if (typeof attr.options.value === "undefined") {
        attr.options.value = "c_agenda";
        attr.options.urlValue = "agenda";
        attr.options.showValue = "Agenda";
    }

    // Check if component with this name is in this module
    db_component.getComponentByCodeNameInModule(attr.id_module, attr.options.value, attr.options.showValue, function (err, component) {
        if (!component) {
            var err = new Error();
            err.message = "database.component.notFound.notFoundedInModule";
            err.messageParams = [attr.options.showValue, attr.id_module];
            return callback(err, null);
        } else {

            var showValueEvent = attr.options.showValue + " Event";
            var showValueCategory = attr.options.showValue + " Category";

            var instructions = [
                "delete entity " + showValueCategory,
                "delete entity " + showValueEvent,
            ];

            // Start doing necessary instruction for component creation
            exportsContext.recursiveInstructionExecute(attr, instructions, 0, function (err) {
                if (err)
                    return callback(err, null);

                // Create the component in newmips database
                db_component.deleteComponentOnModule(attr.options.value, attr.id_module, function (err, info) {
                    if (err)
                        return callback(err, null);

                    db_module.getModuleById(attr.id_module, function (err, module) {
                        if (err)
                            return callback(err, null);

                        attr.options.moduleName = module.codeName;
                        structure_component.deleteAgenda(attr, function (err) {
                            if (err)
                                return callback(err, null);
                            var info = {
                                message: "database.component.delete.success"
                            };
                            callback(null, info);
                        });
                    });
                });
            });
        }
    });
}

// Component to create a C.R.A module
exports.createNewComponentCra = function (attr, callback) {

    var exportsContext = this;

    // Check if component with this name is already created on this module
    db_module.getModuleById(attr.id_module, function (err, module) {
        if (err)
            return callback(err, null);

        attr.module = module;
        var instructions = [
            "add entity CRA Team",
            "add field Name",
            "set field Name required",
            "entity CRA Team has many preset user using login",
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
        exportsContext.recursiveInstructionExecute(attr, instructions, 0, function (err) {
            if (err)
                return callback(err, null);

            // Add fieldset ID in user entity that already exist so toSync doesn't work
            //var request = "ALTER TABLE `"+attr.id_application+"_e_user` ADD `id_e_cra_team_users` INT DEFAULT NULL;";
            //sequelize.query(request).then(function(){
            structure_component.newCra(attr, function (err, infoStructure) {
                if (err)
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
    if (typeof attr.options.value === "undefined") {
        attr.options.value = "c_print_" + attr.id_data_entity;
        attr.options.urlValue = "print_" + attr.id_data_entity;
        attr.options.showValue = "Print";
    } else {
        attr.options.value = attr.options.value + "_" + attr.id_data_entity;
        attr.options.urlValue = attr.options.urlValue + "_" + attr.id_data_entity;
    }

    // Check if component with this name is already created on this entity
    db_component.checkIfComponentCodeNameExistOnEntity(attr.options.value, attr.id_module, attr.id_data_entity, function (err, alreadyExist) {
        if (err)
            return callback(err, null);
        if (alreadyExist) {
            var err = new Error();
            err.message = "structure.component.error.alreadyExistOnEntity";
            return callback(err, null);
        } else {
            // Get Data Entity Name needed for structure
            db_entity.getDataEntityById(attr.id_data_entity, function (err, sourceEntity) {
                attr.options.source = sourceEntity.codeName;
                attr.options.showSource = sourceEntity.name;
                attr.options.urlSource = attrHelper.removePrefix(sourceEntity.codeName, "entity");
                // Create the component in newmips database
                db_component.createNewComponentOnEntity(attr, function (err, info) {
                    if (err)
                        return callback(err, null);
                    try {
                        // Get module info needed for structure
                        db_module.getModuleById(attr.id_module, function (err, module) {
                            if (err)
                                return callback(err, null);
                            attr.options.moduleName = module.codeName;
                            structure_component.newPrint(attr, function (err) {
                                if (err)
                                    return callback(err, null);

                                callback(null, info);
                            });
                        });
                    } catch (err) {
                        return callback(err, null);
                    }
                });
            });
        }
    });
}

exports.deleteComponentPrint = function (attr, callback) {

    if (typeof attr.options.value === "undefined") {
        attr.options.value = "c_print_" + attr.id_data_entity;
        attr.options.urlValue = "print_" + attr.id_data_entity;
        attr.options.showValue = "Print";
    } else {
        attr.options.value = attr.options.value + "_" + attr.id_data_entity;
        attr.options.urlValue = attr.options.urlValue + "_" + attr.id_data_entity;
    }

    // Check if component with this name is already created on this entity
    db_component.checkIfComponentCodeNameExistOnEntity(attr.options.value, attr.id_module, attr.id_data_entity, function (err, exist) {
        if (err)
            return callback(err, null);
        if (exist) {
            // Get Data Entity Name needed for structure
            db_entity.getDataEntityById(attr.id_data_entity, function (err, sourceEntity) {
                attr.options.source = sourceEntity.codeName;
                attr.options.showSource = sourceEntity.name;
                attr.options.urlSource = attrHelper.removePrefix(sourceEntity.codeName, "entity");
                structure_component.deletePrint(attr, function (err) {
                    if (err)
                        return callback(err, null);
                    db_component.deleteComponentOnEntity(attr.options.value, attr.id_module, sourceEntity.id, function (err, infoDB) {
                        if (err) {
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
        } else {
            var err = new Error();
            err.message = "structure.component.error.notExisting";
            return callback(err, null);
        }
    });
}

exports.createComponentChat = function (attr, callback) {
    structure_component.setupChat(attr, function (err) {
        if (err)
            return callback(err);
        callback(null, {message: 'structure.component.chat.success'});
    });
}

//Create new component address
exports.createNewComponentAddress = function (attr, callback) {
    var componentCodeName = 'c_address_' + attr.id_data_entity;
    if (attr.id_data_entity) {
        db_component.checkIfComponentCodeNameExistOnEntity(componentCodeName, attr.id_module, attr.id_data_entity, function (err, alreadyExist) {
            if (!err) {
                if (!alreadyExist) {
                    db_module.getModuleById(attr.id_module, function (err, module) {
                        if (!err) {
                            db_entity.getDataEntityById(attr.id_data_entity, function (err, entity) {
                                if (!err) {
                                    attr.id_module = module.id;
                                    attr.componentCodeName = componentCodeName;
                                    attr.options.name = attr.options.componentName;
                                    attr.entityCodeName = entity.codeName;
                                    attr.componentCodeName = componentCodeName;
                                    attr.componentName = attr.options.componentName;
                                    attr.moduleName = module.codeName;

                                    var associationOption = {
                                        idApp: attr.id_application,
                                        source: entity.codeName,
                                        target: componentCodeName,
                                        foreignKey: 'fk_id_c_address',
                                        as: 'r_address',
                                        showAs: "",
                                        structureType: "hasOne",
                                        relation: "belongsTo",
                                        toSync: true
                                    };
                                    // Créer le lien belongsTo en la source et la target
                                    structure_data_entity.setupAssociation(associationOption, function () {
                                        db_component.createNewComponentOnEntity(attr, function (err, info) {
                                            if (!err) {
                                                structure_component.addNewComponentAddress(attr, function (err) {
                                                    if (err)
                                                        return callback(err);
                                                    callback(null, {message: 'database.component.create.success', messageParams: ["Adresse", attr.options.componentName || '']});
                                                });
                                            } else
                                                return callback(err);
                                        });
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
    } else {
        var err = new Error();
        err.message = "database.field.error.selectOrCreateBefore";
        return callback(err, null);
    }
}

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
                                            attr.moduleName = module.codeName;
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
}

/************************Create Component Template document***********************/
/**
 *
 * @param {type} attr
 * @param {type} callback
 * @returns {callback}
 */
exports.createComponentDocumentTemplate = function (attr, callback) {
    var componentCodeName = 'c_document_template';
    var entity_code_name = 'e_document_template';
    var component_show_value = "Document template";
    //get Module Administration
    db_module.getModuleByCodename(attr.id_application, 'm_administration', function (err, module) {
        if (!err) {
            if (module) {
                attr.id_module = module.id;
                //check if entity is selected
                if (attr.id_data_entity) {
                    //get entity on which we will add component
                    db_entity.getDataEntityById(attr.id_data_entity, function (err, entity) {
                        if (!err) {
                            /**
                             * Check if component exist On entity,
                             */
                            db_component.checkIfComponentCodeNameExistOnEntity(componentCodeName, entity.id_module, attr.id_data_entity, function (err, alreadyExist) {
                                if (!alreadyExist) {
                                    attr.options.value = componentCodeName;
                                    attr.options.showValue = component_show_value;
                                    db_component.getComponentByCodeNameInModule(attr.id_module, componentCodeName, component_show_value, function (err, component) {
                                        var p = new Promise(function (resolve, reject) {
                                            if (!component) {
                                                //component doesn't exist, so we create it
                                                db_component.createNewComponentOnModule(attr, function (err, info) {
                                                    //now we get It
                                                    db_component.getComponentByCodeNameInModule(attr.id_module, componentCodeName, component_show_value, function (err, component) {
                                                        resolve(component);
                                                    });
                                                });
                                            } else {
                                                //component exists
                                                resolve(component);
                                            }
                                        });
                                        p.then(function (component) {
                                            //add component on entity
                                            component.addDataEntity(attr.id_data_entity).then(function () {
                                                attr.moduleName = module.codeName;
                                                attr.entityName = entity.name;
                                                attr.options.target = componentCodeName;
                                                attr.options.source = entity.codeName;
                                                //check if entity document template exist
                                                db_entity.getIdDataEntityByCodeName(module.id, entity_code_name, function (err, id_entity) {
                                                    var p = new Promise(function (resolve, reject) {
                                                        if (err && err.message === "database.entity.notFound.withThisCodeNameAndModule") {
                                                            //entity Template document not found, we create it
                                                            attr.options.value = entity_code_name;
                                                            attr.options.showValue = component_show_value;
                                                            db_entity.createNewEntity(attr, function (err, info) {
                                                                if (err)
                                                                    reject(err);
                                                                else {
                                                                    //If new, we add structure files(models,route,views etc.)
                                                                    attr.is_new_component_entity = true;
                                                                    resolve(info.insertId);
                                                                }
                                                            });
                                                        } else if (!err) {
                                                            resolve(id_entity);
                                                        } else {
                                                            reject(err);
                                                        }
                                                    });
                                                    p.then(function (id_entity) {
                                                        attr.id_entity = id_entity;
                                                        /**
                                                         * Now add entity e_document_template files(models,views,routes)
                                                         */
                                                        structure_component.createComponentDocumentTemplate(attr, function (err) {
                                                            if (err)
                                                                return callback(err);
                                                            else
                                                                return callback(null, {message: 'database.component.create.success',
                                                                    messageParams: ["document template", ""]});
                                                        });
                                                    }).catch(function (e) {
                                                        return callback(e);
                                                    });
                                                });
                                            }).catch(function (e) {
                                                return callback(e);
                                            });
                                        }).catch(function (e) {
                                            return callback(err);
                                        });
                                    });
                                } else {
                                    var err = new Error();
                                    err.message = "structure.component.error.alreadyExistOnEntity";
                                    return callback(err, null);
                                }
                            });
                        } else
                            return callback(err);
                    });
                } else {
                    var err = new Error();
                    err.message = "database.field.error.selectOrCreateBefore";
                    return callback(err, null);
                }
            } else {
                /**Reject. We need module Administration to continue**/
                var err = new Error();
                err.message = "database.module.notFound";
                return callback(err);
            }
        } else
            return callback(err);
    });
};

/**
 *
 * @param {type} attr
 * @param {type} callback
 */
exports.deleteComponentDocumentTemplate = function (attr, callback) {
    var componentName = "c_document_template";
    if (attr.id_data_entity) {
        db_entity.getDataEntityById(attr.id_data_entity, function (err, entity) {
            if (!err) {
                attr.entityName = entity.codeName;
                db_component.checkIfComponentCodeNameExistOnEntity(componentName, entity.id_module, attr.id_data_entity, function (err, componentExist) {
                    if (!err) {
                        if (componentExist) {
                            //Get module administration where is component entity
                            db_module.getModuleByCodename(attr.id_application, 'm_administration', function (err, module) {
                                if (!err) {
                                    //Delete juste association
                                    db_component.deleteComponentAndEntityAssociation(componentName, module.id, attr.id_data_entity, function (err, info) {
                                        if (!err) {
                                            //Delete tab on entity
                                            structure_component.deleteComponentDocumentTemplateOnEntity(attr, function (err) {
                                                if (err)
                                                    return callback(err);
                                                else {
                                                    //delete the component files if no entity doesn't contain it, so we check it before
                                                    db_component.checkIfComponentCodeNameExistOnAnEntity(componentName, module.id, function (err, exist) {
                                                        if (!err) {
                                                            if (exist) {
                                                                //If another entity have this component whe don't delete files
                                                                return callback(null, {message: 'database.component.delete.success'});
                                                            } else {
                                                                //If not, we delete component files:model,route,views,...
                                                                db_entity.deleteDataEntity({id_module: module.id, show_name_data_entity: "document template", name_data_entity: 'e_document_template'}, function () {
                                                                    // We drop component entity table
                                                                    database.dropDataEntity(attr.id_application, 'e_document_template', function (err) {
                                                                        if (err)
                                                                            return callback(err);
                                                                        else {
                                                                            db_component.deleteComponentByCodeNameInModule("c_document_template", module.id, function () {
                                                                                if (!err) {
                                                                                    structure_component.deleteComponentDocumentTemplate(attr, function (err) {
                                                                                        //delete upload files ?
                                                                                        callback(err, {message: 'database.component.delete.success'});
                                                                                    });
                                                                                } else {
                                                                                    return callback(err);
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                });
                                                            }
                                                        } else
                                                            return callback(err);
                                                    });
                                                }
                                            });
                                        } else
                                            return callback(err);
                                    });
                                } else
                                    return callback(err);
                            });
                        } else {
                            var err = new Error();
                            err.message = "database.component.notFound.notFoundedOnEntity";
                            err.messageParams = ["document template", attr.id_data_entity];
                            return callback(err, null);
                        }
                    } else
                        return callback(err);
                });
            } else
                return callback(err);
        });
    } else {
        var err = new Error();
        err.message = "database.field.error.selectOrCreateBefore";
        return callback(err, null);
    }
};

/* --------------------------------------------------------------- */
/* -------------------------- INTERFACE -------------------------- */
/* --------------------------------------------------------------- */
exports.setLogo = function (attr, callback) {
    structure_ui.setLogo(attr, function (err, infoStructure) {
        if (err)
            return callback(err, null);
        callback(null, infoStructure);
    });
}

exports.removeLogo = function (attr, callback) {
    structure_ui.removeLogo(attr, function (err, infoStructure) {
        if (err)
            return callback(err, null);
        callback(null, infoStructure);
    });
}

exports.setLayout = function (attr, callback) {
    db_module.getModuleById(attr.id_module, function (err, currentModule) {
        if (err)
            return callback(err, null);
        attr.currentModule = currentModule;
        structure_ui.setLayout(attr, function (err, infoStructure) {
            if (err)
                return callback(err, null);
            callback(null, infoStructure);
        });
    });
}

exports.listLayout = function (attr, callback) {
    structure_ui.listLayout(attr, function (err, infoStructure) {
        if (err)
            return callback(err, null);

        callback(null, infoStructure);
    });
}

exports.setTheme = function (attr, callback) {
    structure_ui.setTheme(attr, function (err, infoStructure) {
        if (err)
            return callback(err, null);

        callback(null, infoStructure);
    });
}

exports.listTheme = function (attr, callback) {
    structure_ui.listTheme(attr, function (err, infoStructure) {
        if (err)
            return callback(err, null);

        callback(null, infoStructure);
    });
}

exports.listIcon = function (attr, callback) {
    callback(null, {
        message: "structure.ui.icon.list",
        messageParams: ['http://fontawesome.io/icons']
    });
}

exports.setIcon = function (attr, callback) {
    db_entity.getDataEntityById(attr.id_data_entity, function (err, entity) {
        if (err)
            return callback(err);
        db_module.getModuleById(entity.id_module, function (err, module) {
            if (err)
                return callback(err);

            attr.module = module;
            attr.entity = entity;
            structure_ui.setIcon(attr, function (err, info) {
                if (err)
                    return callback(err);
                callback(null, info);
            });
        });
    });
}

exports.setIconToEntity = function (attr, callback) {
    db_entity.getDataEntityByName(attr.entityTarget, attr.id_module, function (err, entity) {
        if (err)
            return callback(err);
        db_module.getModuleById(entity.id_module, function (err, module) {
            if (err)
                return callback(err);

            attr.module = module;
            attr.entity = entity;
            structure_ui.setIcon(attr, function (err, info) {
                if (err)
                    return callback(err);
                callback(null, info);
            });
        });
    });
}

exports.createWidgetLastRecords = function (attr, callback) {
    var entityDbFunction = '', param = '';
    if (attr.entityTarget) {
        db_entity.getDataEntityByName(attr.entityTarget, attr.id_module, function (err, entity) {
            if (err)
                return callback(err);
            withDataEntity(entity);
        });
    } else {
        db_entity.getDataEntityById(attr.id_data_entity, function (err, entity) {
            if (err)
                return callback(err);
            withDataEntity(entity);
        });
    }

    function withDataEntity(entity) {
        db_module.getModuleById(entity.id_module, function (err, module) {
            if (err)
                return callback(err);
            attr.entity = entity;
            attr.module = module;

            db_field.getCodeNameByNameArray(attr.columns, entity.id, function (err, columns) {
                if (err)
                    return callback(err);

                console.log("COLUMNS FOUND FOR ENTITY ID : " + entity.id);
                console.log(columns);
                console.log("COLUMNS PROVIDED IN INSTRUCTION :");
                console.log(attr.columns);
                // Check for not found fields and build error message
                if (attr.columns.length != columns.length) {
                    var notFound = [];
                    for (var k = 0; k < attr.columns.length; k++) {
                        var kFound = false;
                        for (var i = 0; i < columns.length; i++) {
                            if (attr.columns[k].toLowerCase() == columns[i].name.toLowerCase()) {
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
                structure_ui.createWidgetLastRecords(attr, function (err, info) {
                    if (err)
                        return callback(err);
                    callback(null, info);
                });
            });

        });
    }
}

exports.createWidgetOnEntity = function (attr, callback) {
    db_entity.getDataEntityByName(attr.entityTarget, attr.id_module, function (err, entity) {
        if (err)
            return callback(err);
        attr.id_data_entity = entity.id;
        createWidget(attr, callback);
    });
}

function createWidget(attr, callback) {
    if (attr.widgetType == -1)
        return callback(null, {message: "structure.ui.widget.unknown", messageParams: [attr.widgetInputType]});
    db_entity.getDataEntityById(attr.id_data_entity, function (err, entity) {
        if (err)
            return callback(err);
        db_module.getModuleById(entity.id_module, function (err, module) {
            if (err)
                return callback(err);

            attr.module = module;
            attr.entity = entity;
            structure_ui.createWidget(attr, function (err, info) {
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
    db_entity.getDataEntityByName(attr.entityTarget, attr.id_module, function (err, entity) {
        if (err)
            return callback(err);
        db_module.getModuleById(entity.id_module, function (err, module) {
            if (err)
                return callback(err);

            attr.module = module;
            attr.entity = entity;

            structure_ui.deleteWidget(attr, function (err, info) {
                if (err)
                    return callback(err);
                callback(null, info);
            });
        });
    });
}
exports.deleteWidget = deleteWidget;

function deleteEntityWidgets(attr, callback) {
    attr.widgetTypes = ['info', 'stats', 'lastrecords'];
    deleteWidget(attr, function (err) {
        if (err)
            return callback(err);
        callback(null, {message: "structure.ui.widget.all_deleted", messageParams: [attr.entityTarget]});
    });
}
exports.deleteEntityWidgets = deleteEntityWidgets;

return designer;
