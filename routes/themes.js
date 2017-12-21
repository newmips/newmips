// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var fs = require("fs-extra");
var helpers = require("../utils/helpers");
var unzip = require("unzip");
var multer = require('multer');
var moment = require("moment");

router.get('/', block_access.isLoggedIn, function(req, res) {
    var data = {};

    var themePath = __dirname + '/../structure/template/public/themes';
    var themeListAvailable = fs.readdirSync(themePath).filter(function(folder) {
        return (folder.indexOf('.') == -1 && folder != "my-custom-theme");
    });

    var availableTheme = [];

    for(var i=0; i<themeListAvailable.length; i++){
        try{
            var infosTheme = JSON.parse(fs.readFileSync(__dirname + '/../structure/template/public/themes/' + themeListAvailable[i] + '/infos.json'));
            var screenPath = __dirname + '/../structure/template/public/themes/' + themeListAvailable[i] + '/screenshot.png';
            var imgData = fs.readFileSync(screenPath);
            infosTheme.codeName = themeListAvailable[i];
            infosTheme.buffer = new Buffer(imgData).toString('base64');
            availableTheme.push(infosTheme);
        } catch(err){
            if(err.errno == -2){
                console.log("Missing infos.json or screenshot.png in theme "+themeListAvailable[i]+". It will be ignored. See documentation for more information about custom theme.");
            } else {
                console.log(err);
            }
        }
    }

    data.availableTheme = availableTheme;
    res.render('front/themes', data);
});

router.get('/download_default', function(req, res) {
    var p = new Promise(function(resolve, reject) {
        var completeFilePath = __dirname + "/../structure/template/public/themes/my-custom-theme.zip";
        res.download(completeFilePath, "my-custom-theme-"+moment().format("HHmmss")+".zip", function(err) {
            if (err)
                reject(err);
            else
                resolve();
        });
    });

    p.then(function() {
        console.log("Custom theme zip was successfully downloaded !");
        res.end();
    }).catch(function(err) {
        console.log(err);
        req.session.toastr.push({
            level: 'error',
            message: "File not found"
        });
        res.writeHead(303, {
            Location: req.headers.referer
        });
        res.end();
    });
});

router.post('/delete_theme', function(req, res) {
    try{
        helpers.rmdirSyncRecursive(__dirname + "/../structure/template/public/themes/"+req.body.theme);
        res.status(200).send(true);
    } catch(err){
        console.log(err);
        res.status(500).send(err);
    }
});

router.post('/upload_theme', multer({
    dest: './upload/'
}).single('themefile'), function(req, res) {
    if(req.file.size < 15000000){
        if(req.file.mimetype == "application/zip"){
            // Create new theme folder
            var themeCodeName = req.file.originalname.split(".zip")[0].replace(/ /g, "-");

            if (!fs.existsSync(__dirname + "/../structure/template/public/themes/"+themeCodeName)) {
                fs.mkdirSync(__dirname + "/../structure/template/public/themes/"+themeCodeName);
                fs.mkdirSync(__dirname + "/../structure/template/public/themes/"+themeCodeName+"/css");
                fs.mkdirSync(__dirname + "/../structure/template/public/themes/"+themeCodeName+"/js");
                fs.mkdirSync(__dirname + "/../structure/template/public/themes/"+themeCodeName+"/img");

                // Unzip
                fs.createReadStream('./' + req.file.path)
                    .pipe(unzip.Parse())
                    .on('entry', function(entry) {
                        var filePath = entry.path;
                        var type = entry.type;
                        var size = entry.size;

                        function notHandlingFile(file){
                            console.log("Not handling this file: "+file);
                            entry.autodrain();
                        }

                        if(type == "File"){
                            var fileName = entry.path.split("/").pop();
                            var fileExt = fileName.split(".").pop().toLowerCase();
                            var writeStream;
                            if(filePath.indexOf("/css/") != -1){
                                if(fileExt == "css"){
                                    writeStream = fs.createWriteStream(__dirname + "/../structure/template/public/themes/"+themeCodeName+"/css/"+fileName);
                                    entry.pipe(writeStream);
                                } else {
                                    notHandlingFile(filePath);
                                }
                            } else if(filePath.indexOf("/js/") != -1){
                                if(fileExt == "js"){
                                    writeStream = fs.createWriteStream(__dirname + "/../structure/template/public/themes/"+themeCodeName+"/js/"+fileName);
                                    entry.pipe(writeStream);
                                } else {
                                    notHandlingFile(filePath);
                                }
                            } else if(filePath.indexOf("/img/") != -1){
                                if(fileExt == "jpg" || fileExt == "jpeg" || fileExt == "png"){
                                    writeStream = fs.createWriteStream(__dirname + "/../structure/template/public/themes/"+themeCodeName+"/img/"+fileName);
                                    entry.pipe(writeStream);
                                } else {
                                    notHandlingFile(filePath);
                                }
                            } else if(filePath.indexOf("infos.json") != -1){
                                if(fileExt == "json"){
                                    writeStream = fs.createWriteStream(__dirname + "/../structure/template/public/themes/"+themeCodeName+"/"+fileName);
                                    entry.pipe(writeStream);
                                } else {
                                    notHandlingFile(filePath);
                                }
                            } else if(filePath.indexOf("screenshot.png") != -1){
                                if(fileExt == "png"){
                                    writeStream = fs.createWriteStream(__dirname + "/../structure/template/public/themes/"+themeCodeName+"/"+fileName);
                                    entry.pipe(writeStream);
                                } else {
                                    notHandlingFile(filePath);
                                }
                            } else {
                                notHandlingFile(filePath);
                            }
                        }
                    }).on('error', function(err) {
                        console.log(err);
                        req.session.toastr = [{level: 'error', message: "Sorry, an internal error occured."}];
                        res.redirect("/themes");
                    }).on('close', function(){
                        req.session.toastr = [{level: 'success', message: "Youpi"}];
                        res.redirect("/themes");
                    });
            } else {
                req.session.toastr = [{level: 'error', message: "Error, this theme name already exist, please rename the theme folder and the .zip."}];
                res.redirect("/themes");
            }
        } else {
            req.session.toastr = [{level: 'error', message: "Error, only .zip are accepted."}];
            res.redirect("/themes");
        }
    } else {
        req.session.toastr = [{level: 'error', message: "Error, max theme size: 10M."}];
        res.redirect("/themes");
    }
});

module.exports = router;