/*!
 * Newmips v2.5
 * Copyright 2016
 * Licensed under GPLV3.0 https://www.gnu.org/licenses/gpl.html
 */

var tmpHtml = "";
var showText = function(target, message, index, interval) {
    if (index < message.length) {
    	var msg = message[index++];
    	if(msg == "<")
    		tmpHtml = msg
    	else if(tmpHtml.length > 0)
    		if(msg == ">"){
    			tmpHtml += msg;
    			$(target).append(tmpHtml);
    			tmpHtml = "";
    		}
    		else{
    			tmpHtml += msg;
    		}
    	else
        	$(target).append(msg);
        setTimeout(function() {
            showText(target, message, index, interval);
        }, interval);
    } else{
    	$(target).empty();
    	$(target).append(message);
    }
}

$(".dynamic-writing").each(function(){
	$(this).css("display", "block");
	if($(this).parents(".item").next().next(".item").length == 0){
	    var text = $(this).html();
	    $(this).html("");
	    showText(this, text, 0, 10);
	}
});

$(document).ready(function(){
	$(document).on("click", "b.click-instruction", function(){
		$("#instruction").val($(this).text());
	});
});
