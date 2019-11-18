var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

var models = require('../models/');
var attributes = require('../models/attributes/COMPONENT_NAME_LOWER');
var options = require('../models/options/COMPONENT_NAME_LOWER');
var model_builder = require('../utils/model_builder');
var entity_helper = require('../utils/entity_helper');

var multer = require('multer');
var fs = require('fs');
var fse = require('fs-extra');
var moment = require("moment");
var upload = multer().single('file');

var config = require('../config/global');

router.post('/create', block_access.actionAccessMiddleware("COMPONENT_NAME_URL", "create"), function(req, res) {

	var version = parseInt(req.body.version) + 1;
	var createObject = model_builder.buildForRoute(attributes, options, req.body);
	var redirect = '/SOURCE_URL_ENTITY_LOWER/show?id='+req.body.SOURCE_ENTITY_LOWER+'#COMPONENT_NAME_LOWER';

	models.COMPONENT_NAME.create(createObject).then(function(COMPONENT_NAME_LOWER) {
		req.session.toastr = [{
			message: 'message.create.success',
			level: "success"
		}];

		var foreignKeyArray = [];
		var asArray = [];
		for (var j = 0; j < options.length; j++) {
			if(typeof options[j].foreignKey != "undefined")
				foreignKeyArray.push(options[j].foreignKey.toLowerCase());
			if(typeof options[j].as != "undefined")
				asArray.push(options[j].as.toLowerCase());
		}

		first: for (var prop in req.body) {
			if (prop.indexOf('id_') != 0 && asArray.indexOf(prop.toLowerCase()) == -1){
				continue;
			}
			//BELONGS TO with foreignKey naming
			second: for (var i = 0; i < options.length; i++) {
				if(typeof options[i].foreignKey != "undefined" && options[i].foreignKey == prop){
					continue first;
				}
			}
			if(foreignKeyArray.indexOf(prop.toLowerCase()) != -1){
				continue;
			}

			var target = prop.substr(3);
			//HAS MANY with as naming
			for (var k = 0; k < options.length; k++) {
				if(typeof options[k].as != "undefined" && options[k].as.toLowerCase() == prop.toLowerCase())
					target = options[k].as;
			}

			target = target.charAt(0).toUpperCase() + target.toLowerCase().slice(1);
			COMPONENT_NAME_LOWER['set'+target](req.body[prop]);
		}

		res.redirect(redirect);
	}).catch(function(err){
		entity_helper.error(err, req, res);
	});
});

/* Dropzone COMPONENT ajax upload file */
router.post('/file_upload', block_access.actionAccessMiddleware("COMPONENT_NAME_URL", "create"), function(req, res) {

	// FONCTION UPLOAD DE FICHIER DE MULTER ( FICHIER DANS req.file )
	upload(req, res, function(err) {
		if (err) {
			res.status(415);
			return res.json({
				success: false,
				error: "An error occured."
			});
		}
		fse.mkdirsSync(config.localstorage+req.body.dataSource+"/"+req.body.dataSourceID+"/"+req.body.dataComponent);
		var uploadPath = config.localstorage+req.body.dataSource+"/"+req.body.dataSourceID+"/"+req.body.dataComponent+"/"+req.file.originalname;
		var byte;
		var outStream = fs.createWriteStream(uploadPath);
		outStream.write(req.file.buffer);
		outStream.end();
		outStream.on('finish', function(err){
			res.json({
				success: true
			});
		});
	});
});

/* COMPONENT ajax download file */
router.post('/file_download', block_access.actionAccessMiddleware("COMPONENT_NAME_URL", "create"), function(req, res) {
	var downloadPath = config.localstorage+req.body.dataSource+"/"+req.body.dataSourceID+"/"+req.body.dataComponent+"/"+req.body.originalname;
	var fileName = req.body.originalname;
	res.download(downloadPath, fileName, function(err) {
		if(err){console.error(err);}
	});
});

router.post('/delete', block_access.actionAccessMiddleware("COMPONENT_NAME_URL", "create"), function(req, res) {
	var id_COMPONENT_NAME = req.body.id;

	models.COMPONENT_NAME.findOne({
		where:{
			id: req.body.idRemove
		}
	}).then(function(toRemoveComponent){
		if(toRemoveComponent){
			try {
				fs.unlinkSync(config.localstorage+"SOURCE_ENTITY_LOWER/"+req.body.idEntity+"/"+req.body.dataComponent+"/"+toRemoveComponent.f_filename);
			} catch(e) {
				return entity_helper.error(e, req, res);
			}
			models.COMPONENT_NAME.destroy({
				where: {
					id: req.body.idRemove
				}
			}).then(function() {
				req.session.toastr = [{
					message: 'message.delete.success',
					level: "success"
				}];
				res.redirect('/SOURCE_URL_ENTITY_LOWER/show?id='+req.body.idEntity+'#COMPONENT_NAME_LOWER');
			}).catch(function(err){
				entity_helper.error(err, req, res);
			});
		}else{
			req.session.toastr = [{
				message: 'message.delete.failure',
				level: "error"
			}];
			res.redirect('/SOURCE_URL_ENTITY_LOWER/show?id='+req.body.idEntity+'#COMPONENT_NAME_LOWER');
		}
	})
});

module.exports = router;
