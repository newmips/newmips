// router/routes.js
var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var message = "";

//Sequelize
var models = require('../models/');

// ===========================================
// Redirection data_field =====================
// ===========================================
// List
router.get('/list', block_access.isLoggedIn, function(req, res) {
    var data = {};

    models.DataField.findAll({
        include: [{
            model: models.DataEntity
        }]
    }).then(function(data_fields){
        data.data_fields = data_fields;
        res.render('back/data_field/list.jade', data);
    }).catch(function(err){
        data.code = 500;
        res.render('common/error', data);
    });
});
module.exports = router;