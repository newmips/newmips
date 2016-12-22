// **** API Component ****

//Sequelize
var models = require('../models/');

// Insert a new component link to an entity
exports.createNewComponent= function(attr, callback) {

    var name = "";
    var id_data_entity = 0;
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {

        id_data_entity = attr.id_data_entity;
        options = attr.options;

        if (typeof options !== 'undefined' && options && id_data_entity != 0) {

            models.Component.create({
                name: options.name,
                id_data_entity: id_data_entity,
                version: version
            }).then(function(created_component) {
                if (!created_component) {
                    err = new Error();
                    err.message = "Sorry, an error occured.";
                    return callback(err, null);
                }
                var info = {
                    insertId: created_component.id,
                    message: "New component " + created_component.id + " | "+created_component.name+" created."
                }
                callback(null, info);

            }).catch(function(err) {
                callback(err, null);
            });
        }
    }
}

// Get a component with a given name
exports.getComponentByName = function(attr, callback) {

    var name = "";
    var id_data_entity = 0;
    var version = 1;

    if (typeof attr !== 'undefined' && attr) {
        id_data_entity = attr.id_data_entity;
        options = attr.options;

        if (typeof options !== 'undefined' && options && id_data_entity != 0) {

            models.Component.findOne({
                where:{
                    name: options.name,
                    id_data_entity: id_data_entity
                }
            }).then(function(component) {
                if (!component) {
                    err = new Error();
                    err.message = "Sorry, no component with this name exist.";
                    return callback(err, null);
                }
                callback(null, component);

            }).catch(function(err) {
                callback(err, null);
            });
        }
    }
}