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
    let fileToWrite = fileBase + '/' + file + '.dust';
    let $ = await domHelper.read(fileToWrite);
    $("#fields").append(string);
    await domHelper.write(fileToWrite, $);
    return;
}

async function updateListFile(fileBase, file, thString) {
    fileToWrite = fileBase + '/' + file + '.dust';
    let $ = await domHelper.read(fileToWrite)

    // Count th to know where to insert new th (-4 because of actions th + id, show/update/delete)
    let thCount = $(".main").find('th').length - 4;
    // Add to header thead and filter thead
    $(".fields").each(function () {
        $(this).find('th').eq(thCount).after(thString);
    });

    // Write back to file
    await domHelper.write(fileToWrite, $);
    return;
}

exports.setupField = async (data) => {

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

    let cleanEnumValues = [], cleanRadioValues = [];
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
        fs.writeFileSync(fileRadio, JSON.stringify(radioData, null, 4));
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
    filePromises.push(updateListFile(fileBase, "list_fields", field_html.headers));

    await Promise.all(filePromises);
    // Field application locales
    await translateHelper.writeLocales(data.application.name, "field", entity_name, [field_name, data.options.showValue], data.googleTranslate);

    return;
}

exports.setRequiredAttribute = async (data) => {

    let possibilityRequired = ["mandatory", "required", "obligatoire"];
    let possibilityOptionnal = ["optionnel", "non-obligatoire", "optional"];

    let attribute = data.options.word.toLowerCase();
    let set = null;

    if (possibilityRequired.indexOf(attribute) != -1)
        set = true;
    else if (possibilityOptionnal.indexOf(attribute) != -1)
        set = false;
    else
        throw new Error('structure.field.attributes.notUnderstand');

    let pathToViews = __dirname + '/../workspace/' + data.application.name + '/views/' + data.entity_name;

    // Update create_fields.dust file
    let $ = await domHelper.read(pathToViews + '/create_fields.dust');

    if ($("*[data-field='" + data.options.value + "']").length == 0) {
        let err = new Error('structure.field.attributes.fieldNoFound');
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
        $("*[data-field='" + data.options.value + "']").find('select').prop('required', set);
    }

    await domHelper.write(pathToViews + '/create_fields.dust', $);

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
        $("*[data-field='" + data.options.value + "']").find('select').prop('required', set);
    }

    await domHelper.write(pathToViews + '/update_fields.dust', $);

    // Update the Sequelize attributes.json to set allowNull
    let pathToAttributesJson = __dirname + '/../workspace/' + data.application.name + '/models/attributes/' + data.entity_name + ".json";
    let attributesObj = JSON.parse(fs.readFileSync(pathToAttributesJson, "utf8"));

    if (attributesObj[data.options.value]) {
        // TODO: Handle allowNull: false field in user, role, group to avoid error during autogeneration
        // In script you can set required a field in user, role or group but it crash the user admin autogeneration
        // becaude the required field is not given during the creation
        if (data.entity_name != "e_user" && data.entity_name != "e_role" && data.entity_name != "e_group")
            attributesObj[data.options.value].allowNull = set ? false : true;
        // Alter column to set default value in DB if models already exist
        let jsonPath = __dirname + '/../workspace/' + data.application.name + '/models/toSync.json';
        let toSync = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        if (typeof toSync.queries === "undefined")
            toSync.queries = [];

        let defaultValue = null;
        let tableName = data.entity_name;
        let length = "";
        if (data.sqlDataType == "varchar")
            length = "(" + data.sqlDataTypeLength + ")";

        // Set required
        if (set) {
            switch (attributesObj[data.options.value].type) {
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
            attributesObj[data.options.value].defaultValue = defaultValue;
            // TODO postgres
            if (data.sqlDataType && data.dialect == "mysql") {
                // Update all NULL value before set not null
                toSync.queries.push("UPDATE `" + tableName + "` SET `" + data.options.value + "`='" + defaultValue + "' WHERE `" + data.options.value + "` IS NULL;");
                toSync.queries.push("ALTER TABLE `" + tableName + "` CHANGE `" + data.options.value + "` `" + data.options.value + "` " + data.sqlDataType + length + " NOT NULL");
                toSync.queries.push("ALTER TABLE `" + tableName + "` ALTER `" + data.options.value + "` SET DEFAULT '" + defaultValue + "';");
            }
        } else {
            // Set optional
            attributesObj[data.options.value].defaultValue = null;
            // TODO postgres
            if (data.sqlDataType && data.dialect == "mysql") {
                toSync.queries.push("ALTER TABLE `" + tableName + "` CHANGE `" + data.options.value + "` `" + data.options.value + "` " + data.sqlDataType + length + " NULL");
                toSync.queries.push("ALTER TABLE `" + tableName + "` ALTER `" + data.options.value + "` SET DEFAULT NULL;");
            }
        }
        fs.writeFileSync(jsonPath, JSON.stringify(toSync, null, 4));
        fs.writeFileSync(pathToAttributesJson, JSON.stringify(attributesObj, null, 4));
    } else {
        // If not in attributes, maybe in options
        let pathToOptionJson = __dirname + '/../workspace/' + data.application.name + '/models/options/' + data.entity_name + ".json";
        let optionsObj = JSON.parse(fs.readFileSync(pathToOptionJson, "utf8"));
        let aliasValue = "r_" + data.options.value.substring(2);
        for (let i = 0; i < optionsObj.length; i++)
            if (optionsObj[i].as == aliasValue)
                optionsObj[i].allowNull = set ? false : true;

        // Set option allowNull
        fs.writeFileSync(pathToOptionJson, JSON.stringify(optionsObj, null, 4));
    }

    return;
}

