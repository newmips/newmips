const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(module.filename);
const dbConfig = require('../config/database');
const globalConf = require('../config/global');
const moment = require('moment');
const fs = require('fs-extra');

const Op = Sequelize.Op;
const db = {
	$eq: Op.eq,
	$ne: Op.ne,
	$gte: Op.gte,
	$gt: Op.gt,
	$lte: Op.lte,
	$lt: Op.lt,
	$not: Op.not,
	$in: Op.in,
	$notIn: Op.notIn,
	$is: Op.is,
	$like: Op.like,
	$notLike: Op.notLike,
	$iLike: Op.iLike,
	$notILike: Op.notILike,
	$regexp: Op.regexp,
	$notRegexp: Op.notRegexp,
	$iRegexp: Op.iRegexp,
	$notIRegexp: Op.notIRegexp,
	$between: Op.between,
	$notBetween: Op.notBetween,
	$overlap: Op.overlap,
	$contains: Op.contains,
	$contained: Op.contained,
	$adjacent: Op.adjacent,
	$strictLeft: Op.strictLeft,
	$strictRight: Op.strictRight,
	$noExtendRight: Op.noExtendRight,
	$noExtendLeft: Op.noExtendLeft,
	$and: Op.and,
	$or: Op.or,
	$any: Op.any,
	$all: Op.all,
	$values: Op.values,
	$col: Op.col
};

let sequelizeOptions;
if (dbConfig.dialect == 'sqlite')
	sequelizeOptions = {
		dialect: dbConfig.dialect,
		storage: dbConfig.storage,
		logging: false
	}
else
	sequelizeOptions = {
		host: dbConfig.host,
		logging: false,
		port: dbConfig.port,
		dialect: dbConfig.dialect,
		dialectOptions: {
			multipleStatements: true
		},
		define: {
			timestamps: false
		},
		charset: 'utf8',
		collate: 'utf8_general_ci',
		timezone: '+00:00' // For writing to database
	}
const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, sequelizeOptions);

