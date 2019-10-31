const fs = require('fs-extra');
const workspacePath = __dirname + '/../workspace/';

const Module = require('./module_v2');
const Entity = require('./entity_v2');
const Field = require('./field_v2');
const Component = require('./component_v2');

class Application {
    constructor(name, displayName, gitlabID) {
        this._name = name;
        this._displayName = displayName;
        this._gitlabID = gitlabID;
        this._associationSeq = 1; // Used for unique generation of workspace assocation table

        this._modules = [];
        this._components = [];
    }

    // --- Statics ---
    static load(name) {
        try {
            console.log('Loading application ' + name + '...');
            const app = new Application(name);
            const metadata = JSON.parse(fs.readFileSync(workspacePath + name + '/config/metadata.json'));

            app.associationSeq = metadata[name].associationSeq;
            app.displayName = metadata[name].displayName;

	        // Modules loading
            let modules = [];
	        for (let np_module in metadata[name].modules) {
	            const currentModule = new Module(np_module, metadata[name].modules[np_module].displayName);

	            // Entities loading
	            for (let entity in metadata[name].modules[np_module].entities) {
	                const currentEntity = currentModule.addEntity(entity, metadata[name].modules[np_module].entities[entity].displayName);

	                // Fields loading
	                for (let field in metadata[name].modules[np_module].entities[entity].fields)
	                    currentEntity.addField(field, metadata[name].modules[np_module].entities[entity].fields[field].displayName);

                    // Entity components loading
                    for (let component_type in metadata[name].modules[np_module].entities[entity].components)
                        for(let component in metadata[name].modules[np_module].entities[entity].components[component_type])
                            currentEntity.addComponent(component, metadata[name].modules[np_module].entities[entity].components[component_type][component].displayName, component_type);
	            }

                // Module components loading
                for (let component_type in metadata[name].modules[np_module].components)
                    for(let component in metadata[name].modules[np_module].components[component_type])
                        currentModule.addComponent(component, metadata[name].modules[np_module].components[component_type][component].displayName, component_type);

                modules.push(currentModule);
	        }
            app.modules = modules;

            // Application components loading
            for (let component_type in metadata[name].components)
                for(let component in metadata[name].components[component_type])
                    app.addComponent(component, metadata[name].components[component_type][component].displayName, component_type);

            return app;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    // --- Getters ---
    get name() {
        return this._name;
    }

    get displayName() {
        return this._displayName;
    }

    get modules() {
        return this._modules;
    }

    get associationSeq() {
        return this._associationSeq;
    }

    // --- Setters ---
    set displayName(displayName){
        this._displayName = displayName;
    }

    set gitlabID(id){
        this._gitlabID = id;
    }

    set modules(modules) {
        this._modules = modules;
    }

    set associationSeq(seq) {
        this._associationSeq = seq;
    }

    // --- Methods ---
    addModule(name, displayName) {
        let np_module = new Module(name, displayName);
        if (this._modules.filter(x => x.name == np_module.name).length != 0) {
            console.warn("addModule => Module already loaded in the application instance.")
            return this._modules.filter(x => x.name == np_module.name)[0];
        }

        this._modules.push(np_module);
        return np_module;
    }

    getModule(module_name, required) {
        if(this._modules.filter(x => x.name == module_name).length > 0)
            return this._modules.filter(x => x.name == module_name)[0];

        if(required) {
            let err = new Error('database.module.notFound.notFound');
            err.messageParams = [module_name];
            throw err;
        }

        return false;
    }

    findEntity(entity_name, required) {
        let foundModule = this._modules.filter(x => x.getEntity(entity_name))[0];
        if(!foundModule) {
            if(!required)
                return false;
            let err = new Error('database.entity.notFound.withThisName');
            err.messageParams = [entity_name];
            throw err;
        }

        return {
            np_module: foundModule,
            entity: foundModule.getEntity(entity_name)
        }
    }

    addComponent(component) {
        this._components.push(component);
        return true;
    }

    save() {
        let newMetadata = {};
        let appName = this._name;

        if(this._gitlabID)
            newMetadata.gitlabID = this._gitlabID;

        const actualMetadata = JSON.parse(fs.readFileSync(workspacePath + appName + '/config/metadata.json'));

        // Getting old application specific properties
        newMetadata[appName] = {};
        if(actualMetadata[appName])
            newMetadata[appName] = actualMetadata[appName];

        newMetadata[appName].associationSeq = this._associationSeq;
        newMetadata[appName].displayName = this._displayName;
        newMetadata[appName].modules = {};
        newMetadata[appName].components = {};

        // Loop on application modules
        for (let np_module of this._modules) {

            newMetadata[appName].modules[np_module.name] = {};

            // If the module already exist in metadata, then retrieve all potential specific properties
            if (actualMetadata[appName][np_module.name])
                newMetadata[appName].modules[np_module.name] = actualMetadata[appName].modules[np_module.name];

            newMetadata[appName].modules[np_module.name].displayName = np_module.displayName;
            newMetadata[appName].modules[np_module.name].entities = {};
            newMetadata[appName].modules[np_module.name].components = {};

            // Loop on module entities
            for (let entity in np_module.entities) {
                entity = np_module.entities[entity];

                newMetadata[appName].modules[np_module.name].entities[entity.name] = {};

                if (actualMetadata[appName].modules[np_module.name].entities[entity.name])
                    newMetadata[appName].modules[np_module.name].entities[entity.name] = actualMetadata[appName].modules[np_module.name].entities[entity.name];

                newMetadata[appName].modules[np_module.name].entities[entity.name].displayName = entity.displayName;
                newMetadata[appName].modules[np_module.name].entities[entity.name].components = {};
                newMetadata[appName].modules[np_module.name].entities[entity.name].fields = {};

                // Loop on entity fields
                for (let field in entity.fields) {
                    field = entity.fields[field];

                    newMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name] = {};

                    if (newMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name])
                        newMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name] = actualMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name];

                    newMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name].displayName = field.displayName;
                }

                // Loop on entity components
                for (let component in entity.components) {
                    component = entity.components[component];

                    if(!newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type])
                        newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type] = {};

                    newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name] = {};

                    if (newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name])
                        newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name] = actualMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name];

                    newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name].displayName = component.displayName;
                }
            }

            // Loop on module components
            for (let component in np_module.components) {
                component = np_module.components[component];

                if(!newMetadata[appName].modules[np_module.name].components[component.type])
                    newMetadata[appName].modules[np_module.name].components[component.type] = {};

                newMetadata[appName].modules[np_module.name].components[component.type][component.name] = {};

                if (newMetadata[appName].modules[np_module.name].components[component.type][component.name])
                    newMetadata[appName].modules[np_module.name].components[component.type][component.name] = actualMetadata[appName].modules[np_module.name].components[component.type][component.name];

                newMetadata[appName].modules[np_module.name].components[component.type][component.name].displayName = component.displayName;
            }
        }

        // Loop on application components
        for (let component in this._components) {
            component = this._components[component];

            if(!newMetadata[appName].components[component.type])
                newMetadata[appName].components[component.type] = {};

            newMetadata[appName].components[component.type][component.name] = {};

            if (newMetadata[appName].components[component.type][component.name])
                newMetadata[appName].components[component.type][component.name] = actualMetadata[appName].components[component.type][component.name];

            newMetadata[appName].components[component.type][component.name].displayName = component.displayName;
        }

        fs.writeFileSync(workspacePath + appName + '/config/metadata.json', JSON.stringify(newMetadata, null, 4))
    }
}

module.exports = Application;