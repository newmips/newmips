function navigate(){
  var url = window.document.getElementById('dynamic_select').value; // get selected value
  if (url) { // require a URL
    window.location = url; // redirect
  }
  return false;
}
