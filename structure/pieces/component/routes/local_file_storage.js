var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var filterDataTable = require('../utils/filterDataTable');

var models = require('../models/');
var attributes = require('../models/attributes/COMPONENT_NAME_LOWER');
var options = require('../models/options/COMPONENT_NAME_LOWER');
var model_builder = require('../utils/model_builder');
var enums = require('../utils/enum.js');

var multer = require('multer');
var fs = require('fs');
var fse = require('fs-extra');
var moment = require("moment");
var upload = multer().single('file');

function error500(err, res) {
    console.error(err);
    var data = {};
    data.error = 500;
    res.render('common/error', data);
}

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

router.post('/create', block_access.isLoggedIn, function(req, res) {

    var version = parseInt(req.body.version) + 1;
    var createObject = model_builder.buildForRoute(attributes, options, req.body);
    var redirect = '/SOURCE_ENTITY_LOWER/show?id='+req.body.SOURCE_ENTITY_LOWER+'#COMPONENT_NAME_LOWER';

    models.COMPONENT_NAME.create(createObject).then(function(COMPONENT_NAME_LOWER) {
        req.session.toastr = [{
            message: 'message.create.success',
            level: "success"
        }];

        var foreignKeyArray = [];
        var asArray = [];
        for (var j = 0; j < options.length; j++) {
            if(typeof options[j].foreignKey != "undefined")
                foreignKeyArray.push(options[j].foreignKey.toLowerCase());
            if(typeof options[j].as != "undefined")
                asArray.push(options[j].as.toLowerCase());
        }

        first: for (var prop in req.body) {
            if (prop.indexOf('id_') != 0 && asArray.indexOf(prop.toLowerCase()) == -1){
                continue;
            }
            //BELONGS TO with foreignKey naming
            second: for (var i = 0; i < options.length; i++) {
                if(typeof options[i].foreignKey != "undefined" && options[i].foreignKey == prop){
                    continue first;
                }
            }
            if(foreignKeyArray.indexOf(prop.toLowerCase()) != -1){
                continue;
            }

            var target = prop.substr(3);
            //HAS MANY with as naming
            for (var k = 0; k < options.length; k++) {
                if(typeof options[k].as != "undefined" && options[k].as.toLowerCase() == prop.toLowerCase())
                    target = options[k].as;
            }

            target = target.charAt(0).toUpperCase() + target.toLowerCase().slice(1);
            COMPONENT_NAME_LOWER['set'+target](req.body[prop]);
        }

        res.redirect(redirect);
    }).catch(function(err){
        error500(err, res);
    });
});

/* Dropzone COMPONENT ajax upload file */
router.post('/file_upload', block_access.isLoggedIn, function(req, res) {

    // FONCTION UPLOAD DE FICHIER DE MULTER ( FICHIER DANS req.file )
    upload(req, res, function(err) {
        if (!err) {
            if(req.body.storageType == "local"){
                /* ---------------------------------------------------------- */
                /* ------------- Local Storage in upload folder ------------- */
                /* ---------------------------------------------------------- */
                fse.mkdirsSync(__dirname + "/../upload/"+req.body.dataSource+"/"+req.body.dataSourceID+"/"+req.body.dataComponent);
                var uploadPath = __dirname + "/../upload/"+req.body.dataSource+"/"+req.body.dataSourceID+"/"+req.body.dataComponent+"/"+req.file.originalname;
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

router.post('/delete', block_access.isLoggedIn, function(req, res) {
    var id_COMPONENT_NAME = req.body.id;

    models.COMPONENT_NAME.findOne({
        where:{
            id: req.body.idRemove
        }
    }).then(function(toRemoveComponent){
        if(toRemoveComponent){

            fs.unlinkSync(__dirname + "/../upload/SOURCE_ENTITY_LOWER/COMPONENT_NAME_LOWER/"+toRemoveComponent.filename);
            models.COMPONENT_NAME.destroy({
                where: {
                    id: req.body.idRemove
                }
            }).then(function() {
                req.session.toastr = [{
                    message: 'message.delete.success',
                    level: "success"
                }];
                res.redirect('/SOURCE_ENTITY_LOWER/show?id='+req.body.idEntity+'#COMPONENT_NAME_LOWER');
            }).catch(function(err){
                error500(err, res);
            });
        }else{
            req.session.toastr = [{
                message: 'message.delete.failure',
                level: "error"
            }];
            res.redirect('/SOURCE_ENTITY_LOWER/show?id='+req.body.idEntity+'#COMPONENT_NAME_LOWER');
        }
    })
});

module.exports = router;