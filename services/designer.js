// Newmips Database
const db_project = require("../database/project");
const db_application = require("../database/application");
const db_module = require("../database/module");
const db_entity = require("../database/data_entity");
const db_field = require("../database/data_field");
const db_component = require("../database/component");
const database = require("../database/database");

// Session
const session = require("./session");

// Bot grammar
let bot = require('../services/bot.js');

// Structure files
let structure_application = require("../structure/structure_application");
let structure_module = require("../structure/structure_module");
let structure_entity = require("../structure/structure_entity");
let structure_field = require("../structure/structure_field");
let structure_component = require("../structure/structure_component");
let structure_ui = require("../structure/structure_ui");

// Utils
let helpers = require("../utils/helpers");
let dataHelper = require("../utils/data_helper");
let gitHelper = require("../utils/git_helper");
let translateHelper = require("../utils/translate");

// Others
const fs = require('fs-extra');
const models = require('../models/');
const sequelize = models.sequelize;
const cloud_manager = require('../services/cloud_manager');

// Metadata
const metadata = require('../database/metadata')();
const Application = require('../database/application_v2');

/* --------------------------------------------------------------- */
/* -------------------------- General ---------------------------- */
/* --------------------------------------------------------------- */

// Execute an array of newmips instructions
exports.recursiveInstructionExecute = async (recursiveData, instructions, idx) => {
    let exportsContext = this;
    // Create the attr obj
    let data = bot.parse(instructions[idx]);
    if (data.error)
        throw data.error;

    // Rework the attr obj
    data = dataHelper.reworkData(data);

    data.application = recursiveData.application;
    data.module_name = recursiveData.module_name;
    data.entity_name = recursiveData.entity_name;

    // Execute the designer function
    let info = await this[data.function](data);
    session.setSessionObj(data, info);

    idx += 1;
    if (instructions.length == idx)
        return info;

    return await exportsContext.recursiveInstructionExecute(data, instructions, idx);
}

