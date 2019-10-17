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
		for(let app in this._applications)
			if(app.name == name)
				return app

		// Need to load the application and push it in the loaded app
		const loadedApp = Application.load(name);
		if(loadedApp)
			this._applications.push(loadedApp);

		return loadedApp;
	}
}

let metadata = false;
module.exports = () => {
	if(!metadata)
		metadata = new Metadata();
	return metadata;
};