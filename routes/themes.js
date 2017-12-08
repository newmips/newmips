// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var fs = require("fs-extra");
var helpers = require("../utils/helpers");
var unzip = require("unzip");

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
        res.download(completeFilePath, "my-custom-theme.zip", function(err) {
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

router.post('/upload_theme', function(req, res) {

});

module.exports = router;