const Entity = require('./entity_v2');

class Module {
    constructor(name) {
        this._name = name;
        this._entities = [];
        this._components = [];
    }

    get name() {
        return this._name;
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

    addEntity(entity) {

    	if(typeof entity === 'string')
    		entity = new Entity(entity);

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
}

module.exports = Module;