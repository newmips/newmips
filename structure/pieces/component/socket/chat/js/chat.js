// Utils
{
	function toastIt(msgID, level) {
		const msg =  $('#'+msgID).text();
		toastr[level](msg);
	}
	function formatDate(d) {
		return ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" +
			d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2) + ":" + ("0" + d.getSeconds()).slice(-2);
	}

	function sortMessages(messages, idx) {
		if (!messages[idx+1])
			return messages;
		if (messages[idx].id > messages[idx+1].id)
			return sortMessages(messages, idx+1);
		const tmp = messages[idx];
		messages[idx] = messages[idx+1];
		messages[idx+1] = tmp;
		return sortMessages(messages, idx-1 <= 0 ? 0 : idx-1);
	}

	function userSelect() {
		$("#createChatId, #inviteUserChannel").select2({
			ajax: {
				url: '/chat/user_search',
				dataType: 'json',
				method: 'POST',
				delay: 250,
				contentType: "application/json",
				context: this,
				data: function (params) {
					return JSON.stringify({
						search: params.term,
					});
				},
				processResults: function (data, params) {
					return {
						results: data
					};
				},
				cache: true
			},
			minimumInputLength: 1,
			escapeMarkup: function (markup) {
				return markup;
			},
			templateResult: function (data) {
				return data.text;
			}
		});
	}
	function channelSelect() {
		$("#joinChannel").select2({
			ajax: {
				url: '/chat/channel_search',
				dataType: 'json',
				method: 'POST',
				delay: 250,
				contentType: "application/json",
				context: this,
				data: function (params) {
					return JSON.stringify({
						search: params.term,
					});
				},
				processResults: function (data, params) {
					return {
						results: data
					};
				},
				cache: true
			},
			minimumInputLength: 1,
			escapeMarkup: function (markup) {
				return markup;
			},
			templateResult: function (data) {
				return data.text;
			}
		});
	}
}

// Html templates
{
	function contactChannel(channelObj) {
		let channel = '';
		channel += '<li data-id-channel="'+channelObj.id+'" data-type="channel">';
		channel += '	<a href="#">';
		channel += '		<img class="contacts-list-img">';
		channel += '		<div class="contacts-list-info">';
		channel += '			<span class="contacts-list-name"><i class="fa fa-plus"></i>&nbsp;&nbsp;';
		channel += '				'+channelObj.f_name;
		channel += '		 		 <span class="contactNotifications badge bg-light-blue" data-toggle="tooltip" style="margin-left:10px;'+((channelObj.notSeen && channelObj.notSeen > 0) ? '' : 'display:none;')+'">'+channelObj.notSeen+'</span>'
		channel += '			</span>';
		channel += '			<span class="contacts-list-msg"><!-- INSERT LAST MESSAGE --></span>';
		channel += '		</div>';
		channel += '	</a>';
		channel += '</li>';

		return channel;
	}
	function contactChat(chatObj) {
		let chat = '';
		chat += '<li data-id-chat="'+chatObj.id+'" data-id-contact="'+chatObj.contact.id+'" data-type="chat">';
		chat += '	<a href="#">';
		chat += '		<img class="contacts-list-img">';
		chat += '		<div class="contacts-list-info">';
		chat += '			<span class="contacts-list-name"><i class="fa fa-user"></i>&nbsp;&nbsp;';
		chat += '				'+chatObj.contact.f_login;
		chat += '				<small class="contacts-list-date pull-right">'+ formatDate(new Date(chatObj.updatedAt))+'</small>';
		chat += '		 		 <span class="contactNotifications badge bg-light-blue" data-toggle="tooltip" style="margin-left:10px;'+((chatObj.notSeen && chatObj.notSeen > 0) ? '' : 'display:none;')+'">'+chatObj.notSeen+'</span>'
		chat += '			</span>';
		chat += '		</div>';
		chat += '	</a>';
		chat += '</li>';

		return chat;
	}
	function discussionMessage(messageObj, owned) {
		const nameClass = owned ? 'pull-left' : 'pull-right';
		const dateClass = owned ? 'pull-right' : 'pull-left';
		const sideClass = owned ? '' : 'right';
		const floatStyle = !owned ? 'float:right;' : 'float: left;';
		let message = '';
		message += '<div class="direct-chat-msg '+sideClass+'">';
		message += '	<div class="direct-chat-info clearfix">';
		message += '		<span class="direct-chat-name '+nameClass+'">'+messageObj.r_sender.f_login+'</span>';
		message += '		<span class="direct-chat-timestamp '+dateClass+'">'+formatDate(new Date(messageObj.createdAt))+'</span>';
		message += '	</div>';
		message += '	<div class="direct-chat-text" style="word-wrap:break-word;width:50%;'+floatStyle+'">';
		message += '		'+messageObj.f_message;
		message += '	</div>';
		message += '</div>';

		return message;
	}
	function channelContacts(contacts) {
		let contactsHtml = '';
		contactsHtml += '<h4 class="contacts-list-name">'+$("#msg-channel_members").text()+'</h4>';
		contactsHtml += '<ul class="contacts-list">';
		for (let i = 0; i < contacts.length; i++)
			contactsHtml += '<li>'+contacts[i].f_login+'</li>';
		contactsHtml += '</ul><br>';
		$("#channelUsersList").html(contactsHtml);
	}
}