exports.setUniqueField = (data) => {

    let possibilityUnique = ["unique"];
    let possibilityNotUnique = ["not-unique", "non-unique"];

    let attribute = data.options.word.toLowerCase();
    let set = null;

    if (possibilityUnique.indexOf(attribute) != -1)
        set = true;
    else if (possibilityNotUnique.indexOf(attribute) != -1)
        set = false;
    else
        throw new Error('structure.field.attributes.notUnderstand');

    // Update the Sequelize attributes.json to set unique
    let pathToAttributesJson = __dirname + '/../workspace/' + data.application.name + '/models/attributes/' + data.entity_name + ".json";
    let attributesContent = fs.readFileSync(pathToAttributesJson);
    let attributesObj = JSON.parse(attributesContent);

    // If the current field is an fk field then we won't find it in attributes.json
    if (typeof attributesObj[data.options.value] !== "undefined")
        attributesObj[data.options.value].unique = set ? true : false;
    fs.writeFileSync(pathToAttributesJson, JSON.stringify(attributesObj, null, 4));

    return;
}

exports.setFieldAttribute = async (data) => {

    let targetField = data.options.value;
    let word = data.options.word.toLowerCase();
    let attributeValue = data.options.attributeValue.toLowerCase();
    let pathToViews = __dirname + '/../workspace/' + data.application.name + '/views/' + data.entity.name;

    // Update create_fields.dust file
    let $ = await domHelper.read(pathToViews + '/create_fields.dust');
    if ($("*[data-field='" + targetField + "']").length > 0) {

        $("*[data-field='" + targetField + "']").find('input').attr(word, attributeValue);
        $("*[data-field='" + targetField + "']").find('select').attr(word, attributeValue);

        await domHelper.write(pathToViews + '/create_fields.dust', $);

        // Update update_fields.dust file
        $ = await domHelper.read(pathToViews + '/update_fields.dust');

        $("*[data-field='" + targetField + "']").find('input').attr(word, attributeValue);
        $("*[data-field='" + targetField + "']").find('select').attr(word, attributeValue);

        await domHelper.write(pathToViews + '/update_fields.dust', $);
    } else {
        let err = new Error('structure.field.attributes.fieldNoFound');
        err.messageParams = [data.options.showValue];
        throw err;
    }
    return true;
}

