const fs = require('fs-extra');
const workspacePath = __dirname + '/../workspace/';

const Module = require('./module');
const Component = require('./component');

class Application {
	constructor(name, displayName) {
		this._name = name;
		this._displayName = displayName;
		this._repoID = null;
		this._codePlatformRepoHTTP = null;
		this._codePlatformRepoSSH = null;
		this._createdBy = null;
		this._associationSeq = 0; // Used for unique generation of workspace assocation table
		this._modules = [];
		this._components = [];
	}

	// --- Statics ---
	static load(name) {
		try {
			console.log('Loading application ' + name + '...');
			const app = new Application(name);
			const metadataPath = workspacePath + name + '/config/metadata.json';

			let metadata = {
				[name]: {}
			};

			if (fs.existsSync(metadataPath))
				metadata = JSON.parse(fs.readFileSync(metadataPath));
			else
				throw new Error('Unable to find metadata.json: ' + metadataPath);
			if (!metadata[name])
				throw new Error('No `'+name+'` property in metadata file '+metadataPath);

			app.associationSeq = metadata[name].associationSeq;
			app.displayName = metadata[name].displayName;
			app.repoID = metadata[name].repoID;
			app.codePlatformRepoHTTP = metadata[name].codePlatformRepoHTTP;
			app.codePlatformRepoSSH = metadata[name].codePlatformRepoSSH;
			app.createdBy = metadata[name].createdBy;

			// Modules loading
			const modules = [];
			for (const np_module in metadata[name].modules) {
				const currentModule = new Module(np_module, metadata[name].modules[np_module].displayName);

				// Entities loading
				for (const entity in metadata[name].modules[np_module].entities) {
					const currentEntity = currentModule.addEntity(entity, metadata[name].modules[np_module].entities[entity].displayName);

					// Fields loading
					for (const field in metadata[name].modules[np_module].entities[entity].fields)
						currentEntity.addField(field, metadata[name].modules[np_module].entities[entity].fields[field].displayName, metadata[name].modules[np_module].entities[entity].fields[field].type);

					// Entity components loading
					for (const component_type in metadata[name].modules[np_module].entities[entity].components)
						for (const component in metadata[name].modules[np_module].entities[entity].components[component_type])
							currentEntity.addComponent(component, metadata[name].modules[np_module].entities[entity].components[component_type][component].displayName, component_type);
				}

				// Module components loading
				for (const component_type in metadata[name].modules[np_module].components)
					for (const component in metadata[name].modules[np_module].components[component_type])
						currentModule.addComponent(component, metadata[name].modules[np_module].components[component_type][component].displayName, component_type);

				modules.push(currentModule);
			}
			app.modules = modules;

			// Application components loading
			for (const component_type in metadata[name].components)
				for (const component in metadata[name].components[component_type])
					app.addComponent(component, metadata[name].components[component_type][component].displayName, component_type);

			return app;
		} catch (err) {
			console.error(err);
			throw new Error("application.couldnt_load");
		}
	}

	// --- Getters ---
	get name() {
		return this._name;
	}

	get displayName() {
		return this._displayName;
	}

	get repoID() {
		return this._repoID;
	}

	get codePlatformRepoHTTP() {
		return this._codePlatformRepoHTTP;
	}

	get codePlatformRepoSSH() {
		return this._codePlatformRepoSSH;
	}

	get createdBy() {
		return this._createdBy;
	}

	get modules() {
		return this._modules;
	}

	get associationSeq() {
		return ++this._associationSeq;
	}

	// --- Setters ---
	set displayName(displayName) {
		this._displayName = displayName;
	}

	set repoID(id) {
		this._repoID = id;
	}

	set codePlatformRepoHTTP(repo) {
		this._codePlatformRepoHTTP = repo;
	}

	set codePlatformRepoSSH(repo) {
		this._codePlatformRepoSSH = repo;
	}

	set createdBy(login) {
		this._createdBy = login;
	}

	set modules(modules) {
		this._modules = modules;
	}

	set associationSeq(seq) {
		this._associationSeq = seq;
	}

	// --- Methods ---
	addModule(name, displayName) {
		const np_module = new Module(name, displayName);
		if (this._modules.filter(x => x.name == np_module.name).length != 0) {
			console.warn("addModule => Module already loaded in the application instance.")
			return this._modules.filter(x => x.name == np_module.name)[0];
		}

		this._modules.push(np_module);
		return np_module;
	}

	getModule(module_name, required = false, display_name = module_name) {
		if (this._modules.filter(x => x.name == module_name).length > 0)
			return this._modules.filter(x => x.name == module_name)[0];

		if (required) {
			const err = new Error('database.module.notFound.notFound');
			err.messageParams = [display_name];
			throw err;
		}

		return false;
	}

	getComponent(component_name, type, required = false) {
		if (this._components.filter(x => x.name == component_name && x.type == type).length > 0)
			return this._components.filter(x => x.name == component_name && x.type == type)[0];

		if (required) {
			const err = new Error("database.component.notFound.notFound");
			err.messageParams = [component_name];
			throw err;
		}
		return false;
	}

	findEntity(entity_name, required = false, displayName = entity_name) {
		const foundModule = this._modules.filter(x => x.getEntity(entity_name))[0];
		if (!foundModule) {
			if (!required)
				return false;
			const err = new Error('database.entity.notFound.withThisName');
			err.messageParams = [displayName];
			throw err;
		}

		return {
			np_module: foundModule,
			entity: foundModule.getEntity(entity_name)
		}
	}

