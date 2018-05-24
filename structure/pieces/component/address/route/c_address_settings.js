var express = require('express');
var router = express.Router();
var block_access = require('../utils/block_access');
var component_helper = require('../utils/component_helper');
var fs = require('fs-extra');

// Winston logger
var logger = require('../utils/logger');

router.get('/config', block_access.actionAccessMiddleware("address_settings", "read"), function (req, res) {
    var tab = req.query.tab;
    var data = {
        menu: "c_address_settings",
        sub_menu: "show_c_address_settings",
        tab: tab,
        address_settings: component_helper.buildComponentAddressConfig()
    };
    res.render('c_address_settings/config', data);
});

router.post('/save', block_access.actionAccessMiddleware("address_settings", "create"), function (req, res) {
    var config = JSON.parse(fs.readFileSync(__dirname + '/../config/c_address_settings.json'));
    var i = 0;
    for (var item in config.entities) {
        config.entities[item].enableMaps = req.body.enableMaps[i];
//        config.entities[item].estimateDistance = req.body.estimateDistance[i];
        config.entities[item].navigation = req.body.navigation[i];
        config.entities[item].zoomBar = req.body.zoomBar[i];
        config.entities[item].mousePosition = req.body.mousePosition[i];
        var entity = item.replace('e_', '');
        entity = entity.charAt(0).toUpperCase() + entity.slice(1);
        for (var pos in config.entities[item].mapsPosition) {
            if (pos !== req.body["mapsPosition" + entity])
                config.entities[item].mapsPosition[pos] = false;
            else
                config.entities[item].mapsPosition[pos] = true;
        }
        i++;
    }
    fs.writeFileSync(__dirname + '/../config/c_address_settings.json', JSON.stringify(config, null, 4));
    req.session.toastr = [{
            message: 'message.update.success',
            level: "success"
        }];
    res.redirect('/address_settings/config');
});

router.get('/info_c_address_maps_ajax', block_access.actionAccessMiddleware("address_settings", "read"), function (req, res) {
    try {
        var translate = require('../services/language');
        res.status(200).json({message: translate(req.session.lang_user).__("component.c_address_settings.info_c_address_maps")});
    } catch (e) {
        res.status(500).end();
    }
});
module.exports = router;