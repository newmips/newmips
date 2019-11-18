class Field {
	constructor(name, displayName) {
		this._name = name;
		this._displayName = displayName;
	}

	get name(){
		return this._name;
	}

	get displayName() {
		return this._displayName;
	}
}

module.exports = Field;