sequelize.customAfterSync = async () => {
	if (globalConf.env == "tablet")
		return;

	const toSyncProdObject = JSON.parse(fs.readFileSync(__dirname + '/toSyncProd.json'));

	/* ----------------- Récupération du toSync.json -----------------*/
	const toSyncObject = JSON.parse(fs.readFileSync(__dirname + '/toSync.json'));
	const dialect = sequelize.options.dialect;

	for (const entity in toSyncObject) {
		// Sync attributes
		if (toSyncObject[entity].attributes)
			for (const attribute in toSyncObject[entity].attributes) {
				let type;
				let request = "";
				switch (toSyncObject[entity].attributes[attribute].type) {
					case "STRING":
						type = "VARCHAR(255)";
						break;
					case "INTEGER":
						type = "INT";
						break;
					case "BIGINT":
						type = "BIGINT";
						break;
					case "DATE":
						if(dialect == "postgres")
							type = "timestamp with time zone";
						else
							type = "DATETIME";
						break;
					case "DECIMAL":
						type = "DECIMAL(10,3)";
						break;
					case "ENUM":
						if(dialect == "postgres"){
							const postgresEnumType = attribute+"_enum_"+moment();
							request += "CREATE TYPE "+postgresEnumType+" as ENUM (";
							for(let i=0; i<toSyncObject[entity].attributes[attribute].values.length; i++){
								request += "'"+toSyncObject[entity].attributes[attribute].values[i]+"'";
								if(i != toSyncObject[entity].attributes[attribute].values.length-1)
									request += ",";
							}
							request += ");"
							type = postgresEnumType;
						}
						else {
							type = "ENUM(";
							for(let i=0; i<toSyncObject[entity].attributes[attribute].values.length; i++){
								type += "'"+toSyncObject[entity].attributes[attribute].values[i]+"'";
								if(i != toSyncObject[entity].attributes[attribute].values.length-1)
									type += ",";
							}
							type += ")";
						}
						break;
					case "TEXT":
					case "BOOLEAN":
					case "TIME":
					case "FLOAT":
						// Same type as the switch parameter
						type = toSyncObject[entity].attributes[attribute].type;
						break;
					case "DOUBLE":
						if(dialect == "postgres"){
							type = 'DOUBLE PRECISION';
						} else {
							// Same type as the switch parameter
							type = toSyncObject[entity].attributes[attribute].type;
						}
						break;
					default:
						type = "VARCHAR(255)";
						break;
				}

				if(typeof toSyncObject[entity].attributes[attribute].defaultValue === "undefined")
					toSyncObject[entity].attributes[attribute].defaultValue = null;
				if(toSyncObject[entity].attributes[attribute].defaultValue != null && toSyncObject[entity].attributes[attribute].defaultValue !== true && toSyncObject[entity].attributes[attribute].defaultValue !== false)
					toSyncObject[entity].attributes[attribute].defaultValue = "'" + toSyncObject[entity].attributes[attribute].defaultValue + "'";

				request += "ALTER TABLE ";
				if(dialect == "mysql"){
					request += entity;
					request += " ADD COLUMN `" + attribute + "` " + type + " DEFAULT "+toSyncObject[entity].attributes[attribute].defaultValue+";";
				} else if(dialect == "postgres"){
					request += '"'+entity+'"';
					request += " ADD COLUMN " + attribute + " " + type + " DEFAULT "+toSyncObject[entity].attributes[attribute].defaultValue+";";
				}

				try {
					await sequelize.query(request); // eslint-disable-line
				} catch(err) {
					if(typeof err.parent !== "undefined" && err.parent.errno == 1060 || err.parent.code == 42701)
						console.log("WARNING - Duplicate column attempt in BDD - Request: "+ request);
					else
						throw err;
				}

				toSyncProdObject.queries.push(request);
			}
		// Sync options
		if (toSyncObject[entity].options)
			for (let j = 0; j < toSyncObject[entity].options.length; j++) {
				if(toSyncObject[entity].options[j].relation != "belongsToMany"){

					const option = toSyncObject[entity].options[j];
					let sourceName;
					try {
						sourceName = db[entity.charAt(0).toUpperCase() + entity.slice(1)].getTableName();
					} catch(err) {
						console.error("Unable to find model "+entity+", skipping toSync query.");
						console.log(toSyncObject[entity].options[j]);
						continue;
					}
					let targetName;
					// Status specific target. Get real history table name from attributes
					if (option.target.indexOf('_history_') != -1) {
						const attris = JSON.parse(fs.readFileSync(__dirname+'/attributes/'+entity.substring(entity.indexOf('e_'), entity.length)+'.json', 'utf8'));
						for (const attri in attris)
							if (attris[attri].history_table && attris[attri].history_table == option.target){
								targetName = attris[attri].history_model;
								break;
							}
					}
					// Regular target
					if (!targetName)
						targetName = option.target;

					targetName = db[targetName.charAt(0).toUpperCase() + targetName.slice(1)].getTableName();

					let request;
					if (option.relation == "belongsTo") {
						request = "ALTER TABLE ";
						if(dialect == "mysql"){
							request += sourceName;
							request += " ADD COLUMN `" +option.foreignKey+ "` INT DEFAULT NULL;";
							request += "ALTER TABLE `" +sourceName+ "` ADD FOREIGN KEY (" +option.foreignKey+ ") REFERENCES `" +targetName+ "` (id) ON DELETE SET NULL ON UPDATE CASCADE;";
						} else if(dialect == "postgres"){
							request += '"'+sourceName+'"';
							request += " ADD COLUMN " +option.foreignKey+ " INT DEFAULT NULL;";
							request += "ALTER TABLE \"" +sourceName+ "\" ADD FOREIGN KEY (" +option.foreignKey+ ") REFERENCES \"" +targetName+ "\" (id) ON DELETE SET NULL ON UPDATE CASCADE;";
						}
					} else if (option.relation == 'hasMany') {
						if(dialect == "mysql"){
							request = "ALTER TABLE ";
							request += targetName;
							request += " ADD COLUMN `"+option.foreignKey+"` INT DEFAULT NULL;";
							request += "ALTER TABLE `"+targetName+"` ADD FOREIGN KEY ("+option.foreignKey+") REFERENCES `"+sourceName+"` (id);";
						} else if(dialect == "postgres"){
							request = "ALTER TABLE ";
							request += '"'+targetName+'"';
							request += " ADD COLUMN "+option.foreignKey+" INT DEFAULT NULL;";
							request += "ALTER TABLE \""+targetName+"\" ADD FOREIGN KEY ("+option.foreignKey+") REFERENCES \""+sourceName+"\" (id);";
						}
					}

					try {
						await sequelize.query(request); // eslint-disable-line
					} catch(err) {
						if (typeof err.parent !== "undefined" && err.parent.errno == 1060 || err.parent.code == 42701)
							console.log("WARNING - Duplicate column attempt in BDD - Request: "+ request);
						else
							throw err;
					}
					toSyncProdObject.queries.push(request);
				}
			}
	}

	if (toSyncObject.queries)
		for (let i = 0; i < toSyncObject.queries.length; i++){
			try {
				await sequelize.query(toSyncObject.queries[i]); // eslint-disable-line
			} catch (err) {
				console.error(err);
			}
		}

	fs.writeFileSync(__dirname + '/toSyncProd.json', JSON.stringify(toSyncProdObject, null, 4));
	fs.writeFileSync(__dirname+'/toSync.json', '{}', 'utf8');
};

fs.readdirSync(__dirname).filter(function(file) {
	const excludeFiles = ['hooks.js', 'validators.js'];
	return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js' && excludeFiles.indexOf(file) == -1;
}).forEach(function(file) {
	const model = sequelize['import'](path.join(__dirname, file));
	db[model.name] = model;
});

Object.keys(db).forEach(function(modelName) {
	if (db[modelName].associate)
		db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;