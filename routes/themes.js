// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var fs = require("fs-extra");

router.get('/', block_access.isLoggedIn, function(req, res) {
    var data = {};

    var themePath = __dirname + '/../structure/template/public/themes';
    var themeListAvailable = fs.readdirSync(themePath).filter(function(folder) {
        return (folder.indexOf('.') == -1);
    });

    var availableTheme = [];

    for(var i=0; i<themeListAvailable.length; i++){
        try{
            var infosTheme = JSON.parse(fs.readFileSync(__dirname + '/../structure/template/public/themes/' + themeListAvailable[i] + '/infos.json'));
            availableTheme.push(infosTheme);
        } catch(err){
            if(err.errno == -2){
                console.log("Missing infos.json in theme "+themeListAvailable[i]+". It will be ignored. See documentation for more information about custom theme.");
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

module.exports = router;