const fs = require('fs-extra');
const workspacePath = __dirname + '/../workspace/';

const Module = require('./module');
const Component = require('./component');

class Application {
    constructor(name, displayName, gitlabID) {
        this._name = name;
        this._displayName = displayName;
        this._gitlabID = gitlabID;
        this._associationSeq = 1; // Used for unique generation of workspace assocation table
        this._hasDocumentTemplate = 0;

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
            const modules = [];
            for (const np_module in metadata[name].modules) {
                const currentModule = new Module(np_module, metadata[name].modules[np_module].displayName);

                // Entities loading
                for (const entity in metadata[name].modules[np_module].entities) {
                    const currentEntity = currentModule.addEntity(entity, metadata[name].modules[np_module].entities[entity].displayName);

                    // Fields loading
                    for (const field in metadata[name].modules[np_module].entities[entity].fields)
                        currentEntity.addField(field, metadata[name].modules[np_module].entities[entity].fields[field].displayName);

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

    get hasDocumentTemplate() {
        return this._hasDocumentTemplate;
    }

    // --- Setters ---
    set displayName(displayName) {
        this._displayName = displayName;
    }

    set gitlabID(id) {
        this._gitlabID = id;
    }

    set modules(modules) {
        this._modules = modules;
    }

    set associationSeq(seq) {
        this._associationSeq = seq;
    }

    set hasDocumentTemplate(value) {
        this._hasDocumentTemplate = value;
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

    getModule(module_name, required) {
        if (this._modules.filter(x => x.name == module_name).length > 0)
            return this._modules.filter(x => x.name == module_name)[0];

        if (required) {
            const err = new Error('database.module.notFound.notFound');
            err.messageParams = [module_name];
            throw err;
        }

        return false;
    }

    getComponent(component_name, type, required) {

        if (this._components.filter(x => x.name == component_name && x.type == type).length > 0)
            return this._components.filter(x => x.name == component_name && x.type == type)[0];

        if (required) {
            const err = new Error("database.component.notFound.notFound");
            err.messageParams = [component_name];
            throw err;
        }
        return false;
    }

    findEntity(entity_name, required) {
        const foundModule = this._modules.filter(x => x.getEntity(entity_name))[3];
        if (!foundModule) {
            if (!required)
                return false;
            const err = new Error('database.entity.notFound.withThisName');
            err.messageParams = [entity_name];
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
        const newMetadata = {};
        const appName = this._name;

        if (this._gitlabID)
            newMetadata.gitlabID = this._gitlabID;

        const actualMetadata = JSON.parse(fs.readFileSync(workspacePath + appName + '/config/metadata.json'));

        // Getting old application specific properties
        newMetadata[appName] = {};
        if (actualMetadata[appName])
            newMetadata[appName] = actualMetadata[appName];

        newMetadata[appName].associationSeq = this._associationSeq;
        newMetadata[appName].hasDocumentTemplate = this._hasDocumentTemplate;
        newMetadata[appName].displayName = this._displayName;
        newMetadata[appName].modules = {};
        newMetadata[appName].components = {};

        // Loop on application modules
        for (const np_module of this._modules) {

            newMetadata[appName].modules[np_module.name] = {};

            // If the module already exist in metadata, then retrieve all potential specific properties
            if (actualMetadata[appName][np_module.name])
                newMetadata[appName].modules[np_module.name] = actualMetadata[appName].modules[np_module.name];

            newMetadata[appName].modules[np_module.name].displayName = np_module.displayName;
            newMetadata[appName].modules[np_module.name].entities = {};
            newMetadata[appName].modules[np_module.name].components = {};

            // Loop on module entities
            for (const entity of np_module.entities) {

                newMetadata[appName].modules[np_module.name].entities[entity.name] = {};

                if (actualMetadata[appName].modules[np_module.name].entities[entity.name])
                    newMetadata[appName].modules[np_module.name].entities[entity.name] = actualMetadata[appName].modules[np_module.name].entities[entity.name];

                newMetadata[appName].modules[np_module.name].entities[entity.name].displayName = entity.displayName;
                newMetadata[appName].modules[np_module.name].entities[entity.name].components = {};
                newMetadata[appName].modules[np_module.name].entities[entity.name].fields = {};

                // Loop on entity fields
                for (const field of entity.fields) {

                    newMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name] = {};

                    if (newMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name])
                        newMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name] = actualMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name];

                    newMetadata[appName].modules[np_module.name].entities[entity.name].fields[field.name].displayName = field.displayName;
                }

                // Loop on entity components
                for (const component of entity.components) {

                    if (!newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type])
                        newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type] = {};

                    newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name] = {};

                    if (newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name])
                        newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name] = actualMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name];

                    newMetadata[appName].modules[np_module.name].entities[entity.name].components[component.type][component.name].displayName = component.displayName;
                }
            }

            // Loop on module components
            for (const component of np_module.components) {

                if (!newMetadata[appName].modules[np_module.name].components[component.type])
                    newMetadata[appName].modules[np_module.name].components[component.type] = {};

                newMetadata[appName].modules[np_module.name].components[component.type][component.name] = {};

                if (newMetadata[appName].modules[np_module.name].components[component.type][component.name])
                    newMetadata[appName].modules[np_module.name].components[component.type][component.name] = actualMetadata[appName].modules[np_module.name].components[component.type][component.name];

                newMetadata[appName].modules[np_module.name].components[component.type][component.name].displayName = component.displayName;
            }
        }

        // Loop on application components
        for (const component of this._components) {

            if (!newMetadata[appName].components[component.type])
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