var globalConf = require('../config/global');
var io;

var chat = false;
if (globalConf.socket.chat)
	chat = require('../utils/chat');

var connectedUsers = {};

module.exports = function(ioParam) {
	if (ioParam)
		io = ioParam;
	if (io)
		io.on('connection', function(socket) {
			var user;
			try {
				user = socket.handshake.session.passport.user;
				if (!user)
					throw "Bad session for socket";
			} catch (e) {
				console.error("Bad session for socket");
				return;
			}

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

	return {
		sendNotification: function(notification, targetIds) {
			if (!globalConf.socket.enabled || !globalConf.socket.notification)
				return console.log('Sockets or notifications disabled. Notification ID '+notification.id+' couldn\'t be sent');
			for (var i = 0; i < targetIds.length; i++)
				if (connectedUsers[targetIds[i]])
					connectedUsers[targetIds[i]].socket.emit('notification', notification);
		}
	}
}