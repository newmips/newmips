const config = require('../../config/code_platform');
const service = require('./' + config.platform);
service.config = config;
module.exports = service;