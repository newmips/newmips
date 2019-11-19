const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const domHelper = require('../utils/jsDomHelper');
const language = require('../services/language');
const gitHelper = require('../utils/git_helper');

function applyToAllEntity(currentHtml, notPage, entity, idApp) {
	return new Promise((resolve, reject) => {
		const pageFiles = ['create_fields.dust', 'update_fields.dust', 'show_fields.dust'];
		let ctp = 0;

		function done(cpt) {
			if (cpt == pageFiles.length - 1) {
				resolve();
			}
		}

		for (let i = 0; i < pageFiles.length; i++) {
			if (pageFiles[i] != notPage) {
				const pageUri = __dirname + '/../workspace/' + idApp + '/views/' + entity + '/' + pageFiles[i];
				(function(currentURI, currentPage, currentHtmlBis) {
					domHelper.read(currentURI).then(function($) {
						const saveDataField = {};

						// Save current state of fields in the current working page
						$("div[data-field]").each(_ => {
							saveDataField[$(this).attr("data-field")] = $(this)[0].innerHTML;
						});

						// Loop on source entity fields
						currentHtmlBis("div[data-field]").each(_ => {
							if (typeof saveDataField[currentHtmlBis(this).attr("data-field")] === "undefined") {
								currentHtmlBis(this).remove();
								console.log("ERROR: Cannot find field " + currentHtmlBis(this).attr("data-field") + " in apply all UI designer function, it won't be restitute correctly !")
							} else
								currentHtmlBis(this).html(saveDataField[currentHtmlBis(this).attr("data-field")]);
							saveDataField[currentHtmlBis(this).attr("data-field")] = true;
						});

						// Missing fields from the source that we'll append in col-xs-12
						for (const field in saveDataField) {
							if (saveDataField[field] != true) {
								let newDiv = "<div data-field='" + field + "' class='fieldLineHeight col-xs-12 col-sm-12 col-md-12'>";
								newDiv += saveDataField[field];
								newDiv += "</div>";
								currentHtmlBis("div[data-field]:last").after(newDiv);
							}
						}

						// Find all rows and group them to be appended to #fields
						let packedRow = '';
						for (let i = 0; i < currentHtmlBis("body").children('.row').length; i++)
							if (currentHtmlBis("body").children('.row').eq(i).html() != "")
								packedRow += currentHtmlBis("body").children('.row').eq(i).html();

						domHelper.insertHtml(currentURI, "#fields", packedRow).then(_ => {
							done(++ctp);
						});
					}).catch(err => {
						reject(err);
					})
				})(pageUri, pageFiles[i], currentHtml);
			}
		}
	});
}

router.get('/getPage/:entity/:page', block_access.hasAccessApplication, function(req, res) {
	let page = req.params.page;
	const generatorLanguage = language(req.session.lang_user);

	if (!page || page != 'create' && page != 'update' && page != 'show')
		return res.status(404).send(generatorLanguage.__("ui_editor.page_not_found"));
	page += '_fields.dust';

	const entity = req.params.entity;
	const workspaceLanguage = require(__dirname + '/../workspace/' + req.session.id_application + '/services/language')(req.session.lang_user); // eslint-disable-line

	const pageUri = __dirname + '/../workspace/' + req.session.id_application + '/views/' + entity + '/' + page;
	domHelper.read(pageUri).then(function($) {
		// Encapsulate traduction with span to be able to translate, keep comment for later use
		const tradRegex = new RegExp(/(<!--{#__ key="(.*)" ?\/}-->)/g);
		$("body #fields")[0].innerHTML = $("body #fields")[0].innerHTML.replace(tradRegex, '<span class="trad-result">$2</span><span class="trad-src">$1</span>');

		// Translate each .trad-result
		$(".trad-result").each(_ => {
			const tradKey = $(this).text();
			$(this).text(workspaceLanguage.__(tradKey));
		});

		$("option").each(_ => {
			const comment = $(this).contents().filter(_ => this.nodeType === 8).get(0);
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
	let page = req.params.page;
	const generatorLanguage = language(req.session.lang_user);

	if (!page || page != 'create' && page != 'update' && page != 'show')
		return res.status(404).send(generatorLanguage.__("ui_editor.page_not_found"));
	page += '_fields.dust';

	const entity = req.params.entity;
	const html = req.body.html;

	const pageUri = __dirname + '/../workspace/' + req.session.id_application + '/views/' + entity + '/' + page;
	domHelper.loadFromHtml(html).then(function($) {
		$("option").each(_ => {
			const trad = $(this).data('trad');
			$(this).text(trad);
		});

		// Remove "forced" traduction
		$(".trad-result").remove();

		// Pull dust traduction out of .trad-src span
		$(".trad-src").each(_ => {
			$(this).replaceWith($(this).html());
		});

		// Remove grid-editor left overs (div.ge-content, .column)
		$(".ge-content").each(_ => {
			const toExtract = $(this).html();
			$(this).parent().removeClass('column').html(toExtract);
		});

		// Find all rows and group them to be appended to #fields
		let packedRow = '';
		for (let i = 0; i < $("body").children('.row').length; i++)
			if ($("body").children('.row').eq(i).html() != "")
				packedRow += $("body").children('.row').eq(i).html();

		function git() {
			// We simply add session values in attributes array
			const data = {
				application: req.session.app_name,
				entity: req.session.entity_name,
				field: req.session.field_name,
				function: "Save a file from UI designer: " + pageUri
			};

			gitHelper.gitCommit(data, err => {
				if (err)
					console.error(err);
				if (req.body.applyAll == "true")
					res.status(200).send(generatorLanguage.__("ui_editor.page_saved_all"));
				else
					res.status(200).send(generatorLanguage.__("ui_editor.page_saved"));
			});
		}

		domHelper.insertHtml(pageUri, "#fields", packedRow).then(_ => {
			// If the user ask to apply on all entity
			if (req.body.applyAll == "true") {
				applyToAllEntity($, page, entity, req.session.id_application).then(_ => {
					git();
				}).catch(err => {
					console.error(err);
				})
			} else {
				git();
			}
		});
	}).catch(err => {
		console.error(err);
		res.status(500).send(generatorLanguage.__("ui_editor.page_not_found"));
	});
});

module.exports = router;