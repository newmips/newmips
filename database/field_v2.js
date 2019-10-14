const fs = require('fs-extra');

class Field {
	constructor(name) {
		this._name = name;
	}

	get name(){
		return this._name;
	}
}

module.exports = Field;