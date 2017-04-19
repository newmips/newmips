var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');
var translateHelper = require("../utils/translate");
var helpers = require("../utils/helpers");
var moment = require("moment");
function getFieldHtml(type, nameDataField, nameDataEntity, readOnly, file, values, defaultValue) {
    var dataField = nameDataField.toLowerCase();
    var dataEntity = nameDataEntity.toLowerCase();
    /* Value in input managment */
    var value = "";
    var value2 = "";
    if (file != "create") {
        value = "{" + dataField + "}";
        value2 = dataField;
    } else if (defaultValue != null) {
        switch (type) {
            case "number" :
            case "nombre" :
            case "int" :
            case "integer" :
                defaultValue = defaultValue.replace(/\.|\,/g, "");
                if (!isNaN(defaultValue))
                    value = defaultValue;
                else
                    console.log("ERROR: Invalid default value " + defaultValue + " for number input.")
                break;
            case "decimal" :
            case "double" :
            case "float" :
            case "figures" :
                defaultValue = defaultValue.replace(/\,/g, ".");
                if (!isNaN(defaultValue))
                    value = defaultValue;
                else
                    console.log("ERROR: Invalid default value " + defaultValue + " for decimal input.")
                break;
            case "date" :
                if (moment(defaultValue, "YYYY-MM-DD", true).isValid()) {
                    value = moment(defaultValue, "YYYY-MM-DD").format("YYYY-MM-DD");
                } else if (moment(defaultValue, "DD/MM/YYYY", true).isValid()) {
                    value = moment(defaultValue, "DD/MM/YYYY").format("YYYY-MM-DD");
                } else if (["today", "now", "aujourd'hui"].indexOf(defaultValue.toLowerCase()) != -1) {
                    value = moment().format("YYYY-MM-DD");
                } else {
                    console.log("ERROR: Invalide date '" + defaultValue + "' for default value, please use this format: YYYY-MM-DD or DD/MM/YYYY");
                }
                break;
            case "boolean" :
            case "checkbox" :
            case "case à cocher" :
                if (["true", "vrai", "1", "checked", "coché", "à coché"].indexOf(defaultValue.toLowerCase()) != -1) {
                    value = true;
                } else if (["false", "faux", "0", "unchecked", "non coché", "à non coché"].indexOf(defaultValue.toLowerCase()) != -1) {
                    value = false;
                } else {
                    console.log("ERROR: Invalid default value " + defaultValue + " for boolean input.")
                }
                break;
            default :
                value = defaultValue;
                break;
        }
    }

    // Radiobutton HTML can't understand a simple readOnly ... So it's disabled for them
    var disabled = readOnly ? "disabled" : "";
    readOnly = readOnly ? "readOnly" : "";
    var str = "<div data-field='" + dataField + "' class='col-xs-12'>\n<div class='form-group'>\n";
    str += "\t<label for='" + dataField + "'> {@__ key=\"entity." + dataEntity + "." + dataField + "\"/} </label>\n";
    // Check type of field
    switch (type) {
        case "string" :
        case "":
            str += "	<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='text' " + readOnly + "/>\n";
            break;
        case "color" :
        case "colour":
        case "couleur":
            str += "    <input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='color' " + readOnly + "/>\n";
            break;
        case "money":
        case "currency":
        case "dollar":
            str += "	<div class='input-group'>\n";
            str += "		<div class='input-group-addon'>\n";
            str += "			<i class='fa fa-money'></i>\n";
            str += "		</div>\n";
            str += "		<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='text' data-type='currency' " + readOnly + "/>\n";
            str += "	</div>\n";
            break;
        case "qrcode":
            str += "	<div class='input-group'>\n";
            str += "		<div class='input-group-addon'>\n";
            str += "			<i class='fa fa-qrcode'></i>\n";
            str += "		</div>\n";
            if (file == "show")
                str += "	<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "'  type='text' data-type='qrcode' " + readOnly + "/>\n";
            else
                str += "	<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "'  type='text'" + readOnly + "/>\n";
            str += "	</div>\n";
            break;
        case "ean8":
        case "ean13":
        case "upc":
        case "code39":
        case "alpha39":
        case "code128":
//        case "codecip":
//        case "cip":
//        case "isbn":
//        case "issn":
//        case "hr":
//        case "codehr":
            var inputType = 'number';
            if (type === "code39" || type === "alpha39" || type === "code128")
                inputType = 'text';
            str += "	<div class='input-group'>\n";
            str += "		<div class='input-group-addon'>\n";
            str += "			<i class='fa fa-barcode'></i>\n";
            str += "		</div>\n";
            if (file == "show")
                str += "	<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' show='true' data-customtype='"+type+"' type='text' data-type='barcode' " + readOnly + "/>\n";
            else
                str += "	<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' data-customtype='"+type+"' data-type='barcode'  type='" + inputType + "'" + readOnly + "/>\n";
            str += "	</div>\n";
            break;
        case "euro":
        case "devise":
        case "argent":
            str += "	<div class='input-group'>\n";
            str += "		<div class='input-group-addon'>\n";
            str += "			<i class='fa fa-euro'></i>\n";
            str += "		</div>\n";
            str += "		<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='text' data-type='currency' " + readOnly + "/>\n";
            str += "	</div>\n";
            break;
        case "url" :
        case "lien" :
        case "link" :
            str += "	<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='url' data-type='url' " + readOnly + "/>\n";
            break;
        case "password" :
        case "mot de passe":
        case "secret":
            str += "	<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='password' " + readOnly + "/>\n";
            break;
        case "number" :
        case "nombre" :
        case "int" :
        case "integer" :
            str += "	<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='number' " + readOnly + "/>\n";
            break;
        case "decimal" :
        case "double" :
        case "float" :
        case "figures" :
            str += "	<input class='form-control input' data-custom-type='decimal' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='text' " + readOnly + "/>\n";
            break;
        case "date" :
            if (file == "show") {
                str += "	<div class='input-group'>\n";
                str += "		<div class='input-group-addon'>\n";
                str += "			<i class='fa fa-calendar'></i>\n";
                str += "		</div>\n";
                str += "		<input class='form-control input datepicker-toconvert' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' value='" + value + "' type='text' " + readOnly + "/>\n";
                str += "	</div>\n";
            } else if (file == "update" || file == "create") {
                str += "	<div class='input-group'>\n";
                str += "		<div class='input-group-addon'>\n";
                str += "			<i class='fa fa-calendar'></i>\n";
                str += "		</div>\n";
                str += "		<input class='form-control input datepicker datepicker-toconvert' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='text' " + readOnly + "/>\n";
                str += "	</div>\n";
            }
            /*else if (file == "create") {
             str += "	<div class='input-group'>\n";
             str += "		<div class='input-group-addon'>\n";
             str += "			<i class='fa fa-calendar'></i>\n";
             str += "		</div>\n";
             str += "		<input class='form-control input datepicker' value='" + value + "' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' type='text' " + readOnly + "/>\n";
             str += "	</div>\n";
             }*/
            break;
        case "time" :
        case "heure" :
            if (file == "show") {
                str += "	<div class='bootstrap-timepicker'>\n";
                str += "		<div class='input-group'>\n";
                str += "			<div class='input-group-addon'>\n";
                str += "				<i class='fa fa-clock-o'></i>\n";
                str += "			</div>\n";
                str += "			<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' value='" + value + "' type='text' " + readOnly + "/>\n";
                str += "		</div>\n";
                str += "	</div>\n";
            } else {
                str += "	<div class='bootstrap-timepicker'>\n";
                str += "		<div class='input-group'>\n";
                str += "			<div class='input-group-addon'>\n";
                str += "				<i class='fa fa-clock-o'></i>\n";
                str += "			</div>\n";
                str += "			<input class='form-control input timepicker' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='text' " + readOnly + "/>\n";
                str += "		</div>\n";
                str += "	</div>\n";
            }
            break;
        case "datetime" :
            str += "	<div class='input-group'>\n";
            str += "		<div class='input-group-addon'>\n";
            str += "			<i class='fa fa-calendar'></i> + <i class='fa fa-clock-o'></i>\n";
            str += "		</div>\n";
            if (file == "show") {
                str += "		<input class='form-control input datetimepicker-toconvert' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' value='" + value + "' type='text' " + readOnly + "/>\n";
            } else if (file == "update") {
                str += "		<input class='form-control input datetimepicker datetimepicker-toconvert' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='text' " + readOnly + "/>\n";
            } else if (file == "create") {
                str += "		<input class='form-control input datetimepicker' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' type='text' " + readOnly + "/>\n";
            }
            str += "	</div>\n";
            break;
        case "email" :
        case "mail" :
        case "e-mail" :
        case "mel" :
            str += "	<div class='input-group'>\n";
            str += "		<div class='input-group-addon'>\n";
            str += "			<i class='fa fa-envelope'></i>\n";
            str += "		</div>\n";
            str += "		<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='text' data-type='email' " + readOnly + "/>\n";
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
            str += "		<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='number' " + readOnly + "/>\n";
            str += "	</div>\n";
            break;
        case "fax" :
            str += "	<div class='input-group'>\n";
            str += "		<div class='input-group-addon'>\n";
            str += "			<i class='fa fa-fax'></i>\n";
            str += "		</div>\n";
            str += "		<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='number' " + readOnly + "/>\n";
            str += "	</div>\n";
            break;
        case "boolean" :
        case "checkbox" :
        case "case à cocher" :
            str += "    &nbsp;\n<br>\n";
            if (file == "create") {
                if (value === true) {
                    str += "    <input class='form-control input' name='" + dataField + "' type='checkbox' checked />\n";
                } else {
                    str += "    <input class='form-control input' name='" + dataField + "' type='checkbox' />\n";
                }
            } else {
                str += "	{@ifTrue key=" + dataField + "}";
                str += "		<input class='form-control input' name='" + dataField + "' value='" + value + "' type='checkbox' checked " + disabled + "/>\n";
                str += "	{:else}";
                str += "		<input class='form-control input' name='" + dataField + "' value='" + value + "' type='checkbox' " + disabled + "/>\n";
                str += "	{/ifTrue}";
            }
            break;
        case "radio" :
        case "case à sélectionner" :
            if (file == "create") {
                for (var i = 0; i < values.length; i++) {
                    str += "    &nbsp;\n<br>\n";
                    if (values[i] == defaultValue)
                        str += "    <input class='form-control input' name='" + dataField + "' value='" + values[i] + "' checked type='radio' " + disabled + "/>&nbsp;" + values[i] + "\n";
                    else
                        str += "    <input class='form-control input' name='" + dataField + "' value='" + values[i] + "' type='radio' " + disabled + "/>&nbsp;" + values[i] + "\n";
                }
            } else {
                for (var i = 0; i < values.length; i++) {
                    str += "	&nbsp;\n<br>\n";
                    str += "	{@eq key=" + value2 + " value=\"" + values[i] + "\" }";
                    str += "		<input class='form-control input' name='" + dataField + "' value='" + values[i] + "' type='radio' checked " + disabled + "/>&nbsp;" + values[i] + "\n";
                    str += "	{:else}";
                    str += "		<input class='form-control input' name='" + dataField + "' value='" + values[i] + "' type='radio' " + disabled + "/>&nbsp;" + values[i] + "\n";
                    str += "	{/eq}";
                }
            }
            break;
        case "enum" :
            if (file == "show") {
                str += "	<input class='form-control input' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='text' " + readOnly + "/>\n";
            } else if (file != "create") {
                str += "	<select style='width:100%;' class='form-control select' name='" + dataField + "' " + disabled + ">\n";
                str += "		<option value=''>{@__ key=\"select.default\" /}</option>\n";
                str += "		{#enum." + dataField + "}\n";
                str += "			{@eq key=" + value2 + " value=\"{.value}\" }\n";
                str += "				<option value=\"{.translation}\" selected> {.translation} </option>\n";
                str += "			{:else}\n"
                str += "				<option value=\"{.translation}\"> {.translation} </option>\n";
                str += "			{/eq}\n";
                str += "		{/enum." + dataField + "}\n";
                str += "	</select>";
            } else if (value != "") {
                str += "	<select style='width:100%;' class='form-control select' name='" + dataField + "' " + disabled + ">\n";
                str += "		<option value='' selected>{@__ key=\"select.default\" /}</option>\n";
                str += "		{#enum." + dataField + "}\n";
                str += "            {@eq key=\"" + value + "\" value=\"{.value}\" }\n";
                str += "                <option value=\"{.translation}\" selected> {.translation} </option>\n";
                str += "            {:else}\n"
                str += "                <option value=\"{.translation}\"> {.translation} </option>\n";
                str += "            {/eq}\n";
                str += "		{/enum." + dataField + "}\n";
                str += "	</select>";
            } else {
                str += "    <select style='width:100%;' class='form-control select' name='" + dataField + "' " + disabled + ">\n";
                str += "        <option value='' selected>{@__ key=\"select.default\" /}</option>\n";
                str += "        {#enum." + dataField + "}\n";
                str += "            <option value=\"{.translation}\"> {.translation} </option>\n";
                str += "        {/enum." + dataField + "}\n";
                str += "    </select>";
            }
            break;
        case "text" :
        case "texte" :
            str += "	<textarea class='form-control textarea' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' id='" + dataField + "_textareaid' value='" + value + "' type='text' " + readOnly + ">" + value + "</textarea>\n";
            break;
        case "localfile" :
        case "fichier":
        case "file":
            if (file != 'show') {
                str += "	<div class='dropzone dropzone-field' id='" + dataField + "_dropzone' data-storage='local' data-entity='" + dataEntity + "' ></div>\n";
                str += "	<input type='hidden' name='" + dataField + "' id='" + dataField + "_dropzone_hidden' value='" + value + "'/>";
            } else {
                str += "	<div class='input-group'>\n";
                str += "		<div class='input-group-addon'>\n";
                str += "			<i class='fa fa-download'></i>\n";
                str += "		</div>";
                str += "		<a href=/default/download?entity=" + dataEntity + "&f=" + value + " class='form-control btn btn-default text-left '  name=" + dataField + " " + readOnly + ">" + value + "</a>\n";
                str += "	</div>\n";
            }
            break;
        case "img":
        case "picture":
        case "image":
        case "photo":
            if (file != 'show') {
                str += "	<div class='dropzone dropzone-field' id='" + dataField + "_dropzone' data-storage='local' data-type='picture' data-entity='" + dataEntity + "' ></div>\n";
                str += "	<input type='hidden' name='" + dataField + "' id='" + dataField + "_dropzone_hidden' value='" + value + "'/>";
            } else {
                str += "	<div class='input-group'>\n";
                str += "            <a href=/default/download?entity=" + dataEntity + "&f={" + value2 + ".value} ><img src=data:image/;base64,{" + value2 + ".buffer}  class='img img-responsive' data-type='picture' alt=" + value + " name=" + dataField + "  " + readOnly + " height=200 width=200/></a>\n";
                str += "	</div>\n";
            }
            break;
        case "cloudfile" :
            str += "	<div class='dropzone dropzone-field' id='" + dataField + "_dropzone' data-storage='cloud' data-entity='" + dataEntity + "' ></div>\n";
            str += "	<input type='hidden' name='" + dataField + "' id='" + dataField + "_dropzone_hidden' />";
            break;
        default :
            console.log(type)
            str += "	<input class='form-control inputt' placeholder='{@__ key=|entity." + dataEntity + "." + dataField + "| /}' name='" + dataField + "' value='" + value + "' type='text' " + readOnly + "/>\n";
            break;
    }

    str += "</div>\n</div>";
    return str;
}

