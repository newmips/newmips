var fs = require('fs-extra');
var language = require('../services/language');
var models = require('../models');

module.exports = {
    // Build entity tree with fields and ONLY belongsTo associations
    entityFieldTree: function (entity, alias) {
        var genealogy = [];
        // Create inner function to use genealogy globaly
        function loadTree(entity, alias) {
            var fieldTree = {
                entity: entity,
                alias: alias || entity,
                fields: [],
                email_fields: [],
                phone_fields: [],
                children: []
            }

            try {
                var entityFields = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+entity+'.json'));
                var entityAssociations = JSON.parse(fs.readFileSync(__dirname+'/../models/options/'+entity+'.json'));
            } catch (e) {
                console.error(e);
                return fieldTree;
            }

            // Building field array
            for (var field in entityFields) {
                if (entityFields[field].newmipsType == "email")
                    fieldTree.email_fields.push(field);
                if (entityFields[field].newmipsType == "phone")
                    fieldTree.phone_fields.push(field);
                fieldTree.fields.push(field);
            }

            // Check if current entity has already been built in this branch of the tree to avoid infinite loop
            if (genealogy.indexOf(entity) != -1)
                return fieldTree;
            genealogy.push(entity);

            // Building children array
            for (var i = 0; i < entityAssociations.length; i++)
                if (entityAssociations[i].relation == 'belongsTo' && entityAssociations[i].target != entity)
                    fieldTree.children.push(loadTree(entityAssociations[i].target, entityAssociations[i].as));

            return fieldTree;
        }
        return loadTree(entity, alias);
    },
    // Build entity tree with fields and ALL associations
    fullEntityFieldTree: function (entity, alias = entity) {
        var genealogy = [];
        // Create inner function to use genealogy globaly
        function loadTree(entity, alias) {
            var fieldTree = {
                entity: entity,
                alias: alias,
                fields: [],
                email_fields: [],
                phone_fields: [],
                children: []
            }
            try {
                var entityFields = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+entity+'.json'));
                var entityAssociations = JSON.parse(fs.readFileSync(__dirname+'/../models/options/'+entity+'.json'));
            } catch (e) {
                console.error(e);
                return fieldTree;
            }

            // Building field array
            for (var field in entityFields) {
                if (entityFields[field].newmipsType == "email")
                    fieldTree.email_fields.push(field);
                if (entityFields[field].newmipsType == "phone")
                    fieldTree.phone_fields.push(field);
                fieldTree.fields.push(field);
            }

            // Check if current entity has already been built in this branch of the tree to avoid infinite loop
            if (genealogy.indexOf(entity) != -1)
                return fieldTree;
            genealogy.push(entity);

            // Building children array
            for (var i = 0; i < entityAssociations.length; i++)
                fieldTree.children.push(loadTree(entityAssociations[i].target, entityAssociations[i].as));

            return fieldTree;
        }
        return loadTree(entity, alias);
    },
    // Build sequelize formated include object from tree
    buildIncludeFromTree: function(entityTree) {
        var includes = [];
        for (var i = 0; entityTree.children && i < entityTree.children.length; i++) {
            var include = {};
            var child = entityTree.children[i];
            include.as = child.alias;
            include.model = models[child.entity.charAt(0).toUpperCase() + child.entity.toLowerCase().slice(1)];
            if (child.children && child.children.length != 0)
                include.include = this.buildIncludeFromTree(child);

            includes.push(include);
        }
        console.log(includes)
        return includes;
    },
    // Build array of user target for media_notification insertion <select>
    getUserTargetList: (entityTree, lang)=> {
        var __ = language(lang).__;
        entityTree.topLevel = true;
        var userList = [];
        function dive(obj, parent = null) {
            if (obj.entity == "e_user") {
                userList.push({
                    traduction: __("entity."+parent.entity+"."+obj.alias),
                    field: "{" + (parent == null || parent.topLevel ? obj.alias : parent.alias+'.'+obj.alias) + "}"
                });
            }
            else
                for (var i = 0; i < obj.children.length; i++)
                    dive(obj.children[i], obj)
        }
        dive(entityTree);
        return userList;
    },
    // Build array of fields for media sms/notification/email insertion <select>
    entityFieldForSelect: function(entityTree, lang) {
        var __ = language(lang).__;
        var separator = ' > ';
        var options = [];
        function dive(obj, codename, parent, parentTraduction = "") {
            var traduction;
            // Top level. Entity traduction Ex: 'Ticket'
            if (!parent)
                traduction = __('entity.'+obj.entity+'.label_entity');
            // Child level. Parent traduction with child entity alias Ex: 'Ticket > Participants' OR 'Ticket > Participants > Adresse'
            else
                traduction = parentTraduction + separator + __('entity.'+parent.entity+'.'+obj.alias);

            for (var j = 0; j < obj.fields.length; j++) {
                if (obj.fields[j].indexOf('f_') != 0)
                    continue;
                // traduction += separator + __('entity.'+obj.entity+'.'+obj.fields[j]);
                options.push({
                    codename: !codename ? obj.fields[j] : codename+'.'+obj.fields[j],
                    traduction: traduction + separator + __('entity.'+obj.entity+'.'+obj.fields[j]), // Append field to traduction Ex: 'Ticket > Participants > Adresse > Ville'
                    target: obj.entity,
                    isEmail: obj.email_fields.indexOf(obj.fields[j]) != -1 ? true : false,
                    isPhone: obj.phone_fields.indexOf(obj.fields[j]) != -1 ? true : false
                });
            }

            for (var i = 0; i < obj.children.length; i++)
                dive(obj.children[i], !codename ? obj.children[i].alias : codename+'.'+obj.children[i].alias, obj, traduction);
        }

        // Build options array
        dive(entityTree);

        // Sort options array
        // loopCount is used to avoid "Maximum call stack exedeed" error with large arrays.
        // Using setTimeout (even with 0 milliseconds) will end the current call stack and create a new one.
        // Even with 0 milliseconds timeout execution can be realy slower, so we reset call stack once every 1000 lap
        var loopCount = 0;
        function sort(optsArray, i) {
            loopCount++;
            if (!optsArray[i+1])
                return;
            var firstParts = optsArray[i].traduction.split(separator);
            var secondParts = optsArray[i+1].traduction.split(separator);
            if (firstParts[0].toLowerCase() > secondParts[0].toLowerCase()) {
                var swap = optsArray[i+1];
                optsArray[i+1] = optsArray[i];
                optsArray[i] = swap;
                if (loopCount % 1000 === 0) {
                    loopCount = 0;
                    return setTimeout(() => {
                        sort(optsArray, i == 0 ? i : i-1);
                    }, 0);
                }
                else
                    return sort(optsArray, i == 0 ? i : i-1)
            }
            else if (firstParts[0].toLowerCase() == secondParts[0].toLowerCase()
                && firstParts[1].toLowerCase() > secondParts[1].toLowerCase()) {
                var swap = optsArray[i+1];
                optsArray[i+1] = optsArray[i];
                optsArray[i] = swap;
                if (loopCount % 1000 === 0) {
                    loopCount = 0;
                    return setTimeout(() => {
                        sort(optsArray, i == 0 ? i : i-1);
                    }, 0);
                }
                else
                    return sort(optsArray, i == 0 ? i : i-1);

            }
            if (loopCount % 1000 === 0) {
                loopCount = 0;
                return setTimeout(() => {
                    sort(optsArray, i+1);
                }, 0);
            }
            else
                return sort(optsArray, i+1);
        }
        sort(options, 0);

        return options;
    },
    entityStatusFieldList: function() {
        var self = this;
        var entities = [];
        fs.readdirSync(__dirname+'/../models/attributes').filter(function(file){
            return (file.indexOf('.') !== 0) && (file.slice(-5) === '.json');
        }).forEach(function(file){
            var entityName = file.slice(0, -5);
            var attributesObj = JSON.parse(fs.readFileSync(__dirname+'/../models/attributes/'+file));
            var statuses = self.statusFieldList(attributesObj);
            if (statuses.length > 0) {
                for (var i = 0; i < statuses.length; i++)
                    statuses[i] = {status: statuses[i], statusTrad: 'entity.'+entityName+'.'+statuses[i]};
                entities.push({entity: entityName, entityTrad: 'entity.'+entityName+'.label_entity', statuses: statuses});
            }
        });

        // return value example: [{
        //     entity: 'e_test',
        //     entityTrad: 'entity.e_test.label_entity',
        //     statuses: [{
        //         status: 's_status',
        //         statusTrad: 'entity.e_test.s_status'
        //     }]
        // }];
        return entities;
    },
    statusFieldList: function(attributes) {
        var list = [];
        for (var prop in attributes)
            if (prop.indexOf('s_') == 0)
                list.push(prop);
        return list;
    },
    translate: function (entity, attributes, lang) {
        var self = this;
        var statusList = self.statusFieldList(attributes);

        for (var i = 0; i < statusList.length; i++) {
            var statusAlias = 'r_'+statusList[i].substring(2);
            if (!entity[statusAlias] || !entity[statusAlias].r_translations)
                continue;
            for (var j = 0; j < entity[statusAlias].r_translations.length; j++) {
                if (entity[statusAlias].r_translations[j].f_language == lang) {
                    entity[statusAlias].f_name = entity[statusAlias].r_translations[j].f_value;
                    break;
                }
            }
        }
    },
    setStatus: function(entityName, entityId, statusName, statusId, comment = "") {
        var self = this;
        return new Promise((resolve, reject)=> {
            var historyModel = 'E_history_'+entityName+'_' + statusName;
            var historyAlias = 'r_history_' + statusName.substring(2);
            var statusAlias = 'r_' + statusName.substring(2);
            var entityTree = self.fullEntityFieldTree(entityName);
            var includeTree = self.buildIncludeFromTree(entityTree)

            models['E_'+entityName.substring(2)].findOne({
                where: {
                    id: entityId
                },
                include: includeTree
            }).then((entity)=> {
                // Find the children of the current status
                models.E_status.findOne({
                    where: {
                        id: entity[statusAlias].id
                    },
                    include: [{
                        model: models.E_status,
                        as: 'r_children',
                        include: [{
                            model: models.E_action,
                            as: 'r_actions',
                            order: ["f_position", "ASC"],
                            include: [{
                                model: models.E_media,
                                as: 'r_media',
                                include: {
                                    all: true,
                                    nested: true
                                }
                            }]
                        }]
                    }]
                }).then((current_status)=> {
                    if (!current_status || !current_status.r_children) {
                        logger.debug("Not found - Set status");
                        return reject("Not found - Set status");
                    }

                    // Check if new status is actualy the current status's children
                    var children = current_status.r_children;
                    var nextStatus = false;
                    for (var i = 0; i < children.length; i++) {
                        if (children[i].id == statusId) {
                            nextStatus = children[i];
                            break;
                        }
                    }
                    // Unauthorized
                    if (nextStatus === false) {
                        return reject({
                            level: 'error',
                            message: 'component.status.error.illegal_status'
                        });
                    }

                    // Execute newStatus actions
                    nextStatus.executeActions(entity).then(()=> {
                        // Create history record for this status field
                        var createObject = {};
                        createObject.f_comment = comment;
                        createObject["fk_id_status_" + nextStatus.f_field.substring(2)] = nextStatus.id;
                        createObject["fk_id_"+entityName+"_history_" + statusName.substring(2)] = entityId;
                        models[historyModel].create(createObject).then(()=> {
                            entity['setR'+statusAlias.substring(1)](nextStatus.id);
                            resolve();
                        });
                    }).catch((err)=> {
                        console.error(err);
                        var createObject = {};
                        createObject.f_comment = comment;
                        createObject["fk_id_status_" + nextStatus.f_field.substring(2)] = nextStatus.id;
                        createObject["fk_id_"+entityName+"_history_" + statusName.substring(2)] = entityId;
                        models[historyModel].create(createObject).then(()=> {
                            entity['setR'+statusAlias.substring(1)](nextStatus.id);
                            reject(err);
                        });
                    });
                });
            }).catch(reject);
        });
    },
    currentStatus: function(entityName, entity, attributes, lang) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var statusList = self.statusFieldList(attributes);
            if (statusList.length == 0)
                return resolve([]);

            var nextStatusPromises = [];
            // Get the last history of each status field
            // Include r_children to have next status
            for (var i = 0; i < statusList.length; i++) {
                var model = 'E_history_'+entityName+'_'+statusList[i];
                var where = {};
                where['fk_id_'+entityName.substring(2)+'_history_'+statusList[i].substring(2)] = entity.id;
                (function(status, Model, whereCls) {
                    nextStatusPromises.push(Model.findAll({
                        limit: 1,
                        order: [["createdAt", "DESC"]],
                        where: whereCls,
                        include: [{
                            model: models.E_status,
                            as: 'r_'+status.substring(2),
                            include: [{
                                model: models.E_translation,
                                as: 'r_translations'
                            }]
                        }]
                    }));
                })(statusList[i], models[model], where);
            }

            Promise.all(nextStatusPromises).then(function(histories) {
                // Queries have limit 1, we know there's only one row in each array
                // Remove useless array and assign current R_status (r_[alias])
                for (var i = 0; i < statusList.length; i++)
                    if (histories[i][0] && histories[i][0]['r_'+statusList[i].substring(2)]) {
                        histories[i] = histories[i][0]['r_'+statusList[i].substring(2)];
                        histories[i].translate(lang);
                        entity[statusList[i]] = histories[i].f_name;
                    }

                resolve();
            }).catch(function(err){
                console.log(err);
                reject(err);
            });
        });
    }
}
