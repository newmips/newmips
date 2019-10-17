const fs = require('fs-extra');
const Field = require('./field_v2');

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

	getField(field_name) {
        if(this._fields.filter(x => x.name == field_name).length > 0)
            return this._fields.filter(x => x.name == field_name)[0];
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

	addComponent(component) {
        this._components.push(component);
        return true;
    }
}

module.exports = Entity;