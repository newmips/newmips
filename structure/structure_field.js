var fs = require("fs-extra");
var domHelper = require('../utils/jsDomHelper');
var translateHelper = require("../utils/translate");
var helpers = require("../utils/helpers");
var dataHelper = require("../utils/data_helper");
var printHelper = require("../utils/print_helper");
var moment = require("moment");

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
    let disabled = readOnly ? 'disabled' : '';
    readOnly = readOnly ? 'readOnly' : '';

    let str = `\
    <div data-field='${field}' class='fieldLineHeight col-xs-12'>\n\
        <div class='form-group'>\n\
            <label for='${field}'>\n\
                <!--{#__ key=\"entity.${entity}.${field}"/}-->&nbsp;\n\
                <!--{@inline_help field="${field}"}-->\n\
                    <i data-field="${field}" class="inline-help fa fa-info-circle" style="color: #1085EE;"></i>\n\
                <!--{/inline_help}-->\n\
            </label>\n`;

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
            str += "        <input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='color' " + readOnly + " " + disabled + "/>\n";
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
            str += "    <div class='input-group'>\n";
            str += "        <div class='input-group-addon'>\n";
            str += "            <i class='fa fa-euro'></i>\n";
            str += "        </div>\n";
            str += "        <input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' data-type='currency' " + readOnly + "/>\n";
            str += "    </div>\n";
            break;
        case "qrcode":
            str += "	<div class='input-group'>\n";
            str += "		<div class='input-group-addon'>\n";
            str += "			<i class='fa fa-qrcode'></i>\n";
            str += "		</div>\n";
            if (file == "show")
                str += "	<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "'  type='text' data-type='qrcode' " + readOnly + "/>\n";
            else
                str += "	<input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "'  type='text'" + readOnly + "/>\n";
            str += "	</div>\n";
            break;
        case "ean8":
        case "ean13":
        case "upc":
        case "code39":
        case "code128":
            var inputType = 'number';
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
                str += "    <br><a href='" + value + "' target='_blank' type='url' data-type='url' style='display: table-cell;padding-right: 5px;'>" + value + "</a>\n";
                str += "    <!--{?" + value2 + "}-->"
                str += "    <div class='copy-button'>\n";
                str += "        <i class='fa fa-copy'></i>\n";
                str += "    </div>\n";
                str += "    <!--{/" + value2 + "}-->"
            } else {
                str += "    <div class='input-group'>\n";
                str += "        <div class='input-group-addon'>\n";
                str += "            <i class='fa fa-link'></i>\n";
                str += "        </div>\n";
                str += "    <input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='url' data-type='url' " + readOnly + "/>\n";
                str += "    </div>\n";
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
            str += "        <input class='form-control input' data-custom-type='decimal' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' " + readOnly + "/>\n";
            break;
        case "date" :
            str += "   <div class='input-group'>\n";
            str += "        <div class='input-group-addon'>\n";
            str += "            <i class='fa fa-calendar'></i>\n";
            str += "        </div>\n";
            if (file == "show") {
                str += "        <input class='form-control input datepicker-toconvert' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' " + readOnly + "/>\n";
            } else if (file == "update") {
                str += "        <input class='form-control input datepicker datepicker-toconvert' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' " + readOnly + "/>\n";
            } else if (file == "create") {
                str += "        <input class='form-control input datepicker datepicker-toconvert' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' " + value + " type='text' " + readOnly + "/>\n";
            }
            str += "    </div>\n";
            break;
        case "datetime" :
            str += "    <div class='input-group'>\n";
            str += "        <div class='input-group-addon'>\n";
            str += "            <i class='fa fa-calendar'></i> + <i class='fa fa-clock-o'></i>\n";
            str += "        </div>\n";
            if (file == "show")
                str += "        <input class='form-control input datetimepicker-toconvert' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' value='" + value + "' type='text' " + readOnly + "/>\n";
            else if (file == "update")
                str += "        <input class='form-control input datetimepicker datetimepicker-toconvert' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' " + readOnly + "/>\n";
            else if (file == "create")
                str += "        <input class='form-control input datetimepicker datetimepicker-toconvert' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' " + value + " type='text' " + readOnly + "/>\n";
            str += "    </div>\n";
            break;
        case "time" :
        case "heure" :
            if (file == "show") {
                str += "    <div class='bootstrap-timepicker'>\n";
                str += "        <div class='input-group'>\n";
                str += "            <div class='input-group-addon'>\n";
                str += "                <i class='fa fa-clock-o'></i>\n";
                str += "            </div>\n";
                str += "            <input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='{" + value2 + "|time}' type='text' " + readOnly + "/>\n";
                str += "        </div>\n";
                str += "    </div>\n";
            } else {
                str += "    <div class='bootstrap-timepicker'>\n";
                str += "        <div class='input-group'>\n";
                str += "            <div class='input-group-addon'>\n";
                str += "                <i class='fa fa-clock-o'></i>\n";
                str += "            </div>\n";
                str += "            <input class='form-control input timepicker' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' " + readOnly + "/>\n";
                str += "        </div>\n";
                str += "    </div>\n";
            }
            break;
        case "email" :
        case "mail" :
        case "e-mail" :
        case "mel" :
            str += "    <div class='input-group'>\n";
            str += "        <div class='input-group-addon'>\n";
            str += "            <i class='fa fa-envelope'></i>\n";
            str += "        </div>\n";
            str += "        <input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' data-type='email' " + readOnly + "/>\n";
            str += "    </div>\n";
            break;
        case "tel" :
        case "téléphone" :
        case "portable" :
        case "phone" :
            str += "    <div class='input-group'>\n";
            str += "        <div class='input-group-addon'>\n";
            str += "            <i class='fa fa-phone'></i>\n";
            str += "        </div>\n";
            str += "        <input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='tel' " + readOnly + "/>\n";
            str += "    </div>\n";
            break;
        case "fax" :
            str += "    <div class='input-group'>\n";
            str += "        <div class='input-group-addon'>\n";
            str += "            <i class='fa fa-fax'></i>\n";
            str += "        </div>\n";
            str += "        <input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='number' " + readOnly + "/>\n";
            str += "    </div>\n";
            break;
        case "boolean" :
        case "checkbox" :
        case "case à cocher" :
            str += "    &nbsp;\n<br>\n";
            if (file == "create") {
                if (value === true)
                    str += "    <input class='form-control input' name='" + field + "' type='checkbox' checked />\n";
                else
                    str += "    <input class='form-control input' name='" + field + "' type='checkbox' />\n";
            } else {
                str += "    <!--{@ifTrue key=" + field + "}-->";
                str += "        <input class='form-control input' name='" + field + "' value='" + value + "' type='checkbox' checked " + disabled + "/>\n";
                str += "    <!--{:else}-->";
                str += "        <input class='form-control input' name='" + field + "' value='" + value + "' type='checkbox' " + disabled + "/>\n";
                str += "    <!--{/ifTrue}-->";
            }
            break;
        case "radio" :
        case "case à sélectionner" :
            var clearValues = [];
            var clearDefaultValue = "";
            for (var i = 0; i < values.length; i++)
                clearValues[i] = dataHelper.clearString(values[i]);

            if (typeof defaultValue !== "undefined" && defaultValue != "" && defaultValue != null)
                clearDefaultValue = dataHelper.clearString(defaultValue);

            if (file == "create") {
                if (clearDefaultValue != "") {
                    str += "<!--{#enum_radio." + entity + "." + field + "}-->\n";
                    str += "    &nbsp;\n<br>\n";
                    str += "    <label class='no-weight'>";
                    str += "    <!--{@eq key=\"" + clearDefaultValue + "\" value=\"{.value}\" }-->\n";
                    str += "        <input class='form-control input' name='" + field + "' value='{.value}' checked type='radio' " + disabled + "/>&nbsp;{.translation}\n";
                    str += "    <!--{:else}-->\n";
                    str += "        <input class='form-control input' name='" + field + "' value='{.value}' type='radio' " + disabled + "/>&nbsp;{.translation}\n";
                    str += "    <!--{/eq}-->\n";
                    str += "    </label>";
                    str += "<!--{/enum_radio." + entity + "." + field + "}-->\n";
                } else {
                    str += "<!--{#enum_radio." + entity + "." + field + "}-->\n";
                    str += "    &nbsp;\n<br>\n";
                    str += "    <label class='no-weight'>";
                    str += "    <input class='form-control input' name='" + field + "' value='{.value}' type='radio' " + disabled + "/>&nbsp;{.translation}\n";
                    str += "    </label>";
                    str += "<!--{/enum_radio." + entity + "." + field + "}-->\n";
                }
            } else if (file == "show") {
                str += "<!--{#enum_radio." + entity + "." + field + "}-->\n";
                str += "    &nbsp;\n<br>\n";
                str += "    <label class='no-weight'>";
                str += "    <!--{@eq key=" + value2 + " value=\"{.value}\" }-->\n";
                str += "        <input class='form-control input' name='" + entity + "." + field + "' value='{.value}' checked type='radio' " + disabled + "/>&nbsp;{.translation}\n";
                str += "    <!--{:else}-->\n";
                str += "        <input class='form-control input' name='" + entity + "." + field + "' value='{.value}' type='radio' " + disabled + "/>&nbsp;{.translation}\n";
                str += "    <!--{/eq}-->\n";
                str += "    </label>";
                str += "<!--{/enum_radio." + entity + "." + field + "}-->\n";
            } else {
                str += "<!--{#enum_radio." + entity + "." + field + "}-->\n";
                str += "    &nbsp;\n<br>\n";
                str += "    <label class='no-weight'>";
                str += "    <!--{@eq key=" + value2 + " value=\"{.value}\" }-->\n";
                str += "        <input class='form-control input' name='" + field + "' value='{.value}' checked type='radio' " + disabled + "/>&nbsp;{.translation}\n";
                str += "    <!--{:else}-->\n";
                str += "        <input class='form-control input' name='" + field + "' value='{.value}' type='radio' " + disabled + "/>&nbsp;{.translation}\n";
                str += "    <!--{/eq}-->\n";
                str += "    </label>";
                str += "<!--{/enum_radio." + entity + "." + field + "}-->\n";
            }
            break;
        case "enum" :
            if (file == "show") {
                str += "    <!--{^" + value2 + "}-->\n";
                str += "        <input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' type='text' " + readOnly + "/>\n";
                str += "    <!--{/" + value2 + "}-->\n";
                str += "    <!--{#enum_radio." + entity + "." + field + "}-->\n";
                str += "        <!--{@eq key=" + value2 + " value=\"{.value}\" }-->\n";
                str += "            <input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='{.translation}' type='text' " + readOnly + "/>\n";
                str += "        <!--{/eq}-->\n";
                str += "    <!--{/enum_radio." + entity + "." + field + "}-->\n";
            } else if (file != "create") {
                str += "    <select class='form-control select' name='" + field + "' " + disabled + " width='100%'>\n";
                str += "        <option value=''><!--{#__ key=\"select.default\" /}--></option>\n";
                str += "        <!--{#enum_radio." + entity + "." + field + "}-->\n";
                str += "            <!--{@eq key=" + value2 + " value=\"{.value}\" }-->\n";
                str += "                <option value=\"{.value}\" selected> {.translation} </option>\n";
                str += "            <!--{:else}-->\n";
                str += "                <option value=\"{.value}\"> {.translation} </option>\n";
                str += "            <!--{/eq}-->\n";
                str += "        <!--{/enum_radio." + entity + "." + field + "}-->\n";
                str += "    </select>\n";
            } else if (value != "") {
                str += "    <select class='form-control select' name='" + field + "' " + disabled + " width='100%'>\n";
                str += "        <option value=''><!--{#__ key=\"select.default\" /}--></option>\n";
                str += "        <!--{#enum_radio." + entity + "." + field + "}-->\n";
                str += "            <!--{@eq key=\"" + value + "\" value=\"{.value}\" }-->\n";
                str += "                <option value=\"{.value}\" selected> {.translation} </option>\n";
                str += "            <!--{:else}-->\n";
                str += "                <option value=\"{.value}\"> {.translation} </option>\n";
                str += "            <!--{/eq}-->\n";
                str += "        <!--{/enum_radio." + entity + "." + field + "}-->\n";
                str += "    </select>\n";
            } else {
                str += "    <select class='form-control select' name='" + field + "' " + disabled + " width='100%'>\n";
                str += "        <option value='' selected><!--{#__ key=\"select.default\" /}--></option>\n";
                str += "        <!--{#enum_radio." + entity + "." + field + "}-->\n";
                str += "            <option value=\"{.value}\"> {.translation} </option>\n";
                str += "        <!--{/enum_radio." + entity + "." + field + "}-->\n";
                str += "    </select>\n";
            }
            break;
        case "text" :
        case "texte" :
            if (file == 'show')
                str += "    <div class='show-textarea'>{" + field + "|s}</div>\n";
            else if (file == 'create')
                str += "    <textarea class='form-control textarea' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' id='" + field + "_textareaid' type='text' " + readOnly + ">" + value + "</textarea>\n";
            else
                str += "    <textarea class='form-control textarea' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' id='" + field + "_textareaid' type='text' " + readOnly + ">{" + value2 + "|s}</textarea>\n";

            break;
        case "regular text" :
        case "texte standard" :
            value = "{" + field + "|s}";
            if (file == 'show')
                str += "    <textarea readonly='readonly' class='show-textarea regular-textarea'>" + value + "</textarea>\n";
            else
                str += "    <textarea class='form-control textarea regular-textarea' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' id='" + field + "_textareaid' type='text' " + readOnly + ">" + value + "</textarea>\n";
            break;
        case "localfile" :
        case "fichier":
        case "file":
            if (file != 'show') {
                str += "    <div class='dropzone dropzone-field' id='" + field + "_dropzone' data-storage='local' data-entity='" + entity + "' ></div>\n";
                str += "    <input type='hidden' name='" + field + "' id='" + field + "_dropzone_hidden' value='" + value + "'/>\n";
            } else {
                str += "    <div class='input-group'>\n";
                str += "        <div class='input-group-addon'>\n";
                str += "            <i class='fa fa-download'></i>\n";
                str += "        </div>\n";
                str += "        <a href=/default/download?entity=" + entity + "&f={" + value2 + "|urlencode} class='form-control text-left' name=" + field + ">{" + value2 + "|filename}</a>\n";
                str += "    </div>\n";
            }
            break;
        case "img":
        case "picture":
        case "image":
        case "photo":
            if (file != 'show') {
                str += "    <div class='dropzone dropzone-field' id='" + field + "_dropzone' data-storage='local' data-type='picture' data-entity='" + entity + "' ></div>\n";
                str += "    <input type='hidden' name='" + field + "' id='" + field + "_dropzone_hidden' value=\"{" + value2 + ".value}\" data-buffer=\"{" + value2 + ".buffer}\"/>\n";
            } else {
                str += "    <div class='input-group'>\n";
                str += "            <a href=/default/download?entity=" + entity + "&f={" + value2 + ".value|urlencode} ><img src=data:image/;base64,{" + value2 + ".buffer}  class='img img-responsive' data-type='picture' alt=" + value + " name=" + field + "  " + readOnly + " height='400' width='400' /></a>\n";
                str += "    </div>\n";
            }
            break;
        case "cloudfile" :
            str += "    <div class='dropzone dropzone-field' id='" + field + "_dropzone' data-storage='cloud' data-entity='" + entity + "' ></div>\n";
            str += "    <input type='hidden' name='" + field + "' id='" + field + "_dropzone_hidden' />";
            break;
        default :
            str += "    <input class='form-control input' placeholder='{#__ key=|entity." + entity + "." + field + "| /}' name='" + field + "' value='" + value + "' type='text' " + readOnly + "/>\n";
            break;
    }

    str += '\
        </div>\n\
    </div>\n';

    return str;
}

