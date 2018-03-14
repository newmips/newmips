// Format date depending on user language
function formatDate(value) {
    if (lang_user == "fr-FR")
        return moment(new Date(value)).format("DD/MM/YYYY");
    else
        return moment(new Date(value)).format("YYYY-MM-DD");
}

// Prepend notification to notification list
function displayNotification(notification, isNew) {
    var notifHtml = '';
    notifHtml += '<li class="notification">';
    notifHtml += '    <ul class="menu">';
    notifHtml += '        <li>';
    notifHtml += '            <a href="/notification/read/'+notification.id+'">';
    notifHtml += '                <div class="pull-left">';
    notifHtml += '                    <i class="fa '+notification.f_icon+' fa-2x" style="color: '+notification.f_color+';"></i>';
    notifHtml += '                </div>';
    notifHtml += '                <h4>';
    notifHtml += '                    '+notification.f_title;
    notifHtml += '                    <small><i class="fa fa-clock-o"></i>&nbsp;'+formatDate(notification.createdAt)+'</small>';
    notifHtml += '                </h4>';
    notifHtml += '                <p>'+notification.f_description+'</p>';
    notifHtml += '            </a>';
    notifHtml += '        </li>';
    notifHtml += '    </ul>';
    notifHtml += '</li>';

    var currentNotifCount = 0;
    if ($("#notification-total").text() != "" && !isNaN($("#notification-total").text()))
        currentNotifCount = parseInt($("#notification-total").text());

    if (isNew !== false)
        $("#notification-total, #notification-header").text(++currentNotifCount);
    $("#notification-wrapper").prepend(notifHtml);
}

// Receive notification from server
socket.on('notification', displayNotification);

$(function() {

    // Load new notifications on scroll
    var lastNotifReached = false;
    $("#notification-wrapper").scroll(function() {
        var wrapper = $(this);

        // Scrollbar reached bottom
        if (wrapper[0].scrollHeight - wrapper.scrollTop() == wrapper.height()) {
            var notificationOffset = wrapper.children('li').length;

            // Stop ajax calls if there is no more notification to load
            if (lastNotifReached)
                return;
            $.ajax({
                url: '/notification/load/'+notificationOffset,
                success: function(notifications) {
                    if (notifications.length == 0)
                        lastNotifReached = true;
                    for (var i = 0; i < notifications.length; i++)
                        displayNotification(notifications[i], false);
                }
            });
        }
    });

    $(".delete-all").click(function() {
        $.ajax({
            url: '/notification/deleteAll',
            success:function() {
                $(".notification").remove();
                $("#notification-header").text(0);
                $("#notification-total").text("");
            }
        });
    });
});