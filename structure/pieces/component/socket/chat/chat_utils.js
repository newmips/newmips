var models = require('../models/');
var sequelize = models.sequelize;

function sendChatChannelList(user, socket) {
	return new Promise(function(resolve, reject) {
		models.E_user.findOne({
			attributes: ['id', 'f_login'],
			where: {id: user.id},
			include: [{
				model: models.E_channel,
				as: 'r_user_channel',
				order: ['createdAt DESC']
			}, {
				model: models.E_chat,
				as: 'r_chat',
				include: [{
					model: models.E_user,
					as: 'r_user'
				}]
			}, {
				model: models.E_
			}]
		}).then(function(chatAndChannel) {
			console.log(chatAndChannel);
			// Remove self from chat user array to simplify client side operations
			for (var i = 0; i < chatAndChannel.r_chat.length; i++) {
				var chatUsers = chatAndChannel.r_chat[i].r_user;
				for (var j = 0; j < chatUsers.length; j++) {
					if (chatUsers[j].id != user.id) {
						chatAndChannel.r_chat[i].dataValues.contact = chatUsers[j];
						break;
					}
				}
			}

			socket.emit('initialize', chatAndChannel);
		});
	});
}

exports.bindSocket = function(user, socket, connectedUsers) {
	// Init chat contacts list client side
	sendChatChannelList(user, socket);

	// Channel creation
	socket.on('channel-create', function(data) {
		models.E_channel.create({
			f_name: data.name
		}).then(function(channel) {
			models.E_user.findById(user.id).then(function(userObj) {
				userObj.addR_user_channel(channel);
			});
		});
	});

	// Chat creation
	socket.on('chat-create', function(data) {
		var chatUserIds = [user.id, data.receiver];
		models.E_chat.findAll({
			include: [{
				model: models.E_user,
				as: 'r_user',
				where: {id: {$in: chatUserIds}}
			}]
		}).then(function(chat) {
			if (chat && chat.r_user && chat.r_user.length == 2)
				return 'Existe deja, il a joue avec les ID';
			models.E_chat.create().then(function(chat) {
				chat.setR_user(chatUserIds);
			});
		});
	});

	// Message received
	socket.on('chat-message', function(data) {
		data.id_contact = parseInt(data.id_contact);
		data.id_chat = parseInt(data.id_chat);

		models.E_chat.findOne({where: {id: data.id_chat}}).then(function(chat) {
			if (!chat)
				return 'Existe pas, il a joue avec les ID';
			// Insert message into DataBase
			models.E_chatmessage.create({
				f_message: data.message,
				f_seen: (connectedUsers[data.id_contact] ? true : false),
				f_id_user_sender: user.id,
				f_id_user_receiver: data.id_contact,
				f_id_chat: data.id_chat
			}).then(function(chatmessage) {
				models.E_chatmessage.findOne({
					where: {id: chatmessage.id},
					include: [{
						model: models.E_user,
						as: 'r_sender'
					}]
				}).then(function(chatmessage) {
					chatmessage.id_contact = chatmessage.f_id_user_sender;
					// Send message to receiver if connected
					if (connectedUsers[data.id_contact])
						connectedUsers[data.id_contact].socket.emit('chat-message', chatmessage);
					// Send back created message to sender (so client can use createdAt and common DB format)
					socket.emit('chat-message', chatmessage);
				});
			});
		});
	});

	// Load messages of chat
	socket.on('chat-load', function(data) {
		models.E_chat.findOne({
			where: {id: data.id_chat},
			include: [{
				model: models.E_chatmessage,
				as: 'r_chatmessage',
				order: 'createdAt DESC',
				limit: data.limit,
				offset: data.offset,
				include: [{
					model: models.E_user,
					as: 'r_sender',
					attributes: ['id', 'f_login']
				}]
			}]
		}).then(function(chat) {
			if (chat && chat.r_chatmessage && chat.r_chatmessage.length > 0)
				socket.emit('chat-messages', {id_chat: data.id_chat, messages: chat.r_chatmessage});
		});
	});
}