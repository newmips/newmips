// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var languageConfig = require('../config/language');
var message = "";
var globalConf = require('../config/global');
var multer = require('multer');
var fs = require('fs');
var fse = require('fs-extra');
var moment = require("moment");
var crypto = require('../utils/crypto_helper');
var webdav_conf = require('../config/webdav');
var upload = multer().single('file');
var models = require('../models/');
var Jimp = require("jimp");

/* Connect WebDav with webdav-fs */
var wfs = require("webdav-fs")(
        webdav_conf.url,
        webdav_conf.user_name,
        webdav_conf.password
        );
// ===========================================
// Redirection Home =====================
// ===========================================

// *** Dynamic Module | Do not remove ***

// m_authentication
router.get('/authentication', block_access.moduleAccessMiddleware("authentication"), function (req, res) {
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
router.get('/home', block_access.moduleAccessMiddleware("home"), function (req, res) {
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

// Page non autorisée
router.get('/unauthorized', function (req, res) {
    res.render('common/unauthorized');
});

/* Fonction de changement du language */
router.post('/change_language', function (req, res) {
    req.session.lang_user = req.body.lang;
    res.locals.lang_user = req.body.lang;
    languageConfig.lang = req.body.lang;
    fs.writeFileSync(__dirname + "/../config/language.json", JSON.stringify(languageConfig, null, 2));
    res.json({
        success: true
    });
});

// Page non autorisée
router.get('/unauthorized', function (req, res) {
    res.render('common/unauthorized');
});

/* Fonction de changement du language */
router.post('/change_language', function (req, res) {
    req.session.lang_user = req.body.lang;
    res.locals.lang_user = req.body.lang;
    languageConfig.lang = req.body.lang;
    fs.writeFileSync(__dirname + "/../config/language.json", JSON.stringify(languageConfig, null, 2));
    res.json({
        success: true
    });
});

/* Dropzone FIELD ajax upload file */
router.post('/file_upload', function (req, res) {
    upload(req, res, function (err) {
        if (!err) {
            // Everything went fine
            if (req.body.storageType == 'local') {
                var folder = req.file.originalname.split('-');
                var dataEntity = req.body.dataEntity;
                if (folder.length > 1 && !!dataEntity) {
                    var basePath = globalConf.localstorage + dataEntity + '/' + folder[0] + '/';
                    fse.mkdirs(basePath, function (err) {
                        if (!err) {
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
                                    if (!err) {
                                        Jimp.read(uploadPath, function (err, imgThumb) {
                                            if (!err) {
                                                imgThumb.resize(globalConf.thumbnail.height, globalConf.thumbnail.width)
                                                        .quality(globalConf.thumbnail.quality)  // set JPEG quality 
                                                        .write(basePath + req.file.originalname);
                                            }
                                        });
                                    }
                                });
                            }
                        } else
                            res.end();
                    });

                } else
                    res.end();

            } else if (req.body.storageType == 'cloud') {
                res.end();
            } else
                return res.json({success: false, message: 'storage type not found'});
        } else
            res.end();
    });

});


router.get('/get_file', function (req, res) {
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


router.get('/download', function (req, res) {
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
        console.log("File downlaod with success");
    }).catch(function (err) {
        console.log(err);
        req.session.toastr.push({level: 'error', message: "File not found"});
        res.writeHead(303, {Location: req.headers.referer});
        res.end();
    });

});

router.post('/delete_file', function (req, res) {
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