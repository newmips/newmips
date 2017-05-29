var socket = io();

// Html templates
{
	function contactChannel(channelObj) {
		var channel = '';
	    channel += '<li data-id="'+channelObj.id+'" data-type="channel">';
	    channel += '    <a href="#">';
	    channel += '        <img class="contacts-list-img">';
	    channel += '        <div class="contacts-list-info">';
	    channel += '            <span class="contacts-list-name">';
	    channel += '                '+channelObj.f_name;
	//    channel += '                <small class="contacts-list-date pull-right">'+chann+'</small>';
	    channel += '            </span>';
	    channel += '            <span class="contacts-list-msg"><!-- INSERT LAST MESSAGE --></span>';
	    channel += '        </div>';
	    channel += '    </a>';
	    channel += '</li>';

	    return channel;
	}
	function contactChat(chatObj) {
		var chat = '';
		chat += '<li data-id-chat="'+chatObj.id+'" data-id-contact="'+chatObj.contact.id+'" data-type="chat">';
		chat += '    <a href="#">';
		chat += '        <img class="contacts-list-img">';
		chat += '        <div class="contacts-list-info">';
		chat += '            <span class="contacts-list-name">';
		chat += '                '+chatObj.contact.f_login;
		chat += '                <small class="contacts-list-date pull-right">'+chatObj.updatedAt+'</small>';
		chat += '            </span>';
		// chat += '            <span class="contacts-list-msg">'+chatObj.f_message+'</span>';
		chat += '        </div>';
		chat += '    </a>';
		chat += '</li>';

		return chat;
	}
	function discussionMessage(messageObj, owned) {
		var nameClass = owned ? 'pull-left' : 'pull-right';
		var dateClass = owned ? 'pull-right' : 'pull-left';
		var sideClass = owned ? '' : 'right';
		var floatStyle = !owned ? 'float:right;' : 'float: left;';
		var message = '';
		message += '<div class="direct-chat-msg '+sideClass+'">';
		message += '    <div class="direct-chat-info clearfix">';
		message += '        <span class="direct-chat-name '+nameClass+'">'+messageObj.r_sender.f_login+'</span>';
		message += '        <span class="direct-chat-timestamp '+dateClass+'">'+messageObj.createdAt+'</span>';
		message += '    </div>';
		message += '    <div class="direct-chat-text" style="word-wrap:break-word;width:50%;'+floatStyle+'">';
		message += '        '+messageObj.f_message;
		message += '    </div>';
		message += '</div>';

		return message;
	}
}

// Discussion handle
{
	var chats = [], channels = [];
	var discussion;
	function selectChat(id_chat, id_contact) {
		if (discussion && discussion.id == id_chat)
			return;
		$("#discussion").html('');
		if (!chats[id_chat])
			chats[id_chat] = {limit: 5, offset: 0, messages: []};
		// 'chat-load' answered through 'chat-messages'
		socket.emit('chat-load', {id_chat: id_chat, limit: chats[id_chat].limit, offset: chats[id_chat].offset});
		discussion = {id: id_chat, id_contact: id_contact, messages: chats[id_chat].messages, type: 'chat'};
	}
	function selectChannel(id) {
		$("#discussion").html('');
		if (!channels[id]) {
			channels[id] = {limit: 5, offset: 0, messages: []};
			// 'channel-load' answers with 'channel-messages'
			socket.emit('channel-load', {id: id, limit: channels[id].limit, offset: channels[id].offset});
		}
		discussion = {id: id, id_contact: id_contact, messages: channels[id].messages, type: 'channel'};
	}

	function loadPreviousChatMessage(id_chat) {
		chats[id_chat].offset = chats[id_chat].messages.length;
		socket.emit('chat-load', {id_chat: id_chat, limit: chats[id_chat].limit, offset: chats[id_chat].offset});
	}
}

// UI
{
	function createContactList(data) {
		if (!data)
			return;
		$("#channelsList").html('');
		$("#chatsList").html('');
		for (var i = 0; i < data.r_user_channel.length; i++)
			$("#channelsList").append(contactChannel(data.r_user_channel[i]));
		for (var i = 0; i < data.r_chat.length; i++)
			$("#chatsList").append(contactChat(data.r_chat[i]));
	}

	function prependToDiscussion(data) {
		if (typeof data.messages === 'undefined')
			data.messages = [data];
		for (var i = 0; i < data.messages.length; i++) {
			var msgTemplate = discussionMessage(data.messages[i], data.messages[i].r_sender.id == discussion.id_contact);
			$("#discussion").prepend(msgTemplate);
		}
	}

	function appendToDiscussion(data) {
		// If message is not for current discussion, return
		if (!(discussion.id == data.f_id_user_sender || discussion.id == data.f_id_user_receiver))
			return;
		var msgTemplate = discussionMessage(data, data.r_sender.id == discussion.id_contact);
		$("#discussion").append(msgTemplate);
		scroll(true);
	}

	function scroll(goDown) {
		if (goDown)
			$("#discussion").animate({scrollTop: $("#discussion").prop('scrollHeight')}, 500);
		else
			$("#discussion").animate({scrollTop: 0}, 500);
	}
}

$(function() {
	// Display contact by default
	setTimeout(function() {
		$("#contactsBtn").click();
	}, 100);

	// Socket input bidings
	{
		socket.on('initialize', createContactList);

		socket.on('chat-messages', function(data) {
			var baseMessagesLength = chats[data.id_chat].messages.length;

			chats[data.id_chat].messages = data.messages.concat(chats[data.id_chat].messages);
			prependToDiscussion(data);
			if (baseMessagesLength == 0)
				scroll(true);
		});

		socket.on('chat-message', function(data) {
			appendToDiscussion(data);
		});

		socket.on('chat-notifications', function(data) {
		});
	}

	// UI bindings
	{
		// Send message
		$("#messageForm").submit(function() {
			socket.emit('chat-message', {message: $("input[name='chat-message']").val(), id_chat: discussion.id, id_contact: discussion.id_contact});
			$("input[name='chat-message']").val('');
			return false;
		});

		// Channel creation bindings
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
			socket.emit('channel-create', {name: $("#createChannelName").val()});
			$("#createChannelBtn").click();
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
			$("#createChatBtn").click();
		});

		// Contact list bindings
		$(document).delegate("#channelsList li, #chatsList li", 'click', function() {
			if ($(this).parent().attr('id') == 'channelsList')
				selectChannel($(this).data('id-chat'), $(this).data('id-contact'));
			else if ($(this).parent().attr('id') == 'chatsList')
				selectChat($(this).data('id-chat'), $(this).data('id-contact'));
			$("#contactsBtn").click();
		});

		// Discussion scrolled to max top, load previous messages
		$("#discussion").scroll(function() {
			if ($(this).scrollTop() == 0)
				loadPreviousChatMessage(discussion.id);
		});
	}
});