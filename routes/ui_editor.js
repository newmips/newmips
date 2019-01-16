var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var fs = require('fs');
var domHelper = require('../utils/jsDomHelper');
var language = require('../services/language');
var gitHelper = require('../utils/git_helper');
var models = require('../models/');

function applyToAllEntity(currentHtml, notPage, entity, idApp, screenMode) {
    return new Promise(function(resolve, reject) {
        var pageFiles = ['create_fields.dust', 'update_fields.dust', 'show_fields.dust', 'print_fields.dust'];
        var ctp = 0;

        for (var i = 0; i < pageFiles.length; i++) {
            if (pageFiles[i] != notPage) {
                var pageUri = __dirname + '/../workspace/' + idApp + '/views/' + entity + '/' + pageFiles[i];
                (function(currentURI, currentPage, currentHtmlBis) {
                    domHelper.read(currentURI).then(function($) {
                        var saveDataField = {};

                        // Save current state of fields in the current working page
                        $("div[data-field]").each(function() {
                            saveDataField[$(this).attr("data-field")] = $(this)[0].innerHTML;
                        });

                        if (currentPage == "print_fields.dust") {
                            currentHtmlBis("div[data-field]").each(function() {
                                var gridSize = "12";
                                var classes = currentHtmlBis(this).attr("class").split(" ");
                                switch (screenMode) {
                                    case "Desktop":
                                        gridSize = /col-md-([^ ]+)/.exec(currentHtmlBis(this).attr("class"))[1];
                                        break;
                                    case "Tablet":
                                        gridSize = /col-sm-([^ ]+)/.exec(currentHtmlBis(this).attr("class"))[1];
                                        break;
                                    case "Phone":
                                        gridSize = /col-xs-([^ ]+)/.exec(currentHtmlBis(this).attr("class"))[1];
                                        break;
                                }

                                for (var i = 0; i < classes.length; i++) {
                                    if (classes[i].indexOf("col-") != -1) {
                                        currentHtmlBis(this).removeClass(classes[i]);
                                    }
                                }
                                currentHtmlBis(this).addClass("col-xs-" + gridSize);
                            });
                        }

                        // Loop on source entity fields
                        currentHtmlBis("div[data-field]").each(function() {
                            if (typeof saveDataField[currentHtmlBis(this).attr("data-field")] === "undefined") {
                                currentHtmlBis(this).remove();
                                console.log("ERROR: Cannot find field " + currentHtmlBis(this).attr("data-field") + " in apply all UI designer function, it won't be restitute correctly !")
                            } else
                                currentHtmlBis(this).html(saveDataField[currentHtmlBis(this).attr("data-field")]);
                            saveDataField[currentHtmlBis(this).attr("data-field")] = true;
                        });

                        // Missing fields from the source that we'll append in col-xs-12
                        for (var field in saveDataField) {
                            if (saveDataField[field] != true) {
                                var newDiv = "<div data-field='" + field + "' class='fieldLineHeight col-xs-12 col-sm-12 col-md-12'>";
                                newDiv += saveDataField[field];
                                newDiv += "</div>";
                                currentHtmlBis("div[data-field]:last").after(newDiv);
                            }
                        }

                        // Find all rows and group them to be appended to #fields
                        var packedRow = '';
                        for (var i = 0; i < currentHtmlBis("body").children('.row').length; i++)
                            if (currentHtmlBis("body").children('.row').eq(i).html() != "")
                                packedRow += currentHtmlBis("body").children('.row').eq(i).html();

                        domHelper.insertHtml(currentURI, "#fields", packedRow).then(function() {
                            done(++ctp);
                        });
                    });
                })(pageUri, pageFiles[i], currentHtml);
            }
        }

        function done(cpt) {
            if (cpt == pageFiles.length - 1) {
                resolve();
            }
        }
    });
}