function getFieldInHeaderListHtml(type, nameDataField, nameDataEntity) {
    var dataEntity = nameDataEntity.toLowerCase();
    var dataField = nameDataField.toLowerCase();
    var ret = {headers: '', body: ''};
    /* ------------- Add new FIELD in headers ------------- */
    var str = '<th data-field="' + dataField + '" data-col="' + dataField + '"';
    str += ' data-type="' + type + '"';
    str += '>\n';
    str += '{@__ key="entity.' + dataEntity + '.' + dataField + '"/}\n';
    str += '</th>\n';
    ret.headers = str;
    /* ------------- Add new FIELD in body (for associations include in tabs) ----- */
    str = '<td data-field="' + dataField + '"';
    str += ' data-type="' + type + '"';
    if (type == "text")
        str += ' >{' + dataField + '|s}</td>';
    else
        str += ' >{' + dataField + '}</td>';
    ret.body = str;
    return ret;
}

function updateFile(fileBase, file, string, callback) {
    fileToWrite = fileBase + '/' + file + '.dust';
    domHelper.read(fileToWrite).then(function ($) {
        $("#fields").append(string);
        domHelper.write(fileToWrite, $).then(callback);
    })
}

function updateListFile(fileBase, file, thString, bodyString, callback) {
    fileToWrite = fileBase + '/' + file + '.dust';
    domHelper.read(fileToWrite).then(function ($) {
        // Count th to know where to insert new th (-3 because of actions th, show/update/delete)
        var thCount = $(".main").find('th').length - 3;
        // Add to header thead and filter thead
        $(".fields").each(function () {
            $(this).find('th').eq(thCount).before(thString);
        });
        // Add td to tbody, this will be used in case of belongsToMany or hasMany show association
        $("#bodyTR").find('td').eq(thCount).before(bodyString);
        // jsDom have difficulties parsing the context inside <tr> tag. We need to extract the content of
        // a bad <tr> that jsDom generates, place this content at the right place, then remove the extra <tr>
        // generated by jsDom.
        if ($("#bodyTR").parents('tbody').find('tr').length == 2) {
            var closingContext = $("#bodyTR").parents('tbody').find('tr:last').html();
            $("#bodyTR").parents('tbody').find('tr:last').remove();
            $("#bodyTR").parents('tbody').find('tr:last').after(closingContext);
        }

        // Write back to file
        domHelper.write(fileToWrite, $).then(callback);
    });
}

