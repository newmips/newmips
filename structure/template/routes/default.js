// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var languageConfig = require('../config/language');
var message = "";
var global = require('../config/global');
var multer = require('multer');
var fs = require('fs');
var fse = require('fs-extra');
var moment = require("moment");
var crypto = require('../utils/crypto_helper');
var webdav_conf = require('../config/webdav');
var upload = multer().single('file');

/* Connect WebDav with webdav-fs */
var wfs = require("webdav-fs")(
        webdav_conf.url,
        webdav_conf.user_name,
        webdav_conf.password
        );

/* ------- TUTO TOASTR -------- */
/*
 // Création d'un toastr
 req.session.toastr = [{
 message: "Vos informations ont bien été mises à jours.",
 level: "success" // error / info / success / warning
 }];
 
 */
/*
 // Récupération des toastr en session
 data.toastr = req.session.toastr;
 
 // Nettoyage de la session
 req.session.toastr = [];
 */

// ===========================================
// Redirection Home =====================
// ===========================================

// *** Dynamic Module | Do not remove ***

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
router.post('/file_upload', block_access.isLoggedIn, function (req, res) {
    upload(req, res, function (err) {
        if (!err) {
            // Everything went fine
            if (req.body.storageType == 'local') {
                var folder = req.file.originalname.split('-');
                var dataEntity = req.body.dataEntity;
                if (folder.length && !!dataEntity) {
                    var basePath = global.localstorage + dataEntity + '/' + folder[0] + '/';
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

router.get('/download', block_access.isLoggedIn, function (req, res) {
    var entity = req.param('entity');
    var filepath = req.param('f');
    var p = new Promise(function (resolve, reject) {
        if (!!entity && !!filepath) {
            var partOfFilepath = filepath.split('-');
            if (partOfFilepath.length) {
                var base = partOfFilepath[0];
                var completeFilePath = global.localstorage + entity + '/' + base + '/' + filepath;
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
        res.writeHead(303, {Location: req.headers.referer});
        res.end();
    });

});
module.exports = router;