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

// ===========================================
// Redirection Home =====================
// ===========================================

// *** Dynamic Module | Do not remove ***

// Unauthorized access
router.get('/unauthorized', function (req, res) {
    res.render('common/unauthorized');
});

/*Change language function */
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
router.post('/file_upload', block_access.isLoggedIn, function (req, res) {
    upload(req, res, function (err) {
        if (!err) {
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
                                            } else {
                                                console.log(err);
                                            }
                                        });
                                    } else {
                                        console.log(err);
                                    }
                                });
                            }
                        } else{
                            console.log(err);
                            res.status(500).end(err);
                        }
                    });
                } else{
                    var err = new Error();
                    err.message = 'Internal error, entity not found.';
                    res.status(500).end(err);
                }
            } else if (req.body.storageType == 'cloud') {
                var err = new Error();
                err.message = 'Internal error, cloud file are not available.';
                res.status(500).end(err);
            } else{
                var err = new Error();
                err.message = 'Storage type not found.';
                res.status(500).end(err);
            }
        } else{
            console.log(err);
            res.status(500).end(err);
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