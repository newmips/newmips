/* Mattermost chat */
/* v1 */
(function($) {

    var sending = false;

    var methods = {
        init: function(cb){
            $.ajax({
                url: "/support_chat/init",
                method: "POST",
                context: this,
                timeout: 50000,
                success: function(data) {
                    cb();
                },
                error:function(err){
                    console.log(performance.navigation.type);
                    toastr.error("Sorry, an error occured. Please check your mattermost configuration.");
                    console.log(err);
                    $('.slackchat .slack-chat-close').trigger("click");
                    cb();
                }
            });
        },
        postMessage: function() {

            var message = "";

            // Do not send the message if the value is empty
            if ($('.slack-new-message').val().trim() === '') return false;

            if(sending){
                toastr.error("A message is already being sent, please wait.");
                return false;
            }

            message = $('.slack-new-message').val();
            $('.slack-new-message').val('');

            $('.slack-new-message').prop('disabled', true).prop('placeholder', 'Envoi en cours ...');

            sending = true;
            $.ajax({
                url: "/support_chat/send",
                method: "POST",
                context: this,
                data: {
                    text: message
                },
                timeout: 50000,
                success: function(post) {

                    var messageText = methods.formatMessage(message.trim());
                    var userId = post.user_id;
                    var userName = post.login;
                    var userImg = "/img/avatar.png";
                    var html = "";
                    html += "<div class='message-item' id='"+post.id+"'>";
                    if (userImg !== '')
                        html += "<div class='userImg'><img src='" + userImg + "' /></div>";
                    html += "<div class='msgBox'>"
                    html += "<div class='username main'>" + userName + "</div>";
                    html += "<div class='message'>" + messageText + "</div>";
                    html += "<div class='timestamp'>" + moment(post.create_at).fromNow() + "</div>";
                    html += "</div>";
                    html += "</div>";

                    $('.slack-message-box').append(html);

                    $('.slack-message-box').stop().animate({
                        scrollTop: $(".slack-message-box")[0].scrollHeight
                    }, 800);

                    $('.slack-new-message').prop('disabled', false).prop('placeholder', 'Ecrire un message ...');

                    sending = false;
                },
                error:function(err){
                    sending = false;
                    console.log(performance.navigation.type);
                    toastr.error("Sorry, an error occured while sending a message. Please check your mattermost configuration.");
                    console.log(err);
                }
            });
        },
        watchChat: function($elem) {

            $('.slack-new-message').prop('disabled', false).prop('placeholder', 'Écrire un message ...');

            $.ajax({
                url: '/support_chat/watch',
                type: "POST",
                dataType: 'json',
                timeout: 50000,
                success: function(answer) {
                    var history = answer.posts;
                    var user = answer.user;

                    history.order = history.order.reverse();
                    var message, post, html = "";
                    for (var i = 0; i < history.order.length; i++) {
                        post = history.posts[history.order[i]];
                        message = post.message;

                        if($(".message-item#"+post.id).length == 0 && post.type == ""){
                            messageText = methods.formatMessage(message.trim());
                            var userId = post.user_id;
                            if(post.user_id == user.id){
                                var indexofsplit = messageText.indexOf(":");
                                var userName = messageText.split(":")[0];
                                messageText = messageText.substring(indexofsplit+2, messageText.length);
                                var userImg = "/img/avatar.png";
                            } else {
                                var userName = "Newmips";
                                var userImg = "/img/FAVICON-GRAND-01.png";
                            }

                            html += "<div class='message-item' id='"+post.id+"'>";
                            if (userImg !== '')
                                html += "<div class='userImg'><img src='" + userImg + "' /></div>";
                            html += "<div class='msgBox'>"
                            html += "<div class='username main'>" + userName + "</div>";
                            html += "<div class='message'>" + messageText + "</div>";
                            html += "<div class='timestamp'>" + moment(post.create_at).fromNow() + "</div>";
                            html += "</div>";
                            html += "</div>";
                        }
                    }

                    $('.slack-message-box').append(html);

                    $('.slack-message-box').stop().animate({
                        scrollTop: $(".slack-message-box")[0].scrollHeight
                    }, 800);
                },
                error:function(err){
                    console.log(performance.navigation.type);
                    toastr.error("Sorry, an error occured while retrieving channel history. Please check your mattermost configuration.");
                    console.log(err);
                }
            });
        },
        formatMessage: function(text) {

            //hack for converting to html entities
            var formattedText = $("<textarea/>").html(text).text();

            return decodeURI(formattedText)
                // <URL>
                .replace(/<(.+?)(\|(.*?))?>/g, function(match, url, _text, text) {
                    if (!text) text = url;
                    return $('<a>')
                        .attr({
                            href: url,
                            target: '_blank'
                        })
                        .text(text)
                        .prop('outerHTML');
                })
                // `code block`
                .replace(/(?:[`]{3,3})(?:\n)?([a-zA-Z0-9<>\\\.\*\n\r\-_ ]+)(?:\n)?(?:[`]{3,3})/g, function(match, code) {
                    return $('<code>').text(code).prop('outerHTML');
                })
                // `code`
                .replace(/(?:[`]{1,1})([a-zA-Z0-9<>\\\.\*\n\r\-_ ]+)(?:[`]{1,1})/g, function(match, code) {
                    return $('<code>').text(code).prop('outerHTML');
                })
                // new line character
                .replace(/\n/g, "<br />");
        }
    };

    $.fn.mattermostChat = function(options) {

        var options = {
            header: "Besoin d'aide ? Discutez avec nos équipes de support.",
            loading_placeholder: "Connexion en cours ...",
            queryInterval: 2500
        };

        var html = '<div class="slackchat slack-chat-box">';
            html += '   <div class="slack-chat-header">';
            html += '       <button class="close slack-chat-close">&times;</button>';
            html += options.header;
            html += "       <div class='presence'><div class='presence-icon'>&#8226;</div><div class='presence-text'></div></div>";
            html += '   </div>';
            html += '   <div class="slack-message-box">';
            html += '   </div>';
            html += '   <div class="send-area">';
            html += '       <textarea class="form-control slack-new-message" disabled="disabled" type="text" placeholder="'+options.loading_placeholder+'"></textarea>';
            html += '       <div class="slack-post-message"><i class="fa fa-fw fa-chevron-right"></i></div>';
            html += '   </div>';
            html += '</div>';

        $('body').append(html);

        // TODO - Check presence
        $('.slackchat .presence').addClass('active');
        $('.slackchat .presence .presence-text').text('Available');

        // Open the chatbox
        $(this).on('click', function() {
            $('.slack-chat-box').fadeIn();
            $('.slack-chat-box').addClass('open');

            methods.init(function(){
                ! function watchMattermostChannel() {
                    if ($('.slack-chat-box').hasClass('open') && !sending) {
                        methods.watchChat();
                        setTimeout(watchMattermostChannel, options.queryInterval);
                    } else {
                        setTimeout(watchMattermostChannel, options.queryInterval);
                    }
                }();
            });

        });

        // Focus
        $('.slackchat .slack-new-message').focus();

        // Close the chat box
        $('.slackchat .slack-chat-close').on('click', function() {
            $('.slack-chat-box').fadeOut();
            $('.slack-chat-box').removeClass('open');
        });

        // Post message to slack
        $('.slackchat .slack-post-message').click(function() {
            methods.postMessage();
        });

        // Bind the enter key to the text box
        $('.slackchat .slack-new-message').keyup(function(e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if (code == 13) {
                methods.postMessage();
                e.preventDefault();
            }
        });
    };
}(jQuery));