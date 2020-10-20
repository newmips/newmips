const fs = require("fs-extra");
const domHelper = require('../utils/jsDomHelper');
const translateHelper = require("../utils/translate");
const dataHelper = require("../utils/data_helper");

function getFieldHtml(type, field, entity, readOnly, file, values, defaultValue) {
	/* Value in input managment */
	let value = "";
	let value2 = "";
	if (file != "create") {
		value = "{" + field + "}";
		value2 = field;
	} else if (defaultValue != null) {
		switch (type) {
			case "number" :
			case "nombre" :
			case "int" :
			case "integer" :
				defaultValue = defaultValue.replace(/\.|,/g, "");
				if (!isNaN(defaultValue))
					value = defaultValue;
				else
					console.log("ERROR: Invalid default value " + defaultValue + " for number input.")
				break;
			case "decimal" :
			case "double" :
			case "float" :
			case "figures" :
				defaultValue = defaultValue.replace(/,/g, ".");
				if (!isNaN(defaultValue))
					value = defaultValue;
				else
					console.log("ERROR: Invalid default value " + defaultValue + " for decimal input.")
				break;
			case "date" :
				value = "data-today=1";
				break;
			case "datetime" :
				value = "data-today=1";
				break;
			case "boolean" :
			case "checkbox" :
			case "case à cocher" :
				if (["true", "vrai", "1", "checked", "coché", "à coché"].indexOf(defaultValue.toLowerCase()) != -1)
					value = true;
				else if (["false", "faux", "0", "unchecked", "non coché", "à non coché"].indexOf(defaultValue.toLowerCase()) != -1)
					value = false;
				else
					console.log("ERROR: Invalid default value " + defaultValue + " for boolean input.")
				break;
			case "enum" :
				value = dataHelper.clearString(defaultValue);
				break;
			default :
				value = defaultValue;
				break;
		}
	}

	// Radiobutton HTML can't understand a simple readOnly ... So it's disabled for them
	const disabled = readOnly ? 'disabled' : '';
	readOnly = readOnly ? 'readOnly' : '';

	let str = `\
	<div data-field='${field}' class='fieldLineHeight col-xs-12'>\n\
		<div class='form-group'>\n\
			<label for='${field}'>\n\
				<!--{#__ key="entity.${entity}.${field}"/}-->&nbsp;\n\
				<!--{@inline_help field="${field}"}-->\n\
					<i data-field="${field}" class="inline-help fa fa-info-circle" style="color: #1085EE;"></i>\n\
				<!--{/inline_help}-->\n\
			</label>\n`;

	let inputType;
	const clearValues = [];
	let clearDefaultValue = "";
	// Check type of field
	switch (type) {
		case "string" :
		case "":
			str += "<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' maxLength='255' " + readOnly + "/>\n";
			break;
		case "color" :
		case "colour":
		case "couleur":
			if (value == "")
				value = "#000000";
			str += "		<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='color' maxLength='255' " + readOnly + " " + disabled + "/>\n";
			break;
		case "money":
		case "currency":
		case "dollar":
			str += "	<div class='input-group'>\n";
			str += "		<div class='input-group-addon'>\n";
			str += "			<i class='fa fa-money'></i>\n";
			str += "		</div>\n";
			str += "		<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' data-type='currency' " + readOnly + "/>\n";
			str += "	</div>\n";
			break;
		case "euro":
		case "devise":
		case "argent":
			str += "	<div class='input-group'>\n";
			str += "		<div class='input-group-addon'>\n";
			str += "			<i class='fa fa-euro'></i>\n";
			str += "		</div>\n";
			str += "		<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' data-type='currency' " + readOnly + "/>\n";
			str += "	</div>\n";
			break;
		case "qrcode":
			str += "	<div class='input-group'>\n";
			str += "		<div class='input-group-addon'>\n";
			str += "			<i class='fa fa-qrcode'></i>\n";
			str += "		</div>\n";
			if (file == "show")
				str += "	<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "'  type='text' data-type='qrcode' " + readOnly + "/>\n";
			else
				str += "	<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "'  type='text' maxLength='255' " + readOnly + "/>\n";
			str += "	</div>\n";
			break;
		case "ean8":
		case "ean13":
		case "upc":
		case "code39":
		case "code128":
			inputType = 'number';
			if (type === "code39" || type === "code128")
				inputType = 'text';
			str += "	<div class='input-group'>\n";
			str += "		<div class='input-group-addon'>\n";
			str += "			<i class='fa fa-barcode'></i>\n";
			str += "		</div>\n";
			if (file == "show")
				str += "	<input class='form-control input' data-custom-type='" + type + "' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' show='true' type='text' data-type='barcode' " + readOnly + "/>\n";
			else
				str += "	<input class='form-control input' data-custom-type='" + type + "' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' data-type='barcode' type='" + inputType + "'" + readOnly + "/>\n";
			str += "	</div>\n";
			break;
		case "url" :
		case "lien" :
		case "link" :
			if (file == 'show') {
				str += "	<br><a href='" + value + "' target='_blank' type='url' data-type='url' style='display: table-cell;padding-right: 5px;'>" + value + "</a>\n";
				str += "	<!--{?" + value2 + "}-->"
				str += "	<div class='copy-button'>\n";
				str += "		<i class='fa fa-copy'></i>\n";
				str += "	</div>\n";
				str += "	<!--{/" + value2 + "}-->"
			} else {
				str += "	<div class='input-group'>\n";
				str += "		<div class='input-group-addon'>\n";
				str += "			<i class='fa fa-link'></i>\n";
				str += "		</div>\n";
				str += "	<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='url' data-type='url' " + readOnly + "/>\n";
				str += "	</div>\n";
			}
			break;
		case "password" :
		case "mot de passe":
		case "secret":
			str += "<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='password' " + readOnly + "/>\n";
			break;
		case "number" :
		case "nombre" :
		case "int" :
		case "integer" :
			str += "<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='number' max='2147483648' " + readOnly + "/>\n";
			break;
		case "big number" :
		case "big int" :
		case "big integer" :
		case "grand nombre" :
			str += "<input class='form-control input' data-custom-type='bigint' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='number' max='9223372036854775807' " + readOnly + "/>\n";
			break;
		case "decimal" :
		case "double" :
		case "float" :
		case "figures" :
			str += "		<input class='form-control input' data-custom-type='decimal' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' " + readOnly + "/>\n";
			break;
		case "date" :
			str += "   <div class='input-group'>\n";
			str += "		<div class='input-group-addon'>\n";
			str += "			<i class='fa fa-calendar'></i>\n";
			str += "		</div>\n";
			if (file == "show") {
				str += "		<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='{" + value2 + "|date}' type='text' " + readOnly + "/>\n";
			} else if (file == "update") {
				str += "		<input class='form-control input datepicker' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='{" + value2 + "|date}' type='text' " + readOnly + "/>\n";
			} else if (file == "create") {
				str += "		<input class='form-control input datepicker' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' type='text' " + value + " " + readOnly + "/>\n";
			}
			str += "	</div>\n";
			break;
		case "datetime" :
			str += "	<div class='input-group'>\n";
			str += "		<div class='input-group-addon'>\n";
			str += "			<i class='fa fa-calendar'></i> + <i class='fa fa-clock-o'></i>\n";
			str += "		</div>\n";
			if (file == "show")
				str += "		<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' value='{" + value2 + "|datetime}' type='text' " + readOnly + "/>\n";
			else if (file == "update")
				str += "		<input class='form-control input datetimepicker' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='{" + value2 + "|datetime}' type='text' " + readOnly + "/>\n";
			else if (file == "create")
				str += "		<input class='form-control input datetimepicker' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' type='text' " + value + " " + readOnly + "/>\n";
			str += "	</div>\n";
			break;
		case "time" :
		case "heure" :
			if (file == "show") {
				str += "	<div class='bootstrap-timepicker'>\n";
				str += "		<div class='input-group'>\n";
				str += "			<div class='input-group-addon'>\n";
				str += "				<i class='fa fa-clock-o'></i>\n";
				str += "			</div>\n";
				str += "			<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='{" + value2 + "|time}' type='text' " + readOnly + "/>\n";
				str += "		</div>\n";
				str += "	</div>\n";
			} else {
				str += "	<div class='bootstrap-timepicker'>\n";
				str += "		<div class='input-group'>\n";
				str += "			<div class='input-group-addon'>\n";
				str += "				<i class='fa fa-clock-o'></i>\n";
				str += "			</div>\n";
				str += "			<input class='form-control input timepicker' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' " + readOnly + "/>\n";
				str += "		</div>\n";
				str += "	</div>\n";
			}
			break;
		case "email" :
		case "mail" :
		case "e-mail" :
		case "mel" :
			str += "	<div class='input-group'>\n";
			str += "		<div class='input-group-addon'>\n";
			str += "			<i class='fa fa-envelope'></i>\n";
			str += "		</div>\n";
			str += "		<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' data-type='email' " + readOnly + "/>\n";
			str += "	</div>\n";
			break;
		case "tel" :
		case "téléphone" :
		case "portable" :
		case "phone" :
			str += "	<div class='input-group'>\n";
			str += "		<div class='input-group-addon'>\n";
			str += "			<i class='fa fa-phone'></i>\n";
			str += "		</div>\n";
			str += "		<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='tel' " + readOnly + "/>\n";
			str += "	</div>\n";
			break;
		case "fax" :
			str += "	<div class='input-group'>\n";
			str += "		<div class='input-group-addon'>\n";
			str += "			<i class='fa fa-fax'></i>\n";
			str += "		</div>\n";
			str += "		<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='number' " + readOnly + "/>\n";
			str += "	</div>\n";
			break;
		case "boolean" :
		case "checkbox" :
		case "case à cocher" :
			str += "	&nbsp;\n<br>\n";
			if (file == "create") {
				if (value === true)
					str += "	<input class='form-control input' name='" + field + "' type='checkbox' checked />\n";
				else
					str += "	<input class='form-control input' name='" + field + "' type='checkbox' />\n";
			} else {
				str += "	<!--{@ifTrue key=" + field + "}-->";
				str += "		<input class='form-control input' name='" + field + "' value='" + value + "' type='checkbox' checked " + disabled + "/>\n";
				str += "	<!--{:else}-->";
				str += "		<input class='form-control input' name='" + field + "' value='" + value + "' type='checkbox' " + disabled + "/>\n";
				str += "	<!--{/ifTrue}-->";
			}
			break;
		case "radio" :
		case "case à sélectionner" :
			for (let i = 0; i < values.length; i++)
				clearValues[i] = dataHelper.clearString(values[i]);

			if (typeof defaultValue !== "undefined" && defaultValue != "" && defaultValue != null)
				clearDefaultValue = dataHelper.clearString(defaultValue);

			if (file == "create") {
				if (clearDefaultValue != "") {
					str += "<!--{#enum_radio." + entity + "." + field + "}-->\n";
					str += "	&nbsp;\n<br>\n";
					str += "	<label class='no-weight'>";
					str += "	<!--{@eq key=\"" + clearDefaultValue + "\" value=\"{.value}\" }-->\n";
					str += "		<input class='form-control input' name='" + field + "' value='{.value}' checked type='radio' " + disabled + "/>&nbsp;{.translation}\n";
					str += "	<!--{:else}-->\n";
					str += "		<input class='form-control input' name='" + field + "' value='{.value}' type='radio' " + disabled + "/>&nbsp;{.translation}\n";
					str += "	<!--{/eq}-->\n";
					str += "	</label>";
					str += "<!--{/enum_radio." + entity + "." + field + "}-->\n";
				} else {
					str += "<!--{#enum_radio." + entity + "." + field + "}-->\n";
					str += "	&nbsp;\n<br>\n";
					str += "	<label class='no-weight'>";
					str += "	<input class='form-control input' name='" + field + "' value='{.value}' type='radio' " + disabled + "/>&nbsp;{.translation}\n";
					str += "	</label>";
					str += "<!--{/enum_radio." + entity + "." + field + "}-->\n";
				}
			} else if (file == "show") {
				str += "<!--{#enum_radio." + entity + "." + field + "}-->\n";
				str += "	&nbsp;\n<br>\n";
				str += "	<label class='no-weight'>";
				str += "	<!--{@eq key=" + value2 + " value=\"{.value}\" }-->\n";
				str += "		<input class='form-control input' name='" + entity + "." + field + "' value='{.value}' checked type='radio' " + disabled + "/>&nbsp;{.translation}\n";
				str += "	<!--{:else}-->\n";
				str += "		<input class='form-control input' name='" + entity + "." + field + "' value='{.value}' type='radio' " + disabled + "/>&nbsp;{.translation}\n";
				str += "	<!--{/eq}-->\n";
				str += "	</label>";
				str += "<!--{/enum_radio." + entity + "." + field + "}-->\n";
			} else {
				str += "<!--{#enum_radio." + entity + "." + field + "}-->\n";
				str += "	&nbsp;\n<br>\n";
				str += "	<label class='no-weight'>";
				str += "	<!--{@eq key=" + value2 + " value=\"{.value}\" }-->\n";
				str += "		<input class='form-control input' name='" + field + "' value='{.value}' checked type='radio' " + disabled + "/>&nbsp;{.translation}\n";
				str += "	<!--{:else}-->\n";
				str += "		<input class='form-control input' name='" + field + "' value='{.value}' type='radio' " + disabled + "/>&nbsp;{.translation}\n";
				str += "	<!--{/eq}-->\n";
				str += "	</label>";
				str += "<!--{/enum_radio." + entity + "." + field + "}-->\n";
			}
			break;
		case "enum" :
			if (file == "show") {
				str += "	<!--{^" + value2 + "}-->\n";
				str += "		<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' type='text' " + readOnly + "/>\n";
				str += "	<!--{/" + value2 + "}-->\n";
				str += "	<!--{#enum_radio." + entity + "." + field + "}-->\n";
				str += "		<!--{@eq key=" + value2 + " value=\"{.value}\" }-->\n";
				str += "			<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='{.translation}' type='text' " + readOnly + "/>\n";
				str += "		<!--{/eq}-->\n";
				str += "	<!--{/enum_radio." + entity + "." + field + "}-->\n";
			} else if (file != "create") {
				str += "	<select class='form-control select' name='" + field + "' " + disabled + " width='100%'>\n";
				str += "		<option value=''><!--{#__ key=\"select.default\" /}--></option>\n";
				str += "		<!--{#enum_radio." + entity + "." + field + "}-->\n";
				str += "			<!--{@eq key=" + value2 + " value=\"{.value}\" }-->\n";
				str += "				<option value=\"{.value}\" selected> {.translation} </option>\n";
				str += "			<!--{:else}-->\n";
				str += "				<option value=\"{.value}\"> {.translation} </option>\n";
				str += "			<!--{/eq}-->\n";
				str += "		<!--{/enum_radio." + entity + "." + field + "}-->\n";
				str += "	</select>\n";
			} else if (value != "") {
				str += "	<select class='form-control select' name='" + field + "' " + disabled + " width='100%'>\n";
				str += "		<option value=''><!--{#__ key=\"select.default\" /}--></option>\n";
				str += "		<!--{#enum_radio." + entity + "." + field + "}-->\n";
				str += "			<!--{@eq key=\"" + value + "\" value=\"{.value}\" }-->\n";
				str += "				<option value=\"{.value}\" selected> {.translation} </option>\n";
				str += "			<!--{:else}-->\n";
				str += "				<option value=\"{.value}\"> {.translation} </option>\n";
				str += "			<!--{/eq}-->\n";
				str += "		<!--{/enum_radio." + entity + "." + field + "}-->\n";
				str += "	</select>\n";
			} else {
				str += "	<select class='form-control select' name='" + field + "' " + disabled + " width='100%'>\n";
				str += "		<option value='' selected><!--{#__ key=\"select.default\" /}--></option>\n";
				str += "		<!--{#enum_radio." + entity + "." + field + "}-->\n";
				str += "			<option value=\"{.value}\"> {.translation} </option>\n";
				str += "		<!--{/enum_radio." + entity + "." + field + "}-->\n";
				str += "	</select>\n";
			}
			break;
		case "text" :
		case "texte" :
			if (file == 'show')
				str += "	<div class='show-textarea'>{" + field + "|s}</div>\n";
			else if (file == 'create')
				str += "	<textarea class='form-control textarea' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' id='" + field + "_textareaid' type='text' " + readOnly + ">" + value + "</textarea>\n";
			else
				str += "	<textarea class='form-control textarea' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' id='" + field + "_textareaid' type='text' " + readOnly + ">{" + value2 + "|s}</textarea>\n";

			break;
		case "regular text" :
		case "texte standard" :
			value = "{" + field + "|s}";
			if (file == 'show')
				str += "	<textarea readonly='readonly' class='show-textarea regular-textarea'>" + value + "</textarea>\n";
			else
				str += "	<textarea class='form-control textarea regular-textarea' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' id='" + field + "_textareaid' type='text' " + readOnly + ">" + value + "</textarea>\n";
			break;
		case "localfile" :
		case "fichier":
		case "file":
			if (file != 'show') {
				str += "	<div class='dropzone dropzone-field' id='" + field + "_dropzone' data-entity='" + entity + "' ></div>\n";
				str += "	<input type='hidden' name='" + field + "' id='" + field + "_dropzone_hidden' value='" + value + "'/>\n";
			} else {
				str += "	<div class='input-group'>\n";
				str += "		{?" + value2 + "}\n";
				str += "			<div class='input-group-addon'>\n";
				str += "				<i class='fa fa-download'></i>\n";
				str += "			</div>\n";
				str += "			<input data-entity=" + entity + " data-filename=" + value + " class='form-control text-left preview_file' name='" + field + "' value='{" + value2 + "|filename}' />\n";
				str += "		{:else}\n";
				str += "			{#__ key=\"message.empty_file\" /}\n";
				str += "		{/" + value2 + "}\n";
				str += "	</div>\n";
			}
			break;
		case "img":
		case "picture":
		case "image":
		case "photo":
			if (file != 'show') {
				str += "	<div class='dropzone dropzone-field' id='" + field + "_dropzone' data-type='picture' data-entity='" + entity + "' ></div>\n";
				str += "	<input type='hidden' name='" + field + "' id='" + field + "_dropzone_hidden' value=\"{" + value2 + ".value}\" data-buffer=\"{" + value2 + ".buffer}\"/>\n";
			} else {
				str += "	<div class='input-group'>\n";
				str += "		<a href=/default/download?entity=" + entity + "&f={" + value2 + ".value|urlencode} ><img src=data:image/;base64,{" + value2 + ".buffer}  class='img img-responsive' data-type='picture' alt=" + value + " name=" + field + "  " + readOnly + " height='400' width='400' /></a>\n";
				str += "	</div>\n";
			}
			break;
		case "cloudfile" :
			str += "	<div class='dropzone dropzone-field' id='" + field + "_dropzone' data-storage='cloud' data-entity='" + entity + "' ></div>\n";
			str += "	<input type='hidden' name='" + field + "' id='" + field + "_dropzone_hidden' />";
			break;
		default :
			str += "	<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' " + readOnly + "/>\n";
			break;
	}

	str += '\
		</div>\n\
	</div>\n';

	return str;
}

