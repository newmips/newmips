// Datatable throw error instead of alert
$.fn.dataTable.ext.errMode = 'throw';

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

// Dive through the object to find the key we are looking for
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

function widgetDataTable(table) {
    // Fetch columns from html
    var columns = [], defaultOrder = {idx: 0, direction: 'DESC'};
    table.find('th').each(function (idx) {
        if (typeof $(this).data('col') !== 'undefined'){
            if($(this).data("hidden") == "1")
                columns.push({data: $(this).data('col'), type: $(this).data('type'), hidden: true});
            else
                columns.push({data: $(this).data('col'), type: $(this).data('type'), hidden: false});

            // Look for default order on field. Presence of `data-default-order` gives the index, value gives direction. Ex: <th data-default-order="ASC">
            if ($(this).data('default-order')) {
                defaultOrder.idx = idx;
                defaultOrder.direction = $(this).data('default-order');
            }
        }
    });

    // Columns rendering
    var columnsTypes = {};
    var columnDefs = [];
    for (var i = 0; i < columns.length; i++) {
        var objColumnDefToPush = {};
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
                        cellValue = '<span class="badge" style="background: '+statusObj.f_color+';">'+statusObj.f_name+'</span>';
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
                    else if (columns[meta.col].type == 'file') {
                        if(cellValue != "" && cellValue != null){
                            // Get current entity by splitting current table id
                            var currentEntity = tableID.split("#table_")[1];
                            var justFilename = cellValue.replace(cellValue.split("_")[0], "").substring(1);
                            // Remove uuid
                            if(justFilename[32] == '_')
                                justFilename = justFilename.substring(33);
                            cellValue = '<a href="/default/download?entity='+currentEntity+'&amp;f='+encodeURIComponent(cellValue)+'" name="'+columns[meta.col].data+'">'+justFilename+'</a>';
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

        columnDefs.push(objColumnDefToPush);
    }

    // Init DataTable
    var tableUrl = table.data('url') ? table.data('url') : '/'+table.data('entity').substring(2)+'/datalist';
    var tableLength = parseInt(table.data('limit'));
    var tableOptions = {
        "serverSide": true,
        "ajax": {
            "url": tableUrl,
            "type": "POST",
            data: function(e) {
                // Used for global search
                e.columnsTypes = columnsTypes;
                // Last record widget is always order on ID, this will be usefull to set order in sequelize request
                e.widgetType = table.parents('[data-widget-type]').attr('data-widget-type');
                return e;
            }
        },
        "responsive": true,
        "columns": columns,
        "columnDefs": columnDefs,
        "language": STR_LANGUAGE,
        "dom": '',
        "bLengthChange": false,
        "iDisplayLength": tableLength,
        "bAutoWidth": false,
        "order": [ defaultOrder.idx, defaultOrder.direction ]
    }
    var dataTable = table.DataTable(tableOptions);

    // Make row redirect to show on click
    var entityName = table.data('entity').substring(2);
    $(table).on('click', 'tr', function() {
        var rowId = parseInt(dataTable.row(this).data().id);
        location.href = '/'+entityName+'/show?id='+rowId;
    });
}

function buildPieChart(widgetID, widget) {
    var widgetCanvas = $("#"+widgetID+" .piechart")[0];
    var legend = $("#"+widgetID).data('legend');

    // No data, show default text
    if (widget.data.data.length == 0)
        return $(widgetCanvas).prev().show();
    // Status have their own color. Generate color palette for regular fields
    var colors = widget.data.backgroundColor || palette('tol-rainbow', widget.data.labels.length).map(function(el){return '#'+el;});
    new Chart(widgetCanvas, {
        type: 'doughnut',
        options: {
            legend: {
                display: legend,
                position: 'right'
            }
        },
        data: {
            labels: widget.data.labels,
            datasets: [{
                data: widget.data.data,
                backgroundColor: colors
            }]
        }
    });
}

function initWidgets() {
    $(".widget-lastrecords").each(function() {
        widgetDataTable($(this));
    });

    var widgetsInfo = [];
    $(".ajax-widget").each(function() {
        var widget = {
            entity: $(this).data('entity'),
            type: $(this).data('widget-type'),
            widgetID: $(this).attr('id')
        };
        if (widget.type && widget.type == 'piechart') {
            widget.fieldType = $(this).data('field-type');
            widget.field = $(this).data('field');
        }
        widgetsInfo.push(widget);
    });

    if (widgetsInfo.length)
        $.ajax({
            url: '/default/widgets',
            method: 'post',
            data: {widgets: widgetsInfo},
            success: function(data) {
                for (var widgetID in data) {
                    var widget = data[widgetID];
                    if (widget.type == 'info')
                        $('#'+widgetID).find('.info-box-number').text(widget.data);
                    else if (widget.type == 'stats')
                        $('#'+widgetID).find('h3').text(widget.data);
                    else if (widget.type == 'piechart')
                        buildPieChart(widgetID, widget);
                }
            }
        });
}