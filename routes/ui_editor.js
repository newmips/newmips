// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

var fs = require('fs');
var domHelper = require('../utils/jsDomHelper');
var language = require('../services/language');
var gitHelper = require('../utils/git_helper');

//Sequelize
var models = require('../models/');

router.get('/getPage/:entity/:page', block_access.isLoggedIn, function(req, res) {
	var page = req.params.page;
	if (!page || (page != 'create' && page != 'update' && page != 'show'))
		return res.status(404).send(generatorLanguage.__("ui_editor.page_not_found"));
	page += '_fields.dust';

	var entity = req.params.entity;
	var generatorLanguage = language(req.session.lang_user);
	var workspaceLanguage = require(__dirname+'/../workspace/'+req.session.id_application+'/services/language')(req.session.lang_user);

	var pageUri = __dirname+'/../workspace/'+req.session.id_application+'/views/'+entity+'/'+page;
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

		// Hide action buttons
		$(".actions").hide();

		res.status(200).send($("body")[0].innerHTML);
	}).catch(function(err) {
		console.log(err);
		res.status(404).send(generatorLanguage.__("ui_editor.page_not_found"));
	});
});

router.post('/setPage/:entity/:page', block_access.isLoggedIn, function(req, res) {
	var page = req.params.page;
	if (!page || (page != 'create' && page != 'update' && page != 'show'))
		return res.status(404).send(generatorLanguage.__("ui_editor.page_not_found"));
	page += '_fields.dust';

	var entity = req.params.entity;
	var html = req.body.html;
	var generatorLanguage = language(req.session.lang_user);
	var pageUri = __dirname+'/../workspace/'+req.session.id_application+'/views/'+entity+'/'+page;
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

		// Show and re-position action buttons
		var actions = $(".actions").show().detach();
		$(actions).appendTo($("body"));

		function git(){
			// We simply add session values in attributes array
			var attr = {};
	        attr.function = "Save a file from UI designer: "+pageUri;
	        attr.id_project = req.session.id_project;
	        attr.id_application = req.session.id_application;
	        attr.id_module = "-";
	        attr.id_data_entity = "-";

			gitHelper.gitCommit(attr, function(err, infoGit){
		        if(err)
		        	console.log(err);
		        res.status(200).send(generatorLanguage.__("ui_editor.page_saved"));
		    });
		}

		// Write back to file
		if (page == 'show_fields.dust')
			domHelper.replace(pageUri, "#fields", $).then(function(){
				git();
			});
		else
			domHelper.write(pageUri, $).then(function() {
				git();
			});
	}).catch(function(e) {
		console.log(e);
		res.status(500).send(generatorLanguage.__("ui_editor.page_not_found"));
	});
});

module.exports = router;