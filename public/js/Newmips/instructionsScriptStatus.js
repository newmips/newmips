function fetchStatus() {
	$.ajax({
		url: '/instruction_script/status',
		success: function(data) {
			$("#instructionCount").text('Instructions : '+data.doneInstruction+' / '+data.totalInstruction);

			percent  = (Number(data.doneInstruction)*100 / Number(data.totalInstruction)).toFixed(0);
			str = percent + "%";
			$("#progressbar").width(str);

			if (data.text != '')
				$("#answers").html(data.text+'\n\n'+$("#answers").html());
			if (!data.over)
				setTimeout(fetchStatus, 50);
			else {
				$("#goTo").attr('href', $("#goTo").attr('href')+data.id_application);
				$("#goTo").show();
				$("#scriptSubmit").prop('disabled', false);
				$("#progressbarcontent").hide();
			}
		},
		error: function() {
			$("#scriptSubmit").prop('disabled', false);
			$("#progressbarcontent").hide();
		}
	})
}

$(function() {
	var lang = $("#lang").val();
	$("#instructionsScript").submit(function() {
		$("#goTo").hide();
		var formData = new FormData($(this)[0]);
		var filename = $(this).find('input').val();

		$.ajax({
			url: $(this).attr('action'),
			method: 'post',
			contentType: false,
			processData: false,
			data: formData,
			success: function() {
				$("#scriptSubmit").prop('disabled', true);
				$("#progressbarcontent").show();
				if (lang == 'en')
					$("#filename").text('Executing instructions from file "'+filename+'"');
				else if (lang == 'fr')
					$("#filename").text('Executions des instructions du fichier "'+filename+'"');
				setTimeout(fetchStatus, 50);
			}
		})
		return false;
	})
})
