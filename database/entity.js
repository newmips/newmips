const Field = require('./field');
const Component = require('./component');

class Entity {
	constructor(name, displayName, isParamEntity) {
		this._name = name;
		this._displayName = displayName;
		this._isParamEntity = isParamEntity;
		this._fields = [];
		this._components = [];
	}

	// --- GETTERS ---
	get name() {
		return this._name;
	}

	get displayName() {
		return this._displayName;
	}

	get isParamEntity() {
		return this._isParamEntity;
	}

	get fields() {
		return this._fields;
	}

	get components() {
		return this._components;
	}

	getField(name, required = false, displayName = name) {
		const [field] = this._fields.filter(x => x.name == name)
		if (field)
			return field;

		if (required) {
			const err = new Error("database.field.notFound.withThisName");
			err.messageParams = [displayName];
			throw err;
		}
		return false;
	}

	getComponent(component_name, type, required = false) {
		const [component] = this._components.filter(x => x.name == component_name && x.type == type);
		if (component)
			return component;

		if (required) {
			const err = new Error("database.component.notFound.notFound");
			err.messageParams = [component_name];
			throw err;
		}
		return false;
	}

	// --- ADD ---
	addField(name, displayName, type) {
		const [existingField] = this._fields.filter(x => x.name == name);
		if (existingField) {
			console.warn("addField => Field already loaded in the entity instance: " + name);
			return existingField;
		}

		const field = new Field(name, displayName, type);
		this._fields.push(field);
		return field;
	}

	addComponent(name, displayName, type) {
		const [existingComponent] = this._components.filter(x => x.name == name && x.type == type);
		if (existingComponent) {
			console.warn("addComponent => Component already loaded in the entity instance.")
			return existingComponent;
		}

		const component = new Component(name, displayName, type);
		this._components.push(component);
		return component;
	}


	// --- DELETE ---
	deleteField(name) {
		for (let i = 0; i < this._fields.length; i++)
			if (this._fields[i].name == name) {
				delete this._fields[i];
				this._fields.splice(i, 1);
				return true;
			}

		const err = new Error('database.field.notFound.withThisName')
		err.messageParams = [name]
		throw err;
	}

	deleteComponent(name, type) {
		for (let i = 0; i < this._components.length; i++)
			if (this._components[i].name == name && this._components[i].type == type) {
				delete this._components[i];
				this._components.splice(i, 1);
				return true;
			}

		const err = new Error("database.component.notFound.notFound");
		err.messageParams = [name]
		throw err;
	}
}

module.exports = Entity;