function getFieldInHeaderListHtml(type, fieldName, entityName) {
	const entity = entityName.toLowerCase();
	const field = fieldName.toLowerCase();
	const result = {
		headers: '',
		body: ''
	};

	/* ------------- Add new FIELD in headers ------------- */
	const str = `\
	<th data-field="${field}" data-col="${field}" data-type="${type}" >\
		<!--{#__ key="entity.${entity}.${field}"/}-->\
	</th>`;

	result.headers = str;
	return result;
}

async function updateFile(fileBase, file, string) {
	const fileToWrite = fileBase + '/' + file + '.dust';
	const $ = await domHelper.read(fileToWrite);
	$("#fields").append(string);
	domHelper.write(fileToWrite, $);
	return;
}

async function updateListFile(fileBase, file, thString) {
	const fileToWrite = fileBase + '/' + file + '.dust';
	const $ = await domHelper.read(fileToWrite)

	// Count th to know where to insert new th (-4 because of actions th + id, show/update/delete)
	const thCount = $(".main").find('th').length - 4;
	// Add to header thead and filter thead
	$(".fields").each(function () {
		$(this).find('th').eq(thCount).after(thString);
	});

	// Write back to file
	domHelper.write(fileToWrite, $);
	return;
}

exports.setupField = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const entity_name = data.entity.name;
	let field_type = "string",
		field_values;
	/* ----------------- 1 - Initialize variables according to options ----------------- */
	const options = data.options;
	const field_name = options.value;
	let defaultValue = null;
	let defaultValueForOption = null;

	if (typeof options.defaultValue !== "undefined" && options.defaultValue != null)
		defaultValue = options.defaultValue;

	// If there is a WITH TYPE in the instruction
	if (typeof options.type !== "undefined")
		field_type = options.type;

	// Cut allValues for ENUM or other type
	if (typeof options.allValues !== "undefined") {
		const values = options.allValues;
		if (values.indexOf(",") != -1) {
			field_values = values.split(",");
			for (let j = 0; j < field_values.length; j++)
				field_values[j] = field_values[j].trim();
		} else {
			throw new Error('structure.field.attributes.noSpace');
		}

		const sameResults_sorted = field_values.slice().sort();
		const sameResults = [];
		for (let i = 0; i < field_values.length - 1; i++)
			if (sameResults_sorted[i + 1] == sameResults_sorted[i])
				sameResults.push(sameResults_sorted[i]);

		if (sameResults.length > 0)
			throw new Error('structure.field.attributes.noSpace');

		// Clean empty value
		if(field_values.length > 0)
			field_values = field_values.filter(x => x != '');
	}

	/* ----------------- 2 - Update the entity model, add the attribute ----------------- */

	// attributes.json
	const attributesFileName = workspacePath + '/models/attributes/' + entity_name + '.json';
	const attributesObject = JSON.parse(fs.readFileSync(attributesFileName));

	// toSync.json
	const toSyncFileName = workspacePath + '/models/toSync.json';
	const toSyncObject = JSON.parse(fs.readFileSync(toSyncFileName));

	if (typeof toSyncObject[entity_name] === "undefined")
		toSyncObject[entity_name] = {
			attributes: {}
		};
	else if (typeof toSyncObject[entity_name].attributes === "undefined")
		toSyncObject[entity_name].attributes = {};

	let typeForModel = "STRING";
	let typeForDatalist = "string";

	switch (field_type) {
		case "password":
		case "mot de passe":
		case "secret":
			typeForModel = "STRING";
			typeForDatalist = "password";
			break;
		case "color":
		case "colour":
		case "couleur":
			typeForModel = "STRING";
			typeForDatalist = "color";
			break;
		case "number":
		case "int":
		case "integer":
		case "nombre":
			typeForModel = "INTEGER";
			typeForDatalist = "integer";
			break;
		case "big number":
		case "big int":
		case "big integer":
		case "grand nombre":
			typeForModel = "BIGINT";
			typeForDatalist = "integer";
			break;
		case "url":
		case "lien":
		case "link":
			typeForModel = "STRING"
			typeForDatalist = "url";
			break;
		case "code barre":
		case "codebarre":
		case "qrcode":
		case "barcode":
			typeForModel = "STRING";
			break;
		case "money":
		case "currency":
		case "dollar":
		case "devise":
		case "euro":
		case "argent":
			typeForModel = "DOUBLE";
			typeForDatalist = "currency";
			break;
		case "float":
		case "double":
		case "decimal":
		case "figures":
			typeForModel = "STRING";
			break;
		case "date":
			typeForModel = "DATE";
			typeForDatalist = "date";
			break;
		case "datetime":
			typeForModel = "DATE";
			typeForDatalist = "datetime";
			break;
		case "time":
		case "heure":
			typeForModel = "TIME";
			typeForDatalist = "time";
			break;
		case "email":
		case "mail":
		case "e-mail":
		case "mel":
			typeForModel = "STRING";
			typeForDatalist = "email";
			field_type = "email";
			break;
		case "phone":
		case "tel":
		case "téléphone":
		case "portable":
			typeForModel = "STRING";
			typeForDatalist = "tel";
			break;
		case "fax":
			typeForModel = "STRING";
			break;
		case "checkbox":
		case "boolean":
		case "case à cocher":
			typeForModel = "BOOLEAN";
			typeForDatalist = "boolean";
			break;
		case "radio":
		case "case à sélectionner":
			typeForModel = "ENUM";
			typeForDatalist = "enum";
			break;
		case "enum":
			typeForModel = "ENUM";
			typeForDatalist = "enum";
			break;
		case "text":
		case "texte":
		case "regular text":
		case "texte standard":
			typeForModel = "TEXT";
			typeForDatalist = "text";
			break;
		case "localfile":
		case "file":
		case "fichier":
			typeForModel = "STRING";
			typeForDatalist = "file";
			break;
		case "img":
		case "image":
		case "picture":
		case "photo":
			typeForModel = "STRING";
			typeForDatalist = "picture";
			field_type = 'picture';
			break;
		case "ean8":
		case "ean13":
		case "upca":
		case "codecip":
		case "cip":
		case "isbn":
		case "issn":
			typeForModel = "STRING";
			typeForDatalist = "barcode";
			break;
		case "code39":
		case "code128":
			typeForModel = "TEXT";
			typeForDatalist = "barcode";
			break;
		case "cloudfile":
			typeForModel = "STRING";
			break;
		default:
			typeForModel = "STRING";
			break;
	}

	// Default value managment
	if (typeof options.defaultValue !== "undefined" && options.defaultValue != null) {
		if (typeForModel == "STRING" || typeForModel == "TEXT" || typeForModel == "ENUM")
			defaultValueForOption = options.defaultValue;
		else if (typeForModel == "INTEGER" && !isNaN(options.defaultValue))
			defaultValueForOption = options.defaultValue;
		else if (typeForModel == "BOOLEAN") {
			if (["true", "vrai", "1", "checked", "coché", "à coché"].indexOf(defaultValue.toLowerCase()) != -1)
				defaultValueForOption = true;
			else if (["false", "faux", "0", "unchecked", "non coché", "à non coché"].indexOf(defaultValue.toLowerCase()) != -1)
				defaultValueForOption = false;
		}
	}

	const cleanEnumValues = [], cleanRadioValues = [];
	if (field_type == "enum") {
		// Remove all special caractere for all enum values
		if (typeof field_values === "undefined")
			throw new Error('structure.field.attributes.missingValues');

		for (let i = 0; i < field_values.length; i++)
			cleanEnumValues[i] = dataHelper.clearString(field_values[i]);

		attributesObject[field_name] = {
			"type": typeForModel,
			"values": cleanEnumValues,
			"newmipsType": "enum",
			"defaultValue": defaultValueForOption
		};
		toSyncObject[entity_name].attributes[field_name] = {
			"type": typeForModel,
			"values": cleanEnumValues,
			"newmipsType": "enum",
			"defaultValue": defaultValueForOption
		};
	} else if (field_type == "radio") {
		// Remove all special caractere for all enum values
		if (typeof field_values === "undefined")
			throw new Error('structure.field.attributes.missingValues');

		for (let i = 0; i < field_values.length; i++)
			cleanRadioValues[i] = dataHelper.clearString(field_values[i]);

		attributesObject[field_name] = {
			"type": typeForModel,
			"values": cleanRadioValues,
			"newmipsType": "enum",
			"defaultValue": defaultValueForOption
		};
		toSyncObject[entity_name].attributes[field_name] = {
			"type": typeForModel,
			"values": cleanRadioValues,
			"newmipsType": "enum",
			"defaultValue": defaultValueForOption
		};
	} else if (["text", "texte", "regular text", "texte standard"].indexOf(field_type) != -1) {
		// No DB default value for type text, mysql do not handling it.
		attributesObject[field_name] = {
			"type": typeForModel,
			"newmipsType": field_type
		};
		toSyncObject[entity_name].attributes[field_name] = {
			"type": typeForModel,
			"newmipsType": field_type
		}
	} else {
		attributesObject[field_name] = {
			"type": typeForModel,
			"newmipsType": field_type,
			"defaultValue": defaultValueForOption
		};
		toSyncObject[entity_name].attributes[field_name] = {
			"type": typeForModel,
			"newmipsType": field_type,
			"defaultValue": defaultValueForOption
		}
	}

	// Add default "validate" property to true, setting to false will disable sequelize's validation on the field
	attributesObject[field_name].validate = true;
	fs.writeFileSync(attributesFileName, JSON.stringify(attributesObject, null, 4));
	fs.writeFileSync(toSyncFileName, JSON.stringify(toSyncObject, null, 4));

	// Translation for enum and radio values
	if (field_type == "enum") {
		const fileEnum = workspacePath + '/locales/enum_radio.json';
		const enumData = JSON.parse(fs.readFileSync(fileEnum));
		let json = {};
		if (enumData[entity_name])
			json = enumData[entity_name];
		json[field_name] = [];
		for (let i = 0; i < field_values.length; i++) {
			json[field_name].push({
				value: cleanEnumValues[i],
				translations: {
					"fr-FR": field_values[i],
					"en-EN": field_values[i]
				}
			});
		}
		enumData[entity_name] = json;
		// Write Enum file
		fs.writeFileSync(fileEnum, JSON.stringify(enumData, null, 4));
	}

	// Translation for radio values
	if (field_type == "radio") {
		const fileRadio = workspacePath + '/locales/enum_radio.json';
		const radioData = JSON.parse(fs.readFileSync(fileRadio));
		let json = {};
		if (radioData[entity_name])
			json = radioData[entity_name];
		json[field_name] = [];
		for (let i = 0; i < field_values.length; i++)
			json[field_name].push({
				value: cleanRadioValues[i],
				translations: {
					"fr-FR": field_values[i],
					"en-EN": field_values[i]
				}
			});
		radioData[entity_name] = json;

		// Write Enum file
		fs.writeFileSync(fileRadio, JSON.stringify(radioData, null, 4));
	}

	/* ----------------- 4 - Add the fields in all the views  ----------------- */
	const fileBase = workspacePath + '/views/' + entity_name;

	const filePromises = [];
	/* show_fields.dust file with a disabled input */
	let field_html = getFieldHtml(field_type, field_name, entity_name, true, "show", field_values, defaultValue);
	filePromises.push(updateFile(fileBase, "show_fields", field_html));

	/* create_fields.dust */
	field_html = getFieldHtml(field_type, field_name, entity_name, false, "create", field_values, defaultValue);
	filePromises.push(updateFile(fileBase, "create_fields", field_html));

	/* update_fields.dust */
	field_html = getFieldHtml(field_type, field_name, entity_name, false, "update", field_values, defaultValue);
	filePromises.push(updateFile(fileBase, "update_fields", field_html));

	/* list_fields.dust */
	field_html = getFieldInHeaderListHtml(typeForDatalist, field_name, entity_name);
	filePromises.push(updateListFile(fileBase, "list_fields", field_html.headers));

	await Promise.all(filePromises);
	// Field application locales
	await translateHelper.writeLocales(data.application.name, "field", entity_name, [field_name, data.options.showValue], data.googleTranslate);

	return field_type;
}

