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

// ===========================================
// Redirection Home =====================
// ===========================================

/* GET status page to check if workspace is ready. */
router.get('/status', function(req, res) {
    res.sendStatus(200);
});

// *** Dynamic Module | Do not remove ***

// m_administration
router.get('/administration', block_access.isLoggedIn, block_access.moduleAccessMiddleware("administration"), function(req, res) {
    var widgetPromises = [];
    // *** Widget module m_administration | Do not remove ***
    Promise.all(widgetPromises).then(function(results) {
        var data = {};
        for (var i = 0; i < results.length; i++)
            for (var prop in results[i])
                data[prop] = results[i][prop];
        res.render('default/m_administration', data);
    });
});


// m_home
router.get('/home', block_access.isLoggedIn, block_access.moduleAccessMiddleware("home"), function(req, res) {
    var widgetPromises = [];
    // *** Widget module m_home | Do not remove ***
    Promise.all(widgetPromises).then(function(results) {
        var data = {};
        for (var i = 0; i < results.length; i++)
            for (var prop in results[i])
                data[prop] = results[i][prop];
        res.render('default/m_home', data);
    });
});


// m_authentication
router.get('/authentication', block_access.isLoggedIn, block_access.moduleAccessMiddleware("authentication"), function (req, res) {
    var widgetPromises = [];

    // *** Widget module m_authentication | Do not remove ***

    Promise.all(widgetPromises).then(function (results) {
        var data = {};
        for (var i = 0; i < results.length; i++)
            for (var prop in results[i])
                data[prop] = results[i][prop];
        res.render('default/m_authentication', data);
    });
});

// m_home
router.get('/home', block_access.isLoggedIn, block_access.moduleAccessMiddleware("home"), function (req, res) {
    var widgetPromises = [];

    // *** Widget module m_home | Do not remove ***

    Promise.all(widgetPromises).then(function (results) {
        var data = {};
        for (var i = 0; i < results.length; i++)
            for (var prop in results[i])
                data[prop] = results[i][prop];
        res.render('default/m_home', data);
    });
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

        imagePromises = [];
        for (var i = 0; i < sourceOptions.length; i++)
            imagePromises.push(entity_helper.getPicturesBuffers(dustData[sourceOptions[i].as], sourceOptions[i].target));

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
    languageConfig.lang = req.body.lang;
    fs.writeFileSync(__dirname + "/../config/language.json", JSON.stringify(languageConfig, null, 2));
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
    var p = new Promise(function (resolve, reject) {
        if (!!entity && !!filepath) {
            var partOfFilepath = filepath.split('-');
            if (partOfFilepath.length > 1) {
                var base = partOfFilepath[0];
                var completeFilePath = globalConf.localstorage + entity + '/' + base + '/' + filepath;
                res.download(completeFilePath, filepath, function (err) {
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
        console.log("The file "+filepath+" was successfully downloaded !");
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