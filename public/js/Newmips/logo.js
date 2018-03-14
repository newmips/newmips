/*!
 * Newmips v2.5
 * Copyright 2016
 * Licensed under GPLV3.0 https://www.gnu.org/licenses/gpl.html
 */

$(function() {
	// Hide 404 images
	$('#logo').error(function(){
		$(this).hide();
		$("#deleteLogo").hide();
	});

	// Delete logo file
	$('#deleteLogo').click(function() {
		// No logo to delete
		if (!$("#logo").is(':visible'))	
			return false;
		var data = {
			id_information_system: $("#deleteLogo").data('id-info-sys'),
			name_information_system: $("#deleteLogo").data('name-info-sys')
		}	
		$.ajax({
			url: '/information_system/deleteLogo',
			method: 'post',
			data: data,
			success: function() {
				$("#logo").slideUp();
				$("#deleteLogo").hide();
			}
		})

		return false;
	});
});