exports.setupDataField = function (attr, callback) {

    var id_application = attr.id_application;
    var name_module = attr.name_module;
    var name_data_entity = attr.name_data_entity;
    var codeName_data_entity = attr.codeName_data_entity;
    var type_data_field;
    var values_data_field;
    /* ----------------- 1 - Initialize variables according to options ----------------- */
    var options = attr.options;
    var name_data_field = options.value;
    var show_name_data_field = options.showValue;
    var defaultValue = null;
    if (typeof options.defaultValue !== "undefined")
        defaultValue = options.defaultValue;
    // If there is a WITH TYPE in the instruction
    if (typeof options.type !== "undefined")
        type_data_field = options.type.toLowerCase();
    else
        type_data_field = "string"

    // Cut allValues for ENUM or other type
    if (typeof options.allValues !== "undefined") {
        var values = options.allValues;
        if (values.indexOf(",") != -1) {
            values_data_field = values.split(",");
            for (var j = 0; j < values_data_field.length; j++) {
                values_data_field[j] = values_data_field[j].trim();
            }
        } else {
            values_data_field = values.split(" ");
        }
    }

    /* ----------------- 2 - Update the entity model, add the attribute ----------------- */

    // attributes.json
    var attributesFileName = './workspace/' + id_application + '/models/attributes/' + codeName_data_entity.toLowerCase() + '.json';
    var attributesFile = fs.readFileSync(attributesFileName);
    var attributesObject = JSON.parse(attributesFile);
    // toSync.json
    var toSyncFileName = './workspace/' + id_application + '/models/toSync.json';
    var toSyncFile = fs.readFileSync(toSyncFileName);
    var toSyncObject = JSON.parse(toSyncFile);
    if (typeof toSyncObject[id_application + "_" + codeName_data_entity.toLowerCase()] === "undefined") {
        toSyncObject[id_application + "_" + codeName_data_entity.toLowerCase()] = {};
        toSyncObject[id_application + "_" + codeName_data_entity.toLowerCase()].attributes = {};
    } else if (typeof toSyncObject[id_application + "_" + codeName_data_entity.toLowerCase()].attributes === "undefined") {
        toSyncObject[id_application + "_" + codeName_data_entity.toLowerCase()].attributes = {};
    }

    var typeForModel = "STRING";
    var typeForDatalist = "string";
    switch (type_data_field) {
        case "password" :
        case "mot de passe":
        case "secret":
            typeForModel = "STRING";
            break;
        case "color":
        case "colour":
        case "couleur":
            typeForModel = "STRING";
            typeForDatalist = "color";
            break;
        case "number" :
        case "int" :
        case "integer" :
        case "nombre" :
            typeForModel = "INTEGER";
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
            typeForModel = "STRING";
            typeForDatalist = "currency";
            break;
        case "float" :
        case "double" :
        case "decimal" :
        case "figures" :
            typeForModel = "STRING";
            break;
        case "date" :
            typeForModel = "DATE";
            typeForDatalist = "date";
            break;
        case "datetime" :
            typeForModel = "DATE";
            typeForDatalist = "datetime";
            break;
        case "time" :
        case "heure" :
            typeForModel = "TIME";
            typeForDatalist = "time";
            break;
        case "email" :
        case "mail" :
        case "e-mail" :
        case "mel" :
            typeForModel = "STRING";
            typeForDatalist = "email";
            break;
        case "phone" :
        case "tel" :
        case "téléphone" :
        case "portable" :
            typeForModel = "STRING";
            typeForDatalist = "tel";
            break;
        case "fax" :
            typeForModel = "STRING";
            break;
        case "checkbox" :
        case "boolean" :
        case "case à cocher" :
            typeForModel = "BOOLEAN";
            typeForDatalist = "boolean";
            break;
        case "radio" :
        case "case à sélectionner" :
            typeForModel = "STRING";
            break;
        case "enum" :
            typeForModel = "ENUM";
            typeForDatalist = "enum";
            break;
        case "text" :
        case "texte" :
            typeForModel = "TEXT";
            typeForDatalist = "text";
            break;
        case "localfile" :
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
            type_data_field = 'picture';
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
        case "alpha39":
        case "code128":
            typeForModel = "TEXT";
            typeForDatalist = "barcode";
            break;
        case "cloudfile" :
            typeForModel = "STRING";
            break;
        default :
            typeForModel = "STRING";
            break;
    }

    if (typeForModel == "ENUM") {
        attributesObject[name_data_field.toLowerCase()] = {
            "type": typeForModel,
            "values": values_data_field
        };
        toSyncObject[id_application + "_" + codeName_data_entity.toLowerCase()]["attributes"][name_data_field.toLowerCase()] = {
            "type": typeForModel,
            "values": values_data_field
        };
    } else {
        attributesObject[name_data_field.toLowerCase()] = {
            "type": typeForModel,
            "newmipsType": type_data_field
        };
        toSyncObject[id_application + "_" + codeName_data_entity.toLowerCase()]["attributes"][name_data_field.toLowerCase()] = typeForModel;
    }

    fs.writeFileSync(attributesFileName, JSON.stringify(attributesObject, null, 4));
    fs.writeFileSync(toSyncFileName, JSON.stringify(toSyncObject, null, 4));

    /* ----------------- 3 - If it's a select/enum  ----------------- */
    if (typeForModel == "ENUM") {
        var fileEnum = __dirname + '/../workspace/' + id_application + '/locales/enum.json';
        var enumData = require(fileEnum);
        var key = name_data_field.toLowerCase();
        var json = {};
        if (enumData[codeName_data_entity.toLowerCase()])
            json = enumData[codeName_data_entity.toLowerCase()];
        json[key] = [];
        for (var i = 0; i < values_data_field.length; i++) {
            json[key].push({
                value: values_data_field[i],
                translations: {
                    "fr-FR": values_data_field[i],
                    "en-EN": values_data_field[i]
                }
            });
        }
        enumData[codeName_data_entity.toLowerCase()] = json;

        // Write Enum file
        var stream_fileEnum = fs.createWriteStream(fileEnum);
        stream_fileEnum.write(JSON.stringify(enumData, null, 4));
        stream_fileEnum.end();
    }

    /* ----------------- 4 - Add the fields in all the views  ----------------- */
    var fileBase = __dirname + '/../workspace/' + id_application + '/views/' + codeName_data_entity.toLowerCase();
    /* Update the show_fields.dust file with a disabled input */
    var stringToWrite = getFieldHtml(type_data_field, name_data_field, codeName_data_entity, true, "show", values_data_field, defaultValue);
    updateFile(fileBase, "show_fields", stringToWrite, function () {
        /* Update the create_fields.dust file */
        stringToWrite = getFieldHtml(type_data_field, name_data_field, codeName_data_entity, false, "create", values_data_field, defaultValue);
        updateFile(fileBase, "create_fields", stringToWrite, function () {
            /* Update the update_fields.dust file */
            stringToWrite = getFieldHtml(type_data_field, name_data_field, codeName_data_entity, false, "update", values_data_field, defaultValue);
            updateFile(fileBase, "update_fields", stringToWrite, function () {
                /* Update the list_fields.dust file */
                stringToWrite = getFieldInHeaderListHtml(typeForDatalist, name_data_field, codeName_data_entity);
                updateListFile(fileBase, "list_fields", stringToWrite.headers, stringToWrite.body, function () {

                    /* --------------- New translation --------------- */
                    translateHelper.writeLocales(id_application, "field", codeName_data_entity, [name_data_field, show_name_data_field], attr.googleTranslate, function () {
                        callback(null, "Data field successfully created.");
                    });
                });
            });
        });
    });
}

