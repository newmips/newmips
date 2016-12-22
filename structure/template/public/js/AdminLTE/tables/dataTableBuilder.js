// =========================
// DataTableBuilder "HOW TO"
// =========================
//
// 1 : Configuration de la table
// =============================
// - L'element `table` DOIT avoir l'ID `example1`
// - La table DOIT avoir un attribut `data-url` definissant la route que devra utiliser le
//  plugin DataTables
// - La table DOIT avoir un tag `thead` ayant la class `.main`
// 	 - Les tags `th` de cet element doivent avoir un attribut `data-col`
// 		- Cet attribut `data-col` represente la colonne :
// 			- ex: th(data-col='nom')
// 	 - Si la colonne affiche des dates, ajouter un attribut `data-type='date'` pour formater
// 	 la date
// - La table PEUX avoir un deuxieme tag `thead` ayant la class .filters
// 	 - Les `th` compris dans cet element seront transforme en input de filtre
//
// 2 : Configuration des buttons d'action
// ======================================
// - 3 types d'action sont disponibles : show / update / delete
// 	 - Chacun de ces boutons doit etre dans un div hidden ayant comme attribut `id` l'action
//   attendue, le contenu sera copie au besoin lors de la generation de la table
// 		- ex: div(id='show', style='display:none;')
// 	 - Pour les bouton show et update, les parametres du href fonctionnent de la maniere suivante :
// 		- href='/pdc/update_form?id=&'
// 		- Lors de la generation du bouton, `id=&` sera automatiquement remplace
// 		par	`id=1&`
// 	 - Pour le bouton delete, inclure des input hidden pour chaque parametres. L'attribut `value`
// 	 sera defini en fonction de l'attribut `name` :
// 		- input(name='id', type='hidden') sera automatiquement remplace par
// 		input(name='id', type='hidden', value='1') lors de la generation du bouton
//

function frenchDate(date) {
	if (!date)
		return '';
	date = date.split('-');
	date = date[2] + '/' + date[1] + '/' + date[0];
	return date;
}

function englishDate(date) {
	if (!date)
		return '';
	var parts = date.split('/');
	date = '';
	for (var j = parts.length-1; j >= 0; j--) {
		if (j != parts.length-1)
			date += '-'
		date += parts[j];
	}
	return date;
}

