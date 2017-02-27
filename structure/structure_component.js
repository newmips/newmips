var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');
var translateHelper = require("../utils/translate");

function setupComponentModel(idApplication, folderComponent, nameComponent, filename, callback){
	// CREATE MODEL FILE
	var modelTemplate = fs.readFileSync('./structure/pieces/component/'+folderComponent+'/models/model_'+filename+'.js', 'utf8');
	modelTemplate = modelTemplate.replace(/COMPONENT_NAME_LOWER/g, nameComponent);
	modelTemplate = modelTemplate.replace(/COMPONENT_NAME/g, nameComponent.charAt(0).toUpperCase()+nameComponent.toLowerCase().slice(1));
	modelTemplate = modelTemplate.replace(/TABLE_NAME/g, idApplication +'_'+ nameComponent);
	var writeStream = fs.createWriteStream('./workspace/'+idApplication+'/models/'+nameComponent+'.js');
	writeStream.write(modelTemplate);
	writeStream.end();
	writeStream.on('finish', function() {
		console.log('File => Component Model ------------------ CREATED');
		callback();
	});
}

function createComponentAttributesAndOptionsFiles(idApplication, folderComponent, nameComponent, filename, source, callback){
	// CREATE MODEL ATTRIBUTES FILE
	var attributesTemplate = fs.readFileSync('./structure/pieces/component/'+folderComponent+'/models/attributes/attributes_'+filename+'.json', 'utf8');
	var writeStream = fs.createWriteStream('./workspace/'+ idApplication +'/models/attributes/'+nameComponent+'.json');
	writeStream.write(attributesTemplate);
	writeStream.end();
	writeStream.on('finish', function() {
		console.log("Model => Component attributes ------------------ CREATED");
		// CREATE MODEL OPTIONS (ASSOCIATIONS) FILE
		var optionsTemplate = fs.readFileSync('./structure/pieces/component/'+folderComponent+'/models/options/options_'+filename+'.json', 'utf8');
		optionsTemplate = optionsTemplate.replace(/SOURCE_ENTITY_LOWER/g, source);
		var writeStreamOption = fs.createWriteStream('./workspace/'+ idApplication +'/models/options/'+nameComponent+'.json');

		writeStreamOption.write(optionsTemplate);
		writeStreamOption.end();
		writeStreamOption.on('finish', function() {
			console.log("Model => Component options/associations ------------------ CREATED");
			callback();
		});
	});
}

function setupComponentRoute(idApplication, folderComponent, nameComponent, urlSource, filename, source, callback){
	// CREATE ROUTE FILE
	var routeTemplate = fs.readFileSync('./structure/pieces/component/'+folderComponent+'/routes/route_'+filename+'.js', 'utf8');
	routeTemplate = routeTemplate.replace(/COMPONENT_NAME_LOWER/g, nameComponent.toLowerCase());
	routeTemplate = routeTemplate.replace(/COMPONENT_NAME/g, nameComponent.charAt(0).toUpperCase() + nameComponent.toLowerCase().slice(1));
	routeTemplate = routeTemplate.replace(/SOURCE_ENTITY_LOWER/g, source.toLowerCase());
	routeTemplate = routeTemplate.replace(/SOURCE_URL_ENTITY_LOWER/g, urlSource.toLowerCase());

	var writeStream = fs.createWriteStream('./workspace/'+idApplication+'/routes/'+nameComponent.toLowerCase()+'.js');
	writeStream.write(routeTemplate);
	writeStream.end();
	writeStream.on('finish', function() {
		console.log('File => Component Route file ------------------ CREATED');
		callback();
	});
}

