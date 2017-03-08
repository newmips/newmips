var str_language;
if (lang_user == "fr-FR") {
	str_language = {
		"processing":     "Traitement en cours...",
		"search":         "Rechercher&nbsp;:",
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
}
else {
	str_language = {
		"processing":     "Processing...",
		"search":         "Search&nbsp;:",
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
$(document).ready(function() {
	// Init DataTable
	$(".dataTable").each(function() {
		tables[$(this).attr('id')] = $(this).DataTable( {
			"responsive": true,
			"language": str_language,
			"bLengthChange": true,
			"iDisplayLength": 50,
			"aLengthMenu": [[50, 200, 500, -1], [50, 200, 500, "Tous"]],
			"bAutoWidth": false,
			"dom": 'lBfrtip',
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
			}
			]
		});
	});
});
