const sequelize = require('../models/').sequelize;
const fs = require('fs-extra');

function pushToSyncQuery(app, query) {
    try {
        let toSync = JSON.parse(fs.readFileSync('workspace/' + app.name + '/models/toSync.json'));
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

// DataEntity
exports.dropDataEntity = (app, entity) => {
    let query = "";

    if(sequelize.options.dialect == "mysql")
        query = "SET FOREIGN_KEY_CHECKS=0;DROP TABLE IF EXISTS " + entity + ";SET FOREIGN_KEY_CHECKS=1;";
    else if(sequelize.options.dialect == "postgres")
        query = "DROP TABLE IF EXISTS \"" + entity + "\" CASCADE;";

    return pushToSyncQuery(app, query);
}

exports.addConstraintDeleteUpdate = function (attr, callback) {
    var query = '';
    if(sequelize.options.dialect == "mysql"){
        if (attr.dropForeignKey)
            query += "ALTER TABLE " + attr.id_application + "_" + attr.sourceEntity + " DROP FOREIGN KEY " + attr.foreignKey + "; ";
        query += " ALTER TABLE " + attr.id_application + "_" + attr.sourceEntity + " ADD CONSTRAINT " + attr.foreignKey
            + " FOREIGN KEY (" + attr.foreignKey + ") REFERENCES " + attr.id_application + "_" + attr.targetEntity
            + "(" + attr.targetKey + ") ON DELETE " + attr.constraintDelete + " ON UDPATE " + attr.constraintUpdate + " ;";
    } else if(sequelize.options.dialect == "postgres"){
        if (attr.dropForeignKey)
            query += "ALTER TABLE \"" + attr.id_application + "_" + attr.sourceEntity + "\" DROP FOREIGN KEY " + attr.foreignKey + "; ";
        query += " ALTER TABLE \"" + attr.id_application + "_" + attr.sourceEntity + "\" ADD CONSTRAINT " + attr.foreignKey
            + " FOREIGN KEY (" + attr.foreignKey + ") REFERENCES " + attr.id_application + "_" + attr.targetEntity
            + "(" + attr.targetKey + ") ON DELETE " + attr.constraintDelete + " ON UDPATE " + attr.constraintUpdate + " ;";
    }
    if (!pushToSyncQuery(attr.id_application, query))
        return callback("ERROR: Can't set constraint");
    callback();
}

// Drop DataField
exports.dropDataField = async (data) => {

    let query = "";
    if(sequelize.options.dialect == "mysql")
        query = "ALTER TABLE " + data.application.name + "_" + data.entity.name + " DROP " + data.fieldToDrop + ";";
    if(sequelize.options.dialect == "postgres")
        query = "ALTER TABLE \"" + data.application.name + "_" + data.entity.name + "\" DROP " + data.fieldToDrop + ";";

    return pushToSyncQuery(attr.application, query);
}

exports.dropFKDataField = async (data) => {

    // *** 1 - Initialize variables according to options ***
    let table_name = data.entity.name;

    let query = "";
    if (sequelize.options.dialect == "mysql")
        query = "SELECT constraint_name FROM `information_schema`.`KEY_COLUMN_USAGE` where `COLUMN_NAME` = '" + data.fieldToDrop + "' && `TABLE_NAME` = '" + table_name + "';";
    else(sequelize.options.dialect == "postgres")
        query = "SELECT constraint_name FROM information_schema.KEY_COLUMN_USAGE where column_name = '" + data.fieldToDrop + "' AND table_name = '" + table_name + "';";

    let constraintName = await sequelize.query(query);

    if (typeof constraintName[0][0] === "undefined")
        return;

    query = "ALTER TABLE " + table_name + " DROP FOREIGN KEY " + constraintName[0][0].constraint_name + "; ALTER TABLE " + table_name + " DROP " + data.fieldToDrop + ";";

    return pushToSyncQuery(data.application, query);
}

// Delete field related to multiple
exports.dropFKMultipleDataField = async (data) => {

    // *** 1 - Initialize variables according to options ***
    let table_name = data.entity.name;
    let query = "";
    if(sequelize.options.dialect == "mysql")
        query = "SELECT constraint_name FROM `information_schema`.`KEY_COLUMN_USAGE` where `COLUMN_NAME` = '" + data.fieldToDrop + "' && `TABLE_NAME` = '" + table_name + "';";
    else(sequelize.options.dialect == "postgres")
        query = "SELECT constraint_name FROM information_schema.KEY_COLUMN_USAGE where column_name = '" + data.fieldToDrop + "' AND table_name = '" + table_name + "';";

    let constraintName = await sequelize.query(query);
    if (typeof constraintName[0][0] === "undefined")
        return;
    query = "ALTER TABLE " + table_name + " DROP FOREIGN KEY " + constraintName[0][0].constraint_name + "; ALTER TABLE " + table_name + " DROP " + data.fieldToDrop +";";
    return pushToSyncQuery(data.application, query);
}

exports.dropTable = async (appName, table_name) => {
    delete require.cache[require.resolve('../workspace/' + appName + '/models/')];
    let workspaceModels = require('../workspace/' + appName + '/models/').sequelize;

    return await workspaceModels.query(`DROP TABLE ${table_name};`);
}

// Get real SQL type in DB, not sequelize datatype
// Params:
// {
//     table: yourTableName,
//     column: yourColumnName
// }
exports.getDatabaseSQLType = async (params) => {
    let request = "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" + params.table + "' AND COLUMN_NAME = '" + params.column + "';"
    let result = await sequelize.query(request, {
        type: sequelize.QueryTypes.SELECT
    })

    if (result.length > 0) {
        return {
            sqlDataType: result[0].DATA_TYPE,
            sqlDataTypeLength: result[0].CHARACTER_MAXIMUM_LENGTH
        }
    }

    return {
        sqlDataType: false,
        sqlDataTypeLength: false
    }
}

exports.retrieveWorkspaceHasManyData = async (appName, entity, foreignKey) => {
    delete require.cache[require.resolve('../workspace/' + appName + '/models/')];
    let workspaceModels = require('../workspace/' + appName + '/models/');
    let where = {};
    where[foreignKey] = {
        [workspaceModels.$ne]: null
    };

    return await workspaceModels[entity.charAt(0).toUpperCase() + entity.toLowerCase().slice(1)].findAll({
        attributes: ["id", foreignKey],
        where: where
    });
}