function setupComponentRouteForAgenda(idApplication, folderComponent, codeName, filename, callback){

	var urlRoute = codeName.substring(2).toLowerCase();
	var codeNameLower = codeName.toLowerCase();
	var codeNameModel = codeName.charAt(0).toUpperCase()+codeName.toLowerCase().slice(1);
	// CREATE ROUTE FILE
	var routeTemplate = fs.readFileSync('./structure/pieces/component/'+folderComponent+'/routes/route_'+filename+'.js', 'utf8');
	routeTemplate = routeTemplate.replace(/CODE_NAME_LOWER/g, codeNameLower);
	routeTemplate = routeTemplate.replace(/CODE_NAME_MODEL/g, codeNameModel);

	routeTemplate = routeTemplate.replace(/CODE_NAME_EVENT_MODEL/g, codeNameModel+"_event");
	routeTemplate = routeTemplate.replace(/CODE_NAME_EVENT_LOWER/g, codeNameLower+"_event");
	routeTemplate = routeTemplate.replace(/CODE_NAME_EVENT_URL/g, codeNameLower.substring(2)+"_event");

	routeTemplate = routeTemplate.replace(/CODE_NAME_CATEGORY_LOWER/g, codeNameLower+"_category");
	routeTemplate = routeTemplate.replace(/CODE_NAME_CATEGORY_MODEL/g, codeNameModel+"_category");

	routeTemplate = routeTemplate.replace(/URL_ROUTE/g, urlRoute);

	var writeStream = fs.createWriteStream('./workspace/'+idApplication+'/routes/'+codeName.toLowerCase()+'.js');
	writeStream.write(routeTemplate);
	writeStream.end();
	writeStream.on('finish', function() {
		console.log('File => Component Route file ------------------ CREATED');
		callback();
	});
}

