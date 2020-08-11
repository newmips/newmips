// Datatable throw error instead of alert
$.fn.dataTable.ext.errMode = 'throw';

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
        "reset_filter": "Réinitialiser les filtres",
        "scroll_right": "Défilement à droite",
        "download_file": "Télécharger le fichier",
        "close": "Fermer",
        "paginate": {
            "first": "Premier",
            "previous": "Pr&eacute;c&eacute;dent",
            "next": "Suivant",
            "last": "Dernier"
        },
        "aria": {
            "sortAscending": ": activer pour trier la colonne par ordre croissant",
            "sortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
        },
        "choose_columns": "Choix Colonnes",
        "apply": "Appliquer",
        "display": "Afficher",
        "boolean_filter": {
            "null": "Non renseigné",
            "checked": "Coché",
            "unchecked": "Décoché",
            "all": "Tout"
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
        "reset_filter": "Reset all filters",
        "scroll_right": "Scroll right",
        "download_file": "Download the file",
        "close": "Close",
        "paginate": {
            "first": "First",
            "previous": "Previous",
            "next": "Next",
            "last": "Last"
        },
        "aria": {
            "sortAscending": ": click to sort column by ascending order",
            "sortDescending": ": click to sort column by descending order"
        },
        "choose_columns": "Choose Columns",
        "apply": "Apply",
        "display": "Display",
        "boolean_filter": {
            "null": "Not specified",
            "checked": "Checked",
            "unchecked": "Unchecked",
            "all": "Both"
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

function getValue(cellArrayKeyValue, row) {
    var i = 0;
    var key = cellArrayKeyValue[i];
    do {
        if (row != null && typeof row[key] !== 'undefined')
            row = row[key];
        else
            return '-';
        i++;
        key = cellArrayKeyValue[i];
    } while (i < cellArrayKeyValue.length);
    return row;
}

function currencyFormat(value) {
    if(typeof value === 'string' && value.indexOf('.') != -1 && value.split('.')[1].length == 1)
        return value + '0';
    else if(typeof value === 'number')
        return value.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
    return value;
}

// Dive trough the object to find the key we are looking for
function diveObj(obj, idx, keys){
    if(!obj)
        return '-';

    if(Array.isArray(obj[keys[idx]]) && obj[keys[idx]].length > 0)
        return diveObj(obj[keys[idx]][0], ++idx, keys);
    else if(typeof obj[keys[idx]] === 'object')
        return diveObj(obj[keys[idx]], ++idx, keys);
    else if(obj[keys[idx]] && typeof obj[keys[idx]] !== undefined)
        return obj;
    else
        return '-';
}

// Bind search fields
function saveFilter(value, el, tableId, field) {
    var filterSave = JSON.parse(localStorage.getItem("newmips_filter_save_" + tableId));
    if (filterSave == null)
        filterSave = {};
    filterSave[field] = value;
    localStorage.setItem("newmips_filter_save_" + tableId, JSON.stringify(filterSave));
}

function getFilter(tableId, field) {
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
        if(typeof callback === 'object')
            return;
        timer = setTimeout(callback, ms);
    };
})();