exports.setRequiredAttribute = function (attr, callback) {

    var possibilityRequired = ["mandatory", "required", "obligatoire"];
    var possibilityOptionnal = ["optionnel", "non-obligatoire", "optional"];

    var attribute = attr.options.word.toLowerCase();
    var set = null;

    if (possibilityRequired.indexOf(attribute) != -1) {
        set = true;
    } else if (possibilityOptionnal.indexOf(attribute) != -1) {
        set = false;
    } else {
        var err = new Error();
        err.message = "structure.field.attributes.notUnderstand";
        return callback(err);
    }

    var pathToViews = __dirname + '/../workspace/' + attr.id_application + '/views/' + attr.name_data_entity.toLowerCase();

    // Update create_fields.dust file
    domHelper.read(pathToViews + '/create_fields.dust').then(function ($) {

        if ($("*[data-field='" + attr.options.value + "']").length > 0) {
            if (set)
                $("*[data-field='" + attr.options.value + "']").find('label').addClass('required');
            else
                $("*[data-field='" + attr.options.value + "']").find('label').removeClass('required');

            $("*[data-field='" + attr.options.value + "']").find('input').prop('required', set);
            $("*[data-field='" + attr.options.value + "']").find('select').prop('required', set);

            domHelper.write(pathToViews + '/create_fields.dust', $).then(function () {

                // Update update_fields.dust file
                domHelper.read(pathToViews + '/update_fields.dust').then(function ($) {
                    if (set)
                        $("*[data-field='" + attr.options.value + "']").find('label').addClass('required');
                    else
                        $("*[data-field='" + attr.options.value + "']").find('label').removeClass('required');
                    $("*[data-field='" + attr.options.value + "']").find('input').prop('required', set);
                    domHelper.write(pathToViews + '/update_fields.dust', $).then(function () {

                        // Update the Sequelize attributes.json to set allowNull
                        var pathToAttributesJson = __dirname + '/../workspace/' + attr.id_application + '/models/attributes/' + attr.name_data_entity.toLowerCase() + ".json";
                        var attributesContent = fs.readFileSync(pathToAttributesJson);
                        var attributesObj = JSON.parse(attributesContent);

                        attributesObj[attr.options.value].allowNull = set ? false : true;
                        fs.writeFileSync(pathToAttributesJson, JSON.stringify(attributesObj, null, 4));

                        callback();
                    });
                });
            });
        } else {
            var err = new Error();
            err.message = "structure.field.attributes.fieldNoFound";
            err.messageParams = [attr.options.showValue];
            callback(err, null);
        }
    }).catch(function (err) {
        callback(err, null);
    });
}

