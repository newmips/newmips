const {sequelize} = require('../models/');
const fs = require('fs-extra');

const mysql = require('promise-mysql');
const {Client} = require('pg');

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
	if(['mysql', 'mariadb'].includes(sequelize.options.dialect))
		query = "SET FOREIGN_KEY_CHECKS=0;DROP TABLE IF EXISTS " + entity + ";SET FOREIGN_KEY_CHECKS=1;";
	else if(sequelize.options.dialect == "postgres")
		query = "DROP TABLE \"" + entity + "\" CASCADE;";

	return pushToSyncQuery(app, query);
}

// Drop field
exports.dropField = (data) => {

	let query = "";
	if(['mysql', 'mariadb'].includes(sequelize.options.dialect))
		query = "ALTER TABLE `" + data.entity.name + "` DROP " + data.fieldToDrop + ";";
	if(sequelize.options.dialect == "postgres")
		query = "ALTER TABLE \"" + data.entity.name + "\" DROP " + data.fieldToDrop + ";";

	return pushToSyncQuery(data.application, query);
}

exports.dropFKField = async(data) => {

	// *** 1 - Initialize variables according to options ***
	const table_name = data.entity.name;

	let query = "";
	if(['mysql', 'mariadb'].includes(sequelize.options.dialect)){
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
	if(['mysql', 'mariadb'].includes(sequelize.options.dialect))
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
	// eslint-disable-next-line global-require
	const dbConf = require(__workspacePath + '/' + data.application.name + '/config/database');
	let conn;
	if(['mysql', 'mariadb'].includes(dbConf.dialect)) {
		conn = await mysql.createConnection({
			host: dbConf.host,
			user: dbConf.user,
			password: dbConf.password,
			database: dbConf.database,
			port: dbConf.port
		});
	} else if(dbConf.dialect == 'postgres') {
		conn = new Client({
			host: dbConf.host,
			user: dbConf.user,
			password: dbConf.password,
			database: dbConf.database,
			port: dbConf.port
		});
		conn.connect();
	}

	const request = "SELECT `id`, `" + foreignKey + "` FROM `" + entity.toLowerCase() + "` AS `Entity` WHERE `Entity`.`" + foreignKey + "` IS NOT NULL;"

	let queryData = null;
	try {
		const query = await conn.query(request); // eslint-disable-line
		// TODO - To test
		queryData = query;
	} catch(err) {
		if(!data.isGeneration)
			console.error(err);
		return null;
	}
	conn.end();
	return queryData;
}

exports.generateFkConstraint = data => {
	let query = "";
	if (['mysql', 'mariadb'].includes(sequelize.options.dialect)) {
		query = "ALTER TABLE " + data.options.target + " ADD FOREIGN KEY (" + data.options.foreignKey + ") REFERENCES " + data.options.source + "(id);";
	} else if(sequelize.options.dialect == "postgres") {
		query = "ALTER TABLE " + data.options.target + " ADD FOREIGN KEY (" + data.options.foreignKey + ") REFERENCES " + data.options.source + "(id);";
	}

	pushToSyncQuery(data.application, query);
}