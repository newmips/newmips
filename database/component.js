class Component {
	constructor(name, displayName, type) {
		this._name = name;
		this._displayName = displayName;
		this._type = type;
	}

	get name() {
		return this._name;
	}

	get displayName() {
		return this._displayName;
	}

	get type() {
		return this._type;
	}
}

module.exports = Component;