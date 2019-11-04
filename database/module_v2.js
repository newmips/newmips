const Entity = require('./entity_v2');

class Module {
    constructor(name, displayName) {
        this._name = name;
        this._displayName = displayName;
        this._entities = [];
        this._components = [];
    }

    get name() {
        return this._name;
    }

    get displayName() {
        return this._displayName;
    }

    get entities() {
        return this._entities;
    }

    get components() {
        return this._components;
    }

    getEntity(entity_name, required) {
        if(!entity_name)
            throw new Error('database.field.error.selectOrCreateBefore');

        if(this._entities.filter(x => x.name == entity_name).length > 0)
            return this._entities.filter(x => x.name == entity_name)[0];

        if(required) {
            let err = new Error('database.entity.notFound.withThisName');
            err.messageParams = [entity_name];
            throw err;
        }

        return false;
    }

    addEntity(name, displayName) {

    	let entity = new Entity(name, displayName);

        if (this._entities.filter(x => x.name == entity.name).length != 0){
        	console.warn("addEntity => Entity already loaded in the module instance.")
            return this._entities.filter(x => x.name == entity.name)[0];
        }

        this._entities.push(entity);
        return entity;
    }

    addComponent(component) {
        this._components.push(component);
        return true;
    }

    // --- DELETE ---
    deleteEntity(name) {

        if(this._entities.filter(x => x.name == name).length == 0){
            let err = new Error('database.entity.notFound.withThisName')
            err.messageParams = [name]
            throw err;
        }

        for (let i = 0; i < this._entities.length; i++) {
            if(this._entities[i].name == name) {
                delete this._entities[i];
                this._entities.splice(i, 1);
                break;
            }
        }

        return true;
    }

    deleteComponent(name, type) {

        if(this._components.filter(x => x.name == name && x.type == type).length == 0){
            let err = new Error("database.component.notFound.notFound");
            err.messageParams = [name]
            throw err;
        }

        for (let i = 0; i < this._components.length; i++) {
            if(this._components[i].name == name && this._components[i].type == type) {
                delete this._components[i];
                this._components.splice(i, 1);
                break;
            }
        }

        return true;
    }
}

module.exports = Module;