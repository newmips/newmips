$(document).ready(function(){

	$("#selectCategory .select2-selection").css("background-color", "#CCCCCC");

	$("#selectCategory select").on("change", function(){
		$("#selectCategory .select2-selection").css("background-color", $("#selectCategory select option:selected").attr("data-backgroundcolor"));
	});

	$(document).on("click", "#add-new-event", function(){

		var eventTitle = $("#new-event-title").val();

		if(eventTitle != ""){
			var categoryID = $("#selectCategory select").val();
			if(categoryID == "")
				categoryID = 0;
			var categoryColor = $("#selectCategory select option:selected").attr("data-backgroundcolor");

			var generateID = moment();
			var eventObj = '{"title": "'+eventTitle+'", "idCategory":'+categoryID+', "stick": "true","backgroundColor": "'+categoryColor+'", "borderColor": "'+categoryColor+'"}';

			var htmlToAppend = "<div data-event='"+eventObj+"' class='draggable pendingEvent external-event' id='"+generateID+"' style='z-index: 99999;background-color: "+categoryColor+";'>"+eventTitle+"<i style='margin-top: 3px;' class='fa fa-times pull-right'></i></div>";

			$("#pengingEventList").append(htmlToAppend);
			$("#new-event-title").val("");

			$("#"+generateID).draggable({
				revert: true,
				revertDuration: 0
			});
		} else {
			toastr.warning("Please fill the title input.");
		}
	});

	$(document).on("click", ".external-event i.fa.fa-times", function(){
		$(this).parent("div").remove();
	});
});