exports.setRequiredAttribute = async (data) => {

	const possibilityRequired = ["mandatory", "required", "obligatoire"];
	const possibilityOptionnal = ["optionnel", "non-obligatoire", "optional"];

	const attribute = data.options.word.toLowerCase();
	let set = false;
	if (possibilityRequired.indexOf(attribute) != -1)
		set = true;
	else if (possibilityOptionnal.indexOf(attribute) != -1)
		set = false;
	else
		throw new Error('structure.field.attributes.notUnderstand');

	const pathToViews = __dirname + '/../workspace/' + data.application.name + '/views/' + data.entity_name;

	// Update create_fields.dust file
	let $ = await domHelper.read(pathToViews + '/create_fields.dust');

	if ($("*[data-field='" + data.options.value + "']").length == 0) {
		const err = new Error('structure.field.attributes.fieldNoFound');
		err.messageParams = [data.options.showValue];
		throw err;
	}

	if (set)
		$("*[data-field='" + data.options.value + "']").find('label:first').addClass('required');
	else
		$("*[data-field='" + data.options.value + "']").find('label:first').removeClass('required');

	if(data.structureType == "relatedToMultipleCheckbox"){
		$("*[data-field='" + data.options.value + "']").find('.relatedtomany-checkbox').data('required', set);
	} else {
		$("*[data-field='" + data.options.value + "']").find('input').prop('required', set);
		$("*[data-field='" + data.options.value + "']").find('textarea').prop('required', set);
		$("*[data-field='" + data.options.value + "']").find('select').prop('required', set);
	}

	domHelper.write(pathToViews + '/create_fields.dust', $);

	// Update update_fields.dust file
	$ = await domHelper.read(pathToViews + '/update_fields.dust');
	if (set)
		$("*[data-field='" + data.options.value + "']").find('label:first').addClass('required');
	else
		$("*[data-field='" + data.options.value + "']").find('label:first').removeClass('required');

	if(data.structureType == "relatedToMultipleCheckbox"){
		$("*[data-field='" + data.options.value + "']").find('.relatedtomany-checkbox').data('required', set);
	} else {
		$("*[data-field='" + data.options.value + "']").find('input').prop('required', set);
		$("*[data-field='" + data.options.value + "']").find('textarea').prop('required', set);
		$("*[data-field='" + data.options.value + "']").find('select').prop('required', set);
	}

	domHelper.write(pathToViews + '/update_fields.dust', $);

	// Update the Sequelize attributes.json to set allowNull
	const pathToAttributesJson = __dirname + '/../workspace/' + data.application.name + '/models/attributes/' + data.entity_name + ".json";
	const attributesObj = JSON.parse(fs.readFileSync(pathToAttributesJson, "utf8"));

	if (attributesObj[data.options.value]) {
		// TODO: Handle allowNull: false field in user, role, group to avoid error during autogeneration
		// In script you can set required a field in user, role or group but it crash the user admin autogeneration
		// becaude the required field is not given during the creation
		if (data.entity_name != "e_user" && data.entity_name != "e_role" && data.entity_name != "e_group")
			attributesObj[data.options.value].allowNull = set;
		// Alter column to set default value in DB if models already exist
		const jsonPath = __dirname + '/../workspace/' + data.application.name + '/models/toSync.json';
		const toSync = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
		if (typeof toSync.queries === "undefined")
			toSync.queries = [];

		let defaultValue = null;
		const tableName = data.entity_name;
		let length = "";
		if (data.sqlDataType == "varchar")
			length = "(" + data.sqlDataTypeLength + ")";

		// Set required
		if (set) {
			switch (attributesObj[data.options.value].type) {
				case "TEXT":
					defaultValue = null;
					break;
				case "STRING":
				case "ENUM":
					defaultValue = "";
					break;
				case "INTEGER":
				case "BIGINT":
				case "DECIMAL":
				case "BOOLEAN":
				case "FLOAT":
				case "DOUBLE":
					defaultValue = 0;
					break;
				case "DATE":
					defaultValue = "1900-01-01 00:00:00.000";
					break;
				case "TIME":
					defaultValue = "00:00:00.0000000";
					break;
				default:
					defaultValue = "";
					break;
			}

			if(defaultValue)
				attributesObj[data.options.value].defaultValue = defaultValue;

			if (data.sqlDataType && data.dialect == "mysql") {
				// Update all NULL value before set not null
				toSync.queries.push("UPDATE `" + tableName + "` SET `" + data.options.value + "`='" + defaultValue + "' WHERE `" + data.options.value + "` IS NULL;");
				toSync.queries.push("ALTER TABLE `" + tableName + "` CHANGE `" + data.options.value + "` `" + data.options.value + "` " + data.sqlDataType + length + " NOT NULL");
				if(defaultValue)
					toSync.queries.push("ALTER TABLE `" + tableName + "` ALTER `" + data.options.value + "` SET DEFAULT '" + defaultValue + "';");
			} else if(data.dialect == "postgres") {
				toSync.queries.push('UPDATE "' + tableName + '" SET "' + data.options.value + '"=\'' + defaultValue + '\' WHERE "' + data.options.value + '" IS NULL;');
				toSync.queries.push('ALTER TABLE "' + tableName + '" ALTER COLUMN "' + data.options.value + '" SET NOT NULL');
				if(defaultValue)
					toSync.queries.push('ALTER TABLE "' + tableName + '" ALTER COLUMN "' + data.options.value + '" SET DEFAULT ' + defaultValue + ';');
			}
		} else {
			// Set optional
			attributesObj[data.options.value].allowNull = true;

			// No default value for TEXT type
			if(attributesObj[data.options.value].type != 'TEXT')
				attributesObj[data.options.value].defaultValue = null;

			if (data.sqlDataType && data.dialect == "mysql") {
				toSync.queries.push("ALTER TABLE `" + tableName + "` CHANGE `" + data.options.value + "` `" + data.options.value + "` " + data.sqlDataType + length + " NULL");
				if(attributesObj[data.options.value].type != 'TEXT')
					toSync.queries.push("ALTER TABLE `" + tableName + "` ALTER `" + data.options.value + "` SET DEFAULT NULL;");
			} else if(data.dialect == "postgres") {
				toSync.queries.push('ALTER TABLE "' + tableName + '" ALTER COLUMN "' + data.options.value + '" DROP NOT NULL');
			}
		}
		fs.writeFileSync(jsonPath, JSON.stringify(toSync, null, 4));
		fs.writeFileSync(pathToAttributesJson, JSON.stringify(attributesObj, null, 4));
	} else {
		// If not in attributes, maybe in options
		const pathToOptionJson = __dirname + '/../workspace/' + data.application.name + '/models/options/' + data.entity_name + ".json";
		const optionsObj = JSON.parse(fs.readFileSync(pathToOptionJson, "utf8"));
		const aliasValue = "r_" + data.options.value.substring(2);
		for (let i = 0; i < optionsObj.length; i++)
			if (optionsObj[i].as == aliasValue)
				optionsObj[i].allowNull = set;

		// Save option
		fs.writeFileSync(pathToOptionJson, JSON.stringify(optionsObj, null, 4));
	}

	return;
}

