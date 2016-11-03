var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');
var structure_field = require('./structure_data_field');
var helpers = require('../utils/helpers');

//Create association between the models
exports.setupAssociation = function(idApplication, sourceDataEntity, targetDataEntity, foreignKey, as, relation, through, callback){
	// SETUP MODEL OPTIONS FILE
	var optionsFileName = './workspace/'+idApplication+'/models/options/'+sourceDataEntity.toLowerCase()+'.json';
	var optionsFile = fs.readFileSync(optionsFileName);
	var optionsObject = JSON.parse(optionsFile);
	var baseOptions = {target: targetDataEntity.toLowerCase(), relation: relation};
	baseOptions.foreignKey = foreignKey;
	baseOptions.as = as;
	// Maintenant cela est fait directement dans la grammar
	/*baseOptions.foreignKey = "id_" + sourceDataEntity + "_" + as;*/

	if(relation == "belongsToMany"){
		baseOptions.through = through;
	}

	optionsObject.push(baseOptions);
	var writeStream = fs.createWriteStream(optionsFileName);
	writeStream.write(JSON.stringify(optionsObject, null, 4));
	writeStream.end();
	writeStream.on('finish', function() {
		console.log("Model => Options/Associations ------------------ COMPLETED");
		callback();
	});
}

// DataEntity
exports.setupDataEntity = function(attr, callback) {
	var id_application = attr['id_application'];
	var name_data_entity = "";
	var name_module = "";
	var displaySidebar = "block";

	// Selon la fonction du designer, on sait qu'elle entité on souhaite créer.
	if(attr.function === "createNewEntityWithBelongsTo" || attr.function === 'createNewEntityWithHasMany'){
		name_data_entity = attr.options.source;
		name_module = attr.name_module;
	}
	// Creation d'entité dans le cas d'un related to, si l'entité target n'existe pas
	else if(attr.function === "createNewBelongsTo" || attr.function === 'createNewHasMany'){
		name_data_entity = attr.options.target;
		name_module = attr.name_module;
		displaySidebar = "none";
	}
	// Creation simple d'entité
	else{
		for (var i = 0; i < attr['options'].length; i++) {
			if (attr['options'][i].property == 'entity') { name_data_entity = attr['options'][i].value; }
			if (attr['options'][i].property == 'name_module') { name_module = attr['options'][i].value; }
		}
	}

	function createModelFile(idApplication, nameDataEntity, callback){
		// CREATE MODEL FILE
		var modelTemplate = fs.readFileSync('./structure/pieces/models/data_entity.js', 'utf8');
		modelTemplate = modelTemplate.replace(/MODEL_NAME_LOWER/g, nameDataEntity.toLowerCase());
		modelTemplate = modelTemplate.replace(/MODEL_NAME/g, nameDataEntity.charAt(0).toUpperCase() + nameDataEntity.toLowerCase().slice(1));
		modelTemplate = modelTemplate.replace(/TABLE_NAME/g, idApplication +'_'+nameDataEntity.toLowerCase());
		var writeStream = fs.createWriteStream('./workspace/'+ idApplication +'/models/'+nameDataEntity.toLowerCase()+'.js');
		writeStream.write(modelTemplate);
		writeStream.end();
		writeStream.on('finish', function() {
			console.log('File => Model ------------------ CREATED');
			callback();
		});
	}

	function createModelAttributesFile(idApplication, nameDataEntity, callback){
		// CREATE MODEL ATTRIBUTES FILE
		var writeStream = fs.createWriteStream('./workspace/'+ idApplication +'/models/attributes/'+ nameDataEntity.toLowerCase() +'.json');
		var baseAttributes = {"id": {"type": "INTEGER","autoIncrement": true,"primaryKey": true},"version":"INTEGER"};
		writeStream.write(JSON.stringify(baseAttributes, null, 4));
		writeStream.end();
		writeStream.on('finish', function() {
			console.log("Model => attributes ------------------ CREATED");
			// CREATE MODEL OPTIONS (ASSOCIATIONS) FILE
			var writeStreamOption = fs.createWriteStream('./workspace/'+ idApplication +'/models/options/'+ nameDataEntity.toLowerCase() +'.json');
			var baseOptions = [];
			writeStreamOption.write(JSON.stringify(baseOptions, null, 4));
			writeStreamOption.end();
			writeStreamOption.on('finish', function() {
				console.log("Model => options/associations ------------------ CREATED");
				callback();
			});
		});
	}

	function createRouteFile(idApplication, nameDataEntity, callback){
		// CREATE ROUTE FILE
		var routeTemplate = fs.readFileSync('./structure/pieces/routes/data_entity.js', 'utf8');
		routeTemplate = routeTemplate.replace(/ENTITY_NAME/g, nameDataEntity.toLowerCase());
		routeTemplate = routeTemplate.replace(/MODEL_NAME/g, nameDataEntity.charAt(0).toUpperCase() + nameDataEntity.toLowerCase().slice(1));
		var writeStream = fs.createWriteStream('./workspace/'+idApplication+'/routes/'+nameDataEntity.toLowerCase()+'.js');
		writeStream.write(routeTemplate);
		writeStream.end();
		writeStream.on('finish', function() {
			console.log('File => Route file ------------------ CREATED')
			callback();
		});
	}

	function createLayoutFile(idApplication, nameDataEntity, nameModule, callback){
		var fileName = __dirname + '/../workspace/' + idApplication + '/views/layout_' +  nameModule.toLowerCase() + '.dust';
		// Read file and get jQuery instance
		domHelper.read(fileName).then(function($) {

			var li = '';
			// Create new html
			li += "<li id='"+nameDataEntity.toLowerCase()+"_menu_item' style='display:"+displaySidebar+";' class='ui-state-default treeview'>\n";
				li += '<a href="#">\n';
					li += '<i class="fa fa-folder"></i>\n';
					li += '<span>{@__ key="entity.' + nameDataEntity.toLowerCase() + '.label_entity" /}</span>\n';
					li += '<i class="fa fa-angle-left pull-right"></i>\n';
				li += '</a>\n';
				li += '<ul class="treeview-menu">\n';
					li += '<li>\n';
						li += "<a href='/" + nameDataEntity.toLowerCase() + "/create_form'>\n";
							li += '<i class="fa fa-angle-double-right"></i>\n';
							li += '{@__ key="operation.create" /} {@__ key="entity.' + nameDataEntity.toLowerCase() + '.name_entity" /}\n';
						li += '</a>';
					li += '</li>';
					li += '<li>';
						li += "<a href='/" + nameDataEntity.toLowerCase() + "/list'>\n";
							li += '<i class="fa fa-angle-double-right"></i>\n';
							li += '{@__ key="operation.list" /} {@__ key="entity.' + nameDataEntity.toLowerCase() + '.plural_entity" /}\n';
						li += '</a>\n';
					li += '</li>\n';
				li += '</ul>\n';
			li += '</li>\n';

			// Add new html to document
			$('#sortable').append(li);

			// Write back to file
			domHelper.write(fileName, $("body")[0].innerHTML).then(function() {
				callback();
			});
		}).catch(function(err) {
			console.error(err);
			callback(err, null);
		});
	}

	function replaceCustomModule(fileBase, file, nameModule, callback){
		var fileToWrite = fileBase + '/' + file;
		data = fs.readFileSync(fileToWrite, 'utf8');
		var result = data.replace(/custom_module/g, nameModule.toLowerCase());

		var stream_file = fs.createWriteStream(fileToWrite);
		/* Node.js 0.10+ emits finish when complete */
		stream_file.write(result);
		stream_file.end();
		stream_file.on('finish', function () {
			console.log("File => "+ file +" ------------------ WRITTEN");
			callback();
		});
	}

	function replaceCustomDataEntity(fileBase, file, nameDataEntity, callback){
		var fileToWrite = fileBase + '/' + file;

		var data = fs.readFileSync(fileToWrite, 'utf8');
		var result = data.replace(/custom_data_entity/g, nameDataEntity.toLowerCase());

		var stream_file = fs.createWriteStream(fileToWrite);
		/* Node.js 0.10+ emits finish when complete */

		stream_file.write(result);
		stream_file.end();
		stream_file.on('finish', function() {
			console.log("File => "+ file +" ------------------ WRITTEN");
			callback();
		});
	}

	createModelFile(id_application, name_data_entity, function(){
		createModelAttributesFile(id_application, name_data_entity, function(){
			createRouteFile(id_application, name_data_entity, function(){
				createLayoutFile(id_application, name_data_entity, name_module, function(){
					/* *** 5 - Copy CRUD view folder and customize them according to data entity properties *** */
					fs.copySync(__dirname + '/pieces/views/entity', __dirname + '/../workspace/' + id_application + '/views/' + name_data_entity.toLowerCase());
					/* Edit create.jade to match data entity properties */
					var fileBase = __dirname + '/../workspace/' + id_application + '/views/' + name_data_entity.toLowerCase();

					/* Replace all variables 'custom_module' in create.jade */
					replaceCustomModule(fileBase, "create.dust", name_module, function(){
						/* Replace all variables 'custom_data_entity' in create.dust */
						replaceCustomDataEntity(fileBase, "create.dust", name_data_entity, function(){
							/* Replace all variables 'custom_data_entity' in create_fields.dust */
							replaceCustomDataEntity(fileBase, "create_fields.dust", name_data_entity, function(){
								/* Replace all variables 'custom_module' in show.dust */
								replaceCustomModule(fileBase, "show.dust", name_module, function(){
									/* Replace all variables 'custom_data_entity' in show.dust */
									replaceCustomDataEntity(fileBase, "show.dust", name_data_entity, function(){
										/* Replace all variables 'custom_data_entity' in show_fields.dust */
										replaceCustomDataEntity(fileBase, "show_fields.dust", name_data_entity, function(){
											/* Replace all variables 'custom_module' in update.dust */
											replaceCustomModule(fileBase, "update.dust", name_module, function(){
												/* Replace all variables 'custom_data_entity' in update.dust */
												replaceCustomDataEntity(fileBase, "update.dust", name_data_entity, function(){
													/* Replace all variables 'custom_data_entity' in update_fields.dust */
													replaceCustomDataEntity(fileBase, "update_fields.dust", name_data_entity, function(){
														/* Replace all variables 'custom_module' in list.dust */
														replaceCustomModule(fileBase, "list.dust", name_module, function(){
															/* Replace all variables 'custom_data_entity' in list.dust */
															replaceCustomDataEntity(fileBase, "list.dust", name_data_entity, function(){
																/* Replace all variables 'custom_data_entity' in list_fields.dust */
																replaceCustomDataEntity(fileBase, "list_fields.dust", name_data_entity, function(){
																	/* *** 6 - Update translation file *** */
																	fileTranslationFR = __dirname + '/../workspace/' + id_application + '/locales/fr-FR.json';
																	fileTranslationEN = __dirname + '/../workspace/' + id_application + '/locales/en-EN.json';
																	dataFR = require(fileTranslationFR);
																	dataEN = require(fileTranslationEN);

																	// On place par defaut la traduction dans le EN et le FR
																	str_id_data_entity = "id_" + name_data_entity;
																	tns = '  { \n\t\t\t"label_entity" : "' + name_data_entity + '",\n';
																	tns = tns + '\t\t\t"name_entity" : "' + name_data_entity + '",\n';
																	tns = tns + '\t\t\t"plural_entity" : "' + name_data_entity + 's",\n';
																	tns = tns + '\t\t\t"id_entity": "ID"\n';
																	tns = tns + '\t\t}\n';

																	dataFR.entity[name_data_entity.toLowerCase()] = JSON.parse(tns);
																	dataEN.entity[name_data_entity.toLowerCase()] = JSON.parse(tns);

																	var stream_fileTranslationFR = fs.createWriteStream(fileTranslationFR);
																	var stream_fileTranslationEN = fs.createWriteStream(fileTranslationEN);

																	stream_fileTranslationFR.write(JSON.stringify(dataFR, null, 2));
																	stream_fileTranslationFR.end();
																	stream_fileTranslationFR.on('finish', function () {
																		console.log('File => Translation FR ------------------ WRITTEN');
																		stream_fileTranslationEN.write(JSON.stringify(dataEN, null, 2));
																		stream_fileTranslationEN.end();
																		stream_fileTranslationEN.on('finish', function () {
																			console.log('File => Translation EN ------------------ WRITTEN');
																			callback();
																		});
																	});
																});
															});
														});
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
	});
}

exports.deleteDataEntity = function(id_application, name_module, name_data_entity, callback) {
	var baseFolder = __dirname + '/../workspace/'+id_application;
	// Delete views folder
	helpers.rmdirSyncRecursive(baseFolder+'/views/'+name_data_entity);
	// Delete route file
	fs.unlinkSync(baseFolder+'/routes/'+name_data_entity+'.js');
	// Delete model file
	fs.unlinkSync(baseFolder+'/models/'+name_data_entity+'.js');
	// Delete options
	fs.unlinkSync(baseFolder+'/models/options/'+name_data_entity+'.json');
	// Delete attributes
	fs.unlinkSync(baseFolder+'/models/attributes/'+name_data_entity+'.json');

	var filePath = __dirname+'/../workspace/'+id_application+'/views/layout_'+name_module+'.dust';
	domHelper.read(filePath).then(function($){
		$("#"+name_data_entity+'_menu_item').remove();
		domHelper.write(filePath, $("body")[0].innerHTML).then(function() {
			callback();
		})
	})
}
