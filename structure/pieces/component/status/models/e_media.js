var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var attributes_origin = require("./attributes/e_media.json");
var associations = require("./options/e_media.json");

module.exports = (sequelize, DataTypes) => {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_media',
        timestamps: true
    };

    var Model = sequelize.define('E_media', attributes, options);
    Model.associate = builder.buildAssociation('E_media', associations);

    Model.prototype.getFieldsToInclude = function() {
        let self = this;
        let mediaType = self.f_type.toLowerCase();
        if (!self['r_media_' + mediaType]) {
            console.error("No media with type " + mediaType);
            return null;
        }
        return self['r_media_' + mediaType].parseForInclude();
    }

    Model.prototype.execute = function(data) {
        let self = this;
        let mediaType = self.f_type.toLowerCase();
        return new Promise(function(resolve, reject) {
            if (!self['r_media_' + mediaType])
                return reject("No media with type " + mediaType);
            self['r_media_' + mediaType].execute(resolve, reject, data);
        });
    }
    builder.addHooks(Model, 'e_media', attributes_origin);

    return Model;
};