exports.help = (attr, callback) => {
    session.help(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.showSession = (attr, callback) => {
    session.showSession(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.deploy = (attr, callback) => {
    db_application.getCodeNameApplicationById(attr.id_application, (err, codeName) => {
        if (err)
            return callback(err, null);

        attr.appCodeName = codeName;
        cloud_manager.deploy(attr, (err, info) => {
            if (err)
                return callback(err, null);
            callback(null, info);
        });
    });
}

exports.restart = (attr, callback) => {
    var info = {
        message: "structure.global.restart.success"
    };
    callback(null, info);
}

exports.installNodePackage = (attr, callback) => {
    structure_application.installAppModules(attr).then(function () {
        var info = {
            message: "structure.global.npmInstall.success"
        };
        callback(null, info);
    });
}

/* --------------------------------------------------------------- */
/* --------------------------- Git ------------------------------- */
/* --------------------------------------------------------------- */

exports.gitPush = (attr, callback) => {
    gitHelper.gitPush(attr, function (err, infoGit) {
        if (err)
            return callback(err, null);
        var info = {};
        info.message = "structure.global.gitPush.success";
        callback(null, info);
    });
}

exports.gitPull = (attr, callback) => {
    gitHelper.gitPull(attr, function (err, infoGit) {
        if (err)
            return callback(err, null);
        var info = {};
        info.message = "structure.global.gitPull.success";
        callback(null, info);
    });
}

exports.gitCommit = (attr, callback) => {
    gitHelper.gitCommit(attr, function (err, infoGit) {
        if (err)
            return callback(err, null);
        var info = {};
        info.message = "structure.global.gitCommit.success";
        callback(null, info);
    });
}

exports.gitStatus = (attr, callback) => {
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
/* ----------------------- Application --------------------------- */
/* --------------------------------------------------------------- */
exports.selectApplication = (attr, callback) => {
    let exportsContext = this;
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

exports.createNewApplication = async (data) => {

    const existingApp = await models.Application.findOne({
        where: {
            codeName: data.options.value
        }
    });

    if (existingApp) {
        let err = new Error("database.application.alreadyExist");
        err.messageParams = [data.options.showValue];
        throw err;
    }

    // Generator DB
    const dbApp = await models.Application.create({
        displayName: data.options.showValue,
        codeName: data.options.value
    });

    // Metadata
    const newApp = new Application(data.options.value);

    // If connected user is admin, then add only him. If not, add admin and current user
    let userToAdd = data.currentUser.id == 1 ? 1 : [1, data.currentUser.id];
    await dbApp.addUser(userToAdd);

    let gitlabRepo = await structure_application.setupApplication(data);

    // Set gitlab project ID
    if(gitlabRepo)
        newApp.gitlabID = gitlabRepo.id;

    // Save metadata in application
    newApp.save();

    return {
        application: newApp,
        message: "database.application.create.success",
        messageParams: [newApp.name]
    };
}

exports.listApplication = (attr, callback) => {
    db_application.listApplication(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

// Declare this function not directly within exports to be able to use it from deleteApplicationRecursive()
function deleteApplication(attr, callback) {
    function doDelete(id_application) {
        db_application.checkAccess(attr).then(hasAccess => {
            if(!hasAccess){
                let err = new Error("You do not have access to this application, you cannot delete it.")
                return callback(err, null);
            }

            structure_application.deleteApplication(id_application, function (err, infoStructure) {
                if (err)
                    return callback(err, null);

                var request = "";
                if(sequelize.options.dialect == "mysql")
                    request = "SHOW TABLES LIKE '" + id_application + "_%';";
                else if(sequelize.options.dialect == "postgres")
                    request = "SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema' AND tablename LIKE '" + id_application + "_%'";

                sequelize.query(request).spread(function (results, metada) {
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
                        var request = "";
                        if(sequelize.options.dialect == "mysql")
                            request += "SET FOREIGN_KEY_CHECKS=0;";

                        for (var i = 0; i < results.length; i++) {
                            for (var prop in results[i]) {
                                // Postgres additionnal check
                                if(typeof results[i][prop] == "string" && results[i][prop].indexOf(id_application + "_") != -1){
                                    // For each request disable foreign key checks, drop table. Foreign key check
                                    // last only for the time of the request
                                    if(sequelize.options.dialect == "mysql")
                                        request += "DROP TABLE " + results[i][prop] + ";";
                                    if(sequelize.options.dialect == "postgres")
                                        request += "DROP TABLE \"" + results[i][prop] + "\" CASCADE;";
                                }
                            }
                        }

                        if(sequelize.options.dialect == "mysql")
                            request += "SET FOREIGN_KEY_CHECKS=1;";

                        sequelize.query(request).then(function () {
                            callback(null, infoDB);
                        }).catch(function(err){
                            console.error("ERROR ERR: "+err.message);
                            console.error("ERROR SQL: "+err.original.sql);
                            callback(null, infoDB);
                        })
                    })
                })
            })
        })
    }
    if (isNaN(attr.options.showValue))
        db_application.getIdApplicationByCodeName(attr.options.value, attr.options.showValue, function (err, id_application) {
            if (err)
                return callback(err, null);
            doDelete(id_application);
        })
    else {
        doDelete(attr.options.showValue);
    }
}
exports.deleteApplication = deleteApplication;

function deleteApplicationRecursive(appIds, currentUser, idx) {
    return new Promise(function (resolve, reject) {
        if (!appIds[idx])
            return resolve();

        var attr = {
            options: {
                value: appIds[idx],
                showValue: appIds[idx]
            },
            currentUser: currentUser
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
exports.selectModule = (attr, callback) => {
    db_module.selectModule(attr, function (err, infoDB) {
        if (err)
            return callback(err, null);
        callback(null, infoDB);
    });
}

exports.createNewModule = async (data) => {

    if(data.application.getModule(data.options.value)){
        let err = new Error("database.module.create.alreadyExist");
        err.messageParams = [data.options.showValue];
        return callback(err);
    }

    const np_module = data.application.addModule(data.options.value);

    // Assign list of existing application modules
    // Needed to recreate the dropdown list of modules in the interface
    data.modules = data.application.modules;

    // Structure
    await structure_module.setupModule(data)

    return {
        module: np_module,
        message: "database.module.create.success",
        messageParams: [data.options.showValue, data.options.showValue]
    };
}

exports.listModule = (attr, callback) => {
    db_module.listModule(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

exports.deleteModule = (attr, callback) => {
    var moduleName = attr.options.showValue;
    if (moduleName.toLowerCase() == 'home') {
        var err = new Error("structure.module.error.notHome");
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
exports.selectEntity = async (data) => {

    let {np_module, entity} = data.application.findEntity(data.options.value, true);
    data.module = np_module;
    data.doRedirect = await structure_field.selectEntity(data);

    return {
        entity: entity,
        module: np_module,
        doRedirect: data.doRedirect,
        message: "database.entity.select.selected",
        messageParams: [entity.name]
    }
}

exports.createNewEntity = async (data) => {

    data.np_module = data.application.getModule(data.module_name, true);

    if (data.np_module.getEntity(data.options.value)) {
        let err = new Error('database.entity.create.alreadyExist');
        err.messageParams = [data.options.showValue];
        throw err;
    }

    let entity = data.np_module.addEntity(data.options.value);

    await structure_entity.setupEntity(data);

    return {
        entity: entity,
        message: "database.entity.create.success",
        messageParams: [entity.name, data.module_name, entity.name]
    };
}

exports.listDataEntity = (attr, callback) => {
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
            if (err)
                return callback(err, null);

            // Delete entity relations
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
                            if(tmpAttrIn.options && tmpAttrIn.options.value != '' && tmpAttrIn.options.value.indexOf('r_history_') != -1){
                                let statusName = tmpAttrIn.options.value.split('r_history_')[1];
                                deleteComponentStatus({
                                    id_application: tmpAttrIn.id_application,
                                    id_data_entity: tmpAttrIn.id_data_entity,
                                    options: {
                                        value : "s_"+statusName,
                                        urlValue: statusName,
                                        showValue: statusName
                                    }
                                }, err => {
                                    if (err)
                                        console.error(err);
                                    clbk();
                                });
                            } else {
                                deleteTab(tmpAttrIn, err => {
                                    if (err)
                                        console.error(err);
                                    clbk();
                                });
                            }
                        } else if (tmpAttrIn.structureType == "relatedToMultiple" || tmpAttrIn.structureType == "relatedToMultipleCheckbox") {
                            tmpAttrIn.options.value = "f_" + tmpAttrIn.options.value.substring(2);
                            deleteDataField(tmpAttrIn, function (err) {
                                if (err)
                                    console.error(err);
                                clbk();
                            });
                        } else {
                            console.warn("WARNING - Unknown option to delete !");
                            console.warn(tmpAttrIn);
                            clbk();
                        }
                    }, arg: tmpAttr});
                }
                else if (entityOptions[i].relation == 'belongsToMany') {
                    promises.push({
                        func: function(tableName, clbk) {
                            database.dropTable(tableName, function(err) {
                                if (err)
                                    console.error("Unable to delete junction table "+tableName);
                                clbk();
                            })
                        },
                        arg: entityOptions[i].through
                    })
                }
            }

            // Delete relation comming from other entities
            fs.readdirSync(workspacePath + '/models/options/').filter(function (file) {
                return file.indexOf('.') !== 0 && file.slice(-5) === '.json' && file.slice(0, -5) != name_data_entity;
            }).forEach(function (file) {
                let source = file.slice(0, -5);
                let options = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + file));

                // Look for auto_generate key targeting deleted entity and remove them
                let idxToRemove = [];
                for (let i = 0; i < options.length; i++) {
                    if (options[i].target != name_data_entity)
                        continue;
                    if (options[i].structureType == 'auto_generate')
                        idxToRemove.push(i);
                }
                options = options.filter((val, idx, arr) => {
                    return idxToRemove.indexOf(idx) == -1
                })
                fs.writeFileSync(workspacePath + '/models/options/' + file, JSON.stringify(options, null, 4), 'utf8')

                for (let i = 0; i < options.length; i++) {
                    if (options[i].target != name_data_entity)
                        continue;

                    if (options[i].relation == 'hasMany') {
                        let tmpAttr = {
                            options: {
                                value: options[i].as,
                                urlValue: options[i].as.substring(2)
                            },
                            id_project: attr.id_project,
                            id_application: attr.id_application,
                            id_module: attr.id_module,
                            structureType: options[i].structureType
                        };

                        promises.push({
                            func: function(tmpAttrIn, clbk) {
                                db_entity.getIdDataEntityByCodeName(attr.id_module, source, function(err, sourceID) {
                                    tmpAttrIn.id_data_entity = sourceID;
                                    if (tmpAttrIn.structureType == "hasMany" || tmpAttrIn.structureType == "hasManyPreset") {
                                        deleteTab(tmpAttrIn, function(err) {
                                            if (err)
                                                console.error(err);
                                            clbk();
                                        });
                                    } else if (tmpAttrIn.structureType == "relatedToMultiple" || tmpAttrIn.structureType == "relatedToMultipleCheck") {
                                        tmpAttrIn.options.value = "f_" + tmpAttrIn.options.value.substring(2);
                                        deleteDataField(tmpAttrIn, function(err) {
                                            if (err)
                                                console.error(err);
                                            clbk();
                                        });
                                    } else {
                                        console.warn("WARNING - Unknown option to delete !");
                                        console.warn(tmpAttrIn);
                                        clbk();
                                    }
                                });
                            },
                            arg: tmpAttr
                        });
                    }
                    else if (options[i].relation == 'belongsTo') {
                        let tmpAttr = {
                            options: {
                                value: options[i].as,
                                urlValue: options[i].as.substring(2)
                            },
                            id_project: attr.id_project,
                            id_application: attr.id_application,
                            id_module: attr.id_module,
                            structureType: options[i].structureType
                        };

                        promises.push({
                            func: function(tmpAttrIn, clbk) {
                                db_entity.getIdDataEntityByCodeName(attr.id_module, source, function(err, sourceID) {
                                    tmpAttrIn.id_data_entity = sourceID;
                                    if (tmpAttrIn.structureType == "relatedTo") {
                                        tmpAttrIn.options.value = "f_" + tmpAttrIn.options.value.substring(2);
                                        deleteDataField(tmpAttrIn, function(err) {
                                            if (err)
                                                console.error(err);
                                            clbk();
                                        });
                                    } else if (tmpAttrIn.structureType == "hasOne") {
                                        deleteTab(tmpAttrIn, function(err) {
                                            if (err)
                                                console.error(err);
                                            clbk();
                                        });
                                    } else {
                                        console.warn("WARNING - Unknown option to delete !");
                                        console.warn(tmpAttrIn);
                                        clbk();
                                    }
                                });
                            },
                            arg: tmpAttr
                        });
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
                                structure_entity.deleteDataEntity(id_application, name_module, name_data_entity, url_name_data_entity, function () {
                                    infoDB.deletedEntityId = entityId;
                                    callback(null, infoDB);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}
exports.deleteDataEntity = deleteDataEntity;

/* --------------------------------------------------------------- */
/* --------------------------- Field ----------------------------- */
/* --------------------------------------------------------------- */
exports.createNewDataField = async (data) => {

    data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

    if (data.entity.getField(data.options.value)) {
        let err = new Error('database.field.error.alreadyExist');
        err.messageParams = [data.options.showValue];
        throw err;
    }

    data.entity.addField(data.options.value);
    await structure_field.setupField(data);

    return {
        message: "database.field.create.created",
        messageParams: [data.options.showValue, data.entity_name, data.options.showValue, data.options.showValue, data.options.showValue]
    };
}

async function deleteTab(data) {
    data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

    let {fk, target, tabType} = await structure_field.deleteTab(data);

    data.fieldToDrop = fk;
    data.name_data_entity = target;

    await database.dropFKDataField(data);

    return {
        tabType: tabType,
        message: 'structure.association.deleteTab',
        messageParams: [data.options.showValue]
    };
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
                structure_field.deleteDataField(attr, function (err, infoStructure) {
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

exports.listDataField = (attr, callback) => {
    db_field.listDataField(attr, function (err, info) {
        if (err)
            return callback(err, null);
        callback(null, info);
    });
}

/* --------------------------------------------------------------- */
/* ---------------------- Field Attributes ----------------------- */
/* --------------------------------------------------------------- */

exports.setFieldKnownAttribute = async (data) => {

    let wordParam = data.options.word.toLowerCase();
    let requiredAttribute = ["mandatory", "required", "obligatoire", "optionnel", "non-obligatoire", "optional"];
    let uniqueAttribute = ["unique", "not-unique", "non-unique"];

    data.field = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true).getField(data.options.value);

    // Standard field not found, looking for related to field
    if (!data.field) {
        let optionsArray = JSON.parse(fs.readFileSync(__dirname + '/../workspace/' + data.application.name + '/models/options/' + data.entity_name + '.json'));
        for (let i = 0; i < optionsArray.length; i++) {
            if (optionsArray[i].showAs == data.options.showValue) {
                if (optionsArray[i].structureType == "relatedTo") {
                    // We need the key in DB to set it unique instead of the client side name of the field
                    if (uniqueAttribute.indexOf(wordParam) != -1)
                        data.options.value = optionsArray[i].foreignKey;
                } else if (optionsArray[i].structureType == "relatedToMultiple" || optionsArray[i].structureType == "relatedToMultipleCheckbox") {
                    if (uniqueAttribute.indexOf(wordParam) != -1)
                        throw new Error("structure.field.attributes.notUnique4RelatedToMany");
                    else
                        data.structureType = optionsArray[i].structureType;
                }
                break;
            }
        }
    }

    // Check the attribute asked in the instruction
    if (requiredAttribute.indexOf(wordParam) != -1) {
        // Get DB SQL type needed to Alter Column
        let {sqlDataType, sqlDataTypeLength} = await database.getDatabaseSQLType({
            table: data.entity_name,
            column: data.options.value
        });

        data.sqlDataType = sqlDataType;
        data.sqlDataTypeLength = sqlDataTypeLength;
        data.dialect = sequelize.options.dialect;

        await structure_field.setRequiredAttribute(data);

        return {
            message: "structure.field.attributes.successKnownAttribute",
            messageParams: [data.options.showValue, data.options.word]
        }
    } else if (uniqueAttribute.indexOf(wordParam) != -1) {

        let sourceEntity = data.entity_name;
        let constraintName = sourceEntity + "_" + data.options.value + "_unique";

        let possibilityUnique = ["unique"];
        let possibilityNotUnique = ["not-unique", "non-unique"];

        let request = "";

        // Get application database, it won't be newmips if seperate DB
        let appDBConf = require(__dirname+'/../workspace/' + data.application.name + '/config/database.js');

        // Add or remove the unique constraint ?
        if(sequelize.options.dialect == "mysql"){
            if (possibilityUnique.indexOf(wordParam) != -1) {
                request = "ALTER TABLE `" + appDBConf.database + "`.`" + sourceEntity + "` ADD CONSTRAINT " + constraintName + " UNIQUE (`" + data.options.value + "`);";
            } else if (possibilityNotUnique.indexOf(wordParam) != -1) {
                request = "ALTER TABLE `" + appDBConf.database + "`.`" + sourceEntity + "` DROP INDEX `" + constraintName + "`;";
            }
        } else if (sequelize.options.dialect == "postgres"){
            if (possibilityUnique.indexOf(wordParam) != -1) {
                request = "ALTER TABLE \"" + appDBConf.database + "\".\"" + sourceEntity + "\" ADD CONSTRAINT \"" + constraintName + "\" UNIQUE (" + data.options.value + ");";
            } else if (possibilityNotUnique.indexOf(wordParam) != -1) {
                request = "ALTER TABLE \"" + appDBConf.database + "\".\"" + sourceEntity + "\" DROP INDEX \"" + constraintName + "\";";
            }
        }

        try {
            await sequelize.query(request);
        } catch(err) {
            if (typeof err.parent !== "undefined" && (err.parent.errno == 1062 || err.parent.code == 23505)) {
                throw new Error('structure.field.attributes.duplicateUnique');
            } else if(typeof err.parent !== "undefined" && (err.parent.errno == 1146 || err.parent.code == "42P01")){
                // Handle case by Newmips, no worry about this one
                if(['e_group', 'e_role', 'e_user'].indexOf(data.entity_name) == -1 && data.options.showValue == 'label'){
                    // Table do not exist - In case of script it's totally normal, just generate a warning
                    console.warn("WARNING - The database unique constraint on '"+data.options.showValue+"' could not be applied, the corresponding table '"+sourceEntity+"' does not exist at the time of the instruction.");
                }
                structure_field.setUniqueField(data);

                return {
                    message: "structure.field.attributes.successKnownAttributeWarning",
                    messageParams: [data.options.showValue, data.options.word]
                };
            } else {
                throw err;
            }
        }

        structure_field.setUniqueField(data);

        return {
            message: "structure.field.attributes.successKnownAttribute",
            messageParams: [data.options.showValue, data.options.word]
        }

    } else {
        let err = new Error("structure.field.attributes.notUnderstandGiveAvailable");
        let msgParams = "";
        for (let i = 0; i < requiredAttribute.length; i++) {
            msgParams += "-  " + requiredAttribute[i] + "<br>";
        }
        for (let j = 0; j < uniqueAttribute.length; j++) {
            msgParams += "-  " + uniqueAttribute[j] + "<br>";
        }
        err.messageParams = [msgParams];
        throw err;
    }
}

exports.setFieldAttribute = (attr, callback) => {
    db_entity.getDataEntityById(attr.id_data_entity, function (err, dataEntity) {
        if (err)
            return callback(err, null);

        attr.name_data_entity = dataEntity.codeName;

        structure_field.setFieldAttribute(attr, function (err) {
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

exports.setColumnVisibility = (attr, callback) => {

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
exports.createNewHasOne = async (data) => {

    /* Check if entity source exist before doing anything */
    let sourceEntity = data.application.findEntity(data.options.source, true);
    data.np_module = sourceEntity.np_module;
    data.source_entity = sourceEntity.entity;

    var answer = {};
    var toSync = true;
    let constraints = true;

    let target_entity = data.application.findEntity(data.options.target);

    // Target entity does not exist -> Subentity generation
    if(!target_entity) {
        target_entity = data.np_module.addEntity(data.options.target);

        answer.message = "structure.association.hasMany.successSubEntity";
        answer.messageParams = [data.options.showAs, data.options.showSource, data.options.showSource, data.options.showAs];

        // Subentity code generation
        await structure_entity.setupEntity(data)
    } else {
        answer.message = "structure.association.hasOne.successEntity";
        answer.messageParams = [data.options.showAs, data.options.showSource, data.options.showSource, data.options.showAs];
    }

    // Check already existing relation from source to target
    let sourceOptionsPath = __dirname+'/../workspace/' + data.application.name + '/models/options/' + data.options.source + '.json';
    let optionsSourceObject = JSON.parse(fs.readFileSync(sourceOptionsPath));
    let saveFile = false;

    // Checking relation existence from source to target
    for (var i = 0; i < optionsSourceObject.length; i++) {
        if (optionsSourceObject[i].target == data.options.target) {
            // If alias already used
            if (data.options.as == optionsSourceObject[i].as){
                if(optionsSourceObject[i].structureType == "auto_generate") {
                    // Remove auto generate key by the generator
                    optionsSourceObject.splice(i, 1);
                    saveFile = true;
                } else {
                    throw new Error('structure.association.error.alreadySameAlias');
                }
            }
        } else if(data.options.as == optionsSourceObject[i].as){
            let err = new Error('database.field.error.alreadyExist');
            err.messageParams = [data.options.showAs];
            throw err;
        }
    }

    // Changes to be saved, remove auto_generate key
    if(saveFile)
        fs.writeFileSync(sourceOptionsPath, JSON.stringify(optionsSourceObject, null, 4), "utf8");

    // Check already existing relation from target to source
    let optionsFile = fs.readFileSync(__dirname+'/../workspace/' + data.application.name + '/models/options/' + data.options.target + '.json');
    let targetOptionsObject = JSON.parse(optionsFile);

    for (let i = 0; i < targetOptionsObject.length; i++) {
        if (targetOptionsObject[i].target == data.options.source && targetOptionsObject[i].relation != "hasMany" && targetOptionsObject[i].relation != "belongsToMany") {
            // Remove constraint to accept circular belongsTo
            constraints = false;
        } else if (data.options.source != data.options.target
                && (targetOptionsObject[i].target == data.options.source && targetOptionsObject[i].relation == "hasMany")
                && (targetOptionsObject[i].foreignKey == data.options.foreignKey)) {
            // We avoid the toSync to append because the already existing has many relation has already created the foreing key in BDD
            toSync = false;
        }

        if (data.options.source != data.options.target
                && (targetOptionsObject[i].target == data.options.source && targetOptionsObject[i].relation == "hasMany")
                && (targetOptionsObject[i].foreignKey == data.options.foreignKey)) {
            // We avoid the toSync to append because the already existing has many relation has already created the foreing key in BDD
            toSync = false;
        }
    }

    // Add the foreign key reference in generator database
    let associationOption = {
        application: data.application,
        source: data.options.source,
        target: data.options.target,
        foreignKey: data.options.foreignKey,
        as: data.options.as,
        relation: "belongsTo",
        through: null,
        toSync: toSync,
        type: "hasOne",
        constraints: constraints
    };

    let reversedOption = {
        application: data.application,
        source: data.options.target,
        target: data.options.source,
        foreignKey: data.options.foreignKey,
        as: "r_"+data.options.source.substring(2),
        relation: "hasMany",
        type: "auto_generate",
        constraints: constraints
    };

    // Create belongsTo association between source and target
    structure_entity.setupAssociation(associationOption);
    // Create the opposite hasMany association
    structure_entity.setupAssociation(reversedOption);

    // Generator tabulation in display
    await structure_field.setupHasOneTab(data);

    return {
        ...answer,
        entity: data.source_entity
    };
}

async function belongsToMany(data, optionObj, setupFunction, exportsContext) {

    data.options.through = data.application.associationSeq + "_" + data.options.source + "_" + data.options.target;
    let through = data.options.through;

    try {
        /* First we have to save the already existing data to put them in the new relation */
        let workspaceData = await database.retrieveWorkspaceHasManyData(data.application.name, dataHelper.capitalizeFirstLetter(data.options.source), optionObj.foreignKey);
        structure_field.saveHasManyData(data, workspaceData, optionObj.foreignKey);
    } catch (err) {
        if(err.original && err.original.code == 'ER_NO_SUCH_TABLE')
            console.warn('BelongsToMany generation => Cannot retrieve already existing data, the table do no exist.');
        else
            throw err;
    }

    /* Secondly we have to remove the already existing has many to create the belongs to many relation */
    let instructions = [
        "select entity " + data.options.showTarget
    ];

    let setRequired = false;

    if (optionObj.structureType == "relatedToMultiple" || optionObj.structureType == "relatedToMultipleCheckbox") {
        instructions.push("delete field " + optionObj.as.substring(2));
        // If related to is required, then rebuilt it required
        if(optionObj.allowNull === false)
            setRequired = true;
    } else {
        instructions.push("delete tab " + optionObj.as.substring(2));
    }

    // Start doing necessary instruction for component creation
    let infoInstruction = await exportsContext.recursiveInstructionExecute(data, instructions, 0);

    if (typeof infoInstruction.tabType !== "undefined")
        data.targetType = infoInstruction.tabType;
    else
        data.targetType = optionObj.structureType;
    /* Then lets create the belongs to many association */

    /* We need the same alias for both relation */
    //data.options.as = "r_"+data.options.source.substring(2)+ "_" + data.options.target.substring(2);

    let associationOptionOne = {
        application: data.application,
        source: data.options.source,
        target: data.options.target,
        foreignKey: data.options.foreignKey,
        as: data.options.as,
        showAs: data.options.showAs,
        relation: "belongsToMany",
        through: through,
        toSync: false,
        type: data.targetType,
        usingField: data.options.usingField || undefined,
    };

    structure_entity.setupAssociation(associationOptionOne);

    let associationOptionTwo = {
        application: data.application,
        source: data.options.target,
        target: data.options.source,
        foreignKey: data.options.foreignKey,
        as: optionObj.as,
        showAs: optionObj.showAs,
        relation: "belongsToMany",
        through: through,
        toSync: false,
        type: data.targetType,
        usingField: optionObj.usingField || undefined,
    };

    structure_entity.setupAssociation(associationOptionTwo);

    await structure_field[setupFunction](data);
    let reversedAttr = {
        options: {
            target: data.options.source,
            source: data.options.target,
            foreignKey: optionObj.foreignKey,
            as: optionObj.as,
            showTarget: data.options.showSource,
            urlTarget: data.options.urlSource.toLowerCase(),
            showSource: data.options.showTarget,
            urlSource: data.options.urlTarget.toLowerCase(),
            showAs: optionObj.showAs,
            urlAs: optionObj.as.substring(2).toLowerCase()
        },
        application: data.application,
        module_name: data.module_name,
        entity_name: data.entity_name
    };

    if (data.targetType == "hasMany") {
        await structure_field.setupHasManyTab(reversedAttr);
    } else if (data.targetType == "hasManyPreset") {
        await structure_field.setupHasManyPresetTab(reversedAttr);
    } else if (data.targetType == "relatedToMultiple" || data.targetType == "relatedToMultipleCheckbox") {

        if (typeof optionObj.usingField !== "undefined")
            reversedAttr.options.usingField = optionObj.usingField;

        await structure_field.setupRelatedToMultipleField(reversedAttr);

        if(setRequired){
            reversedAttr.name_data_entity = reversedAttr.options.source;
            reversedAttr.options.value = "f_"+reversedAttr.options.urlAs;
            reversedAttr.options.word = "required";
            await structure_field.setRequiredAttribute(reversedAttr);
        }
    } else {
        throw new Error('Unknown target type for belongsToMany generation.')
    }
}

// Create a tab with an add button to create multiple new object associated to source entity
exports.createNewHasMany = async (data) => {
    let exportsContext = this;

    let sourceEntity = data.application.findEntity(data.options.source, true);
    data.np_module = sourceEntity.np_module;
    data.source_entity = sourceEntity.entity;

    let sourceOptionsPath = __dirname+'/../workspace/' + data.application.name + '/models/options/' + data.source_entity.name + '.json';
    let optionsSourceObject = JSON.parse(fs.readFileSync(sourceOptionsPath));
    let saveFile = false;

    // Vérification si une relation existe déjà de la source VERS la target
    for (let i = 0; i < optionsSourceObject.length; i++) {
        if (optionsSourceObject[i].target == data.options.target) {
            // If alias already used
            if (data.options.as == optionsSourceObject[i].as){
                if(optionsSourceObject[i].structureType == "auto_generate") {
                    // Remove auto generate key by the generator
                    optionsSourceObject.splice(i, 1);
                    saveFile = true;
                } else
                    throw new Error("structure.association.error.alreadySameAlias");
            }
        } else if(data.options.as == optionsSourceObject[i].as){
            let err = new Error('database.field.error.alreadyExist');
            err.messageParams = [data.options.showAs];
            throw err;
        }
    }

    // Changes to be saved, remove auto_generate key
    if(saveFile)
        fs.writeFileSync(sourceOptionsPath, JSON.stringify(optionsSourceObject, null, 4), "utf8");

    let answer = {};
    let toSync = true;
    let optionsObject;

    let target_entity = data.application.findEntity(data.options.target);

    // Target entity does not exist -> Subentity generation
    if(!target_entity) {
        target_entity = data.np_module.addEntity(data.options.target);

        answer.message = "structure.association.hasMany.successSubEntity";
        answer.messageParams = [data.options.showAs, data.options.showSource, data.options.showSource, data.options.showAs];

        // Subentity code generation
        await structure_entity.setupEntity(data)

        optionsObject = JSON.parse(fs.readFileSync(__dirname+'/../workspace/' + data.application.name + '/models/options/' + data.options.target + '.json'));
    } else {
        optionsObject = JSON.parse(fs.readFileSync(__dirname+'/../workspace/' + data.application.name + '/models/options/' + data.options.target.toLowerCase() + '.json'));

        let cptExistingHasMany = 0;
        // Check if there is no or just one belongsToMany to do
        for (let i = 0; i < optionsObject.length; i++)
            if (optionsObject[i].target.toLowerCase() == data.options.source.toLowerCase() && optionsObject[i].relation != "belongsTo")
                if (optionsObject[i].relation != "belongsToMany")
                    cptExistingHasMany++;

        /* If there are multiple has many association from target to source we can't handle on which one we gonna link the belongsToMany association */
        if (cptExistingHasMany > 1)
            throw new Error("structure.association.error.tooMuchHasMany");

        answer.message = "structure.association.hasMany.successEntity";
        answer.messageParams = [data.options.showAs, data.options.showSource, data.options.showSource, data.options.showAs];
    }

    // Vérification si une relation existe déjà de la target VERS la source
    for (let i = 0; i < optionsObject.length; i++) {
        if (optionsObject[i].target.toLowerCase() == data.options.source.toLowerCase()
            && optionsObject[i].target.toLowerCase() != data.options.target.toLowerCase()
            && optionsObject[i].relation != "belongsTo"
            && optionsObject[i].structureType != "auto_generate") {

            /* Then lets create the belongs to many association */
            await belongsToMany(data, optionsObject[i], "setupHasManyTab", exportsContext);

            return {
                entity: data.source_entity,
                message: 'structure.association.hasMany.successEntity',
                messageParams: [data.options.showAs, data.options.showSource, data.options.showSource, data.options.showAs]
            }

        } else if (data.options.source.toLowerCase() != data.options.target.toLowerCase()
                && (optionsObject[i].target.toLowerCase() == data.options.source.toLowerCase() && optionsObject[i].relation == "belongsTo")
                && (optionsObject[i].foreignKey == data.options.foreignKey)) {
            // We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
            toSync = false;
        }
    }

    // Créer le lien hasMany en la source et la target
    var associationOption = {
        application: data.application,
        source: data.options.source,
        target: data.options.target,
        foreignKey: data.options.foreignKey,
        as: data.options.as,
        showAs: data.options.showAs,
        relation: "hasMany",
        through: null,
        toSync: toSync,
        type: "hasMany"
    };

    let reversedOptions = {
        application: data.application,
        source: data.options.target,
        target: data.options.source,
        foreignKey: data.options.foreignKey,
        as: "r_"+data.options.source.substring(2),
        relation: "belongsTo",
        toSync: toSync,
        type: "auto_generate"
    }

    // Generate hasMany relation in options
    structure_entity.setupAssociation(associationOption);
    // Generate opposite belongsTo relation in options
    structure_entity.setupAssociation(reversedOptions);

    // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
    structure_field.setupHasManyTab(data);

    return {
        ...answer,
        entity: data.source_entity
    };
}

// Create a tab with a select of existing object and a list associated to it
exports.createNewHasManyPreset = (attr, callback) => {
    var exportsContext = this;
    /* Check if entity source exist before doing anything */
    db_entity.getIdDataEntityByCodeNameWithoutModuleCheck(attr.id_module, attr.options.source, function (err, idEntitySource) {
        if (err)
            return callback(err, null);

        attr.id_data_entity = idEntitySource;

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

        // With preset instruction with already know the source of the related to
        // "entity (.*) has many preset (.*)"
        if (typeof attr.options.source === "undefined") {
            attr.options.source = source_entity.codeName;
            attr.options.showSource = source_entity.name;
            attr.options.urlSource = dataHelper.removePrefix(source_entity.codeName, "entity");
        }

        // Vérifie que la target existe bien avant de creer la source et la clé étrangère (foreign key)
        db_entity.selectEntityTarget(attr, function (err, entityTarget) {
            // Si l'entité target n'existe pas ou autre
            if (err)
                return callback(err, null);

            let sourceOptionsPath = __dirname+'/../workspace/' + attr.id_application + '/models/options/' + attr.options.source.toLowerCase() + '.json';
            let optionsSourceFile = helpers.readFileSyncWithCatch(sourceOptionsPath);
            let optionsSourceObject = JSON.parse(optionsSourceFile);
            let toSync = true;
            let saveFile = false;
            // Vérification si une relation existe déjà avec cet alias
            for (var i = 0; i < optionsSourceObject.length; i++) {
                if (optionsSourceObject[i].target.toLowerCase() == attr.options.target.toLowerCase()) {
                    // If alias already used
                    if (attr.options.as == optionsSourceObject[i].as){
                        if(optionsSourceObject[i].structureType == "auto_generate") {
                            // Remove auto generate key by the generator
                            optionsSourceObject.splice(i, 1);
                            saveFile = true;
                        } else {
                            var err = new Error("structure.association.error.alreadySameAlias");
                            return callback(err, null);
                        }
                    }
                } else if(attr.options.as == optionsSourceObject[i].as){
                    let err = new Error();
                    err.message = "database.field.error.alreadyExist";
                    err.messageParams = [attr.options.showAs];
                    return callback(err, null);
                }
            }

            attr.options.through = attr.id_application + "_" + idEntitySource + "_" + entityTarget.id + "_" + attr.options.as.substring(2);
            if (attr.options.through.length > 55) {
                let err = new Error();
                err.message = "error.valueTooLong";
                err.messageParams = [attr.options.through];
                return callback(err, null);
            }

            // Changes to be saved, remove auto_generate key
            if(saveFile)
                fs.writeFileSync(sourceOptionsPath, JSON.stringify(optionsSourceObject, null, 4), "utf8")

            let optionsFile = helpers.readFileSyncWithCatch(__dirname+'/../workspace/' + attr.id_application + '/models/options/' + attr.options.target.toLowerCase() + '.json');
            let targetOptions = JSON.parse(optionsFile);
            let cptExistingHasMany = 0;

            // Preparing variable
            let source = attr.options.source.toLowerCase();
            let target = attr.options.target.toLowerCase();

            // Check if there is no or just one belongsToMany to do
            for (let i = 0; i < targetOptions.length; i++)
                if (targetOptions[i].target.toLowerCase() == source && targetOptions[i].relation != "belongsTo")
                    cptExistingHasMany++;

            /* If there are multiple has many association from target to source we can't handle on which one we gonna link the belongsToMany association */
            if (cptExistingHasMany > 1) {
                let err = new Error("structure.association.error.tooMuchHasMany");
                return callback(err, null);
            }

            let doingBelongsToMany = false, targetObjTarget;
            // Vérification si une relation existe déjà de la target VERS la source
            for (let i = 0; i < targetOptions.length; i++) {
                targetObjTarget = targetOptions[i].target.toLowerCase();

                if (targetObjTarget == source
                    && targetObjTarget != target
                    && targetOptions[i].relation != "belongsTo"
                    && targetOptions[i].structureType != "auto_generate") {

                    doingBelongsToMany = true;
                    /* Then lets create the belongs to many association */
                    belongsToMany(attr, targetOptions[i], "setupHasManyPresetTab", exportsContext).then(function () {
                        let info = {};
                        info.insertId = attr.id_data_entity;
                        info.message = "structure.association.hasManyExisting.success";
                        info.messageParams = [attr.options.showTarget, attr.options.showSource];
                        callback(null, info);
                    }).catch(function (err) {
                        console.error(err);
                        return callback(err, null);
                    });
                } else if (source != target
                    && (targetObjTarget == source && targetOptions[i].relation == "belongsTo")
                    && targetOptions[i].foreignKey == attr.options.foreignKey) {
                    // We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
                    toSync = false;
                }
            }

            // If there is a circular has many we have to convert it to a belongsToMany assocation, so we stop the code here.
            // If not we continue doing a simple has many association.
            if (!doingBelongsToMany) {
                db_field.createNewForeignKey(attr, function (err, created_foreignKey) {
                    if (err) {return callback(err, null);}

                    var associationOption = {
                        idApp: attr.id_application,
                        source: attr.options.source,
                        target: attr.options.target,
                        foreignKey: attr.options.foreignKey,
                        as: attr.options.as,
                        showAs: attr.options.showAs,
                        relation: "belongsToMany",
                        through: attr.options.through,
                        toSync: toSync,
                        usingField: attr.options.usingField || undefined,
                        type: "hasManyPreset"
                    };

                    // Créer le lien belongsTo en la source et la target
                    structure_entity.setupAssociation(associationOption, () => {
                        // Ajouter le field d'assocation dans create_fields/update_fields. Ajout d'un tab dans le show
                        structure_field.setupHasManyPresetTab(attr, () => {
                            var info = {};
                            info.insertId = attr.id_data_entity;
                            info.message = "structure.association.hasManyExisting.success";
                            info.messageParams = [attr.options.showTarget, attr.options.showSource];
                            callback(null, info);
                        })
                    })
                })
            }
        })
    })
}

// Create a field in create/show/update related to target entity
exports.createNewFieldRelatedTo = async (data) => {

    let workspacePath = __dirname + '/../workspace/' + data.application.name;

    // Get source entity
    data.source_entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

    // Check if a field with this name already exist
    if(data.source_entity.getField('f_' + data.options.urlAs)) {
        let err = new Error('database.field.error.alreadyExist');
        err.messageParams = [data.options.showAs];
        throw err;
    }

    // Check if the target entity exist
    data.target_entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

    // If a using field or fields has been asked, we have to check if those fields exist in the entity
    if (typeof data.options.usingField !== "undefined") {
        let attributeTarget = JSON.parse(fs.readFileSync(workspacePath + '/models/attributes/' + data.options.target + '.json'));
        for (let i = 0; i < data.options.usingField.length; i++) {
            if (typeof attributeTarget[data.options.usingField[i]] === "undefined") {
                // If a asked using field doesn't exist in the target entity we send an error
                let err = new Error('structure.association.relatedTo.missingField');
                err.messageParams = [data.options.showUsingField[i], data.options.showTarget];
                throw err;
            } else {
                data.options.usingField[i] = {
                    value: data.options.usingField[i],
                    type: attributeTarget[data.options.usingField[i]].newmipsType
                }
            }
        }
    }

    // Check if an association already exists from source to target
    let sourceOptionsPath = workspacePath + '/models/options/' + data.source_entity.name + '.json';
    let optionsSourceObject = JSON.parse(fs.readFileSync(sourceOptionsPath));

    let toSync = true;
    let constraints = true;
    let saveFile = false;

    // Check if an association already exists with the same alias
    for (var i = 0; i < optionsSourceObject.length; i++) {
        if (optionsSourceObject[i].target == data.options.target) {
            // If alias already used
            if (data.options.as == optionsSourceObject[i].as){
                if(optionsSourceObject[i].structureType == "auto_generate") {
                    // Remove auto generate key by the generator
                    optionsSourceObject.splice(i, 1);
                    saveFile = true;
                } else
                    throw new Error("structure.association.error.alreadySameAlias");
            }
        } else if(data.options.as == optionsSourceObject[i].as){
            let err = new Error('database.field.error.alreadyExist');
            err.messageParams = [data.options.showAs];
            throw err;
        }
    }

    // Changes to be saved, remove auto_generate key
    if(saveFile)
        fs.writeFileSync(sourceOptionsPath, JSON.stringify(optionsSourceObject, null, 4), "utf8");

    // Check if an association already exists from target to source
    let optionsObject = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.options.target + '.json'));
    for (let i = 0; i < optionsObject.length; i++) {
        if (optionsObject[i].target == data.source_entity.name && optionsObject[i].relation != "hasMany" && optionsObject[i].relation != "belongsToMany") {
            constraints = false;
        } else if (data.source_entity.name != data.options.target
                && (optionsObject[i].target == data.source_entity.name && optionsObject[i].relation == "hasMany")
                && (optionsObject[i].foreignKey == data.options.foreignKey)) {
            // We avoid the toSync to append because the already existing has many relation has already created the foreign key in BDD
            toSync = false;
        }
    }

    data.source_entity.addField('f_' + data.options.urlAs);

    // Créer le lien belongsTo en la source et la target dans models/options/source.json
    let associationOption = {
        application: data.application,
        source: data.source_entity.name,
        target: data.options.target,
        foreignKey: data.options.foreignKey,
        as: data.options.as,
        showAs: data.options.showAs,
        relation: "belongsTo",
        through: null,
        toSync: true,
        type: "relatedTo",
        constraints: constraints
    };

    if (typeof data.options.usingField !== "undefined")
        associationOption.usingField = data.options.usingField;

    let reversedOption = {
        application: data.application,
        source: data.options.target,
        target: data.source_entity.name,
        foreignKey: data.options.foreignKey,
        as: "r_"+data.source_entity.name.substring(2),
        relation: "hasMany",
        type: "auto_generate",
        constraints: constraints
    };

    structure_entity.setupAssociation(associationOption);
    structure_entity.setupAssociation(reversedOption);

    // Generate html code in dust file
    await structure_field.setupRelatedToField(data);

    return {
        entity: data.source_entity,
        message: "structure.association.relatedTo.success",
        messageParams: [data.options.showAs, data.options.showTarget, data.options.showAs, data.options.showAs, data.options.showAs]
    }
}

// Select multiple in create/show/update related to target entity
exports.createNewFieldRelatedToMultiple = async (data) => {

    let exportsContext = this;
    let alias = data.options.as;
    let workspacePath = __dirname + '/../workspace/' + data.application.name;

    // Get source entity
    data.source_entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

    // Check if a field with this name already exist
    if(data.source_entity.getField('f_' + data.options.urlAs)) {
        let err = new Error('database.field.error.alreadyExist');
        err.messageParams = [data.options.showAs];
        throw err;
    }

    // Foreign key name generation
    data.options.foreignKey = "fk_id_" + data.source_entity.name + "_" + alias.substring(2);

    // Check if the target entity exist
    data.target_entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

    // If a using field or fields has been asked, we have to check if those fields exist in the entity
    if (typeof data.options.usingField !== "undefined") {
        let attributesPath = workspacePath + '/models/attributes/' + data.options.target.toLowerCase() + '.json';
        let attributeTarget = JSON.parse(fs.readFileSync(attributesPath));

        for (let i = 0; i < data.options.usingField.length; i++) {
            if (typeof attributeTarget[data.options.usingField[i]] === "undefined") {
                // If a asked using field doesn't exist in the target entity we send an error
                let err = new Error('structure.association.relatedTo.missingField');
                err.messageParams = [data.options.showUsingField[i], data.options.showTarget];
                throw err;
            } else {
                data.options.usingField[i] = {
                    value: data.options.usingField[i],
                    type: attributeTarget[data.options.usingField[i]].newmipsType
                }
            }
        }
    }

    // Check if an association already exists from source to target
    let optionsSourceObject = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.source_entity.name + '.json'));

    let toSync = true;
    let relation = "belongsToMany";

    // Check already exisiting association from source to target entity
    for (let i = 0; i < optionsSourceObject.length; i++) {
        if (optionsSourceObject[i].target.toLowerCase() == data.options.target.toLowerCase()) {
            if (data.options.as == optionsSourceObject[i].as)
                throw new Error("structure.association.error.alreadySameAlias");
        } else if (optionsSourceObject[i].relation == "belongsToMany" && (data.options.as == optionsSourceObject[i].as)) {
            throw new Error("structure.association.error.alreadySameAlias");
        } else if(data.options.as == optionsSourceObject[i].as){
            let err = new Error('database.field.error.alreadyExist');
            err.messageParams = [data.options.showAs];
            throw err;
        }
    }

    // Association table
    data.options.through = data.application.associationSeq + "_" + data.options.as.substring(2);

    // MySQL table length limit
    if (data.options.through.length > 60) {
        let err = new Error('error.valueTooLong');
        err.messageParams = [data.options.through];
        throw err;
    }

    // Check if an association already exists from target to source
    let optionsObject = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.target_entity.name + '.json'));

    for (var i = 0; i < optionsObject.length; i++) {
        if (data.source_entity.name != data.target_entity.name
                && (optionsObject[i].target == data.source_entity.name
                    && optionsObject[i].relation == "belongsTo")) {
            // Temporary solution ! TODO: Mispy should ask if we want to link the already existing 1,1 with this new 1,n
            if ((data.options.target.substring(2) == data.options.as.substring(2))
                    && (optionsObject[i].target.substring(2) == optionsObject[i].as.substring(2))) {
                //&& (optionsObject[i].foreignKey == data.options.foreignKey)
                // If alias both side are the same that their own target then it trigger the 1,1 / 1,n generation
                data.options.foreignKey = optionsObject[i].foreignKey;
                // We avoid the toSync to append because the already existing has one relation has already created the foreign key in BDD
                toSync = false;
                // If it's already define that target entity belongsTo source entity, then we create a simple hasMany instead of a belongsToMany
                relation = "hasMany";
                data.options.through = null;
            }
        }
    }

    // Create the association link between source and target
    let associationOption = {
        application: data.application,
        source: data.source_entity.name,
        target: data.target_entity.name,
        foreignKey: data.options.foreignKey,
        as: data.options.as,
        showAs: data.options.showAs,
        relation: relation,
        through: data.options.through,
        toSync: toSync,
        type: data.options.isCheckbox ? "relatedToMultipleCheckbox" : "relatedToMultiple"
    };

    if (typeof data.options.usingField !== "undefined")
        associationOption.usingField = data.options.usingField;
    if (typeof data.options.isCheckbox !== "undefined" && data.options.isCheckbox) {
        // If it's a checkbox presentation style, we need to load association directly in the route, not in ajax
        associationOption.loadOnStart = true;
    }

    data.source_entity.addField('f_' + data.options.urlAs);

    // Generate ORM association
    structure_entity.setupAssociation(associationOption);

    // Generate HTML code
    await structure_field.setupRelatedToMultipleField(data);

    return {
        message: 'structure.association.relatedToMultiple.success',
        messageParams: [data.options.showAs, data.options.showTarget, data.source_entity.name, data.options.showAs, data.options.showAs]
    };
}

/* --------------------------------------------------------------- */
/* -------------------------- COMPONENT -------------------------- */
/* --------------------------------------------------------------- */
exports.createNewComponentStatus = async (data) => {
    let self = this;

    let entity = data.application.findEntity(data.entity_name, true);
    data.np_module = entity.np_module;
    data.entity = entity.entity;

    if (data.entity.getComponent(data.options.value, 'status'))
        throw new Error('structure.component.error.alreadyExistOnEntity');

    data.history_table_db_name = data.application.associationSeq + '_history_' + data.options.value;
    data.history_table = 'history_' + data.entity.name.substring(2) + '_' + data.options.value.substring(2);

    // These instructions create a has many with a new entity history_status
    // It also does a hasMany relation with e_status
    let instructions = [
        "entity " + data.entity.name.substring(2) + ' has many ' + data.history_table_db_name + ' called History ' + data.options.showValue,
        "select entity " + data.history_table_db_name,
        "add field " + data.options.showValue + " related to Status using name, color",
        "add field Comment with type text",
        "add field Modified by related to user using login",
        "entity status has many " + data.history_table_db_name,
        "select entity " + data.entity.name.substring(2),
        "add field " + data.options.showValue + " related to Status using name"
    ];

    await self.recursiveInstructionExecute(data, instructions, 0);
    await structure_component.newStatus(data);

    data.entity.addComponent(data.options.value, 'status');

    return {
        message: 'database.component.create.successOnEntity',
        messageParams: ['status', data.options.showValue, data.showSource]
    };
}

let workspacesModels = {};
function deleteComponentStatus(attr, callback) {

    let self = this;
    /* If there is no defined name for the module, set the default */
    if (typeof attr.options.value === "undefined") {
        attr.options.value = "s_status";
        attr.options.urlValue = "status";
        attr.options.showValue = "Status";
    }

    db_entity.getDataEntityById(attr.id_data_entity, (err, entity) => {
        if(err)
            return callback(err);

        db_field.getFieldByCodeName({
            codeName: attr.options.value,
            idEntity: attr.id_data_entity,
            showValue: attr.options.showValue,
            showEntity: entity.name,
        }, (err, field) => {
            if(err)
                return callback(err);

            // Looking for status & history status information in options.json
            let entityOptions = JSON.parse(helpers.readFileSyncWithCatch(__dirname+'/../workspace/' + attr.id_application + '/models/options/' + entity.codeName + '.json'));
            let historyInfo, statusFieldInfo;

            for(let option of entityOptions){
                if(option.as == 'r_'+attr.options.urlValue)
                    statusFieldInfo = option;

                if(option.as == 'r_history_'+attr.options.urlValue)
                    historyInfo = option;
            }

            let modelsPath = __dirname + '/../workspace/' + attr.id_application + '/models/';
            if(typeof workspacesModels[attr.id_application] === 'undefined'){
                delete require.cache[require.resolve(modelsPath)];
                workspacesModels[attr.id_application] = require(modelsPath);
            }
            let historyTableName = workspacesModels[attr.id_application]['E_' + historyInfo.target.substring(2)].getTableName();

            structure_component.deleteStatus({
                appID: attr.id_application,
                status_field: 's_'+attr.options.urlValue,
                fk_status: statusFieldInfo.foreignKey,
                entity: entity.codeName,
                historyName: historyInfo.target,
                historyTableName: historyTableName
            }).then(_ => {

                // Delete metadata in generator DB
                db_field.deleteDataField({
                    id_data_entity: attr.id_data_entity,
                    options: {
                        value: 's_'+attr.options.urlValue,
                        showValue: attr.options.urlValue
                    }
                }, err => {if(err) console.error(err);});

                db_field.deleteDataField({
                    id_data_entity: attr.id_data_entity,
                    options: {
                        value: statusFieldInfo.foreignKey,
                        showValue: statusFieldInfo.foreignKey
                    }
                }, err => {if(err) console.error(err);});

                callback(null, {
                    message: 'database.component.delete.success'
                })
            }).catch(err => {
                callback(err);
            })
        })
    })
}
exports.deleteComponentStatus = deleteComponentStatus;

// Componant that we can add on an entity to store local documents
exports.createNewComponentLocalFileStorage = async (data) => {

    data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);

    /* If there is no defined name for the module */
    if (typeof data.options.value === "undefined") {
        data.options.value = "c_local_file_storage_" + data.entity.name;
        data.options.urlValue = "local_file_storage_" + data.entity.name;
        data.options.showValue = "Local File Storage";
    } else {
        data.options.value = data.options.value + "_" + data.entity.name;
        data.options.urlValue = data.options.urlValue + "_" + data.entity.name;
    }

    data.options.urlSource = data.options.value.substring(2);

    if (data.entity.getComponent(data.options.value, 'file_storage'))
        throw new Error('structure.component.error.alreadyExistOnEntity');

    if(data.application.findEntity(data.options.value))
        throw new Error("structure.component.error.alreadyExistInApp");

    data.entity.addComponent(data.options.value, 'file_storage');

    let associationOption = {
        application: data.application,
        source: data.entity.name,
        target: data.options.value,
        foreignKey: "fk_id_" + data.entity.name,
        as: data.options.value,
        showAs: data.options.showValue,
        relation: "hasMany",
        through: null,
        toSync: false,
        type: 'localfilestorage'
    };

    structure_entity.setupAssociation(associationOption);
    await structure_component.newLocalFileStorage(data);
}

// Componant to create a contact form in a module
exports.createNewComponentContactForm = (attr, callback) => {

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
            var err = new Error("structure.component.error.alreadyExistOnModule");
            return callback(err, null);
        } else {
            // Check if a table as already the composant name
            db_entity.getDataEntityByCodeName(attr.id_application, attr.options.value, function (err, dataEntity) {
                if (dataEntity) {
                    err = new Error("structure.component.error.alreadyExistInApp");
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

exports.deleteComponentContactForm = (attr, callback) => {

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
exports.createNewComponentAgenda = (attr, callback) => {

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
            var err = new Error("structure.component.error.alreadyExistOnModule");
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
                "add field Users related to many user using login, email",
                "set field Title required",
                "set field Start date required"
            ];

            // Start doing necessary instruction for component creation
            exportsContext.recursiveInstructionExecute(attr, instructions, 0, function (err) {
                if (err)
                    return callback(err, null);

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
            });
        }
    });
}

exports.deleteAgenda = (attr, callback) => {

    let exportsContext = this;

    /* If there is no defined name for the module */
    if (typeof attr.options.value === "undefined") {
        attr.options.value = "c_agenda";
        attr.options.urlValue = "agenda";
        attr.options.showValue = "Agenda";
    }

    // Check if component with this name is in this module
    db_component.getComponentByCodeNameInModule(attr.id_module, attr.options.value, attr.options.showValue, (err, component) => {
        if (!component) {
            let err = new Error("database.component.notFound.notFoundInModule");
            err.messageParams = [attr.options.showValue, attr.id_module];
            return callback(err, null);
        }

        let showValueEvent = attr.options.showValue + " Event";
        let showValueCategory = attr.options.showValue + " Category";

        let instructions = [
            "delete entity " + showValueCategory,
            "delete entity " + showValueEvent,
        ];

        // Start doing necessary instruction for component creation
        exportsContext.recursiveInstructionExecute(attr, instructions, 0, err => {
            if (err)
                return callback(err, null);

            // Create the component in newmips database
            db_component.deleteComponentOnModule(attr.options.value, attr.id_module, (err, info) => {
                if (err)
                    return callback(err, null);

                db_module.getModuleById(attr.id_module, (err, module) => {
                    if (err)
                        return callback(err, null);

                    attr.options.moduleName = module.codeName;
                    structure_component.deleteAgenda(attr, err => {
                        if (err)
                            return callback(err, null);

                        callback(null, {
                            message: "database.component.delete.success"
                        });
                    });
                });
            });
        });
    });
}

// Component to create a C.R.A module
exports.createNewComponentCra = (attr, callback) => {

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
            "add field Active with type boolean and default value true",
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
exports.createNewComponentPrint = (attr, callback) => {

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
            var err = new Error("structure.component.error.alreadyExistOnEntity");
            return callback(err, null);
        } else {
            // Get Data Entity Name needed for structure
            db_entity.getDataEntityById(attr.id_data_entity, function (err, sourceEntity) {
                attr.options.source = sourceEntity.codeName;
                attr.options.showSource = sourceEntity.name;
                attr.options.urlSource = dataHelper.removePrefix(sourceEntity.codeName, "entity");
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

exports.deleteComponentPrint = (attr, callback) => {

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
                attr.options.urlSource = dataHelper.removePrefix(sourceEntity.codeName, "entity");
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
        } else {
            var err = new Error("structure.component.error.notExisting");
            return callback(err, null);
        }
    });
}

exports.createComponentChat = (attr, callback) => {
    structure_component.setupChat(attr, function (err) {
        if (err)
            return callback(err);
        callback(null, {message: 'structure.component.chat.success'});
    });
}

//Create new component address
exports.createNewComponentAddress = function(attr, callback) {
    var componentCodeName = 'e_address_' + attr.id_data_entity;

    if (attr.id_data_entity) {
        db_component.checkIfComponentCodeNameExistOnEntity(componentCodeName, attr.id_module, attr.id_data_entity, function(err, alreadyExist) {
            if (!err) {
                if (!alreadyExist) {
                    db_entity.getDataEntityById(attr.id_data_entity, function(err, entity) {
                        if (!err) {
                            attr.componentCodeName = componentCodeName;
                            attr.options.name = attr.options.componentName;
                            attr.entityCodeName = entity.codeName;
                            attr.componentName = attr.options.componentName;
                            attr.moduleName = module.codeName;
                            attr.options.showValue = attr.options.componentName;
                            attr.options.value = componentCodeName;
                            var associationOption = {
                                idApp: attr.id_application,
                                source: entity.codeName,
                                target: componentCodeName,
                                foreignKey: 'fk_id_address',
                                as: 'r_address',
                                showAs: "",
                                type: "relatedTo",
                                relation: "belongsTo",
                                targetType: "component",
                                toSync: true
                            };
                            structure_entity.setupAssociation(associationOption, function() {
                                attr.sourceEntity = entity.codeName;
                                attr.foreignKey = associationOption.foreignKey;
                                attr.targetEntity = componentCodeName;
                                attr.targetKey = 'id';
                                attr.constraintDelete = 'CASCADE';
                                attr.constraintUpdate = 'CASCADE';
                                attr.dropForeignKey = true;
                                db_component.createNewComponentOnEntity(attr, function(err, info) {
                                    if (!err) {
                                        structure_component.addNewComponentAddress(attr, function(err) {
                                            if (err)
                                                return callback(err);
                                            callback(null, {
                                                message: 'database.component.create.success',
                                                messageParams: ["Adresse", attr.options.componentName || '']
                                            });
                                        });
                                    } else
                                        return callback(err);
                                });
                            });
                        } else
                            return callback(err);
                    });
                } else {
                    var err = new Error("structure.component.error.alreadyExistOnEntity");
                    return callback(err, null);
                }
            } else
                return callback(err);
        });
    } else {
        var err = new Error("database.field.error.selectOrCreateBefore");
        return callback(err, null);
    }
}

exports.deleteComponentAddress = (attr, callback) => {
    var componentName = 'e_address_' + attr.id_data_entity;
    if (!attr.id_data_entity){
        var err = new Error("database.field.error.selectOrCreateBefore");
        return callback(err, null);
    }
    db_component.checkIfComponentCodeNameExistOnEntity(componentName, attr.id_module, attr.id_data_entity, function (err, componentExist) {
        if (err)
            return callback(err);
        if (!componentExist) {
            var err = new Error("database.component.notFound.notFoundInModule");
            return callback(err, null)
        }
        db_component.deleteComponentOnEntity(componentName, attr.id_module, attr.id_data_entity, function (err, info) {
            if (err)
                return callback(err);
            database.dropDataEntity(attr.id_application, componentName, function (err) {
                db_entity.getDataEntityById(attr.id_data_entity, function (err, entity) {
                    if (err)
                        return callback(err);
                    attr.entityName = entity.codeName;
                    attr.moduleName = module.codeName;
                    structure_component.deleteComponentAddress(attr, function (err) {
                        if (err)
                            return callback(err);
                        attr.name_data_entity = attr.entityName;
                        attr.fieldToDrop = 'fk_id_address';
                        database.dropFKDataField(attr, function (err) {
                            callback(err, {message: 'database.component.delete.success'});
                        });
                    });
                });
            });
        });
    });
}

exports.createComponentDocumentTemplate = (attr, callback) => {
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
                                                                    messageParams: ["Document template", typeof attr.options.componentName !== "undefined" ? attr.options.componentName : "Document template"]});
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
                                    var err = new Error("structure.component.error.alreadyExistOnEntity");
                                    return callback(err, null);
                                }
                            });
                        } else
                            return callback(err);
                    });
                } else {
                    var err = new Error("database.field.error.selectOrCreateBefore");
                    return callback(err, null);
                }
            } else {
                /**Reject. We need module Administration to continue**/
                var err = new Error("database.module.notFound");
                return callback(err);
            }
        } else
            return callback(err);
    });
};

exports.deleteComponentDocumentTemplate = (attr, callback) => {
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
                            var err = new Error("database.component.notFound.notFoundOnEntity");
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
        var err = new Error("database.field.error.selectOrCreateBefore");
        return callback(err, null);
    }
};

/* --------------------------------------------------------------- */
/* -------------------------- INTERFACE -------------------------- */
/* --------------------------------------------------------------- */
exports.setLogo = (attr, callback) => {
    structure_ui.setLogo(attr, function (err, infoStructure) {
        if (err)
            return callback(err, null);
        callback(null, infoStructure);
    });
}

exports.removeLogo = (attr, callback) => {
    structure_ui.removeLogo(attr, function (err, infoStructure) {
        if (err)
            return callback(err, null);
        callback(null, infoStructure);
    });
}

exports.setLayout = (attr, callback) => {
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

exports.listLayout = (attr, callback) => {
    structure_ui.listLayout(attr, function (err, infoStructure) {
        if (err)
            return callback(err, null);

        callback(null, infoStructure);
    });
}

exports.setTheme = (attr, callback) => {
    structure_ui.setTheme(attr, function (err, infoStructure) {
        if (err)
            return callback(err, null);

        callback(null, infoStructure);
    });
}

exports.listTheme = (attr, callback) => {
    structure_ui.listTheme(attr, function (err, infoStructure) {
        if (err)
            return callback(err, null);

        callback(null, infoStructure);
    });
}

exports.listIcon = (attr, callback) => {
    callback(null, {
        message: "structure.ui.icon.list",
        messageParams: ['http://fontawesome.io/icons']
    });
}

exports.setIcon = async (data) => {
    data.entity = data.application.getModule(data.module_name, true).getEntity(data.entity_name, true);
    await structure_ui.setIcon(data);
    return {
        message: "structure.ui.icon.success",
        messageParams: [data.entity_name, data.iconValue]
    }
}

exports.setIconToEntity = (attr, callback) => {
    db_entity.getEntityByName(attr.entityTarget, attr.id_module, function (err, entity) {
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

exports.addTitle = (attr, callback) => {
    // Get selected entity
    db_entity.getDataEntityById(attr.id_data_entity, function (err, entity) {
        if (err)
            return callback(err, null);

        attr.entityCodeName = entity.codeName;

        let checkField = new Promise((resolve, reject) => {
            if(!attr.options.afterField)
                return resolve();

            attr.fieldCodeName = "f_"+dataHelper.clearString(attr.options.afterField);

            var checkFieldParams = {
                codeName: attr.fieldCodeName,
                showValue: attr.options.afterField,
                idEntity: attr.id_data_entity,
                showEntity: entity.name
            };

            db_field.getFieldByCodeName(checkFieldParams, function (err, fieldExist) {
                if (err) {
                    // Not found as a simple field, look for related to field
                    var optionsArray = JSON.parse(helpers.readFileSyncWithCatch(__dirname+'/../workspace/' + attr.id_application + '/models/options/' + entity.codeName + '.json'));
                    var found = false;
                    for (var i = 0; i < optionsArray.length; i++) {
                        if (optionsArray[i].showAs == attr.options.afterField) {
                            if (optionsArray[i].structureType == "relatedTo" || optionsArray[i].structureType == "relatedToMultiple" || optionsArray[i].structureType == "relatedToMultipleCheckbox") {
                                found = true;
                                return resolve();
                            }
                            break;
                        }
                    }
                    if (!found){
                        let err = new Error();
                        err.message = "structure.ui.title.missingField";
                        err.messageParams = [attr.options.afterField];
                        return reject(err);
                    }
                } else {
                    resolve();
                }
            })
        })

        checkField.then(() => {
            structure_ui.addTitle(attr, function (err, answer) {
                if (err)
                    return callback(err, null);

                callback(null, answer);
            })
        }).catch(err => {
            return callback(err, null);
        })
    })
}

exports.createWidgetPiechart = (attr, callback) => {
    var entityDbFunction = '', param = '';
    if (attr.entityTarget) {
        db_entity.getEntityByName(attr.entityTarget, attr.id_module, function (err, entity) {
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

            db_field.getCodeNameByNameArray([attr.field], entity.id, function (err, field) {
                if (err)
                    return callback(err);

                if (field.length == 1) {
                    attr.found = true;
                    attr.field = field[0];
                }
                // Field not found on entity, set found to false to notify structure_ui to search in entities targeted in options.json
                else
                    attr.found = false;

                structure_ui.createWidgetPiechart(attr, function (err, info) {
                    if (err)
                        return callback(err);
                    callback(null, info);
                });
            });
        });
    }
}

exports.createWidgetLastRecords = (attr, callback) => {
    if (attr.entityTarget) {
        db_entity.getEntityByName(attr.entityTarget, attr.id_module, function (err, entity) {
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
                // Check for not found fields and build error message
                for (var k = 0; k < attr.columns.length; k++) {
                    var kFound = false;
                    if (attr.columns[k].toLowerCase() == 'id') {
                        attr.columns[k] = {codeName: 'id', name: 'id', found:true};
                        kFound = true;
                    }
                    for (var i = 0; i < columns.length; i++) {
                        if (columns[i].codeName.indexOf('s_') == 0)
                            columns[i].codeName = 'r_'+columns[i].codeName.substring(2);
                        if (attr.columns[k].toLowerCase() == columns[i].name.toLowerCase()) {
                            attr.columns[k] = {codeName: columns[i].codeName, name: columns[i].name, found: true};
                            kFound = true;
                            break;
                        }
                    }
                    if (!kFound)
                        attr.columns[k] = {name: attr.columns[k], found: false};
                }
                structure_ui.createWidgetLastRecords(attr, function (err, info) {
                    if (err)
                        return callback(err);
                    callback(null, info);
                });
            });

        });
    }
}

exports.createWidgetOnEntity = async (data) => {
    data.entity_name = data.application.findEntity(data.entityTarget, true).entity.name;
    return await createWidget(data);
}

async function createWidget(data) {
    if (data.widgetType == -1) {
        let err = new Error('structure.ui.widget.unknown');
        err.messageParams = [data.widgetInputType];
        throw err;
    }

    let entity = data.application.findEntity(data.entity_name, true);
    data.np_module = entity.np_module;
    data.entity = entity.entity;
    await structure_ui.createWidget(data);
}
exports.createWidget = createWidget;

function deleteWidget(attr, callback) {
    if (attr.widgetType == -1)
        return callback(null, {message: "structure.ui.widget.unkown", messageParams: [attr.widgetInputType]});
    db_entity.getEntityByName(attr.entityTarget, attr.id_module, function (err, entity) {
        if (err)
            return callback(err);
        db_module.getModuleById(entity.id_module, function (err, dbModule) {
            if (err)
                return callback(err);

            attr.module = dbModule;
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
    attr.widgetTypes = ['info', 'stats', 'lastrecords', 'piechart'];
    deleteWidget(attr, function (err) {
        if (err)
            return callback(err);
        callback(null, {message: "structure.ui.widget.all_deleted", messageParams: [attr.entityTarget]});
    });
}
exports.deleteEntityWidgets = deleteEntityWidgets;
