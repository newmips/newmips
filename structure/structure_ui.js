const fs = require("fs-extra");
const domHelper = require('../utils/jsDomHelper');

exports.setColumnVisibility = async (data) => {
	const pathToViews = __dirname + '/../workspace/' + data.application.name + '/views/' + data.entity.name;

	const possibilityShow = ["show", "visible"];
	const possibilityHide = ["hide", "hidden", "non visible", "caché"];

	const attributes = data.options.word.toLowerCase();
	let hide;

	if (possibilityHide.indexOf(attributes) != -1)
		hide = true;
	else if (possibilityShow.indexOf(attributes) != -1)
		hide = false;
	else
		throw new Error('structure.field.attributes.notUnderstand');

	const $ = await domHelper.read(pathToViews + '/list_fields.dust');

	if(data.options.value == "f_id")
		data.options.value = "id";

	if($("*[data-field='" + data.options.value + "']").length > 0){
		$("*[data-field='" + data.options.value + "']").attr("data-hidden", hide ? '1' : '0');
		domHelper.write(pathToViews + '/list_fields.dust', $);
		return {
			message: hide ? "structure.ui.columnVisibility.hide" : "structure.ui.columnVisibility.show",
			messageParams: [data.options.showValue]
		};
	}

	// Check if it's a related to field
	const fieldCodeName = "r_" + data.options.value.substring(2);

	if($("*[data-field='" + fieldCodeName + "']").length > 0){
		//$("*[data-field='" + fieldCodeName + "']")[hide ? 'hide' : 'show']();
		$("*[data-field='" + fieldCodeName + "']").attr("data-hidden", hide ? '1' : '0');
		domHelper.write(pathToViews + '/list_fields.dust', $);
		return {
			message: hide ? "structure.ui.columnVisibility.hide" : "structure.ui.columnVisibility.show",
			messageParams: [data.options.showValue]
		}
	}

	// No column found
	const err = new Error('structure.ui.columnVisibility.noColumn');
	err.messageParams = [data.options.showValue]
	throw err;
}

exports.setLogo = async (data) => {
	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const mainLayoutPath = workspacePath + '/views/main_layout.dust';

	// Check if logo exist
	if (!fs.existsSync(workspacePath + '/public/img/logo/' + data.options.value))
		throw new Error('preview.logo.notExist');

	// Login Layout
	const loginPath = workspacePath + '/views/login/';
	const loginFiles = ["login.dust", "first_connection.dust", "reset_password.dust"];

	for (let i = 0; i < loginFiles.length; i++) {
		const $ = await domHelper.read(loginPath + loginFiles[i]); // eslint-disable-line

		if ($("form .body center img").length > 0)
			$("form .body center img").remove();

		$("form .body center").prepend("<img src='/img/logo/" + data.options.value + "' alt='Login logo' width=\"50%\" height=\"50%\">");
		domHelper.write(loginPath + loginFiles[i], $); // eslint-disable-line
	}

	// Main Layout
	const $ = await domHelper.read(mainLayoutPath);

	if ($(".main-sidebar .sidebar .user-panel .image img").length > 0)
		$(".main-sidebar .sidebar .user-panel .image img").remove();

	$("body link[rel='icon']").remove();
	$("head link[rel='icon']").remove();
	$(".main-sidebar .sidebar .user-panel .image").prepend("<a href='/'><img src='/img/logo/" + data.options.value + "' alt='Logo' ></a>");
	$("head").append("<link href='/img/logo/thumbnail/" + data.options.value + "' rel=\"icon\" >");

	domHelper.writeMainLayout(mainLayoutPath, $);
	return true;
}

