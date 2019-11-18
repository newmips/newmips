/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
const addressConf = require('../addressconfig/addressConfig');

exports.generateFields = function (componentName, componentCodeName) {
	const result = {
		db_fields: {
			f_address_label: {
				type: 'STRING'
			}
		}
	};
	let createHtml = `\
	<label>{#__ key="entity.${componentCodeName}.label_entity"/}</label>&nbsp;\n\
	<a href="#" id="info_address_maps">\n\
		<i class="fa fa-info-circle"></i>\n\
	</a>\n\
	<br><br>\n\
	<section id='section_${componentCodeName}_fields' class='col-xs-12 section_address_fields'>\n`;


	let updateHtml = `\
	<label>{#__ key="entity.${componentCodeName}.label_entity"/}</label>&nbsp;&nbsp;\n\
	<a href="#" id="info_address_maps">\n\
		<i class="fa fa-info-circle"></i>\n\
	</a>\n\
	<br><br>\n\
	<section id='section_${componentCodeName}_fields' class='col-xs-12 section_address_fields'>\n`;

	let showFieldsHtml = '';
	let headers = '';
	let tds = '';
	let singleHeader = '';
	let singleTD = '';

	// For default
	if (addressConf.endpoint.enable) {
		createHtml += "		<div data-field='address_search_input' class='col-xs-12 div_address_search_input'>\n";
		createHtml += "			<div class='form-group'>\n";
		createHtml += "				<div class='input-group'>\n";
		createHtml += "					<div class='input-group-addon'>\n";
		createHtml += "						<i class='fa fa-map-marker' aria-hidden='true'></i>\n";
		createHtml += "					</div>\n";
		createHtml += "					<input class='input form-control address_search_input' id='address_search_input'  type='text' name='f_address_search_input' placeholder='{#__ key=\"entity." + componentCodeName + ".search\"/}' >\n";
		createHtml += "				</div>\n";
		createHtml += "			</div>\n";
		createHtml += "			<hr>\n";
		createHtml += "		</div>\n";

		updateHtml += "		<div data-field='address_search_input' class='col-xs-12 div_address_search_input'>\n";
		updateHtml += "			<div class='form-group'>\n";
		updateHtml += "				<div class='input-group'>\n";
		updateHtml += "					<div class='input-group-addon'>\n";
		updateHtml += "						<i class='fa fa-map-marker' aria-hidden='true'></i>\n";
		updateHtml += "					</div>\n";
		updateHtml += "					<input class='input form-control address_search_input' id='address_search_input'  type='text' name='f_address_search_input' placeholder='{#__ key=\"entity." + componentCodeName + ".search\"/}' >\n";
		updateHtml += "				</div>\n";
		updateHtml += "				<input class='input form-control'  type='hidden'  name='address_id' value='{r_address.id}' >\n";
		updateHtml += "			</div>\n";
		updateHtml += "			<hr>\n";
		updateHtml += "		</div>\n";
	}
	const locales = {
		fr: {
			search: 'Saisir une adresse',
			label_entity: componentName,
			name_entity: componentName,
			plural_entity: componentName,
			id_entity: 'ID'
		},
		en: {
			search: 'Enter an address',
			label_entity: componentName,
			name_entity: componentName,
			plural_entity: componentName,
			id_entity: 'ID'
		}
	};
	for (const attributeKey in addressConf.attributes) {
		const attribute = addressConf.attributes[attributeKey];
		const addInForm = attribute.addInForm || false;
		if (addInForm) {
			//Api field apiField
			const apiField = attribute.apiField;

			//prefix dbcolumn name
			const dbcolumn = 'f_address_' + attributeKey.toLowerCase();
			//set lang
			if (typeof attribute.lang !== 'undefined') {
				locales.en[dbcolumn] = attribute.lang.en || '';
				locales.fr[dbcolumn] = attribute.lang.fr || '';
			}
			result.db_fields[dbcolumn] = attribute.sql || {
				type: 'STRING'
			};

			const required = attribute.required === true ? 'required' : '';
			const readonly = (attribute.readonly === false || typeof addressConf.endpoint === 'undefined' || addressConf.endpoint.enable === false) ? '' : 'readonly';
			const max = (typeof attribute.maxLength !== 'undefined' && attribute.maxLength !== '') ? 'maxlength="' + attribute.maxLength + '"' : '';
			const min = (typeof attribute.minLength !== 'undefined' && attribute.minLength !== '') ? 'minlength="' + attribute.minLength + '"' : '';

			const pattern = (typeof attribute.pattern !== 'undefined' && attribute.pattern !== '') ? 'pattern="' + attribute.pattern + '"' : '';
			const defaultValue = typeof attribute.defaultValue !== 'undefined' && attribute.defaultValue != '' ? 'value=' + attribute.defaultValue : '';

			let type = 'text';
			/*Hide or display field on different views,adapted for lon and lat fields*/
			let display_create = 'block', display_udpate = 'block', display_show = 'block';

			if (typeof attribute.type !== 'undefined') {
				if (typeof attribute.type === "object") {
					if (attribute.type.create === "hidden")
						display_create = 'none';
					if (attribute.type.update === "hidden")
						display_udpate = 'none';
					if (attribute.type.show === "hidden")
						display_show = 'none';
				} else if (attribute.type === "hidden") {
					display_create = "none";
					display_udpate = "none";
					display_show = "none";
				} else
					type = attribute.type;
			}

			createHtml += "		<div data-field='" + dbcolumn + "' class='col-xs-12' style='display:" + display_create + "'>\n"
			createHtml += "			<div class='form-group'>\n";
			createHtml += "				<label for='" + dbcolumn + "' class='" + required + "'>{#__ key=\"entity." + componentCodeName + "." + dbcolumn + "\"/}</label>\n";
			createHtml += "				<input class='input form-control address_field " + dbcolumn + " ' " + min + " " + max + " field='" + apiField + "' " + pattern + " " + defaultValue + "  type='" + type + "' placeholder='{#__ key=\"entity." + componentCodeName + "." + dbcolumn + "\"/}' name='" + dbcolumn + "' id='" + dbcolumn + "' " + required + " >\n";
			createHtml += "			</div>\n";
			createHtml += "		</div>\n";
			// Update
			updateHtml += "		<div data-field='" + dbcolumn + "' class='col-xs-12' style='display:" + display_udpate + "'>\n"
			updateHtml += "			<div class='form-group'>\n";
			updateHtml += "				<label for='" + dbcolumn + "' class='" + required + "'>{#__ key=\"entity." + componentCodeName + "." + dbcolumn + "\"/}</label>\n";
			updateHtml += "				<input class='input form-control address_field " + dbcolumn + " ' " + min + " " + max + " field='" + apiField + "' " + pattern + "  type='" + type + "' value='{r_address." + dbcolumn + "}' placeholder='{#__ key=\"entity." + componentCodeName + "." + dbcolumn + "\"/}' name='" + dbcolumn + "' id='" + dbcolumn + "' " + required + ">\n";
			updateHtml += "			</div>\n";
			updateHtml += "		</div>\n";
			// Show
			showFieldsHtml += "		<div data-field='" + dbcolumn + "' class='col-xs-12' style='display:" + display_show + "'>\n";
			showFieldsHtml += "			<div class='form-group'>\n";
			showFieldsHtml += "				<label for='" + dbcolumn + "' class='" + required + "'>{#__ key=\"entity." + componentCodeName + "." + dbcolumn + "\"/}</label>\n";
			showFieldsHtml += "				<input class='input form-control " + dbcolumn + " ' value='{r_address." + dbcolumn + "}' placeholder='{#__ key=\"entity." + componentCodeName + "." + dbcolumn + "\"/}' name='" + dbcolumn + "' id='" + dbcolumn + "' readonly>\n";
			showFieldsHtml += "			</div>\n";
			showFieldsHtml += "		</div>\n";
			// Headers

			const header = `\
			<th data-field="r_address.${dbcolumn}" data-col="r_address.${dbcolumn}">\n\
				{#__ key="entity.${componentCodeName}.${dbcolumn}"/}\n\
			</th>\n`;

			const td = `	  <td data-field="address.${dbcolumn}">{${dbcolumn}}</td>\n`;

			headers += header;
			// tds
			tds += td;
			//build fields for parent table
			if (attributeKey === 'label') {
				singleHeader = '<th data-field="r_address" data-col="r_address.' + dbcolumn + '" data-type="string">'
						+ '{#__ key="entity.' + componentCodeName + '.label_entity"/}'
						+ '</th>';
				singleTD = '<td data-field="address">' + '{r_address.' + dbcolumn + '}</td>\n';
			}
		}
	}
	createHtml += "	</section>\n";
	updateHtml += "	</section>\n";

	result.createHtml = createHtml;
	result.updateHtml = updateHtml;
	result.showFieldsHtml = showFieldsHtml;
	result.singleAddressTableDFields = {
		header: singleHeader,
		body: singleTD
	};
	result.headers = headers;
	result.tds = tds;
	result.locales = locales;

	return result;
};