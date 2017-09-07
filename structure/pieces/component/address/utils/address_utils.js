/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var addressConf = require('../addressconfig/addressConfig');

exports.generateFields = function () {
    var result = {
        db_fields: {}
    };
//    var instanceId = component.id + 1;//counter component address 
    var showHtml = "<div id='fields' class='c_address row'>\n";
    var createHtml = "<div id='fields' class='c_address row'>\n";
    var updateHtml = "<div id='fields' class='c_address row'>\n";
    var headers = '';
    var tds = '';
    //for default
    if (addressConf.endpoint.enable) {
        createHtml += "\t<div data-field='c_address_search' class='col-xs-12'>\n\t<div class='form-group'>";
        createHtml += "<div class='input-group'>\n";
        createHtml += "<div class='input-group-addon'>\n";
        createHtml += "<i class='fa fa-map-marker' aria-hidden='true'></i>\n";
        createHtml += "</div>\n\t\t<input class='input form-control' id='c_address_search'  type='text' name='c_address_search' placeholder='{@__ key=\"component.c_address.search\"/}' >\n";
        createHtml += "</div>\n";
        createHtml += "\t\t<input class='input form-control' id='c_address_search_config'  type='hidden'  name='c_address_search_config'  value='" + JSON.stringify(addressConf.endpoint) + "'>";
        createHtml += "\n\t</div>\n\t</div><hr>\n";

        updateHtml += "\t<div data-field='c_address_search' class='col-xs-12'>\n\t<div class='form-group'>\n";
        updateHtml += "<div class='input-group'>\n";
        updateHtml += "<div class='input-group-addon'>\n";
        updateHtml += "<i class='fa fa-map-marker' aria-hidden='true'></i>\n";
        updateHtml += "</div>\n\t\t<input class='input form-control' id='c_address_search'  type='text' name='c_address_search' placeholder='{@__ key=\"component.c_address.search\"/}' >\n";
        updateHtml += "</div>\n";
        updateHtml += "\t\t<input class='input form-control' id='c_address_search_config'  type='hidden'  name='c_address_search_config' value='" + JSON.stringify(addressConf.endpoint) + "'>";
        updateHtml += "\n\t</div>\n\t</div><hr>\n";
    }
    var locales = {
        fr: {
            search: 'Saisir une adresse',
            label_component: 'Adresse',
            name_component: "adresse",
            plural_component: "adresses",
            id_component: 'ID'
        },
        en: {
            search: 'Enter an address',
            label_component: 'Address',
            name_component: "address",
            plural_component: "addresses",
            id_component: 'ID'
        }
    };
    for (var attributeKey in addressConf.attributes) {
        var attribute = addressConf.attributes[attributeKey];
        var addInForm = attribute.addInForm || false;
        if (addInForm) {
            //Create
            var label = 'f_' + attribute.label;
            if (typeof attribute.lang !== 'undefined') {
                locales.en[label] = attribute.lang.en || '';
                locales.fr[label] = attribute.lang.fr || '';
            }
            //prefix dbcolumn name
            var dbcolumn = 'f_' + attributeKey.toLowerCase();
            result.db_fields[dbcolumn] = attribute.sql || {type: 'STRING'};
            var required = attribute.required === true ? 'required' : '';
            var readonly = (attribute.readonly === false || typeof addressConf.endpoint === 'undefined' || addressConf.endpoint.enable === false) ? '' : 'readonly';
            var max = (typeof attribute.maxLength !== 'undefined' && attribute.maxLength !== '') ? 'maxlength="' + attribute.maxLength + '"' : '';
            var min = (typeof attribute.minLength !== 'undefined' && attribute.minLength !== '') ? 'maxlength="' + attribute.inLength + '"' : '';
            var pattern = max !== '' && min !== '' ? 'pattern=".{' + attribute.minLength + ',' + attribute.maxLength + '}"' : '';//for input min max digit 
            var defaultValue = typeof attribute.defaultValue !== 'undefined' && attribute.defaultValue != '' ? 'value=' + attribute.defaultValue : '';
            var type = typeof attribute.type !== 'undefined' ? attribute.type : 'text';
            createHtml += "\t<div data-field='" + label + "' class='col-xs-12'>\n\t<div class='form-group'>\n";
            createHtml += "\t\t<label for='" + label + "' class='" + required + "'> {@__ key=\"component.c_address." + label + "\"/} </label>\n";
            createHtml += "\t\t<input class='input form-control' " + max + " " + pattern + " "+defaultValue+"  type='" + type + "' placeholder='{@__ key=\"component.c_address." + label + "\"/}' name='" + label + "' id='" + label + "' " + required + " " + readonly + ">";
            createHtml += "\n\t</div>\n\t</div>\n";
            //Update
            updateHtml += "\t<div data-field='" + label + "' class='col-xs-12'>\n\t<div class='form-group'>\n";
            updateHtml += "\t\t<label for='" + label + "' class='" + required + "'> {@__ key=\"component.c_address." + label + "\"/} </label>\n";
            updateHtml += "\t\t<input class='input form-control' " + max + " " + pattern + "  type='" + type + "' value='{" + dbcolumn + "}' placeholder='{@__ key=\"component.c_address." + label + "\"/}' name='" + label + "' id='" + label + "' " + required + " " + readonly + ">";
            updateHtml += "\n\t</div>\n\t</div>\n";
            //Show
            showHtml += "\t<div data-field='" + label + "' class='col-xs-12'>\n\t<div class='form-group'>\n";
            showHtml += "\t\t<label for='" + label + "' class='" + required + "'> {@__ key=\"component.c_address." + label + "\"/} </label>\n";
            showHtml += "\t\t<input class='input form-control' value='{" + dbcolumn + "}' placeholder='{@__ key=\"component.c_address." + label + "\"/}' name='" + label + "' id='" + label + "' readonly>";
            showHtml += "\n\t</div>\n\t</div>\n";
            //headers
            headers += '\t\t<th data-field="' + label + '" data-col="' + dbcolumn + '">';
            headers += '{@__ key="component.c_address.' + label + '"/}';
            headers += '</th>\n';
            //tds
            tds += '\t\t<td data-field="' + dbcolumn + '">' + '{' + dbcolumn + '}</td>\n';
        }
    }
    createHtml += "</div>";
    updateHtml += "</div>";
    showHtml += "</div>";
    result.createHtml = createHtml;
    result.updateHtml = updateHtml;
    result.showHtml = showHtml;
    result.headers = headers;
    result.tds = tds;
    result.locales = locales;
    return result;
};
