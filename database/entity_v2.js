const Field = require('./field_v2');
const Component = require('./component_v2');

class Entity {
	constructor(name) {
		this._name = name;
		this._fields = [];
		this._components = [];
	}

	get name(){
		return this._name;
	}

	get fields(){
		return this._fields;
	}

	get components(){
		return this._components;
	}

	getField(field_name, required) {
        if(this._fields.filter(x => x.name == field_name).length > 0)
            return this._fields.filter(x => x.name == field_name)[0];

        if(required) {
        	let err = new Error("database.field.notFound.withThisName");
            err.messageParams = [field_name];
            throw err;
        }
        return false;
    }

    getComponent(component_name, type, required) {
        if(this._fields.filter(x => x.name == component_name && x.type == type).length > 0)
            return this._fields.filter(x => x.name == component_name && x.type == type)[0];

        if(required) {
        	let err = new Error("database.field.notFound.withThisName");
            err.messageParams = [component_name, type];
            throw err;
        }
        return false;
    }

	addField(field) {
    	if(typeof field === 'string')
    		field = new Field(field);

		if(this._fields.filter(x => x.name == field.name).length != 0) {
			console.warn("addField => Field already loaded in the entity instance.")
			return this._fields.filter(x => x.name == field.name)[0];
		}

		this._fields.push(field);
		return field;
	}

	addComponent(component, type) {
		if(typeof component === 'string')
    		component = new Component(component, type);

		if(this._components.filter(x => x.name == component.name && x.type == component.type).length != 0) {
			console.warn("addField => Field already loaded in the entity instance.")
			return this._components.filter(x => x.name == component.name && x.type == component.type)[0];
		}

		this._components.push(component);
		return component;
    }
}

module.exports = Entity;