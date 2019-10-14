const fs = require('fs-extra');
const workspacePath = __dirname + '/../workspace/';

const Application = require('./application_v2');

class Metadata {
	constructor() {
		this._applications = [];
		this._modules = [];
	}

	getApplication(name){
		// Looking for already loaded app
		for(let app in this._applications)
			if(app.name == name)
				return app

		// Need to load the application and push it in the loaded app
		const app = new Application(name);
		const loadedApp = Application.load(app);
		if(loadedApp)
			this._applications.push(loadedApp);

		return loadedApp;
	}
}

module.exports = Metadata;