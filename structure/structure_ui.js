const fs = require("fs-extra");
const domHelper = require('../utils/jsDomHelper');

exports.setColumnVisibility = async (data) => {
	let pathToViews = __dirname + '/../workspace/' + data.application.name + '/views/' + data.entity.name;

	let possibilityShow = ["show", "visible"];
	let possibilityHide = ["hide", "hidden", "non visible", "caché"];

	let attributes = data.options.word.toLowerCase();
	let hide;

	if (possibilityHide.indexOf(attributes) != -1)
		hide = true;
	else if (possibilityShow.indexOf(attributes) != -1)
		hide = false;
	else
		throw new Error('structure.field.attributes.notUnderstand');

	let $ = await domHelper.read(pathToViews + '/list_fields.dust');

	if(data.options.value == "f_id")
		data.options.value = "id";

	if($("*[data-field='" + data.options.value + "']").length > 0){
		$("*[data-field='" + data.options.value + "']").attr("data-hidden", hide ? '1' : '0');
		await domHelper.write(pathToViews + '/list_fields.dust', $);
		return {
			message: hide ? "structure.ui.columnVisibility.hide" : "structure.ui.columnVisibility.show",
			messageParams: [data.options.showValue]
		};
	} else {

		// Check if it's a related to field
		let fieldCodeName = "r_" + data.options.value.substring(2);

		if($("*[data-field='" + fieldCodeName + "']").length > 0){
			//$("*[data-field='" + fieldCodeName + "']")[hide ? 'hide' : 'show']();
			$("*[data-field='" + fieldCodeName + "']").attr("data-hidden", hide ? '1' : '0');
			await domHelper.write(pathToViews + '/list_fields.dust', $);
			return {
				message: hide ? "structure.ui.columnVisibility.hide" : "structure.ui.columnVisibility.show",
				messageParams: [data.options.showValue]
			}
		}
		else {
			// No column found
			let err = new Error('structure.ui.columnVisibility.noColumn');
			err.messageParams = [data.options.showValue]
			throw err;
		}
	}
}

exports.setLogo = async (data) => {
	let workspacePath = __dirname + '/../workspace/' + data.application.name;
	let mainLayoutPath = workspacePath + '/views/main_layout.dust';

	// Check if logo exist
	if (!fs.existsSync(workspacePath + '/public/img/logo/' + data.options.value))
		throw new Error('preview.logo.notExist');

	// Login Layout
	let loginPath = workspacePath + '/views/login/';
	let loginFiles = ["login.dust", "first_connection.dust", "reset_password.dust"];

	for (let i = 0; i < loginFiles.length; i++) {
		let $ = await domHelper.read(loginPath + loginFiles[i]);

		if ($("form .body center img").length > 0)
			$("form .body center img").remove();

		$("form .body center").prepend("<img src='/img/logo/" + data.options.value + "' alt='Login logo' width=\"50%\" height=\"50%\">");
		await domHelper.write(loginPath + loginFiles[i], $);
	}

	// Main Layout
	let $ = await domHelper.read(mainLayoutPath);

	if ($(".main-sidebar .sidebar .user-panel .image img").length > 0)
		$(".main-sidebar .sidebar .user-panel .image img").remove();

	$("body link[rel='icon']").remove();
	$("head link[rel='icon']").remove();
	$(".main-sidebar .sidebar .user-panel .image").prepend("<a href='/'><img src='/img/logo/" + data.options.value + "' alt='Logo' ></a>");
	$("head").append("<link href='/img/logo/thumbnail/" + data.options.value + "' rel=\"icon\" >");

	await domHelper.writeMainLayout(mainLayoutPath, $);
	return true;
}

