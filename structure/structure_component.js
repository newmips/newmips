var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');
var translateHelper = require("../utils/translate");
var helpers = require("../utils/helpers");
var moment = require("moment");

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
		//console.log('File => Component Model ------------------ CREATED');
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
		//console.log("Model => Component attributes ------------------ CREATED");
		// CREATE MODEL OPTIONS (ASSOCIATIONS) FILE
		var optionsTemplate = fs.readFileSync('./structure/pieces/component/'+folderComponent+'/models/options/options_'+filename+'.json', 'utf8');
		optionsTemplate = optionsTemplate.replace(/SOURCE_ENTITY_LOWER/g, source);
		var writeStreamOption = fs.createWriteStream('./workspace/'+ idApplication +'/models/options/'+nameComponent+'.json');

		writeStreamOption.write(optionsTemplate);
		writeStreamOption.end();
		writeStreamOption.on('finish', function() {
			//console.log("Model => Component options/associations ------------------ CREATED");
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
		//console.log('File => Component Route file ------------------ CREATED');
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
		//console.log('File => Component Route file ------------------ CREATED');
		callback();
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
		//console.log('File => Component View file ------------------ CREATED');

		// Copy the event view folder
		var componentEventViewFolder = __dirname+'/pieces/component/agenda/views_event';
		var eventViewsFolder = __dirname+'/../workspace/'+idApplication+'/views/'+valueEvent;

		fs.copySync(componentEventViewFolder, eventViewsFolder);

		var eventShowFile = __dirname+'/../workspace/'+idApplication+'/views/'+valueEvent+'/show_fields.dust';
		var eventCreateFile = __dirname+'/../workspace/'+idApplication+'/views/'+valueEvent+'/create_fields.dust';
		var eventUpdateFile = __dirname+'/../workspace/'+idApplication+'/views/'+valueEvent+'/update_fields.dust'

		var eventShowTemplate = fs.readFileSync(eventShowFile, 'utf8');
		var eventCreateTemplate = fs.readFileSync(eventCreateFile, 'utf8');
		var eventUpdateTemplate = fs.readFileSync(eventUpdateFile, 'utf8');

		eventShowTemplate = eventShowTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);
		eventShowTemplate = eventShowTemplate.replace(/URL_EVENT/g, valueEvent.toLowerCase().substring(2));
		eventCreateTemplate = eventCreateTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);
		eventCreateTemplate = eventCreateTemplate.replace(/URL_EVENT/g, valueEvent.toLowerCase().substring(2));
		eventUpdateTemplate = eventUpdateTemplate.replace(/CODE_NAME_EVENT_LOWER/g, valueEvent);
		eventUpdateTemplate = eventUpdateTemplate.replace(/URL_EVENT/g, valueEvent.toLowerCase().substring(2));

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
    return new Promise(function (resolve, reject) {
        var source = attr.options.source.toLowerCase();
        domHelper.read(file).then(function ($) {
            // Tabs structure doesn't exist, create it
            var tabs = '';
            var context;
            if ($("#tabs").length == 0) {
                tabs += '<div class="nav-tabs-custom" id="tabs">';
                tabs += '	<ul class="nav nav-tabs">';
                tabs += '		<li class="active"><a data-toggle="tab" href="#home">{@__ key="entity.' + source + '.label_entity" /}</a></li>';
                tabs += '	</ul>';
                tabs += '	<div class="tab-content" style="min-height:275px;">';
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
            domHelper.write(file, $).then(function () {
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

function replaceValuesInFile(filePath, valueToFind, replaceWith){
	var fileContent = fs.readFileSync(filePath, 'utf8');
	var reg = new RegExp(valueToFind, "g");
	fileContent = fileContent.replace(reg, replaceWith);
	fs.writeFileSync(filePath, fileContent);
}

exports.newLocalFileStorage = function(attr, callback){

	var nameComponent = attr.options.value;
	var nameComponentLower = nameComponent.toLowerCase();
	var urlComponent = attr.options.urlValue.toLowerCase();

	var showComponentName = attr.options.showValue;

	var source = attr.options.source;
	var sourceLower = source.toLowerCase();
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
						var file = __dirname+'/../workspace/'+attr.id_application+'/views/'+sourceLower+'/show_fields.dust';

						// CREATE THE TAB IN SHOW FIELDS
						addTab(attr, file, newLi, componentContent).then(callback);
					});
				});
			});
		});
	});
}

