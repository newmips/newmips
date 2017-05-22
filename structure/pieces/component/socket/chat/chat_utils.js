var models = require('../models/');
var sequelize = models.sequelize;

function chat(user, socket) {
	return {
		sendChatChannelList: function() {
			return new Promise(function(resolve, reject) {
				models.E_user.findOne({
					attributes: ['id', 'f_login'],
					where: {id: user.id},
					include: [{
						model: models.E_channel,
						as: 'r_user_channel',
						order: ['createdAt DESC']
					}]
				}).then(function(channels) {
					var chatAndChannel = {channels:channels.r_user_channel};
					models.E_chatmessage.findAll({
						where: {$or: [{f_id_user_receiver: user.id}, {f_id_user_sender: user.id}]},
						include: [{
							attributes: ['id', 'f_login'],
							model: models.E_user,
							as: 'r_sender'
						}],
						group: ['f_id_user_sender']
					}).then(function(chats) {
						chatAndChannel.chats = chats;
						socket.emit('initialize', chatAndChannel);
					});
				});
			});
		},
	}
}

exports.bindSocket = function(user, socket, connectedUsers) {
	var Chat = chat(user, socket);

	Chat.sendChatChannelList();

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

	// Channel creation
	socket.on('create-channel', function(data) {
		console.log("CREATE CHANNEL");
		console.log(data);
		models.E_channel.create({
			f_name: data.name
		}).then(function(channel) {
			models.E_user.findById(user.id).then(function(userObj) {
				userObj.addR_user_channel(channel);
			});
		});
	});
}