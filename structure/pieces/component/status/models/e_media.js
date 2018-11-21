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
        var self = this;
        if (!self['r_media_' + self.f_type.toLowerCase()])
            return reject("No media with type " + self.f_type.toLowerCase());
        return self['r_media_' + self.f_type.toLowerCase()].parseForInclude();
    }

    Model.prototype.execute = function(data) {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (!self['r_media_' + self.f_type.toLowerCase()])
                return reject("No media with type " + self.f_type.toLowerCase());
            self['r_media_' + self.f_type.toLowerCase()].execute(resolve, reject, data);
        });
    }
    builder.addHooks(Model, 'e_media', attributes_origin);

    return Model;
};