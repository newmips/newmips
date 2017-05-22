var models = require('../models/');
var sequelize = models.sequelize;

exports.bindSocket = function(user, socket, connectedUsers) {

	// On connection, send not seen message count (notifications by user) to client
	models.E_chatmessage.findAll({
		attributes: ['f_id_user_sender', [sequelize.fn('count', sequelize.col('id')), 'not_seen']],
		where: {
			f_id_user_receiver: user.id,
			f_seen: 0
		},
		group: ['f_id_user_sender']
	}).then(function(chatmessages) {
		socket.emit('chat-notifications', chatmessages);
	});

	// Message received
	socket.on('chat-message', function(data) {
		// Insert message into DataBase
		models.E_chatmessage.create({
			f_message: data.message,
			f_seen: (connectedUsers[data.receiver] ? true : false),
			f_id_user_sender: user.id,
			f_id_user_receiver: data.receiver
		}).then(function(chatmessage) {
			// Send message to receiver if connected
			if (connectedUsers[data.receiver])
				connectedUsers[data.receiver].socket.emit('chat-message', chatmessage);
			// Send back created message to sender (so client can use createdAt and common DB format)
			socket.emit('chat-message', chatmessage);
		});
	});
}