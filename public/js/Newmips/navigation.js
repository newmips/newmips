/*!
 * Newmips v2.9
 * Copyright 2016
 * Licensed under GPLV3.0 https://www.gnu.org/licenses/gpl.html
 */

function navigate() {
    var url = window.document.getElementById('dynamic_select').value;
    if (url) {
        window.location = url;
    }
    return false;
}