exports.setUniqueField = (data) => {

	const possibilityUnique = ["unique"];
	const possibilityNotUnique = ["not-unique", "non-unique"];

	const attribute = data.options.word.toLowerCase();
	let set = false;
	if (possibilityUnique.indexOf(attribute) != -1)
		set = true;
	else if (possibilityNotUnique.indexOf(attribute) != -1)
		set = false;
	else
		throw new Error('structure.field.attributes.notUnderstand');

	// Update the Sequelize attributes.json to set unique
	const pathToAttributesJson = __dirname + '/../workspace/' + data.application.name + '/models/attributes/' + data.entity_name + ".json";
	const attributesContent = fs.readFileSync(pathToAttributesJson);
	const attributesObj = JSON.parse(attributesContent);

	// If the current field is an fk field then we won't find it in attributes.json
	if (typeof attributesObj[data.options.value] !== "undefined")
		attributesObj[data.options.value].unique = set;
	fs.writeFileSync(pathToAttributesJson, JSON.stringify(attributesObj, null, 4));

	return;
}

exports.setFieldAttribute = async (data) => {

	const targetField = data.options.value;
	const word = data.options.word.toLowerCase();
	const attributeValue = data.options.attributeValue.toLowerCase();
	const pathToViews = __dirname + '/../workspace/' + data.application.name + '/views/' + data.entity.name;

	// Update create_fields.dust file
	let $ = await domHelper.read(pathToViews + '/create_fields.dust');
	if ($("*[data-field='" + targetField + "']").length > 0) {

		$("*[data-field='" + targetField + "']").find('input').attr(word, attributeValue);
		$("*[data-field='" + targetField + "']").find('select').attr(word, attributeValue);

		domHelper.write(pathToViews + '/create_fields.dust', $);

		// Update update_fields.dust file
		$ = await domHelper.read(pathToViews + '/update_fields.dust');

		$("*[data-field='" + targetField + "']").find('input').attr(word, attributeValue);
		$("*[data-field='" + targetField + "']").find('select').attr(word, attributeValue);

		domHelper.write(pathToViews + '/update_fields.dust', $);
	} else {
		const err = new Error('structure.field.attributes.fieldNoFound');
		err.messageParams = [data.options.showValue];
		throw err;
	}
	return true;
}

