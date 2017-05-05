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

function formatDateTimeFR(value) {
    if (value == '')
        return value;

    var dateBuild = '';

    // Day provided
    if (value.length <= 2)
        return '-' + value;
    dateBuild = '-' + value.substring(0, 2);

    // Month provided
    if (value.length <= 4)
        return '-' + value.substring(2, 4) + dateBuild;
    dateBuild = '-' + value.substring(2, 4) + dateBuild;

    // Year prodived
    if (value.length <= 8)
        return value.substring(4, 8) + dateBuild;
    dateBuild = value.substring(4, 8) + dateBuild + ' ';

    // Hour provided
    if (value.length <= 10)
        return dateBuild + value.substring(8, 10) + ':';
    dateBuild = dateBuild + value.substring(8, 10) + ':';

    // Minutes provided
    if (value.length <= 12)
        return dateBuild + value.substring(10, 12) + ':';
    dateBuild = dateBuild + value.substring(10, 12) + ':';

    // Seconds provided
    if (value.length <= 14)
        return dateBuild + value.substring(12, 14);
    dateBuild = dateBuild + value.substring(12, 14);

    // Seconds provided
    return dateBuild + value.substring(14, 16);
}

function formatDateTimeEN(value) {
    if (value == '')
        return value;

    var dateBuild = '';

    // Day provided
    if (value.length <= 4)
        return value + '-';
    dateBuild = value.substring(0, 4) + '-';

    // Month provided
    if (value.length <= 6)
        return dateBuild + value.substring(4, 6) + '-';
    dateBuild = dateBuild + value.substring(4, 6) + '-';

    // Year prodived
    if (value.length <= 8)
        return dateBuild + value.substring(6, 8);
    dateBuild = dateBuild + value.substring(6, 8) + ' ';

    // Hour provided
    if (value.length <= 10)
        return dateBuild + value.substring(8, 10) + ':';
    dateBuild = dateBuild + value.substring(8, 10) + ':';

    // Minutes provided
    if (value.length <= 12)
        return dateBuild + value.substring(10, 12) + ':';
    dateBuild = dateBuild + value.substring(10, 12) + ':';

    // Seconds provided
    if (value.length <= 14)
        return dateBuild + value.substring(12, 14);
    dateBuild = dateBuild + value.substring(12, 14);

    // Seconds provided
    return dateBuild + value.substring(14, 16);
}

function formatTime(value) {
    if (value == '')
        return value;

    var timeBuild = '';

    if (value.length <= 2)
        return value;
    timeBuild = value.substr(0, 2) + ':';

    if (value.length <= 4)
        return timeBuild + value.substring(2, 4);
    timeBuild = timeBuild + value.substring(2, 4) + ':';

    return timeBuild + value.substring(4, 6);
}

function formatDateFR(value) {
    if (value == '')
        return value;

    var timeBuild = '';

    if (value.length <= 2)
        return '-' + value;
    timeBuild = value.substr(0, 2);

    if (value.length <= 4)
        return timeBuild + value.substring(2, 4);
    timeBuild = value.substring(2, 4) + '-' + timeBuild;

    return value.substring(4, 8) + '-' + timeBuild;
}

function formatDateEN(value) {
    if (value == '')
        return value;

    var timeBuild = '';

    if (value.length <= 4)
        return value + '-';
    timeBuild = value.substr(0, 4) + '-';

    if (value.length <= 4)
        return timeBuild + value.substring(4, 6) + '-';
    timeBuild = timeBuild + value.substring(4, 6) + '-';

    return timeBuild + value.substring(6, 8);
}

