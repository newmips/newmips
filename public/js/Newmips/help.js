/*!
 * Newmips v2.5
 * Copyright 2016
 * Licensed under GPLV3.0 https://www.gnu.org/licenses/gpl.html
 */

function toggleHelp() {
    if ($(".podbar-content").is(":visible"))
        $(".podbar-content").hide();
    else
        $(".podbar-content").slideDown();
}

$(function() {
    $(document).keypress(function(e) {
        var tag = e.target.tagName.toLowerCase();
        // 72 = h, 104 = H, tag == input -> help not wanted
        if ((e.which != 72 && e.which != 104) || tag == 'input')
            return;

        toggleHelp();
    });

    $(".helpButton").click(function() {
        toggleHelp();
    });
})