exports.removeLogo = async (data) => {

	let workspacePath = __dirname + '/../workspace/' + data.application.name;
	let mainLayoutPath = workspacePath + '/views/main_layout.dust';
	let message;

	// Login Layout
	let loginPath = workspacePath + '/views/login/';
	let loginFiles = ["login.dust", "first_connection.dust", "reset_password.dust"];
	for (let i = 0; i < loginFiles.length; i++) {
		let $ = await domHelper.read(loginPath + loginFiles[i]);
		if ($("form .body center img").length > 0)
			$("form .body center img").remove();
		$("form .body center").prepend("<img src='/img/logo_newmips.png' alt='Login logo' width='50%' height='50%'>");
		await domHelper.write(loginPath + loginFiles[i], $);
	}

	// Main Layout
	let $ = await domHelper.read(mainLayoutPath);

	if($(".main-sidebar .sidebar .user-panel .image img").length > 0){
		$(".main-sidebar .sidebar .user-panel .image img").remove();
		$("body link[rel='icon']").remove();
		$("head link[rel='icon']").remove();
		$("head").append("<link href='/FAVICON-COULEUR-01.png' rel='icon' type='image/png'> ");
		message = "preview.logo.remove";
	}
	else
		message = "preview.logo.noLogo";

	await domHelper.writeMainLayout(mainLayoutPath, $);
	return message;
}

exports.setLayout = async (data) => {

	let workspacePath = __dirname + '/../workspace/' + data.application.name;
	let layoutPath = workspacePath + '/public/css/AdminLteV2/layouts';
	let askedLayout = data.options.value.toLowerCase().trim().replace(/ /g, "-");

	let layoutsDir = fs.readdirSync(layoutPath).filter(file => {
		return (file.indexOf('.') !== 0) && (file.slice(-4) === '.css' && (file.slice(0, 1) !== '_'));
	});

	let layoutListAvailable = [];

	layoutsDir.forEach(file => {
		layoutListAvailable.push(file.slice(7, -4));
	});

	if (layoutListAvailable.indexOf(askedLayout) != -1) {

		let moduleLayout = workspacePath + '/views/layout_' + data.np_module.name + '.dust';

		let $ = await domHelper.read(moduleLayout)
		let oldLayout = $("link[data-type='layout']").data("data-layout");
		$("link[data-type='layout']").replaceWith("<link href='/css/AdminLteV2/layouts/layout-" + askedLayout + ".css' rel='stylesheet' type='text/css' data-type='layout' data-layout='" + askedLayout + "'>\n");

		await domHelper.write(moduleLayout, $)

		return {
			message: "structure.ui.layout.success",
			messageParams: [data.options.value, data.np_module.displayName],
			restartServer: false
		}
	} else {
		let err = new Error('structure.ui.layout.cannotFind');
		let msgParams = "";
		for (let i = 0; i < layoutListAvailable.length; i++)
			msgParams += "-  " + layoutListAvailable[i] + "<br>";
		err.messageParams = [msgParams];
		throw err;
	}
}

exports.listLayout = async (data) => {

	let workspacePath = __dirname + '/../workspace/' + data.application.name;

	let layoutPath = workspacePath + '/public/css/AdminLteV2/layouts';
	let layoutsDir = fs.readdirSync(layoutPath).filter(file => {
		return (file.indexOf('.') !== 0) && (file.slice(-4) === '.css' && (file.slice(0, 1) !== '_'));
	});

	let layoutListAvailable = [];

	layoutsDir.forEach(file => {
		layoutListAvailable.push(file.slice(7, -4));
	});

	let msgParams = "";
	for (let i = 0; i < layoutListAvailable.length; i++)
		msgParams += "-  " + layoutListAvailable[i] + "<br>";

	return {
		message: "structure.ui.layout.list",
		messageParams: [msgParams],
		restartServer: false
	}
}

