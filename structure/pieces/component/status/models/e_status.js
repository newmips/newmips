const builder = require('../utils/model_builder');
const attributes_origin = require("./attributes/e_status.json");
const associations = require("./options/e_status.json");

module.exports = (sequelize, DataTypes) => {
	const attributes = builder.buildForModel(attributes_origin, DataTypes);
	const options = {
		tableName: 'e_status',
		timestamps: true
	};

	const Model = sequelize.define('E_status', attributes, options);
	Model.associate = builder.buildAssociation('E_status', associations);
	Model.prototype.translate = function(lang) {
		const self = this;
		if (!self.r_translations)
			return;
		for (let i = 0; i < self.r_translations.length; i++)
			if (self.r_translations[i].f_language == lang) {
				self.f_name = self.r_translations[i].f_value;
				break;
			}
	};
	Model.prototype.executeActions = function(entitySource) {
		const self = this;
		return new Promise((resolve, reject) => {
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
				}).catch(function(err) {
					reject(err)
				});
			}
			orderedExecute(self.r_actions, 0);
		});
	};
	builder.addHooks(Model, 'e_status', attributes_origin);

	return Model;
};