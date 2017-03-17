// **** Database Generator Component ****

//Sequelize
var models = require('../models/');

// Insert a new component link to an entity
exports.createNewComponentOnEntity = function(attr, callback) {

    var idModule = attr.id_module;
    var options = attr.options;

    if (typeof options !== 'undefined' && options && idModule != 0) {

        models.Component.create({
            name: options.showValue,
            codeName: options.value,
            id_module: idModule,
            version: 1
        }).then(function(createdComponent) {
            if (!createdComponent) {
                var err = new Error();
                err.message = "Sorry, an error occured while creating the component.";
                return callback(err, null);
            }

            createdComponent.addDataEntity(attr.id_data_entity).then(function(){
                var info = {
                    insertId: createdComponent.id,
                    message: "New component "+createdComponent.id+" | "+createdComponent.name+" created."
                }
                callback(null, info);
            });

        }).catch(function(err) {
            callback(err, null);
        });
    }
}

// Insert a new component link to a module
exports.createNewComponentOnModule = function(attr, callback) {

    var name = "";
    var id_module = 0;
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {
        id_module = attr.id_module;
        var options = attr.options;

        if (typeof options !== 'undefined' && options && id_module != 0) {
            models.Component.create({
                name: options.showValue,
                codeName: options.value,
                id_module: id_module,
                version: version
            }).then(function(created_component) {
                if (!created_component) {
                    var err = new Error();
                    err.message = "Sorry, an error occured while creating the component.";
                    return callback(err, null);
                }
                var info = {
                    insertId: created_component.id,
                    message: "New component "+created_component.id+" | "+created_component.name+" created."
                }
                callback(null, info);
            }).catch(function(err) {
                callback(err, null);
            });
        }
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
            err = new Error();
            err.message = "Sorry, no component with the name '"+displayName+"' exist in the module with id "+idModule+".";
            return callback(err, null);
        }
        callback(null, component);
    }).catch(function(err) {
        callback(err, null);
    });
}

// Get a component with a given name in a module
exports.getComponentByNameInModule = function(idModule, name_component, callback) {

    models.Component.findOne({
        where:{
            name: name_component,
            id_module: idModule
        }
    }).then(function(component) {
        if (!component) {
            err = new Error();
            err.message = "Sorry, no component with the name '"+name_component+"' exist in the module with id "+idModule+".";
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
            id: idEntity
        }
    }).then(function(foundEntity){
        var alreadyExist = false;

        foundEntity.getComponents().then(function(components){
            for(var i=0; i<components.length; i++){
                if(components[i].codeName == codeNameComponent){
                    alreadyExist = true;
                }
            }
            callback(null, alreadyExist);
        });
    }).catch(function(err) {
        callback(err, null);
    });
}
