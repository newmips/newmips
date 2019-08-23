var str_language;
if (lang_user == "fr-FR") {
	str_language = {
		"processing":     "Traitement en cours...",
		"search":         "Rechercher&nbsp;:&nbsp;",
		"lengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments",
		"info":           "Affichage de l'&eacute;l&eacute;ment _START_ &agrave; _END_ sur _TOTAL_ &eacute;l&eacute;ments",
		"infoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
		"infoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
		"infoPostFix":    "",
		"loadingRecords": "Chargement en cours...",
		"zeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
		"emptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
		"paginate": {
			"first":      "Premier",
			"previous":   "Pr&eacute;c&eacute;dent",
			"next":       "Suivant",
			"last":       "Dernier"
		},
		"aria": {
			"sortAscending":  ": activer pour trier la colonne par ordre croissant",
			"sortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
		}
	};
} else {
	str_language = {
		"processing":     "Processing...",
		"search":         "Search&nbsp;:&nbsp;",
		"lengthMenu":     "Display _MENU_ records",
		"info":           "Displaying records _START_ to _END_ on _TOTAL_ records",
		"infoEmpty":      "No record to display",
		"infoFiltered":   "(filter on _MAX_ records total)",
		"infoPostFix":    "",
		"loadingRecords": "Loading...",
		"zeroRecords":    "No record to display",
		"emptyTable":     "No data available in this array",
		"paginate": {
			"first":      "First",
			"previous":   "Previous",
			"next":       "Next",
			"last":       "Last"
		},
		"aria": {
			"sortAscending":  ": click to sort column by ascending order",
			"sortDescending": ": click to sort column by descending order"
		}
	};
}

// tables needs to be global
var tables = [];

