var moment = require('moment');
var globalConfig = require('../config/global');
var fs = require('fs');

var langMessage = {
    'fr-FR': {
        'fileTypeNotValid': 'Type de document non valide',
        'failToFillPDF': 'Erreur lors du remplissage du PDF',
        'useVariable': "Pour utiliser les variables de cette entité dans un <b>Docx</b>, veuillez les placer en l'intérieur de la boucle de l'entité.",
        'example': 'Exemple:',
        'name': 'nom',
        'output': 'Rendra réellement',
        'nl': 'Où NL= Nouvelle ligne vide',
        'empty': 'Pour empêcher les nouvelles lignes vides entre les données, placer la variable sur la même ligne que le début de la boucle',
        'whereIsNL': "Les nouvelles lignes sont conservées à l'intérieur des sections, donc le modèle exemple suivant",
        'one': 'Un',
        'two': 'Deux',
        readme: {
            pageTitle: "Modèle de document : variables utilisables",
            description: '<p style="text-align:justify;"> '
                    + "Les modèles de document sont utilisables dans l'onglet où est positionné le composant <strong>document template</strong> de chaque entité."
                    + "Pour ce faire, vous devez inclure dans les documents de type Word (Docx) ou PDF "
                    + "les variables listées ci-dessous.</p>"
                    + ' <p style="text-align:justify;">'
                    + "  Pour un template Docx, les variables doivent être copiées tel quel dans votre texte placées entre accolades."
                    + "  Elles seront remplacées à la volée par les données de l'entité au moment où vous cliquerez sur le bouton \"Générer\"."
                    + "</p>"
                    + "<p>NB: cliquez sur les titres des sections de chaque entité pour découvrir l'usage des variables.</p>",
            entityInformations: "Informations concernant l'entité",
            entityTableRow1: "Entité",
            entityTableRow2: "Variable",
            entityTableRow3: "Accès variable document format DOCX",
            entityTableRow4: "Accès variable document format PDF",
            entityTableRow5: "Description",
            variables: "Variables globales"
        },
        global: {
            variables: "Variables globales",
            description: "Ces variables commencent par un <strong> g_ </strong> et sont accessibles dans toutes les entités.",
            entityTableRow5: "Exemple"
        }
    },
    'en-EN': {
        'fileTypeNotValid': 'File type not valid',
        'failToFillPDF': 'Failed to fill PDF',
        'useVariable': 'To use the variables of this entity in a <b> Docx </b>, please place them within the loop of the entity.',
        'example': 'Example:',
        'name': 'name',
        'output': 'Will actually render',
        'nl': ' NL= New Line',
        'empty': 'To prevent new empty lines between data, place the variable on the same line of loop',
        'whereIsNL': "The new lines are kept inside the sections, so the following example template",
        'one': 'One',
        'two': 'Two',
        readme: {
            pageTitle: "Usable variables",
            description: '<p style="text-align:justify;"> '
                    + "The document templates can be used in the tab where the component is positioned. "
                    + "To do this, you must include the variables listed below in Word (Docx) or PDF documents</p>"
                    + ' <p style="text-align:justify;">'
                    + "  For a Docx template, variables must be copied in your text enclosed in braces."
                    + "  They will be replaced by the entity's data when you click on the \"Generate\" button who is on entity show page."
                    + "</p>"
                    + "<p>Click on each entity name to discover the use of the variables.</p>",
            entityInformations: "Entity informations",
            entityTableRow1: "Entity",
            entityTableRow2: "Variable",
            entityTableRow3: "Variable access for DOCX",
            entityTableRow4: "Variable access for PDF",
            entityTableRow5: "Description",
            variables: "Global variables"
        },
        global: {
            variables: "Global variables",
            description: "These varibales start with <strong>g_</strong> and are accessible in all entities.",
            entityTableRow5: "Example"
        }
    }
};
var lang = 'fr-FR';