// Discussion handle
{
	var chats = [], channels = [];
	var discussion;var defaultDiscussion;
	function selectChat(id_chat, id_contact) {
		if (discussion && discussion.id == id_chat)
			return;

		$("#discussion").html('');
		// Chat already loaded
		if (chats[id_chat]) {
			discussion = {id: id_chat, id_contact: id_contact, messages: chats[id_chat].messages, type: 'chat'};
			prependToDiscussion(chats[id_chat]);
		}
		// Chat not loaded
		else if (!chats[id_chat]) {
			chats[id_chat] = {limit: 5, offset: 0, messages: []};
			socket.emit('chat-load', {id_chat: id_chat, limit: chats[id_chat].limit, offset: chats[id_chat].offset});
			discussion = {id: id_chat, id_contact: id_contact, messages: chats[id_chat].messages, type: 'chat'};
		}
		localStorage.chatId = id_chat;
		localStorage.contactId = id_contact;
		socket.emit('chat-update_last_seen', {id_chat: id_chat});
		scroll(true);
	}
	function selectChannel(id_channel) {
		if (discussion && discussion.id == id_channel)
			return;
		$("#discussion").html('');
		if (channels[id_channel]) {
			discussion = {id: id_channel, messages: channels[id_channel].messages, type: 'channel'};
			prependToDiscussion(channels[id_channel]);
			channelContacts(channels[id_channel].contacts);
		}
		// Chat not loaded
		else if (!channels[id_channel]) {
			channels[id_channel] = {limit: 5, offset: 0, messages: []};
			socket.emit('channel-load', {id_channel: id_channel, limit: channels[id_channel].limit, offset: channels[id_channel].offset});
			discussion = {id: id_channel, messages: channels[id_channel].messages, type: 'channel'};
		}
		localStorage.channelId = id_channel;
		socket.emit('channel-update_last_seen', {id_channel: id_channel});
		$("#channelUsersBtn").show();
		scroll(true);
	}

	function loadPreviousChatMessage(discussion) {
		if (discussion.type == 'chat') {
			chats[discussion.id].offset = chats[discussion.id].messages.length;
			socket.emit('chat-load', {id_chat: discussion.id, limit: chats[discussion.id].limit, offset: chats[discussion.id].offset});
		}
		else if (discussion.type == 'channel') {
			channels[discussion.id].offset = channels[discussion.id].messages.length;
			socket.emit('channel-load', {id_channel: discussion.id, limit: channels[discussion.id].limit, offset: channels[discussion.id].offset});
		}
	}
}

// UI
{
	function createContactList(data) {
		if (!data)
			return;
		let totalNotSeen = 0;
		$("#channelsList").html('');
		$("#chatsList").html('');
		for (var i = 0; i < data.r_user_channel.length; i++) {
			totalNotSeen += data.r_user_channel[i].notSeen;
			$("#channelsList").append(contactChannel(data.r_user_channel[i]));
		}
		for (var i = 0; i < data.r_chat.length; i++) {
			totalNotSeen += data.r_chat[i].notSeen;
			$("#chatsList").append(contactChat(data.r_chat[i]));
		}

		if (totalNotSeen == 0)
			$("#totalNotSeen").text('0').hide();
		else
			$("#totalNotSeen").text(totalNotSeen).show();

		if (defaultDiscussion) {
			$("#chat").removeClass('direct-chat-contacts-open');
			if (defaultDiscussion.type == 'chat')
				selectChat(defaultDiscussion.chatId, defaultDiscussion.contactId);
			else if (defaultDiscussion.type == 'channel')
				selectChannel(defaultDiscussion.channelId);
			defaultDiscussion = undefined;
		}
	}

	function prependToDiscussion(data) {
		if (typeof data.messages === 'undefined')
			data.messages = [data];

		// Sort messages by ID (createdAt can be at the same second)
		data.messages = sortMessages(data.messages, 0);
		for (let i = 0; i < data.messages.length; i++) {
			const messageSide = (discussion.type == 'chat')
				? data.messages[i].r_sender.id == discussion.id_contact
				: data.messages[i].r_sender.id != data.id_self;
			const msgTemplate = discussionMessage(data.messages[i], messageSide);
			$("#discussion").prepend(msgTemplate);
		}
	}

	function appendToDiscussion(data) {
		let messageSide;
		if (discussion.type == 'chat') {
			socket.emit('chat-update_last_seen', {id_chat: discussion.id});
			messageSide = data.r_sender.id == discussion.id_contact;
		}
		else if (discussion.type == 'channel') {
			socket.emit('channel-update_last_seen', {id_channel: discussion.id});
			messageSide = data.r_sender.id != data.id_self;
		}
		const msgTemplate = discussionMessage(data, messageSide);
		$("#discussion").append(msgTemplate);
		scroll(true);
	}

	function scroll(goDown) {
		if (goDown)
			$("#discussion").animate({scrollTop: $("#discussion").prop('scrollHeight')}, 500);
		else
			$("#discussion").animate({scrollTop: 0}, 500);
	}

	function incrementNotifications(id, type) {
		const selector = (type == 'chat') ? "*[data-id-chat='"+id+"']" : "*[data-id-channel='"+id+"']";
		// Increment contact notif
		const currentNotifForContact = parseInt($(selector).find('.contactNotifications').text()) || 0;
		$(selector).find('.contactNotifications').text(currentNotifForContact+1).show();

		// Increment total notif
		const currentTotalNotif = parseInt($("#totalNotSeen").text()) || 0;
		$("#totalNotSeen").text(currentTotalNotif+1).show();
	}
}