exports.setupRelatedToField = async (data) => {
	const target = data.options.target;
	const urlTarget = data.options.urlTarget;
	const source = data.source_entity.name;
	const alias = data.options.as;
	const urlAs = data.options.urlAs;

	// Check if field is used in select, default to id
	const usingField = data.options.usingField ? data.options.usingField : [{value: "id"}];

	const usingList = [], usingOption = [];
	for (let i = 0; i < usingField.length; i++) {
		usingList.push(usingField[i].value);
		if(usingField[i].type == 'enum')
			usingOption.push('{' + usingField[i].value + '.translation}');
		else if (usingField[i].type == 'string')
			usingOption.push('{' + usingField[i].value + '|h}');
		else
			usingOption.push('{' + usingField[i].value + '|' + usingField[i].type + '}');
	}

	// --- CREATE_FIELD ---
	let select = `
	<div data-field="f_${urlAs}" class="fieldLineHeight col-xs-12">
		<div class="form-group">
			<label for="${alias}">
				<!--{#__ key="entity.${source}.${alias}" /}-->&nbsp;
				<!--{@inline_help field="${alias}"}-->
					<i data-field="${alias}" class="inline-help fa fa-info-circle" style="color: #1085EE"></i>
				<!--{/inline_help}-->
			</label>
			<select class="ajax form-control" name="${alias}" data-source="${urlTarget}" data-using="${usingList.join(',')}" width="100%"></select>
		</div>
	</div>`;

	const fileBase = __dirname + '/../workspace/' + data.application.name + '/views/' + source;
	let file = 'create_fields';
	await updateFile(fileBase, file, select);

	// --- UPDATE_FIELD ---
	select = `
	<div data-field="f_${urlAs}" class="fieldLineHeight col-xs-12">
		<div class="form-group">
			<label for="${alias}">
				<!--{#__ key="entity.${source}.${alias}" /}-->&nbsp;
				<!--{@inline_help field="${alias}"}-->
					<i data-field="${alias}" class="inline-help fa fa-info-circle" style="color: #1085EE"></i>
				<!--{/inline_help}-->
			</label>
			<select class="ajax form-control" name="${alias}" data-source="${urlTarget}" data-using="${usingList.join(',')}" width="100%">
				<!--{#${alias}}-->
					<option value="{id}" selected>${usingOption.join(' - ')}</option>
				<!--{/${alias}}-->
			</select>
		</div>
	</div>`;

	file = 'update_fields';
	await updateFile(fileBase, file, select);

	// --- SHOW_FIELD ---
	// Add read only field in show file. No tab required

	// If enum it is necessary to show the translation and not the value in DB
	const value = usingField.map(field => {
		if(field.type == 'enum')
			return `{${alias}.${field.value}.translation}`
		return `{${alias}.${field.value}|${field.type}}`
	}).join(' - ');

	const showField = `
	<div data-field='f_${urlAs}' class='fieldLineHeight col-xs-12'>
		<div class='form-group'>
			<label for='${alias}'>
				<!--{#__ key="entity.${source}.${alias}" /}-->&nbsp;
				<!--{@inline_help field="${alias}"}-->
					<i data-field="${alias}" class="inline-help fa fa-info-circle" style="color: #1085EE"></i>
				<!--{/inline_help}-->
			</label>
			<input class='form-control input' name='${alias}' value='${value}' placeholder='{#__ key=|entity.${source}.${alias}| /}' type='text' readOnly />
		</div>
	</div>`;

	file = fileBase + '/show_fields.dust';
	const $ = await domHelper.read(file);
	$("#fields").append(showField);

	domHelper.write(file, $)

	/* ------------- Add new FIELD in list <thead> ------------- */
	for (let i = 0; i < usingField.length; i++) {
		const targetField = usingField[i].value == "id" ? "id_entity" : usingField[i].value;
		const newHead = `
		<th data-field="${alias}" data-col="${alias}.${usingField[i].value}" data-type="${usingField[i].type}">
			<!--{#__ key="entity.${source}.${alias}"/}-->&nbsp;-&nbsp;<!--{#__ key="entity.${target}.${targetField}"/}-->
		</th>`;

		await updateListFile(fileBase, "list_fields", newHead); // eslint-disable-line
	}

	await translateHelper.writeLocales(data.application.name, "aliasfield", source, [alias, data.options.showAs], data.googleTranslate);
	return;
}

