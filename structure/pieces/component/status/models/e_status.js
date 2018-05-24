var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var attributes_origin = require("./attributes/e_status.json");
var associations = require("./options/e_status.json");

module.exports = function (sequelize, DataTypes) {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_status',
        classMethods: {
            associate: builder.buildAssociation('E_status', associations)
        },
        instanceMethods: {
            translate: function(lang) {
                var self = this;
                if (!self.r_translations)
                    return;
                for (var i = 0; i < self.r_translations.length; i++)
                    if (self.r_translations[i].f_language == lang) {
                        self.f_name = self.r_translations[i].f_value;
                        break;
                    }
            },
            executeActions: function(entitySource) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    function orderedExecute(actions, idx) {
                        // All actions executed
                        if (!actions || !actions[idx])
                            return resolve();
                        // No media to execute, go next
                        if (!actions[idx].r_media)
                            return orderedExecute(actions, ++idx);
                        // Media execution
                        actions[idx].r_media.execute(entitySource).then(function() {
                            orderedExecute(actions, ++idx);
                        }).catch(function(err) {reject(err)});
                    }
                    orderedExecute(self.r_actions, 0);
                });
            }
        },
        timestamps: true
    };

    var Model = sequelize.define('E_status', attributes, options);

    builder.addHooks(Model, 'e_status', attributes_origin);

    return Model;
};