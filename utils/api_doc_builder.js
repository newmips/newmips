const fs = require('fs-extra');
const exec = require('child_process').exec;
const path = require("path");

function capitalizeFirstLetter(word) {
	if(typeof word === "undefined" || !word)
		return "Integer";
	return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

function routeGet(entity, attributes, options) {
	const name = entity.name.substring(2);
	const doc = [];
	doc.push('/**');
	doc.push(' * @api {get} /api/'+name+'?token=TOKEN 1 - Find all');
	doc.push(' * @apiVersion 1.0.0');
	doc.push(' * @apiDescription Fetch records of <code>'+name+'</code> from <code>offset</code> until <code>limit</code>');
	doc.push(' * @apiGroup '+entity.displayName);

	let possibleIncludes = [];
	for (let i = 0; i < options.length; i++)
		possibleIncludes.push(options[i].as);
	possibleIncludes = `{String=${possibleIncludes.join(',')}}`;
	doc.push(` * @apiParam (Query parameters) ${possibleIncludes} [include] Include specified association(s) to each <code>${name}</code> result.<br>Multiple values can be given separated by a comma <br><br>Ex: ?include=r_asso1,r_asso2`);

	doc.push(' * @apiUse tokenLimitOffset');
	doc.push(' * @apiSuccess {Object[]} '+name+'s List of '+name);
	for (const attr in attributes)
		doc.push(' * @apiSuccess {'+capitalizeFirstLetter(attributes[attr].type)+'} '+name+'s.'+attr+' <code>'+attr+'</code> of '+name);

	doc.push(' * @apiSuccess {Integer} limit Limit used to fetch data');
	doc.push(' * @apiSuccess {Integer} offset Offset used to fetch data');
	doc.push(' * @apiSuccess {Integer} totalCount The total count of records for '+name);

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

function routeGetId(entity, attributes, options) {
	const name = entity.name.substring(2);
	const doc = [];
	doc.push('/**');
	doc.push(' * @api {get} /api/'+name+'/:id?token=TOKEN 2 - Find one');
	doc.push(' * @apiVersion 1.0.0');
	doc.push(' * @apiDescription Fetch one record of <code>'+name+'</code> with <code>id</code>');
	doc.push(' * @apiGroup '+entity.displayName);
	doc.push(' * @apiUse token');

	let possibleIncludes = [];
	for (let i = 0; i < options.length; i++)
		possibleIncludes.push(options[i].as);
	possibleIncludes = `{String=${possibleIncludes.join(',')}}`;
	doc.push(` * @apiParam (Query parameters) ${possibleIncludes} [include] Include specified association(s) to each <code>${name}</code> result.<br>Multiple values can be given separated by a comma <br><br>Ex: ?include=r_asso1,r_asso2`);

	doc.push(' * @apiParam (Params parameters) {Integer} id The <code>id</code> of '+name+' to fetch');
	doc.push(' * @apiSuccess {Object} '+name+' Object of '+name);
	for (const attr in attributes)
		doc.push(' * @apiSuccess {'+capitalizeFirstLetter(attributes[attr].type)+'} '+name+'.'+attr+' <code>'+attr+'</code> of '+name);
	doc.push(' * @apiError (Error 404) {Object} NotFound No '+name+' with ID <code>id</code> found');

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

function routeGetAssociation(entity, options) {
	// No association, doc not needed
	if (options.length == 0)
		return '';

	const name = entity.name.substring(2);
	const doc = [];
	doc.push('/**');
	doc.push(' * @api {get} /api/'+name+'/:id/:association?token=TOKEN 2.a - Find association');
	doc.push(' * @apiVersion 1.0.0');
	doc.push(' * @apiDescription Fetch records of <code>'+name+'</code>\'s <code>association</code> from <code>offset</code> until <code>limit</code>');
	doc.push(' * @apiGroup '+entity.displayName);
	doc.push(' * @apiUse tokenLimitOffset');
	doc.push(' * @apiParam (Params parameters) {Integer} id <code>id</code> of the '+name+' to which <code>association</code> is related');

	let allowedValues = []
	for (let i = 0; i < options.length; i++)
		allowedValues.push(options[i].target.substring(2));
	allowedValues = `{String=${allowedValues.join(',')}}`;
	doc.push(` * @apiParam (Params parameters) ${allowedValues} association Name of the related entity`);

	doc.push(' * @apiSuccess {Object} Object Object of <code>association</code>');
	doc.push(' * @apiSuccess {Integer} limit Limit used to fetch data');
	doc.push(' * @apiSuccess {Integer} offset Offset used to fetch data');
	doc.push(' * @apiError (Error 404) {Object} NotFound No '+name+' with ID <code>id</code> found');
	doc.push(' * @apiError (Error 404) {Object} AssociationNotFound No association with <code>association</code>');

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

const privateFields = ['version', 'f_password', 'f_token_password_reset', 'f_enabled'];
function routePost(entity, attributes, options) {
	const name = entity.name.substring(2);
	const doc = [];
	doc.push('/**');
	doc.push(' * @api {post} /api/'+name+'/?token=TOKEN 3 - Create');
	doc.push(' * @apiVersion 1.0.0');
	doc.push(' * @apiDescription Create a record of <code>'+name+'</code> using values defined in request\'s <code>body</code>');
	doc.push(' * @apiGroup '+entity.displayName);
	doc.push(' * @apiUse token');
	for (const attr in attributes)
		if (privateFields.indexOf(attr) == -1 && attr != 'id')
			doc.push(' * @apiParam (Body parameters) {'+capitalizeFirstLetter(attributes[attr].type)+'} ['+attr+'] <code>'+attr+'</code> of '+name);
	for (let i = 0; i < options.length; i++)
		if (options[i].relation != 'belongsToMany')
			doc.push(' * @apiParam (Body parameters) {Integer} ['+options[i].foreignKey+'] <code>id</code> of entity '+options[i].target.substring(2)+' to associate');
	doc.push(' * @apiSuccess {Object} '+name+' Created '+name);
	for (const attr in attributes)
		if (privateFields.indexOf(attr) == -1)
			doc.push(' * @apiSuccess {'+capitalizeFirstLetter(attributes[attr].type)+'} '+name+'.'+attr+' <code>'+attr+'</code> of '+name);

	doc.push(' * @apiError (Error 500) {Object} ServerError An error occured when trying to create '+name);

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

function routePut(entity, attributes, options) {
	const name = entity.name.substring(2);
	const doc = [];
	doc.push('/**');
	doc.push(' * @api {put} /api/'+name+'/:id?token=TOKEN 4 - Update');
	doc.push(' * @apiVersion 1.0.0');
	doc.push(' * @apiDescription Update record of <code>'+name+'</code> with <code>id</code> using values defined in request\'s <code>body</code>');
	doc.push(' * @apiGroup '+entity.displayName);
	doc.push(' * @apiUse token');
	doc.push(' * @apiParam (Params parameters) {Integer} id <code>id</code> of the '+name+' to update');
	for (const attr in attributes)
		if (privateFields.indexOf(attr) == -1 && attr != 'id')
			doc.push(' * @apiParam (Body parameters) {'+capitalizeFirstLetter(attributes[attr].type)+'} ['+attr+'] New value of <code>'+attr+'</code> for '+name);
	for (let i = 0; i < options.length; i++)
		if (options[i].relation != 'belongsToMany')
			doc.push(' * @apiParam (Body parameters) {Integer} ['+options[i].foreignKey+'] <code>id</code> of entity '+options[i].target.substring(2)+' to associate');

	doc.push(' * @apiSuccess {Object} '+name+' Updated '+name);
	for (const attr in attributes)
		if (privateFields.indexOf(attr) == -1)
			doc.push(' * @apiSuccess {'+capitalizeFirstLetter(attributes[attr].type)+'} '+name+'.'+attr+' <code>'+attr+'</code> of '+name);

	doc.push(' * @apiError (Error 404) {Object} NotFound No '+name+' with ID <code>id</code> found');
	doc.push(' * @apiError (Error 500) {Object} ServerError An error occured when trying to update '+name);

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

function routeDelete(entity) {
	const name = entity.name.substring(2);
	const doc = [];
	doc.push('/**');
	doc.push(' * @api {delete} /api/'+name+'/:id?token=TOKEN 5 - Delete');
	doc.push(' * @apiVersion 1.0.0');
	doc.push(' * @apiDescription Permanently delete a record of <code>'+name+'</code> with <code>id</code>');
	doc.push(' * @apiGroup '+entity.displayName);
	doc.push(' * @apiUse token');
	doc.push(' * @apiParam (Params parameters) {Integer} id <code>id</code> of '+name+' to delete');

	doc.push(' * @apiSuccessExample {json} Success-Response:');
	doc.push(' *	 HTTP/1.1 200 OK');
	doc.push(' * @apiError (Error 404) {Object} NotFound No '+name+' with ID <code>id</code> found');

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

function entityDocumentation(entity, attributes, options) {
	let entityDoc = '';
	entityDoc += '/********************************************\n';
	entityDoc += ' ********************************************\n';
	entityDoc += ' * '+entity.name.toUpperCase()+'\n';
	entityDoc += ' ********************************************\n';
	entityDoc += ' *******************************************/\n';
	entityDoc += '/** @apiDefine '+entity.name+' '+capitalizeFirstLetter(entity.name)+ ' */\n';
	entityDoc += routeGet(entity, attributes, options);
	entityDoc += routeGetId(entity, attributes, options);
	entityDoc += routeGetAssociation(entity, options);
	entityDoc += routePost(entity, attributes, options);
	entityDoc += routePut(entity, attributes, options);
	entityDoc += routeDelete(entity);
	entityDoc += '\n\n';
	return entityDoc;
}

async function build(application) {

	const workspacePath = __dirname + '/../workspace/'+application.name;

	// Fetch all entities from metadata
	const modules = application.modules;
	const entities = [];
	const privateEntities = ['api_credentials'];
	for (let i = 0; i < modules.length; i++)
		for (let j = 0; j < modules[i].entities.length; j++)
			if (privateEntities.indexOf(modules[i].entities[j].name.substring(2)) == -1)
				entities.push(modules[i].entities[j]);

	// Load documentation template, it describes the authentication process
	let documentation = fs.readFileSync(__dirname+'/../structure/pieces/api/api_doc_template.js');
	// Generate documentation of each entity
	for (let i = 0; i < entities.length; i++) {
		try {
			const attributes = JSON.parse(fs.readFileSync(workspacePath+'/models/attributes/'+entities[i].name+'.json', 'utf8'));
			const options = JSON.parse(fs.readFileSync(workspacePath+'/models/options/'+entities[i].name+'.json', 'utf8'));
			documentation += entityDocumentation(entities[i], attributes, options);
		} catch (e) {
			// Status history models can't be loaded
		}
	}

	// Write file to workspace's api folder
	fs.writeFileSync(workspacePath+'/api/doc/doc_descriptor.js', documentation, 'utf8');
	const isWin = /^win/.test(process.platform);
	let cmd;
	if (isWin || process.platform == "win32")
		cmd = 'node "' + path.join(__dirname, '..', 'node_modules', 'apidoc', 'bin', 'apidoc') + '" -i "' + path.join(workspacePath, 'api', 'doc') + '" -o "' + path.join(workspacePath, 'api', 'doc', 'website') + '"';
	else
		cmd = '"' + path.join(__dirname, '..', 'node_modules', 'apidoc', 'bin', 'apidoc') + '" -i "' + path.join(workspacePath, 'api', 'doc') + '" -o "' + path.join(workspacePath, 'api', 'doc', 'website') + '"';

	await new Promise(resolve => {
		exec(cmd, err => {
			if (err)
				console.error(err);
			resolve();
		});
	});

	return;
}

exports.build = build;