exports.removeLogo = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const mainLayoutPath = workspacePath + '/views/main_layout.dust';
	let message;

	// Login Layout
	const loginPath = workspacePath + '/views/login/';
	const loginFiles = ["login.dust", "first_connection.dust", "reset_password.dust"];
	for (let i = 0; i < loginFiles.length; i++) {
		const $ = await domHelper.read(loginPath + loginFiles[i]); // eslint-disable-line
		if ($("form .body center img").length > 0)
			$("form .body center img").remove();
		$("form .body center").prepend("<img src='/img/logo_newmips.png' alt='Login logo' width='50%' height='50%'>");
		domHelper.write(loginPath + loginFiles[i], $); // eslint-disable-line
	}

	// Main Layout
	const $ = await domHelper.read(mainLayoutPath);

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

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const layoutPath = workspacePath + '/public/css/AdminLteV2/layouts';
	const askedLayout = data.options.value.toLowerCase().trim().replace(/ /g, "-");

	const layoutsDir = fs.readdirSync(layoutPath).filter(file => file.indexOf('.') !== 0 && (file.slice(-4) === '.css' && file.slice(0, 1) !== '_'));

	const layoutListAvailable = [];

	layoutsDir.forEach(file => {
		layoutListAvailable.push(file.slice(7, -4));
	});

	if (layoutListAvailable.indexOf(askedLayout) != -1) {

		const moduleLayout = workspacePath + '/views/layout_' + data.np_module.name + '.dust';
		const $ = await domHelper.read(moduleLayout);

		// const oldLayout = $("link[data-type='layout']").data("data-layout");
		$("link[data-type='layout']").replaceWith("<link href='/css/AdminLteV2/layouts/layout-" + askedLayout + ".css' rel='stylesheet' type='text/css' data-type='layout' data-layout='" + askedLayout + "'>\n");

		domHelper.write(moduleLayout, $)

		return {
			message: "structure.ui.layout.success",
			messageParams: [data.options.value, data.np_module.displayName],
			restartServer: false
		}
	}
	const err = new Error('structure.ui.layout.cannotFind');
	let msgParams = "";
	for (let i = 0; i < layoutListAvailable.length; i++)
		msgParams += "-  " + layoutListAvailable[i] + "<br>";
	err.messageParams = [msgParams];
	throw err;
}

exports.listLayout = (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	const layoutPath = workspacePath + '/public/css/AdminLteV2/layouts';
	const layoutsDir = fs.readdirSync(layoutPath).filter(file => file.indexOf('.') !== 0 && (file.slice(-4) === '.css' && file.slice(0, 1) !== '_'));

	const layoutListAvailable = [];

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

	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	let askedTheme = data.options.value.toLowerCase();
	askedTheme = askedTheme.trim().replace(/ /g, "-");

	function retrieveTheme(themePath) {
		const themesDir = fs.readdirSync(themePath).filter(folder => folder.indexOf('.') == -1);
		const themeListAvailable = [];
		themesDir.forEach(theme => {
			themeListAvailable.push(theme);
		});
		return themeListAvailable;
	}

	const themeWorkspacePath = workspacePath + '/public/themes';
	const themeListAvailableWorkspace = retrieveTheme(themeWorkspacePath);

	// If not found in workspace, look for not imported theme exisiting in structure/template
	if (themeListAvailableWorkspace.indexOf(askedTheme) == -1) {
		const themeTemplatePath = __dirname + '/../structure/template/public/themes';
		const themeListAvailableTemplate = retrieveTheme(themeTemplatePath);

		if (themeListAvailableTemplate.indexOf(askedTheme) == -1) {
			const err = new Error('structure.ui.theme.cannotFind');
			let msgParams = "";
			for (let i = 0; i < themeListAvailableWorkspace.length; i++)
				msgParams += "-  " + themeListAvailableWorkspace[i] + "<br>";
			err.messageParams = [msgParams];
			throw err;
		}

		fs.copySync(themeTemplatePath + "/" + askedTheme + "/", themeWorkspacePath + "/" + askedTheme + "/");
	}

	const themeInformation = JSON.parse(fs.readFileSync(workspacePath + "/public/themes/" + askedTheme + "/infos.json"));
	const promises = [];
	const layoutToWrite = ["main_layout", "login_layout"];

	for (let i = 0; i < layoutToWrite.length; i++) {
		promises.push((async() => {
			const layoutPath = workspacePath + '/views/' + layoutToWrite[i] + '.dust';
			const $ = await domHelper.read(layoutPath);
			// const oldTheme = $("link[data-type='theme']").attr("data-theme");
			$("link[data-type='theme']").replaceWith("<link href='/themes/" + askedTheme + "/css/style.css' rel='stylesheet' type='text/css' data-type='theme' data-theme='" + askedTheme + "'>");

			if (typeof themeInformation.js !== "undefined") {
				// If the theme need js inclusion
				for (let j = 0; j < themeInformation.js.length; j++) {
					$("body script:last").after("<script type='text/javascript'></script>");
					$("body script:last").attr('src', "/themes/" + askedTheme + "/js/" + themeInformation.js[j]);
				}
			}

			domHelper.writeMainLayout(layoutPath, $);
			return;
		})());
	}

	await Promise.all(promises);
	return;
}

exports.listTheme = (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const themePath = workspacePath + '/public/themes';
	const themesDir = fs.readdirSync(themePath).filter(folder => folder.indexOf('.') == -1);

	const themeListAvailable = [];
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
	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const layout_filename = 'layout_' + data.module_name + '.dust';
	const entityWithouPrefix = data.entity_name.substring(2);

	const iconClass = data.iconValue.split(' ').join('-');
	let $ = await domHelper.read(workspacePath + '/views/' + layout_filename)

	const elementI = $("#" + entityWithouPrefix + '_menu_item').find('a:first').find('i:first');
	elementI.removeClass();
	elementI.addClass('fa fa-' + iconClass);

	domHelper.write(workspacePath + '/views/' + layout_filename, $)

	$ = await domHelper.read(workspacePath + '/views/default/' + data.module_name + '.dust');
	$('i.' + entityWithouPrefix + '-icon').removeClass().addClass('fa fa-' + iconClass + ' ' + entityWithouPrefix + '-icon');
	domHelper.write(workspacePath + '/views/default/' + data.module_name + '.dust', $);
	return;
}