module.exports = {
    entities_to_exclude: [
        'E_action', 'E_api_credentials', 'E_inline_help', 'E_media', 'E_media_function', 'E_media_mail',
        'E_notification', 'E_status', 'E_document_template', 'E_media_notification', 'E_translation',
        '7_e_media_notification_e_group', '7_e_media_notification_e_user', '7_e_notification_e_user', '7_status_children'
    ],
    globalVariables: [
        {name: 'g_today', description: 'Current date', type: 'date'},
        {name: 'g_date', description: 'Current date', type: 'date'},
        {name: 'g_time', description: 'Current time', type: 'time'},
        {name: 'g_datetime', description: 'Current datetime', type: 'datetime'}
    ],
    get_entities: function (models) {
        /**Get all models**/
        var entities = models.sequelize.models;
        var document_template_entities = [];
        if (entities) {
            for (var item in entities) {
                if (item.startsWith('E_') && this.entities_to_exclude.indexOf(item) < 0) {
                    var entity_to_show = item.replace('E_', '');
                    entity_to_show = entity_to_show.charAt(0).toUpperCase() + entity_to_show.slice(1); //uc first
                    document_template_entities.push({
                        value: entity_to_show,
                        item: entity_to_show
                    });
                }
            }
        }
        return document_template_entities;
    },
    rework: function (object, entityName, reworkOptions, userLang) {
        try {
            var result = {};
            var options = typeof reworkOptions === 'undefined' ? {} : reworkOptions;
            var relationsOptions = require('../models/options/' + entityName.toLowerCase() + '.json');
            var attributes = require('../models/attributes/' + entityName.toLowerCase() + '.json');
            for (var item in object.dataValues) {
                result[item] = object.dataValues[item];
            }
            var entityModelData = {
                entityName: entityName,
                attributes: attributes,
                options: options[entityName]
            };
            this.cleanData(result, entityModelData, userLang);
            //now clean relation
            for (var i = 0; i < relationsOptions.length; i++) {
                var relation = relationsOptions[i];
                if (object[relation.as]) {
                    var relationAttributes = require('../models/attributes/' + relation.target + '.json');
                    var entityModelData = {
                        entityName: relation.target,
                        attributes: relationAttributes,
                        options: options[relation.target]
                    };
                    if (relation.relation === "belongsTo") {
                        result[relation.as] = object[relation.as].dataValues;
                        this.cleanData(result[relation.as], entityModelData, userLang);
                    } else if (relation.relation === "hasMany") {
                        result[relation.as] = [];
                        //be carefull if we have a lot lot lot lot of data.
                        for (var j = 0; j < object[relation.as].length; j++) {
                            result[relation.as].push(object[relation.as][j].dataValues);
                            this.cleanData(result[relation.as][j], entityModelData, userLang);
                        }
                    }
                }
            }
            return result;
        } catch (e) {
            return {};
        }
    },
    cleanData: function (object, entityModelData, userLang) {
        var attributes = entityModelData.attributes;
        var reworkOptions = entityModelData.options;
        var entityName = entityModelData.entityName;
        for (var item in object) {
            if (object[item] == 'null' || object[item] == null || typeof object[item] === "undefined")
                object[item] = '';
            //clean all date
            for (var attr in attributes) {
                var attribute = attributes[attr];
                if ((attribute.newmipsType === "date" || attribute.newmipsType === "datetime") && attr === item) {
                    var format = this.getDateFormatUsingLang(userLang, attribute.newmipsType);
                    object[item] = moment(object[item]).format(format);
                    break;
                }
                /*if (attribute.newmipsType === "picture" && attr === item && object[item].split('-').length > 1) {
                 object[item] = "data:image/*;base64," + fs.readFileSync(globalConfig.localstorage + entityName + '/' + object[item].split('-')[0] + '/' + object[item]).toString('base64');
                 break;
                 }*/
            }
            if (reworkOptions) {
                for (var i = 0; i < reworkOptions.length; i++) {
                    var reworkOption = reworkOptions[i];
                    if (item === reworkOption.item) {
                        if ((reworkOption.type === 'date' || reworkOption.type === 'datetime') && object[item] != null && reworkOption.newFormat)
                            object[item] = moment(object[item], this.getDateFormatUsingLang(userLang, reworkOption.type)).format(reworkOption.newFormat);
                        //add others types as need
                        break;
                    }
                }
            }
        }
    },
    build_help: function (entityRoot, userLang) {
        var result = [];
        var attributes = require('../models/attributes/e_' + entityRoot.toLowerCase() + '.json');
        var options = require('../models/options/e_' + entityRoot.toLowerCase() + '.json');
        result.push({
            id: 0,
            message: '',
            attributes: this.getAttributes(attributes),
            entity: entityRoot,
            relation: 'root',
            color: "#ffffff"
        });
        //now get options entities and there attributes
        for (var i = 0; i < options.length; i++) {
            var relation = options[i];
            var attributes = require('../models/attributes/' + relation.target + '.json');
            var message = '';
            if (relation.relation === "belongsTo")
                message = "";
            else if (relation.relation === "belongsToMany" || relation.relation === "hasMany")
                message = langMessage[userLang || lang].useVariable
                        + "<p> " + langMessage[userLang || lang].example + ":<br>"
                        + "<pre>{#" + relation.target.replace('e_', 'r_') + "}<br>"
                        + "    {variable}<br>"
                        + "{/" + relation.target.replace('e_', 'r_') + "}"
                        + "</p></pre><hr>"
                        + "<i class='fa fa-exclamation-circle' style='color:orange'></i> " + langMessage[userLang || lang].whereIsNL + ": <br>"
                        + " <pre>"
                        + "{<br>"
                        + langMessage[userLang || lang].one + ": [{" + langMessage[userLang || lang].name + ": 'New'}]<br>"
                        + langMessage[userLang || lang].two + ": [{" + langMessage[userLang || lang].name + ": 'Mips'}]<br>"
                        + "}</pre><br>"
                        + langMessage[userLang || lang].output + ": "
                        + " <pre>"
                        + "NL<br>"
                        + "  <b>New</b> <br>"
                        + "NL <br>"
                        + "NL <br>"
                        + "  <b>Mips</b> <br>"
                        + "NL<br>"
                        + "</pre><br>"
                        + "<b> " + langMessage[userLang || lang].nl + "</b> <br>"
                        + langMessage[userLang || lang].empty + ": <br>"
                        + "{#" + relation.target.replace('e_', 'r_') + "}<b>{variable}</b><br>"
                        + "{/" + relation.target.replace('e_', 'r_') + "}<br><br>";
            var entity = relation.target.replace('e_', '');
            result.push({
                id: i + 1,
                message: message,
                attributes: this.getAttributes(attributes),
                entity: entity.charAt(0).toUpperCase() + entity.slice(1),
                as: relation.as,
                relation: relation.relation,
                color: "#" + this.randomColor(6)
            });
        }
        return result;
    },
    buildInclude: function (entity, f_exclude_relations, models) {
        var result = [];
        var options = require('../models/options/' + entity.toLowerCase() + '.json');
        f_exclude_relations = (f_exclude_relations || '').split(',');
        for (var i = 0; i < options.length; i++) {
            var found = false;
            var subEntity = 'E_' + options[i].target.toLowerCase().replace('e_', '');
            for (var j = 0; j < f_exclude_relations.length; j++) {
                if (options[i].target === 'e_' + f_exclude_relations[j].toLowerCase())
                    found = true;
            }
            if (!found)
                result.push({model: models[subEntity], as: options[i].as});
        }
        return result;
    },
    getRelations: function (entity) {
        var result = [];
        var options = require('../models/options/e_' + entity.toLowerCase() + '.json');
        for (var i = 0; i < options.length; i++) {
            var option = options[i];
            if (option.target && this.entities_to_exclude.indexOf(option.target) < 0) {
                var target = option.target.replace('e_', '');
                target = target.charAt(0).toUpperCase() + target.slice(1); //uc first
                result.push(target);
            }
        }
        return result;
    },
    getDateFormatUsingLang: function (userLang, type) {
        var l = typeof userLang === 'undefined' ? 'fr-FR' : userLang;
        switch (type) {
            case 'datetime':
                return l === 'fr-FR' ? 'DD/MM/YYYY HH:mm:ss' : 'YYYY-MM-DD HH:mm:ss';
            case 'date':
                return l === 'fr-FR' ? 'DD/MM/YYYY' : 'YYYY-MM-DD';
            case 'time':
                return 'HH:mm:ss';
            default:
                return l === 'fr-FR' ? 'DD/MM/YYYY' : 'YYYY-MM-DD';
        }
    },
    buildHTMLHelpEntitiesAjax: function (entities, userLang) {
        var html = '';
        entities.forEach(function (entity) {
            html += '<div class="panel box" style="border-top-color:' + entity.color + '">';
            html += '<div class="box-header with-border">';
            html += '             <h4 class="box-title">';
            html += '                 <a data-toggle="collapse" data-parent="#accordion" href="#collapse' + entity.id + '" aria-expanded="false" class="collapsed">';
            html += '                      ' + langMessage[userLang || lang].readme.entityInformations + ' ' + entity.entity;
            html += '                 </a>';
            html += '             </h4>';
            html += '        </div>';
            html += '         <div id="collapse' + entity.id + '" class="panel-collapse collapse" aria-expanded="false" style="height: 0px;">';
            html += '             <div class="col-xs-12">' + entity.message + '</div>';
            html += '             <div class="box-body">';
            html += '                 <table class="table table-striped table-responsive">';
            html += '                     <thead>';
            html += '                        <tr>';
            html += '                            <th style="width: 40px">' + langMessage[userLang || lang].readme.entityTableRow1 + '</th>';
            html += '                            <th>' + langMessage[userLang || lang].readme.entityTableRow2 + '</th>';
            html += '                            <th>' + langMessage[userLang || lang].readme.entityTableRow3 + '</th>';
            html += '                            <th>' + langMessage[userLang || lang].readme.entityTableRow4 + '</th>';
            html += '                             <th>' + langMessage[userLang || lang].readme.entityTableRow5 + '</th>';
            html += '                         </tr>';
            html += '                    </thead>';
            html += '                    <tbody>';
            entity.attributes.forEach(function (attribute) {
                html += '            <tr>';
                html += '            <td><span class="badge bg-red">' + entity.entity + '</span></td>';
                html += '            <td><span>' + attribute + '</span></td>';
                html += '             <td>';
                if (entity.relation == 'belongsTo') {
                    html += '&#123;' + entity.as + '.' + attribute + '&#125;';
                } else {
                    html += '&#123;' + attribute + '&#125;';
                }
                html += '             </td>';
                html += '             <td>';
                if (entity.relation == 'belongsTo') {
                    html += entity.as + '.' + attribute;
                } else {
                    html += attribute;
                }
                html += '             </td>';
                html += '             <td></td>';
                html += '         </tr>';
            });
            html += '                   </tbody>';
            html += '               </table>';
            html += '           </div>';
            html += '       </div>';
            html += '   </div>';
        });
        return html;
    },
    buildHTMLGlobalVariables: function (userLang) {
        var html = '';
        var l = userLang || lang;
        var formatDate = 'DD/MM/YYYY';
        var formatDateTime = 'DD/MM/YYYY HH:mm:ss';
        if (l === 'en-EN') {
            formatDate = 'YYYY-MM-DD';
            formatDateTime = 'YYYY-MM-DD HH:mm:ss';
        }
        html += '<h2>' + langMessage[l].global.variables + '</h2>';
        html += '<p>' + langMessage[l].global.description + '</p>';
        html += '                 <table class="table table-striped table-responsive">';
        html += '                     <thead>';
        html += '                        <tr>';
        html += '                            <th>' + langMessage[userLang || lang].readme.entityTableRow2 + '</th>';
        html += '                            <th>' + langMessage[userLang || lang].readme.entityTableRow3 + '</th>';
        html += '                            <th>' + langMessage[userLang || lang].readme.entityTableRow4 + '</th>';
        html += '                             <th>' + langMessage[userLang || lang].readme.entityTableRow5 + '</th>';
        html += '                         </tr>';
        html += '                    </thead>';
        html += '                    <tbody>';
        this.globalVariables.forEach(function (g) {
            html += '<tr>';
            html += '<td>' + g.name + '</td>';
            html += '<td>{' + g.name + '}</td>';
            html += '<td>' + g.name + '</td>';
            html += '<td>' + g.description + '</td>';
            html += '</tr>';
        });
        return html;
    },
    getAttributes: function (attributes) {
        var result = [];
        if (attributes)
            for (var item in attributes)
                result.push(item);
        return result;
    },
    getReadmeMessages: function (userLang) {
        return langMessage[userLang || lang].readme;
    },
    randomColor: function (size) {
        var text = "";
        var possible = "abcdef0123456789";
        for (var i = 0; i < size; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    },
    generateDoc: function (options) {
        return new Promise(function (resolve, reject) {
            switch (options.mimeType) {
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    resolve(generateDocxDoc(options));
                    break;
                case "application/pdf":
                    resolve(generatePDFDoc(options));
                    break;
                default:
                    reject({
                        message: langMessage[options.lang || lang].fileTypeNotValid
                    });
            }
        });
    }
};
var generateDocxDoc = function (options) {
    return new Promise(function (resolve, reject) {
        require('fs').readFile(options.file, function (err, content) {
            if (!err) {
                var JSZip = require('jszip');
                var Docxtemplater = require('docxtemplater');
                try {
                    var zip = new JSZip(content);
                    var doc = new Docxtemplater();
                    var templateOptions = {
                        nullGetter: function (part) {
                            if (part && part.value) {
                                var parts = part.value.split('.');
                                if (parts.length)
                                    return getValue(parts, options.data);
                                return "";
                            }
                            return "";
                        }
                    };
                    doc.setOptions(templateOptions);
                    doc.loadZip(zip);
                    doc.setData(options.data);
                    try {
                        doc.render();
                        var buf = doc.getZip()
                                .generate({type: 'nodebuffer', compression: "DEFLATE"});
                        resolve({
                            buffer: buf,
                            contentType: "application/msword",
                            ext: '.docx'
                        });
                    } catch (error) {
                        reject(error);
                    }
                } catch (e) {
                    reject(e);
                }
            } else
                reject({message: 'File not found'});
        });
    });
};
var generatePDFDoc = function (options) {
    return new Promise(function (resolve, reject) {
        var pdfFiller = require('pdffiller');
        var sourcePDF = options.file;
        var destinationPDF = globalConfig.localstorage + '' + Date.now() + '.pdf';
        var pdfData = buildPDFJSON(options.entity, options.data);
        pdfFiller.fillForm(sourcePDF, destinationPDF, pdfData, function (err) {
            if (err)
                reject({message: langMessage[options.lang || lang].failToFillPDF});
            fs.readFile(destinationPDF, function (err, buffer) {
                if (err)
                    reject({message: ''});
                else {
                    fs.unlink(destinationPDF, function (e) {});
                    resolve({
                        buffer: buffer,
                        contentType: "application/pdf",
                        ext: '.pdf'
                    });
                }
            });
        });
    });
};
var buildPDFJSON = function (entityRoot, data) {
    var result = {};
    var relationsOptions = require('../models/options/' + entityRoot.toLowerCase() + '.json');
    for (var item in data) {
        result[item] = data[item];
        for (var i = 0; i < relationsOptions.length; i++) {
            var relation = relationsOptions[i];
//                if (item === relation.as && relation.relation === "hasMany")
//                    result[item] = data[item];
            if (item === relation.as && relation.relation === "belongsTo") {
                for (var item2 in data[item])
                    result[relation.as + '.' + item2] = data[item][item2];
                delete result[relation.as];
            }
        }
    }
    return result;
};
//get value with key as x.y.z
var getValue = function (cellArrayKeyValue, row) {
    var i = 0;
    var key = cellArrayKeyValue[i];
    do {
        if (row != null && typeof row[key] !== 'undefined') {
            row = row[key];
        } else
            return '';
        i++;
        key = cellArrayKeyValue[i];
    } while (i < cellArrayKeyValue.length);
    return row;
}