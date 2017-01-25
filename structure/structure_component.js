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
	var showComponentNameLower = showComponentName.toLowerCase();

	var urlComponent = attr.options.urlValue.toLowerCase();

	var filename = "contact_form";

	setupComponentView(attr.id_application, nameComponent, urlComponent, filename, attr.options.moduleName, function(){
		setupComponentRoute(attr.id_application, nameComponent, "", filename, "", function(){
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
						callback();
					});
				}).catch(function(err) {
					callback(err, null);
				});
			});
		});
	});
}

exports.newAuthentication = function(attr, callback) {
    var id_application = attr.id_application;

    // Initialize variables according to options
    var options = attr.options;
    var name_module = attr.module.name;
    var url_name_module = attr.module.codeName;

    function copyAndreplaceInView(path) {
    	return new Promise(function(resolve, reject) {
		    var basePiecesPath = __dirname + '/pieces/component/authentication/views/';
		    var baseWorkspacePath = __dirname + '/../workspace/'+id_application+'/views/';
	    	var piecesFilename = basePiecesPath+path+'.dust';
	    	var workspaceFilename = baseWorkspacePath+path+'.dust';
			fs.copy(piecesFilename, workspaceFilename, function(err) {
				if (err)
					return reject(err);
		    	fs.readFile(workspaceFilename, 'utf8', function(err, filecontent) {
		    		if (err)
		    			return reject(err);
			    	filecontent = filecontent.replace(/MODULE_NAME/g, url_name_module);
		    		fs.writeFile(workspaceFilename, filecontent, 'utf8', function(err) {
		    			if (err)
		    				return reject(err);
		    			fs.copy(basePiecesPath+path+'_fields.dust', baseWorkspacePath+path+'_fields.dust', function(err) {
		    				if (err)
		    					return reject(err);
			    			console.log('Authentication component view file '+path+'.dust and '+path+'_fields.dust imported to workspace and updated');
		    				resolve();
		    			})
		    		});
		    	});
			})
    	});
    }

    function copyAndReplaceInModel(path) {
    	return new Promise(function(resolve, reject) {
		    var basePiecesPath = __dirname + '/pieces/component/authentication/models/';
		    var baseWorkspacePath = __dirname + '/../workspace/'+id_application+'/models/';
	    	var piecesFilename = basePiecesPath+path+'.js';
	    	var workspaceFilename = baseWorkspacePath+path+'.js';
	    	fs.copy(piecesFilename, workspaceFilename, function(err) {
	    		if (err)
	    			return reject(err);
		    	fs.readFile(workspaceFilename, 'utf8', function(err, filecontent) {
		    		if (err)
		    			return reject(err);
			    	filecontent = filecontent.replace(/TABLE_NAME/g, id_application+'_'+path.split('/')[0]);
		    		fs.writeFile(workspaceFilename, filecontent, 'utf8', function(err) {
		    			if (err)
		    				return reject(err);

		    			fs.copy(basePiecesPath+'/attributes/'+path+'.json', baseWorkspacePath+'/attributes/'+path+'.json', function(err) {
		    				if (err)
		    					return reject(err);
			    			fs.copy(basePiecesPath+'/options/'+path+'.json', baseWorkspacePath+'/options/'+path+'.json', function(err) {
			    				if (err)
			    					return reject(err);
				    			console.log('Authentication component model file '+path+'.js imported to workspace and updated');
				    			resolve();
				    		});
		    			});
		    		});
		    	});
	    	});
    	});
    }

    function copyRoute(path) {
    	return new Promise(function(resolve, reject) {
		    var basePiecesPath = __dirname + '/pieces/component/authentication/routes/';
		    var baseWorkspacePath = __dirname + '/../workspace/'+id_application+'/routes/';
	    	var piecesFilename = basePiecesPath+path+'.js';
	    	var workspaceFilename = baseWorkspacePath+path+'.js';
	    	fs.copy(piecesFilename, workspaceFilename, function(err) {
	    		if (err)
	    			return reject(err);
	    		console.log('Authentication component route file '+path+'.js imported to workspace');
	    		resolve();
	    	});
    	});
    }

    function updateModuleLayout(clbk) {
		var fileName = __dirname+'/../workspace/'+id_application+'/views/layout_'+url_name_module.toLowerCase()+'.dust';
		// Read file and get jQuery instance
		domHelper.read(fileName).then(function($) {
			var entities = ['e_group', 'e_user', 'e_role'];
			var li = '';
			for (var i = 0; i < entities.length; i++) {
				// Create new html
				li += "<li id='"+name_module.toLowerCase()+"_menu_item' class='ui-state-default treeview'>\n";
					li += '<a href="#">\n';
						li += '<i class="fa fa-folder"></i>\n';
						li += '<span>{@__ key="entity.'+entities[i].toLowerCase()+'.label_entity" /}</span>\n';
						li += '<i class="fa fa-angle-left pull-right"></i>\n';
					li += '</a>\n';
					li += '<ul class="treeview-menu">\n';
						li += '<li>\n';
							li += "<a href='/"+entities[i].split('_')[1].toLowerCase()+"/create_form'>\n";
								li += '<i class="fa fa-angle-double-right"></i>\n';
								li += '{@__ key="operation.create" /} {@__ key="entity.'+entities[i].toLowerCase()+'.name_entity" /}\n';
							li += '</a>';
						li += '</li>';
						li += '<li>';
							li += "<a href='/"+entities[i].split('_')[1].toLowerCase()+"/list'>\n";
								li += '<i class="fa fa-angle-double-right"></i>\n';
								li += '{@__ key="operation.list" /} {@__ key="entity.'+entities[i].toLowerCase()+'.plural_entity" /}\n';
							li += '</a>\n';
						li += '</li>\n';
					li += '</ul>\n';
				li += '</li>\n';
			}

			// Add new html to document
			$('#sortable').append(li);

			// Write back to file
			domHelper.write(fileName, $).then(function() {
				clbk();
			});
		}).catch(function(err) {
			console.error(err);
			clbk(err, null);
		});
    }

    var promises = [];

    // Operations on views
    var files = ['e_group/create', 'e_group/list', 'e_group/update', 'e_group/show', 'e_user/create', 'e_user/list', 'e_user/update', 'e_user/show', 'e_role/create', 'e_role/list', 'e_role/update', 'e_role/show']
    for (var i = 0; i < files.length; i++)
    	promises.push(copyAndreplaceInView(files[i]));

    // Operations on models and routes
    var files = ['e_group', 'e_role', 'e_user'];
    for (var i = 0; i < files.length; i++) {
    	promises.push(copyAndReplaceInModel(files[i]));
    	promises.push(copyRoute(files[i]));
    }

    Promise.all(promises).then(function() {
    	// Add entities to module's layout
    	updateModuleLayout(function(err) {
    		// Sync workspace's models to create e_group/e_role/e_user, and then insert admin user
    		var workspaceSequelize = require(__dirname+ '/../workspace/'+id_application+'/models/');
    		workspaceSequelize.sequelize.sync({ logging: console.log, hooks: false }).then(function(){
    			workspaceSequelize.E_user.create({f_login: 'adminWorkspace', f_password: '$2a$10$TclfBauyT/N0CDjCjKOG/.YSHiO0RLqWO2dOMfNKTNH3D5EaDIpr.', f_enabled: 0}).then(function() {

    				// Update authentication config
    				var authConf = require(__dirname+'/../workspace/'+id_application+'/config/authentication.json');
    				authConf.isCustom = true;
    				authConf.userModel = 'E_user';
    				fs.writeFileSync(__dirname+'/../workspace/'+id_application+'/config/authentication.json', JSON.stringify(authConf, null, 4))
	    			callback(err);
    			});
    		});
    	});
    }).catch(function(err) {
    	callback(err);
    })
}