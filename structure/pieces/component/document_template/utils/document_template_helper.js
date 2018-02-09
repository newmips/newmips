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
        'two': 'Deux'
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
        'two': 'Two'
    }
};
var lang = 'fr-FR';


module.exports = {
    entities_to_exclude: [
        'E_action', 'E_api_credentials', 'E_inline_help', 'E_media', 'E_media_function', 'E_media_mail',
        'E_notification', 'E_status', 'E_document_template', 'E_media_notification', 'E_translation',
        '7_e_media_notification_e_group', '7_e_media_notification_e_user', '7_e_notification_e_user', '7_status_children'
    ],
    get_entities: function (models) {
        /**Get all models**/
        var entities = models.sequelize.models;
        var document_template_entities = [];
        if (entities) {
            for (var item in entities) {
                if (item.startsWith('E_') && this.entities_to_exclude.indexOf(item) < 0) {
                    var entity_to_show = item.replace('E_', '');
                    entity_to_show = entity_to_show.charAt(0).toUpperCase() + entity_to_show.slice(1);//uc first
                    document_template_entities.push({
                        value: entity_to_show,
                        item: entity_to_show
                    });
                }
            }
        }
        return document_template_entities;
    },
    rework: function (object, entity, reworkOptions) {
        try {
            var result = {};
            var options = typeof reworkOptions === 'undefined' ? {} : reworkOptions;
            for (var item in object.dataValues) {
                result[item] = object.dataValues[item];
            }
            var relationsOptions = require('../models/options/' + entity.toLowerCase() + '.json');
            var attributes = require('../models/attributes/' + entity.toLowerCase() + '.json');
            this.cleanData(result, options[entity], attributes);
            //now clean relation
            for (var i = 0; i < relationsOptions.length; i++) {
                var relation = relationsOptions[i];
                if (object[relation.as]) {
                    var relationAttributes = require('../models/attributes/' + relation.target + '.json');
                    if (relation.relation === "belongsTo") {
                        result[relation.as] = object[relation.as].dataValues;
                        this.cleanData(result[relation.as], options[relation.target], relationAttributes);
                    } else if (relation.relation === "hasMany") {
                        result[relation.as] = [];
                        //be carefull if we have a lot lot lot lot of data.
                        for (var j = 0; j < object[relation.as].length; j++) {
                            result[relation.as].push(object[relation.as][j].dataValues);
                            this.cleanData(result[relation.as][j], options[relation.target], relationAttributes);
                        }
                    }
                }
            }
            return result;
        } catch (e) {
            return {};
        }
    },
    cleanData: function (object, reworkOptions, attributes) {
        for (var item in object) {
            if (object[item] == 'null' || object[item] == null || typeof object[item] === "undefined")
                object[item] = '';
            //clean all date
            for (var attr in attributes) {
                var attribute = attributes[attr];
                if ((attribute.newmipsType === "date" || attribute.newmipsType === "datetime") && attr === item) {
                    var format = attribute.newmipsType === "datetime" ? "DD/MM/YYYY HH:mm:ss" : "DD/MM/YYYY";
                    object[item] = moment(object[item]).format(format);
                    break;
                }
            }
            if (reworkOptions) {
                for (var i = 0; i < reworkOptions.length; i++) {
                    var reworkOption = reworkOptions[i];
                    if (item === reworkOption.item) {
                        if (reworkOption.type === 'date' && object[item] != null && reworkOption.incomingFormat && reworkOption.newFormat)
                            object[item] = moment(object[item], reworkOption.incomingFormat).format(reworkOption.newFormat);
                        //add others types as need
                        break;
                    }
                }
            }
        }
    },
    build_help: function (entityRoot,userLang) {
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
    getAttributes: function (attributes) {
        var result = [];
        if (attributes)
            for (var item in attributes)
                result.push(item);
        return result;
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