exports.setTheme = async (data) => {

	let workspacePath = __dirname + '/../workspace/' + data.application.name;

	let askedTheme = data.options.value.toLowerCase();
	askedTheme = askedTheme.trim().replace(/ /g, "-");

	function retrieveTheme(themePath) {
		let themesDir = fs.readdirSync(themePath).filter(folder => {
			return (folder.indexOf('.') == -1);
		});

		let themeListAvailable = [];

		themesDir.forEach(theme => {
			themeListAvailable.push(theme);
		});

		return themeListAvailable;
	}

	let themeWorkspacePath = workspacePath + '/public/themes';
	let themeListAvailableWorkspace = retrieveTheme(themeWorkspacePath);

	// If not found in workspace, look for not imported theme exisiting in structure/template
	if (themeListAvailableWorkspace.indexOf(askedTheme) == -1) {
		let themeTemplatePath = __dirname + '/../structure/template/public/themes';
		let themeListAvailableTemplate = retrieveTheme(themeTemplatePath);

		if (themeListAvailableTemplate.indexOf(askedTheme) == -1) {
			let err = new Error('structure.ui.theme.cannotFind');
			let msgParams = "";
			for (let i = 0; i < themeListAvailableWorkspace.length; i++)
				msgParams += "-  " + themeListAvailableWorkspace[i] + "<br>";
			err.messageParams = [msgParams];
			throw err;
		}

		fs.copySync(themeTemplatePath + "/" + askedTheme + "/", themeWorkspacePath + "/" + askedTheme + "/");
	}

	let themeInformation = JSON.parse(fs.readFileSync(workspacePath + "/public/themes/" + askedTheme + "/infos.json"));
	let promises = [];
	let layoutToWrite = ["main_layout", "login_layout"];

	for (let i = 0; i < layoutToWrite.length; i++) {
		promises.push((async() => {
			let layoutPath = workspacePath + '/views/' + layoutToWrite[i] + '.dust';
			let $ = await domHelper.read(layoutPath);
			let oldTheme = $("link[data-type='theme']").attr("data-theme");
			$("link[data-type='theme']").replaceWith("<link href='/themes/" + askedTheme + "/css/style.css' rel='stylesheet' type='text/css' data-type='theme' data-theme='" + askedTheme + "'>");

			if (typeof themeInformation.js !== "undefined") {
				// If the theme need js inclusion
				for (let j = 0; j < themeInformation.js.length; j++) {
					$("body script:last").after("<script type='text/javascript'></script>");
					$("body script:last").attr('src', "/themes/" + askedTheme + "/js/" + themeInformation.js[j]);
				}
			}

			await domHelper.writeMainLayout(layoutPath, $);
			return;
		})());
	}

	await Promise.all(promises);
	return;
}

exports.listTheme = async (data) => {

	let workspacePath = __dirname + '/../workspace/' + data.application.name;
	let themePath = workspacePath + '/public/themes';

	let themesDir = fs.readdirSync(themePath).filter(folder => {
		return (folder.indexOf('.') == -1);
	});

	let themeListAvailable = [];
	themesDir.forEach(theme => {
		themeListAvailable.push(theme);
	});

	let msgParams = "";
	for (let i = 0; i < themeListAvailable.length; i++)
		msgParams += "-  " + themeListAvailable[i] + "<br>";

	return {
		message: "structure.ui.theme.list",
		messageParams: [msgParams],
		restartServer: false
	};
}

exports.setIcon = async(data) => {
	let workspacePath = __dirname + '/../workspace/' + data.application.name;
	let layout_filename = 'layout_' + data.module_name + '.dust';
	let entityWithouPrefix = data.entity_name.substring(2);

	let iconClass = data.iconValue.split(' ').join('-');
	let $ = await domHelper.read(workspacePath + '/views/' + layout_filename)

	let elementI = $("#" + entityWithouPrefix + '_menu_item').find('a:first').find('i:first');
	elementI.removeClass();
	elementI.addClass('fa fa-' + iconClass);

	await domHelper.write(workspacePath + '/views/' + layout_filename, $)

	$ = await domHelper.read(workspacePath + '/views/default/' + data.module_name + '.dust');
	$('i.' + entityWithouPrefix + '-icon').removeClass().addClass('fa fa-' + iconClass + ' ' + entityWithouPrefix + '-icon');
	await domHelper.write(workspacePath + '/views/default/' + data.module_name + '.dust', $);
	return;
}

exports.addTitle = async (data) => {

	let pathToViews = __dirname + '/../workspace/' + data.application.name + '/views/' + data.entity_name;
	let viewsToProcess = ["create_fields", "update_fields", "show_fields"];
	let processPromises = [];

	let title = "\
	<div class='col-xs-12 text-center'>\n\
		<div class='form-group form-title'>\n\
			<h3>" + data.options.value + "</h3>\n\
		</div>\n\
	</div>\n";

	for (let i = 0; i < viewsToProcess.length; i++) {
		processPromises.push((async() => {
			let currentView = viewsToProcess[i];
			let $ = await domHelper.read(pathToViews + '/' + currentView + '.dust');
			if (data.options.afterField) {
				$("div[data-field=" + data.fieldCodeName + "]").after(title);
			} else {
				$("#fields").append(title);
			}
			await domHelper.write(pathToViews + '/' + currentView + '.dust', $);
		})());
	}

	await Promise.all(processPromises);
	return true;
}