function setupComponentView(idApplication, nameComponent, urlComponent, filename, nameModule, callback){

	// CREATE VIEW FILE
	fs.copySync(__dirname+'/pieces/component/'+filename+'/views', __dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase());

	fs.rename(__dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase()+'/view_'+filename+'.dust', __dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase()+'/'+nameComponent.toLowerCase()+'.dust', function(){
		var viewTemplate = fs.readFileSync(__dirname+'/../workspace/'+idApplication+'/views/'+nameComponent.toLowerCase()+'/'+nameComponent.toLowerCase()+'.dust', 'utf8');
		viewTemplate = viewTemplate.replace(/custom_module/g, nameModule.toLowerCase());
		viewTemplate = viewTemplate.replace(/name_url_component/g, urlComponent.toLowerCase());
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

function setupComponentViewForAgenda(idApplication, component, valueComponent, callback){

	var codeNameCategory = valueComponent+"_category";
	var codeNameEvent = valueComponent+"_event";

	function replaceValueInTemplate(viewPath, codeName){
		if(fs.existsSync(viewPath)){
	        if(viewPath.substr(viewPath.length - 1) == "/"){
	            viewPath = viewPath.slice(0,-1);
	        }
	        fs.readdirSync(viewPath).forEach(function(file, index){
	            var curPath = viewPath+"/"+file;
                if(fs.lstatSync(curPath).isDirectory()) {
                    readdirSyncRecursive(curPath)
                } else {
                	var viewTemplate = fs.readFileSync(curPath, 'utf8');
					/*viewTemplate = viewTemplate.replace(/custom_module/g, nameModule.toLowerCase());*/
					viewTemplate = viewTemplate.replace(/URL_ROUTE/g, codeName.substring(2).toLowerCase());
					viewTemplate = viewTemplate.replace(/CODE_NAME_LOWER/g, codeName.toLowerCase());
					viewTemplate = viewTemplate.replace(/CODE_NAME_EVENT_LOWER/g, codeNameEvent.toLowerCase());
					viewTemplate = viewTemplate.replace(/URL_EVENT/g, codeNameEvent.toLowerCase().substring(2));
					viewTemplate = viewTemplate.replace(/RELATION_CATEGORY_LOWER/g, "r_"+valueComponent.toLowerCase()+"_event_category");

					var writeStream = fs.createWriteStream(curPath);
					writeStream.write(viewTemplate);
					writeStream.end();
                }
	        });
	    }
	}

	// Calendar View
	var componentViewFolder = __dirname+'/pieces/component/'+component+'/views';
	var viewsFolder = __dirname+'/../workspace/'+idApplication+'/views/'+valueComponent.toLowerCase();
	fs.copySync(componentViewFolder, viewsFolder);
	replaceValueInTemplate(viewsFolder, valueComponent);

	// Category View
	var componentViewFolderCategory = __dirname+'/pieces/component/'+component+'/views_category';
	var viewsFolderCategory = __dirname+'/../workspace/'+idApplication+'/views/'+valueComponent.toLowerCase()+'_category';
	fs.copySync(componentViewFolderCategory, viewsFolderCategory);
	replaceValueInTemplate(viewsFolderCategory, codeNameCategory);

	// Event View
	var componentViewFolderEvent = __dirname+'/pieces/component/'+component+'/views_event';
	var viewsFolderEvent = __dirname+'/../workspace/'+idApplication+'/views/'+valueComponent.toLowerCase()+'_event';
	fs.copySync(componentViewFolderEvent, viewsFolderEvent);
	replaceValueInTemplate(viewsFolderEvent,codeNameEvent);

	callback();
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

function addAccessManagment(idApplication, urlComponent, urlModule, callback){
	// Write new data entity to access.json file, within module's context
    var accessPath = __dirname + '/../workspace/'+idApplication+'/config/access.json';
    var accessObject = require(accessPath);
    accessObject[urlModule.toLowerCase()].entities.push({
    	name: urlComponent,
    	groups: [],
    	actions: {
    		read: [],
    		write: [],
    		delete: []
    	}
    });
    fs.writeFile(accessPath, JSON.stringify(accessObject, null, 4), function(err){
    	callback();
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

	setupComponentModel(attr.id_application, filename, nameComponentLower, filename, function(){
		createComponentAttributesAndOptionsFiles(attr.id_application, filename, nameComponent, filename, source, function(){
			setupComponentRoute(attr.id_application, filename, nameComponent, urlSource, filename, source, function(){

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
	var showComponentNameLower = showComponentName.toLowerCase();

	var urlComponent = attr.options.urlValue.toLowerCase();

	var filename = "contact_form";

	setupComponentView(attr.id_application, nameComponent, urlComponent, filename, attr.options.moduleName, function(){
		setupComponentRoute(attr.id_application, filename, nameComponent, "", filename, "", function(){
			translateHelper.writeLocales(attr.id_application, "component", nameComponentLower, showComponentName, attr.googleTranslate, function(){
				var layoutFileName = __dirname+'/../workspace/'+attr.id_application+'/views/layout_'+attr.options.moduleName.toLowerCase()+'.dust';
				domHelper.read(layoutFileName).then(function($) {
					var li = '';
					li += "<li id='"+nameComponentLower+"_menu_item' class='ui-state-default'>\n";
						li += '<a href="/'+urlComponent+'">\n';
							li += '<i class="fa fa-envelope"></i>\n';
							li += '<span>{@__ key="component.'+nameComponentLower+'.label_component" /}</span>\n';
						li += '</a>\n';
					li += '</li>\n';

					// Add new html to document
					$('#sortable').append(li);

					// Write back to file
					domHelper.write(layoutFileName, $).then(function() {
						addAccessManagment(attr.id_application, urlComponent, attr.options.moduleName.substring(2), function(){
							callback();
						});
					});
				}).catch(function(err) {
					callback(err, null);
				});
			});
		});
	});
}

exports.newAgenda = function(attr, callback){

	var idApplication = attr.id_application;

	var valueComponent = attr.options.value;
	var valueComponentLower = valueComponent.toLowerCase();

	var showComponentName = attr.options.showValue;
	var showComponentNameLower = showComponentName.toLowerCase();

	var urlComponent = attr.options.urlValue.toLowerCase();
	var filenameComponent = "agenda";
	var filenameEvent = "agenda_event";
	var filenameCategory = "agenda_category";

	var valueCategory = attr.category.options.value.toLowerCase();
	var valueEvent = attr.event.options.value.toLowerCase();

	var urlCategory = valueCategory.substring(2);
	var urlEvent =  valueEvent.substring(2);

	// Event Model
	setupComponentModel(idApplication, "agenda", valueEvent, filenameEvent, function(){
		createComponentAttributesAndOptionsFiles(idApplication, "agenda", valueEvent, filenameEvent, valueComponent, function(){
			// Categorie Model
			setupComponentModel(idApplication, "agenda", valueCategory, filenameCategory, function(){
				createComponentAttributesAndOptionsFiles(idApplication, "agenda", valueCategory, filenameCategory, null, function(){
					// Event Route
					setupComponentRouteForAgenda(idApplication, "agenda", valueEvent, filenameEvent, function(){
						// Category Route
						setupComponentRouteForAgenda(idApplication, "agenda", valueCategory, filenameCategory, function(){
							// Agenda Route
							setupComponentRouteForAgenda(idApplication, "agenda", valueComponent, filenameComponent, function(){
								// Component views
								setupComponentViewForAgenda(idApplication, "agenda", valueComponent, function(){
									// Add access managment to Agenda
									addAccessManagment(idApplication, urlComponent, attr.options.moduleName.substring(2), function(){
										// Add access managment to Agenda_Category
										addAccessManagment(idApplication, urlCategory, attr.options.moduleName.substring(2), function(){
											// Add access managment to Agenda_Event
											addAccessManagment(idApplication, urlEvent, attr.options.moduleName.substring(2), function(){
												// Add Event translation
												translateHelper.writeLocales(idApplication, "component", valueComponentLower, showComponentName, attr.googleTranslate, function(){
													translateHelper.writeLocales(idApplication, "component-agenda-event", valueEvent, "Event", attr.googleTranslate, function(){
														translateHelper.writeLocales(idApplication, "component-agenda-category", valueCategory, "Category", attr.googleTranslate, function(){
															var layoutFileName = __dirname+'/../workspace/'+idApplication+'/views/layout_'+attr.options.moduleName.toLowerCase()+'.dust';
															domHelper.read(layoutFileName).then(function($) {
																var li = '';
																li += "<li id='"+urlComponent+"_menu_item' class='treeview'>\n";
																li += "    <a href='#'>\n";
																li += "        <i class='fa fa-calendar-o'></i> <span>{@__ key=\"component."+valueComponentLower+".label_component\" /}</span>\n";
																li += "        <span class='pull-right-container'>\n";
																li += "            <i class='fa fa-angle-left pull-right'></i>\n";
																li += "        </span>\n";
																li += "    </a>\n";
																li += "    <ul class='treeview-menu'>\n";
																li += "        <li><a href='/"+urlComponent+"'><i class='fa fa-calendar'></i> {@__ key=\"global_component.agenda.menu\" /}</a></li>\n";
																li += "        <li id='"+urlEvent+"_menu_item' class='treeview'>\n";
																li += "            <a href='#'><i class='fa fa-calendar-plus-o'></i> {@__ key=\"component."+valueEvent+".label_component\" /}\n";
																li += "                <span class='pull-right-container'>\n";
																li += "                    <i class='fa fa-angle-left pull-right'></i>\n";
																li += "                </span>\n";
																li += "            </a>\n";
																li += "            <ul class='treeview-menu'>\n";
																li += "                <li><a href='/"+urlEvent+"/create_form'><i class='fa fa-plus'></i>{@__ key=\"operation.create\" /} {@__ key=\"component."+valueEvent+".label_component\" /}</a></li>\n";
																li += "                <li><a href='/"+urlEvent+"/list'><i class='fa fa-list'></i>{@__ key=\"operation.list\" /} {@__ key=\"component."+valueEvent+".plural_component\" /}</a></li>\n";
																li += "            </ul>\n";
																li += "        </li>\n";
																li += "        <li id='"+urlCategory+"_menu_item' class='treeview'>\n";
																li += "            <a href='#'><i class='fa fa-bookmark'></i> {@__ key=\"component."+valueCategory+".label_component\" /}\n";
																li += "                <span class='pull-right-container'>\n";
																li += "                    <i class='fa fa-angle-left pull-right'></i>\n";
																li += "                </span>\n";
																li += "            </a>\n";
																li += "            <ul class='treeview-menu'>\n";
																li += "                <li><a href='/"+urlCategory+"/create_form'><i class='fa fa-plus'></i>{@__ key=\"operation.create\" /} {@__ key=\"component."+valueCategory+".label_component\" /}</a></li>\n";
																li += "                <li><a href='/"+urlCategory+"/list'><i class='fa fa-list'></i>{@__ key=\"operation.list\" /} {@__ key=\"component."+valueCategory+".plural_component\" /}</a></li>\n";
																li += "            </ul>\n";
																li += "        </li>\n";
																li += "    </ul>\n";
																li += "</li>\n";

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