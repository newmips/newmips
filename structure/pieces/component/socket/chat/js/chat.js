var socket = io();

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
	chat += '<li data-id="'+chatObj.r_sender.id+'" data-type="chat">';
	chat += '    <a href="#">';
	chat += '        <img class="contacts-list-img">';
	chat += '        <div class="contacts-list-info">';
	chat += '            <span class="contacts-list-name">';
	chat += '                '+chatObj.r_sender.f_login;
	chat += '                <small class="contacts-list-date pull-right">'+chatObj.updatedAt+'</small>';
	chat += '            </span>';
	chat += '            <span class="contacts-list-msg">'+chatObj.f_message+'</span>';
	chat += '        </div>';
	chat += '    </a>';
	chat += '</li>';

	return chat;
}

function createContactList(data) {
	if (!data)
		return;
	for (var i = 0; i < data.channels.length; i++)
		$("#channelsList").append(contactChannel(data.channels[i]));
	for (var i = 0; i < data.chats.length; i++)
		$("#chatsList").append(contactChat(data.chats[i]));
}

$(function() {
	// Socket inputs
	{
		socket.on('initialize', function(data) {
			createContactList(data);
		});

		socket.on('chat-message', function(data) {
			//
		});

		socket.on('chat-notifications', function(data) {
		});
	}

	// UI bindings
	{
		// Channel creation bindings
		{
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
				socket.emit('create-channel', {name: $("#createChannelName").val()});
			});
		}

		// Contact list bindings
		{
			$(document).delegate("#channelsList li, #chatsList li", 'click', function() {
				if ($(this).parent().attr('id') == 'channelsList')
					console.log('load channel message of '+$(this).data('id'));
				else if ($(this).parent().attr('id') == 'chatsList')
					console.log('load chat message of '+$(this).data('id'));
				$("#contactsBtn").click();
			})
		}
	}
});