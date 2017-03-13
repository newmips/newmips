var models = require('../models/');
var fs = require('fs-extra');
var exec = require('child_process').exec;

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

function routeGet(entity, attributes) {
	var name = entity.codeName.substring(2);
	var doc = [];
	doc.push('/**');
	doc.push(' * @api {get} /api/'+name+'?token=TOKEN 1 - Fetch multiple '+name);
	doc.push(' * @apiGroup '+capitalizeFirstLetter(name));
	doc.push(' * @apiUse tokenLimitOffset');
	doc.push(' * @apiSuccess {Object[]} '+name+'s List of '+name);
	for (var attr in attributes)
		doc.push(' * @apiSuccess {'+capitalizeFirstLetter(attributes[attr].type)+'} '+name+'s.'+attr+' <code>'+attr+'</code> of '+name);

	doc.push(' * @apiSuccess {Integer} limit Limit used to fetch data');
	doc.push(' * @apiSuccess {Integer} offset Offset used to fetch data');

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

function routeGetId(entity, attributes) {
	var name = entity.codeName.substring(2);
	var doc = [];
	doc.push('/**');
	doc.push(' * @api {get} /api/'+name+'/:id?token=TOKEN&limit=10&offset=0 2 - Fetch '+name+' with specified id');
	doc.push(' * @apiGroup '+capitalizeFirstLetter(name));
	doc.push(' * @apiUse token');
	doc.push(' * @apiParam (Params parameters) {Integer} id The <code>id</code> of '+name+' to fetch');
	doc.push(' * @apiSuccess {Object} '+name+' Object of '+name);
	for (var attr in attributes)
		doc.push(' * @apiSuccess {'+capitalizeFirstLetter(attributes[attr].type)+'} '+name+'.'+attr+' <code>'+attr+'</code> of '+name);
	doc.push(' * @apiError (Error 404) {Object} NotFound No '+name+' with ID <code>id</code> found');

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

function routeGetAssociation(entity, options) {
	var name = entity.codeName.substring(2);
	var doc = [];
	doc.push('/**');
	doc.push(' * @api {get} /api/'+name+'/:id/:association?token=TOKEN&limit=10&offset=0 3 - Fetch association of '+name);
	doc.push(' * @apiGroup '+capitalizeFirstLetter(name));
	doc.push(' * @apiUse tokenLimitOffset');
	doc.push(' * @apiParam (Params parameters) {Integer} id <code>id</code> of the '+name+' to which <code>association</code> is related');

	var allowedValues = '{String=';
	for (var i = 0; i < options.length; i++) {
		allowedValues += options[i].target.substring(2);
		if (!(i+1 == options.length))
			allowedValues += ',';
	}
	allowedValues += '}';
	if (allowedValues == '{String=}')
		return '';
	doc.push(' * @apiParam (Params parameters) '+allowedValues+' association Name of the related entity');

	doc.push(' * @apiSuccess {Object} Object Object of <code>association</code>');
	doc.push(' * @apiSuccess {Integer} limit Limit used to fetch data');
	doc.push(' * @apiSuccess {Integer} offset Offset used to fetch data');
	doc.push(' * @apiError (Error 404) {Object} NotFound No '+name+' with ID <code>id</code> found');
	doc.push(' * @apiError (Error 404) {Object} AssociationNotFound No association with <code>association</code>');

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

var privateFields = ['version', 'f_password', 'f_token_password_reset', 'f_enabled'];
function routePost(entity, attributes, options) {
	var name = entity.codeName.substring(2);
	var doc = [];
	doc.push('/**');
	doc.push(' * @api {post} /api/'+name+'/?token=TOKEN 4 - Create '+name);
	doc.push(' * @apiGroup '+capitalizeFirstLetter(name));
	doc.push(' * @apiUse token');
	for (var attr in attributes)
		if (privateFields.indexOf(attr) == -1 && attr != 'id')
			doc.push(' * @apiParam (Body parameters) {'+capitalizeFirstLetter(attributes[attr].type)+'} '+attr+' <code>'+attr+'</code> of '+name);
	for (var i = 0; i < options.length; i++)
		if (options[i].relation != 'belongsToMany')
			doc.push(' * @apiParam (Body parameters) {Integer} '+options[i].foreignKey+' <code>id</code> of entity '+options[i].target.substring(2)+' to associate');
	doc.push(' * @apiSuccess {Object} '+name+' Created '+name);
	for (var attr in attributes)
		if (privateFields.indexOf(attr) == -1)
			doc.push(' * @apiSuccess {'+capitalizeFirstLetter(attributes[attr].type)+'} '+name+'.'+attr+' <code>'+attr+'</code> of '+name);

	doc.push(' * @apiError (Error 500) {Object} ServerError An error occured when trying to create '+name);

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

function routePut(entity, attributes, options) {
	var name = entity.codeName.substring(2);
	var doc = [];
	doc.push('/**');
	doc.push(' * @api {put} /api/'+name+'/:id?token=TOKEN 5 - Update '+name);
	doc.push(' * @apiGroup '+capitalizeFirstLetter(name));
	doc.push(' * @apiUse token');
	doc.push(' * @apiParam (Params parameters) {Integer} id <code>id</code> of the '+name+' to update');
	for (var attr in attributes)
		if (privateFields.indexOf(attr) == -1 && attr != 'id')
			doc.push(' * @apiParam (Body parameters) {'+capitalizeFirstLetter(attributes[attr].type)+'} '+attr+' New value of <code>'+attr+'</code> for '+name);
	for (var i = 0; i < options.length; i++)
		if (options[i].relation != 'belongsToMany')
			doc.push(' * @apiParam (Body parameters) {Integer} '+options[i].foreignKey+' <code>id</code> of entity '+options[i].target.substring(2)+' to associate');

	doc.push(' * @apiSuccess {Object} '+name+' Updated '+name);
	for (var attr in attributes)
		if (privateFields.indexOf(attr) == -1)
			doc.push(' * @apiSuccess {'+capitalizeFirstLetter(attributes[attr].type)+'} '+name+'.'+attr+' <code>'+attr+'</code> of '+name);

	doc.push(' * @apiError (Error 404) {Object} NotFound No '+name+' with ID <code>id</code> found');
	doc.push(' * @apiError (Error 500) {Object} ServerError An error occured when trying to update '+name);

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

function routeDelete(entity) {
	var name = entity.codeName.substring(2);
	var doc = [];
	doc.push('/**');
	doc.push(' * @api {delete} /api/'+name+'/:id?token=TOKEN 6 - Delete '+name);
	doc.push(' * @apiGroup '+capitalizeFirstLetter(name));
	doc.push(' * @apiUse token');
	doc.push(' * @apiParam (Params parameters) {Integer} id <code>id</code> of '+name+' to delete');

	doc.push(' * @apiSuccessExample {json} Success-Response:');
	doc.push(' *     HTTP/1.1 200 OK');
	doc.push(' * @apiError (Error 404) {Object} NotFound No '+name+' with ID <code>id</code> found');

	doc.push(' */');
	doc.push('\n');
	return doc.join('\n');
}

function entityDocumentation(entity, attributes, options) {
	var entityDoc = '';
	entityDoc += routeGet(entity, attributes);
	entityDoc += routeGetId(entity, attributes);
	entityDoc += routeGetAssociation(entity, options);
	entityDoc += routePost(entity, attributes, options);
	entityDoc += routePut(entity, attributes, options);
	entityDoc += routeDelete(entity);
	return entityDoc;
}

function build(id_application) {
	return new Promise(function(resolve, reject) {
		var workspacePath = __dirname + '/../workspace/'+id_application;

		// Fetch all entities from database
		models.Module.findAll({
			where: {id_application: id_application},
			include: [{model: models.DataEntity}]
		}).then(function(modules) {
			var entities = [];
			for (var i = 0; i < modules.length; i++)
				for (var j = 0; j < modules[i].DataEntities.length; j++)
					entities.push(modules[i].DataEntities[j]);

			// Load documentation template, it describes the authentication process
			var documentation = fs.readFileSync(__dirname+'/../structure/pieces/api/api_doc_template.js');
			// Generate documentation of each entity
			for (var i = 0; i < entities.length; i++) {
				var attributes = JSON.parse(fs.readFileSync(workspacePath+'/models/attributes/'+entities[i].codeName+'.json', 'utf8'));
				var options = JSON.parse(fs.readFileSync(workspacePath+'/models/options/'+entities[i].codeName+'.json', 'utf8'));
				documentation += entityDocumentation(entities[i], attributes, options);
			}

			fs.writeFileSync(workspacePath+'/api/doc/doc_descriptor.js', documentation, 'utf8');
			var cmd = 'apiDoc -i '+workspacePath+'/api/doc/ -o '+workspacePath+'/api/doc/website';
			exec(cmd, function(error, stdout, stderr) {
				if (error)
					console.log(error);
				console.log("API GENERATED");
				resolve();
			});
		}).catch(function(err) {
			reject(err);
		});
	});
}

exports.build = build;
