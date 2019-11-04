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
				order: [['id', 'DESC']]
			}, {
				model: models.E_chat,
				as: 'r_chat',
				include: [{
					model: models.E_user,
					as: 'r_user'
				}]
			}]
		}).then(function(chatAndChannel) {
			var lastSeenChatPromises = [];
			for (var i = 0; i < chatAndChannel.r_chat.length; i++) {
				// Build promise array that count the number of not seen messages for each chat
				lastSeenChatPromises.push(new Promise(function(resolve, reject) {
					models.E_user_chat.findOne({
						where: {id_chat: chatAndChannel.r_chat[i].id, id_user: user.id}
					}).then(function(userChat) {
						if (userChat.id_last_seen_message == null)
							userChat.id_last_seen_message = 0;
						models.E_chatmessage.count({
							where: {
								fk_id_chat: userChat.id_chat,
								id: {[models.$gt]: userChat.id_last_seen_message},
								fk_id_user_sender: {[models.$not]: user.id}
							}
						}).then(function(notSeen) {
							resolve({id_chat: userChat.id_chat, notSeen: notSeen});
						});
					});
				}));
			}

			var lastSeenChannelPromises = [];
			for (var i = 0; i < chatAndChannel.r_user_channel.length; i++) {
				lastSeenChannelPromises.push(new Promise(function(resolve, reject) {
					models.E_user_channel.findOne({
						where: {id_channel: chatAndChannel.r_user_channel[i].id, id_user: user.id}
					}).then(function(userChannel) {
						if (userChannel.id_last_seen_message == null)
							userChannel.id_last_seen_message = 0;
						models.E_channelmessage.count({
							where: {
								fk_id_channel: userChannel.id_channel,
								id: {[models.$gt]: userChannel.id_last_seen_message},
								fk_id_user_sender: {[models.$not]: user.id}
							}
						}).then(function(notSeen) {
							resolve({id_channel: userChannel.id_channel, notSeen: notSeen});
						});
					});
				}));
			}

			Promise.all(lastSeenChatPromises).then(function(notSeens) {
				for (var i = 0; i < chatAndChannel.r_chat.length; i++) {
					// Remove self from chat user array to simplify client side operations
					var chatUsers = chatAndChannel.r_chat[i].r_user;
					for (var j = 0; j < chatUsers.length; j++) {
						if (chatUsers[j].id != user.id) {
							chatAndChannel.r_chat[i].dataValues.contact = chatUsers[j];
							break;
						}
					}
					// Attach notSeen count to corresponding chat
					chatAndChannel.r_chat[i].dataValues.notSeen = notSeens[i].notSeen;
				}

				Promise.all(lastSeenChannelPromises).then(function(notSeens) {
					for (var i = 0; i < chatAndChannel.r_user_channel.length; i++)
						chatAndChannel.r_user_channel[i].dataValues.notSeen = notSeens[i].notSeen;
					socket.emit('contacts', chatAndChannel);
				});

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

		// Middleware to check access right
		socket.use(function(packet, next) {
			var eventName = packet[0];
			var params = packet[1];
			if (['chat-load', 'chat-message', 'chat-update_last_seen'].indexOf(eventName) != -1) {
				models.E_chat.findOne({
					where: {id: params.id_chat},
					include: [{
						model: models.E_user,
						where: {id: user.id},
						as: 'r_user',
					}]
				}).then(function(chat) {
					if (!chat)
						return next(new Error("Access denied"));
					return next();
				});
			}
			else if (['channel-load', 'channel-message', 'channel-update_last_seen'].indexOf(eventName) != -1) {
				models.E_channel.findOne({
					where: {id: params.id_channel},
					include: [{
						model: models.E_user,
						where: {id: user.id},
						as: 'r_user_channel',
					}]
				}).then(function(channel) {
					if (!channel)
						return next(new Error("Access denied"));
					return next();
				});
			}
			else
				return next();
		});

		// Send only notifications total. This is used on client init, before the chat is expanded and the contacts loaded
		socket.on('notifications-total', function() {
			models.E_user_chat.findAll({
				where: {id_user: user.id},
				attributes: ['id_chat', 'id_user', 'id_last_seen_message', 'id']
			}).then(function(userChat) {
				var notificationsPromises = [];
				for (var i = 0; i < userChat.length; i++) {
					notificationsPromises.push(new Promise(function(resolve, reject) {
						if (userChat[i].id_last_seen_message == null)
							userChat[i].id_last_seen_message = 0;
						models.E_chatmessage.count({
							where: {
								fk_id_chat: userChat[i].id_chat,
								id: {[models.$gt]: userChat[i].id_last_seen_message},
								fk_id_user_sender: {[models.$not]: user.id}
							}
						}).then(function(notSeen) {
							resolve(notSeen);
						});
					}));
				}

				models.E_user_channel.findAll({
					where: {id_user: user.id},
				attributes: ['id_channel', 'id_user', 'id_last_seen_message', 'id']
				}).then(function(userChannels) {
					for (var i = 0; i < userChannels.length; i++)
						notificationsPromises.push(new Promise(function(resolve, reject) {
							if (userChannels[i].id_last_seen_message == null)
								userChannels[i].id_last_seen_message = 0;
							models.E_channelmessage.count({
								where: {
									fk_id_channel: userChannels[i].id,
									fk_id_user_sender: {[models.$not]: user.id},
									id: {[models.$gt]: userChannels[i].id_last_seen_message}
								}
							}).then(function(notSeen) {
								resolve(notSeen);
							});
						}));

					Promise.all(notificationsPromises).then(function(notSeens) {
						var total = 0;
						for (var i = 0; i < notSeens.length; i++)
							total += notSeens[i];
						socket.emit('notifications-total', {total: total});
					});
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
				f_name: data.name,
				f_type: data.type
			}).then(function(channel) {
				models.E_user.findById(user.id).then(function(userObj) {
					userObj.addR_user_channel(channel).then(function() {
						// Refresh contact list
						sendChatChannelList(user, socket);
					});
				});
			}).catch(function(e) {
				console.log(e);
			});
		});

		// Channel join
		socket.on('channel-join', function(data) {
			models.E_channel.findOne({
				where: {id: parseInt(data.id_channel)}
			}).then(function(channel) {
				models.E_user.findById(user.id).then(function(userObj) {
					userObj.addR_user_channel(channel.id).then(function() {
						// Refresh contact list
						sendChatChannelList(user, socket);
					});
				});
			}).catch(function(e) {
				console.log(e);
			});
		});

		// Channel invite
		socket.on('channel-invite', function(data) {
			models.E_channel.findOne({
				where: {id: parseInt(data.id_channel)}
			}).then(function(channel) {
				models.E_user.findById(parseInt(data.id_user)).then(function(userObj) {
					userObj.addR_user_channel(channel.id).then(function() {
						// Refresh contact list
						sendChatChannelList(user, socket);
						if (connectedUsers[data.id_user])
							sendChatChannelList(connectedUsers[data.id_user].user, connectedUsers[data.id_user].socket);
					});
				});
			}).catch(function(e) {
				console.log(e);
			});
		});

		// Channel leave
		socket.on('channel-leave', function(data) {
			models.E_user_channel.destroy({
				where: {id_user: user.id, id_channel: parseInt(data.id_channel)}
			}).then(function() {
				sendChatChannelList(user, socket);
			}).catch(function(e) {
				console.log(e);
			});
		});

		// Channel message received
		socket.on('channel-message', function(data) {
			data.id_channel = parseInt(data.id_channel);

			models.E_channel.findOne({where: {id: data.id_channel}}).then(function(channel) {
				if (!channel)
					return 'Existe pas, il a joue avec les ID';
				// Insert message into DataBase
				models.E_channelmessage.create({
					f_message: data.message,
					fk_id_user_sender: user.id,
					fk_id_channel: data.id_channel
				}).then(function(channelmessage) {
					models.E_channelmessage.findOne({
						where: {id: channelmessage.id},
						include: [{
							model: models.E_user,
							as: 'r_sender'
						}]
					}).then(function(channelmessage) {
						models.E_user_channel.findAll({
							where: {id_channel: data.id_channel}
						}).then(function(channelusers) {
							for (var i = 0; i < channelusers.length; i++)
								if (connectedUsers[channelusers[i].id_user]) {
									channelmessage.dataValues.id_self = channelusers[i].id_user;
									connectedUsers[channelusers[i].id_user].socket.emit('channel-message', channelmessage);
								}
						});
					});
				});
			}).catch(function(e) {
				console.log(e);
			});
		});

		// Load message from offset until limit
		socket.on('channel-load', function(data) {
			models.E_channel.findOne({
				where: {id: parseInt(data.id_channel)},
				include: [{
					attributes: ['f_login'],
					model: models.E_user,
					as: 'r_user_channel'
				}, {
					model: models.E_channelmessage,
					as: 'r_channelmessage',
					order: [["id", "DESC"]],
					limit: data.limit,
					offset: data.offset,
					include: [{
						model: models.E_user,
						as: 'r_sender',
						attributes: ['id', 'f_login']
					}]
				}]
			}).then(function(channel) {
				socket.emit('channel-messages', {contacts: channel.r_user_channel ,id_channel: data.id_channel, id_self: user.id, messages: channel.r_channelmessage});
			}).catch(function(e) {
				console.log(e);
			});
		});

		// Update notifications
		socket.on('channel-update_last_seen', function(data) {
			models.E_channelmessage.max('id', {
				where: {
					fk_id_channel: parseInt(data.id_channel),
					fk_id_user_sender: {[models.$not]: user.id}
				}
			}).then(function(newLastSeenId) {
				if (isNaN(newLastSeenId))
					newLastSeenId = 0;
				models.E_user_channel.update({id_last_seen_message: newLastSeenId}, {
					where: {id_channel: data.id_channel, id_user: user.id}
				}).then(function() {
					sendChatChannelList(user, socket);
				});
			});
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
					where: {id: {[models.$in]: chatUserIds}}
				}]
			}).then(function(chat) {
				if (chat && chat.r_user && chat.r_user.length == 2)
					return 'Existe deja, il a joue avec les ID';
				models.E_chat.create().then(function(chat) {
					chat.setR_user(chatUserIds).then(function() {
						// Refresh contact list
						sendChatChannelList(user, socket);
						if (connectedUsers[data.receiver])
							sendChatChannelList(connectedUsers[data.receiver].user, connectedUsers[data.receiver].socket);
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
					fk_id_user_sender: user.id,
					fk_id_user_receiver: data.id_contact,
					fk_id_chat: data.id_chat
				}).then(function(chatmessage) {
					models.E_chatmessage.findOne({
						where: {id: chatmessage.id},
						include: [{
							model: models.E_user,
							as: 'r_sender'
						}]
					}).then(function(chatmessage) {
						chatmessage.id_contact = chatmessage.fk_id_user_sender;
						// Send message to receiver if connected
						if (connectedUsers[data.id_contact])
							connectedUsers[data.id_contact].socket.emit('chat-message', chatmessage);
						// Send back created message to sender (so client can use createdAt and common DB format)
						socket.emit('chat-message', chatmessage);
					});
				});
			}).catch(function(e) {
				console.log(e);
			});
		});

		// Load messages of chat
		socket.on('chat-load', function(data) {
			models.E_chat.findOne({
				where: {id: data.id_chat},
				include: [{
					model: models.E_chatmessage,
					as: 'r_chatmessage',
					order: [["id", "DESC"]],
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
			});
		});

		// Update notifications
		socket.on('chat-update_last_seen', function(data) {
			models.E_chatmessage.max('id', {
				where: {
					fk_id_chat: data.id_chat,
					fk_id_user_sender: {[models.$not]: user.id}
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