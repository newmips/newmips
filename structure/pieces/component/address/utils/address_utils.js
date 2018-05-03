/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var addressConf = require('../addressconfig/addressConfig');

exports.generateFields = function (componentName, componentCodeName) {
    var result = {
        db_fields: {}
    };
//    var instanceId = component.id + 1;//counter component address 
//    var showHtml = "<div class='col-xs-12'>\n"
//            + '    <label>{@__ key="component.' + componentCodeName + '.label_component"/}</label>\n'
//            + "    <section id='" + componentCodeName + "_fields' class='col-xs-12 section_c_address'>\n";
    var createHtml = '<label>{@__ key="component.' + componentCodeName + '.label_component"/}</label>&nbsp;<a href="#" id="info_c_address_maps"><i class="fa fa-info-circle"></i></a><br><br>\n'
            + "    <section id='section_" + componentCodeName + "_fields' class='col-xs-12 section_c_address_fields '>\n";
    var updateHtml = '<label>{@__ key="component.' + componentCodeName + '.label_component"/}</label>&nbsp;&nbsp;<a href="#" id="info_c_address_maps"><i class="fa fa-info-circle"></i></a><br>'
            + "<br>\n    <section id='section_" + componentCodeName + "_fields' class='col-xs-12 section_c_address_fields'>\n";
    var showFieldsHtml = '';
    var headers = '';
    var tds = '';
    //for default
    if (addressConf.endpoint.enable) {
        createHtml += "        <div data-field='c_address_search_area' class='col-xs-12 div_c_address_search_area'>\n";
        createHtml += "            <div class='form-group'>\n";
        createHtml += "                <div class='input-group'>\n";
        createHtml += "                    <div class='input-group-addon'>\n";
        createHtml += "                        <i class='fa fa-map-marker' aria-hidden='true'></i>\n";
        createHtml += "                    </div>\n";
        createHtml += "                    <input class='input form-control c_address_search_area' id='c_address_search_area'  type='text' name='f_c_address_search_area' placeholder='{@__ key=\"component." + componentCodeName + ".search\"/}' >\n";
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
        updateHtml += "                    <input class='input form-control c_address_search_area' id='c_address_search_area'  type='text' name='f_c_address_search_area' placeholder='{@__ key=\"component." + componentCodeName + ".search\"/}' >\n";
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
            result.db_fields[dbcolumn] = attribute.sql || {type: 'STRING'};

            var required = attribute.required === true ? 'required' : '';
            var readonly = (attribute.readonly === false || typeof addressConf.endpoint === 'undefined' || addressConf.endpoint.enable === false) ? '' : 'readonly';
            var max = (typeof attribute.maxLength !== 'undefined' && attribute.maxLength !== '') ? 'maxlength="' + attribute.maxLength + '"' : '';
            var min = (typeof attribute.minLength !== 'undefined' && attribute.minLength !== '') ? 'minlength="' + attribute.minLength + '"' : '';

            var pattern = (typeof attribute.pattern !== 'undefined' && attribute.pattern !== '') ? 'pattern=' + attribute.pattern : '';
            var defaultValue = typeof attribute.defaultValue !== 'undefined' && attribute.defaultValue != '' ? 'value=' + attribute.defaultValue : '';
            var type = typeof attribute.type !== 'undefined' ? attribute.type : 'text';
            var display = 'block';
            if (type === "hidden")
                display = "none";

            createHtml += "        <div data-field='" + dbcolumn + "' class='col-xs-12' style='display:" + display + "'>\n"
            createHtml += "            <div class='form-group'>\n";
            createHtml += "                <label for='" + dbcolumn + "' class='" + required + "'> {@__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/} </label>\n";
            createHtml += "                <input class='input form-control c_address_field " + dbcolumn + " ' " + min + " " + max + " field='" + apiField + "' " + pattern + " " + defaultValue + "  type='" + type + "' placeholder='{@__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/}' name='" + dbcolumn + "' id='" + dbcolumn + "' " + required + " >\n";
            createHtml += "            </div>\n";
            createHtml += "        </div>\n";
            //Update
            updateHtml += "        <div data-field='" + dbcolumn + "' class='col-xs-12' style='display:" + display + "'>\n"
            updateHtml += "            <div class='form-group'>\n";
            updateHtml += "                <label for='" + dbcolumn + "' class='" + required + "'> {@__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/} </label>\n";
            updateHtml += "                <input class='input form-control c_address_field " + dbcolumn + " ' " + min + " " + max + " field='" + apiField + "' " + pattern + "  type='" + type + "' value='{c_address." + dbcolumn + "}' placeholder='{@__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/}' name='" + dbcolumn + "' id='" + dbcolumn + "' " + required + ">\n";
            updateHtml += "            </div>\n";
            updateHtml += "        </div>\n";
            //Show
            showFieldsHtml += "        <div data-field='" + dbcolumn + "' class='col-xs-12' style='display:" + display + "'>\n";
            showFieldsHtml += "            <div class='form-group'>\n";
            showFieldsHtml += "                <label for='" + dbcolumn + "' class='" + required + "'> {@__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/} </label>\n";
            showFieldsHtml += "                <input class='input form-control " + dbcolumn + " ' value='{c_address." + dbcolumn + "}' placeholder='{@__ key=\"component." + componentCodeName + "." + dbcolumn + "\"/}' name='" + dbcolumn + "' id='" + dbcolumn + "' readonly>\n";
            showFieldsHtml += "            </div>\n";
            showFieldsHtml += "        </div>\n";
            //headers
            headers += '<th data-field="c_address.' + dbcolumn + '" data-col="c_address.' + dbcolumn + '">\n';
            headers += '    {@__ key="component.' + componentCodeName + '.' + dbcolumn + '"/}\n';
            headers += '</th>\n';
            //tds
            tds += '\t\t<td data-field="c_address.' + dbcolumn + '">' + '{' + dbcolumn + '}</td>\n';
        }
    }
    createHtml += "    </section>\n";
    updateHtml += "    </section>\n";
//    showHtml += "    </section>\n</div>";
    result.createHtml = createHtml;
    result.updateHtml = updateHtml;
//    result.showHtml = showHtml;
    result.showFieldsHtml = showFieldsHtml;
    result.headers = headers;
    result.tds = tds;
    result.locales = locales;
    return result;
};
