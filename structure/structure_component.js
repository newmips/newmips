var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');
var translateHelper = require("../utils/translate");

function setupComponentModel(idApplication, nameComponent, filename, callback){
	// CREATE MODEL FILE
	var modelTemplate = fs.readFileSync('./structure/pieces/component/'+filename+'/models/model_'+filename+'.js', 'utf8');
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
	var attributesTemplate = fs.readFileSync('./structure/pieces/component/'+filename+'/models/attributes/attributes_'+filename+'.json', 'utf8');
	var writeStream = fs.createWriteStream('./workspace/'+ idApplication +'/models/attributes/'+nameComponent.toLowerCase()+'.json');
	writeStream.write(attributesTemplate);
	writeStream.end();
	writeStream.on('finish', function() {
		console.log("Model => Component attributes ------------------ CREATED");
		// CREATE MODEL OPTIONS (ASSOCIATIONS) FILE
		var optionsTemplate = fs.readFileSync('./structure/pieces/component/'+filename+'/models/options/options_'+filename+'.json', 'utf8');
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
	var routeTemplate = fs.readFileSync('./structure/pieces/component/'+filename+'/routes/route_'+filename+'.js', 'utf8');
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

function setupComponentView(idApplication, nameComponent, filename, nameModule, callback){

	// CREATE VIEW FILE
	fs.copySync(__dirname+'/pieces/component/'+filename+'/views', __dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase());

	fs.rename(__dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase()+'/view_'+filename+'.dust', __dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase()+'/'+nameComponent.toLowerCase()+'.dust', function(){
		var viewTemplate = fs.readFileSync(__dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase()+'/'+nameComponent.toLowerCase()+'.dust', 'utf8');
		viewTemplate = viewTemplate.replace(/custom_module/g, nameModule.toLowerCase());
		viewTemplate = viewTemplate.replace(/name_component/g, nameComponent.toLowerCase());

		var writeStream = fs.createWriteStream(__dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase()+'/'+nameComponent.toLowerCase()+'.dust');
		writeStream.write(viewTemplate);
		writeStream.end();
		writeStream.on('finish', function() {
			console.log('File => Component View file ------------------ CREATED')
			callback();
		});
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
			err.message = "Component files doesn't exist.";
			callback(err);
		break;
	}

	setupComponentModel(attr.id_application, nameComponent, filename, function(){
		createComponentAttributesAndOptionsFiles(attr.id_application, nameComponent, filename, source, function(){
			setupComponentRoute(attr.id_application, nameComponent, filename, source, function(){

				/* --------------- New translation --------------- */
				translateHelper.writeLocales(attr.id_application, "component", nameComponent, attr.googleTranslate, function(){
					// GET COMPONENT PIECES TO BUILD STRUCTURE FILE
					var componentPiece = fs.readFileSync('./structure/pieces/component/'+filename+'/views/view_'+filename+'.dust', 'utf8');
					var componentContent = componentPiece.replace(/COMPONENT_NAME_LOWER/g, nameComponentLower);
					var componentContent = componentContent.replace(/SOURCE_LOWER/g, sourceLower);

					var newLi = '<li><a id="'+nameComponentLower+'-click" data-toggle="tab" href="#'+nameComponentLower+'">{@__ key="component.'+nameComponentLower+'.label_component" /}</a></li>';

					var fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + sourceLower;
					var file = fileBase + '/show_fields.dust';

					// CREATE THE TAB IN SHOW FIELDS
					addTab(attr, file, newLi, componentContent).then(callback);
				});

				// Update translations files
				/*var fileTranslationFR = __dirname + '/../workspace/' + attr.id_application + '/locales/fr-FR.json';
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
						var componentPiece = fs.readFileSync('./structure/pieces/component/'+filename+'/views/view_'+filename+'.dust', 'utf8');
						var componentContent = componentPiece.replace(/COMPONENT_NAME_LOWER/g, nameComponentLower);
						var componentContent = componentContent.replace(/SOURCE_LOWER/g, sourceLower);

						var newLi = '<li><a id="'+nameComponentLower+'-click" data-toggle="tab" href="#'+nameComponentLower+'">{@__ key="component.'+nameComponentLower+'.label_component" /}</a></li>';

						var fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + sourceLower;
						var file = fileBase + '/show_fields.dust';

						// CREATE THE TAB IN SHOW FIELDS
						addTab(attr, file, newLi, componentContent).then(callback);
					});
				});*/
			});
		});
	});
}

exports.newContactForm = function(attr, callback){
	var component = attr.options.component;
	var nameComponent = attr.options.name || "ContactForm";
	var nameComponentLower = nameComponent.toLowerCase();
	var filename = "";

	switch(component){
		case "contactform" :
			filename = "contact_form";
		break;
		default:
			var err = new Error();
			err.message = "Component files doesn't exist.";
			callback(err);
		break;
	}

	setupComponentView(attr.id_application, nameComponent, filename, attr.options.moduleName, function(){
		setupComponentRoute(attr.id_application, nameComponent, filename, "", function(){
			translateHelper.writeLocales(attr.id_application, "component", nameComponent, attr.googleTranslate, function(){
				var layoutFileName = __dirname+'/../workspace/'+attr.id_application+'/views/layout_'+attr.options.moduleName.toLowerCase()+'.dust';
				domHelper.read(layoutFileName).then(function($) {
					var li = '';
					// Create new html
					li += "<li id='"+nameComponent.toLowerCase()+"_menu_item' class='ui-state-default'>\n";
						li += '<a href="/'+nameComponent.toLowerCase()+'">\n';
							li += '<i class="fa fa-envelope"></i>\n';
							li += '<span>{@__ key="global_component.contact_form.main_title" /}</span>\n';
						li += '</a>\n';
					li += '</li>\n';

					// Add new html to document
					$('#sortable').append(li);

					// Write back to file
					domHelper.write(layoutFileName, $).then(function() {
						callback();
					});
				}).catch(function(err) {
					console.error(err);
					callback(err, null);
				});
			});
		});
	});

}