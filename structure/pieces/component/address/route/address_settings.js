const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const component_helper = require('../utils/component_helper');
const fs = require('fs-extra');

// Winston logger
const logger = require('../utils/logger');

router.get('/config', block_access.actionAccessMiddleware("address_settings", "read"), function (req, res) {
	const tab = req.query.tab;
	const data = {
		menu: "e_address_settings",
		sub_menu: "show_e_address_settings",
		tab: tab,
		address_settings: component_helper.address.buildComponentAddressConfig()
	};
	res.render('e_address_settings/config', data);
});

router.post('/save', block_access.actionAccessMiddleware("address_settings", "create"), function (req, res) {
	const config = JSON.parse(fs.readFileSync(__dirname + '/../config/address_settings.json'));
	let i = 0;
	for (const item in config.entities) {
		config.entities[item].enableMaps = req.body.enableMaps[i];
		config.entities[item].navigation = req.body.navigation[i];
		config.entities[item].zoomBar = req.body.zoomBar[i];
		config.entities[item].mousePosition = req.body.mousePosition[i];
		let entity = item.replace('e_', '');
		entity = entity.charAt(0).toUpperCase() + entity.slice(1);
		for (const pos in config.entities[item].mapsPosition) {
			if (pos !== req.body["mapsPosition" + entity])
				config.entities[item].mapsPosition[pos] = false;
			else
				config.entities[item].mapsPosition[pos] = true;
		}
		i++;
	}
	fs.writeFileSync(__dirname + '/../config/address_settings.json', JSON.stringify(config, null, 4));
	req.session.toastr = [{
		message: 'message.update.success',
		level: "success"
	}];
	res.redirect('/address_settings/config');
});

router.get('/info_address_maps_ajax', block_access.actionAccessMiddleware("address_settings", "read"), function (req, res) {
	try {
		const translate = require('../services/language');
		res.status(200).json({message: translate(req.session.lang_user).__("component.address_settings.info_address_maps")});
	} catch (e) {
		res.status(500).end();
	}
});
module.exports = router;