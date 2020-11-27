const builder = require('../utils/model_builder');
const attributes_origin = require("./attributes/e_media.json");
const associations = require("./options/e_media.json");

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes);
	const options = {
		tableName: 'e_media',
		timestamps: true
	};

	const Model = sequelize.define('E_media', attributes, options);
	Model.associate = builder.buildAssociation('E_media', associations);

	Model.prototype.getFieldsToInclude = function() {
		const self = this;
		const mediaType = self.f_type.toLowerCase();
		if (!self['r_media_' + mediaType]) {
			console.error("No media with type " + mediaType);
			return null;
		}
		return self['r_media_' + mediaType].parseForInclude();
	}

	Model.prototype.execute = function(data) {
		const self = this;
		const mediaType = self.f_type.toLowerCase();
		return new Promise(function(resolve, reject) {
			if (!self['r_media_' + mediaType])
				return reject("No media with type " + mediaType);
			self['r_media_' + mediaType].execute(resolve, reject, data);
		});
	}
	builder.addHooks(Model, 'e_media', attributes_origin);

	return Model;
};