function getFieldInHeaderListHtml(type, fieldName, entityName) {
    let entity = entityName.toLowerCase();
    let field = fieldName.toLowerCase();
    let result = {
        headers: '',
        body: ''
    };

    /* ------------- Add new FIELD in headers ------------- */
    let str = '\
    <th data-field="' + field + '" data-col="' + field + '" data-type="' + type + '" >\n\
        <!--{#__ key="entity.' + entity + '.' + field + '"/}-->\n\
    </th>';

    result.headers = str;

    /* ------------- Add new FIELD in body (for associations include in tabs) ----- */
    // str = '<td data-field="' + field + '"';
    // str += ' data-type="' + type + '">';
    // if (type == "text")
    //     str += '{' + field + '|s}';
    // else if (type == 'picture')
    //     str += '<img src="data:image/;base64,{' + field + '.buffer}" class="img img-responsive" data-type="picture" name="' + field + '" readonly="">';
    // else if (type == 'file')
    //     str += '<a href="/default/download?entity=' + entity + '&amp;f={' + field + '}" name="' + field + '">{' + field + '}</a>';
    // else
    //     str += '{' + field + '}';
    // str += '</td>';

    // result.body = str;
    return result;
}

async function updateFile(fileBase, file, string) {
    fileToWrite = fileBase + '/' + file + '.dust';
    let $ = await domHelper.read(fileToWrite);
    $("#fields").append(string);
    await domHelper.write(fileToWrite, $)
}

