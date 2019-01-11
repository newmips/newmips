// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var languageConfig = require('../config/language');
var globalConf = require('../config/global');
var multer = require('multer');
var fs = require('fs');
var fse = require('fs-extra');
var crypto = require('../utils/crypto_helper');
var upload = multer().single('file');
var models = require('../models/');
var Jimp = require("jimp");
var entity_helper = require('../utils/entity_helper');
var dust = require('dustjs-linkedin');
var enums_radios = require('../utils/enum_radio.js');
var component_helper = require('../utils/component_helper');

// ===========================================
// Redirection Home =====================
// ===========================================

/* GET status page to check if workspace is ready. */
router.get('/status', function(req, res) {
    res.sendStatus(200);
});

router.post('/widgets', block_access.isLoggedIn, function(req, res) {
    var user = req.session.passport.user;
    var widgetsInfo = req.body.widgets;
    var widgetsPromises = [];
    var data = {};

    for (var i = 0; i < widgetsInfo.length; i++) {
        var currentWidget = widgetsInfo[i];
        var modelName = 'E_'+currentWidget.entity.substring(2);

        // Check group and role access to widget's entity
        if (!block_access.entityAccess(user.r_group, currentWidget.entity.substring(2)) || !block_access.actionAccess(user.r_role, currentWidget.entity.substring(2), 'read'))
            continue;

        widgetsPromises.push(((widget, model)=>{
            return new Promise((resolve, reject)=> {
                var widgetRes = {type: widget.type};
                switch (widget.type) {
                    case 'info':
                    case 'stats':
                        models[model].count().then(widgetData=> {
                            widgetRes.data = widgetData;
                            data[widget.widgetID] = widgetRes;
                            resolve();
                        }).catch(reject);
                    break;

                    case 'piechart':
                        // Status Piechart
                        if (widget.field.indexOf('s_') == 0) {
                            var statusAlias = 'r_'+widget.field.substring(2);
                            models[model].findAll({
                                attributes: [statusAlias+'.f_name', statusAlias+'.f_color', [models.sequelize.fn('COUNT', 'id'), 'count']],
                                group: [statusAlias+'.f_name'],
                                include: {model: models.E_status, as: statusAlias},
                                raw: true
                            }).then((piechartData)=> {
                                var dataSet = {labels: [], backgroundColor: [], data: []};
                                for (var i = 0; i < piechartData.length; i++) {
                                    dataSet.labels.push(piechartData[i].f_name);
                                    dataSet.backgroundColor.push(piechartData[i].f_color);
                                    dataSet.data.push(piechartData[i].count);
                                }
                                widgetRes.data = dataSet;
                                data[widget.widgetID] = widgetRes;
                                resolve();
                            }).catch(reject);
                        }
                        // Field Piechart
                        else {
                            models[model].findAll({
                                attributes: [widget.field, [models.sequelize.fn('COUNT', 'id'), 'count']],
                                group: [widget.field],
                                raw: true
                            }).then((piechartData)=> {
                                var dataSet = {labels: [], data: []};
                                for (var i = 0; i < piechartData.length; i++) {
                                    var label = piechartData[i][widget.field];
                                    if (widget.fieldType == 'enum')
                                        label = enums_radios.translateFieldValue(widget.entity, widget.field, label, req.session.lang_user);
                                    dataSet.labels.push(label);
                                    dataSet.data.push(piechartData[i].count);
                                }
                                widgetRes.data = dataSet;
                                data[widget.widgetID] = widgetRes;
                                resolve();
                            }).catch(reject);
                        }
                    break;

                    default:
                        console.log("Not found widget type "+widget.type);
                        resolve();
                }
            })
        })(currentWidget, modelName));
    }

    Promise.all(widgetsPromises).then(function() {
        res.json(data);
    }).catch(function(err) {
        console.error(err);
    });
});

// *** Dynamic Module | Do not remove ***

router.get('/print/:source/:id', block_access.isLoggedIn, function(req, res) {
    var source = req.params.source;
    var id = req.params.id;

    models['E_'+source].findOne({
        where: {id: id},
        include: [{all: true, eager: true}]
    }).then(function(dustData){
        var sourceOptions;
        try {
            sourceOptions = JSON.parse(fs.readFileSync(__dirname+'/../models/options/e_'+source+'.json', 'utf8'));
        } catch(e) {res.status(500).end()}

        // Add enum / radio information
        dustData.enum_radio = enums_radios.translated("e_"+source, req.session.lang_user, sourceOptions);

        imagePromises = [];
        // Source entity images
        imagePromises.push(entity_helper.getPicturesBuffers(dustData, 'e_'+source));;
        // Relations images
        for (var i = 0; i < sourceOptions.length; i++) {
            // Has many/preset
            if (dustData[sourceOptions[i].as] instanceof Array) {
                for (var j = 0; j < dustData[sourceOptions[i].as].length; j++)
                    imagePromises.push(entity_helper.getPicturesBuffers(dustData[sourceOptions[i].as][j], sourceOptions[i].target, true));;
            }
            // Has one
            else
                imagePromises.push(entity_helper.getPicturesBuffers(dustData[sourceOptions[i].as], sourceOptions[i].target));
        }

        // Component address
        dustData.componentAddressConfig = component_helper.getMapsConfigIfComponentAddressExist('e_'+source);

        Promise.all(imagePromises).then(function() {
            // Open and render dust file
            var file = fs.readFileSync(__dirname+'/../views/e_'+source+'/print_fields.dust', 'utf8');
            dust.renderSource(file, dustData || {}, function(err, rendered) {
                if (err) {
                    console.error(err);
                    return res.status(500).end();
                }

                // Send response to ajax request
                res.json({
                    content: rendered,
                    option: {structureType: 'print'}
                });
            });
        });
    });
});

