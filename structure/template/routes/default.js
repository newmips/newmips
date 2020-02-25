const router = require('express').Router();
const block_access = require('../utils/block_access');
const globalConfig = require('../config/global');
const multer = require('multer');
const fs = require('fs-extra');
const upload = multer().single('file');
const models = require('../models/');
const Jimp = require("jimp");
const enums_radios = require('../utils/enum_radio.js');

/* GET status page to check if workspace is ready. */
router.get('/status', (req, res) => {
	res.sendStatus(200);
});

router.post('/widgets', block_access.isLoggedIn, (req, res) => {
	const user = req.session.passport.user;
	const widgetsInfo = req.body.widgets;
	const widgetsPromises = [];
	const data = {};

	for (let i = 0; i < widgetsInfo.length; i++) {
		const currentWidget = widgetsInfo[i];
		const modelName = 'E_' + currentWidget.entity.substring(2);

		// Check group and role access to widget's entity
		if (!block_access.entityAccess(user.r_group, currentWidget.entity.substring(2)) || !block_access.actionAccess(user.r_role, currentWidget.entity.substring(2), 'read'))
			continue;

		widgetsPromises.push(((widget, model) => new Promise(resolve => {
			const widgetRes = {type: widget.type};
			switch (widget.type) {
				case 'info':
				case 'stats':
					models[model].count().then(widgetData => {
						widgetRes.data = widgetData;
						data[widget.widgetID] = widgetRes;
						resolve();
					}).catch(resolve);
					break;

				case 'piechart':
					if (!widget.field) {
						console.error('No field defined for widget piechart')
						return resolve();
					}
					// STATUS PIECHART
					if (widget.field.indexOf('s_') == 0) {
						const statusAlias = 'r_' + widget.field.substring(2);
						models[model].findAll({
							attributes: [statusAlias + '.f_name', statusAlias + '.f_color', [models.sequelize.fn('COUNT', 'id'), 'count']],
							group: [statusAlias + '.f_name', statusAlias + '.f_color', statusAlias + '.id'],
							include: {model: models.E_status, as: statusAlias},
							raw: true
						}).then((piechartData) => {
							const dataSet = {labels: [], backgroundColor: [], data: []};
							for (let i = 0; i < piechartData.length; i++) {
								if (dataSet.labels.indexOf(piechartData[i].f_name) != -1) {
									dataSet.data[dataSet.labels.indexOf(piechartData[i].f_name)] += piechartData[i].count
								} else {
									dataSet.labels.push(piechartData[i].f_name);
									dataSet.backgroundColor.push(piechartData[i].f_color);
									dataSet.data.push(piechartData[i].count);
								}
							}
							widgetRes.data = dataSet;
							data[widget.widgetID] = widgetRes;
							resolve();
						}).catch(resolve);
					}
					// RELATED TO PIECHART
					else if (widget.field.indexOf('r_') == 0) {
						// Find option matching wdiget's targeted alias
						let targetOption;
						try {
							const options = JSON.parse(fs.readFileSync(__dirname+'/../models/options/'+model.toLowerCase()+'.json'));
							for (const option of options) {
								if (option.relation == 'belongsTo' && option.as == widget.field) {
									targetOption = option;
									break;
								}
							}
							if (!targetOption)
								throw new Error();
						} catch(e) {
							console.error("Couldn't load piechart for "+model+" on field "+widget.field);
							return resolve();
						}

						// Build all variables required to query piechart data
						const using = targetOption.usingField ? targetOption.usingField : [{value:'id'}];
						const selectAttributes = [];
						for (const attr of using)
							selectAttributes.push('target.'+attr.value);
						const foreignKey = targetOption.foreignKey;
						const target = models['E'+targetOption.target.substring(1)].getTableName();
						const source = models[model].getTableName();

						models.sequelize.query(`
							SELECT
								count(source.id) count, ${selectAttributes.join(', ')}
							FROM
								${source} source
							LEFT JOIN
								${target} target
							ON
								target.id = source.${foreignKey}
							GROUP BY ${foreignKey}
						`, {type: models.sequelize.QueryTypes.SELECT}).then(piechartData => {
							const dataSet = {labels: [], data: []};
							for (const pie of piechartData) {
								const labels = [];
								for (const attr of using)
									labels.push(pie[attr.value])
								dataSet.labels.push(labels.join(' - '));
								dataSet.data.push(pie.count);
							}
							widgetRes.data = dataSet;
							data[widget.widgetID] = widgetRes;
							resolve();
						}).catch(resolve);
					}
					// FIELD PIECHART
					else {
						models[model].findAll({
							attributes: [widget.field, [models.sequelize.fn('COUNT', 'id'), 'count']],
							group: [widget.field],
							raw: true
						}).then((piechartData) => {
							const dataSet = {labels: [], data: []};
							for (let i = 0; i < piechartData.length; i++) {
								let label = piechartData[i][widget.field];
								if (widget.fieldType == 'enum')
									label = enums_radios.translateFieldValue(widget.entity, widget.field, label, req.session.lang_user);

								if(dataSet.labels.indexOf(label) != -1)
									dataSet.data[dataSet.labels.indexOf(label)] += piechartData[i].count
								else {
									dataSet.labels.push(label);
									dataSet.data.push(piechartData[i].count);
								}
							}
							widgetRes.data = dataSet;
							data[widget.widgetID] = widgetRes;
							resolve();
						}).catch(resolve);
					}
					break;

				default:
					console.log("Not found widget type " + widget.type);
					resolve();
					break;
			}
		}))(currentWidget, modelName));
	}

	Promise.all(widgetsPromises).then(function () {
		res.json(data);
	}).catch(function (err) {
		console.error(err);
	});
});

