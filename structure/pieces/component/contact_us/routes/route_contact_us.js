var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');

var mailer_helper = require('../utils/mailer');

function error500(err, res) {
    console.error(err);
    var data = {};
    data.error = 500;
    res.render('common/error', data);
}

function capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
}

router.get('/', block_access.isLoggedIn, function(req, res) {
    var data = {};
    // Récupération des toastr en session
    data.toastr = req.session.toastr;
    // Nettoyage de la session
    req.session.toastr = [];
    res.render('COMPONENT_NAME_LOWER/COMPONENT_NAME_LOWER', data);
});

router.post('/', block_access.isLoggedIn, function(req, res) {

    var mailOptions = {
        from: req.body.email,
        to: mailer_helper.config.administrateur,
        subject: req.body.title,
        html: req.body.content
    };
    mailer_helper.sendMailAsync(mailOptions).then(function(success) {
        req.session.toastr = [{
            message: "Le mail à bien été envoyé.",
            level: "success"
        }];
        res.redirect("/COMPONENT_NAME_LOWER");
    }).catch(function(err) {
        console.log(err);
        req.session.toastr = [{
            message: "Une erreur s'est produite",
            level: "error"
        }];
        res.redirect("/COMPONENT_NAME_LOWER");
    });
});

module.exports = router;