exports.addTitle = async (data) => {

	const pathToViews = __dirname + '/../workspace/' + data.application.name + '/views/' + data.entity_name;
	const viewsToProcess = ["create_fields", "update_fields", "show_fields"];
	const processPromises = [];

	const title = "\
	<div class='col-xs-12 text-center'>\n\
		<div class='form-group form-title'>\n\
			<h3>" + data.options.value + "</h3>\n\
		</div>\n\
	</div>\n";

	for (let i = 0; i < viewsToProcess.length; i++) {
		processPromises.push((async() => {
			const currentView = viewsToProcess[i];
			const $ = await domHelper.read(pathToViews + '/' + currentView + '.dust');
			if (data.options.afterField) {
				$("div[data-field=" + data.field.name + "]").after(title);
			} else {
				$("#fields").append(title);
			}
			domHelper.write(pathToViews + '/' + currentView + '.dust', $);
		})());
	}

	await Promise.all(processPromises);
	return true;
}

exports.removeTitle = async (data) => {
	const pathToViews = __dirname + '/../workspace/' + data.application.name + '/views/' + data.entity.name;
	const viewsToProcess = ["create_fields", "update_fields", "show_fields"];
	const processPromises = [];
	let titleFound = false;
	for (let i = 0; i < viewsToProcess.length; i++) {
		processPromises.push((async() => {
			const currentView = viewsToProcess[i];
			const $ = await domHelper.read(pathToViews + '/' + currentView + '.dust');
			$("#fields").find('.form-title').each(function() {
				if($(this).find('h3').text() == data.options.value) {
					$(this).parent().remove();
					titleFound = true;
				}
			});
			domHelper.write(pathToViews + '/' + currentView + '.dust', $);
		})());
	}

	await Promise.all(processPromises);

	if(!titleFound)
		throw new Error('structure.ui.title.not_found');

	return true;
}

exports.createWidget = async (data) => {
	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const piecesPath = __dirname + '/pieces/';
	const layout_filename = 'layout_' + data.np_module.name + '.dust';

	// Get entity's icon
	let $ = await domHelper.read(workspacePath + '/views/' + layout_filename);

	const entityIconClass = $("#" + data.entity.name.substring(2) + '_menu_item').find('a:first').find('i:first').attr('class') || 'fa fa-folder';
	const layout_view_filename = workspacePath + '/views/default/' + data.np_module.name + '.dust';

	// Add widget to module's layout
	$ = await domHelper.read(layout_view_filename);
	const $2 = await domHelper.read(piecesPath + '/views/widget/' + data.widgetType + '.dust');
	const widgetElemId = data.widgetType + '_' + data.entity.name + '_widget';

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

	return domHelper.write(layout_view_filename, $);
}

exports.createWidgetPiechart = async (data) => {
	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const piecesPath = __dirname + '/pieces/';

	if (!data.field) {
		let definitlyNotFound = true;
		const options = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.entity.name + '.json', 'utf8'));
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
			if(!data.field)
				throw new Error('structure.ui.widget.no_fields');

			const err = new Error('structure.ui.widget.unknown_fields');
			err.messageParams = [data.field];
			throw err;
		}
	}

	// Add widget to module's layout
	const layoutFile = workspacePath + '/views/default/' + data.np_module.name + '.dust';
	const $ = await domHelper.read(layoutFile);
	const $2 = await domHelper.read(piecesPath + '/views/widget/' + data.widgetType + '.dust');

	// Widget box title traduction
	$2(".box-title").html(`<!--{#__ key="defaults.widgets.piechart.distribution" /}-->&nbsp;<!--{#__ key="entity.${data.entity.name}.label_entity" /}-->&nbsp;-&nbsp;<!--{#__ key="entity.${data.entity.name}.${data.field.name}" /}-->`);

	let widgetElemId = data.widgetType + '_' + data.entity.name + '_' + data.field.name + '_widget';

	let randomNumber = Math.floor(Math.random() * 100);
	while($('#widgetElemId_' + randomNumber).length != 0)
		randomNumber = Math.floor(Math.random() * 100);

	widgetElemId = widgetElemId + '_' + randomNumber;

	let type = 'string';
	if(typeof data.field.type !== 'undefined')
		type = data.field.type;

	// Create widget's html
	let newHtml = "";
	newHtml += '<!--{#entityAccess entity="' + data.entity.name.substring(2) + '" }-->';
	newHtml += "<div id='" + widgetElemId + "' data-entity='" + data.entity.name + "' data-field-type='" + type + "' data-field='" + data.field.name + "' data-legend='" + data.legend + "' data-widget-type='" + data.widgetType + "' class='ajax-widget col-sm-4 col-xs-12'>\n";
	newHtml += $2("body")[0].innerHTML + "\n";
	newHtml += "</div>";
	newHtml += '<!--{/entityAccess}-->';
	$("#widgets").append(newHtml);
	domHelper.write(layoutFile, $);
	return;
}

