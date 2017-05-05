$(".apiOn, .apiOff").click(function() {
	var enable;
	if ($(this).hasClass('apiOn')) {
		enable = true;
	}
	else {
		enable = false;
	}
	$.ajax({
		url: '/access_settings/enable_disable_api',
		method: 'post',
		data: {enable: enable},
		success:function() {
			if (enable) {
				$(".apiOn").removeClass('btn-default').addClass('btn-primary');
				$(".apiOff").addClass('btn-default').removeClass('btn-primary');
				toastr.success('API enabled');
			}
			else {
				$(".apiOn").addClass('btn-default').removeClass('btn-primary');
				$(".apiOff").removeClass('btn-default').addClass('btn-primary');
				toastr.success('API disabled');
			}
		}
	});
});

$("tbody").find("input").on('ifChanged',function(event) {
	var self = event.target;
	var tdIndex = $(self).parents('tr').find('td').index($(self).parents('td'));
	var tableBody = $(self).parents('tbody');

	/* On module uncheck, uncheck all related entities */
	if ($(self).attr('name').indexOf('module') == 0 && !$(self).is(":checked")) {
		var current = $(self).parents('tr').next('tr');
		var trIndex = $(self).parents('tbody').find('tr').index(current);

		while (trIndex < tableBody.find('tr').length && current.find('td').eq(tdIndex).find('input').eq(0).attr('name').indexOf('module') != 0) {
			var newTd = current.find('td').eq(tdIndex);
			newTd.find('input').eq(0).iCheck('uncheck');
			current = tableBody.find('tr').eq(trIndex+=1);
		}
	}
	/* On entity check, check parent module */
	else if ($(self).attr('name').indexOf('entity') == 0 && $(self).is(":checked")) {
		var current = $(self).parents('tr');
		var trIndex = $(self).parents('tbody').find('tr').index(current);

		while (current.find('td').eq(tdIndex).find('input').eq(0).attr('name').indexOf('module') != 0) {
			current = tableBody.find('tr').eq(trIndex-=1);
			if (current.hasClass('home-row'))
				return;
		}
		if (current.find('td').eq(tdIndex).find('input').eq(0).attr('name').indexOf('module.home') != 0) {
			current.find('td').eq(tdIndex).find('input').eq(0).iCheck('check');
		}
	}
});