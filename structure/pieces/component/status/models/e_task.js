var builder = require('../utils/model_builder');
var fs = require('fs-extra');

var attributes_origin = require("./attributes/e_task.json");
var associations = require("./options/e_task.json");

var models;

module.exports = (sequelize, DataTypes) => {
    var attributes = builder.buildForModel(attributes_origin, DataTypes);
    var options = {
        tableName: 'ID_APPLICATION_e_task',
        timestamps: true
    };

    var Model = sequelize.define('E_task', attributes, options);
    Model.associate = builder.buildAssociation('E_task', associations);
    builder.addHooks(Model, 'e_task', attributes_origin);

    Model.addHook('beforeCreate', (model, options)=> {
    	return new Promise((resolve, reject) => {
	    	if (!models)
	    		models = require('../models/');

	    	models.sequelize.query("\
				SELECT\
					`E_robot`.`id` as `robot`,\
					count(`E_task`.`id`) as `nb_pending_task`\
				FROM\
					`ID_APPLICATION_e_robot` as `E_robot`\
				LEFT JOIN\
					`ID_APPLICATION_e_task` as `E_task`\
					ON\
					`E_task`.`fk_id_robot_robot` = `E_robot`.`id`\
					AND\
					`f_type`='automatic'\
				LEFT JOIN\
					`ID_APPLICATION_e_status` as `r_state`\
					ON\
					`E_task`.`fk_id_status_state` = `r_state`.`id`\
					AND\
					`r_state`.`f_name` = 'pending'\
				WHERE\
					`E_robot`.`f_current_status` = 'connected'\
				GROUP BY\
					`E_robot`.`id`\
				ORDER BY\
					`nb_pending_task` ASC\
	    	", {type: sequelize.QueryTypes.SELECT}).spread(result => {

	    		// No robot with connected status. Do not assign robot to task
	    		if (!result)
					return resolve(model);

	    		// Robot with minimum pending task and connected status found. Assign to new task
    			model.fk_id_robot_robot = result.robot;
    			resolve(model);
	    	}).catch(err => {
	    		console.error("E_task.beforeCreate(): Couldn't assign Robot to Task.");
	    		console.error(err);
	    		resolve();
	    	});
    	});
    })
    return Model;
};