const crypto = require("crypto");

exports.encrypt = function (text) {
	const cipher = crypto.createCipher('aes-256-cbc', 'd6F3Efeq');
	let crypted = cipher.update(text, 'utf8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
};

exports.decrypt = function (text) {
	const decipher = crypto.createDecipher('aes-256-cbc', 'd6F3Efeq');
	let dec = decipher.update(text, 'hex', 'utf8');
	dec += decipher.final('utf8');
	return dec;
};

const generate_key = function () {
	const sha = crypto.createHash('sha256');
	sha.update(Math.random().toString());
	return sha.digest('hex');
};
exports.generate_key = generate_key;
