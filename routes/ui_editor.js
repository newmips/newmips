const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const domHelper = require('../utils/jsDomHelper');
const language = require('../services/language');
const gitHelper = require('../utils/git_helper');

async function applyToAllEntity(currentHtml, notPage, entity, appName) {
	const pageFiles = ['create_fields.dust', 'update_fields.dust', 'show_fields.dust'];
	for (let i = 0; i < pageFiles.length; i++) {
		if (pageFiles[i] == notPage)
			continue;

		const pageUri = __dirname + '/../workspace/' + appName + '/views/' + entity + '/' + pageFiles[i];
		const $ = await domHelper.read(pageUri); // eslint-disable-line
		const saveDataField = {};

		// Save current state of fields in the current working page
		$("div[data-field]").each(function() {
			saveDataField[$(this).attr("data-field")] = $(this)[0].innerHTML;
		});

		// Loop on source entity fields
		currentHtml("div[data-field]").each(function() {
			if (typeof saveDataField[currentHtml(this).attr("data-field")] === "undefined") {
				currentHtml(this).remove();
				console.log("ERROR: Cannot find field " + currentHtml(this).attr("data-field") + " in apply all UI designer function, it won't be restitute correctly !")
			} else
				currentHtml(this).html(saveDataField[currentHtml(this).attr("data-field")]);
			saveDataField[currentHtml(this).attr("data-field")] = true;
		});

		// Missing fields from the source that we'll append in col-xs-12
		for (const field in saveDataField) {
			if (saveDataField[field] != true) {
				let newDiv = "<div data-field='" + field + "' class='fieldLineHeight col-xs-12 col-sm-12 col-md-12'>";
				newDiv += saveDataField[field];
				newDiv += "</div>";
				currentHtml("div[data-field]:last").after(newDiv);
			}
		}

		// Find all rows and group them to be appended to #fields
		let packedRow = '';
		for (let i = 0; i < currentHtml("body").children('.row').length; i++)
			if (currentHtml("body").children('.row').eq(i).html() != "")
				packedRow += currentHtml("body").children('.row').eq(i).html();

		await domHelper.insertHtml(pageUri, "#fields", packedRow); // eslint-disable-line
	}
}

router.get('/getPage/:entity/:page', block_access.hasAccessApplication, (req, res) => {
	const generatorLanguage = language(req.session.lang_user);
	(async () => {
		let page = req.params.page;

		if (!page || page != 'create' && page != 'update' && page != 'show')
			throw new Error('ui_editor.page_not_found');
		page += '_fields.dust';

		const entity = req.params.entity;
		const workspaceLanguage = require(__dirname + '/../workspace/' + req.session.app_name + '/services/language')(req.session.lang_user); // eslint-disable-line
		const pageUri = __dirname + '/../workspace/' + req.session.app_name + '/views/' + entity + '/' + page;

		const $ = await domHelper.read(pageUri);

		// Encapsulate traduction with span to be able to translate, keep comment for later use
		const tradRegex = new RegExp(/(<!--{#__ key="(.*)" ?\/}-->)/g);
		$("body #fields")[0].innerHTML = $("body #fields")[0].innerHTML.replace(tradRegex, '<span class="trad-result">$2</span><span class="trad-src">$1</span>');

		// Translate each .trad-result
		$(".trad-result").each(function() {
			const tradKey = $(this).text();
			$(this).text(workspaceLanguage.__(tradKey));
		});

		$("option").each(function() {
			const comment = $(this).contents().filter(_ => this.nodeType === 8).get(0);
			if (typeof comment !== "undefined")
				$(this).text(comment.nodeValue);
		});

		return $("#fields")[0].outerHTML;
	})().then(outerHTML => {
		res.status(200).send(outerHTML);
	}).catch(err => {
		console.error(err);
		res.status(404).send(generatorLanguage.__("ui_editor.page_not_found"));
	});
});

router.post('/setPage/:entity/:page', block_access.hasAccessApplication, (req, res) => {
	const generatorLanguage = language(req.session.lang_user);
	(async () => {

		let page = req.params.page;
		if (!page || page != 'create' && page != 'update' && page != 'show')
			throw new Error('ui_editor.page_not_found');

		page += '_fields.dust';

		const entity = req.params.entity;
		const html = req.body.html;
		const pageUri = __dirname + '/../workspace/' + req.session.app_name + '/views/' + entity + '/' + page;

		const $ = await domHelper.loadFromHtml(html);

		$("option").each(function() {
			const trad = $(this).data('trad');
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
			const toExtract = $(this).html();
			$(this).parent().removeClass('column').html(toExtract);
		});

		// Find all rows and group them to be appended to #fields
		let packedRow = '';
		for (let i = 0; i < $("body").children('.row').length; i++)
			if ($("body").children('.row').eq(i).html() != "")
				packedRow += $("body").children('.row').eq(i).html();

		await domHelper.insertHtml(pageUri, "#fields", packedRow);

		// If the user ask to apply on all entity
		if (req.body.applyAll == "true")
			await applyToAllEntity($, page, entity, req.session.app_name);

		// Doing gitlab commit
		// We simply add session values in attributes array
		const data = {
			application: req.session.app_name,
			module: req.session.module_name,
			entity: req.session.entity_name,
			field: req.session.field_name,
			function: "Save a file from UI designer: " + pageUri
		};

		await gitHelper.gitCommit(data);
	})().then(_ => {
		if (req.body.applyAll == "true")
			res.status(200).send(generatorLanguage.__("ui_editor.page_saved_all"));
		else
			res.status(200).send(generatorLanguage.__("ui_editor.page_saved"));
	}).catch(err => {
		console.error(err);
		res.status(500).send(generatorLanguage.__("ui_editor.page_not_found"));
	});
});

module.exports = router;