exports.setupRelatedToMultipleField = async (data) => {

	const urlTarget = data.options.urlTarget;
	const source = data.source_entity.name;
	const alias = data.options.as;
	const urlAs = data.options.urlAs;
	const fileBase = __dirname + '/../workspace/' + data.application.name + '/views/' + source;

	// Gestion du field à afficher dans le select du fieldset, par defaut c'est l'ID
	let usingField = [{value: "id"}];

	if (typeof data.options.usingField !== "undefined")
		usingField = data.options.usingField;

	const usingList = [], usingOption = [];
	for (let i = 0; i < usingField.length; i++) {
		usingList.push(usingField[i].value);
		if(usingField[i].type == 'enum')
			usingOption.push('{' + usingField[i].value + '.translation}');
		else if (usingField[i].type == 'string')
			usingOption.push('{' + usingField[i].value + '|h}');
		else
			usingOption.push('{' + usingField[i].value + '|' + usingField[i].type + '}');
	}

	// FIELD WRAPPER
	function wrapField(wrapped) {
		return `
			<div data-field="f_${urlAs}" class="fieldLineHeight col-xs-12" ${data.options.isCheckbox ? 'style="margin-bottom: 25px;"' : ""}>
				<div class="form-group">
					<label for="f_${urlAs}">
						<!--{#__ key="entity.${source}.${alias}" /}-->
						<!--{@inline_help field="${alias}"}-->
							<i data-field="${alias}" class="inline-help fa fa-info-circle" style="color: #1085EE"></i>
						<!--{/inline_help}-->
					</label>
					${wrapped}
				</div>
			</div>
		`;
	}

	// CREATE FIELD
	let createField;
	if (data.options.isCheckbox)
		createField = wrapField(`
			<br>
			<div class="relatedtomany-checkbox">
				<!--{#${alias}_all}-->
					<wrap>
						<label class="no-weight">
							<input type="checkbox" value="{id}" class="no-formatage" name="${alias}">&nbsp;&nbsp;${usingOption.join(' - ')}
						</label><br>
					</wrap>
				<!--{/${alias}_all}-->
			</div>
		`);
	else
		createField = wrapField(`
			<select multiple="multiple" class="ajax form-control" name="${alias}" data-source="${urlTarget}" data-using="${usingList.join(',')}" width="100%"></select>
		`);
	await updateFile(fileBase, 'create_fields', createField);

	// UPDATE_FIELD
	let updateField;
	if (data.options.isCheckbox)
		updateField = wrapField(`
			<div class="relatedtomany-checkbox">
				<!--{#${alias}_all}-->
					<!--{@existInContextById ofContext=${alias} key=id}-->
						<wrap><input type="checkbox" checked value="{id}" class="no-formatage" name="${alias}">&nbsp;&nbsp;${usingOption.join(' - ')}<br></wrap>
					<!--{:else}-->
						<wrap><input type="checkbox" value="{id}" class="no-formatage" name="${alias}">&nbsp;&nbsp;${usingOption.join(' - ')}<br></wrap>
					<!--{/existInContextById}-->
				<!--{/${alias}_all}-->
			</div>
		`);
	else
		updateField = wrapField(`
			<select multiple="" class="ajax form-control" name="${alias}" data-source="${urlTarget}" data-using="${usingList.join(',')}" width="100%">
				<option value="">{#__ key="select.default" /}</option>
				<!--{#${alias}}-->
					<option value="{id}" selected>${usingOption.join(' - ')}</option>
				<!--{/${alias}}-->
			</select>
		`);
	await updateFile(fileBase, 'update_fields', updateField);

	// SHOW_FIELD
	let showField;
	if (data.options.isCheckbox)
		showField = wrapField(`
			<div class="relatedtomany-checkbox">
				<!--{#${alias}_all}-->
					<!--{@existInContextById ofContext=${alias} key=id}-->
						<wrap><input type="checkbox" disabled="" checked="" name="${alias}">&nbsp;&nbsp;${usingOption.join(' - ')}<br></wrap>
					<!--{:else}-->
						<wrap><input type="checkbox" disabled="" name="${alias}">&nbsp;&nbsp;${usingOption.join(' - ')}<br></wrap>
					<!--{/existInContextById}-->
				<!--{/${alias}_all}-->
			</div>
		`);
	else
		showField = wrapField(`
			<select multiple disabled readonly class="form-control" name="${alias}" data-source="${urlTarget}" data-using="${usingList.join(',')}" width="100%">
				<!--{#${alias}}-->
					<option value="${usingOption.join(' - ')}" selected>${usingOption.join(' - ')}</option>
				<!--{/${alias}}-->
			</select>
		`);

	const file = fileBase + '/show_fields.dust';
	const $ = await domHelper.read(file);
	$("#fields").append(showField);
	domHelper.write(file, $);
	await translateHelper.writeLocales(data.application.name, "aliasfield", source, [alias, data.options.showAs], data.googleTranslate);
	return;
}