router.get('/getPage/:entity/:page', block_access.hasAccessApplication, function(req, res) {
    var page = req.params.page;
    var generatorLanguage = language(req.session.lang_user);

    if (!page || (page != 'create' && page != 'update' && page != 'show' && page != 'print'))
        return res.status(404).send(generatorLanguage.__("ui_editor.page_not_found"));
    page += '_fields.dust';

    var entity = req.params.entity;
    var workspaceLanguage = require(__dirname + '/../workspace/' + req.session.id_application + '/services/language')(req.session.lang_user);

    var pageUri = __dirname + '/../workspace/' + req.session.id_application + '/views/' + entity + '/' + page;
    domHelper.read(pageUri).then(function($) {
        // Encapsulate traduction with span to be able to translate, keep comment for later use
        var tradRegex = new RegExp(/(<!--{@__ key="(.*)" ?\/}-->)/g);
        $("body #fields")[0].innerHTML = $("body #fields")[0].innerHTML.replace(tradRegex, '<span class="trad-result">$2</span><span class="trad-src">$1</span>');

        // Translate each .trad-result
        $(".trad-result").each(function() {
            var tradKey = $(this).text();
            $(this).text(workspaceLanguage.__(tradKey));
        });

        $("option").each(function() {
            var comment = $(this).contents().filter(function() {
                return this.nodeType === 8;
            }).get(0);
            if (typeof comment !== "undefined")
                $(this).text(comment.nodeValue);
        });

        res.status(200).send($("#fields")[0].outerHTML);
    }).catch(function(err) {
        console.error(err);
        res.status(404).send(generatorLanguage.__("ui_editor.page_not_found"));
    });
});

router.post('/setPage/:entity/:page', block_access.hasAccessApplication, function(req, res) {
    var page = req.params.page;
    var generatorLanguage = language(req.session.lang_user);

    if (!page || (page != 'create' && page != 'update' && page != 'show' && page != 'print'))
        return res.status(404).send(generatorLanguage.__("ui_editor.page_not_found"));
    page += '_fields.dust';

    var entity = req.params.entity;
    var html = req.body.html;

    var pageUri = __dirname + '/../workspace/' + req.session.id_application + '/views/' + entity + '/' + page;
    domHelper.loadFromHtml(html).then(function($) {
        $("option").each(function() {
            var trad = $(this).data('trad');
            $(this).text(trad);
        });

        // Remove "forced" traduction
        $(".trad-result").remove();

        // Pull dust traduction out of .trad-src span
        $(".trad-src").each(function() {
            $(this).replaceWith($(this).html());
        });

        // Remove grid-editor left overs (div.ge-content, .column)
        $(".ge-content").each(function() {
            var toExtract = $(this).html();
            $(this).parent().removeClass('column').html(toExtract);
        });

        // If it's a print page we need to remove all col-sm, col-md and col-lg, only col-xs are used
        if (page == "print_fields.dust") {
            $("div[data-field]").each(function() {
                var classes = $(this).attr("class").split(" ");
                for (var i = 0; i < classes.length; i++) {
                    if (classes[i].indexOf("col-") != -1 && classes[i].indexOf("col-xs") == -1) {
                        $(this).removeClass(classes[i]);
                    }
                }
            });
        }

        // Find all rows and group them to be appended to #fields
        var packedRow = '';
        for (var i = 0; i < $("body").children('.row').length; i++)
            if ($("body").children('.row').eq(i).html() != "")
                packedRow += $("body").children('.row').eq(i).html();

        function git() {
            // We simply add session values in attributes array
            var attr = {};
            attr.function = "Save a file from UI designer: " + pageUri;
            attr.id_project = req.session.id_project;
            attr.id_application = req.session.id_application;
            attr.id_module = "-";
            attr.id_data_entity = "-";

            gitHelper.gitCommit(attr, function(err, infoGit) {
                if (err)
                    console.error(err);
                if (req.body.applyAll == "true")
                    res.status(200).send(generatorLanguage.__("ui_editor.page_saved_all"));
                else
                    res.status(200).send(generatorLanguage.__("ui_editor.page_saved"));
            });
        }

        domHelper.insertHtml(pageUri, "#fields", packedRow).then(function() {

            // If the user ask to apply on all entity
            if (req.body.applyAll == "true") {
                applyToAllEntity($, page, entity, req.session.id_application, req.body.screenMode).then(function() {
                    git();
                });
            } else {

                git();
            }
        });

    }).catch(function(e) {
        console.log(e);
        res.status(500).send(generatorLanguage.__("ui_editor.page_not_found"));
    });
});

module.exports = router;