exports.createWidgetLastRecords = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const piecesPath = __dirname + '/pieces/';

	// Look for related to fields in entity's options
	const definitlyNotFound = [];
	const options = JSON.parse(fs.readFileSync(workspacePath + '/models/options/' + data.entity.name + '.json', 'utf8'));

	for (let i = 0; i < data.columns.length; i++) {
		if (data.columns[i].found == true)
			continue;
		for (let j = 0; j < options.length; j++)
			if (data.columns[i].name.toLowerCase() == options[j].showAs.toLowerCase()) {
				data.columns[i] = {
					name: options[j].as,
					displayName: options[j].showAs,
					found: true
				};
				break;
			}
		if (!data.columns[i].found)
			definitlyNotFound.push(data.columns[i].name);
	}
	if (definitlyNotFound.length > 0){
		const err = new Error('structure.ui.widget.unknown_fields');
		err.messageParams = [definitlyNotFound.join(', ')];
		throw err;
	}

	if (!data.columns || data.columns.length == 0)
		throw new Error('structure.ui.widget.no_fields');

	const layoutFile = workspacePath + '/views/default/' + data.np_module.name + '.dust';
	const $ = await domHelper.read(layoutFile);
	const $template = await domHelper.read(piecesPath + '/views/widget/' + data.widgetType + '.dust');

	const widgetElemId = data.widgetType + '_' + data.entity.name + '_widget';
	let newHtml = "";
	newHtml += '<!--{#entityAccess entity="' + data.entity.name.substring(2) + '" }-->';
	newHtml += "<div id='" + widgetElemId + "' data-entity='" + data.entity.name + "' data-widget-type='" + data.widgetType + "' class='col-xs-12 col-sm-" + (data.columns.length > 4 ? '12' : '6') + "'>\n";
	newHtml += $template("body")[0].innerHTML + "\n";
	newHtml += "</div>";
	newHtml += '<!--{/entityAccess}-->';
	newHtml = newHtml.replace(/ENTITY_NAME/g, data.entity.name);
	newHtml = newHtml.replace(/ENTITY_URL_NAME/g, data.entity.name.substring(2));
	$("#widgets").append(newHtml);

	const $list = await domHelper.read(workspacePath + '/views/' + data.entity.name + '/list_fields.dust');

	let thead = '<thead><tr>';
	for (let i = 0; i < data.columns.length; i++) {
		const field = data.columns[i].name;
		const type = $list('th[data-field="' + field + '"]').data('type');
		const col = $list('th[data-field="' + field + '"]').data('col');
		const fieldTradKey = field != 'id' ? field : 'id_entity';
		thead += '\
		<th data-field="' + field + '" data-type="' + type + '" data-col="' + col + '">\n\
			<!--{#__ key="entity.' + data.entity.name + '.' + fieldTradKey + '" /}-->\n\
		</th>';
	}
	thead += '</tr></thead>';

	$("#" + data.entity.name.substring(2) + '_lastrecords').html(thead);
	$("#" + data.entity.name.substring(2) + '_lastrecords').attr('data-limit', data.limit);
	domHelper.write(layoutFile, $);
	return;
}

exports.deleteWidget = async (data) => {
	const workspacePath = __dirname + '/../workspace/' + data.application.name;

	// Delete from view
	const $ = await domHelper.read(workspacePath + '/views/default/' + data.np_module.name + '.dust');
	let widgetElements = [];

	// For each widgetType, find corresponding divs using a regex on data id
	for (const widgetType of data.widgetTypes) {
		widgetElements = $("#widgets > div[data-widget-type=" + widgetType + "]").filter(function() {
			// We don't know piechart's field, use regex to match rest of id
			const reg = widgetType == 'piechart' ? new RegExp('piechart_' + data.entity.name + '_.*_widget') : new RegExp(widgetType + '_' + data.entity.name + '_widget');
			return this.id.match(reg);
		});

		// Delete matched widget divs
		for (const elem of widgetElements)
			$(elem).remove();
	}

	domHelper.write(workspacePath + '/views/default/' + data.np_module.name + '.dust', $);
	return true;
}