exports.newPrint = function(attr, callback){

	var nameComponent = attr.options.value;
	var nameComponentLower = nameComponent.toLowerCase();
	var showComponentName = attr.options.showValue;
	var entityLower = attr.options.source.toLowerCase();
	var idApp = attr.id_application;

	translateHelper.writeLocales(idApp, "component", nameComponent, showComponentName, attr.googleTranslate, function(){

		var newLi = '<li><a id="'+nameComponentLower+'-click" data-toggle="tab" href="#'+nameComponentLower+'"><!--{@__ key="component.'+nameComponentLower+'.label_component" /}--></a></li>';
		var showFieldsPath = __dirname+'/../workspace/'+idApp+'/views/'+entityLower+'/show_fields.dust';

		domHelper.read(showFieldsPath).then(function($) {

			try{
				var componentContent = "";
				componentContent += "<div id='"+nameComponentLower+"' class='tab-pane fade print-tab'>";
				componentContent += "	<legend> <!--{@__ key=\"component."+nameComponentLower+".label_component\"/}--> </legend>";
				componentContent += "	<div id='"+nameComponent+"-content'>";

				$("input").each(function() {
					if($(this).attr("type") == "hidden")
						$(this).remove();
					else
						$(this).replaceWith("<br><span>" + $(this).val() + "</span>");
				});

				$("select").each(function() {
					$(this).replaceWith("<br><span>" + $(this).val() + "</span>");
				});

				$("textarea").each(function() {
					$(this).replaceWith("<br><span>"+$(this).val()+"</span>");
				});

				$("button, .btn").each(function() {
					$(this).remove();
				});

				$("form").each(function() {
					$(this).remove();
				});

				$("#tabs .tab-pane").each(function(){
					var titleTab = $("a[href='#"+$(this).attr("id")+"']").html();
					var match;

					// Find dust file inclusion with dust helper
					/*var maRegex = new RegExp(/{&gt;["'](.[^"']*)["'].*\/}/g);
					var matches = [];

					while (match = maRegex.exec($(this)[0].innerHTML)) {
						matches.push(match);
					}

					var string = $(this)[0].innerHTML;

					// Replace those inclusion with the real dust file content
					for(var i=0; i<matches.length; i++){
						//The path of the included dust file
						var dustPath = matches[i][1];
						var dustContent = fs.readFileSync(__dirname + "/../workspace/" + idApp + "/views/" + dustPath + ".dust", "utf8");

						if(i > 0){
							// String has been previously modify so the index aren't correct, we have to update them every time after the first modification
							matches[i].index = matches[i].index - matches[i-1][0].length + dustContent.length;
						}
						string = string.slice(0, matches[i].index) + dustContent + string.slice(matches[i].index + matches[i][0].length);
					}*/
					var contentToAdd = "<legend>" + titleTab + "</legend>" + $(this)[0].innerHTML + "<br>";

					// Change ID to prevent JS errors in DOM
					contentToAdd = contentToAdd.replace(/id=['"](.[^'"]*)['"]/g, "id=\"$1_print\"");
					componentContent += contentToAdd;
				});

				componentContent += "	</div>";
				componentContent += "</div>";

				addTab(attr, showFieldsPath, newLi, componentContent).then(callback);
			} catch(err){
				callback(err, null);
			}
		});
	});
}

