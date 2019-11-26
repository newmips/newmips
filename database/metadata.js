const Application = require('./application');

class Metadata {
	constructor() {
		this._applications = [];
	}

	getApplication(name){
		// Looking for already loaded app
		for(const app of this._applications)
			if(app.name == name)
				return app

		// Need to load the application and push it in the loaded app
		const loadedApp = Application.load(name);
		if(loadedApp)
			this._applications.push(loadedApp);

		return loadedApp;
	}

	deleteApplication(name) {
		for (let i = 0; i < this._applications.length; i++)
			if(this._applications[i].name == name) {
				delete this._applications[i];
				this._applications.splice(i, 1);
				return true;
			}

		throw new Error('database.application.notFound.withThisName');
	}
}

// Singleton
let metadata = false;
module.exports = () => {
	if(!metadata)
		metadata = new Metadata();
	return metadata;
};