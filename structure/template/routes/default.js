// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var languageConfig = require('../config/language');
var message = "";

var multer = require('multer');
var fs = require('fs');
var moment = require("moment");

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
        if (err) {
            res.end();
        } else {
            // Everything went fine
            if (req.body.storageType == 'local') {
                var folder=req.file.originalname.split('-');
//                fs.mkdirSync(folder)
                var uploadPath = __dirname + "/../upload/"+folder[0]+'/' + req.file.originalname;
                var byte;
                var outStream = fs.createWriteStream(uploadPath);
                outStream.write(req.file.buffer);
                outStream.end();
                outStream.on('finish', function (err) {
                    res.json({
                        success: true,
                        filename: req.file.originalname
                    });
                });
            } else if (req.body.storageType == 'cloud') {

            } else
                return res.json({success: false, message: 'storage type not found'});

        }

    });

});


module.exports = router;