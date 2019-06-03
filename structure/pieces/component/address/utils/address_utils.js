/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var addressConf = require('../addressconfig/addressConfig');

exports.generateFields = function (componentName, componentCodeName) {
    var result = {
        db_fields: {
            f_c_address_label: {
                type: 'STRING'
            }
        }
    };
    var createHtml = '<label>{#__ key="component.' + componentCodeName + '.label_component"/}</label>&nbsp;<a href="#" id="info_c_address_maps"><i class="fa fa-info-circle"></i></a><br><br>\n' +
            "    <section id='section_" + componentCodeName + "_fields' class='col-xs-12 section_c_address_fields '>\n";
    var updateHtml = '<label>{#__ key="component.' + componentCodeName + '.label_component"/}</label>&nbsp;&nbsp;<a href="#" id="info_c_address_maps"><i class="fa fa-info-circle"></i></a><br>' +
            "<br>\n    <section id='section_" + componentCodeName + "_fields' class='col-xs-12 section_c_address_fields'>\n";
    var showFieldsHtml = '';
    var headers = '';
    var tds = '';
    var singleHeader = '';
    var singleTD = '';

    // For default
    if (addressConf.endpoint.enable) {
        createHtml += "        <div data-field='c_address_search_area' class='col-xs-12 div_c_address_search_area'>\n";
        createHtml += "            <div class='form-group'>\n";
        createHtml += "                <div class='input-group'>\n";
        createHtml += "                    <div class='input-group-addon'>\n";
        createHtml += "                        <i class='fa fa-map-marker' aria-hidden='true'></i>\n";
        createHtml += "                    </div>\n";
        createHtml += "                    <input class='input form-control c_address_search_area' id='c_address_search_area'  type='text' name='f_c_address_search_area' placeholder='{#__ key=\"component." + componentCodeName + ".search\"/}' >\n";
        createHtml += "                </div>\n";
        createHtml += "            </div>\n";
        createHtml += "            <hr>\n";
        createHtml += "        </div>\n";

        updateHtml += "        <div data-field='c_address_search_area' class='col-xs-12 div_c_address_search_area'>\n";
        updateHtml += "            <div class='form-group'>\n";
        updateHtml += "                <div class='input-group'>\n";
        updateHtml += "                    <div class='input-group-addon'>\n";
        updateHtml += "                        <i class='fa fa-map-marker' aria-hidden='true'></i>\n";
        updateHtml += "                    </div>\n";
        updateHtml += "                    <input class='input form-control c_address_search_area' id='c_address_search_area'  type='text' name='f_c_address_search_area' placeholder='{#__ key=\"component." + componentCodeName + ".search\"/}' >\n";
        updateHtml += "                </div>\n";
        updateHtml += "                <input class='input form-control'  type='hidden'  name='c_address_id' value='{c_address.id}' >\n";
        updateHtml += "            </div>\n";
        updateHtml += "            <hr>\n";
        updateHtml += "        </div>\n";
    }
    var locales = {
        fr: {
            search: 'Saisir une adresse',
            label_component: componentName,
            name_component: componentName,
            plural_component: componentName,
            id_component: 'ID'
        },
        en: {
            search: 'Enter an address',
            label_component: componentName,
            name_component: componentName,
            plural_component: componentName,
            id_component: 'ID'
        }
    };
    for (var attributeKey in addressConf.attributes) {
        var attribute = addressConf.attributes[attributeKey];
        var addInForm = attribute.addInForm || false;
        if (addInForm) {
            //Api field apiField
            var apiField = attribute.apiField;

            //prefix dbcolumn name
            var dbcolumn = 'f_c_address_' + attributeKey.toLowerCase();
            //set lang
            if (typeof attribute.lang !== 'undefined') {
                locales.en[dbcolumn] = attribute.lang.en || '';
                locales.fr[dbcolumn] = attribute.lang.fr || '';
            }
            result.db_fields[dbcolumn] = attribute.sql || {
                type: 'STRING'
            };

            var required = attribute.required === true ? 'required' : '';
            var readonly = (attribute.readonly === false || typeof addressConf.endpoint === 'undefined' || addressConf.endpoint.enable === false) ? '' : 'readonly';
            var max = (typeof attribute.maxLength !== 'undefined' && attribute.maxLength !== '') ? 'maxlength="' + attribute.maxLength + '"' : '';
            var min = (typeof attribute.minLength !== 'undefined' && attribute.minLength !== '') ? 'minlength="' + attribute.minLength + '"' : '';

            var pattern = (typeof attribute.pattern !== 'undefined' && attribute.pattern !== '') ? 'pattern="' + attribute.pattern + '"' : '';
            var defaultValue = typeof attribute.defaultValue !== 'undefined' && attribute.defaultValue != '' ? 'value=' + attribute.defaultValue : '';

            var type = 'text';
            /*Hide or display field on different views,adapted for lon and lat fields*/
            var display_create = 'block', display_udpate = 'block', display_show = 'block';

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

            createHtml += "        <div data-field='" + dbcolumn + "' class='col-xs-12' style='display:" + display_create + "'>\n"
            createHtml += "            <div class='form-group'>\n";
            createHtml += "                <label for='" + dbcolumn + "' class='" + required + "'> {#__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/} </label>\n";
            createHtml += "                <input class='input form-control c_address_field " + dbcolumn + " ' " + min + " " + max + " field='" + apiField + "' " + pattern + " " + defaultValue + "  type='" + type + "' placeholder='{#__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/}' name='" + dbcolumn + "' id='" + dbcolumn + "' " + required + " >\n";
            createHtml += "            </div>\n";
            createHtml += "        </div>\n";
            // Update
            updateHtml += "        <div data-field='" + dbcolumn + "' class='col-xs-12' style='display:" + display_udpate + "'>\n"
            updateHtml += "            <div class='form-group'>\n";
            updateHtml += "                <label for='" + dbcolumn + "' class='" + required + "'> {#__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/} </label>\n";
            updateHtml += "                <input class='input form-control c_address_field " + dbcolumn + " ' " + min + " " + max + " field='" + apiField + "' " + pattern + "  type='" + type + "' value='{c_address." + dbcolumn + "}' placeholder='{#__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/}' name='" + dbcolumn + "' id='" + dbcolumn + "' " + required + ">\n";
            updateHtml += "            </div>\n";
            updateHtml += "        </div>\n";
            // Show
            showFieldsHtml += "        <div data-field='" + dbcolumn + "' class='col-xs-12' style='display:" + display_show + "'>\n";
            showFieldsHtml += "            <div class='form-group'>\n";
            showFieldsHtml += "                <label for='" + dbcolumn + "' class='" + required + "'> {#__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/} </label>\n";
            showFieldsHtml += "                <input class='input form-control " + dbcolumn + " ' value='{c_address." + dbcolumn + "}' placeholder='{#__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/}' name='" + dbcolumn + "' id='" + dbcolumn + "' readonly>\n";
            showFieldsHtml += "            </div>\n";
            showFieldsHtml += "        </div>\n";
            // Headers

            var header = '<th data-field="c_address.' + dbcolumn + '" data-col="c_address.' + dbcolumn + '">\n';
            header += '    {#__ key="component.' + componentCodeName + '.' + dbcolumn + '"/}\n';
            header += '</th>\n';
            var td = '\t\t<td data-field="c_address.' + dbcolumn + '">' + '{' + dbcolumn + '}</td>\n';

            headers += header;
            // tds
            tds += td;
            //build fields for parent table 
            if (attributeKey === 'label') {
                singleHeader = '<th data-field="c_address" data-col="c_address.' + dbcolumn + '" data-type="string">'
                        + '{#__ key="component.' + componentCodeName + '.label_component"/}'
                        + '</th>';
                singleTD = '<td data-field="c_address">' + '{c_address.' + dbcolumn + '}</td>\n';
            }
        }
    }
    createHtml += "    </section>\n";
    updateHtml += "    </section>\n";

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