exports.setUniqueField = function (attr, callback) {

    var possibilityUnique = ["unique"];
    var possibilityNotUnique = ["not-unique", "non-unique"];

    var attribute = attr.options.word.toLowerCase();
    var set = null;

    var idApplication = attr.id_application;
    var codeName_data_entity = attr.name_data_entity.toLowerCase();

    if (possibilityUnique.indexOf(attribute) != -1) {
        set = true;
    } else if (possibilityNotUnique.indexOf(attribute) != -1) {
        set = false;
    } else {
        var err = new Error();
        err.message = "structure.field.attributes.notUnderstand";
        return callback(err);
    }

    // Update the Sequelize attributes.json to set unique
    var pathToAttributesJson = __dirname + '/../workspace/' + idApplication + '/models/attributes/' + codeName_data_entity + ".json";
    var attributesContent = fs.readFileSync(pathToAttributesJson);
    var attributesObj = JSON.parse(attributesContent);

    attributesObj[attr.options.value].unique = set ? true : false;
    fs.writeFileSync(pathToAttributesJson, JSON.stringify(attributesObj, null, 4));

    callback();
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

exports.setupHasManyTab = function (attr, callback) {
    var target = attr.options.target.toLowerCase();
    var showTarget = attr.options.showTarget.toLowerCase();
    var urlTarget = attr.options.urlTarget.toLowerCase();
    var source = attr.options.source.toLowerCase();
    var showSource = attr.options.showSource.toLowerCase();
    var urlSource = attr.options.urlSource.toLowerCase();
    var foreignKey = attr.options.foreignKey.toLowerCase();
    var alias = attr.options.as.toLowerCase();
    var showAlias = attr.options.showAs;
    var urlAs = attr.options.urlAs.toLowerCase();

    /* Add Alias in Translation file for tabs */
    var fileTranslationFR = __dirname + '/../workspace/' + attr.id_application + '/locales/fr-FR.json';
    var fileTranslationEN = __dirname + '/../workspace/' + attr.id_application + '/locales/en-EN.json';
    var dataFR = require(fileTranslationFR);
    var dataEN = require(fileTranslationEN);

    dataFR.entity[target]["as_" + alias] = showAlias;
    dataEN.entity[target]["as_" + alias] = showAlias;

    var stream_fileTranslationFR = fs.createWriteStream(fileTranslationFR);
    var stream_fileTranslationEN = fs.createWriteStream(fileTranslationEN);

    stream_fileTranslationFR.write(JSON.stringify(dataFR, null, 4));
    stream_fileTranslationFR.end();
    stream_fileTranslationFR.on('finish', function () {
        //console.log('File => Translation FR ------------------ UPDATED');
        stream_fileTranslationEN.write(JSON.stringify(dataEN, null, 4));
        stream_fileTranslationEN.end();
        stream_fileTranslationEN.on('finish', function () {
            //console.log('File => Translation EN ------------------ UPDATED');

            // Setup association tab for show_fields.dust
            var fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + source;
            var file = fileBase + '/show_fields.dust';

            // Create new tab button
            var newLi = '<li><a id="' + alias + '-click" data-toggle="tab" href="#' + alias + '">{@__ key="entity.' + target + '.as_' + alias + '" /}</a></li>';

            // Create new tab content
            var newTab = '';
            newTab += '	<div id="' + alias + '" class="tab-pane fade">\n';
            newTab += '		<!--{#' + alias + ' ' + target + '=' + alias + '}-->\n';
            newTab += '			<!--{@eq key=id value=' + target + '[0].id}-->\n';
            newTab += '				{>"' + target + '/list_fields" associationAlias="' + alias + '" associationForeignKey="' + foreignKey + '" associationFlag="{' + source + '.id}" associationSource="' + source + '" associationUrl="' + urlSource + '" for="hasMany" /}\n';
            newTab += '			<!--{/eq}-->\n';
            newTab += '		<!--{:else}-->\n';
            newTab += '				{>"' + target + '/list_fields" /}\n';
            newTab += '		<!--{/' + alias + '}-->\n';
            newTab += '		<br>\n';

            // Create button to directly associate created object to relation
            newTab += '		<a href="/' + urlTarget + '/create_form?associationAlias=' + alias + '&associationForeignKey=' + foreignKey + '&associationFlag={' + source + '.id}&associationSource=' + source + '&associationUrl=' + urlSource + '" class="btn btn-success">\n';
            newTab += '			<i class="fa fa-plus fa-md">&nbsp;&nbsp;</i><span>{@__ key="button.create"/}</span>\n';
            newTab += '		</a>\n';
            newTab += '</div>\n';

            addTab(attr, file, newLi, newTab).then(callback);
        });
    });
}

exports.setupRelatedToField = function (attr, callback) {
    var target = attr.options.target.toLowerCase();
    var showTarget = attr.options.showTarget.toLowerCase();
    var urlTarget = attr.options.urlTarget.toLowerCase();
    var source = attr.options.source.toLowerCase();
    var showSource = attr.options.showSource.toLowerCase();
    var urlSource = attr.options.urlSource.toLowerCase();
    var foreignKey = attr.options.foreignKey.toLowerCase();
    var alias = attr.options.as.toLowerCase();
    var showAlias = attr.options.showAs;
    var urlAs = attr.options.urlAs.toLowerCase();

    // Setup association field for create_fields
    var select = '';

    // Gestion du field à afficher dans le select du fieldset, par defaut c'est l'ID
    var usingField = "id";
    var usingFieldDisplay = "id";
    var typeField = "string";
    var usingExist = true;

    if (typeof attr.options.usingField !== "undefined") {
        usingExist = false;
        usingField = attr.options.usingField.toLowerCase();
        usingFieldDisplay = attr.options.showUsingField;
        var attributeTarget = require(__dirname + '/../workspace/' + attr.id_application + '/models/attributes/' + target);
        if (typeof attributeTarget[usingField] !== "undefined") {
            usingExist = true;
            typeField = attributeTarget[usingField].newmipsType;
        }
    }

    select += "<div data-field='f_" + urlAs + "' class='col-xs-12'>\n<div class='form-group'>";
    /*select += '<!--{^associationFlag}-->';*/
    select += '		<label for="f_' + urlAs + '">{@__ key="entity.' + source + '.' + alias + '" /}</label>\n';
    select += '		<select style="width:100%;" class="form-control" name="' + alias + '">\n';
    select += '			<!--{#' + alias + '}-->\n';
    select += '				<!--{#.' + usingField + '}-->\n';
    select += '						<option value="{id}">{' + usingField + '}</option>\n';
    select += '				<!--{:else}-->\n';
    select += '						<option value="{id}">{id} - ' + usingFieldDisplay + ' not defined</option>\n';
    select += '				<!--{/.' + usingField + '}-->\n';
    select += '			<!--{/' + alias + '}-->\n';
    select += '		</select>\n';
    /*select += '<!--{/associationFlag}-->';*/
    select += '</div>\n</div>';

    // Update create_fields file
    var fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + source;
    var file = 'create_fields';
    updateFile(fileBase, file, select, function () {

        // Setup association field for update_fields
        select = "<div data-field='f_" + urlAs + "' class='col-xs-12'>\n<div class='form-group'>";
        select += '<label for="f_' + urlAs + '">{@__ key="entity.' + source + '.' + alias + '" /}</label>\n';
        select += '<select style="width:100%;" class="form-control" name="' + alias + '">\n';
        select += '		<!--{#' + alias + '_global_list}-->\n';
        select += '			<!--{#.' + usingField + '}-->\n';
        select += '				<!--{@eq key=' + alias + '.id value=id}-->\n';
        select += '					<option value="{id}" selected>{' + usingField + '}</option>\n';
        select += '				<!--{:else}-->\n';
        select += '					<option value="{id}">{' + usingField + '}</option>\n';
        select += '				<!--{/eq}-->\n';
        select += '			<!--{:else}-->\n';
        select += '				<!--{@eq key=' + alias + '.id value=id}-->\n';
        select += '					<option value="{id}" selected>{id} - ' + usingFieldDisplay + ' not defined</option>\n';
        select += '				<!--{:else}-->\n';
        select += '					<option value="{id}">{id} - ' + usingFieldDisplay + ' not defined</option>\n';
        select += '				<!--{/eq}-->\n';
        select += '			<!--{/.' + usingField + '}-->\n';
        select += '		<!--{/' + alias + '_global_list}-->\n';
        select += '</select>\n';
        select += '</div>\n</div>';
        file = 'update_fields';

        // Update update_fields file
        updateFile(fileBase, file, select, function () {

            // Setup association tab for show_fields.dust
            file = fileBase + '/show_fields.dust';
            domHelper.read(file).then(function ($) {

                /* If the field in the target doesn't exist we use the id for show and list */
                if (!usingExist)
                    usingField = "id";

                // Add read only field in show file. No tab required
                var str = "";
                str = "<div data-field='" + alias + "' class='col-xs-12'>\n</div>";
                str += "\t<label for='" + alias + "'> {@__ key=\"entity." + source + "." + alias + "\"/} </label>\n";
                str += "	<input class='form-control input' placeholder='{@__ key=|entity." + source + "." + alias + "| /}' name='" + alias + "' value='{" + alias + "." + usingField + "}' type='text' readOnly />\n";
                str += "</div>\n</div>\n";
                $("#fields").append(str);

                domHelper.write(file, $).then(function () {

                    // Add <th> in list_field
                    var toAddInList = {headers: '', body: ''};
                    /* ------------- Add new FIELD in headers ------------- */
                    var str = '<th data-field="f_' + alias.substring(2) + '" data-col="' + alias + '.' + usingField + '"';
                    if (typeField == "date")
                        str += ' data-type="date"';
                    else if (typeField == "datetime")
                        str += ' data-type=\'datetime\'';
                    else if (typeField == "time")
                        str += ' data-type=\'time\'';
                    else if (typeField == "boolean")
                        str += ' data-type=\'boolean\'';
                    str += '>\n';
                    str += '{@__ key="entity.' + source + '.' + alias + '"/}\n';
                    str += '</th>\n';
                    toAddInList.headers = str;

                    /* ------------- Add new FIELD in body (for associations include in tabs) ----- */
                    str = '<td data-field="f_' + alias.substring(2) + '"';
                    if (typeField == "date")
                        str += ' data-type=\'date\'';
                    else if (typeField == "datetime")
                        str += ' data-type=\'datetime\'';
                    else if (typeField == "time")
                        str += ' data-type=\'time\'';
                    else if (typeField == "boolean")
                        str += ' data-type=\'boolean\'';
                    str += ' >{' + alias + '.' + usingField + '}</td>';
                    toAddInList.body = str;

                    updateListFile(fileBase, "list_fields", toAddInList.headers, toAddInList.body, function () {
                        /* --------------- New translation --------------- */
                        translateHelper.writeLocales(attr.id_application, "aliasfield", source, [alias, showAlias], attr.googleTranslate, function () {
                            callback(null, "Data field successfully created");
                        });
                    });

                });
            });
        });
    });
}

exports.setupHasOneTab = function (attr, callback) {
    var target = attr.options.target.toLowerCase();
    var showTarget = attr.options.showTarget.toLowerCase();
    var urlTarget = attr.options.urlTarget.toLowerCase();
    var source = attr.options.source.toLowerCase();
    var showSource = attr.options.showSource.toLowerCase();
    var urlSource = attr.options.urlSource.toLowerCase();
    var foreignKey = attr.options.foreignKey.toLowerCase();
    var alias = attr.options.as.toLowerCase();
    var showAlias = attr.options.showAs;
    var urlAs = attr.options.urlAs.toLowerCase();

    /* Add Alias in Translation file for tabs */
    var fileTranslationFR = __dirname + '/../workspace/' + attr.id_application + '/locales/fr-FR.json';
    var fileTranslationEN = __dirname + '/../workspace/' + attr.id_application + '/locales/en-EN.json';
    var dataFR = require(fileTranslationFR);
    var dataEN = require(fileTranslationEN);

    dataFR.entity[target]["as_" + alias] = showAlias;
    dataEN.entity[target]["as_" + alias] = showAlias;

    var stream_fileTranslationFR = fs.createWriteStream(fileTranslationFR);
    var stream_fileTranslationEN = fs.createWriteStream(fileTranslationEN);

    stream_fileTranslationFR.write(JSON.stringify(dataFR, null, 2));
    stream_fileTranslationFR.end();
    stream_fileTranslationFR.on('finish', function () {
        //console.log('File => Translation FR ------------------ UPDATED');
        stream_fileTranslationEN.write(JSON.stringify(dataEN, null, 2));
        stream_fileTranslationEN.end();
        stream_fileTranslationEN.on('finish', function () {
            //console.log('File => Translation EN ------------------ UPDATED');

            // Setup association tab for show_fields.dust
            var fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + source;
            var file = fileBase + '/show_fields.dust';

            // Create new tab button
            var newLi = '<li><a id="' + alias + '-click" data-toggle="tab" href="#' + alias + '">{@__ key="entity.' + target + '.as_' + alias + '" /}</a></li>';

            // Create new tab content
            var newTab = '';
            newTab += '<div id="' + alias + '" class="tab-pane fade">\n';

            // Include association's fields
            newTab += '<!--{#' + alias + '}-->\n';
            newTab += '	{>"' + target + '/show_fields" /}\n';
            newTab += '<!--{:else}-->\n';
            newTab += ' {@__ key="message.empty" /}<br><br>\n';
            newTab += '<!--{/' + alias + '}-->\n';

            newTab += '<!--{#' + alias + '}-->\n';
            newTab += '		<form action="/' + urlTarget + '/delete" method="post">\n';
            newTab += '			<a style="margin-right:8px;" href="/' + urlTarget + '/update_form?id={id}&associationAlias=' + alias + '&associationForeignKey=' + foreignKey + '&associationFlag={' + source + '.id}&associationSource=' + source + '&associationUrl=' + urlSource + '" class="btn btn-warning">\n';
            newTab += '				<i class="fa fa-pencil fa-md">&nbsp;&nbsp;</i><span>{@__ key="button.update"/}</span>\n';
            newTab += '			</a>\n';
            newTab += '			<button onclick="return confirm("Etes-vous sûr de vouloir supprimer cet enregistrement ?");" class="btn btn-danger"><i class="fa fa-trash-o fa-md">&nbsp;&nbsp;</i>\n';
            newTab += '				<span>{@__ key="button.delete" /}</span>\n';
            newTab += '				<input name="id" value="{id}" type="hidden"/>\n';
            newTab += '				<input name="associationAlias" value="' + alias + '" type="hidden"/>\n';
            newTab += '				<input name="associationForeignKey" value="' + foreignKey + '" type="hidden"/>\n';
            newTab += '				<input name="associationFlag" value="{' + source + '.id}" type="hidden"/>\n';
            newTab += '				<input name="associationSource" value="' + source + '" type="hidden"/>\n';
            newTab += '				<input name="associationUrl" value="' + urlSource + '" type="hidden"/>\n';
            newTab += '			</button>\n';
            newTab += '		</form>\n';
            newTab += '<!--{:else}-->\n';
            // Create button to directly associate created object to relation
            newTab += '		<a href="/' + urlTarget + '/create_form?associationAlias=' + alias + '&associationForeignKey=' + foreignKey + '&associationFlag={' + source + '.id}&associationSource=' + source + '&associationUrl=' + urlSource + '" class="btn btn-success">\n';
            newTab += '			<i class="fa fa-plus fa-md">&nbsp;&nbsp;</i><span>{@__ key="button.create"/}</span>\n';
            newTab += '		</a>\n';
            newTab += '<!--{/' + alias + '}-->\n';

            newTab += '</div>\n';

            addTab(attr, file, newLi, newTab).then(callback);
        });
    });
}

exports.setupFieldsetTab = function (attr, callback) {
    var target = attr.options.target.toLowerCase();
    var showTarget = attr.options.showTarget.toLowerCase();
    var urlTarget = attr.options.urlTarget.toLowerCase();
    var source = attr.options.source.toLowerCase();
    var showSource = attr.options.showSource.toLowerCase();
    var urlSource = attr.options.urlSource.toLowerCase();
    var foreignKey = attr.options.foreignKey.toLowerCase();
    var alias = attr.options.as.toLowerCase();
    var showAlias = attr.options.showAs;
    var urlAs = attr.options.urlAs.toLowerCase();

    /* Add Alias in Translation file for tabs */
    var fileTranslationFR = __dirname + '/../workspace/' + attr.id_application + '/locales/fr-FR.json';
    var fileTranslationEN = __dirname + '/../workspace/' + attr.id_application + '/locales/en-EN.json';
    var dataFR = require(fileTranslationFR);
    var dataEN = require(fileTranslationEN);

    dataFR.entity[target]["as_" + alias] = showAlias;
    dataEN.entity[target]["as_" + alias] = showAlias;

    var stream_fileTranslationFR = fs.createWriteStream(fileTranslationFR);
    var stream_fileTranslationEN = fs.createWriteStream(fileTranslationEN);

    stream_fileTranslationFR.write(JSON.stringify(dataFR, null, 4));
    stream_fileTranslationFR.end();
    stream_fileTranslationFR.on('finish', function () {
        //console.log('File => Translation FR ------------------ UPDATED');
        stream_fileTranslationEN.write(JSON.stringify(dataEN, null, 4));
        stream_fileTranslationEN.end();
        stream_fileTranslationEN.on('finish', function () {
            //console.log('File => Translation EN ------------------ UPDATED');

            // Gestion du field à afficher dans le select du fieldset, par defaut c'est l'ID
            var usingField = "id";
            var usingFieldDisplay = "id";

            if (typeof attr.options.usingField !== "undefined") {
                usingField = attr.options.usingField.toLowerCase();
                usingFieldDisplay = attr.options.usingField;
            }

            // Setup association tab for show_fields.dust
            var fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + source;
            var file = fileBase + '/show_fields.dust';

            var newLi = '<li><a id="' + alias + '-click" data-toggle="tab" href="#' + alias + '">{@__ key="entity.' + target + '.as_' + alias + '" /}</a></li>';

            var newTabContent = '';
            // Create select to add elements
            newTabContent += '<div id="' + alias + '" class="tab-pane fade">\n';
            newTabContent += '	<form action="/' + urlSource + '/fieldset/' + alias + '/add" method="post">\n';
            newTabContent += '		<select style="width:200px;" class="form-control" name="ids" multiple>\n';
            newTabContent += '			<!--{#' + alias + '_global_list}-->\n';
            newTabContent += '				<!--{#.' + usingField + '}-->\n';
            newTabContent += '						<option value="{id}">{' + usingField + '}</option>\n';
            newTabContent += '				<!--{:else}-->\n';
            newTabContent += '						<option value="{id}">{id} - ' + usingFieldDisplay + ' not defined</option>\n';
            newTabContent += '				<!--{/.' + usingField + '}-->\n';
            newTabContent += '			<!--{/' + alias + '_global_list}-->\n';
            newTabContent += '		</select>\n';
            newTabContent += '		<button style="margin-left:7px;" type="submit" class="btn btn-success">{@__ key="button.add"/}</button>\n';
            newTabContent += '		<input type="hidden" value="{' + source + '.id}" name="idEntity">\n';
            newTabContent += '	</form>\n';
            newTabContent += '	<br>\n';
            // Include association's fields
            newTabContent += '	<!--{#' + alias + ' ' + target + '=' + alias + '}-->\n';
            newTabContent += '			<!--{@eq key=id value=' + target + '[0].id}-->\n';
            newTabContent += '		{>"' + target + '/list_fields" for="fieldset" /}\n';
            newTabContent += '			<!--{/eq}-->\n';
            newTabContent += '	<!--{:else}-->\n';
            newTabContent += '			{>"' + target + '/list_fields" /}\n';
            newTabContent += '	<!--{/' + alias + '}-->\n';
            newTabContent += '</div>\n';

            addTab(attr, file, newLi, newTabContent).then(callback);
        });
    });
}

exports.deleteDataField = function (attr, callback) {
    var id_application = attr.id_application;
    var name_data_entity = attr.name_data_entity.toLowerCase();
    var show_name_data_field = attr.options.showValue.toLowerCase();
    var name_data_field = attr.options.value.toLowerCase();
    var url_value = attr.options.urlValue.toLowerCase();

    var options = attr.options;

    var dataToWrite;
    var isInOptions = false;
    var info = {};

    // Check if field is in options with relation=belongsTo, it means its a relatedTo association and not a simple field
    var jsonPath = __dirname + '/../workspace/' + attr.id_application + '/models/options/' + name_data_entity + '.json';

    // Clear the require cache
    delete require.cache[require.resolve(jsonPath)];
    var dataToWrite = require(jsonPath);

    for (var i = 0; i < dataToWrite.length; i++) {
        if (dataToWrite[i].as.toLowerCase() == "r_" + url_value) {
            if (dataToWrite[i].relation != 'belongsTo') {
                var err = new Error();
                err.message = name_data_entity + ' isn\'t a regular field. You might want to use `delete tab` instruction.';
                return callback(err, null);
            }

            // Modify the options.json file
            info.fieldToDrop = dataToWrite[i].foreignKey;
            info.isConstraint = true;
            dataToWrite.splice(i, 1);
            isInOptions = true;
            break;
        }
    }
    // Nothing found in options, field is regular, modify the attributes.json file
    if (!isInOptions) {
        jsonPath = __dirname + '/../workspace/' + id_application + '/models/attributes/' + name_data_entity + '.json';
        dataToWrite = require(jsonPath);
        dataToWrite[name_data_field] = undefined;
        info.fieldToDrop = name_data_field;
        info.isConstraint = false;
    }

    // Write back either options.json or attributes.json file
    var writeStream = fs.createWriteStream(jsonPath);
    writeStream.write(JSON.stringify(dataToWrite, null, 4));
    writeStream.end();
    writeStream.on('finish', function () {
        // Remove field from create/update/show views files
        var viewsPath = __dirname + '/../workspace/' + id_application + '/views/' + name_data_entity + '/';
        var fieldsFiles = ['create_fields', 'update_fields', 'show_fields'];
        var promises = [];
        for (var i = 0; i < fieldsFiles.length; i++)
            promises.push(new Promise(function (resolve, reject) {
                (function (file) {
                    domHelper.read(file).then(function ($) {
                        $('*[data-field="' + name_data_field + '"]').remove();
                        domHelper.write(file, $).then(function () {
                            resolve();
                        });
                    });
                })(viewsPath + '/' + fieldsFiles[i] + '.dust');
            }));

        // Remove field from list view file
        promises.push(new Promise(function (resolve, reject) {
            domHelper.read(viewsPath + '/list_fields.dust').then(function ($) {
                $("th[data-field='" + name_data_field + "']").remove();
                $("td[data-field='" + name_data_field + "']").remove();
                domHelper.write(viewsPath + '/list_fields.dust', $).then(function () {
                    resolve();
                });
            });
        }));

        // Wait for all promises execution
        Promise.all(promises).then(function () {

            // Remove translation in enum locales
            var enumsPath = __dirname + '/../workspace/' + id_application + '/locales/enum.json';
            var enumJson = require(enumsPath);

            if (typeof enumJson[name_data_entity] !== "undefined") {
                if (typeof enumJson[name_data_entity][info.fieldToDrop] !== "undefined") {
                    delete enumJson[name_data_entity][info.fieldToDrop];
                    fs.writeFileSync(enumsPath, JSON.stringify(enumJson, null, 4));
                }
            }

            // Remove translation in global locales
            var fieldToDropInTranslate = info.isConstraint ? "r_" + url_value : info.fieldToDrop;
            translateHelper.removeLocales(id_application, "field", [name_data_entity, fieldToDropInTranslate], function () {
                callback(null, info);
            });
        });
    });
}

exports.deleteTab = function (attr, callback) {
    var tabName = attr.options.value.toLowerCase();
    var showTabName = attr.options.showValue.toLowerCase();
    var tabNameWithoutPrefix = attr.options.urlValue.toLowerCase();
    var name_data_entity = attr.name_data_entity.toLowerCase();
    var show_name_data_entity = attr.show_name_data_entity.toLowerCase();
    var id_data_entity = attr.id_data_entity;
    var id_application = attr.id_application;
    var target;

    var jsonPath = __dirname + '/../workspace/' + attr.id_application + '/models/options/' + name_data_entity + '.json';
    var options = require(jsonPath);
    var found = false;
    var option;

    for (var i = 0; i < options.length; i++) {
        if (options[i].as.toLowerCase() !== "r_" + tabNameWithoutPrefix)
            continue;
        option = options[i];
        if (options[i].relation == 'hasMany')
            target = option.target;
        else
            target = name_data_entity;
        options.splice(i, 1);
        found = true;
        break;
    }
    if (!found) {
        var err = new Error();
        err.message = "structure.association.error.unableTab";
        err.messageParams = [attr.options.showValue];
        return callback(err, null);
    }
    var writeStream = fs.createWriteStream(jsonPath);
    writeStream.write(JSON.stringify(options, null, 4));
    writeStream.end();
    writeStream.on('finish', function () {
        var showFile = __dirname + '/../workspace/' + attr.id_application + '/views/' + name_data_entity + '/show_fields.dust';
        domHelper.read(showFile).then(function ($) {
            // Remove tab (<li>)
            $("#r_" + tabNameWithoutPrefix + "-click").parents('li').remove();
            // Remove tab content
            $("#r_" + tabNameWithoutPrefix).remove();

            domHelper.write(showFile, $).then(function () {
                callback(null, option.foreignKey, target);
            }).catch(function (err) {
                callback(err, null);
            });
        }).catch(function (err) {
            callback(err, null);
        });
    });
}
