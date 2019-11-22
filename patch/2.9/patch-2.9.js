console.log('Executing 2.9 js patch...');
const fs = require('fs-extra');
const models = require('../../models/')
const workspacePath = __dirname + '/../../workspace/';

(async () => {
	try {
		// Executing SQL file
		await models.sequelize.query('ALTER TABLE application DROP COLUMN name;');
		await models.sequelize.query('ALTER TABLE application CHANGE codeName name varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL;');
	} catch(err) {
		console.error(err);
	}
})().then(_ => {
	const promises = [];

	fs.readdirSync(workspacePath).filter(x => !isNaN(x) && fs.lstatSync(workspacePath + x).isDirectory()).forEach((folder) => {
		promises.push((async () => {

			// Getting appName
			const {name} = await models.Application.findByPk(folder);
			console.log('Patching application: ' + name + '(' + folder + ')');

			const newWorkspacePath = workspacePath + name;
			fs.renameSync(workspacePath + folder, newWorkspacePath);

			const metadataObj = {
				[name]: {
					modules: {}
				}
			};

			// Loop on module based on access.lock file
			let appAccessLock = JSON.parse(fs.readFileSync(newWorkspacePath + '/config/access.lock.json'));

			let currentModule;
			for (let np_module in appAccessLock) {

				metadataObj[name].modules['m_' + np_module] = {
					displayName: np_module,
					entities: {},
					components: {}
				};

				// Loop on entities
				let entityPromises = [];
				for (let entity of appAccessLock[np_module].entities){

					metadataObj[name].modules['m_' + np_module].entities['e_' + entity.name] = {
						displayName: entity.name,
						fields: {},
						components: {}
					};

					// Attributes
					let entityAttributes, attributesPath = newWorkspacePath + '/models/attributes';;
					if (fs.existsSync(attributesPath + '/e_' + entity.name + '.json'))
						entityAttributes = JSON.parse(fs.readFileSync(attributesPath + '/e_' + entity.name + '.json'));
					else if(fs.existsSync(attributesPath + '/c_' + entity.name + '.json'))
						entityAttributes = JSON.parse(fs.readFileSync(attributesPath + '/c_' + entity.name + '.json'));
					else
						continue;

					for(let field in entityAttributes){
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

	Promise.all(promises).then(_ => {
		console.log('2.8 js patch done.');
		process.exit(1);
	});

}).catch(err => {
	console.error(err);
	process.exit(1);
});