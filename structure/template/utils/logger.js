const winston = require('winston');
const moment = require('moment');
const tsFormat = moment().format("YYYY-MM-DD HH:mm:ss");

// Winston logging configuration
const logger = new winston.Logger({
	transports: [
		new winston.transports.Console({
			level: "info",
			timestamp: tsFormat,
			colorize: true
		}),
		new winston.transports.File({
			level: "silly",
			timestamp: tsFormat,
			filename: __dirname + '/../winston_workspace.log'
		})
	]
});

module.exports = logger;