exports.createWidget = async (data) => {
	let workspacePath = __dirname + '/../workspace/' + data.application.name;
	let piecesPath = __dirname + '/pieces/';
	let layout_filename = 'layout_' + data.np_module.name + '.dust';

	// Get entity's icon
	let $ = await domHelper.read(workspacePath + '/views/' + layout_filename);

	let entityIconClass = $("#" + data.entity.name.substring(2) + '_menu_item').find('a:first').find('i:first').attr('class');
	let layout_view_filename = workspacePath + '/views/default/' + data.np_module.name + '.dust';

	// Add widget to module's layout
	$ = await domHelper.read(layout_view_filename);
	$2 = await domHelper.read(piecesPath + '/views/widget/' + data.widgetType + '.dust');
	let widgetElemId = data.widgetType + '_' + data.entity.name + '_widget';

	// Create widget's html
	let newHtml = "";
	newHtml += '<!--{#entityAccess entity="' + data.entity.name.substring(2) + '" }-->';
	newHtml += "<div id='" + widgetElemId + "' data-entity='" + data.entity.name + "' data-widget-type='" + data.widgetType + "' class='ajax-widget col-sm-3 col-xs-12'>\n";
	newHtml += $2("body")[0].innerHTML + "\n";
	newHtml += "</div>";
	newHtml += '<!--{/entityAccess}-->';
	newHtml = newHtml.replace(/ENTITY_NAME/g, data.entity.name);
	newHtml = newHtml.replace(/ENTITY_URL_NAME/g, data.entity.name.substring(2));
	$("#widgets").append(newHtml);

	// Set entity's icon class to widget
	$('i.' + data.entity.name.substring(2) + '-icon').removeClass().addClass(entityIconClass + ' ' + data.entity.name.substring(2) + '-icon');

	return await domHelper.write(layout_view_filename, $);
}

exports.createWidgetPiechart = async (data) => {
	let workspacePath = __dirname + '/../workspace/' + data.application.name;
	let piecesPath = __dirname + '/pieces/';

	if (!data.field) {
		let definitlyNotFound = true;
		let options = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.entity.name + '.json', 'utf8'));
		for (let j = 0; j < options.length; j++)
			if (data.givenField.toLowerCase() == options[j].showAs.toLowerCase()) {
				data.field = {
					name: options[j].as,
					displayName: options[j].showAs,
					type: options[j].newmipsType
				};
				definitlyNotFound = false;
				break;
			}

		if (definitlyNotFound){
			let err = new Error('structure.ui.widget.unknown_fields');
			err.messageParams = [data.field];
			throw err;
		}
	}

	// Add widget to module's layout
	let layoutFile = workspacePath + '/views/default/' + data.np_module.name + '.dust';
	let $ = await domHelper.read(layoutFile);
	let $2 = await domHelper.read(piecesPath + '/views/widget/' + data.widgetType + '.dust');

	let widgetElemId = data.widgetType + '_' + data.entity.name + '_' + data.field.name + '_widget';
	// Widget box title traduction
	$2(".box-title").html(`<!--{#__ key="defaults.widgets.piechart.distribution" /}-->&nbsp;<!--{#__ key="entity.${data.entity.name}.label_entity" /}-->&nbsp;-&nbsp;<!--{#__ key="entity.${data.entity.name}.${data.field.name}" /}-->`);
	// Create widget's html
	let newHtml = "";
	newHtml += '<!--{#entityAccess entity="' + data.entity.name.substring(2) + '" }-->';
	newHtml += "<div id='" + widgetElemId + "' data-entity='" + data.entity.name + "' data-field-type='" + data.field.type + "' data-field='" + data.field.name + "' data-legend='" + data.legend + "' data-widget-type='" + data.widgetType + "' class='ajax-widget col-sm-4 col-xs-12'>\n";
	newHtml += $2("body")[0].innerHTML + "\n";
	newHtml += "</div>";
	newHtml += '<!--{/entityAccess}-->';
	$("#widgets").append(newHtml);
	await domHelper.write(layoutFile, $);
	return;
}