function init_datatable(tableID){
	// Fetch columns from html
	var columns = [];
	$(tableID+" .main th").each(function(){
		if (typeof $(this).data('col') !== 'undefined' && $(this).is(":visible"))
			columns.push({data: $(this).data('col'), type: $(this).data('type')});
	});

	// Columns rendering
	// Server's object doesn't include DB table's prefix, we need to remove it
	// for DataTables to match column and data (column 'pdc.idc_pdc' -> data 'id_pdc')
	var columnDefs = [];
	for (var i = 0; i < columns.length; i++) {
		columnDefs.push({
			targets: i,
			render: function(data, type, row, meta){
				var cellValue;
				// Associated field. Go down object to find the right value
				if (columns[meta.col].data.indexOf('.') != -1) {
					var parts = columns[meta.col].data.split('.');
					var tmp = row[parts[0]];
					if(tmp != null){
						for (var j = 1; j < parts.length; j++)
							tmp = tmp[parts[j]];
					}
					cellValue = tmp;
				}
				// Regular value
				else
					cellValue = row[columns[meta.col].data];

				// Special data types
				if (typeof columns[meta.col].type != 'undefined'){
					// Date
					if (columns[meta.col].type == 'date'){
						if(cellValue != "" && cellValue != null && cellValue != "Invalid date" && cellValue != "Invalid Date"){
							if(lang_user == "fr-FR")
								cellValue = moment(new Date(cellValue)).format("DD/MM/YYYY");
							else
								cellValue = moment(new Date(cellValue)).format("YYYY-MM-DD");
						}
						else
							cellValue = "-";
					}
					// Datetime
					else if (columns[meta.col].type == 'datetime'){
						if(cellValue != "" && cellValue != null && cellValue != "Invalid date" && cellValue != "Invalid Date"){
							if(lang_user == "fr-FR")
								cellValue = moment(new Date(cellValue)).format("DD/MM/YYYY HH:mm:ss");
							else
								cellValue = moment(new Date(cellValue)).format("YYYY-MM-DD HH:mm:ss");
						}
						else
							cellValue = "-";
					}
					else if (columns[meta.col].type == 'boolean')
						cellValue = cellValue == 'true' || cellValue == '1' ? '<i class="fa fa-check-square-o fa-lg"></i>' : '<i class="fa fa-square-o fa-lg"></i>'
				}
				return cellValue;
			}
		});
	}

	var columnCount = columns.length-1;

	// Render SHOW button
	if ($(tableID+"_show").length > 0)
		columnDefs.push({
			"render": function ( data, type, row ) {
				var originHref = $(tableID+"_show a").attr('href');
				var params = originHref.split('?')[1].split('&');
				var setParams = '';
				for (var i = 0; i < params.length; i++) {
					var param = params[i].substr(0, params[i].indexOf('='));
					if (typeof row[param] !== 'undefined'){
						setParams += param + '=' + row[param] + '&';
					}
					else if(params[i] != ""){
						setParams += params[i] + '&';
					}
				}

				var finalUrl = originHref.substr(0, originHref.indexOf('?')+1) + setParams;
				$(tableID+"_show a").attr('href', finalUrl);

				return $(tableID+"_show").html();
			},
			"targets": columnCount += 1,
			searchable: false
		});

	// Render UPDATE button
	if ($(tableID+"_update").length > 0)
		columnDefs.push({
			"render": function ( data, type, row ) {
				var originHref = $(tableID+"_update a").attr('href');
				var params = originHref.split('?')[1].split('&');
				var setParams = '';
				for (var i = 0; i < params.length; i++) {
					var param = params[i].substr(0, params[i].indexOf('='));
					if (typeof row[param] !== 'undefined'){
						setParams += param + '=' + row[param] + '&';
					}
					else if(params[i] != ""){
						setParams += params[i] + '&';
					}
				}

				var finalUrl = originHref.substr(0, originHref.indexOf('?')+1) + setParams;
				$(tableID+"_update a").attr('href', finalUrl);

				return $(tableID+"_update").html();
			},
			"targets": columnCount += 1,
			searchable: false
		});

	// Render DELETE button
	if ($(tableID+"_delete").length > 0)
		columnDefs.push({
			"render": function ( data, type, row ) {
				$(tableID+"_delete input").each(function(){
					if (typeof row[$(this).attr('name')] !== 'undefined') {
						$(this).val(row[$(this).attr('name')]);
					}
				});
				return $(tableID+"_delete").html();
			},
			"targets": columnCount += 1,
			searchable: false
		});

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



	// Init DataTable
	var table = $(tableID).DataTable( {
		"serverSide": true,
		"ajax": {
			"url": $(tableID).data('url'),
			"type":"POST"
		},
		"responsive": true,
		"columns": columns,
		"columnDefs": columnDefs,
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


	// Bind search fields
	$(tableID+' .filters th').each(function (i) {
		var title = $(tableID+' thead th').eq(i).text();
		var search = '<input type="text" placeholder="' + title + '" />';
		if (title != '') {
			$(this).html('');
			$(search).appendTo(this).keyup(function(){
				var mainTh = $(tableID+' .main th').eq(i);
				var searchValue = this.value;
				// Special data types re-formating for search
				if (typeof mainTh.data('type') !== 'undefined') {
					// Date
					if (mainTh.data('type') == 'date')
						searchValue = englishDate(this.value);
				}
				table
				.columns(i)
				.search(searchValue)
				.draw();
			});
		}
	});
	//Les butons exports
	$('.dt-buttons').css("margin-left", '20px');
}

$(function() {
	$(".dataTable").each(function() {
		init_datatable('#' + $(this).attr('id'));
	})
})