	addComponent(name, displayName, type) {
		const component = new Component(name, displayName, type);

		if (this._components.filter(x => x.name == component.name && x.type == component.type).length != 0) {
			console.warn("addComponent => Component already loaded in the module instance.")
			return this._components.filter(x => x.name == component.name && x.type == component.type)[0];
		}

		this._components.push(component);
		return component;
	}

	deleteModule(name) {
		if (this._modules.filter(x => x.name == name).length == 0) {
			const err = new Error('database.module.notFound.notFound');
			err.messageParams = [name]
			throw err;
		}

		for (let i = 0; i < this._modules.length; i++)
			if (this._modules[i].name == name) {
				delete this._modules[i];
				this._modules.splice(i, 1);
				break;
			}

		return true;
	}

	save() {
		console.log('Saving application ' + this._name + '...');
		const appName = this._name;
		let actualMetadata = {};
		try {
			actualMetadata = JSON.parse(fs.readFileSync(workspacePath + appName + '/config/metadata.json'));
		} catch(err) {
			console.error('Missing metadata.json for application ' + appName + ', generating it...');
		}
		let newMetadata = {};

		// Getting old application specific properties
		if (actualMetadata[appName])
			newMetadata = actualMetadata[appName];

		newMetadata.associationSeq = this._associationSeq;
		newMetadata.repoID = this._repoID;
		newMetadata.codePlatformRepoHTTP = this._codePlatformRepoHTTP;
		newMetadata.codePlatformRepoSSH = this._codePlatformRepoSSH;
		newMetadata.createdBy = this._createdBy;
		newMetadata.displayName = this._displayName;
		newMetadata.modules = {};
		newMetadata.components = {};

		// Loop on application modules
		for (const np_module of this._modules) {
			newMetadata.modules[np_module.name] = {};

			// If the module already exist in metadata, then retrieve all potential specific properties
			if (actualMetadata[appName][np_module.name])
				newMetadata.modules[np_module.name] = actualMetadata[appName].modules[np_module.name];

			newMetadata.modules[np_module.name].displayName = np_module.displayName;
			newMetadata.modules[np_module.name].entities = {};
			newMetadata.modules[np_module.name].components = {};

			// Loop on module entities
			for (const entity of np_module.entities) {
				newMetadata.modules[np_module.name].entities[entity.name] = {};

				if (actualMetadata[appName].modules[np_module.name].entities[entity.name])
					newMetadata.modules[np_module.name].entities[entity.name] = actualMetadata[appName].modules[np_module.name].entities[entity.name];

				newMetadata.modules[np_module.name].entities[entity.name].displayName = entity.displayName;
				newMetadata.modules[np_module.name].entities[entity.name].components = {};
				newMetadata.modules[np_module.name].entities[entity.name].fields = {};

				// Loop on entity fields
				for (const field of entity.fields) {
					newMetadata.modules[np_module.name].entities[entity.name].fields[field.name] = {};

					if (newMetadata.modules[np_module.name].entities[entity.name].fields[field.name])
						newMetadata.modules[np_module.name].entities[entity.name].fields[field.name] = actualMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name];

					newMetadata.modules[np_module.name].entities[entity.name].fields[field.name].displayName = field.displayName;
					newMetadata.modules[np_module.name].entities[entity.name].fields[field.name].type = field.type;
				}

				// Loop on entity components
				for (const component of entity.components) {
					if (!newMetadata.modules[np_module.name].entities[entity.name].components[component.type])
						newMetadata.modules[np_module.name].entities[entity.name].components[component.type] = {};

					newMetadata.modules[np_module.name].entities[entity.name].components[component.type][component.name] = {};

					if (newMetadata.modules[np_module.name].entities[entity.name].components[component.type][component.name])
						newMetadata.modules[np_module.name].entities[entity.name].components[component.type][component.name] = actualMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name];

					newMetadata.modules[np_module.name].entities[entity.name].components[component.type][component.name].displayName = component.displayName;
				}
			}

			// Loop on module components
			for (const component of np_module.components) {
				if (!newMetadata.modules[np_module.name].components[component.type])
					newMetadata.modules[np_module.name].components[component.type] = {};

				newMetadata.modules[np_module.name].components[component.type][component.name] = {};

				if (newMetadata.modules[np_module.name].components[component.type][component.name])
					newMetadata.modules[np_module.name].components[component.type][component.name] = actualMetadata[appName].modules[np_module.name].components[component.type][component.name];

				newMetadata.modules[np_module.name].components[component.type][component.name].displayName = component.displayName;
			}
		}

		// Loop on application components
		for (const component of this._components) {
			if (!newMetadata.components[component.type])
				newMetadata.components[component.type] = {};

			newMetadata.components[component.type][component.name] = {};

			if (newMetadata.components[component.type][component.name])
				newMetadata.components[component.type][component.name] = actualMetadata[appName].components[component.type][component.name];

			newMetadata.components[component.type][component.name].displayName = component.displayName;
		}

		fs.writeFileSync(workspacePath + appName + '/config/metadata.json', JSON.stringify({[appName]: newMetadata}, null, 4))
	}
}

module.exports = Application;