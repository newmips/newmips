/*!
 * Newmips v2.5
 * Copyright 2016
 * Licensed under GPLV3.0 https://www.gnu.org/licenses/gpl.html
 */

$(function(){
	$("i.fa").click(function() {
		$("i.fa.btn-primary").removeClass('btn-primary').addClass('btn-default');
		$(this).removeClass('btn-default').addClass('btn-primary');
		$("#icon_data_entity").val($(this).data('fa-class'));
	});	
});