$(function() {
	// Initialize only global notifications to ease server load when discussion collapsed
	socket.emit('notifications-total');

	let beforeLoadHeight;

	// Socket input bidings
	{
		// GLOBAL
		socket.on('contacts', createContactList);

		socket.on('notifications-total', function(data) {
			if (data.total == 0)
				$("#totalNotSeen").text('0').hide();
			else
				$("#totalNotSeen").text(data.total).show();
		});

		socket.on('error', function(reason) {
			console.log(reason);
			if (reason == 'Access denied')
				("#contactsBtn").click();
		});

		// CHANNEL
		socket.on('channel-message', function(data) {
			if (channels[data.fk_id_channel])
				channels[data.fk_id_channel].messages.unshift(data);

			// If message is not for current discussion append it, if not increment notif
			if (discussion && (discussion.id == data.fk_id_channel))
				appendToDiscussion(data);
			else
				incrementNotifications(data.fk_id_channel, 'channel');
		});

		socket.on('channel-messages', function(data) {
			const baseMessagesLength = channels[data.id_channel].messages.length;

			channels[data.id_channel].messages = data.messages.concat(channels[data.id_channel].messages);
			channels[data.id_channel].contacts = data.contacts;
			channels[data.id_channel].id_self = data.id_self;
			prependToDiscussion(data);
			channelContacts(data.contacts);
			if (baseMessagesLength == 0)
				scroll(true);
			else {
				// Scroll to position before new messages loaded to make the load visible
				// `beforeLoadHeight` is set on the scroll event binding
				if (beforeLoadHeight) {
					const newScrollTop = $("#discussion").prop('scrollHeight') - beforeLoadHeight;
					$("#discussion").scrollTop(newScrollTop);
					beforeLoadHeight = undefined;
				}
			}
		});

		// CHAT
		socket.on('chat-message', function(data) {
			if (chats[data.fk_id_chat])
				chats[data.fk_id_chat].messages.unshift(data);

			// If message is not for current discussion append it, if not increment notif
			if (discussion && (discussion.id_contact == data.fk_id_user_sender || discussion.id_contact == data.fk_id_user_receiver))
				appendToDiscussion(data);
			else
				incrementNotifications(data.fk_id_chat, 'chat');
		});

		socket.on('chat-messages', function(data) {
			const baseMessagesLength = chats[data.id_chat].messages.length;

			chats[data.id_chat].messages = data.messages.concat(chats[data.id_chat].messages);
			prependToDiscussion(data);
			if (baseMessagesLength == 0)
				scroll(true);
			else {
				// Scroll to position before new messages loaded to make the load visible
				// `beforeLoadHeight` is set on the scroll event binding
				if (beforeLoadHeight) {
					const newScrollTop = $("#discussion").prop('scrollHeight') - beforeLoadHeight;
					$("#discussion").scrollTop(newScrollTop);
					beforeLoadHeight = undefined;
				}
			}
		});
	}

	// UI bindings
	{
		// On first chat expand, initialize contacts
		let initialized = false;
		$("#collapseChat").click(function() {
			localStorage.chatCollapsed = ""+(!JSON.parse(localStorage.chatCollapsed));
			if (initialized)
				return;
			initialized = true;
			socket.emit('initialize');
		});
		// Collapse or expend chat depending on last display state
		if (typeof localStorage.chatCollapsed === 'undefined')
			localStorage.chatCollapsed = "true";
		// Not collapsed, display chat box and trigger contact init
		if (localStorage.chatCollapsed == "false") {
			$("#chat").removeClass('collapsed-box');
			initialized = true;
			// Show previously selected discussion if defined
			if (localStorage.chatId || localStorage.channelId) {
				defaultDiscussion = {};
				if (localStorage.chatId) {
					defaultDiscussion.type = 'chat';
					defaultDiscussion.chatId = localStorage.chatId;
					defaultDiscussion.contactId = localStorage.contactId;
				}
				else if (localStorage.channelId) {
					defaultDiscussion.type = 'channel';
					defaultDiscussion.channelId = localStorage.channelId;
				}
			}
			socket.emit('initialize');
		}

		// Send message
		$("#messageForm").submit(function() {
			const msg = $("input[name='discussion-message']").val();
			if (!msg || msg == '' || !discussion || (!discussion.id && !discussion.id_contact))
				return false;
			if (discussion.type == 'chat')
				socket.emit('chat-message', {message: msg, id_chat: discussion.id, id_contact: discussion.id_contact});
			else if (discussion.type == 'channel')
				socket.emit('channel-message', {message: msg, id_channel: discussion.id});
			$("input[name='discussion-message']").val('');
			return false;
		});


		// Channel creation/join bindings
		// CREATE
		$("#createChannelBtn").click(function() {
			if ($(this).hasClass('fa-plus')) {
				$("#createChannel").slideDown();
				$(this).removeClass('fa-plus').addClass('fa-minus');
			}
			else if ($(this).hasClass('fa-minus')) {
				$("#createChannel").slideUp();
				$(this).removeClass('fa-minus').addClass('fa-plus');
			}
		});
		$("#doCreateChannel").click(function() {
			if ($("#createChannelName").val() == '')
				return;
			const type = $("input[name='channelType']:checked").val() || 'public';
			socket.emit('channel-create', {name: $("#createChannelName").val(), type: type});
			toastIt('msg-channel_created', 'success');
			$("#createChannelBtn").click();
		});
		// JOIN
		$("#doJoinChannel").click(function() {
			if ($("#joinChannel").val() == '')
				return;
			socket.emit('channel-join', {id_channel: $("#joinChannel").val()});
			toastIt('msg-channel_joined', 'success');
			$("#createChannelBtn").click();
		});
		$("#doInviteChannel").click(function() {
			if ($("#inviteUserChannel").val() == '')
				return;
			socket.emit('channel-invite', {id_channel: discussion.id, id_user: $("#inviteUserChannel").val()});
			toastIt('msg-user_invited', 'success');
			$("#channelUsersBtn").click();
		});
		// LEAVE
		$("#leaveChannel").click(function() {
			socket.emit('channel-leave', {id_channel: discussion.id});
			toastIt('msg-channel_left', 'success');
			$("#contactsBtn").click();
		});


		// Chat creation bindings
		$("#createChatBtn").click(function() {
			if ($(this).hasClass('fa-plus')) {
				$("#createChat").slideDown();
				$(this).removeClass('fa-plus').addClass('fa-minus');
			}
			else if ($(this).hasClass('fa-minus')) {
				$("#createChat").slideUp();
				$(this).removeClass('fa-minus').addClass('fa-plus');
			}
		});
		$("#doCreateChat").click(function() {
			if ($("#createChatId").val() == '')
				return;
			socket.emit('chat-create', {receiver: $("#createChatId").val()});
			toastIt('msg-chat_created', 'success');
			$("#createChatBtn").click();
		});


		// Contact list bindings
		$(document).delegate("#channelsList li, #chatsList li", 'click', function() {
			if ($(this).parent().attr('id') == 'channelsList')
				selectChannel($(this).data('id-channel'));
			else if ($(this).parent().attr('id') == 'chatsList')
				selectChat($(this).data('id-chat'), $(this).data('id-contact'));
			$("#contactsBtn").click();
		});

		// Discussion scrolled to max top, load previous messages
		$("#discussion").scroll(function() {
			if ($(this).scrollTop() == 0) {
				beforeLoadHeight = $("#discussion").prop('scrollHeight');
				loadPreviousChatMessage(discussion);
			}
		});

		$("#contactsBtn").click(function() {
			if (!$("#chat").hasClass('direct-chat-contacts-open')) {
				localStorage.removeItem('chatId');
				localStorage.removeItem('contactId');
				localStorage.removeItem('channelId');
				discussion = undefined;
				$("#channelUsersBtn").hide();
				$("#channelUsers").hide();
			}
		});

		$("#channelUsersBtn").click(function() {
			if ($("#channelUsers").is(':visible'))
				$("#channelUsers").slideUp();
			else
				$("#channelUsers").slideDown();
		});

		$(document).on("click", "#chat .box-header .box-title", function(e){
			$("#collapseChat").trigger("click");
		});
	}

	userSelect();
	channelSelect();
});