function simpleTable(table) {
	var dom = table.data('no-dom') ? '' : 'lBfrtip';
	var options = {
		"responsive": true,
		"language": str_language,
		"bLengthChange": true,
		"iDisplayLength": 50,
		"aLengthMenu": [[50, 200, 500, -1], [50, 200, 500, "Tous"]],
		"bAutoWidth": false,
		"dom": dom,
		"buttons": [
			{
				extend:    'print',
				text:      '<i class="fa fa-print"></i>',
				titleAttr: 'Print',
				exportOptions: {
					columns: ':visible'
				}
			},
			{
				extend:    'copyHtml5',
				text:      '<i class="fa fa-files-o"></i>',
				titleAttr: 'Copy',
				exportOptions: {
					columns: ':visible'
				}
			},
			{
				extend:    'csvHtml5',
				text:      'CSV',
				titleAttr: 'CSV',
				exportOptions: {
					columns: ':visible'
				}
			},
			{
				extend:    'excelHtml5',
				text:      'Excel',
				titleAttr: 'Excel',
				exportOptions: {
					columns: ':visible'
				}
			}, {
                text: '<i class="fa fa-arrow-right"></i>',
                titleAttr: 'Scroll right',
                action: function ( e, dt, node, config ) {
                   table.parents(".dataTables_wrapper").animate({scrollLeft: table.width()}, 800);
                }
            }
		]
	}

	if(typeof table.data("custom-order") !== "undefined" && typeof table.data("custom-order-index") !== "undefined")
		options.order = [[table.data("custom-order-index"), table.data("custom-order")]];
	else
		options.order = [];
	tables[table.attr('id')] = table.DataTable(options);

	table.find("thead.main th").each(function(idx){
        if($(this).data("hidden") == 1){
            // Hide hidden column
            $(this).hide();
            $("td[data-field='"+$(this).data("field")+"']").hide();
        } else if($(this).text() == ""){
            // Remove unused action button th & td
            if($("td").eq(idx).text() == ""){
                $(this).remove();
                $(".dataTable tbody tr").each(function(){
                    $(this).find("td:eq("+idx+")").remove();
                });
            }
        }
    });

    /* --- TD value formatting --- */

    /* Display color td with fa classes instead of color value */
    table.find("td[data-type=color]").each(function () {
        if ($(this).find('i').length > 0)
            return;
        var color = $(this).text();
        $(this).html('<i class="fa fa-lg fa-circle" style="color:' + color + '"></i>');
    });

    table.find("td[data-type='date']").each(function() {
        if (typeof $(this).html()  !== "undefined" && $(this).html() != "" && $(this).html() != "Invalid date" && $(this).html() != "Invalid Date") {
            if($(this).html().indexOf("/") == -1 && $(this).html().indexOf("-") == -1){
                if (lang_user == "fr-FR")
                    $(this).html(moment(new Date($(this).html())).format("DD/MM/YYYY"));
                else
                    $(this).html(moment(new Date($(this).html())).format("YYYY-MM-DD"));
            }
        } else {
            $(this).html("");
        }
    });

    table.find("td[data-type='datetime']").each(function() {
        if (typeof $(this).html()  !== "undefined" && $(this).html() != "" && $(this).html() != "Invalid date" && $(this).html() != "Invalid Date") {
            if($(this).html().indexOf("/") == -1 && $(this).html().indexOf("-") == -1){
                if (lang_user == "fr-FR")
                    $(this).html(moment(new Date($(this).html())).format("DD/MM/YYYY HH:mm"));
                else
                    $(this).html(moment(new Date($(this).html())).format("YYYY-MM-DD HH:mm"));
            }
        } else {
            $(this).html("");
        }
    });

    /* Show boolean with a square in datalist */
    table.find('td[data-type="boolean"]').each(function() {
        var val = $(this).html();
        if (val == 'true' || val == '1')
            $(this).html('<i class="fa fa-check-square-o fa-lg"></i>');
        else
            $(this).html('<i class="fa fa-square-o fa-lg"></i>');
    });

    table.find('td[data-type="status"]').each(function() {
        var statusName = $(this).text();
        var statusColor = $(this).data("color");
        $(this).html('<span class="badge" style="background: '+statusColor+';">'+statusName+'</span>');
    });

    table.find('td[data-type="currency"]').each(function() {
        $(this).html('<span data-type="currency">' + currencyFormat(parseFloat($(this).text())) + '</span>');
    });

    table.find('td[data-type="email"]').each(function() {
        var email = $(this).text();
        if(email != null && email != '')
            $(this).html('<a href="mailto:' + email + '">' + email + '</a>');
    });

    table.find('td[data-type="tel"]').each(function() {
        var tel = $(this).text();
        if(tel != null && tel != '')
            $(this).html('<a href="tel:' + tel + '">' + tel + '</a>');
    });

    table.find('td[data-type="url"]').each(function() {
        var urlVal = $(this).text();
        if(urlVal != null && urlVal != '')
            $(this).html('<a target="_blank" href="'+urlVal+'">'+urlVal+'</a>');
    });

    table.find('td[data-type="time"]').each(function() {
        var time = $(this).text();
        if(time != null && time != '')
            $(this).html(time.substring(0, time.length - 3));
    });

    table.find('td[data-type="password"]').each(function() {
        $(this).html('●●●●●●●●●');
    });
}

$(document).ready(function() {
	// Init DataTable
	$(".dataTable").each(function() {
		try{
			simpleTable($(this));
		} catch(e){
			console.log(e)
		}
		$(this).find("thead.main th").each(function(idx){
			if($(this).data("hidden") == 1){
				// Hide hidden column
				$(this).hide();
				$("td[data-field='"+$(this).data("field")+"']").hide();
			} else if($(this).text() == ""){
				// Remove unused action button th & td
				if($("td").eq(idx).text() == ""){
					$(this).remove();
					$(".dataTable tbody tr").each(function(){
						$(this).find("td:eq("+idx+")").remove();
					});
				}
			}
		});
	});
});