// Generate the column selector on datatable button click
//   - append an absolute div to the datalist button
//   - display a list of the columns available on page load with a checkbox to hide/show each
function generateColumnSelector(tableID, columns) {
    var storageColumnsShow = JSON.parse(localStorage.getItem("newmips_shown_columns_save_" + tableID.substring(1)));
    var tableHeight = $(tableID).height();
    var columnsSelectorDiv = $('<div id="columnSelector" style="height:'+tableHeight+'px;width:100%;overflow:auto;position:absolute;background: white;border: 1px solid grey;border-radius:5px;padding:10px;z-index:1000;"><h4 style="text-align:center;">'+STR_LANGUAGE.display+'</h4></div>');

    var columnsToShow = {columns: []};
    // Loop over the <th> available on page load
    for (var i = 0; i < columns.length; i++) {
        // Column has been hidden through hide column instruction, never show
        if (columns[i].hidden == true)
            continue;
        // Button's <th> doesn't have the .sorting class
        if (!columns[i].element.hasClass('sorting'))
            continue;

        (function (current) {
            var element = current.element, show;
            // If storageColumnsShow is null, it means it's the first use of this storage, all columns must be shown by default
            if (storageColumnsShow == null || current.show)
                show = true;
            // Show depending on stored columns to show.
            else
                show = storageColumnsShow.columns.indexOf(element.data('col')) != -1;
            if (show)
                columnsToShow.columns.push(element.data('col'));

            var columnDiv = $('<div><label><input class="form-control input" name="'+element.data('col')+'" type="checkbox" data-col="'+element.data('col')+'" '+(show ? 'checked': '')+'>&nbsp;'+element.text()+'</label></div>');
            // Initialize column checkbox
            var checkbox = columnDiv.find('input[type=checkbox]').icheck({checkboxClass: 'icheckbox_flat-blue',radioClass: 'iradio_flat-blue'});

            // Bind hide/show trigger, build new columnsToShow array. Apply button will use this array
            checkbox.on('ifToggled', function() {
                // Show by adding col to columnsToShow
                if (columnsToShow.columns.indexOf(element.data('col')) == -1)
                    columnsToShow.columns.push(element.data('col'));
                // Hide by removing col from columnsToShow
                else
                    columnsToShow.columns.splice(columnsToShow.columns.indexOf(element.data('col')), 1);
            });
            columnsSelectorDiv.append(columnDiv);
        })(columns[i]);
    }

    // Create Apply button and bind click
    var applyBtn = $('<div style="text-align:center;margin-top:5px;margin-bottom:5px;"><button class="btn btn-primary btn-sm">'+STR_LANGUAGE.apply+'</button></div>');
    applyBtn.click(function(){
        // Set new filters to localStorage and reload
        localStorage.setItem("newmips_shown_columns_save_" + tableID.substring(1), JSON.stringify(columnsToShow));
        setTimeout(function() {
            location.reload();
        }, 100);
    });

    columnsSelectorDiv.append(applyBtn)
    return columnsSelectorDiv;
}

// Close column selector when click event is triggered outside of it
$(document).mouseup(function(e) {
    // if the target of the click isn't the container nor a descendant of the container
    if ($("#columnSelector") && !$("#columnSelector").is(e.target) && $("#columnSelector").has(e.target).length === 0)
        $("#columnSelector").remove();
});

