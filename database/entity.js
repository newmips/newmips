const Field = require('./field');
const Component = require('./component');

class Entity {
	constructor(name, displayName) {
		this._name = name;
		this._displayName = displayName;
		this._fields = [];
		this._components = [];
	}

	// --- GETTERS ---
	get name(){
		return this._name;
	}

	get displayName() {
        return this._displayName;
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

        if(this._components.filter(x => x.name == component_name && x.type == type).length > 0)
            return this._components.filter(x => x.name == component_name && x.type == type)[0];

        if(required) {
        	let err = new Error("database.component.notFound.notFound");
            err.messageParams = [component_name];
            throw err;
        }
        return false;
    }

    // --- ADD ---
	addField(name, displayName) {
    	let field = new Field(name, displayName);

		if(this._fields.filter(x => x.name == field.name).length != 0) {
			console.warn("addField => Field already loaded in the entity instance: " + field.name);
			return this._fields.filter(x => x.name == field.name)[0];
		}

		this._fields.push(field);
		return field;
	}

	addComponent(name, displayName, type) {
		let component = new Component(name, displayName, type);

		if(this._components.filter(x => x.name == component.name && x.type == component.type).length != 0) {
			console.warn("addComponent => Component already loaded in the entity instance.")
			return this._components.filter(x => x.name == component.name && x.type == component.type)[0];
		}

		this._components.push(component);
		return component;
    }


    // --- DELETE ---
    deleteField(name) {

		if(this._fields.filter(x => x.name == name).length == 0){
			let err = new Error('database.field.notFound.withThisName')
			err.messageParams = [name]
			throw err;
		}

		for (let i = 0; i < this._fields.length; i++) {
			if(this._fields[i].name == name) {
				delete this._fields[i];
				this._fields.splice(i, 1);
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

module.exports = Entity;