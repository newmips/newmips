var globalConf = require('../config/global');

var chat = false;
if (globalConf.socket.chat)
	chat = require('../utils/chat');

var connectedUsers = {};

module.exports = function(io) {
	io.on('connection', function(socket) {
		var user = socket.handshake.session.passport.user;
		// Socket initialization
		{
			// On connection, register user to connectedUsers array
			connectedUsers[user.id] = {user: user, socket: socket};

			// On disconnect, remove user from connectedUsers array
			socket.on('disconnect', function() {
				delete connectedUsers[socket.handshake.session.passport.user.id];
			});
		}

		// Socket services binding
		if (chat)
			chat.bindSocket(user, socket, connectedUsers);
	});
}