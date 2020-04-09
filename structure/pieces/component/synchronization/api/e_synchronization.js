const express = require('express');
const router = express.Router();
const fs = require("fs-extra");
const models = require('../models/');
const entity_helper = require('../utils/entity_helper');
const upload = require('multer')().single('file');
const moment = require('moment');
const globalConf = require('../config/global');

// *********** Cloud function *************
// This method receives and processes situation and send the dump of Cloud DB to the tablet
// *****************************************
router.post('/situation', function(req, res) {
	// Operation can take some time, remove timeout of response
	res.setTimeout(0);

	function executeJournal(journal) {

		// Start MYSQL transaction.
		// If anything goes wrong during the execution of the journal, all modifications will be rolled back.
		// It's important not to break the `promise chain` by returning each promise to its parent to keep transaction open
		return models.sequelize.transaction(function(transac) {

			// Execute each line of sync journal one after the other
			// If a record is created, change occurence of it's original ID in what's left of the journal
			function execQuery(items, idx) {
				return new Promise(function(resolve) {
					if (!items[idx])
						return resolve();
					const item = items[idx];
					const entity = item.entityName;
					const modelName = entity_helper.capitalizeFirstLetter(entity);

					// Save id and delete it from object to avoid conflicts when querying
					const originId = item.id;
					delete item.id;

					if (item.verb == 'create') {
						return resolve(models[modelName].create(item, {transaction: transac, req: req}).then(function(entityInstance) {

							// Loop over lines left to replace ID with the created row's ID
							for (let j = idx; j < items.length; j++) {
								const line = items[j];

								if (line.verb == "update" || line.verb == "delete" || line.verb == "associate") {
									// Same entity
									if (entity == line.entityName && originId == line.id) {
										// Set ID provided by Cloud database in body result
										items[j].id = entityInstance.id;
									}
								}

								// Search for foreign key related to the new ID in line's entity options.json
								// Replace ID if found
								const entitiesOptions = {};
								for (const field in line) {
									// If a field isn't a foreign key, skip
									if (field.indexOf('fk_id_') != 0)
										continue;
									// Load entity's options only once
									if (!entitiesOptions[line.entityName])
										entitiesOptions[line.entityName] = require('../models/options/'+line.entityName); // eslint-disable-line

									// Check if the foreign key and entity name match and replace if true
									for (let i = 0; i < entitiesOptions[line.entityName].length; i++) {
										if (entitiesOptions[line.entityName][i].foreignKey
											&& entitiesOptions[line.entityName][i].foreignKey == field
											&& entitiesOptions[line.entityName][i].target == entity)
											items[j][field] = entityInstance.id;
									}
								}

								// If association's target is the same as the created entity, check for association ids match and replace
								if (line.verb == "associate" && line.target == entity)
									for (let i = 0; i < line.ids.length; i++)
										if (line.ids[i] == originId)
											line.ids[i] = entityInstance.id;
							}
							return execQuery(items, idx+1);
						}));
					}
					else if (item.verb == 'update') {
						return resolve(models[modelName].update(item, {where: {id: originId}, transaction: transac}).then(function() {
							return execQuery(items, idx+1);
						}));
					}
					else if (item.verb == 'delete') {
						return resolve(models[modelName].destroy({where: {id: originId}, transaction: transac}).then(function() {
							return execQuery(items, idx+1);
						}));
					}
					else if (item.verb == "associate") {
						// Find parent entity and execute association function defined in line
						return resolve(models[modelName].findOne({where: {id: originId}, transaction: transac}).then(function(instan) {
							return instan[item.func](item.ids, {transaction: transac}).then(function() {
								return execQuery(items, idx+1);
							});
						}));
					}
				});
			}
			return execQuery(journal, 0);
		});
	}

	// Get journal from request
	upload(req, res, err => {
		if (!err) {
			console.error(err);
			return res.status(500).end();
		}

		// Load Journal of transactions
		const journal = JSON.parse(req.file.buffer.toString('utf-8'));

		// Execute journal
		return executeJournal(journal.transactions).then(function() {
			// Create journal backup folder
			const backupPath = globalConf.syncfolder+'journal_backups';
			const backupFilename = 'journal-CRED-'+req.apiCredentials.id+'-'+ new moment().format("DDMMYYYYHHmmssSSS") +'.json';
			fs.mkdirs(backupPath, function (err) {
				if (err) {
					console.log(err);
					return res.status(500).end(err);
				}
				// Write journal backup file
				const outStream = fs.createWriteStream(backupPath+'/'+backupFilename);
				outStream.write(req.file.buffer);
				outStream.end();
				outStream.on('finish', _ => {
					// Read Mysql Dump and send it to the tablet
					fs.readFile(globalConf.syncfolder+'dump_cloud_data.sql', (err, data) => {
						if (err) {
							console.log(err);
							return res.status(500).send({});
						}
						res.status(200).send(data);

						models.E_synchronization.create({f_journal_backup_file: backupFilename}, {user: req.user}).then(function(synchronize) {
							synchronize.setR_api_credentials(req.apiCredentials.id);
						}).catch(function(err) {
							console.error("ERROR: Couldn't create e_synchronization in DB");
							console.error(err);
						});
					});
				});
			});
		}).catch(err => {
			console.error(err);
			res.status(500).send({});
		});
	});
});

// This route is called by synchronizing devices to upload its documents
// It is called right after journal synchronization success
router.post('/file_upload', function(req, res) {
	upload(req, res, function(err) {
		if (err) {
			console.error(err)
			return res.status(500).end(err);
		}
		const fileName = req.file.originalname;
		const fileDirPath = globalConf.localstorage+req.query.entity+'/'+fileName.split('-')[0];
		const filePath = fileDirPath+'/'+fileName;
		fs.mkdirs(fileDirPath, function (err) {
			if (err) {
				console.log(err);
				return res.status(500).end(err);
			}
			const outStream = fs.createWriteStream(filePath);
			outStream.write(req.file.buffer);
			outStream.end();
			outStream.on('finish', _ => {
				res.status(200).end();
			});
		});
	});
});

module.exports = router;
