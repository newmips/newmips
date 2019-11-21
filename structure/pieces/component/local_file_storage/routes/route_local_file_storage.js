const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');

const models = require('../models/');
const attributes = require('../models/attributes/COMPONENT_NAME_LOWER');
const options = require('../models/options/COMPONENT_NAME_LOWER');
const model_builder = require('../utils/model_builder');
const entity_helper = require('../helpers/entity');

const multer = require('multer');
const fs = require('fs');
const fse = require('fs-extra');
const upload = multer().single('file');

const config = require('../config/global');

router.post('/create', block_access.actionAccessMiddleware("COMPONENT_NAME_URL", "create"), function(req, res) {
	const createObject = model_builder.buildForRoute(attributes, options, req.body);
	const redirect = '/SOURCE_URL_ENTITY_LOWER/show?id='+req.body.SOURCE_ENTITY_LOWER+'#COMPONENT_NAME_LOWER';

	models.COMPONENT_NAME.create(createObject).then(function(COMPONENT_NAME_LOWER) {
		req.session.toastr = [{
			message: 'message.create.success',
			level: "success"
		}];

		const foreignKeyArray = [];
		const asArray = [];
		for (let j = 0; j < options.length; j++) {
			if(typeof options[j].foreignKey != "undefined")
				foreignKeyArray.push(options[j].foreignKey.toLowerCase());
			if(typeof options[j].as != "undefined")
				asArray.push(options[j].as.toLowerCase());
		}

		first: for (const prop in req.body) {
			if (prop.indexOf('id_') != 0 && asArray.indexOf(prop.toLowerCase()) == -1){
				continue;
			}
			//BELONGS TO with foreignKey naming
			for (let i = 0; i < options.length; i++) {
				if(typeof options[i].foreignKey != "undefined" && options[i].foreignKey == prop){
					continue first;
				}
			}
			if(foreignKeyArray.indexOf(prop.toLowerCase()) != -1){
				continue;
			}

			let target = prop.substr(3);
			//HAS MANY with as naming
			for (let k = 0; k < options.length; k++) {
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
		const uploadPath = config.localstorage+req.body.dataSource+"/"+req.body.dataSourceID+"/"+req.body.dataComponent+"/"+req.file.originalname;
		const outStream = fs.createWriteStream(uploadPath);
		outStream.write(req.file.buffer);
		outStream.end();
		outStream.on('finish', _ => {
			res.json({
				success: true
			});
		});
	});
});

/* COMPONENT ajax download file */
router.post('/file_download', block_access.actionAccessMiddleware("COMPONENT_NAME_URL", "create"), function(req, res) {
	const downloadPath = config.localstorage+req.body.dataSource+"/"+req.body.dataSourceID+"/"+req.body.dataComponent+"/"+req.body.originalname;
	const fileName = req.body.originalname;
	res.download(downloadPath, fileName, function(err) {
		if(err){console.error(err);}
	});
});

router.post('/delete', block_access.actionAccessMiddleware("COMPONENT_NAME_URL", "create"), function(req, res) {
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
