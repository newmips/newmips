var globalConf = require('../config/global');

var chat = false;
if (globalConf.socket.chat)
	chat = require('../utils/chat');

var connectedUsers = [];

module.exports = function(io) {
	io.on('connection', function(socket) {
		// Socket initialization
		{
			// On connection, register user to connectedUsers array
			var user = socket.handshake.session.passport.user;
			connectedUsers[user.id] = {user: user, socket: socket};

			// On disconnect, remove user from connectedUsers array
			socket.on('disconnect', function() {
				delete connectedUsers[socket.handshake.session.passport.user.id];
			});
		}

		// Socket services binding
		if (chat)
			chat.bindSocket(user, socket, connectedUsers);

		console.log('user connected');
	});
}