exports.setupRelatedToField = async (data) => {
    let target = data.options.target;
    let urlTarget = data.options.urlTarget;
    let source = data.source_entity.name;
    let alias = data.options.as;
    let urlAs = data.options.urlAs;

    // Check if field is used in select, default to id
    let usingField = [{value: "id", type: "string"}];
    let showUsingField = ["ID"];

    if (typeof data.options.usingField !== "undefined")
        usingField = data.options.usingField;
    if (typeof data.options.showUsingField !== "undefined")
        showUsingField = data.options.showUsingField;

    let usingList = [], usingOption = [];
    for (let i = 0; i < usingField.length; i++) {
        usingList.push(usingField[i].value);
        usingOption.push('{' + usingField[i].value + '|' + usingField[i].type + '}');
    }

    // --- CREATE_FIELD ---
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

    let fileBase = __dirname + '/../workspace/' + data.application.name + '/views/' + source;
    let file = 'create_fields';
    await updateFile(fileBase, file, select);

    // --- UPDATE_FIELD ---
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
    await updateFile(fileBase, file, select);

    // --- SHOW_FIELD ---
    // Add read only field in show file. No tab required
    let str = "";
    str = "<div data-field='f_" + urlAs + "' class='fieldLineHeight col-xs-12'>\n<div class='form-group'>\n";
    str += "    <label for='" + alias + "'><!--{#__ key=\"entity." + source + "." + alias + "\"/}--></label>\n";
    str += "    <input class='form-control input' placeholder='{#__ key=|entity." + source + "." + alias + "| /}' name='" + alias + "' value='";
    for (let i = 0; i < usingField.length; i++) {
        str += "{" + alias + "." + usingField[i].value + "|" + usingField[i].type + "}";
        if (i != usingField.length - 1)
            str += " - ";
    }
    str += "' ";
    str += "type='text' readOnly />\n";
    str += "</div>\n</div>\n";

    file = fileBase + '/show_fields.dust';
    let $ = await domHelper.read(file);
    $("#fields").append(str);

    await domHelper.write(file, $)

    for (let i = 0; i < usingField.length; i++) {
        let targetField = (usingField[i].value == "id") ? "id_entity" : usingField[i].value;

        // Add <th> in list_field
        let toAddInList = {headers: '', body: ''};

        /* ------------- Add new FIELD in headers ------------- */
        let str = '<th data-field="' + alias + '" data-col="' + alias + '.' + usingField[i].value + '"';
        str += ' data-type="' + usingField[i].type + '"';
        str += '>\n';
        str += '<!--{#__ key="entity.' + source + '.' + alias + '"/}-->&nbsp;-&nbsp;<!--{#__ key="entity.' + target + '.' + targetField + '"/}-->\n';
        str += '</th>\n';
        toAddInList.headers = str;

        /* ------------- Add new FIELD in body (for associations include in tabs) ----- */
        str = '<td data-field="' + alias + '"';
        str += ' data-type="' + usingField[i].type + '"';
        str += ' >{' + alias + '.' + usingField[i].value + '}</td>';
        toAddInList.body = str;

        await updateListFile(fileBase, "list_fields", toAddInList.headers);
    }

    await translateHelper.writeLocales(data.application.name, "aliasfield", source, [alias, data.options.showAs], data.googleTranslate);
    return;
}