function init_datatable(tableID) {
    // Fetch columns from html
    var columns = [];
    $(tableID + " .main th").each(function () {
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
            render: function (data, type, row, meta) {
                var cellValue;
                // Associated field. Go down object to find the right value
                if (columns[meta.col].data.indexOf('.') != -1) {
                    var parts = columns[meta.col].data.split('.');
                    var tmp = row[parts[0]];
                    if (typeof tmp !== "undefined" && tmp != null) {
                        for (var j = 1; j < parts.length; j++)
                            tmp = tmp[parts[j]];
                    }
                    cellValue = tmp;
                }
                // Regular value
                else
                    cellValue = row[columns[meta.col].data];

                // Special data types
                if (typeof columns[meta.col].type != 'undefined') {
                    // Date
                    if (columns[meta.col].type == 'date') {
                        if (cellValue != "" && cellValue != null && cellValue != "Invalid date" && cellValue != "Invalid Date") {
                            if (lang_user == "fr-FR")
                                cellValue = moment(new Date(cellValue)).format("DD/MM/YYYY");
                            else
                                cellValue = moment(new Date(cellValue)).format("YYYY-MM-DD");
                        } else
                            cellValue = "-";
                    }
                    // Datetime
                    else if (columns[meta.col].type == 'datetime') {
                        if (cellValue != "" && cellValue != null && cellValue != "Invalid date" && cellValue != "Invalid Date") {
                            if (lang_user == "fr-FR")
                                cellValue = moment(new Date(cellValue)).format("DD/MM/YYYY HH:mm:ss");
                            else
                                cellValue = moment(new Date(cellValue)).format("YYYY-MM-DD HH:mm:ss");
                        } else
                            cellValue = "-";
                    } else if (columns[meta.col].type == 'boolean')
                        cellValue = cellValue == 'true' || cellValue == '1' ? '<i class="fa fa-check-square-o fa-lg"></i>' : '<i class="fa fa-square-o fa-lg"></i>';
                    else if (columns[meta.col].type == 'color')
                        cellValue = '<i style="color:' + cellValue + '" class="fa fa-lg fa-circle"></i>';
                    else if (columns[meta.col].type == 'currency')
                        cellValue = '<span data-type="currency">' + cellValue + '</span>';
                    else if (columns[meta.col].type == 'email' && (cellValue != null && cellValue != ''))
                        cellValue = '<a href="mailto:' + cellValue + '">' + cellValue + '</a>';
                    else if (columns[meta.col].type == 'tel' && (cellValue != null && cellValue != ''))
                        cellValue = '<a href="tel:' + cellValue + '">' + cellValue + '</a>';
                    else if (columns[meta.col].type == 'picture') {
                        if (cellValue != null && cellValue.buffer != '')
                            cellValue = '<img src=data:image/;base64,' + cellValue.buffer + ' />';
                        else
                            cellValue = '';
                    }
                    else if (columns[meta.col].type == 'url' && cellValue!=null)
                        cellValue = '<a target="_blank" href="'+cellValue+'">'+cellValue+'</a>';
                }
                return cellValue;
            }
        });
    }

    var columnCount = columns.length - 1;

    // Render SHOW button
    if ($(tableID + "_show").length > 0)
        columnDefs.push({
            "render": function (data, type, row) {
                var originHref = $(tableID + "_show a").attr('href');
                var params = originHref.split('?')[1].split('&');
                var setParams = '';
                for (var i = 0; i < params.length; i++) {
                    var param = params[i].substr(0, params[i].indexOf('='));
                    if (typeof row[param] !== 'undefined') {
                        setParams += param + '=' + row[param] + '&';
                    } else if (params[i] != "") {
                        setParams += params[i] + '&';
                    }
                }

                var finalUrl = originHref.substr(0, originHref.indexOf('?') + 1) + setParams;
                $(tableID + "_show a").attr('href', finalUrl);

                return $(tableID + "_show").html();
            },
            "targets": columnCount += 1,
            searchable: false
        });

    // Render UPDATE button
    if ($(tableID + "_update").length > 0)
        columnDefs.push({
            "render": function (data, type, row) {
                var originHref = $(tableID + "_update a").attr('href');
                var params = originHref.split('?')[1].split('&');
                var setParams = '';
                for (var i = 0; i < params.length; i++) {
                    var param = params[i].substr(0, params[i].indexOf('='));
                    if (typeof row[param] !== 'undefined') {
                        setParams += param + '=' + row[param] + '&';
                    } else if (params[i] != "") {
                        setParams += params[i] + '&';
                    }
                }

                var finalUrl = originHref.substr(0, originHref.indexOf('?') + 1) + setParams;
                $(tableID + "_update a").attr('href', finalUrl);

                return $(tableID + "_update").html();
            },
            "targets": columnCount += 1,
            searchable: false
        });

    // Render DELETE button
    if ($(tableID + "_delete").length > 0)
        columnDefs.push({
            "render": function (data, type, row) {
                $(tableID + "_delete input").each(function () {
                    if (typeof row[$(this).attr('name')] !== 'undefined') {
                        $(this).val(row[$(this).attr('name')]);
                    }
                });
                return $(tableID + "_delete").html();
            },
            "targets": columnCount += 1,
            searchable: false
        });

    if (lang_user == "fr-FR") {
        str_language = {
            "processing": "Traitement en cours...",
            "search": "Rechercher&nbsp;:",
            "lengthMenu": "Afficher _MENU_ &eacute;l&eacute;ments",
            "info": "Affichage de l'&eacute;l&eacute;ment _START_ &agrave; _END_ sur _TOTAL_ &eacute;l&eacute;ments",
            "infoEmpty": "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
            "infoFiltered": "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
            "infoPostFix": "",
            "loadingRecords": "Chargement en cours...",
            "zeroRecords": "Aucun &eacute;l&eacute;ment &agrave; afficher",
            "emptyTable": "Aucune donn&eacute;e disponible dans le tableau",
            "paginate": {
                "first": "Premier",
                "previous": "Pr&eacute;c&eacute;dent",
                "next": "Suivant",
                "last": "Dernier"
            },
            "aria": {
                "sortAscending": ": activer pour trier la colonne par ordre croissant",
                "sortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
            }
        };
    } else {
        str_language = {
            "processing": "Processing...",
            "search": "Search&nbsp;:",
            "lengthMenu": "Display _MENU_ records",
            "info": "Displaying records _START_ to _END_ on _TOTAL_ records",
            "infoEmpty": "No record to display",
            "infoFiltered": "(filter on _MAX_ records total)",
            "infoPostFix": "",
            "loadingRecords": "Loading...",
            "zeroRecords": "No record to display",
            "emptyTable": "No data available in this array",
            "paginate": {
                "first": "First",
                "previous": "Previous",
                "next": "Next",
                "last": "Last"
            },
            "aria": {
                "sortAscending": ": click to sort column by ascending order",
                "sortDescending": ": click to sort column by descending order"
            }
        };
    }



    // Init DataTable
    var table = $(tableID).DataTable({
        "serverSide": true,
        "ajax": {
            "url": $(tableID).data('url'),
            "type": "POST"
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
                extend: 'print',
                text: '<i class="fa fa-print"></i>',
                titleAttr: 'Print',
                exportOptions: {
                    columns: ':visible'
                }
            },
            {
                extend: 'copyHtml5',
                text: '<i class="fa fa-files-o"></i>',
                titleAttr: 'Copy',
                exportOptions: {
                    columns: ':visible'
                }
            },
            {
                extend: 'csvHtml5',
                text: 'CSV',
                titleAttr: 'CSV',
                exportOptions: {
                    columns: ':visible'
                }
            },
            {
                extend: 'excelHtml5',
                text: 'Excel',
                titleAttr: 'Excel',
                exportOptions: {
                    columns: ':visible'
                }
            }
        ]
    });


    // Bind search fields
    $(tableID + ' .filters th').each(function (i) {
        var title = $(tableID + ' thead th').eq(i).text();
        var search = '<input type="text" placeholder="' + title + '" />';
        var mainTh = $(tableID + ' .main th').eq(i);
        if (title != '') {
            $(this).html('');
            $(search).appendTo(this).keyup(function () {
                var searchValue = this.value;
                var valueObject = {type: '', value: ''};
                // Special data types re-formating for search
                if (typeof mainTh.data('type') !== 'undefined') {
                    // Date
                    if (mainTh.data('type') == 'date') {
                        valueObject.type = 'date';
                        searchValue = lang_user == 'fr-FR' ? formatDateFR($(tableID + " .filters th").eq(i).find("input").inputmask('unmaskedvalue')) : formatDateEN($(tableID + " .filters th").eq(i).find("input").inputmask('unmaskedvalue'));
                    }
                    // Date
                    else if (mainTh.data('type') == 'time') {
                        valueObject.type = 'time';
                        searchValue = formatTime($(tableID + " .filters th").eq(i).find("input").inputmask('unmaskedvalue'));
                    }
                    // DateTime
                    else if (mainTh.data('type') == 'datetime') {
                        valueObject.type = 'datetime';
                        searchValue = lang_user == 'fr-FR' ? formatDateTimeFR($(tableID + " .filters th").eq(i).find("input").inputmask('unmaskedvalue')) : formatDateTimeEN($(tableID + " .filters th").eq(i).find("input").inputmask('unmaskedvalue'));
                    }
                }
                valueObject.value = searchValue;
                table.columns(i).search(JSON.stringify(valueObject)).draw();
            });

            // Initialize masks on filters inputs
            if (typeof mainTh.data('type') !== 'undefined') {
                if (lang_user == 'fr-FR') {
                    if (mainTh.data('type') == 'datetime')
                        $(tableID + " .filters th").eq(i).find("input").inputmask({
                            mask: "d/m/y h:s:s",
                            placeholder: "dd/mm/yyyy hh:mm:ss",
                            alias: "datetime",
                            timeseparator: ":",
                            hourFormat: "24"
                        });
                    if (mainTh.data('type') == 'date')
                        $(tableID + " .filters th").eq(i).find("input").inputmask({"alias": "dd/mm/yyyy"});
                } else if (lang_user == 'en-EN') {
                    if (mainTh.data('type') == 'datetime')
                        $(tableID + " .filters th").eq(i).find("input").inputmask({
                            mask: "y-m-d h:s:s",
                            placeholder: "yyyy-mm-dd hh:mm:ss",
                            alias: "datetime",
                            timeseparator: ":",
                            hourFormat: "24"
                        });
                    if (mainTh.data('type') == 'date')
                        $(tableID + " .filters th").eq(i).find("input").inputmask({"alias": "yyyy-mm-dd"});
                }
                if (mainTh.data('type') == 'time')
                    $(tableID + " .filters th").eq(i).find("input").inputmask({
                        mask: "h:s:s",
                        placeholder: "hh:mm:ss",
                        separator: "-"
                    });
            }
        }
    });


    //modal on click on picture cell
    $(tableID + ' tbody')
            .on('click', 'td img', function () {
                var colIdx = table.cell($(this).parent()).index().column;
                if (typeof columns[colIdx] != 'undefined' && columns[colIdx].type == 'picture') {
                    var entity = tableID.replace('#table_', '');
                    var cellData = table.cell($(this).parent()).data();
                    $.ajax({
                        url: '/default/get_file',
                        type: 'GET',
                        data: {entity: entity, src: cellData.value},
                        success: function (result) {
                            if (result.success) {
                                var text = '<div class="modal fade" tabindex="-1" role="dialog">'
                                        + '<div class="modal-dialog" role="document">'
                                        + '<div class="modal-content">'
                                        + '<div class="modal-header skin-blue-light">'
                                        + '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
                                        + '<h4 class="modal-title">' + result.file + '</h4>'
                                        + '</div>'
                                        + '<div class="modal-body">'
                                        + '<p><img  class="img img-responsive" src=data:image/;base64,' + result.data + ' alt=' + result.file + '/></p>'
                                        + '</div>'
                                        + '<div class="modal-footer">'
                                        + ' <button type="button" class="btn btn-danger" data-dismiss="modal">Close</button>'
                                        + '</div>'
                                        + '</div>'
                                        + '</div>'
                                        + '</div>';
                                $(text).modal('show');
                            }
                        }
                    });
                }
            });


    //Les butons exports
    $('.dt-buttons').css("margin-left", '20px');
}

$(function () {
    $(".dataTable").each(function () {
        init_datatable('#' + $(this).attr('id'));
    })
})