function updateListFile(fileBase, file, thString, bodyString, callback) {
    fileToWrite = fileBase + '/' + file + '.dust';
    domHelper.read(fileToWrite).then(function ($) {
        // Count th to know where to insert new th (-4 because of actions th + id, show/update/delete)
        var thCount = $(".main").find('th').length - 4;
        // Add to header thead and filter thead
        $(".fields").each(function () {
            $(this).find('th').eq(thCount).after(thString);
        });

        // Write back to file
        domHelper.write(fileToWrite, $).then(callback);
    });
}

exports.setupField = async (data) => {

    // let id_application = data.id_application;
    let workspacePath = __dirname + '/../workspace/' + data.application.name;
    let entity_name = data.entity.name;
    let field_type = "string",
        field_values;
    /* ----------------- 1 - Initialize variables according to options ----------------- */
    let options = data.options;
    let field_name = options.value;
    let defaultValue = null;
    let defaultValueForOption = null;

    if (typeof options.defaultValue !== "undefined" && options.defaultValue != null)
        defaultValue = options.defaultValue;

    // If there is a WITH TYPE in the instruction
    if (typeof options.type !== "undefined")
        field_type = options.type;

    // Cut allValues for ENUM or other type
    if (typeof options.allValues !== "undefined") {
        let values = options.allValues;
        if (values.indexOf(",") != -1) {
            field_values = values.split(",");
            for (let j = 0; j < field_values.length; j++)
                field_values[j] = field_values[j].trim();
        } else {
            throw new Error('structure.field.attributes.noSpace');
        }

        let sameResults_sorted = field_values.slice().sort();
        let sameResults = [];
        for (let i = 0; i < field_values.length - 1; i++)
            if (sameResults_sorted[i + 1] == sameResults_sorted[i])
                sameResults.push(sameResults_sorted[i]);

        if (sameResults.length > 0)
            throw new Error('structure.field.attributes.noSpace');
    }

    /* ----------------- 2 - Update the entity model, add the attribute ----------------- */

    // attributes.json
    let attributesFileName = workspacePath + '/models/attributes/' + entity_name + '.json';
    let attributesObject = JSON.parse(fs.readFileSync(attributesFileName));

    // toSync.json
    let toSyncFileName = workspacePath + '/models/toSync.json';
    let toSyncObject = JSON.parse(fs.readFileSync(toSyncFileName));

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

    if (field_type == "enum") {
        // Remove all special caractere for all enum values
        let cleanEnumValues = [];
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
        let cleanRadioValues = [];
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
        let fileEnum = workspacePath + '/locales/enum_radio.json';
        let enumData = JSON.parse(fs.readFileSync(fileEnum));
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
        let fileRadio = workspacePath + '/locales/enum_radio.json';
        let radioData = JSON.parse(fs.readFileSync(fileRadio));
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
        fs.writeFileSync(fileRadio, JSON.stringify(enumData, null, 4));
    }

    /* ----------------- 4 - Add the fields in all the views  ----------------- */
    let fileBase = workspacePath + '/views/' + entity_name;

    let filePromises = [];
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
    filePromises.push(updateListFile(fileBase, "list_fields", field_html.headers, field_html.body));

    await Promise.all(filePromises);
    // Field application locales
    await translateHelper.writeLocales(data.application.name, "field", entity_name, [field_name, data.options.showValue], data.googleTranslate);

    return;
}