exports.createWidgetLastRecords = async (data) => {

	let workspacePath = __dirname + '/../workspace/' + data.application.name;
	let piecesPath = __dirname + '/pieces/';

	// Look for related to fields in entity's options
	let definitlyNotFound = [];
	let options = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.entity.name + '.json', 'utf8'));

	for (let i = 0; i < data.columns.length; i++) {
		if (data.columns[i].found == true)
			continue;
		for (let j = 0; j < options.length; j++)
			if (data.columns[i].name.toLowerCase() == options[j].showAs.toLowerCase()) {
				data.columns[i] = {
					name: options[j].showAs,
					codeName: options[j].as,
					found: true
				};
				break;
			}
		if (!data.columns[i].found)
			definitlyNotFound.push(data.columns[i].name);
	}
	if (definitlyNotFound.length > 0){
		let err = new Error('structure.ui.widget.unknown_fields');
		err.messageParams = [definitlyNotFound.join(', ')];
		throw err;
	}

	if (!data.columns || data.columns.length == 0)
		throw new Error('structure.ui.widget.no_fields');

	let layoutFile = workspacePath + '/views/default/' + data.np_module.name + '.dust';
	let $ = await domHelper.read(layoutFile);
	let $template = await domHelper.read(piecesPath + '/views/widget/' + data.widgetType + '.dust');

	let widgetElemId = data.widgetType + '_' + data.entity.name + '_widget';
	let newHtml = "";
	newHtml += '<!--{#entityAccess entity="' + data.entity.name.substring(2) + '" }-->';
	newHtml += "<div id='" + widgetElemId + "' data-entity='" + data.entity.name + "' data-widget-type='" + data.widgetType + "' class='col-xs-12 col-sm-" + (data.columns.length > 4 ? '12' : '6') + "'>\n";
	newHtml += $template("body")[0].innerHTML + "\n";
	newHtml += "</div>";
	newHtml += '<!--{/entityAccess}-->';
	newHtml = newHtml.replace(/ENTITY_NAME/g, data.entity.name);
	newHtml = newHtml.replace(/ENTITY_URL_NAME/g, data.entity.name.substring(2));
	$("#widgets").append(newHtml);

	let $list = await domHelper.read(workspacePath + '/views/' + data.entity.name + '/list_fields.dust');

	let thead = '<thead><tr>';
	for (let i = 0; i < data.columns.length; i++) {
		let field = data.columns[i].name.toLowerCase();
		let type = $list('th[data-field="' + field + '"]').data('type');
		let col = $list('th[data-field="' + field + '"]').data('col');
		let fieldTradKey = field != 'id' ? field : 'id_entity';
		thead += '<th data-field="' + field + '" data-type="' + type + '" data-col="' + col + '"><!--{#__ key="entity.' + data.entity.name + '.' + fieldTradKey + '" /}--></th>';
	}
	thead += '</tr></thead>';

	$("#" + data.entity.name.substring(2) + '_lastrecords').html(thead);
	$("#" + data.entity.name.substring(2) + '_lastrecords').attr('data-limit', data.limit);
	await domHelper.write(layoutFile, $);
	return;
}

exports.deleteWidget = async (data) => {
	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	// Delete from view
	let $ = await domHelper.read(workspacePath + '/views/default/' + data.np_module.name + '.dust');
	let widgetElements = [];

	// For each widgetType, find corresponding divs using a regex on data id
	for (const widgetType of data.widgetTypes) {
		widgetElements = $("#widgets > div[data-widget-type=" + widgetType + "]").filter(_ => {
			// We don't know piechart's field, use regex to match rest of id
			const reg = widgetType == 'piechart' ? new RegExp('piechart_' + data.entity.name + '_.*_widget') : new RegExp(widgetType + '_' + data.entity.name + '_widget');
			return this.id.match(reg);
		});

		// Delete matched widget divs
		for (const elem of widgetElements)
			$(elem).remove();
	}

	await domHelper.write(workspacePath + '/views/default/' + data.np_module.name + '.dust', $);
	return true;
}