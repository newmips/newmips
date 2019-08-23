// **** Database Generator Component ****

//Sequelize
var models = require('../models/');

// Insert a new component link to an entity
exports.createNewComponentOnEntity = function (attr, callback) {

    var idModule = attr.id_module;
    var options = attr.options;

    if (typeof options !== 'undefined' && options && idModule != null) {
        models.Component.create({
            name: options.showValue,
            codeName: options.value,
            id_module: idModule,
            version: 1
        }).then(function (createdComponent) {
            createdComponent.addDataEntity(attr.id_data_entity).then(function () {
                var info = {
                    insertId: createdComponent.id,
                    message: "database.component.create.successOnEntity",
                    messageParams: [createdComponent.name, createdComponent.id, attr.options.showSource]
                };
                callback(null, info);
            });

        }).catch(function (err) {
            callback(err, null);
        });
    }
}

// Insert a new component link to a module
exports.createNewComponentOnModule = function (attr, callback) {

    var id_module = attr.id_module;
    var options = attr.options;

    if (typeof options !== 'undefined' && options && id_module != 0) {
        models.Component.create({
            name: options.showValue,
            codeName: options.value,
            id_module: id_module,
            version: 1
        }).then(function (createdComponent) {
            var info = {
                insertId: createdComponent.id,
                message: "database.component.create.success",
                messageParams: [createdComponent.name, createdComponent.id]
            };

            callback(null, info);
        }).catch(function (err) {
            callback(err, null);
        });
    }
}

// Get a component with a given code name in a module
exports.getComponentByCodeNameInModule = function(idModule, codeName, displayName, callback) {
    models.Component.findOne({
        where: {
            codeName: codeName,
            id_module: idModule
        }
    }).then(function (component) {
        if (!component) {
            var err = new Error();
            err.message = "database.component.notFound.notFoundInModule";
            err.messageParams = [displayName, idModule];
            return callback(err, null);
        }
        callback(null, component);
    }).catch(function (err) {
        callback(err, null);
    });
}

// Get a component with a given name in a module
exports.getComponentByNameInModule = function (idModule, nameComponent, callback) {

    models.Component.findOne({
        where: {
            name: nameComponent,
            id_module: idModule
        }
    }).then(function (component) {
        if (!component) {
            err = new Error();
            err.message = "database.component.notFound.notFoundInModule";
            err.messageParams = [nameComponent, idModule];
            return callback(err, null);
        }
        callback(null, component);
    }).catch(function (err) {
        callback(err, null);
    });
}

// Get a component codeName and the has many entity and check if the given ID entity is in
exports.checkIfComponentCodeNameExistOnEntity = function (codeNameComponent, idModule, idEntity, callback) {

    models.DataEntity.findOne({
        where: {
            id: idEntity,
            id_module: idModule
        }
    }).then(function (foundEntity) {
        if (foundEntity) {
            var alreadyExist = false;
            foundEntity.getComponents().then(function (components) {
                for (var i = 0; i < components.length; i++)
                    if (components[i].codeName == codeNameComponent)
                        alreadyExist = true;

                callback(null, alreadyExist);
            });
        } else {
            var err = new Error();
            err.message = "database.entity.notFound.withThisName";
            err.messageParams = [codeNameComponent];
            return callback(err, null);
        }
    }).catch(function (err) {
        callback(err, null);
    });
}

exports.checkIfComponentCodeNameExistOnAnEntity = function (codeNameComponent,idModule, callback) {
    models.Component.findOne({where: {codeName: codeNameComponent,id_module:idModule}, include: [{all: true}]}).then(function (component) {
        if (component) {
            if (component.DataEntities && component.DataEntities.length > 0)
                callback(null, true);
            else
                callback(null, false);
        } else {
            var err = new Error();
            err.message = "database.component.notFound.withThisName";
            err.messageParams = [codeNameComponent];
            return callback(err, null);
        }
    }).catch(function (e) {
        callback(e, null);
    });
};

// Get a component codeName and the has many entity and check if the given ID entity is in
exports.deleteComponentOnEntity = function(codeNameComponent, idModule, idEntity, callback) {

    models.DataEntity.findOne({
        where: {
            id: idEntity,
            id_module: idModule
        }
    }).then(function (foundEntity) {
        if (foundEntity) {
            var destroyed = false;
            foundEntity.getComponents().then(function (components) {
                for (var i = 0; i < components.length; i++) {
                    if (components[i].codeName == codeNameComponent) {
                        destroyed = true;
                        components[i].destroy();
                    }
                }
                if (!destroyed) {
                    var err = new Error();
                    err.message = "database.component.delete.error";
                    return callback(err, null);
                }
                var info = {
                    message: "database.component.delete.success"
                };
                callback(null, info);
            });
        } else {
            var err = new Error();
            err.message = "database.component.delete.error";
            return callback(err, null);
        }
    }).catch(function (err) {
        callback(err, null);
    });
}

// Delete component_data_entity entry without delete component
exports.deleteComponentAndEntityAssociation = function (codeNameComponent, idModule,idEntity, callback) {
    models.Component.findOne({where: {codeName: codeNameComponent,id_module:idModule}, include: [{all: true}]}).then(function (component) {
        if (component) {
            if (component.DataEntities && component.DataEntities.length) {
                for (var i = 0; i < component.DataEntities.length; i++) {
                    var dataEntity = component.DataEntities[i];
                    if (Array.isArray(dataEntity.component_data_entity)) {
                        for (var j = 0; j < dataEntity.component_data_entity.length; j++) {
                            var association = dataEntity.component_data_entity[j];
                            if (association.id_entity === idEntity) {
                                association.destroy();
                                return callback(null);
                            }
                        }
                    } else if (dataEntity.component_data_entity.id_entity === idEntity) {
                        dataEntity.component_data_entity.destroy();
                        return callback(null);
                    }
                }
            }
            callback(null);
        } else {
            var err = new Error();
            err.message = "database.component.notFound.withThisName";
            return callback(err, null);
        }
    }).catch(function (e) {
        callback(e, null);
    });
}

exports.deleteComponentByCodeNameInModule = function (codeNameComponent, idModule, callback) {
    models.Component.findOne({
        where: {
            codeName: codeNameComponent,
            id_module: idModule
        }
    }).then(function (component) {
        if (!component) {
            err = new Error();
            err.message = "database.component.notFound.notFoundInModule";
            err.messageParams = [codeNameComponent, idModule];
            return callback(err, null);
        } else {
            component.destroy();
            callback(null, component);
        }
    }).catch(function (err) {
        callback(err, null);
    });
}

exports.deleteComponentOnModule = function(codeNameComponent, idModule, callback) {

    models.Component.findOne({
        where: {
            codeName: codeNameComponent,
            id_module: idModule
        }
    }).then(function(foundComponent){
        if(foundComponent){
            foundComponent.destroy().then(function(){
                callback(null, true);
            });
        } else{
            var err = new Error();
            err.message = "database.component.delete.error";
            return callback(err, null);
        }
    }).catch(function(err) {
        console.error(err);
        callback(err, null);
    });
}