exports.setRequiredAttribute = function (attr, callback) {

    let possibilityRequired = ["mandatory", "required", "obligatoire"];
    let possibilityOptionnal = ["optionnel", "non-obligatoire", "optional"];
    let entityCodeName = attr.name_data_entity.toLowerCase();

    let attribute = attr.options.word.toLowerCase();
    let set = null;

    if (possibilityRequired.indexOf(attribute) != -1)
        set = true;
    else if (possibilityOptionnal.indexOf(attribute) != -1)
        set = false;
    else {
        let err = new Error();
        err.message = "structure.field.attributes.notUnderstand";
        return callback(err);
    }

    let pathToViews = __dirname + '/../workspace/' + attr.id_application + '/views/' + entityCodeName;

    let writeDust = new Promise((resolve, reject) => {

        // Update create_fields.dust file
        domHelper.read(pathToViews + '/create_fields.dust').then(function($) {

            if ($("*[data-field='" + attr.options.value + "']").length > 0) {
                if (set)
                    $("*[data-field='" + attr.options.value + "']").find('label:first').addClass('required');
                else
                    $("*[data-field='" + attr.options.value + "']").find('label:first').removeClass('required');

                if(attr.structureType == "relatedToMultipleCheckbox"){
                    $("*[data-field='" + attr.options.value + "']").find('.relatedtomany-checkbox').attr('required', set);
                } else {
                    $("*[data-field='" + attr.options.value + "']").find('input').prop('required', set);
                    $("*[data-field='" + attr.options.value + "']").find('select').prop('required', set);
                }

                domHelper.write(pathToViews + '/create_fields.dust', $).then(function() {

                    // Update update_fields.dust file
                    domHelper.read(pathToViews + '/update_fields.dust').then(function($) {
                        if (set)
                            $("*[data-field='" + attr.options.value + "']").find('label:first').addClass('required');
                        else
                            $("*[data-field='" + attr.options.value + "']").find('label:first').removeClass('required');

                        if(attr.structureType == "relatedToMultipleCheckbox"){
                            $("*[data-field='" + attr.options.value + "']").find('.relatedtomany-checkbox').attr('required', set);
                        } else {
                            $("*[data-field='" + attr.options.value + "']").find('input').prop('required', set);
                            $("*[data-field='" + attr.options.value + "']").find('select').prop('required', set);
                        }

                        domHelper.write(pathToViews + '/update_fields.dust', $).then(function() {
                            resolve();
                        });
                    });
                }).catch(function(e) {
                    var err = new Error();
                    err.message = "structure.field.attributes.fieldNoFound";
                    err.messageParams = [attr.options.showValue];
                    reject(err);
                });
            } else {
                var err = new Error();
                err.message = "structure.field.attributes.fieldNoFound";
                err.messageParams = [attr.options.showValue];
                reject(err);
            }
        }).catch(function(err) {
            reject(err);
        });
    });

    writeDust.then(_ => {
        // Update the Sequelize attributes.json to set allowNull
        var pathToAttributesJson = __dirname + '/../workspace/' + attr.id_application + '/models/attributes/' + entityCodeName + ".json";
        var attributesObj = JSON.parse(fs.readFileSync(pathToAttributesJson, "utf8"));

        if (attributesObj[attr.options.value]) {
            // TODO: Handle allowNull: false field in user, role, group to avoid error during autogeneration
            // In script you can set required a field in user, role or group but it crash the user admin autogeneration
            // becaude the required field is not given during the creation
            if (entityCodeName != "e_user" && entityCodeName != "e_role" && entityCodeName != "e_group")
                attributesObj[attr.options.value].allowNull = set ? false : true;
            // Alter column to set default value in DB if models already exist
            var jsonPath = __dirname + '/../workspace/' + attr.id_application + '/models/toSync.json';
            var toSync = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            if (typeof toSync.queries === "undefined")
                toSync.queries = [];

            var defaultValue = null;
            var tableName = attr.id_application + "_" + entityCodeName;
            var length = "";
            if (attr.sqlDataType == "varchar")
                length = "(" + attr.sqlDataTypeLength + ")";

            // Set required
            if (set) {
                switch (attributesObj[attr.options.value].type) {
                    case "STRING":
                    case "ENUM":
                    case "TEXT":
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
                attributesObj[attr.options.value].defaultValue = defaultValue;
                // TODO postgres
                if (attr.sqlDataType && attr.dialect == "mysql") {
                    // Update all NULL value before set not null
                    toSync.queries.push("UPDATE `" + tableName + "` SET `" + attr.options.value + "`='" + defaultValue + "' WHERE `" + attr.options.value + "` IS NULL;");
                    toSync.queries.push("ALTER TABLE `" + tableName + "` CHANGE `" + attr.options.value + "` `" + attr.options.value + "` " + attr.sqlDataType + length + " NOT NULL");
                    toSync.queries.push("ALTER TABLE `" + tableName + "` ALTER `" + attr.options.value + "` SET DEFAULT '" + defaultValue + "';");
                }
            } else {
                // Set optional
                attributesObj[attr.options.value].defaultValue = null;
                // TODO postgres
                if (attr.sqlDataType && attr.dialect == "mysql") {
                    toSync.queries.push("ALTER TABLE `" + tableName + "` CHANGE `" + attr.options.value + "` `" + attr.options.value + "` " + attr.sqlDataType + length + " NULL");
                    toSync.queries.push("ALTER TABLE `" + tableName + "` ALTER `" + attr.options.value + "` SET DEFAULT NULL;");
                }
            }
            fs.writeFileSync(jsonPath, JSON.stringify(toSync, null, 4));
            fs.writeFileSync(pathToAttributesJson, JSON.stringify(attributesObj, null, 4));
        } else {
            // If not in attributes, maybe in options
            var pathToOptionJson = __dirname + '/../workspace/' + attr.id_application + '/models/options/' + entityCodeName + ".json";
            var optionsObj = JSON.parse(fs.readFileSync(pathToOptionJson, "utf8"));
            var aliasValue = "r_" + attr.options.value.substring(2);
            for (var i = 0; i < optionsObj.length; i++)
                if (optionsObj[i].as == aliasValue)
                    optionsObj[i].allowNull = set ? false : true;

            // Set option allowNull
            fs.writeFileSync(pathToOptionJson, JSON.stringify(optionsObj, null, 4));
        }

        callback();
    }).catch(err => {
        callback(err, null);
    })
}

exports.setUniqueField = function (attr, callback) {

    var possibilityUnique = ["unique"];
    var possibilityNotUnique = ["not-unique", "non-unique"];

    var attribute = attr.options.word.toLowerCase();
    var set = null;

    var idApplication = attr.id_application;
    var codeName_data_entity = attr.name_data_entity.toLowerCase();

    if (possibilityUnique.indexOf(attribute) != -1)
        set = true;
    else if (possibilityNotUnique.indexOf(attribute) != -1)
        set = false;
    else {
        var err = new Error();
        err.message = "structure.field.attributes.notUnderstand";
        return callback(err);
    }

    // Update the Sequelize attributes.json to set unique
    var pathToAttributesJson = __dirname + '/../workspace/' + idApplication + '/models/attributes/' + codeName_data_entity + ".json";
    var attributesContent = fs.readFileSync(pathToAttributesJson);
    var attributesObj = JSON.parse(attributesContent);

    // If the current field is an fk field then we won't find it in attributes.json
    if (typeof attributesObj[attr.options.value] !== "undefined")
        attributesObj[attr.options.value].unique = set ? true : false;
    fs.writeFileSync(pathToAttributesJson, JSON.stringify(attributesObj, null, 4));

    callback();
}

exports.setFieldAttribute = function (attr, callback) {

    var idApp = attr.id_application;
    var targetField = attr.options.value;
    var targetEntity = attr.name_data_entity.toLowerCase();
    var attribute = attr.options.word.toLowerCase();
    var attributeValue = attr.options.attributeValue.toLowerCase();
    var pathToViews = __dirname + '/../workspace/' + idApp + '/views/' + targetEntity;

    // Update create_fields.dust file
    domHelper.read(pathToViews + '/create_fields.dust').then(function ($) {
        if ($("*[data-field='" + targetField + "']").length > 0) {

            $("*[data-field='" + targetField + "']").find('input').attr(attribute, attributeValue);
            $("*[data-field='" + targetField + "']").find('select').attr(attribute, attributeValue);

            domHelper.write(pathToViews + '/create_fields.dust', $).then(function () {

                // Update update_fields.dust file
                domHelper.read(pathToViews + '/update_fields.dust').then(function ($) {

                    $("*[data-field='" + targetField + "']").find('input').attr(attribute, attributeValue);
                    $("*[data-field='" + targetField + "']").find('select').attr(attribute, attributeValue);

                    domHelper.write(pathToViews + '/update_fields.dust', $).then(function () {
                        callback();
                    });
                });
            }).catch(function (e) {
                var err = new Error();
                err.message = "structure.field.attributes.fieldNoFound";
                err.messageParams = [attr.options.showValue];
                callback(err, null);
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

function addTab(attr, file, newLi, newTabContent, target) {
    return new Promise(function (resolve, reject) {
        var source = attr.options.source.toLowerCase();
        domHelper.read(file).then(function ($) {
            // Tabs structure doesn't exist, create it
            let context, tabs;
            if ($("#tabs").length == 0) {
                tabs = '\
                <div class="nav-tabs-custom" id="tabs">\n\
                    <!--{^hideTab}-->\n\
                    <ul class="nav nav-tabs">\n\
                        <li class="active">\n\
                            <a data-toggle="tab" href="#home"><!--{#__ key="entity.' + source + '.label_entity" /}--></a>\n\
                        </li>\n\
                    </ul>\n\
                    <!--{/hideTab}-->\n\
                    <div class="tab-content" style="min-height:275px;">\n\
                        <div id="home" class="tab-pane fade in active"></div>\n\
                    </div>\n\
                </div>\n';
                context = $(tabs);
                $("#home", context).append($("#fields"));
                $("#home", context).append($(".actions"));
            } else
                context = $("#tabs");

            // Append created elements to `context` to handle presence of tab or not
            newLi = '<!--{#entityAccess entity="' + target.substring(2) + '"}-->\n' + newLi + '\n<!--{/entityAccess}-->';
            $(".nav-tabs", context).append(newLi);
            $(".tab-content", context).append('\
                <!--{^hideTab}-->\n\
                    <!--{#entityAccess entity="' + target.substring(2) + '"}-->\n\
                        '+newTabContent+'\n\
                    <!--{/entityAccess}-->\n\
                <!--{/hideTab}-->\n');

            $('body').empty().append(context);
            domHelper.write(file, $).then(function () {
                resolve();
            });
        });
    });
}

exports.setupHasManyTab = function (attr, callback) {
    let target = attr.options.target.toLowerCase();
    let showTarget = attr.options.showTarget.toLowerCase();
    let urlTarget = attr.options.urlTarget.toLowerCase();
    let source = attr.options.source.toLowerCase();
    let showSource = attr.options.showSource.toLowerCase();
    let urlSource = attr.options.urlSource.toLowerCase();
    let foreignKey = attr.options.foreignKey.toLowerCase();
    let alias = attr.options.as.toLowerCase();
    let showAlias = attr.options.showAs;
    let urlAs = attr.options.urlAs.toLowerCase();

    /* Add Alias in Translation file for tabs */
    let fileTranslationFR = __dirname + '/../workspace/' + attr.id_application + '/locales/fr-FR.json';
    let fileTranslationEN = __dirname + '/../workspace/' + attr.id_application + '/locales/en-EN.json';
    let dataFR = JSON.parse(fs.readFileSync(fileTranslationFR));
    let dataEN = JSON.parse(fs.readFileSync(fileTranslationEN));

    dataFR.entity[source][alias] = showAlias;
    dataEN.entity[source][alias] = showAlias;

    fs.writeFileSync(fileTranslationFR, JSON.stringify(dataFR, null, 4), 'utf8');
    fs.writeFileSync(fileTranslationEN, JSON.stringify(dataEN, null, 4), 'utf8');

    // Setup association tab for show_fields.dust
    let fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + source;
    let file = fileBase + '/show_fields.dust';

    // Create new tab button
    let newLi = '\
        <li>\n\
            <a id="' + alias + '-click" data-toggle="tab" data-tabtype="hasMany" href="#' + alias + '">\n\
                <!--{#__ key="entity.' + source + '.' + alias + '" /}-->\n\
            </a>\n\
        </li>';

    // Create new tab content
    let newTab = '	<div id="' + alias + '" class="ajax-tab tab-pane fade" data-tabType="hasMany" data-asso-alias="' + alias + '" data-asso-foreignkey="' + foreignKey + '" data-asso-flag="{id}" data-asso-source="' + source + '" data-asso-url="' + urlSource + '"><div class="ajax-content sub-tab-table"></div></div>';

    printHelper.addHasMany(fileBase, target, alias).then(function () {
        addTab(attr, file, newLi, newTab, target).then(callback);
    });
}

exports.setupHasManyPresetTab = function (attr, callback) {
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
    var dataFR = JSON.parse(fs.readFileSync(fileTranslationFR));
    var dataEN = JSON.parse(fs.readFileSync(fileTranslationEN));

    dataFR.entity[source][alias] = showAlias;
    dataEN.entity[source][alias] = showAlias;

    var stream_fileTranslationFR = fs.createWriteStream(fileTranslationFR);
    var stream_fileTranslationEN = fs.createWriteStream(fileTranslationEN);

    stream_fileTranslationFR.write(JSON.stringify(dataFR, null, 4));
    stream_fileTranslationFR.end();
    stream_fileTranslationFR.on('finish', function () {
        stream_fileTranslationEN.write(JSON.stringify(dataEN, null, 4));
        stream_fileTranslationEN.end();
        stream_fileTranslationEN.on('finish', function () {

            // Setup association tab for show_fields.dust
            var fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + source;
            var file = fileBase + '/show_fields.dust';

            var newLi = '\
            <li>\n\
                <a id="' + alias + '-click" data-toggle="tab" data-tabtype="hasManyPreset" href="#' + alias + '">\n\
                    <!--{#__ key="entity.' + source + '.' + alias + '" /}-->\n\
                </a>\n\
            </li>';

            var newTabContent = '<div id="' + alias + '" class="ajax-tab tab-pane fade" data-tabType="hasManyPreset" data-asso-alias="' + alias + '" data-asso-foreignkey="' + foreignKey + '" data-asso-flag="{id}" data-asso-source="' + source + '" data-asso-url="' + urlSource + '"><div class="ajax-content sub-tab-table"></div></div>';

            printHelper.addHasMany(fileBase, target, alias).then(function () {
                addTab(attr, file, newLi, newTabContent, target).then(callback);
            });
        });
    });
}

exports.saveHasManyData = function (attr, data, foreignKey, callback) {
    var jsonPath = __dirname + '/../workspace/' + attr.id_application + '/models/toSync.json';
    var toSync = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    toSync.queries = [];
    var firstKey = "fk_id_" + attr.options.source;
    var secondKey = "fk_id_" + attr.options.target;
    /* Insert value in toSync queries array to add values of the old has many in the belongs to many */
    for (var i = 0; i < data.length; i++)
        toSync.queries.push("INSERT INTO " + attr.options.through + "(" + firstKey + ", " + secondKey + ") VALUES(" + data[i].id + ", " + data[i][foreignKey] + ");");
    fs.writeFileSync(jsonPath, JSON.stringify(toSync, null, 4));
    callback();
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

    // Check if field is used in select, default to id
    var usingField = [{value: "id", type: "string"}];
    var showUsingField = ["ID"];

    if (typeof attr.options.usingField !== "undefined")
        usingField = attr.options.usingField;
    if (typeof attr.options.showUsingField !== "undefined")
        showUsingField = attr.options.showUsingField;

    var usingList = [], usingOption = [];
    for (var i = 0; i < usingField.length; i++) {
        usingList.push(usingField[i].value);
        usingOption.push('{' + usingField[i].value + '|' + usingField[i].type + '}');
    }
    // Setup association field for create_fields
    let select = '\
    <div data-field="f_' + urlAs + '" class="fieldLineHeight col-xs-12">\n\
        <div class="form-group">\n\
            <label for="' + alias + '">\n\
                <!--{#__ key="entity.' + source + '.' + alias + '" /}-->&nbsp;\n\
                <!--{@inline_help field="' + alias + '"}-->\n\
                    <i data-field="' + alias + '" class="inline-help fa fa-info-circle" style="color: #1085EE"></i>\n\
                <!--{/inline_help}-->\n\
            </label>\n\
            <select class="ajax form-control" name="' + alias + '" data-source="' + urlTarget + '" data-using="' + usingList.join(',') + '" width="100%">\n\
            </select>\n\
        </div>\n\
    </div>\n';

    // Update create_fields file
    var fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + source;
    var file = 'create_fields';
    updateFile(fileBase, file, select).then(_ => {

        select = '\
        <div data-field="f_' + urlAs + '" class="fieldLineHeight col-xs-12">\n\
            <div class="form-group">\n\
                <label for="' + alias + '">\n\
                    <!--{#__ key="entity.' + source + '.' + alias + '" /}-->&nbsp;\n\
                    <!--{@inline_help field="' + alias + '"}-->\n\
                        <i data-field="' + alias + '" class="inline-help fa fa-info-circle" style="color: #1085EE"></i>\n\
                    <!--{/inline_help}-->\n\
                </label>\n\
                <select class="ajax form-control" name="' + alias + '" data-source="' + urlTarget + '" data-using="' + usingList.join(',') + '" width="100%">\n\
                    <!--{#' + alias + '}-->\n\
                        <option value="{id}" selected>' + usingOption.join(' - ') + '</option>\n\
                    <!--{/' + alias + '}-->\n\
                </select>\n\
            </div>\n\
        </div>\n';

        file = 'update_fields';
        // Update update_fields file
        updateFile(fileBase, file, select).then(_ => {

            // Setup association tab for show_fields.dust
            file = fileBase + '/show_fields.dust';
            domHelper.read(file).then(function ($) {

                // Add read only field in show file. No tab required
                var str = "";
                str = "<div data-field='f_" + urlAs + "' class='fieldLineHeight col-xs-12'>\n<div class='form-group'>\n";
                str += "    <label for='" + alias + "'><!--{#__ key=\"entity." + source + "." + alias + "\"/}--></label>\n";
                str += "    <input class='form-control input' placeholder='{#__ key=|entity." + source + "." + alias + "| /}' name='" + alias + "' value='";
                for (var i = 0; i < usingField.length; i++) {
                    str += "{" + alias + "." + usingField[i].value + "|" + usingField[i].type + "}";
                    if (i != usingField.length - 1)
                        str += " - ";
                }
                str += "' ";
                str += "type='text' readOnly />\n";
                str += "</div>\n</div>\n";
                $("#fields").append(str);

                domHelper.write(file, $).then(function () {
                    // Add the related to field in the entity print template
                    file = fileBase + '/print_fields.dust';
                    domHelper.read(file).then(function ($) {
                        $("#fields").append(str);
                        domHelper.write(file, $).then(function () {
                            function done() {
                                translateHelper.writeLocales(attr.id_application, "aliasfield", source, [alias, showAlias], attr.googleTranslate, function () {
                                    callback(null, "Field related to successfully created");
                                });
                            }
                            function writeDatalist(cpt) {
                                if (cpt >= usingField.length) {
                                    done();
                                    return true;
                                }

                                var targetField = (usingField[cpt].value == "id") ? "id_entity" : usingField[cpt].value;

                                // Add <th> in list_field
                                var toAddInList = {headers: '', body: ''};
                                /* ------------- Add new FIELD in headers ------------- */
                                var str = '<th data-field="' + alias + '" data-col="' + alias + '.' + usingField[cpt].value + '"';
                                //var str = '<th data-field="' + alias + '.' + usingField[cpt].value + '" data-col="' + alias + '.' + usingField[cpt].value + '"';
                                str += ' data-type="' + usingField[cpt].type + '"';
                                str += '>\n';
                                str += '<!--{#__ key="entity.' + source + '.' + alias + '"/}-->&nbsp;-&nbsp;<!--{#__ key="entity.' + target + '.' + targetField + '"/}-->\n';
                                str += '</th>\n';
                                toAddInList.headers = str;

                                /* ------------- Add new FIELD in body (for associations include in tabs) ----- */
                                //str = '<td data-field="' + alias + '.' + usingField[cpt].value + '"';
                                str = '<td data-field="' + alias + '"';
                                str += ' data-type="' + usingField[cpt].type + '"';
                                str += ' >{' + alias + '.' + usingField[cpt].value + '}</td>';
                                toAddInList.body = str;

                                updateListFile(fileBase, "list_fields", toAddInList.headers, toAddInList.body, function () {
                                    writeDatalist(++cpt);
                                });
                            }
                            writeDatalist(0);
                        });
                    });
                });
            });
        });
    });
}

exports.setupRelatedToMultipleField = function (attr, callback) {
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

    // Gestion du field à afficher dans le select du fieldset, par defaut c'est l'ID
    var usingField = [{value: "id", type: "string"}];
    var showUsingField = ["ID"];

    if (typeof attr.options.usingField !== "undefined")
        usingField = attr.options.usingField;
    if (typeof attr.options.showUsingField !== "undefined")
        showUsingField = attr.options.showUsingField;

    var usingList = [], usingOption = [];
    for (var i = 0; i < usingField.length; i++) {
        usingList.push(usingField[i].value);
        usingOption.push('{' + usingField[i].value + '|' + usingField[i].type + '}');
    }
    // Setup association field for create_fields
    let head = '\
    <div data-field="f_' + urlAs + '" class="fieldLineHeight col-xs-12" '+ (attr.options.isCheckbox ? 'style="margin-bottom: 25px;"' : "") +'>\n\
        <div class="form-group">\n\
            <label for="f_' + urlAs + '">\n\
                <!--{#__ key="entity.' + source + '.' + alias + '" /}-->\n\
                <!--{@inline_help field="' + alias + '"}-->\n\
                    <i data-field="' + alias + '" class="inline-help fa fa-info-circle" style="color: #1085EE"></i>\n\
                <!--{/inline_help}-->\n\
            </label>\n';

    let select;
    if (attr.options.isCheckbox) {
        select = '\
        <br>\n\
        <div class="relatedtomany-checkbox">\n\
            <!--{#' + alias + '_all}-->\n\
                <wrap>\n\
                    <label class="no-weight">\n\
                        <input type="checkbox" value="{id}" class="no-formatage" name="' + alias + '">&nbsp;&nbsp;' + usingOption.join(' - ') + '\n\
                    </label><br>\n\
                </wrap>\n\
            <!--{/' + alias + '_all}-->\n\
        </div>\n';
    } else {
        select = '\
        <select multiple="" class="ajax form-control" name="' + alias + '" data-source="' + urlTarget + '" data-using="' + usingList.join(',') + '" width="100%">\n\
        </select>\n';
    }

    // Update create_fields file
    let fileBase = __dirname + '/../workspace/' + attr.id_application + '/views/' + source;
    let file = 'create_fields';
    updateFile(fileBase, file, head + select).then(_ => {

        if (attr.options.isCheckbox) {
            select = '\
            <div class="relatedtomany-checkbox">\n\
                <!--{#' + alias + '_all}-->\n\
                    <!--{@existInContextById ofContext=' + alias + ' key=id}-->\n\
                        <wrap><input type="checkbox" checked value="{id}" class="no-formatage" name="' + alias + '">&nbsp;&nbsp;' + usingOption.join(' - ') + '<br></wrap>\n\
                    <!--{:else}-->\n\
                        <wrap><input type="checkbox" value="{id}" class="no-formatage" name="' + alias + '">&nbsp;&nbsp;' + usingOption.join(' - ') + '<br></wrap>\n\
                    <!--{/existInContextById}-->\n\
                <!--{/' + alias + '_all}-->\n\
            </div>';
        } else {
            select = '\
            <select multiple="" class="ajax form-control" name="' + alias + '" data-source="' + urlTarget + '" data-using="' + usingList.join(',') + '" width="100%">\n\
                <option value="">{#__ key="select.default" /}</option>\n\
                <!--{#' + alias + '}-->\n\
                    <option value="{id}" selected>' + usingOption.join(' - ') + '</option>\n\
                <!--{/' + alias + '}-->\n\
            </select>\n';
        }

        file = 'update_fields';
        // Update update_fields file
        updateFile(fileBase, file, head + select).then(_ => {
            select = '';
            if (attr.options.isCheckbox) {
                select = '\
                <div class="relatedtomany-checkbox">\n\
                    <!--{#' + alias + '_all}-->\n\
                        <!--{@existInContextById ofContext=' + alias + ' key=id}-->\n\
                            <wrap><input type="checkbox" disabled="" checked="" name="' + alias + '">&nbsp;&nbsp;' + usingOption.join(' - ') + '<br></wrap>\n\
                        <!--{:else}-->\n\
                            <wrap><input type="checkbox" disabled="" name="' + alias + '">&nbsp;&nbsp;' + usingOption.join(' - ') + '<br></wrap>\n\
                        <!--{/existInContextById}-->\n\
                    <!--{/' + alias + '_all}-->\n\
                </div>';

            } else {
                select = '\
                <select multiple disabled readonly class="form-control" name="' + alias + '" data-source="' + urlTarget + '" data-using="' + usingList.join(',') + '" width="100%">\n\
                    <!--{#' + alias + '}-->\n\
                        <option value="' + usingOption.join(' - ') + '" selected>' + usingOption.join(' - ') + '</option>\n\
                    <!--{/' + alias + '}-->\n\
                </select>\n';
            }
            select += '</div>\n';

            // Setup association tab for show_fields.dust
            file = fileBase + '/show_fields.dust';
            domHelper.read(file).then(function ($) {
                $("#fields").append(head + select);
                domHelper.write(file, $).then(function () {
                    // Add the related to many field in the entity print template
                    file = fileBase + '/print_fields.dust';
                    domHelper.read(file).then(function ($) {

                        select = '\
                        <div data-field="f_' + urlAs + '" class="fieldLineHeight col-xs-12">\n\
                            <div class="form-group">\n\
                                <label for="f_' + urlAs + '"><!--{#__ key="entity.' + source + '.' + alias + '" /}--></label>\n\
                                <select multiple disabled readonly class="regular-select form-control" name="' + alias + '" data-source="' + urlTarget + '" data-using="' + usingList.join(',') + '" width="100%">\n\
                                    <!--{#' + alias + '}-->\n\
                                        <option value="' + usingOption.join(' - ') + '" selected>' + usingOption.join(' - ') + '</option>\n\
                                    <!--{/' + alias + '}-->\n\
                                </select>\n\
                            </div>\n\
                        </div>\n';

                        $("#fields").append(select);
                        domHelper.write(file, $).then(function () {
                            translateHelper.writeLocales(attr.id_application, "aliasfield", source, [alias, showAlias], attr.googleTranslate, function () {
                                callback(null, "Related to many fields successfully created !");
                            });
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
    var dataFR = JSON.parse(fs.readFileSync(fileTranslationFR));
    var dataEN = JSON.parse(fs.readFileSync(fileTranslationEN));

    dataFR.entity[source][alias] = showAlias;
    dataEN.entity[source][alias] = showAlias;

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
            var newLi = '\
            <li>\n\
                <a id="' + alias + '-click" data-toggle="tab" href="#' + alias + '">\n\
                    <!--{#__ key="entity.' + source + '.' + alias + '" /}-->\n\
                </a>\n\
            </li>';

            // Create new tab content
            var newTab = '<div id="' + alias + '" class="ajax-tab tab-pane fade" data-tabType="hasOne" data-asso-alias="' + alias + '" data-asso-foreignkey="' + foreignKey + '" data-asso-flag="{id}" data-asso-source="' + source + '" data-asso-url="' + urlSource + '"><div class="ajax-content"></div></div>';

            printHelper.addHasOne(fileBase, target, alias).then(function () {
                addTab(attr, file, newLi, newTab, target).then(callback);
            });
        });
    });
}

exports.deleteDataField = function (attr, callback) {
    var idApp = attr.id_application;
    var name_data_entity = attr.name_data_entity.toLowerCase();
    var name_data_field = attr.options.value.toLowerCase();
    var url_value = attr.options.urlValue.toLowerCase();

    var options = attr.options;

    var dataToWrite;
    var isInOptions = false;
    var info = {};

    // Check if field is in options with relation=belongsTo, it means its a relatedTo association and not a simple field
    var jsonPath = __dirname + '/../workspace/' + idApp + '/models/options/' + name_data_entity + '.json';

    // Clear the require cache
    var dataToWrite = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    let deletedOptionsTarget = [];

    for (var i = 0; i < dataToWrite.length; i++) {
        if (dataToWrite[i].as.toLowerCase() == "r_" + url_value) {
            if (dataToWrite[i].relation != 'belongsTo' && dataToWrite[i].structureType != "relatedToMultiple" && dataToWrite[i].structureType != "relatedToMultipleCheckbox") {
                var err = new Error();
                err.message = name_data_entity + ' isn\'t a regular field. You might want to use `delete tab` instruction.';
                return callback(err, null);
            }

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
        jsonPath = __dirname + '/../workspace/' + idApp + '/models/attributes/' + name_data_entity + '.json';
        dataToWrite = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        delete dataToWrite[name_data_field];

        info.fieldToDrop = name_data_field;
        info.isConstraint = false;
    }

    // Look in option file for all concerned target to destroy auto_generate key no longer needed
    let targetOption, autoGenerateFound, targetJsonPath;
    for (var i = 0; i < deletedOptionsTarget.length; i++) {
        autoGenerateFound = false;
        targetJsonPath = __dirname + '/../workspace/' + idApp + '/models/options/' + deletedOptionsTarget[i].target + '.json';
        targetOption = JSON.parse(fs.readFileSync(targetJsonPath));
        for (var j = 0; j < targetOption.length; j++) {
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
    var viewsPath = __dirname + '/../workspace/' + idApp + '/views/' + name_data_entity + '/';
    var fieldsFiles = ['create_fields', 'update_fields', 'show_fields', 'print_fields'];
    var promises = [];
    for (var i = 0; i < fieldsFiles.length; i++)
        promises.push(new Promise(function (resolve, reject) {
            (function (file) {
                domHelper.read(file).then(function ($) {
                    $('*[data-field="' + name_data_field + '"]').remove();
                    // In case of related to
                    $('*[data-field="r_' + name_data_field.substring(2) + '"]').remove();
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

            // In case of related to
            $("th[data-col^='r_" + name_data_field.substring(2) + ".']").remove();
            domHelper.write(viewsPath + '/list_fields.dust', $).then(function () {
                resolve();
            });
        });
    }));

    let optionsPath = __dirname + '/../workspace/' + idApp + '/models/options/';
    let otherViewsPath = __dirname + '/../workspace/' + idApp + '/views/';
    let structureTypeWithUsing = ["relatedTo", "relatedToMultiple", "relatedToMultipleCheckbox", "hasManyPreset"];
    fieldsFiles.push("list_fields");
    // Looking for association with using of the deleted field
    fs.readdirSync(optionsPath).filter(function (file) {
        return (file.indexOf('.json') != -1);
    }).forEach(function (file) {
        let currentOption = JSON.parse(fs.readFileSync(optionsPath + file, "utf8"));
        let currentEntity = file.split(".json")[0];
        let toSave = false;
        for (var i = 0; i < currentOption.length; i++) {
            // If the option match with our source entity
            if (structureTypeWithUsing.indexOf(currentOption[i].structureType) != -1 &&
                    currentOption[i].target == name_data_entity &&
                    typeof currentOption[i].usingField !== "undefined") {
                // Check if our deleted field is in the using fields
                for (var j = 0; j < currentOption[i].usingField.length; j++) {
                    if (currentOption[i].usingField[j].value == name_data_field) {
                        for (var k = 0; k < fieldsFiles.length; k++) {
                            // Clean file
                            let content = fs.readFileSync(otherViewsPath + currentEntity + '/' + fieldsFiles[k] + '.dust', "utf8")
                            content = content.replace(new RegExp(currentOption[i].as + "." + name_data_field, "g"), currentOption[i].as + ".id");
                            content = content.replace(new RegExp(currentOption[i].target + "." + name_data_field, "g"), currentOption[i].target + ".id_entity");
                            fs.writeFileSync(otherViewsPath + currentEntity + '/' + fieldsFiles[k] + '.dust', content);
                            // Looking for select in create / update / show
                            promises.push(new Promise(function (resolve, reject) {
                                (function (file, option, entity) {
                                    domHelper.read(otherViewsPath + entity + '/' + file + '.dust').then(function ($) {
                                        let el = $("select[name='" + option.as + "'][data-source='" + option.target.substring(2) + "']");
                                        if (el.length > 0) {
                                            let using = el.attr("data-using").split(",");
                                            if (using.indexOf(name_data_field) != -1) {
                                                // If using is alone, then replace with id, or keep just other using
                                                if (using.length == 1) {
                                                    el.attr("data-using", "id")
                                                } else {
                                                    using.splice(using.indexOf(name_data_field), 1)
                                                    el.attr("data-using", using.join())
                                                }
                                                el.html(el.html().replace(new RegExp(name_data_field, "g"), "id"))
                                            }
                                        }
                                        domHelper.write(otherViewsPath + entity + '/' + file + '.dust', $).then(function () {
                                            resolve();
                                        })
                                    })
                                })(fieldsFiles[k], currentOption[i], currentEntity)
                            }))
                        }
                        // Clean using
                        currentOption[i].usingField.splice(j, 1);
                        toSave = true;
                        break;
                    }
                }
            }
        }
        if (toSave)
            fs.writeFileSync(optionsPath + file, JSON.stringify(currentOption, null, 4), "utf8");
    });

    // Wait for all promises execution
    Promise.all(promises).then(function () {

        // Remove translation in enum locales
        var enumsPath = __dirname + '/../workspace/' + idApp + '/locales/enum_radio.json';
        var enumJson = JSON.parse(fs.readFileSync(enumsPath));

        if (typeof enumJson[name_data_entity] !== "undefined") {
            if (typeof enumJson[name_data_entity][info.fieldToDrop] !== "undefined") {
                delete enumJson[name_data_entity][info.fieldToDrop];
                fs.writeFileSync(enumsPath, JSON.stringify(enumJson, null, 4));
            }
        }

        // Remove translation in global locales
        var fieldToDropInTranslate = info.isConstraint ? "r_" + url_value : info.fieldToDrop;
        translateHelper.removeLocales(idApp, "field", [name_data_entity, fieldToDropInTranslate], function () {
            callback(null, info);
        });
    });
}

exports.deleteTab = function (attr, callback) {
    let tabNameWithoutPrefix = attr.options.urlValue.toLowerCase();
    let name_data_entity = attr.name_data_entity.toLowerCase();
    let idApp = attr.id_application;
    let target;

    let jsonPath = __dirname + '/../workspace/' + idApp + '/models/options/' + name_data_entity + '.json';
    let options = JSON.parse(fs.readFileSync(jsonPath));
    let found = false;
    let option;
    let deletedOptionsTarget = [];

    for (var i = 0; i < options.length; i++) {
        if (options[i].as.toLowerCase() !== "r_" + tabNameWithoutPrefix)
            continue;

        option = options[i];

        if(deletedOptionsTarget.indexOf(option.target) == -1)
            deletedOptionsTarget.push(option.target);

        if (option.relation == 'hasMany')
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

    // Look in option file for all concerned target to destroy auto_generate key no longer needed
    let targetOption, autoGenerateFound, targetJsonPath;
    for (var i = 0; i < deletedOptionsTarget.length; i++) {
        autoGenerateFound = false;
        targetJsonPath = __dirname + '/../workspace/' + idApp + '/models/options/' + deletedOptionsTarget[i] + '.json'
        targetOption = JSON.parse(fs.readFileSync(targetJsonPath));
        for (var j = 0; j < targetOption.length; j++) {
            if(targetOption[j].structureType == "auto_generate" && targetOption[j].foreignKey == option.foreignKey){
                targetOption.splice(j, 1);
                autoGenerateFound = true;
            }
        }
        if(autoGenerateFound)
            fs.writeFileSync(targetJsonPath, JSON.stringify(targetOption, null, 4), "utf8");
    }
    fs.writeFileSync(jsonPath, JSON.stringify(options, null, 4), "utf8");

    var showFile = __dirname + '/../workspace/' + idApp + '/views/' + name_data_entity + '/show_fields.dust';
    domHelper.read(showFile).then(function ($) {
        // Get tab type before destroying it
        var tabType = $("#r_" + tabNameWithoutPrefix + "-click").attr('data-tabtype');
        // Remove tab (<li>)
        $("#r_" + tabNameWithoutPrefix + "-click").parents('li').remove();
        // Remove tab content
        $("#r_" + tabNameWithoutPrefix).remove();

        // If last tab have been deleted, remove tab structure from view
        if ($(".tab-content .tab-pane").length == 1)
            $("#tabs").replaceWith($("#home").html());

        domHelper.write(showFile, $).then(function () {
            var printFile = __dirname + '/../workspace/' + idApp + '/views/' + name_data_entity + '/print_fields.dust';
            domHelper.read(printFile).then(function ($) {
                $("#r_" + tabNameWithoutPrefix + "_print").remove();
                domHelper.write(printFile, $).then(function () {
                    callback(null, option.foreignKey, target, tabType);
                }).catch(function (err) {
                    callback(err, null);
                });
            }).catch(function (err) {
                callback(err, null);
            });
        }).catch(function (err) {
            callback(err, null);
        });
    }).catch(function (err) {
        callback(err, null);
    });
}

exports.selectEntity = function (id_application, moduleCodeName, entityName, callback) {
    var layout_path = __dirname + '/../workspace/' + id_application + '/views/layout_' + moduleCodeName + '.dust';
    domHelper.read(layout_path).then(function ($) {
        if (typeof $('#' + entityName + '_menu_item')[0] !== "undefined" && $('#' + entityName + '_menu_item')[0].style.display === 'block')
            return callback(null, true);
        callback(null, false);
    }).catch(function (err) {
        console.error(err);
        callback(err);
    });
};

exports.updateListFile = updateListFile;
