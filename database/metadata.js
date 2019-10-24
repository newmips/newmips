const fs = require('fs-extra');
const workspacePath = __dirname + '/../workspace/';
const models = require('../models');
const Application = require('./application_v2');

class Metadata {
	constructor() {
		this._applications = [];
	}

	getApplication(name){
		// Looking for already loaded app
		for(let app of this._applications)
			if(app.name == name)
				return app

		// Need to load the application and push it in the loaded app
		const loadedApp = Application.load(name);
		if(loadedApp)
			this._applications.push(loadedApp);

		return loadedApp;
	}

	deleteApplication(name) {

		if(this._applications.filter(x => x.name == name).length == 0)
			throw new Error('database.application.notFound.withThisName');

		for (let i = 0; i < this._applications.length; i++) {
			if(this._applications[i].name == name) {
				delete this._applications[i];
				this._applications.splice(i, 1);
				break;
			}
		}

		return true;
	}
}

// Singleton
let metadata = false;
module.exports = () => {
	if(!metadata)
		metadata = new Metadata();
	return metadata;
};