// *** Dynamic Module | Do not remove ***

router.get('/unauthorized', block_access.isLoggedIn, (req, res) => {
	res.render('common/unauthorized');
});

router.post('/change_language', block_access.isLoggedIn, (req, res) => {
	req.session.lang_user = req.body.lang;
	res.locals.lang_user = req.body.lang;
	res.json({
		success: true
	});
});

/* Dropzone FIELD ajax upload file */
router.post('/file_upload', block_access.isLoggedIn, (req, res) => {
	upload(req, res, err => {
		try {
			if (err)
				throw err;

			const folder = req.file.originalname.split('-');
			const entity = req.body.entity;

			if (typeof entity === 'undefined' || !entity || folder.length == 0)
				throw new Error("500 - Missing correct entity or folder for upload");

			if (!block_access.entityAccess(req.session.passport.user.r_group, entity.substring(2)))
				throw new Error("403 - Access forbidden");

			let basePath = globalConfig.localstorage + entity + '/' + folder[0] + '/';
			fs.mkdirsSync(basePath);

			const uploadPath = basePath + req.file.originalname;
			fs.writeFileSync(uploadPath, req.file.buffer);

			// Returning to client
			res.json({
				success: true
			});

			// We make image thumbnail for datalist
			if (req.body.dataType == 'picture') {
				basePath = globalConfig.localstorage + globalConfig.thumbnail.folder + entity + '/' + folder[0] + '/';
				fs.mkdirsSync(basePath);
				const thumbnailPath = basePath + req.file.originalname;
				// Upload default file as thumbnail anyway, will be overwritten if everything works perfectly for thumbnail generation
				fs.writeFileSync(thumbnailPath, req.file.buffer);
				Jimp.read(uploadPath, (err, imgThumb) => {
					if (err)
						return console.error(err);

					const thumbnailWidth = globalConfig.thumbnail.width;
					const thumbnailHeight = globalConfig.thumbnail.height;
					const thumbnailQuality = globalConfig.thumbnail.quality;
					imgThumb.resize(thumbnailWidth, thumbnailHeight).quality(thumbnailQuality).write(thumbnailPath);
				});
			}
		} catch (err) {
			console.error(err);
			res.status(500).send(err);
		}
	});
});

router.get('/get_file', block_access.isLoggedIn, (req, res) => {
	try {
		const entity = req.query.entity;
		const filename = req.query.src;
		let cleanFilename = filename.substring(16);

		// Remove uuid
		if(cleanFilename[32] == '_')
			cleanFilename = cleanFilename.substring(33);

		const folderName = filename.split("-")[0];
		const filePath = globalConfig.localstorage + entity + '/' + folderName + '/' + filename;

		if (!block_access.entityAccess(req.session.passport.user.r_group, entity.substring(2)))
			throw new Error("403 - Access forbidden");

		if (!fs.existsSync(filePath))
			throw new Error("404 - File not found");

		const picture = fs.readFileSync(filePath);

		res.json({
			data: new Buffer(picture).toString('base64'),
			file: cleanFilename
		});
	} catch (err) {
		console.error(err);
		res.status(500).send(false);
	}
});

router.get('/download', block_access.isLoggedIn, (req, res) => {
	try {
		const entity = req.query.entity;
		const filename = req.query.f;
		let cleanFilename = filename.substring(16);

		// Remove uuid
		if(cleanFilename[32] == '_')
			cleanFilename = cleanFilename.substring(33);

		const folderName = filename.split("-")[0];
		const filePath = globalConfig.localstorage + entity + '/' + folderName + '/' + filename;

		if (!block_access.entityAccess(req.session.passport.user.r_group, entity.substring(2)))
			throw new Error("403 - Access forbidden");

		if (!fs.existsSync(filePath))
			throw new Error("404 - File not found");

		res.download(filePath, cleanFilename, function (err) {
			if (err)
				console.error(err);
		});
	} catch (err) {
		console.error(err);
		req.session.toastr.push({
			level: 'error',
			message: "error.500.file"
		});
		res.redirect(req.headers.referer);
	}
});

router.post('/delete_file', block_access.isLoggedIn, (req, res) => {
	try {

		const entity = req.body.entity;
		const filename = req.body.filename;
		let cleanFilename = filename.substring(16);

		// Remove uuid
		if(cleanFilename[32] == '_')
			cleanFilename = cleanFilename.substring(33);

		const folderName = filename.split("-")[0];
		const filePath = globalConfig.localstorage + entity + '/' + folderName + '/' + filename;

		if (!block_access.entityAccess(req.session.passport.user.r_group, entity.substring(2)))
			throw new Error("403 - Access forbidden");

		if (!fs.existsSync(filePath))
			throw new Error("404 - File not found: " + filePath);

		fs.unlinkSync(filePath);

		res.status(200).send(true);

	} catch (err) {
		console.error(err);
		res.status(500).send(err);
	}
});

module.exports = router;