exports.deleteField = async (data) => {

	const workspacePath = __dirname + '/../workspace/' + data.application.name;
	const optionsPath = workspacePath + '/models/options/';
	const field = data.options.value;
	const url_value = data.options.urlValue;
	let isInOptions = false;
	const info = {};

	// Check if field is in options with relation=belongsTo, it means its a relatedTo association and not a simple field
	let jsonPath = optionsPath + data.entity.name + '.json';

	// Clear the require cache
	let dataToWrite = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
	const deletedOptionsTarget = [];
	for (let i = 0; i < dataToWrite.length; i++) {
		if (dataToWrite[i].as.toLowerCase() == "r_" + url_value) {
			if (dataToWrite[i].relation != 'belongsTo' && dataToWrite[i].structureType != "relatedToMultiple" && dataToWrite[i].structureType != "relatedToMultipleCheckbox")
				throw new Error(data.entity.name + " isn't a regular field. You might want to use 'delete tab' instruction.");

			// Modify the options.json file
			info.fieldToDrop = dataToWrite[i].foreignKey;
			info.isConstraint = true;

			// Related To Multiple
			if (dataToWrite[i].structureType == "relatedToMultiple" || dataToWrite[i].structureType == "relatedToMultipleCheckbox") {
				info.isMultipleConstraint = true;
				info.target = dataToWrite[i].target;
				info.fieldToDrop = dataToWrite[i].foreignKey + "_" + url_value;
			}

			deletedOptionsTarget.push(dataToWrite[i]);

			dataToWrite.splice(i, 1);
			isInOptions = true;
			break;
		}
	}

	// Nothing found in options, field is regular, modify the attributes.json file
	if (!isInOptions) {
		jsonPath = workspacePath + '/models/attributes/' + data.entity.name + '.json';
		dataToWrite = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

		delete dataToWrite[field];

		info.fieldToDrop = field;
		info.isConstraint = false;
	}

	// Look in option file for all concerned target to destroy auto_generate key no longer needed
	let targetOption, autoGenerateFound, targetJsonPath;
	for (let i = 0; i < deletedOptionsTarget.length; i++) {
		autoGenerateFound = false;
		targetJsonPath = workspacePath + '/models/options/' + deletedOptionsTarget[i].target + '.json';
		targetOption = JSON.parse(fs.readFileSync(targetJsonPath));
		for (let j = 0; j < targetOption.length; j++) {
			if(targetOption[j].structureType == "auto_generate" && targetOption[j].foreignKey == deletedOptionsTarget[i].foreignKey){
				targetOption.splice(j, 1);
				autoGenerateFound = true;
			}
		}
		if(autoGenerateFound)
			fs.writeFileSync(targetJsonPath, JSON.stringify(targetOption, null, 4), "utf8");
	}

	// Write back either options.json or attributes.json file
	fs.writeFileSync(jsonPath, JSON.stringify(dataToWrite, null, 4), "utf8");

	// Remove field from create/update/show views files
	const viewsPath = workspacePath + '/views/' + data.entity.name + '/';
	const fieldsFiles = ['create_fields', 'update_fields', 'show_fields'];
	let promises = [];
	for (let i = 0; i < fieldsFiles.length; i++)
		promises.push((async () => {
			const $ = await domHelper.read(viewsPath + '/' + fieldsFiles[i] + '.dust');
			$('*[data-field="' + field + '"]').remove();
			// In case of related to
			$('*[data-field="r_' + field.substring(2) + '"]').remove();
			domHelper.write(viewsPath + '/' + fieldsFiles[i] + '.dust', $);
		})());

	// Remove field from list view file
	promises.push((async () => {
		const $ = await domHelper.read(viewsPath + '/list_fields.dust');
		$("th[data-field='" + field + "']").remove();
		// In case of related to
		$("th[data-col^='r_" + field.substring(2) + ".']").remove();
		domHelper.write(viewsPath + '/list_fields.dust', $);
	})());

	// Wait for all promises execution, first pass before continuing on option
	await Promise.all(promises);
	promises = [];

	const otherViewsPath = workspacePath + '/views/';
	const structureTypeWithUsing = ["relatedTo", "relatedToMultiple", "relatedToMultipleCheckbox", "hasManyPreset"];
	fieldsFiles.push("list_fields");
	// Looking for association with using of the deleted field
	fs.readdirSync(optionsPath).filter(file => file.indexOf('.json') != -1).forEach(file => {
		const currentOption = JSON.parse(fs.readFileSync(optionsPath + file, "utf8"));
		const currentEntity = file.split(".json")[0];
		let toSave = false;
		for (let i = 0; i < currentOption.length; i++) {
			// If the option match with our source entity
			if (structureTypeWithUsing.indexOf(currentOption[i].structureType) == -1 ||
				currentOption[i].target != data.entity.name ||
				typeof currentOption[i].usingField === "undefined")
				continue;

			// Check if our deleted field is in the using fields
			for (let j = 0; j < currentOption[i].usingField.length; j++) {
				if (currentOption[i].usingField[j].value != field)
					continue;

				for (let k = 0; k < fieldsFiles.length; k++) {
					// Clean file
					let content = fs.readFileSync(otherViewsPath + currentEntity + '/' + fieldsFiles[k] + '.dust', "utf8")
					content = content.replace(new RegExp(currentOption[i].as + "." + field, "g"), currentOption[i].as + ".id");
					content = content.replace(new RegExp(currentOption[i].target + "." + field, "g"), currentOption[i].target + ".id_entity");
					fs.writeFileSync(otherViewsPath + currentEntity + '/' + fieldsFiles[k] + '.dust', content);
					// Looking for select in create / update / show
					promises.push((async () => {
						const dustPath = otherViewsPath + currentEntity + '/' + fieldsFiles[k] + '.dust';
						const $ = await domHelper.read(dustPath);
						const el = $("select[name='" + currentOption[i].as + "'][data-source='" + currentOption[i].target.substring(2) + "']");
						if (el.length == 0)
							return;

						const using = el.attr("data-using").split(",");

						if (using.indexOf(field) == -1)
							return;

						// If using is alone, then replace with id, or keep just other using
						if (using.length == 1) {
							el.attr("data-using", "id")
						} else {
							using.splice(using.indexOf(field), 1)
							el.attr("data-using", using.join())
						}
						el.html(el.html().replace(new RegExp(field, "g"), "id"))
						domHelper.write(dustPath, $);
					})());
				}

				// Clean using
				currentOption[i].usingField.splice(j, 1);
				toSave = true;
				break;
			}
		}
		if (toSave)
			fs.writeFileSync(optionsPath + file, JSON.stringify(currentOption, null, 4), "utf8");
	});

	// Wait for all promises execution
	await Promise.all(promises);

	// Remove translation in enum locales
	const enumsPath = workspacePath + '/locales/enum_radio.json';
	const enumJson = JSON.parse(fs.readFileSync(enumsPath));

	if (typeof enumJson[data.entity.name] !== "undefined") {
		if (typeof enumJson[data.entity.name][info.fieldToDrop] !== "undefined") {
			delete enumJson[data.entity.name][info.fieldToDrop];
			fs.writeFileSync(enumsPath, JSON.stringify(enumJson, null, 4));
		}
	}

	// Remove translation in global locales
	const fieldToDropInTranslate = info.isConstraint ? "r_" + url_value : info.fieldToDrop;
	translateHelper.removeLocales(data.application.name, "field", [data.entity.name, fieldToDropInTranslate])
	return info;
}

exports.updateListFile = updateListFile;
