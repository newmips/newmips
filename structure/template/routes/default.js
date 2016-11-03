// router/routes.js
var express = require('express');
var router = express.Router();
var connection = require('../utils/db_utils');
var block_access = require('../utils/block_access');
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
router.get('/unauthorized', function(req, res) {
    res.render('common/unauthorized');
});

/* Fonction de changement du language */
router.post('/change_language', function(req, res) {
	req.session.lang_user = req.body.lang;
	res.locals.lang_user = req.body.lang;
	res.json({
		success: true
	});
});

/* Dropzone FIELD ajax upload file */
router.post('/file_upload', block_access.isLoggedIn, function(req, res) {

    // FONCTION UPLOAD DE FICHIER DE MULTER ( FICHIER DANS req.file )
    upload(req, res, function(err) {
        if (!err) {

            if(req.body.storageType == "local"){
                  /* ---------------------------------------------------------- */
                  /* ------------- Local Storage in upload folder ------------- */
                  /* ---------------------------------------------------------- */
                  console.log(req.body.dataEntity);
                  console.log(req.session.passport);
                  console.log(req.session.passport.user);
                  /* TODO - Check if folder exist, if not mkdir */
                  /* TODO - Create a path with req.body.dataEntity et les info de passport.user */
                  var uploadPath = __dirname + "/../upload/" + req.file.originalname;
                  var byte;
                  var outStream = fs.createWriteStream(uploadPath);
                  outStream.write(req.file.buffer);
                  outStream.end();
                  outStream.on('finish', function(err){
                        res.json({
                              success: true
                        });
                  });
            }
            else if(req.body.storageType == "cloud"){
                  /* ----------------------------------------------------------------- */
                  /* ------------- Webdav cloud Storage in upload folder ------------- */
                  /* ----------------------------------------------------------------- */
                  var now = moment().format("DDMMYY_Hmmss");
                  var accepted_format = ["image/jpeg",
                  "image/png",
                  "application/pdf",
                  "application/msword",
                  "application/vnd.oasis.opendocument.presentation"];

                  var filename = now + "-" + req.file.originalname;

                  /* Fonction appelée quand l'upload sur OWNCLOUD est fini */
                  var done = function(error, msg){
                  	var message;
                  	if(msg){
                  		message = msg;
                  	}
                  	else{
                  		message = "Une erreur s'est produite.";
                  	}

                  	if(error){
                  		return res.json({
                  			success: false,
                  			msg: message
                  		});
                  	}
                  	// CREATION DE L'OBJET A UPDATER EN FONCTION DU TYPE
                  	var obj = {};
                  	if(type == "facture"){
                  		obj["documentjustificatif_colis"] = filename;
                  	}
                  	else if(type == "photo"){
                  		obj["photo_colis"] = filename;
                  	}

                  	models.Colis.update(obj,{
                  		where:{
                  			id_colis: req.body.idColis
                  		}
                  	}).then(function(){
                  		models.Colis.findAll({
                  			where:{
                  				id_personne_colis: req.session.current_id_personne
                  			}
                  		}).then(function(all_colis){

                  			var missing_facture = false;

                  			all_colis.forEach(function(colis, index){
                  				if(colis.documentjustificatif_colis == "" || colis.documentjustificatif_colis == null){
                  					missing_facture = true;
                  				}
                  			});

                  			res.json({
                  				success: true,
                  				filename: filename,
                  				refColis: req.body.refColis,
                  				idColis: req.body.idColis,
                  				typeFile: req.body.type,
                  				missing_facture: missing_facture
                  			});
                  		});
                  	});
                  }

                  // VERIFIE L'EXTENSION
                  if(accepted_format.indexOf(req.file.mimetype) >= 0){
                  	wfs.stat("/clients/" + current_code_ileeco, function(err, clientFolder) {
                  		// SI LE DOSSIER CLIENT N'EXISTE PAS CHEZ OWNCLOUD
                  		if (!clientFolder) {
                  			// CREATION DU DOSSIER CLIENT
                  			wfs.mkdir("/clients/" + current_code_ileeco, function(err) {
                  				if (!err) {
                  					// CREATION DU DOSSIER COLIS DANS LE DOSSIER CLIENT
                  					wfs.mkdir("/clients/" + current_code_ileeco + "/" + req.body.refColis, function(err) {
                  						// CREATION DE LA FACTURE
                  						wfs.writeFile("/clients/" + current_code_ileeco + "/" + req.body.refColis + "/" + filename, req.file.buffer, function(err) {
                  							if (err){
                  								console.log(err.message);
                  								done(true);
                  							}
                  							else{
                  								done(false);
                  							}
                  						});
                  					});
                  				} else {
                  					console.log(err.message);
                  					done(true)
                  				}
                  			});
                  		} else {
                  			// SI LE DOSSIER CLIENT EXISTE PLUS QU'A VERIFIER SI LE DOSSIER COLIS EXISTE
                  			wfs.stat("/clients/" + current_code_ileeco + "/" + req.body.refColis, function(err, colisFolder) {
                  				if(!colisFolder){
                  					// CREATION DU DOSSIER COLIS DANS LE DOSSIER CLIENT
                  					wfs.mkdir("/clients/" + current_code_ileeco + "/" + req.body.refColis, function(err) {
                  						// CREATION DE LA FACTURE
                  						wfs.writeFile("/clients/" + current_code_ileeco + "/" + req.body.refColis + "/" + filename, req.file.buffer, function(err) {
                  							if(err){
                  								console.log(err.message);
                  								done(true);
                  							}
                  							else{
                  								done(false)
                  							}
                  						});
                  					});
                  				}
                  				else{
                  					// LE DOSSIER COLIS EXISTE DEJA DONC ...
                  					wfs.writeFile("/clients/" + current_code_ileeco + "/" + req.body.refColis + "/" + filename, req.file.buffer, function(err) {
                  						if(err){
                  							console.log(err.message);
                  							done(true);
                  						}
                  						else{
                  							done(false);
                  						}
                  					});
                  				}
                  			});
                  		}
                  	});
                  }
                  else{
                  	res.json({
                  		success: false,
                  		msg: "L'extension de ce fichier n'est pas acceptée. (PDF, JPEG, PNG, WORD)"
                  	});
                  }
            }

        } else {
            res.status(415);
            console.log(err);
            res.json({
                success: false,
                error: "Une erreur s'est produite."
            });
        }
    });
});

module.exports = router;