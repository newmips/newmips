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
			}]
		}).then(function(chatAndChannel) {
			var lastSeenPromises = [];
			for (var i = 0; i < chatAndChannel.r_chat.length; i++) {
				// Build promise array that count the number of not seen messages for each chat
				lastSeenPromises.push(new Promise(function(resolve, reject) {
					models.E_user_chat.findOne({
						where: {id_chat: chatAndChannel.r_chat[i].id, id_user: user.id}
					}).then(function(userChat) {
						if (userChat.id_last_seen_message == null)
							userChat.id_last_seen_message = 0;
						models.E_chatmessage.count({
							where: {
								f_id_chat: userChat.id_chat,
								id: {$gt: userChat.id_last_seen_message},
								f_id_user_sender: {$not: user.id}
							}
						}).then(function(notSeen) {
							resolve({id_chat: userChat.id_chat, notSeen: notSeen});
						});
					});
				}));

				// Remove self from chat user array to simplify client side operations
				var chatUsers = chatAndChannel.r_chat[i].r_user;
				for (var j = 0; j < chatUsers.length; j++) {
					if (chatUsers[j].id != user.id) {
						chatAndChannel.r_chat[i].dataValues.contact = chatUsers[j];
						break;
					}
				}
			}

			Promise.all(lastSeenPromises).then(function(notSeens) {
				// Attach notSeen count to corresponding chat
				for (var i = 0; i < chatAndChannel.r_chat.length; i++)
					chatAndChannel.r_chat[i].dataValues.notSeen = notSeens[i].notSeen;

				socket.emit('contacts', chatAndChannel);
			});
		});
	});
}

exports.bindSocket = function(user, socket, connectedUsers) {
	// Global bindings
	{
		// Init chat contacts list client side
		socket.on('initialize', function() {
			sendChatChannelList(user, socket);
		});

		// Send only notifications total. This is used on client init, before the chat is expanded and the contacts loaded
		socket.on('notifications-total', function() {
			models.E_user_chat.findAll({
				where: {id_user: user.id}
			}).then(function(userChat) {
				var notificationsPromises = [];
				for (var i = 0; i < userChat.length; i++) {
					notificationsPromises.push(new Promise(function(resolve, reject) {
						if (userChat[i].id_last_seen_message == null)
							userChat[i].id_last_seen_message = 0;
						models.E_chatmessage.count({
							where: {
								f_id_chat: userChat[i].id_chat,
								id: {$gt: userChat[i].id_last_seen_message},
								f_id_user_sender: {$not: user.id}
							}
						}).then(function(notSeen) {
							resolve(notSeen);
						});
					}));
				}

				Promise.all(notificationsPromises).then(function(notSeens) {
					var total = 0;
					for (var i = 0; i < notSeens.length; i++)
						total += notSeens[i];
					socket.emit('notifications-total', {total: total});
				});
			}).catch(function(e) {
				console.log(e);
			});
		});
	}

	// Channel bindings
	{
		// Channel creation
		socket.on('channel-create', function(data) {
			models.E_channel.create({
				f_name: data.name
			}).then(function(channel) {
				models.E_user.findById(user.id).then(function(userObj) {
					userObj.addR_user_channel(channel).then(function() {
						// Refresh contact list
						sendChatChannelList(user, socket);
					});
				});
			}).catch(function(e) {
				console.log(e);
			});;
		});

	}

	// Chat bindings
	{
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
					chat.setR_user(chatUserIds).then(function() {
						// Refresh contact list
						sendChatChannelList(user, socket);
					});
				});
			}).catch(function(e) {
				console.log(e);
			});
		});

		// Chat message received
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
			}).catch(function(e) {
				console.log(e);
			});;
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
				socket.emit('chat-messages', {id_chat: data.id_chat, messages: chat.r_chatmessage});
			}).catch(function(e) {
				console.log(e);
			});;
		});

		socket.on('chat-update_last_seen', function(data) {
			models.E_chatmessage.max('id', {
				where: {
					f_id_chat: data.id_chat,
					f_id_user_sender: {$not: user.id}
				}
			}).then(function(newLastSeenId) {
				if (isNaN(newLastSeenId))
					newLastSeenId = 0;
				models.E_user_chat.update({id_last_seen_message: newLastSeenId}, {
					where: {id_chat: data.id_chat, id_user: user.id}
				}).then(function() {
					sendChatChannelList(user, socket);
				});
			});
		});
	}
}