exports.newContactForm = function(attr, callback){

	var idApp = attr.id_application;

	// Contact Form entity
	var codeName = attr.options.value;
	var showName = attr.options.showValue;
	var urlName = attr.options.urlValue.toLowerCase();

	// Contact Form Settings entity
	var codeNameSettings = attr.options.valueSettings;
    var showNameSettings = attr.options.showValueSettings;
    var urlNameSettings = attr.options.urlValueSettings;

	var workspacePath = __dirname+'/../workspace/'+idApp;
    var piecesPath = __dirname+'/../structure/pieces/component/contact_form';

    /*var toSyncFileName = workspacePath+'/models/toSync.json';
    var toSyncFile = fs.readFileSync(toSyncFileName);*/
    var toSyncObject = {};
    toSyncObject[idApp + "_" + codeNameSettings] = {};
    toSyncObject[idApp + "_" + codeNameSettings].queries = [];

    var mailConfigPath = workspacePath + "/config/mail";
    delete require.cache[require.resolve(mailConfigPath)];
    var mailConfig = require(mailConfigPath);

    var insertSettings = "INSERT INTO `"+idApp + "_" + codeNameSettings+"`(`version`, `f_transport_host`, `f_port`, `f_secure`, `f_user`, `f_pass`, `f_form_recipient`, `createdAt`, `updatedAt`)"+
    	" VALUES(1,'"+mailConfig.transport.host+"',"+
			"'"+mailConfig.transport.port+"',"+
			mailConfig.transport.secure+","+
			"'"+mailConfig.transport.auth.user+"',"+
			"'"+mailConfig.transport.auth.pass+"',"+
			"'"+mailConfig.administrateur+"',"+
			"'"+moment().format("YYYY-MM-DD HH:mm:ss")+"',"+
			"'"+moment().format("YYYY-MM-DD HH:mm:ss")+"');";

    toSyncObject[idApp + "_" + codeNameSettings].queries.push(insertSettings);

    fs.writeFileSync(workspacePath+'/models/toSync.json', JSON.stringify(toSyncObject, null, 4));

    // Contact Form View
    fs.copySync(piecesPath+'/views/', workspacePath+'/views/'+codeName+'/');
    fs.unlinkSync(workspacePath+'/views/'+codeName+'/update.dust');
    fs.unlinkSync(workspacePath+'/views/'+codeName+'/update_fields.dust');

    // Contact Form Route
    // Unlink generated route to replace with our custom route file
    fs.unlinkSync(workspacePath+'/routes/'+codeName+'.js');
    fs.copySync(piecesPath+'/routes/route_contact_form.js', workspacePath+'/routes/'+codeName+'.js');

    replaceValuesInFile(workspacePath+'/routes/'+codeName+'.js', "URL_VALUE_CONTACT", urlName);
    replaceValuesInFile(workspacePath+'/routes/'+codeName+'.js', "URL_VALUE_SETTINGS", urlNameSettings);
    replaceValuesInFile(workspacePath+'/routes/'+codeName+'.js', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspacePath+'/routes/'+codeName+'.js', "CODE_VALUE_SETTINGS", codeNameSettings);
    replaceValuesInFile(workspacePath+'/routes/'+codeName+'.js', "MODEL_VALUE_CONTACT", codeName.charAt(0).toUpperCase() + codeName.toLowerCase().slice(1));
    replaceValuesInFile(workspacePath+'/routes/'+codeName+'.js', "MODEL_VALUE_SETTINGS", codeNameSettings.charAt(0).toUpperCase() + codeNameSettings.toLowerCase().slice(1));

    replaceValuesInFile(workspacePath+'/views/'+codeName+'/create.dust', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspacePath+'/views/'+codeName+'/create.dust', "URL_VALUE_CONTACT", urlName);
    replaceValuesInFile(workspacePath+'/views/'+codeName+'/create.dust', "CODE_VALUE_MODULE", attr.options.moduleName);

    replaceValuesInFile(workspacePath+'/views/'+codeName+'/create_fields.dust', "CODE_VALUE_CONTACT", codeName);

    replaceValuesInFile(workspacePath+'/views/'+codeName+'/show_fields.dust', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspacePath+'/views/'+codeName+'/show_fields.dust', "URL_VALUE_CONTACT", urlName);

    replaceValuesInFile(workspacePath+'/views/'+codeName+'/list.dust', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspacePath+'/views/'+codeName+'/list.dust', "URL_VALUE_CONTACT", urlName);
    replaceValuesInFile(workspacePath+'/views/'+codeName+'/list.dust', "CODE_VALUE_MODULE", attr.options.moduleName);

    replaceValuesInFile(workspacePath+'/views/'+codeName+'/list_fields.dust', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspacePath+'/views/'+codeName+'/list_fields.dust', "URL_VALUE_CONTACT", urlName);

    replaceValuesInFile(workspacePath+'/views/'+codeName+'/settings.dust', "CODE_VALUE_CONTACT", codeName);
    replaceValuesInFile(workspacePath+'/views/'+codeName+'/settings.dust', "URL_VALUE_CONTACT", urlName);
    replaceValuesInFile(workspacePath+'/views/'+codeName+'/settings.dust', "CODE_VALUE_MODULE", attr.options.moduleName);

    replaceValuesInFile(workspacePath+'/views/'+codeName+'/settings_fields.dust', "CODE_VALUE_SETTINGS", codeNameSettings);

    // Delete Contact Form Settings Route and Views
    fs.unlinkSync(workspacePath+'/routes/'+codeNameSettings+'.js');
    helpers.rmdirSyncRecursive(workspacePath+'/views/'+codeNameSettings+'/');

    // Locales FR
    translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "f_name"], "Nom");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "f_sender"], "Expediteur");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "f_recipient"], "Destinataire");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "r_user"], "Utilisateur");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "f_title"], "Titre");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "f_content"], "Contenu");

	translateHelper.updateLocales(idApp, "en-EN", ["entity", codeName, "sendMail"], "Send a mail");
	translateHelper.updateLocales(idApp, "en-EN", ["entity", codeName, "inbox"], "Send box");
	translateHelper.updateLocales(idApp, "en-EN", ["entity", codeName, "settings"], "Settings");
	translateHelper.updateLocales(idApp, "en-EN", ["entity", codeName, "successSendMail"], "The email has been sent!");

	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "sendMail"], "Envoyer un mail");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "inbox"], "Boîte d'envoi");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "settings"], "Paramètres");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "successSendMail"], "Le mail a bien été envoyé !");

	translateHelper.updateLocales(idApp, "en-EN", ["entity", codeNameSettings, "label_entity"], "Settings");
	translateHelper.updateLocales(idApp, "en-EN", ["entity", codeNameSettings, "name_entity"], "Settings");
	translateHelper.updateLocales(idApp, "en-EN", ["entity", codeNameSettings, "plural_entity"], "Settings");

	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "label_entity"], "Paramètres");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "name_entity"], "Paramètres");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "plural_entity"], "Paramètres");

	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_transport_host"], "Hôte");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_port"], "Port");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_secure"], "Sécurisé");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_user"], "Utilisateur");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_pass"], "Mot de passe");
	translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeNameSettings, "f_form_recipient"], "Destinataire du formulaire");

	// If default name
	if(codeName == "e_contact_form")
		translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "label_entity"], "Formulaire de contact");
		translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "name_entity"], "Formulaire de contact");
		translateHelper.updateLocales(idApp, "fr-FR", ["entity", codeName, "plural_entity"], "Formulaires de contact");

    var layoutFileName = __dirname+'/../workspace/'+idApp+'/views/layout_'+attr.options.moduleName.toLowerCase()+'.dust';
	domHelper.read(layoutFileName).then(function($) {

		$("#"+urlName+"_menu_item").remove();
		$("#"+urlNameSettings+"_menu_item").remove();

		var li = '';
		li += "<!--{@entityAccess entity=\""+urlName+"\"}-->";
    	li += "		<li id=\""+urlName+"_menu_item\" style=\"display:block;\" class=\"treeview\">";
		li += "			<a href=\"#\">";
        li += "    			<i class=\"fa fa-envelope\"></i>";
        li += "    			<span><!--{@__ key=\"entity."+codeName+".label_entity\" /}--></span>";
        li += "    			<i class=\"fa fa-angle-left pull-right\"></i>";
        li += "			</a>";
        li += "			<ul class=\"treeview-menu\">";
        li += "    			<!--{@actionAccess entity=\""+urlName+"\" action=\"write\"}-->";
        li += "    			<li>";
        li += "        			<a href=\"/"+urlName+"/create_form\">";
        li += "            			<i class=\"fa fa-paper-plane\"></i>";
        li += "            			<!--{@__ key=\"entity."+codeName+".sendMail\" /}-->";
        li += "        			</a>";
        li += "    			</li>";
        li += "    			<!--{/actionAccess}-->";
        li += "    			<!--{@actionAccess entity=\""+urlName+"\" action=\"read\"}-->";
        li += "    			<li>";
        li += "        			<a href=\"/"+urlName+"/list\">";
        li += "            			<i class=\"fa fa-inbox\"></i>";
        li += "            			<!--{@__ key=\"entity."+codeName+".inbox\" /}-->";
        li += "        			</a>";
        li += "    			</li>";
        li += "    			<!--{/actionAccess}-->";
        li += "    			<!--{@actionAccess entity=\""+urlNameSettings+"\" action=\"write\"}-->";
        li += "    			<li>";
        li += "        			<a href=\"/"+urlName+"/settings\">";
        li += "            			<i class=\"fa fa-cog\"></i>";
        li += "            			<!--{@__ key=\"entity."+codeName+".settings\" /}-->";
        li += "        			</a>";
        li += "    			</li>";
        li += "    			<!--{/actionAccess}-->";
        li += "			</ul>";
        li += "		</li>\n";
        li += "<!--{/entityAccess}-->"

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

					// FR translation of the component
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "label_entity"], "Événement "+showComponentName);
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "name_entity"], "Événement "+showComponentName);
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "plural_entity"], "Événement "+showComponentName);
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "f_title"], "Titre");
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "f_place"], "Lieu");
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "f_start_date"], "Date de début");
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "f_end_date"], "Date de fin");
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "f_all_day"], "Toute la journée");
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueEvent, "r_category"], "Catégorie");

					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueCategory, "label_entity"], "Catégorie "+showComponentName);
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueCategory, "name_entity"], "Catégorie "+showComponentName);
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueCategory, "plural_entity"], "Catégorie "+showComponentName);
					translateHelper.updateLocales(idApplication, "fr-FR", ["entity", valueCategory, "f_color"], "Couleur");

					var layoutFileName = __dirname+'/../workspace/'+idApplication+'/views/layout_'+attr.options.moduleName.toLowerCase()+'.dust';
					domHelper.read(layoutFileName).then(function($) {

						$("#"+urlEvent+"_menu_item").remove();
						$("#"+urlCategory+"_menu_item").remove();

						var li = '';
						li += "<li id='"+urlComponent+"_menu_item' class='treeview'>\n";
						li += "    <a href='#'>\n";
						li += "        <i class='fa fa-calendar-o'></i> <span><!--{@__ key=\"component."+valueComponentLower+".label_component\" /}--></span>\n";
						li += "        <span class='pull-right-container'>\n";
						li += "            <i class='fa fa-angle-left pull-right'></i>\n";
						li += "        </span>\n";
						li += "    </a>\n";
						li += "    <ul class='treeview-menu'>\n";
						li += "        <li><a href='/"+urlComponent+"'><i class='fa fa-calendar'></i> <!--{@__ key=\"global_component.agenda.menu\" /}--></a></li>\n";
						li += "        <li id='"+urlEvent+"_menu_item' class='treeview'>\n";
						li += "            <a href='#'><i class='fa fa-calendar-plus-o'></i> <!--{@__ key=\"entity."+valueEvent+".label_entity\" /}-->\n";
						li += "                <span class='pull-right-container'>\n";
						li += "                    <i class='fa fa-angle-left pull-right'></i>\n";
						li += "                </span>\n";
						li += "            </a>\n";
						li += "            <ul class='treeview-menu'>\n";
						li += "                <li><a href='/"+urlEvent+"/create_form'><i class='fa fa-plus'></i><!--{@__ key=\"operation.create\" /}--> <!--{@__ key=\"entity."+valueEvent+".label_entity\" /}--></a></li>\n";
						li += "                <li><a href='/"+urlEvent+"/list'><i class='fa fa-list'></i><!--{@__ key=\"operation.list\" /}--> <!--{@__ key=\"entity."+valueEvent+".plural_entity\" /}--></a></li>\n";
						li += "            </ul>\n";
						li += "        </li>\n";
						li += "        <li id='"+urlCategory+"_menu_item' class='treeview'>\n";
						li += "            <a href='#'><i class='fa fa-bookmark'></i> <!--{@__ key=\"entity."+valueCategory+".label_entity\" /}-->\n";
						li += "                <span class='pull-right-container'>\n";
						li += "                    <i class='fa fa-angle-left pull-right'></i>\n";
						li += "                </span>\n";
						li += "            </a>\n";
						li += "            <ul class='treeview-menu'>\n";
						li += "                <li><a href='/"+urlCategory+"/create_form'><i class='fa fa-plus'></i><!--{@__ key=\"operation.create\" /}--> <!--{@__ key=\"entity."+valueCategory+".label_entity\" /}--></a></li>\n";
						li += "                <li><a href='/"+urlCategory+"/list'><i class='fa fa-list'></i><!--{@__ key=\"operation.list\" /}--> <!--{@__ key=\"entity."+valueCategory+".plural_entity\" /}--></a></li>\n";
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

exports.newCra = function(attr, callback){
	try {
        var workspacePath = __dirname+'/../workspace/'+attr.id_application;
        var piecesPath = __dirname+'/../structure/pieces/component/cra';

        // Clean toSync file, add custom fields
        var toSync = {};
        fs.writeFileSync(workspacePath+'/models/toSync.json', JSON.stringify(toSync, null, 4));

        // Copy pieces
        fs.copySync(piecesPath+'/routes/e_cra.js', workspacePath+'/routes/e_cra.js');
        fs.copySync(piecesPath+'/routes/e_cra_team.js', workspacePath+'/routes/e_cra_team.js');
        fs.copySync(piecesPath+'/views/e_cra/', workspacePath+'/views/e_cra/');
        fs.copySync(piecesPath+'/views/e_cra_team/', workspacePath+'/views/e_cra_team/');
        fs.copySync(piecesPath+'/js/', workspacePath+'/public/js/Newmips/component/');

		// Create belongsToMany relation between team and activity for default activities
		var teamOptionsPath = workspacePath + '/models/options/e_cra_team.json';
	    var teamOptionObj = require(teamOptionsPath);
	    teamOptionObj.push({
	    	"target": "e_cra_activity",
	        "relation": "belongsToMany",
	        "through": attr.id_application+"_cra_activity_team",
	        "as": "r_default_cra_activity",
	        "foreignKey": "team_id",
	        "otherKey": "activity_id"
	    });
	    fs.writeFileSync(teamOptionsPath, JSON.stringify(teamOptionObj, null, 4));

        // Get select of module before copying pieces
        domHelper.read(workspacePath+'/views/layout_m_cra.dust').then(function($workS) {
        	var select = $workS("#dynamic_select").html();
	        fs.copySync(piecesPath+'/views/layout_m_cra.dust', workspacePath+'/views/layout_m_cra.dust');
	        domHelper.read(workspacePath+'/views/layout_m_cra.dust').then(function($newWorkS) {
	        	// Insert select of module to copied pieces
	        	$newWorkS("#dynamic_select").html(select);

	        	domHelper.write(workspacePath+'/views/layout_m_cra.dust', $newWorkS).then(function() {
			        // Replace locales
			        // fr-FR
			        var workspaceFrLocales = require(workspacePath+'/locales/fr-FR.json');
			        var frLocales = require(piecesPath+'/locales/fr-FR.json');
			        for (var entity in frLocales)
			            workspaceFrLocales.entity[entity] = frLocales[entity];
			        fs.writeFileSync(workspacePath+'/locales/fr-FR.json', JSON.stringify(workspaceFrLocales, null, 4));

			        // en-EN
			        var workspaceEnLocales = require(workspacePath+'/locales/en-EN.json');
			        var enLocales = require(piecesPath+'/locales/en-EN.json');
			        for (var entity in enLocales)
			            workspaceEnLocales.entity[entity] = enLocales[entity];
			        fs.writeFileSync(workspacePath+'/locales/en-EN.json', JSON.stringify(workspaceEnLocales, null, 4));

			        // Update user translations
			        translateHelper.updateLocales(attr.id_application, "fr-FR", ["entity", "e_user", "as_r_users"], "Utilisateurs");
			        translateHelper.updateLocales(attr.id_application, "fr-FR", ["entity", "e_user", "as_r_user"], "Utilisateur");

			        // Update module name
			        translateHelper.updateLocales(attr.id_application, "fr-FR", ["module", "m_cra"], "C.R.A");
			        translateHelper.updateLocales(attr.id_application, "en-EN", ["module", "m_cra"], "A.R");

			        // Remove unwanted tab from user
			        domHelper.read(workspacePath+'/views/e_user/show_fields.dust').then(function($) {
			            $("#r_cra-click").parents('li').remove();
			            $("#r_cra").remove();
			            domHelper.write(workspacePath+'/views/e_user/show_fields.dust', $).then(function(){
			                // Check activity activate field in create field
			                domHelper.read(workspacePath+'/views/e_cra_activity/create_fields.dust').then(function($) {
			                    $("input[name='f_active']").attr("checked", "checked");
			                    domHelper.write(workspacePath+'/views/e_cra_activity/create_fields.dust', $).then(function(){
			                        callback(null, {message: 'Module C.R.A created'});
			                    });
			                });
			            });
			        });
	        	});
	        });
        });
    } catch(err) {
        callback(err);
    }
}