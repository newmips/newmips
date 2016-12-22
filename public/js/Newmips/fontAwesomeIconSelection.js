$(function(){
	$("i.fa").click(function() {
		$("i.fa.btn-primary").removeClass('btn-primary').addClass('btn-default');
		$(this).removeClass('btn-default').addClass('btn-primary');
		$("#icon_data_entity").val($(this).data('fa-class'));
	});	
});