function init_datatable(tableID, doPagination, context) {
    if(!context)
        context = document;
    doPagination = typeof doPagination !== 'undefined' ? doPagination : true;

    // Use localStorage shown columns definitions to set data-hidden on columns
    var shownColumns = JSON.parse(localStorage.getItem("newmips_shown_columns_save_" + tableID.substring(1)));

    // Fetch columns from html
    var columns = [], defaultOrder = {idx: 0, direction: 'DESC'};
    $(tableID + " .main th", context).each(function (idx) {
        var col = $(this).data('col');
        if (typeof col !== 'undefined'){
            var column = {data: col, type: $(this).data('type'), element: $(this)};
            column.hidden = $(this).attr("data-hidden") == "1" ? true : false;

            var shouldShowColumn = true;
            if (shownColumns == null || shownColumns.columns.indexOf(col) != -1) {
                column.show = true;
            }
            else {
                $(tableID + " .filters th", context).eq(idx).attr('data-show', '0');
                column.show = false;
            }

            columns.push(column);

            // Look for default order on field. Presence of `data-default-order` gives the index, value gives direction. Ex: <th data-default-order="ASC">
            if ($(this).data('default-order')) {
                defaultOrder.idx = columns.length-1;
                defaultOrder.direction = $(this).data('default-order');
            }
        }
    });

    // Columns rendering
    // Server's object doesn't include DB table's prefix, we need to remove it
    // for DataTables to match column and data (column 'pdc.idc_pdc' -> data 'id_pdc')
    var columnDefs = [], columnsTypes = {};
    for (var i = 0; i < columns.length; i++) {
        var objColumnDefToPush = {};
        if(columns[i].hidden || columns[i].show == false){
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
                var cellValue, keys;
                // Associated field. Go down object to find the right value
                if (columns[meta.col].data.indexOf('.') != -1) {
                    keys = columns[meta.col].data.split(".");
                    cellValue = diveObj(row, 0, keys);

                    if(typeof cellValue === 'object')
                        cellValue = cellValue[keys.slice(-1)[0]];
                }
                // Regular value
                else
                    cellValue = row[columns[meta.col].data];

                // Special data types
                if (typeof columns[meta.col].type != 'undefined') {
                    // Get current entity by splitting current table id
                    var currentEntity = tableID.split("#table_")[1];

                    // date / datetime
                    if (columns[meta.col].type == 'date' || columns[meta.col].type == 'datetime') {
                        if (cellValue != null && cellValue != "" && cellValue.toLowerCase() != "invalid date") {
                            var tmpDate = moment.utc(cellValue);
                            if (!tmpDate.isValid())
                                cellValue = '-';
                            else {
                                var format;
                                if (columns[meta.col].type == 'date')
                                    format = lang_user == 'fr-FR' ? "DD/MM/YYYY" : "YYYY-MM-DD";
                                else if (columns[meta.col].type == 'datetime')
                                    format = lang_user == 'fr-FR' ? "DD/MM/YYYY HH:mm" : "YYYY-MM-DD HH:mm";

                                cellValue = tmpDate.format(format || "YYYY-MM-DD");
                            }
                        }
                        else
                            cellValue = "-";
                    } else if (columns[meta.col].type == 'boolean')
                        cellValue = cellValue == 'true' || cellValue == '1' ? '<i class="fa fa-check-square-o fa-lg"><span style="visibility: hidden;">1</span></i>' : '<i class="fa fa-square-o fa-lg"><span style="visibility: hidden;">0</span></i>';
                    else if (columns[meta.col].type == 'color')
                        cellValue = '<i style="color:' + cellValue + '" class="fa fa-lg fa-circle"></i>';
                    else if (columns[meta.col].type == 'status'){
                        keys = columns[meta.col].data.split(".");
                        var statusObj = diveObj(row, 0, keys);
                        if (statusObj.f_name)
                            cellValue = '<span class="badge" style="background: ' + statusObj.f_color + ';">' + statusObj.f_name + '</span>';
                        else
                            cellValue = '<span class="badge">' + statusObj + '</span>';
                    }
                    else if (columns[meta.col].type == 'currency')
                        cellValue = '<span data-type="currency">' + currencyFormat(cellValue) + '</span>';
                    else if (columns[meta.col].type == 'email' && (cellValue != null && cellValue != ''))
                        cellValue = '<a href="mailto:' + cellValue + '">' + cellValue + '</a>';
                    else if (columns[meta.col].type == 'tel' && (cellValue != null && cellValue != ''))
                        cellValue = '<a href="tel:' + cellValue + '">' + cellValue + '</a>';
                    else if (columns[meta.col].type == 'picture') {
                        if (cellValue != null && cellValue.buffer != '')
                            cellValue = '<img class="file" style="max-width: 50px;" data-entity="' + currentEntity + '" data-value="' + cellValue.value + '" src=data:image/;base64,' + cellValue.buffer + ' />';
                        else
                            cellValue = '';
                    }
                    else if (columns[meta.col].type == 'file') {
                        if(cellValue != "" && cellValue != null){
                            cellValue = '<a class="file" style="white-space: nowrap;" href="#" data-entity="' + currentEntity + '" data-value="' + cellValue + '" data-name="' + columns[meta.col].data + '"><i class="fa fa-download"></i>&nbsp;&nbsp;' + STR_LANGUAGE.download_file + '</a>';
                        } else
                            cellValue = '';
                    }
                    else if (columns[meta.col].type == 'filename') {
                        if(cellValue != "" && cellValue != null){
                            // Remove datatime + uuid (everything before the second _)
                            cellValue = cellValue.substring(cellValue.split('_', 2).join('_').length + 1);
                        } else
                            cellValue = '';
                    }
                    else if (columns[meta.col].type == 'url' && cellValue!=null)
                        cellValue = '<a target="_blank" href="'+cellValue+'">'+cellValue+'</a>';
                    else if (columns[meta.col].type == 'time' && cellValue != null){
                        if(cellValue.length == 8)
                            cellValue = cellValue.substring(0, cellValue.length - 3);
                    } else if (columns[meta.col].type == 'password'){
                        cellValue = '●●●●●●●●●';
                    } else if(columns[meta.col].type == 'text'){
                        if(cellValue && cellValue.length > 75){
                            var shortText = $.parseHTML(cellValue.slice(0, 75))[0].data ? $.parseHTML(cellValue.slice(0, 75))[0].data : $.parseHTML(cellValue.slice(0, 75))[0].innerHTML;
                            cellValue = "<span style='cursor: pointer;' class='np_text_modal'>" + shortText + "...<span style='display: none;'>" + cellValue + "</span></span>";
                        }
                    }
                }
                return cellValue;
            }
        };

        if(columns[i].type == "password"){
            objColumnDefToPush.searchable = false;
            objColumnDefToPush.orderable = false;
        }

        // Build columnsTypes. This will be added to ajax call and used sever-side in case of global search
        columnsTypes[columns[i].data] = columns[i].type || 'string';

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
    var table, columnSelectionVisible = false;
    var tableOptions = {
        "serverSide": true,
        "ajax": {
            "url": $(tableID, context).data('url'),
            "type": "POST",
            data: function(e) {
                // Used for global search
                e.columnsTypes = columnsTypes;
                return e;
            }
        },
        "responsive": true,
        "columns": columns,
        "columnDefs": columnDefs,
        "language": STR_LANGUAGE,
        "paging": doPagination,
        "dom": 'RlBfrtip',
        "stateSave": true,
        stateSaveCallback: function(settings, data) {
            var sizes = [], allZero = true;
            for (var i = 0; i < settings.aoColumns.length; i++) {
                var size = $(settings.aoColumns[i].nTh).width();
                if (size != 0)
                    allZero = false;
                sizes.push(size+'px');
            }
            if (!allZero)
                localStorage.setItem(tableID+'_columns_sizes', JSON.stringify(sizes));
        },
        stateLoadCallback: function(settings) {
            var sizes = JSON.parse(localStorage.getItem(tableID+'_columns_sizes'));
            if (!sizes)
                return;
            var allWidthZero = true;
            for (var i = 0; i < sizes.length; i++)
                if (sizes[i] != '0px')
                    allWidthZero = false;
            if (allWidthZero)
                return;
            for (var i = 0; i < settings.aoColumns.length; i++)
                if (sizes[i])
                    $(settings.aoColumns[i].nTh).width(sizes[i]);
        },
        "bLengthChange": true,
        "iDisplayLength": 25,
        "aLengthMenu": [[25, 50, 200, 500], [25, 50, 200, 500]],
        "bAutoWidth": false,
        "order": [ defaultOrder.idx, defaultOrder.direction ],
        "buttons": [
            {
                text: STR_LANGUAGE.choose_columns,
                action: function(e,dt,node,config) {
                    if ($("#columnSelector").length > 0)
                        $(node).next().remove();
                    else
                        $(node).after(generateColumnSelector(tableID, columns));
                }
            },
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
            },
            {
                text: '<i class="fa fa-refresh"></i>',
                titleAttr: STR_LANGUAGE.reset_filter,
                action: function ( e, dt, node, config ) {
                    localStorage.setItem("newmips_filter_save_" + tableID.substring(1), null);
                    location.reload();
                }
            },
            {
                text: '<i class="fa fa-arrow-right"></i>',
                titleAttr: STR_LANGUAGE.scroll_right,
                action: function ( e, dt, node, config ) {
                    $(tableID, context).parents(".table-responsive").animate({scrollLeft: $(tableID, context).width()}, 800);
                }
            }
        ]
    }
    table = $(tableID, context).DataTable(tableOptions);

    // Preview modal on type file
    $(tableID + ' tbody', context).on('click', 'td > .file', function () {
        var colIdx = table.cell($(this).parent()).index().column;
        if (typeof columns[colIdx] === 'undefined' || (columns[colIdx].type != 'file' && columns[colIdx].type != 'picture'))
            return;

        let downloadURL = '/default/download?entity=' + $(this).data('entity') + '&amp;f=' + encodeURIComponent($(this).data('value'));
        $.ajax({
            url: '/default/get_file',
            type: 'GET',
            data: {entity: $(this).data('entity'), src: $(this).data('value')},
            success: function (result) {

                var showHTML = '<p><img class="img img-responsive" src=data:image/;base64,' + result.data + ' alt=' + result.file + '/></p>';
                if(result.file.substring(result.file.length, result.file.length - 4) == '.pdf') {
                    var binaryPDF = generateFileViewer(result.data);
                    showHTML = '<iframe src=/js/plugins/pdf/web/viewer.html?file=' + encodeURIComponent(binaryPDF) + ' style="width:100%;min-height:500px !important;" allowfullscreen webkitallowfullscreen ></iframe>';
                }

                var modalHTML = '\
                <div class="modal fade" tabindex="-1" role="dialog">\
                    <div class="modal-dialog" role="document" style="width:60%;">\
                        <div class="modal-content">\
                            <div class="modal-header skin-blue-light">\
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
                                <h4 class="modal-title">' + result.file + '</h4>\
                            </div>\
                            <div class="modal-body">\
                                ' + showHTML + '\
                                <a href="' + downloadURL + '" class="btn btn-primary"><i class="fa fa-download"></i>&nbsp;&nbsp;Télécharger</a>\
                            </div>\
                            <div class="modal-footer">\
                            <button type="button" class="btn btn-danger" data-dismiss="modal">' + STR_LANGUAGE.close + '</button>\
                            </div>\
                        </div>\
                    </div>\
                </div>';

                $(modalHTML).modal('show');
            },
            error: function(err) {
                console.error(err);
            }
        });
    });

    var startFilterTimer = 0;
    // Bind search fields
    $(tableID + ' .filters th', context).each(function (idx) {
        var mainTh = $(this);
        var title = $(this).text();

        var currentField = mainTh.data('field');
        var val = getFilter(tableID.substring(1), currentField);
        var search = '<input type="text" class="form-control input" value="' + val + '" placeholder="' + title + '" />';

        function searchInDatalist(searchValue) {
            var valueObject = {type: '', value: ''};
            // Special data types re-formating for search
            if (typeof mainTh.data('type') !== 'undefined') {
                if (mainTh.data('type') == 'date') {
                    valueObject.type = 'date';
                    searchValue = lang_user == 'fr-FR' ? formatDateFR(mainTh.find("input").inputmask('unmaskedvalue')) : formatDateEN(mainTh.find("input").inputmask('unmaskedvalue'));
                }
                else if (mainTh.data('type') == 'time') {
                    valueObject.type = 'time';
                    searchValue = formatTime(mainTh.find("input").inputmask('unmaskedvalue'));
                }
                else if (mainTh.data('type') == 'datetime') {
                    valueObject.type = 'datetime';
                    searchValue = lang_user == 'fr-FR' ? formatDateTimeFR(mainTh.find("input").inputmask('unmaskedvalue')) : formatDateTimeEN(mainTh.find("input").inputmask('unmaskedvalue'));
                }
                else if (mainTh.data('type') == 'currency'){
                    valueObject.type = 'currency';
                }
                else if (mainTh.data('type') == 'boolean'){
                    valueObject.type = 'boolean';
                }
            }
            valueObject.value = searchValue;
            table.columns(idx).search(JSON.stringify(valueObject)).draw();
        }

        function filterSearch(el){
            var searchValue = typeof el.value === "undefined" ? $(el).val() : el.value;
            saveFilter(searchValue, el, $(el).parents("table").attr("id"), $(el).parent().attr("data-field"));

            // If search is empty, clear previous search and draw
            if (searchValue == "")
                return table.columns(idx).search('').draw();

            searchInDatalist(searchValue);
        }

        // If it's not an action button
        if (title != '') {
            if($(this).attr("data-hidden") == "1" || $(this).attr("data-show") == '0')
                $(this).hide();
            else {
                $(this).show().html('');
                $(search).appendTo(this).keyup(function () {
                    delay(filterSearch(this), 300);
                });

                // Initialize masks on filters inputs
                if (typeof mainTh.data('type') !== 'undefined') {

                    var datetimeMask = lang_user == 'fr-FR' ? "d/m/y h:s:s" : "y-m-d h:s:s";
                    var datetimePlaceholder = lang_user == 'fr-FR' ? "jj/mm/aaaa hh:mm:ss" : "yyyy-mm-dd hh:mm:ss";
                    var dateMask = lang_user == 'fr-FR' ? "dd/mm/yyyy" : "yyyy-mm-dd";

                    switch (mainTh.data('type')){

                        case 'datetime':
                            $(this).find("input").inputmask({
                                mask: datetimeMask,
                                placeholder: datetimePlaceholder,
                                alias: "datetime",
                                timeseparator: ":",
                                hourFormat: "24"
                            });
                            break;

                        case 'date':
                            $(this).find("input").inputmask({"alias": dateMask});
                            break;

                        case 'boolean':
                            $(this).find("input").replaceWith("\
                                <select data-type='boolean' style='width: 100% !important;' class='form-control input'>\
                                    <option value='' selected>"+STR_LANGUAGE.boolean_filter.all+"</option>\
                                    <option value='null'>"+STR_LANGUAGE.boolean_filter.null+"</option>\
                                    <option value='checked'>"+STR_LANGUAGE.boolean_filter.checked+"</option>\
                                    <option value='unchecked'>"+STR_LANGUAGE.boolean_filter.unchecked+"</option>\
                                </select>");
                            if(val != "")
                                $(this).find("select").val(val);
                            $(this).find("select").on("change", function(){filterSearch(this)});
                    }

                    if (mainTh.data('type') == 'time'){
                        $(this).find("input").inputmask({
                            mask: "h:s:s",
                            placeholder: "hh:mm:ss",
                            separator: "-"
                        });
                    }
                }
            }
        }
        if (val != "") {
            // Delay each save filter triggering in order to work properly
            startFilterTimer += 500;
            setTimeout(function(){
                searchInDatalist(val);
            }, startFilterTimer);
        }
    });
    $(tableID).show();
}

