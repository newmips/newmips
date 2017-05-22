var socket = io();

$(function() {
	socket.on('chat-message', function(data) {
		console.log("RECEIVED MESSAGE");
		console.log(data);
	});

	socket.on('chat-notifications', function(data) {
		console.log("NOTIFICATIONS");
		console.log(data);
	})
	socket.emit('chat-message', {receiver: 2, message: 'salut lol :D'});
});