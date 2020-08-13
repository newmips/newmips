const {sequelize} = require('../models/');
const fs = require('fs-extra');

function pushToSyncQuery(app, query) {
	try {
		const toSync = JSON.parse(fs.readFileSync('workspace/' + app.name + '/models/toSync.json'));
		if (!toSync.queries)
			toSync.queries = [];
		toSync.queries.push(query);
		fs.writeFileSync('workspace/' + app.name + '/models/toSync.json', JSON.stringify(toSync, null, 4), 'utf8');
	} catch (e) {
		console.log(e);
		return false;
	}
	return true;
}

// Drop entity on application sync
exports.dropEntityOnSync = (app, entity) => {
	let query = "";
	if(sequelize.options.dialect == "mysql")
		query = "SET FOREIGN_KEY_CHECKS=0;DROP TABLE IF EXISTS " + entity + ";SET FOREIGN_KEY_CHECKS=1;";
	else if(sequelize.options.dialect == "postgres")
		query = "DROP TABLE \"" + entity + "\" CASCADE;";

	return pushToSyncQuery(app, query);
}

// Drop field
exports.dropField = (data) => {

	let query = "";
	if(sequelize.options.dialect == "mysql")
		query = "ALTER TABLE `" + data.entity.name + "` DROP " + data.fieldToDrop + ";";
	if(sequelize.options.dialect == "postgres")
		query = "ALTER TABLE \"" + data.entity.name + "\" DROP " + data.fieldToDrop + ";";

	return pushToSyncQuery(data.application, query);
}

exports.dropFKField = async(data) => {

	// *** 1 - Initialize variables according to options ***
	const table_name = data.entity.name;

	let query = "";
	if (sequelize.options.dialect == "mysql") {
		query = "SELECT constraint_name FROM `information_schema`.`KEY_COLUMN_USAGE` where `COLUMN_NAME` = '" + data.fieldToDrop + "' && `TABLE_NAME` = '" + table_name + "';";
		const constraintName = await sequelize.query(query);

		if (typeof constraintName[0][0] === "undefined")
			return;

		query = "ALTER TABLE " + table_name + " DROP FOREIGN KEY " + constraintName[0][0].constraint_name + "; ALTER TABLE " + table_name + " DROP " + data.fieldToDrop + ";";
	} else if(sequelize.options.dialect == "postgres") {
		query = "ALTER TABLE " + table_name + " DROP " + data.fieldToDrop + ";";
	}
	pushToSyncQuery(data.application, query);
}

// Delete field related to multiple
exports.dropFKMultipleField = async (data) => {

	// *** 1 - Initialize variables according to options ***
	const table_name = data.entity.name;
	let query = "";
	if(sequelize.options.dialect == "mysql")
		query = "SELECT constraint_name FROM `information_schema`.`KEY_COLUMN_USAGE` where `COLUMN_NAME` = '" + data.fieldToDrop + "' && `TABLE_NAME` = '" + table_name + "';";
	else if(sequelize.options.dialect == "postgres")
		query = "SELECT constraint_name FROM information_schema.KEY_COLUMN_USAGE where column_name = '" + data.fieldToDrop + "' AND table_name = '" + table_name + "';";

	const constraintName = await sequelize.query(query);
	if (typeof constraintName[0][0] === "undefined")
		return;
	query = "ALTER TABLE " + table_name + " DROP FOREIGN KEY " + constraintName[0][0].constraint_name + "; ALTER TABLE " + table_name + " DROP " + data.fieldToDrop +";";
	pushToSyncQuery(data.application, query);
}

// Get real SQL type in DB, not sequelize datatype
// Params:
// {
//	 table: yourTableName,
//	 column: yourColumnName
// }
exports.getDatabaseSQLType = async(params) => {
	const request = "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" + params.table + "' AND COLUMN_NAME = '" + params.column + "';"
	const result = await sequelize.query(request, {
		type: sequelize.QueryTypes.SELECT
	})

	if (result.length > 0)
		return {
			sqlDataType: result[0].DATA_TYPE,
			sqlDataTypeLength: result[0].CHARACTER_MAXIMUM_LENGTH
		}

	return {
		sqlDataType: false,
		sqlDataTypeLength: false
	}
}

exports.retrieveWorkspaceHasManyData = async (data, entity, foreignKey) => {
	delete require.cache[require.resolve('../workspace/' + data.application.name + '/models/')];
	const workspaceModels = require('../workspace/' + data.application.name + '/models/'); // eslint-disable-line
	const where = {};
	where[foreignKey] = {
		[workspaceModels.$ne]: null
	};

	try {
		return await workspaceModels[entity.charAt(0).toUpperCase() + entity.toLowerCase().slice(1)].findAll({
			attributes: ["id", foreignKey],
			where: where
		});
	} catch(err) {
		if(!data.isGeneration)
			console.error(err);
		return null;
	}
}