function formatDate(value) {
    if (lang_user == "fr-FR")
        return moment(new Date(value)).format("DD/MM/YYYY");
    else
        return moment(new Date(value)).format("YYYY-MM-DD");
}

socket.on('notification', function(notification) {
	var notifHtml = '';
    notifHtml += '<li>';
    notifHtml += '    <ul class="menu">';
    notifHtml += '        <li>';
    notifHtml += '            <a href="'+notification.f_url+'">';
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

    $("#notifications li:first").after(notifHtml);
});