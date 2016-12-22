var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');

function setupComponentModel(idApplication, nameComponent, filename, source, callback){
	// CREATE MODEL FILE
	var modelTemplate = fs.readFileSync('./structure/pieces/component/models/'+filename+'.js', 'utf8');
	modelTemplate = modelTemplate.replace(/COMPONENT_NAME_LOWER/g, nameComponent.toLowerCase());
	modelTemplate = modelTemplate.replace(/COMPONENT_NAME/g, nameComponent.charAt(0).toUpperCase() + nameComponent.toLowerCase().slice(1));
	modelTemplate = modelTemplate.replace(/TABLE_NAME/g, idApplication +'_'+ nameComponent.toLowerCase());
	var writeStream = fs.createWriteStream('./workspace/'+ idApplication +'/models/'+nameComponent.toLowerCase()+'.js');
	writeStream.write(modelTemplate);
	writeStream.end();
	writeStream.on('finish', function() {
		console.log('File => Component Model ------------------ CREATED');
		callback();
	});
}

function createComponentAttributesAndOptionsFiles(idApplication, nameComponent, filename, source, callback){
	// CREATE MODEL ATTRIBUTES FILE
	var attributesTemplate = fs.readFileSync('./structure/pieces/component/models/attributes/'+filename+'.json', 'utf8');
	var writeStream = fs.createWriteStream('./workspace/'+ idApplication +'/models/attributes/'+nameComponent.toLowerCase()+'.json');
	writeStream.write(attributesTemplate);
	writeStream.end();
	writeStream.on('finish', function() {
		console.log("Model => Component attributes ------------------ CREATED");
		// CREATE MODEL OPTIONS (ASSOCIATIONS) FILE
		var optionsTemplate = fs.readFileSync('./structure/pieces/component/models/options/'+filename+'.json', 'utf8');
		optionsTemplate = optionsTemplate.replace(/SOURCE_ENTITY_LOWER/g, source.toLowerCase());
		var writeStreamOption = fs.createWriteStream('./workspace/'+ idApplication +'/models/options/'+nameComponent.toLowerCase()+'.json');

		writeStreamOption.write(optionsTemplate);
		writeStreamOption.end();
		writeStreamOption.on('finish', function() {
			console.log("Model => Component options/associations ------------------ CREATED");
			callback();
		});
	});
}

function setupComponentRoute(idApplication, nameComponent, filename, source, callback){
	// CREATE ROUTE FILE
	var routeTemplate = fs.readFileSync('./structure/pieces/component/routes/'+filename+'.js', 'utf8');
	routeTemplate = routeTemplate.replace(/COMPONENT_NAME_LOWER/g, nameComponent.toLowerCase());
	routeTemplate = routeTemplate.replace(/COMPONENT_NAME/g, nameComponent.charAt(0).toUpperCase() + nameComponent.toLowerCase().slice(1));
	routeTemplate = routeTemplate.replace(/SOURCE_ENTITY_LOWER/g, source.toLowerCase());
	var writeStream = fs.createWriteStream('./workspace/'+idApplication+'/routes/'+nameComponent.toLowerCase()+'.js');
	writeStream.write(routeTemplate);
	writeStream.end();
	writeStream.on('finish', function() {
		console.log('File => Component Route file ------------------ CREATED')
		callback();
	});
}

function addTab(attr, file, newLi, newTabContent) {
	return new Promise(function(resolve, reject) {
		var source = attr.options.source.toLowerCase();
		domHelper.read(file).then(function($) {
	        // Tabs structure doesn't exist, create it
	        var tabs = '';
	        var context;
	        if ($("#tabs").length == 0) {
	        	tabs += '<div class="nav-tabs-custom" id="tabs">';
	        	tabs += '	<ul class="nav nav-tabs">';
	        	tabs += '		<li class="active"><a data-toggle="tab" href="#home">' + source + '</a></li>';
	        	tabs += '	</ul>';

	        	tabs += '	<div class="tab-content">';
	        	tabs += '		<div id="home" class="tab-pane fade in active"></div>';
	        	tabs += '	</div>';
	        	tabs += '</div>';
	        	context = $(tabs);
	        	$("#home", context).append($("#fields"));
	        	$("#home", context).append($(".actions"));
	        } else {
	        	context = $("#tabs");
	        }

	        // Append created elements to `context` to handle presence of tab or not
	        $(".nav-tabs", context).append(newLi);
	        $(".tab-content", context).append(newTabContent);

	        $('body').empty().append(context);
	        domHelper.write(file, $).then(function() {
	        	resolve();
	        });
	    });
	});
}

exports.newLocalFileStorage = function(attr, callback){
	var component = attr.options.component;
	var nameComponent = attr.options.name;
	var nameComponentLower = nameComponent.toLowerCase();
	var source = attr.options.source;
	var sourceLower = source.toLowerCase();
	var filename = "";

	switch(component){
		case "localfilestorage" :
		filename = "local_file_storage";
		break;
		default:
		var err = new Error();
		err.message = "Component file doesn't exist.";
		callback(err);
		break;
	}

	setupComponentModel(attr.id_application, nameComponent, filename, source, function(){
		createComponentAttributesAndOptionsFiles(attr.id_application, nameComponent, filename, source, function(){
			setupComponentRoute(attr.id_application, nameComponent, filename, source, function(){
				// Update translations files
				var fileTranslationFR = __dirname + '/../workspace/' + attr.id_application + '/locales/fr-FR.json';
				var fileTranslationEN = __dirname + '/../workspace/' + attr.id_application + '/locales/en-EN.json';
				var dataFR = require(fileTranslationFR);
				var dataEN = require(fileTranslationEN);

				var tns = '  { \n\t\t\t"label_component" : "' + nameComponent + '",\n';
				tns = tns + '\t\t\t"name_component" : "' + nameComponent + '",\n';
				tns = tns + '\t\t\t"plural_component" : "' + nameComponent + 's"\n';
				tns = tns + '\t\t}\n';

				dataFR.component[nameComponent.toLowerCase()] = JSON.parse(tns);
				dataEN.component[nameComponent.toLowerCase()] = JSON.parse(tns);

				var stream_fileTranslationFR = fs.createWriteStream(fileTranslationFR);
				var stream_fileTranslationEN = fs.createWriteStream(fileTranslationEN);

				stream_fileTranslationFR.write(JSON.stringify(dataFR, null, 2));
				stream_fileTranslationFR.end();
				stream_fileTranslationFR.on('finish', function () {
					console.log('File => Component Translation FR ------------------ WRITTEN');
					stream_fileTranslationEN.write(JSON.stringify(dataEN, null, 2));
					stream_fileTranslationEN.end();
					stream_fileTranslationEN.on('finish', function () {
						console.log('File => Component Translation EN ------------------ WRITTEN');

						// GET COMPONENT PIECES TO BUILD STRUCTURE FILE
						var componentPiece = fs.readFileSync('./structure/pieces/component/views/'+filename+'.dust', 'utf8');
						var componentContent = componentPiece.replace(/COMPONENT_NAME_LOWER/g, nameComponentLower);
						var componentContent = componentContent.replace(/SOURCE_LOWER/g, sourceLower);

						var newLi = '<li><a id="'+nameComponentLower+'-click" data-toggle="tab" href="#'+nameComponentLower+'">{@__ key="component.'+nameComponentLower+'.label_component" /}</a></li>';

						var fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + sourceLower;
						var file = fileBase + '/show_fields.dust';

						// CREATE THE TAB IN SHOW FIELDS
						addTab(attr, file, newLi, componentContent).then(callback);
					});
				});
			});
		});
	});
}