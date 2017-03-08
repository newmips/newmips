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
	routeTemplate = routeTemplate.replace(/COMPONENT_NAME_URL/g, nameComponent.toLowerCase().substring(2));
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

function setupComponentRouteForAgenda(idApplication, valueAgenda, valueEvent, valueCategory, callback){

	var valueAgendaModel = valueAgenda.charAt(0).toUpperCase()+valueAgenda.toLowerCase().slice(1);
	var valueEventModel = valueEvent.charAt(0).toUpperCase()+valueEvent.toLowerCase().slice(1);
	var valueCategoryModel = valueCategory.charAt(0).toUpperCase()+valueCategory.toLowerCase().slice(1);

	var urlRouteAgenda = valueAgenda.substring(2).toLowerCase();

	// CREATE ROUTE FILE
	var routeTemplate = fs.readFileSync('./structure/pieces/component/agenda/routes/route_agenda.js', 'utf8');

	routeTemplate = routeTemplate.replace(/CODE_NAME_LOWER/g, valueAgenda);
	routeTemplate = routeTemplate.replace(/URL_ROUTE/g, urlRouteAgenda);

	routeTemplate = routeTemplate.replace(/CODE_NAME_EVENT_MODEL/g, valueEventModel);
	routeTemplate = routeTemplate.replace(/CODE_NAME_EVENT_URL/g, valueEvent.substring(2));

	routeTemplate = routeTemplate.replace(/CODE_NAME_CATEGORY_MODEL/g, valueCategoryModel);
	routeTemplate = routeTemplate.replace(/CODE_NAME_CATEGORY_URL/g, valueCategory.substring(2));

	var writeStream = fs.createWriteStream('./workspace/'+idApplication+'/routes/'+valueAgenda+'.js');
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

function setupComponentViewForAgenda(idApplication, valueComponent, valueEvent, callback){

	// Calendar View
	var codeName = valueComponent.toLowerCase();

	var componentViewFolder = __dirname+'/pieces/component/agenda/views';
	var viewsFolder = __dirname+'/../workspace/'+idApplication+'/views/'+codeName;
	fs.copySync(componentViewFolder, viewsFolder);

	var viewPiece = __dirname+'/../workspace/'+idApplication+'/views/agenda/view_agenda.dust';
	var viewFile = __dirname+'/../workspace/'+idApplication+'/views/'+codeName+'/view_agenda.dust';

	var viewTemplate = fs.readFileSync(viewFile, 'utf8');
	viewTemplate = viewTemplate.replace(/CODE_NAME_LOWER/g, codeName);
	viewTemplate = viewTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);
	viewTemplate = viewTemplate.replace(/URL_ROUTE/g, codeName.substring(2));
	viewTemplate = viewTemplate.replace(/URL_EVENT/g, valueEvent.toLowerCase().substring(2));

	var writeStream = fs.createWriteStream(viewFile);
	writeStream.write(viewTemplate);
	writeStream.end();
	writeStream.on('finish', function() {
		console.log('File => Component View file ------------------ CREATED');

		// Copy the event view folder
		var componentEventViewFolder = __dirname+'/pieces/component/agenda/views/event';
		var eventViewsFolder = __dirname+'/../workspace/'+idApplication+'/views/'+valueEvent;

		fs.copySync(componentEventViewFolder, eventViewsFolder);

		var eventShowFile = __dirname+'/../workspace/'+idApplication+'/views/'+valueEvent+'/show_fields.dust';
		var eventCreateFile = __dirname+'/../workspace/'+idApplication+'/views/'+valueEvent+'/create_fields.dust';
		var eventUpdateFile = __dirname+'/../workspace/'+idApplication+'/views/'+valueEvent+'/update_fields.dust'

		var eventShowTemplate = fs.readFileSync(eventShowFile, 'utf8');
		var eventCreateTemplate = fs.readFileSync(eventCreateFile, 'utf8');
		var eventUpdateTemplate = fs.readFileSync(eventUpdateFile, 'utf8');

		eventShowTemplate = eventShowTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);
		eventCreateTemplate = eventCreateTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);
		eventUpdateTemplate = eventUpdateTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);

		var writeStreamEventShow = fs.createWriteStream(eventShowFile);
		writeStreamEventShow.write(eventShowTemplate);
		writeStreamEventShow.end();

		var writeStreamEventCreate = fs.createWriteStream(eventCreateFile);
		writeStreamEventCreate.write(eventCreateTemplate);
		writeStreamEventCreate.end();

		var writeStreamEventUpdate = fs.createWriteStream(eventUpdateFile);
		writeStreamEventUpdate.write(eventUpdateTemplate);
		writeStreamEventUpdate.end();

		writeStreamEventUpdate.on('finish', function() {
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
				// Add access managment to the component route
				addAccessManagment(attr.id_application, urlComponent, attr.options.moduleName.substring(2), function(){
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

	var valueEvent = "e_"+urlComponent+"_event";
	var valueCategory = "e_"+urlComponent+"_category";

	var urlEvent =  valueEvent.substring(2);
	var urlCategory = valueCategory.substring(2);

	// Update the event options.json to add an belongsToMany relation between event and user
	var eventOptionsPath = './workspace/' + idApplication + '/models/options/' + valueEvent.toLowerCase() + '.json';
    var eventOptionFile = fs.readFileSync(eventOptionsPath);
    var eventOptionObj = JSON.parse(eventOptionFile);

    eventOptionObj.push({
    	"target": "e_user",
        "relation": "belongsToMany",
        "through": idApplication+"_"+urlComponent+"_event_user",
        "as": "r_users",
        "foreignKey": "event_id",
        "otherKey": "user_id"
    });

    fs.writeFileSync(eventOptionsPath, JSON.stringify(eventOptionObj, null, 4));

	// Agenda Route
	setupComponentRouteForAgenda(idApplication, valueComponent, valueEvent, valueCategory, function(){
		// Agenda view
		setupComponentViewForAgenda(idApplication, valueComponent, valueEvent, function(){
			// Add access managment to Agenda
			addAccessManagment(idApplication, urlComponent, attr.options.moduleName.substring(2), function(){
				// Add Event translation
				translateHelper.writeLocales(idApplication, "component", valueComponentLower, showComponentName, attr.googleTranslate, function(){

					var layoutFileName = __dirname+'/../workspace/'+idApplication+'/views/layout_'+attr.options.moduleName.toLowerCase()+'.dust';
					domHelper.read(layoutFileName).then(function($) {

						$("#"+urlEvent+"_menu_item").remove();
						$("#"+urlCategory+"_menu_item").remove();

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
						li += "            <a href='#'><i class='fa fa-calendar-plus-o'></i> {@__ key=\"entity."+valueEvent+".label_entity\" /}\n";
						li += "                <span class='pull-right-container'>\n";
						li += "                    <i class='fa fa-angle-left pull-right'></i>\n";
						li += "                </span>\n";
						li += "            </a>\n";
						li += "            <ul class='treeview-menu'>\n";
						li += "                <li><a href='/"+urlEvent+"/create_form'><i class='fa fa-plus'></i>{@__ key=\"operation.create\" /} {@__ key=\"entity."+valueEvent+".label_entity\" /}</a></li>\n";
						li += "                <li><a href='/"+urlEvent+"/list'><i class='fa fa-list'></i>{@__ key=\"operation.list\" /} {@__ key=\"entity."+valueEvent+".plural_entity\" /}</a></li>\n";
						li += "            </ul>\n";
						li += "        </li>\n";
						li += "        <li id='"+urlCategory+"_menu_item' class='treeview'>\n";
						li += "            <a href='#'><i class='fa fa-bookmark'></i> {@__ key=\"entity."+valueCategory+".label_entity\" /}\n";
						li += "                <span class='pull-right-container'>\n";
						li += "                    <i class='fa fa-angle-left pull-right'></i>\n";
						li += "                </span>\n";
						li += "            </a>\n";
						li += "            <ul class='treeview-menu'>\n";
						li += "                <li><a href='/"+urlCategory+"/create_form'><i class='fa fa-plus'></i>{@__ key=\"operation.create\" /} {@__ key=\"entity."+valueCategory+".label_entity\" /}</a></li>\n";
						li += "                <li><a href='/"+urlCategory+"/list'><i class='fa fa-list'></i>{@__ key=\"operation.list\" /} {@__ key=\"entity."+valueCategory+".plural_entity\" /}</a></li>\n";
						li += "            </ul>\n";
						li += "        </li>\n";
						li += "    </ul>\n";
						li += "</li>\n";

						// Add new html to document
						$('#sortable').append(li);

						// Write back to file
						domHelper.write(layoutFileName, $).then(function() {

							// Clean empty and useless dust helper created by removing <li>
							var layoutContent = fs.readFileSync(layoutFileName, 'utf8');

							// Remove empty dust helper
							layoutContent = layoutContent.replace(/{@entityAccess entity=".+"}\W*{\/entityAccess}/g, "");

							var writeStream = fs.createWriteStream(layoutFileName);
							writeStream.write(layoutContent);
							writeStream.end();
							writeStream.on('finish', function() {
								callback();
							});
						});
					}).catch(function(err) {
						callback(err, null);
					});
				});
			});
		});
	});
}