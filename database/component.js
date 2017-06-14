// **** Database Generator Component ****

//Sequelize
var models = require('../models/');

// Insert a new component link to an entity
exports.createNewComponentOnEntity = function(attr, callback) {

    var idModule = attr.id_module;
    var options = attr.options;

    if (typeof options !== 'undefined' && options && idModule != null) {

        models.Component.create({
            name: options.showValue,
            codeName: options.value,
            id_module: idModule,
            version: 1
        }).then(function(createdComponent) {
            createdComponent.addDataEntity(attr.id_data_entity).then(function(){
                var info = {
                    insertId: createdComponent.id,
                    message: "database.component.create.successOnEntity",
                    messageParams: [createdComponent.name, createdComponent.id, attr.options.showSource]
                };
                callback(null, info);
            });

        }).catch(function(err) {
            callback(err, null);
        });
    }
}

// Insert a new component link to a module
exports.createNewComponentOnModule = function(attr, callback) {

    var id_module = attr.id_module;
    var options = attr.options;

    if (typeof options !== 'undefined' && options && id_module != 0) {
        models.Component.create({
            name: options.showValue,
            codeName: options.value,
            id_module: id_module,
            version: 1
        }).then(function(createdComponent) {
            var info = {
                insertId: createdComponent.id,
                message: "database.component.create.success",
                messageParams: [createdComponent.name, createdComponent.id]
            };

            callback(null, info);
        }).catch(function(err) {
            callback(err, null);
        });
    }
}

// Get a component with a given name in a module
exports.getComponentByCodeNameInModule = function(idModule, codeName, displayName, callback) {

    models.Component.findOne({
        where:{
            codeName: codeName,
            id_module: idModule
        }
    }).then(function(component) {
        if (!component) {
            var err = new Error();
            err.message = "database.component.notFound.notFoundedInModule";
            err.messageParams = [displayName, idModule];
            return callback(err, null);
        }
        callback(null, component);
    }).catch(function(err) {
        callback(err, null);
    });
}

// Get a component with a given name in a module
exports.getComponentByNameInModule = function(idModule, nameComponent, callback) {

    models.Component.findOne({
        where:{
            name: nameComponent,
            id_module: idModule
        }
    }).then(function(component) {
        if (!component) {
            err = new Error();
            err.message = "database.component.notFound.notFoundedInModule";
            err.messageParams = [nameComponent, idModule];
            return callback(err, null);
        }
        callback(null, component);
    }).catch(function(err) {
        callback(err, null);
    });
}

// Get a component codeName and the has many entity and check if the given ID entity is in
exports.checkIfComponentCodeNameExistOnEntity = function(codeNameComponent, idModule, idEntity, callback) {

    models.DataEntity.findOne({
        where: {
            id: idEntity,
            id_module: idModule
        }
    }).then(function(foundEntity){
        if(foundEntity){
            var alreadyExist = false;
            foundEntity.getComponents().then(function(components){
                for(var i=0; i<components.length; i++){
                    if(components[i].codeName == codeNameComponent){
                        alreadyExist = true;
                    }
                }
                callback(null, alreadyExist);
            });
        } else {
            var err = new Error();
            err.message = "database.entity.notFound.withThisName";
            err.messageParams = [codeNameComponent];
            return callback(err, null);
        }
    }).catch(function(err) {
        callback(err, null);
    });
}

// Get a component codeName and the has many entity and check if the given ID entity is in
exports.deleteComponentOnEntity = function(codeNameComponent, idModule, idEntity, callback) {

    models.DataEntity.findOne({
        where: {
            id: idEntity,
            id_module: idModule
        }
    }).then(function(foundEntity){
        if(foundEntity){
            var destroyed = false;
            foundEntity.getComponents().then(function(components){
                for(var i=0; i<components.length; i++){
                    if(components[i].codeName == codeNameComponent){
                        destroyed = true;
                        components[i].destroy();
                    }
                }
                if(!destroyed){
                    var err = new Error();
                    err.message = "database.component.delete.error";
                    return callback(err, null);
                }
                var info = {
                    message: "database.component.delete.success"
                };
                callback(null, info);
            });
        } else{
            var err = new Error();
            err.message = "database.component.delete.error";
            return callback(err, null);
        }
    }).catch(function(err) {
        callback(err, null);
    });
}