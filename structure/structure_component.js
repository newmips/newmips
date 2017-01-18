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

function setupComponentRoute(idApplication, nameComponent, urlSource, filename, source, callback){
	// CREATE ROUTE FILE
	var routeTemplate = fs.readFileSync('./structure/pieces/component/'+filename+'/routes/route_'+filename+'.js', 'utf8');
	routeTemplate = routeTemplate.replace(/COMPONENT_NAME_LOWER/g, nameComponent.toLowerCase());
	routeTemplate = routeTemplate.replace(/COMPONENT_NAME/g, nameComponent.charAt(0).toUpperCase() + nameComponent.toLowerCase().slice(1));
	routeTemplate = routeTemplate.replace(/SOURCE_ENTITY_LOWER/g, source.toLowerCase());
	routeTemplate = routeTemplate.replace(/SOURCE_URL_ENTITY_LOWER/g, urlSource.toLowerCase());
	var writeStream = fs.createWriteStream('./workspace/'+idApplication+'/routes/'+nameComponent.toLowerCase()+'.js');
	writeStream.write(routeTemplate);
	writeStream.end();
	writeStream.on('finish', function() {
		console.log('File => Component Route file ------------------ CREATED')
		callback();
	});
}

function setupComponentView(idApplication, nameComponent, showNameComponent, filename, nameModule, callback){

	// CREATE VIEW FILE
	fs.copySync(__dirname+'/pieces/component/'+filename+'/views', __dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase());

	fs.rename(__dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase()+'/view_'+filename+'.dust', __dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase()+'/'+nameComponent.toLowerCase()+'.dust', function(){
		var viewTemplate = fs.readFileSync(__dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase()+'/'+nameComponent.toLowerCase()+'.dust', 'utf8');
		viewTemplate = viewTemplate.replace(/custom_module/g, nameModule.toLowerCase());
		viewTemplate = viewTemplate.replace(/name_component/g, nameComponent.toLowerCase());
		viewTemplate = viewTemplate.replace(/show_name_component/g, showNameComponent.toLowerCase());

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
		var source = attr.options.showSource;
		domHelper.read(file).then(function($) {
	        // Tabs structure doesn't exist, create it
	        var tabs = '';
	        var context;
	        if ($("#tabs").length == 0) {
	        	tabs += '<div class="nav-tabs-custom" id="tabs">';
	        	tabs += '	<ul class="nav nav-tabs">';
	        	tabs += '		<li class="active"><a data-toggle="tab" href="#home">'+source+'</a></li>';
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

	var nameComponent = attr.options.value;
	var nameComponentLower = nameComponent.toLowerCase();
	var urlComponent = attr.options.urlValue.toLowerCase();

	var showComponentName = attr.options.showValue;
	var showComponentNameLower = showComponentName.toLowerCase();

	var source = attr.options.source;
	var sourceLower = source.toLowerCase();
	var showSource = attr.options.showSource;
	var urlSource = attr.options.urlSource;

	var filename = "local_file_storage";

	setupComponentModel(attr.id_application, nameComponent, filename, function(){
		createComponentAttributesAndOptionsFiles(attr.id_application, nameComponent, filename, source, function(){
			setupComponentRoute(attr.id_application, nameComponent, urlSource, filename, source, function(){

				/* --------------- New translation --------------- */
				translateHelper.writeLocales(attr.id_application, "component", nameComponent, showComponentName, attr.googleTranslate, function(){
					// GET COMPONENT PIECES TO BUILD STRUCTURE FILE
					var componentPiece = fs.readFileSync('./structure/pieces/component/'+filename+'/views/view_'+filename+'.dust', 'utf8');

					var componentContent = componentPiece.replace(/COMPONENT_NAME_LOWER/g, nameComponentLower);
					componentContent = componentContent.replace(/COMPONENT_URL_NAME_LOWER/g, urlComponent);
					componentContent = componentContent.replace(/SOURCE_LOWER/g, sourceLower);

					var newLi = '<li><a id="'+nameComponentLower+'-click" data-toggle="tab" href="#'+nameComponentLower+'">{@__ key="component.'+nameComponentLower+'.label_component" /}</a></li>';

					var fileBase = __dirname+'/../workspace/'+attr.id_application+'/views/'+sourceLower;
					var file = fileBase+'/show_fields.dust';

					// CREATE THE TAB IN SHOW FIELDS
					addTab(attr, file, newLi, componentContent).then(callback);
				});
			});
		});
	});
}

exports.newContactForm = function(attr, callback){

	var nameComponent = attr.options.value;
	var nameComponentLower = nameComponent.toLowerCase();

	var showComponentName = attr.options.showValue;
	var showComponentNameLower = showNameComponent.toLowerCase();

	var filename = "contact_form";

	setupComponentView(attr.id_application, nameComponent, showComponentName, filename, attr.options.moduleName, function(){
		setupComponentRoute(attr.id_application, nameComponent, filename, "", function(){
			translateHelper.writeLocales(attr.id_application, "component", showComponentName, attr.googleTranslate, function(){
				var layoutFileName = __dirname+'/../workspace/'+attr.id_application+'/views/layout_'+attr.options.moduleName.toLowerCase()+'.dust';
				domHelper.read(layoutFileName).then(function($) {
					var li = '';
					// Create new html
					li += "<li id='"+nameComponent.toLowerCase()+"_menu_item' class='ui-state-default'>\n";
						li += '<a href="/'+nameComponent.toLowerCase()+'">\n';
							li += '<i class="fa fa-envelope"></i>\n';
							li += '<span>{@__ key="component.'+showComponentNameLower+'.label_component" /}</span>\n';
						li += '</a>\n';
					li += '</li>\n';

					// Add new html to document
					$('#sortable').append(li);

					// Write back to file
					domHelper.write(layoutFileName, $).then(function() {
						callback();
					});
				}).catch(function(err) {
					callback(err, null);
				});
			});
		});
	});
}