$(function () {
    $(".dataTable").each(function () {
        init_datatable('#' + $(this).attr('id'));
    });

    // Datalist JS

    /* Make the table horizontaly scrollable with mouse drag on it */
    var x,y,top,left = 0,down;
    /* If we are scrolling horizontaly the datalist then don't trigger the click event to go on the show */
    var scrolling = false;

    $("tbody").css("cursor", "pointer");

    $("tbody").mousedown(function(e){
        if(!e.ctrlKey){
            e.preventDefault();
            down=true;
            x=e.pageX;
            left=$(".table-responsive").scrollLeft();
        }
    });

    $("tbody").mousemove(function(e){
        if(down){
            scrolling = true;
            var newX=e.pageX;
            $(".table-responsive").scrollLeft(left-newX+x);
        }
    });

    $("tbody").mouseup(function(e){down=false;setTimeout(function(){scrolling = false;}, 500);});
    $("tbody").mouseleave(function(e){down=false;setTimeout(function(){scrolling = false;}, 500);});

    $('tbody').on('click', 'tr', function (e) {
        if(!e.ctrlKey){
            if ($(this).find('.dataTables_empty').length > 0 ||
                $(e.target).hasClass("btn-danger") ||
                $(e.target).parents("button.btn-danger").length != 0 ||
                $(e.target).hasClass("np_text_modal") ||
                $(e.target).is("img") ||
                $(e.target).hasClass("file"))
                return;
            if(!scrolling && $(this).find('td > a.btn-show:first').length > 0)
                window.location = $(this).find('td > a.btn-show:first').attr('href');
        }
    });

    // Text modal in datalist
    $(document).on('click', '.np_text_modal', function(){
        doModal('Contenu', $(this).find('span').html());
    });
});