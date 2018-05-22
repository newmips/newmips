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
//   - Les tags `th` de cet element doivent avoir un attribut `data-col`
//      - Cet attribut `data-col` represente la colonne :
//          - ex: th(data-col='nom')
//   - Si la colonne affiche des dates, ajouter un attribut `data-type='date'` pour formater
//   la date
// - La table PEUX avoir un deuxieme tag `thead` ayant la class .filters
//   - Les `th` compris dans cet element seront transforme en input de filtre
//
// 2 : Configuration des buttons d'action
// ======================================
// - 3 types d'action sont disponibles : show / update / delete
//   - Chacun de ces boutons doit etre dans un div hidden ayant comme attribut `id` l'action
//   attendue, le contenu sera copie au besoin lors de la generation de la table
//      - ex: div(id='show', style='display:none;')
//   - Pour les bouton show et update, les parametres du href fonctionnent de la maniere suivante :
//      - href='/pdc/update_form?id=&'
//      - Lors de la generation du bouton, `id=&` sera automatiquement remplace
//      par `id=1&`
//   - Pour le bouton delete, inclure des input hidden pour chaque parametres. L'attribut `value`
//   sera defini en fonction de l'attribut `name` :
//      - input(name='id', type='hidden') sera automatiquement remplace par
//      input(name='id', type='hidden', value='1') lors de la generation du bouton
//
var STR_LANGUAGE;
if (lang_user == "fr-FR") {
    STR_LANGUAGE = {
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
    STR_LANGUAGE = {
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

// Bind search fields
function saveFilter(value, el, tableId, field) {
    var filterSave = JSON.parse(localStorage.getItem("newmips_filter_save_" + tableId));
    if (filterSave == null)
        filterSave = {};
    filterSave[field] = value;
    localStorage.setItem("newmips_filter_save_" + tableId, JSON.stringify(filterSave));
}

function getFilterSave(tableId, field) {
    var filterSave = JSON.parse(localStorage.getItem("newmips_filter_save_" + tableId));
    if (filterSave == null)
        return "";
    else if (typeof filterSave[field] === "undefined")
        return "";
    else
        return filterSave[field];
}

var delay = (function() {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

function init_datatable(tableID, isSubDataList, doPagination) {
    isSubDataList = typeof isSubDataList !== 'undefined' && isSubDataList == true ? true : false;
    doPagination = typeof doPagination !== 'undefined' ? doPagination : true;

    // Fetch columns from html
    var columns = [];
    $(tableID + " .main th").each(function () {
        if (typeof $(this).data('col') !== 'undefined'){
            if($(this).data("hidden") == "1"){
                columns.push({data: $(this).data('col'), type: $(this).data('type'), hidden: true});
            } else {
                columns.push({data: $(this).data('col'), type: $(this).data('type'), hidden: false});
            }
        }
    });

    function getValue(cellArrayKeyValue, row) {
        var i = 0;
        var key = cellArrayKeyValue[i];
        do {
            if (row != null && typeof row[key] !== 'undefined') {
                row = row[key];
            } else
                return '-';
            i++;
            key = cellArrayKeyValue[i];
        } while (i < cellArrayKeyValue.length);
        return row;
    }

    // Columns rendering
    // Server's object doesn't include DB table's prefix, we need to remove it
    // for DataTables to match column and data (column 'pdc.idc_pdc' -> data 'id_pdc')
    var columnDefs = [];
    for (var i = 0; i < columns.length; i++) {
        var objColumnDefToPush = {};
        if(columns[i].hidden){
            objColumnDefToPush.targets = i;
            objColumnDefToPush.render = function(){return "";};
            objColumnDefToPush.visible = false;
            objColumnDefToPush.searchable = false;
            columnDefs.push(objColumnDefToPush);
            continue;
        }
        objColumnDefToPush = {
            targets: i,
            render: function (data, type, row, meta) {
                var cellValue;
                // Associated field. Go down object to find the right value
                if (columns[meta.col].data.indexOf('.') != -1) {
                    var entityRelation = columns[meta.col].data.split(".")[0];
                    var attributeRelation = columns[meta.col].data.split(".")[1];
                    //Gestion des relation hasMAny dans un datalist
                    if (row[entityRelation] != null && typeof row[entityRelation] === "object") {
                        var valueFromArray = "";
                        for (var attr in row[entityRelation]) {
                            if (row[entityRelation][attr] != null && typeof row[entityRelation][attr] === "object") {
                                for (var attr2 in row[entityRelation][attr]) {
                                    if (attr == entityRelation && attr2 == attributeRelation)
                                        valueFromArray += "- " + row[entityRelation][attr][attr2] + "<br>";
                                }
                            } else {
                                var parts = columns[meta.col].data.split('.');
                                valueFromArray = getValue(parts, row);
                            }

                        }
                        cellValue = valueFromArray;
                    } else {
                        // Has one sur une sous entité
                        var parts = columns[meta.col].data.split('.');
                        cellValue = getValue(parts, row);
                    }
                }
                // Regular value
                else
                    cellValue = row[columns[meta.col].data];

                function currencyFormat(num) {
                    if(num != null)
                        return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
                    else
                        return "";
                }

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
                                cellValue = moment(new Date(cellValue)).format("DD/MM/YYYY HH:mm");
                            else
                                cellValue = moment(new Date(cellValue)).format("YYYY-MM-DD HH:mm");
                        } else
                            cellValue = "-";
                    } else if (columns[meta.col].type == 'boolean')
                        cellValue = cellValue == 'true' || cellValue == '1' ? '<i class="fa fa-check-square-o fa-lg"></i>' : '<i class="fa fa-square-o fa-lg"></i>';
                    else if (columns[meta.col].type == 'color')
                        cellValue = '<i style="color:' + cellValue + '" class="fa fa-lg fa-circle"></i>';
                    else if (columns[meta.col].type == 'status'){
                        var statusObj = row[columns[meta.col].data.split(".")[0]];
                        if(statusObj != null)
                            cellValue = '<span class="badge" style="background: '+statusObj.f_color+';">'+statusObj.f_name+'</span>';
                        else
                            cellValue = "-";
                    }
                    else if (columns[meta.col].type == 'currency')
                        cellValue = '<span data-type="currency">' + currencyFormat(cellValue) + '</span>';
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
                    else if (columns[meta.col].type == 'time' && cellValue != null){
                        if(cellValue.length == 8)
                            cellValue = cellValue.substring(0, cellValue.length - 3);
                    } else if (columns[meta.col].type == 'password'){
                        cellValue = '●●●●●●●●●';
                    }
                }
                return cellValue;
            }
        };
        if(columns[i].type == "password"){
            objColumnDefToPush.searchable = false;
            objColumnDefToPush.orderable = false;
        }
        columnDefs.push(objColumnDefToPush);
    }

    var columnCount = columns.length - 1;

    // Build row's buttons from global DATALIST_BUTTONS var defined in view (list/show)
    for (var i = 0; i < DATALIST_BUTTONS.length; i++) {
        columnDefs.push({
            render: DATALIST_BUTTONS[i].render,
            searchable: typeof DATALIST_BUTTONS[i].searchable === 'undefined' ? false : DATALIST_BUTTONS[i].searchable,
            targets: columnCount += 1
        });
    }

    // Init DataTable
    var tableOptions = {
        "serverSide": true,
        "ajax": {
            "url": $(tableID).data('url'),
            "type": "POST"
        },
        "responsive": true,
        "columns": columns,
        "columnDefs": columnDefs,
        "language": STR_LANGUAGE,
        "paging": doPagination,
        "bLengthChange": true,
        "iDisplayLength": 25,
        "aLengthMenu": [[25, 50, 200, 500], [25, 50, 200, 500]],
        "bAutoWidth": false,
        "order": [ 0, 'desc' ],
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
            }, {
                text: '<i class="fa fa-arrow-right"></i>',
                titleAttr: 'Scroll right',
                action: function ( e, dt, node, config ) {
                    $(tableID).parents(".table-responsive").animate({scrollLeft: $(tableID).width()}, 800);
                }
            }
        ]
    }
    // Global search
    tableOptions.dom = isSubDataList ? 'lBrtip' : 'lBfrtip';
    var table = $(tableID).DataTable(tableOptions);

    //modal on click on picture cell
    $(tableID+' tbody').on('click', 'td img', function () {
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

    if (!isSubDataList) {
        // Bind search fields
        $(tableID + ' .filters th').each(function (i) {
            var title = $(this).text();
            var mainTh = $(this);
            // Custom
            var currentField = mainTh.data('field');
            var val = getFilterSave(tableID.substring(1), currentField);
            var search = '<input type="text" class="form-control input" value="' + val + '" placeholder="' + title + '" />';
            function searchInDatalist(searchValue) {
                var valueObject = {type: '', value: ''};
                // Special data types re-formating for search
                if (typeof mainTh.data('type') !== 'undefined') {
                    // Date
                    if (mainTh.data('type') == 'date') {
                        valueObject.type = 'date';
                        searchValue = lang_user == 'fr-FR' ? formatDateFR(mainTh.find("input").inputmask('unmaskedvalue')) : formatDateEN(mainTh.find("input").inputmask('unmaskedvalue'));
                    }
                    // Time
                    else if (mainTh.data('type') == 'time') {
                        valueObject.type = 'time';
                        searchValue = formatTime(mainTh.find("input").inputmask('unmaskedvalue'));
                    }
                    // DateTime
                    else if (mainTh.data('type') == 'datetime') {
                        valueObject.type = 'datetime';
                        searchValue = lang_user == 'fr-FR' ? formatDateTimeFR(mainTh.find("input").inputmask('unmaskedvalue')) : formatDateTimeEN(mainTh.find("input").inputmask('unmaskedvalue'));
                    }
                    // Currency
                    else if (mainTh.data('type') == 'currency') {
                        valueObject.type = 'currency';
                    }
                }
                valueObject.value = searchValue;
                table.columns(i).search(JSON.stringify(valueObject)).draw();
            }
            // If it's not an action button
            if (title != '') {
                if($(this).data("hidden") != 1){
                    $(this).html('');
                    $(search).appendTo(this).keyup(function () {
                        var searchValue = this.value;
                        saveFilter(searchValue, this, $(this).parents("table").attr("id"), $(this).parent().attr("data-field"));
                        delay(function(){
                            searchInDatalist(searchValue);
                        }, 500);
                    });
                    // Initialize masks on filters inputs
                    if (typeof mainTh.data('type') !== 'undefined') {
                        if (lang_user == 'fr-FR') {
                            if (mainTh.data('type') == 'datetime')
                                $(this).find("input").inputmask({
                                    mask: "d/m/y h:s:s",
                                    placeholder: "dd/mm/yyyy hh:mm:ss",
                                    alias: "datetime",
                                    timeseparator: ":",
                                    hourFormat: "24"
                                });
                            if (mainTh.data('type') == 'date')
                                $(this).find("input").inputmask({"alias": "dd/mm/yyyy"});
                        } else if (lang_user == 'en-EN') {
                            if (mainTh.data('type') == 'datetime')
                                $(this).find("input").inputmask({
                                    mask: "y-m-d h:s:s",
                                    placeholder: "yyyy-mm-dd hh:mm:ss",
                                    alias: "datetime",
                                    timeseparator: ":",
                                    hourFormat: "24"
                                });
                            if (mainTh.data('type') == 'date')
                                $(this).find("input").inputmask({"alias": "yyyy-mm-dd"});
                        }
                        if (mainTh.data('type') == 'time')
                            $(this).find("input").inputmask({
                                mask: "h:s:s",
                                placeholder: "hh:mm:ss",
                                separator: "-"
                            });
                    }
                } else {
                    $(this).hide();
                }
            }
            if (val != "") {
                searchInDatalist(val);
            }
        });
    }
}

$(function () {
    $(".dataTable").each(function () {
        init_datatable('#' + $(this).attr('id'));
    });
});