router.get('/unauthorized', block_access.isLoggedIn, function (req, res) {
    res.render('common/unauthorized');
});

router.post('/change_language', block_access.isLoggedIn, function (req, res) {
    req.session.lang_user = req.body.lang;
    res.locals.lang_user = req.body.lang;
    res.json({
        success: true
    });
});

/* Dropzone FIELD ajax upload file */
router.post('/file_upload', block_access.isLoggedIn, function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            console.log(err);
            return res.status(500).end(err);
        }
        var folder = req.file.originalname.split('-');
        var dataEntity = req.body.dataEntity;
        if (folder.length > 1 && !!dataEntity) {
            var basePath = globalConf.localstorage + dataEntity + '/' + folder[0] + '/';
            fse.mkdirs(basePath, function (err) {
                if (err) {
                    console.log(err);
                    return res.status(500).end(err);
                }
                var uploadPath = basePath + req.file.originalname;
                var outStream = fs.createWriteStream(uploadPath);
                outStream.write(req.file.buffer);
                outStream.end();
                outStream.on('finish', function (err) {
                    res.json({
                        success: true
                    });
                });

                if (req.body.dataType == 'picture') {
                    //We make thumbnail and reuse it in datalist
                    basePath = globalConf.localstorage + globalConf.thumbnail.folder + dataEntity + '/' + folder[0] + '/';
                    fse.mkdirs(basePath, function (err) {
                        if (err)
                            return console.log(err);

                        Jimp.read(uploadPath, function (err, imgThumb) {
                            if (err)
                                return console.log(err);

                            imgThumb.resize(globalConf.thumbnail.height, globalConf.thumbnail.width)
                                    .quality(globalConf.thumbnail.quality)
                                    .write(basePath + req.file.originalname);
                        });
                    });
                }
            });
        }
    });
});

router.get('/get_file', block_access.isLoggedIn, function (req, res) {
    var entity = req.query.entity;
    var src = req.query.src;
    if (!!entity && !!src) {
        var partOfFilepath = src.split('-');
        if (partOfFilepath.length > 1) {
            var base = partOfFilepath[0];
            var completeFilePath = globalConf.localstorage + 'thumbnail/' + entity + '/' + base + '/' + src;
            fs.readFile(completeFilePath, function (err, data) {
                if (!err) {
                    var buffer = new Buffer(data).toString('base64');
                    res.json({
                        result: 200,
                        data: buffer,
                        file: src,
                        success: true
                    });
                } else
                    res.end();
            });
        } else
            res.end();
    } else
        res.end();
});

router.get('/download', block_access.isLoggedIn, function (req, res) {
    var entity = req.query.entity;
    var filepath = req.query.f;
    // Filename without date and hours prefix
    var filename = filepath.substring(16);
    var p = new Promise(function (resolve, reject) {
        if (!!entity && !!filepath) {
            var partOfFilepath = filepath.split('-');
            if (partOfFilepath.length > 1) {
                var base = partOfFilepath[0];
                // Taking dirname from globalConf cause a bug on filename param for res.download
                // So we take again __dirname here and remove it from globalConf
                // var dir = __dirname;
                // var completeFilePath = dir + globalConf.localstorage.substring(dir.length) + entity + '/' + base + '/' + filepath;
                let completeFilePath = globalConf.localstorage + entity + '/' + base + '/' + filepath;
                res.download(completeFilePath, filename, function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            } else
                reject();

        } else
            reject();
    });
    p.then(function () {
        console.log("The file "+filename+" was successfully downloaded !");
    }).catch(function (err) {
        console.log(err);
        req.session.toastr.push({level: 'error', message: "File not found"});
        res.writeHead(303, {Location: req.headers.referer});
        res.end();
    });
});

router.post('/delete_file', block_access.isLoggedIn, function (req, res) {
    var entity = req.body.dataEntity;
    var dataStorage = req.body.dataStorage;
    var filename = req.body.filename;
    if (!!entity && !!dataStorage && !!filename) {
        var partOfFilepath = filename.split('-');
        if (partOfFilepath.length) {
            var base = partOfFilepath[0];
            var completeFilePath = globalConf.localstorage + entity + '/' + base + '/' + filename;
            // thumbnail file to delete
            var completeThumbnailPath = globalConf.localstorage + globalConf.thumbnail.folder + entity + '/' + base + '/' + filename;
            fs.unlink(completeFilePath, function (err) {
                if (!err) {
                    req.session.toastr.push({level: 'success', message: "message.delete.success"});
                    res.json({result: 200, message: ''});
                    fs.unlink(completeThumbnailPath,function (err) {
                        if(err)
                            console.log(err);
                    });
                } else {
                    req.session.toastr.push({level: 'error', message: "Internal error"});
                    res.json({result: 500, message: ''});
                }

            });
        } else {
            req.session.toastr.push({level: 'error', message: "File syntax not valid"});
            res.json({result: 404, message: ''});
        }

    } else {
        req.session.toastr.push({level: 'error', message: "File not found"});
        res.json({result: 404, message: ''});
    }
});

module.exports = router;