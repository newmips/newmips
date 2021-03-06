console.log('Executing 2.9 js patch...');
const fs = require('fs-extra');
const models = require('../../models/')
const workspacePath = __dirname + '/../../workspace/';
const dataHelper = require('../../utils/data_helper');
const helper = require('../../utils/helpers');

// This script aims to make a 2.8 application compatible in a 2.9 generator
// It will browse the workspace folder and adapt the old 2.8 applications for a 2.9 generator
// It will therefore generate the metadata.json file which is essential in 2.9

(async () => {

	const queries = [
		'ALTER TABLE application DROP COLUMN name;',
		'ALTER TABLE application DROP COLUMN codeName;',
		'ALTER TABLE application ADD COLUMN name varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL;'
	]

	// Executing SQL file
	for (let i = 0; i < queries.length; i++) {
		try {
			await models.sequelize.query(queries[i]); // eslint-disable-line
		} catch(err) {
			console.error("Error occured while executing SQL patch: " + queries[i]);
		}
	}

	const promises = [];
	fs.readdirSync(workspacePath).filter(x => !isNaN(x) && fs.lstatSync(workspacePath + x).isDirectory()).forEach((folder) => {
		promises.push((async () => {

			// Getting appName
			const app = await models.Application.findByPk(folder);

			if(!app){
				helper.rmdirSyncRecursive(workspacePath + folder);
				return;
			}

			const name = 'a_' + dataHelper.clearString(app.displayName);
			console.log('Patching application: ' + name + ' (' + folder + ')');

			await app.update({
				name: name
			});

			const newWorkspacePath = workspacePath + name;
			fs.renameSync(workspacePath + folder, newWorkspacePath);

			const metadataObj = {
				[name]: {
					modules: {}
				}
			};

			// Loop on module based on access.lock file
			const appAccessLock = JSON.parse(fs.readFileSync(newWorkspacePath + '/config/access.lock.json'));

			for (const np_module in appAccessLock) {

				metadataObj[name].modules['m_' + np_module] = {
					displayName: np_module,
					entities: {},
					components: {}
				};

				// Loop on entities
				for (const entity of appAccessLock[np_module].entities){

					metadataObj[name].modules['m_' + np_module].entities['e_' + entity.name] = {
						displayName: entity.name,
						fields: {},
						components: {}
					};

					// Attributes
					let entityAttributes;
					const attributesPath = newWorkspacePath + '/models/attributes';

					if (fs.existsSync(attributesPath + '/e_' + entity.name + '.json'))
						entityAttributes = JSON.parse(fs.readFileSync(attributesPath + '/e_' + entity.name + '.json'));
					else if(fs.existsSync(attributesPath + '/c_' + entity.name + '.json'))
						entityAttributes = JSON.parse(fs.readFileSync(attributesPath + '/c_' + entity.name + '.json'));
					else
						continue;

					for(const field in entityAttributes){
						if(field == 'id' || field == 'version')
							continue;

						metadataObj[name].modules['m_' + np_module].entities['e_' + entity.name].fields[field] = {
							displayName: field.substring(2),
							components: {}
						};
					}
				}
			}

			fs.writeFileSync(newWorkspacePath + '/config/metadata.json', JSON.stringify(metadataObj, null, 4));
		})())
	});

	await Promise.all(promises);

})().then(_ => {
	console.log('2.9 js patch done.');
	process.exit(1);
})