'use strict';

var slack = require('slack');
var slack_conf = require('../config/slack');
var moment = require("moment");

module.exports = function() {

	var cpt = 0;
	var today = moment();

	function done(listChannel) {
		cpt++;
		if (cpt == listChannel.channels.length) {
			for (var i = 0; i < listChannel.channels.length; i++) {
				var dateCreated = moment.unix(listChannel.channels[i].created);
				var diff = today.diff(dateCreated, "days");
				if (listChannel.channels[i].name.substring(0, 4) == "user" && !listChannel.channels[i].is_archived && diff >= 3) {
					slack.channels.archive({
						token: slack_conf.SLACK_API_USER_TOKEN,
						channel: listChannel.channels[i].id
					}, function(err, archiveChannel) {
						console.log("--ARCHIVE--");
						if (err) {
							console.error(err);
						}
					});
				}
			}
			console.log("Terminé !");
		}
	}

	slack.channels.list({
		token: slack_conf.SLACK_API_USER_TOKEN
	}, function(err, listChannel) {
		slack.users.list({
			token: slack_conf.SLACK_API_USER_TOKEN
		}, function(err, listUser) {
			for (var i = 0; i < listChannel.channels.length; i++) {
				var ibis = i;
				var dateCreated = moment.unix(listChannel.channels[i].created);
				var diff = today.diff(dateCreated, "days");
				if (listChannel.channels[i].name.substring(0, 4) == "user" && !listChannel.channels[i].is_archived && diff >= 3) {
					slack.channels.leave({
						token: slack_conf.SLACK_API_USER_TOKEN,
						channel: listChannel.channels[i].id
					}, function(err, leaveChannel) {
						console.log("--LEAVE--");
						if (err) {
							console.error(err);
						}

						var cpt2 = 0;

						function done2(listUser, listChannel) {
							cpt2++;
							if (cpt2 == listUser.members.length) {
								done(listChannel);
							}
						}

						for (var j = 0; j < listUser.members.length; j++) {
							slack.channels.kick({
								token: slack_conf.SLACK_API_USER_TOKEN,
								channel: listChannel.channels[ibis].id,
								user: listUser.members[j].id
							}, function(err, kickUser) {
								console.log("--KICK--");
								if (err) {
									console.error(err);
								}
								done2(listUser, listChannel);
							});
						}
					});
				} else {
					done(listChannel);
				}
			}
		});
	});


};