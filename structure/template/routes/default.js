// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
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
                const widgetRes = {type: widget.type};
                switch (widget.type) {
                    case 'info':
                    case 'stats':
                        models[model].count().then(widgetData=> {
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
                            var statusAlias = 'r_'+widget.field.substring(2);
                            models[model].findAll({
                                attributes: [statusAlias+'.f_name', statusAlias+'.f_color', [models.sequelize.fn('COUNT', 'id'), 'count']],
                                group: [statusAlias+'.f_name', statusAlias+'.f_color', statusAlias+'.id'],
                                include: {model: models.E_status, as: statusAlias},
                                raw: true
                            }).then((piechartData)=> {
                                var dataSet = {labels: [], backgroundColor: [], data: []};
                                for (var i = 0; i < piechartData.length; i++) {
                                    if(dataSet.labels.indexOf(piechartData[i].f_name) != -1){
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
                                let options = JSON.parse(fs.readFileSync(__dirname+'/../models/options/'+model.toLowerCase()+'.json'));
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
                            }).then((piechartData)=> {
                                var dataSet = {labels: [], data: []};
                                for (var i = 0; i < piechartData.length; i++) {
                                    var label = piechartData[i][widget.field];
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
                        console.log("Not found widget type "+widget.type);
                        resolve();
                        break;
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

router.get('/administration', block_access.isLoggedIn, block_access.moduleAccessMiddleware("administration"), function(req, res) {
    res.render('default/m_administration');
});

router.get('/home', block_access.isLoggedIn, block_access.moduleAccessMiddleware("home"), function(req, res) {
    res.render('default/m_home');
});

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
        dustData.componentAddressConfig = component_helper.address.getMapsConfigIfComponentAddressExists('e_'+source);

        Promise.all(imagePromises).then(function() {
            // Open and render dust file
            var file = fs.readFileSync(__dirname+'/../views/e_'+source+'/print_fields.dust', 'utf8');
            dust.insertLocalsFn(dustData ? dustData : {}, req);
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
            console.error(err);
            return res.status(500).end(err);
        }
        var folder = req.file.originalname.split('-');
        var dataEntity = req.body.dataEntity;
        if (folder.length > 1 && !!dataEntity) {
            var basePath = globalConf.localstorage + dataEntity + '/' + folder[0] + '/';
            fse.mkdirs(basePath, function (err) {
                if (err) {
                    console.error(err);
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
                            return console.error(err);

                        Jimp.read(uploadPath, function (err, imgThumb) {
                            if (err)
                                return console.error(err);

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

router.get('/get_picture', block_access.isLoggedIn, function(req, res) {
    try {
        let entity = req.query.entity;
        let filename = req.query.src;
        let cleanFilename = filename.substring(16);
        let folderName = filename.split("-")[0];
        let filePath = globalConf.localstorage + entity + '/' + folderName + '/' + filename;

        if (!block_access.entityAccess(req.session.passport.user.r_group, entity.substring(2)))
            throw new Error("403 - Access forbidden");

        if (!fs.existsSync(filePath))
            throw new Error("404 - File not found");

        let picture = fs.readFileSync(filePath);

        res.json({
            result: 200,
            data: new Buffer(picture).toString('base64'),
            file: cleanFilename,
            success: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(false);
    }
});

router.get('/download', block_access.isLoggedIn, function(req, res) {
    try {
        let entity = req.query.entity;
        let filename = req.query.f;
        let cleanFilename = filename.substring(16);
        let folderName = filename.split("-")[0];
        let filePath = globalConf.localstorage + entity + '/' + folderName + '/' + filename;

        if (!block_access.entityAccess(req.session.passport.user.r_group, entity.substring(2)))
            throw new Error("403 - Access forbidden");

        if (!fs.existsSync(filePath))
            throw new Error("404 - File not found");

        res.download(filePath, cleanFilename, function(err) {
            if (err)
                throw err;
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
                            console.error(err);
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