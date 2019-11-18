const express = require('express');
const router = express.Router();
const block_access = require('../utils/block_access');
const gitlabConf = require('../config/gitlab.js');
const models = require('../models/');

router.get('/', block_access.isLoggedIn, (req, res) => {
    const data = {};
    data.user = req.session.passport.user;
    models.Role.findByPk(data.user.id_role).then(userRole => {
        data.user.role = userRole;

        if (gitlabConf.doGit) {
            data.gitlabUser = req.session.gitlab.user;
            data.gitlabHost = gitlabConf.protocol + "://" + gitlabConf.url;
        }

        res.render('front/account', data);
    });
});

module.exports = router;