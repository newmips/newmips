$(document).ready(function(){

	$(".selectCategoryColor").next("span").find(".select2-selection").css("background-color", "#CCCCCC");

	$(".selectCategoryColor").on("change", function(){
		$(this).next("span").find(".select2-selection").css("background-color", $(this).find("option:selected").attr("data-backgroundcolor"));
	});

	$(document).on("click", "#add-new-event", function(){

		var eventTitle = $("#new-event-title").val();

		if(eventTitle != ""){
			var categoryID = $("#selectCategorySide").val();
			if(categoryID == "")
				categoryID = 0;
			var categoryColor = $("#selectCategorySide option:selected").attr("data-backgroundcolor");

			var generateID = moment();
			var eventObj = '{"title": "'+eventTitle+'", "idCategory":'+categoryID+', "stick": "true","backgroundColor": "'+categoryColor+'", "borderColor": "'+categoryColor+'"}';

			var htmlToAppend = "<div data-event='"+eventObj+"' class='draggable pendingEvent external-event' id='"+generateID+"' style='z-index: 100;background-color: "+categoryColor+";'>"+eventTitle+"<i style='margin-top: 3px;' class='fa fa-times pull-right'></i></div>";

			$("#pengingEventList").append(htmlToAppend);
			$("#new-event-title").val("");

			$("#"+generateID).draggable({
				revert: true,
				revertDuration: 0
			});
		} else {
			toastr.warning(FILL_TITLE_AGENDA);
		}
	});

	$(document).on("click", ".external-event i.fa.fa-times", function(){
		$(this).parent("div").remove();
	});
});