exports.setupRelatedToMultipleField = async (data) => {

    let urlTarget = data.options.urlTarget;
    let source = data.source_entity.name;
    let alias = data.options.as;
    let urlAs = data.options.urlAs;
    let fileBase = __dirname + '/../workspace/' + data.application.name + '/views/' + source;

    // Gestion du field à afficher dans le select du fieldset, par defaut c'est l'ID
    let usingField = [{value: "id", type: "string"}];
    let showUsingField = ["ID"];

    if (typeof data.options.usingField !== "undefined")
        usingField = data.options.usingField;
    if (typeof data.options.showUsingField !== "undefined")
        showUsingField = data.options.showUsingField;

    let usingList = [], usingOption = [];
    for (let i = 0; i < usingField.length; i++) {
        usingList.push(usingField[i].value);
        usingOption.push('{' + usingField[i].value + '|' + usingField[i].type + '}');
    }

    // CREATE_FIELD
    let head = '\
    <div data-field="f_' + urlAs + '" class="fieldLineHeight col-xs-12" '+ (data.options.isCheckbox ? 'style="margin-bottom: 25px;"' : "") +'>\n\
        <div class="form-group">\n\
            <label for="f_' + urlAs + '">\n\
                <!--{#__ key="entity.' + source + '.' + alias + '" /}-->\n\
                <!--{@inline_help field="' + alias + '"}-->\n\
                    <i data-field="' + alias + '" class="inline-help fa fa-info-circle" style="color: #1085EE"></i>\n\
                <!--{/inline_help}-->\n\
            </label>\n';

    let select;
    if (data.options.isCheckbox) {
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
    await updateFile(fileBase, 'create_fields', head + select);

    // UPDATE_FIELD
    if (data.options.isCheckbox) {
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
    await updateFile(fileBase, 'update_fields', head + select);

    // SHOW_FIELD
    select = '';
    if (data.options.isCheckbox) {
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

    file = fileBase + '/show_fields.dust';
    let $ = await domHelper.read(file);
    $("#fields").append(head + select);
    await domHelper.write(file, $);
    await translateHelper.writeLocales(data.application.name, "aliasfield", source, [alias, data.options.showAs], data.googleTranslate);
    return;
}

exports.deleteField = async (data) => {

    let workspacePath = __dirname + '/../workspace/' + data.application.name;
    let field = data.options.value;
    let url_value = data.options.urlValue;
    let isInOptions = false;
    let info = {};

    // Check if field is in options with relation=belongsTo, it means its a relatedTo association and not a simple field
    let jsonPath = workspacePath + '/models/options/' + data.entity.name + '.json';

    // Clear the require cache
    let dataToWrite = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let deletedOptionsTarget = [];
    for (let i = 0; i < dataToWrite.length; i++) {
        if (dataToWrite[i].as.toLowerCase() == "r_" + url_value) {
            if (dataToWrite[i].relation != 'belongsTo' && dataToWrite[i].structureType != "relatedToMultiple" && dataToWrite[i].structureType != "relatedToMultipleCheckbox")
                throw new Error(data.entity.name + " isn't a regular field. You might want to use `delete tab` instruction.");

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
    for (var i = 0; i < deletedOptionsTarget.length; i++) {
        autoGenerateFound = false;
        targetJsonPath = workspacePath + '/models/options/' + deletedOptionsTarget[i].target + '.json';
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
    var viewsPath = workspacePath + '/views/' + data.entity.name + '/';
    var fieldsFiles = ['create_fields', 'update_fields', 'show_fields'];
    var promises = [];
    for (var i = 0; i < fieldsFiles.length; i++)
        promises.push(new Promise((resolve, reject) => {
            (function (file) {
                domHelper.read(file).then(function ($) {
                    $('*[data-field="' + field + '"]').remove();
                    // In case of related to
                    $('*[data-field="r_' + field.substring(2) + '"]').remove();
                    domHelper.write(file, $).then(function () {
                        resolve();
                    });
                });
            })(viewsPath + '/' + fieldsFiles[i] + '.dust');
        }));

    // Remove field from list view file
    promises.push(new Promise((resolve, reject) => {
        domHelper.read(viewsPath + '/list_fields.dust').then($ => {
            $("th[data-field='" + field + "']").remove();

            // In case of related to
            $("th[data-col^='r_" + field.substring(2) + ".']").remove();
            domHelper.write(viewsPath + '/list_fields.dust', $).then(_ => {
                resolve();
            });
        });
    }));

    let optionsPath = workspacePath + '/models/options/';
    let otherViewsPath = workspacePath + '/views/';
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
                    currentOption[i].target == data.entity.name &&
                    typeof currentOption[i].usingField !== "undefined") {
                // Check if our deleted field is in the using fields
                for (var j = 0; j < currentOption[i].usingField.length; j++) {
                    if (currentOption[i].usingField[j].value == field) {
                        for (var k = 0; k < fieldsFiles.length; k++) {
                            // Clean file
                            let content = fs.readFileSync(otherViewsPath + currentEntity + '/' + fieldsFiles[k] + '.dust', "utf8")
                            content = content.replace(new RegExp(currentOption[i].as + "." + field, "g"), currentOption[i].as + ".id");
                            content = content.replace(new RegExp(currentOption[i].target + "." + field, "g"), currentOption[i].target + ".id_entity");
                            fs.writeFileSync(otherViewsPath + currentEntity + '/' + fieldsFiles[k] + '.dust', content);
                            // Looking for select in create / update / show
                            promises.push(new Promise((resolve, reject)=> {
                                (function (file, option, entity) {
                                    domHelper.read(otherViewsPath + entity + '/' + file + '.dust').then(function ($) {
                                        let el = $("select[name='" + option.as + "'][data-source='" + option.target.substring(2) + "']");
                                        if (el.length > 0) {
                                            let using = el.attr("data-using").split(",");
                                            if (using.indexOf(field) != -1) {
                                                // If using is alone, then replace with id, or keep just other using
                                                if (using.length == 1) {
                                                    el.attr("data-using", "id")
                                                } else {
                                                    using.splice(using.indexOf(field), 1)
                                                    el.attr("data-using", using.join())
                                                }
                                                el.html(el.html().replace(new RegExp(field, "g"), "id"))
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
    await Promise.all(promises);

    // Remove translation in enum locales
    var enumsPath = workspacePath + '/locales/enum_radio.json';
    var enumJson = JSON.parse(fs.readFileSync(enumsPath));

    if (typeof enumJson[data.entity.name] !== "undefined") {
        if (typeof enumJson[data.entity.name][info.fieldToDrop] !== "undefined") {
            delete enumJson[data.entity.name][info.fieldToDrop];
            fs.writeFileSync(enumsPath, JSON.stringify(enumJson, null, 4));
        }
    }

    // Remove translation in global locales
    var fieldToDropInTranslate = info.isConstraint ? "r_" + url_value : info.fieldToDrop;
    translateHelper.removeLocales(data.application.name, "field", [data.entity.name, fieldToDropInTranslate])
    return info;
}

exports.updateListFile = updateListFile;
