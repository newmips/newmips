/*!
 * Newmips v2.5
 * Copyright 2016
 * Licensed under GPLV3.0 https://www.gnu.org/licenses/gpl.html
 */

function navigate(){
  var url = window.document.getElementById('dynamic_select').value; // get selected value
  if (url) { // require a URL
    window.location = url; // redirect
  }
  return false;
}
