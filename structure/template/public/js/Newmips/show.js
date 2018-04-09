//
// UTILS
//
function handleError(error, par2, par3) {
    try {
        var toastrAr = JSON.parse(error.responseText);
        if (toastrAr instanceof Array) {
            for (var i = 0; i < toastrAr.length; i++)
                toastr[toastrAr[i].level](toastrAr[i].message);
        }
        else
            toastr.error(error.responseText);
    } catch(e) {
        console.error(error, par2, par3);
    }
}

function buildAssociationHref(tab) {
    var associationData = {
        associationAlias: tab.data('asso-alias'),
        associationForeignKey: tab.data('asso-foreignkey'),
        associationFlag: tab.data('asso-flag'),
        associationSource: tab.data('asso-source'),
        associationUrl: tab.data('asso-url')
    };
    var href = '?';
    for (var prop in associationData)
        href += prop+'='+associationData[prop]+'&';
    return href+'ajax=true';
}

function bindFieldsetForm(tab, data) {
    tab.find('.fieldsetform').each(function() {
        $(this).submit(function() {
            var alias = $(this).parents('.tab-pane').attr('id');
            var url = '/'+data.sourceName+'/fieldset/'+alias+'/remove?ajax=true';
            var reqData = $(this).serialize();
            reqData += '&idEntity='+data.sourceId;
            var form = this;
            $.ajax({
                url: url,
                method: 'post',
                data: reqData,
                success:function() {
                    /* tables is a global var comming from simpleTable.js */
                    tables[$(form).parents('table').attr('id')].row($(form).parents('tr')).remove().draw();
                },
                error: handleError
            });
            return false;
        });
    });
}

function reloadTab(tab) {
    $('#'+tab.attr('id')+'-click').click();
}

function select2_fieldset(select, data) {
    var searchField = data.option.usingField || ['id'];
    select.select2({
        ajax: {
            url: '/'+data.option.target.substring(2)+'/search',
            dataType: 'json',
            method: 'POST',
            delay: 250,
            contentType: "application/json",
            data: function (params) {
                var customWhere = {};
                customWhere[data.option.foreignKey] = null;
                var ajaxdata = {
                    search: params.term,
                    searchField: searchField,
                    customWhere: customWhere
                };
                return JSON.stringify(ajaxdata);
            },
            processResults: function (dataResults, params) {
                if (!dataResults)
                    return {results: []};
                var results = [];
                for (var i = 0; i < dataResults.length; i++){
                    var text = "";
                    for (var field in dataResults[i]){
                        if(searchField.indexOf(field) != -1){
                            if(dataResults[i][field] != null)
                                text += dataResults[i][field] + " - ";
                        }
                    }
                    text = text.substring(0, text.length - 3);
                    if(text == "" || text == null)
                        text = dataResults[i].id;

                    results.push({id: dataResults[i].id, text: text});
                }
                return {results: results};
            },
            cache: true
        },
        minimumInputLength: 0,
        escapeMarkup: function (markup) {
            return markup;
        },
        templateResult: function (data) {
            return data.text;
        }
    });
}

function bindTabActions(tab, data) {
    // Handle form submition and tab reload
    function ajaxForm(form) {
        form.on('submit', function(e) {
            if (!validateForm(form))
                return false;
            $.ajax({
                url: $(this).attr('action')+'?ajax=true',
                method: 'post',
                data: $(this).serialize()+'&'+buildAssociationHref(tab).substring(1),
                success: function(htmlForm) {
                    tab.find('.ajax-form').remove();
                    tab.find('.ajax-content').show();
                    reloadTab(tab);
                },
                error: handleError
            });
            return false;
        });
    }

    // Load a create or update form. Bind buttons (create/update)
    tab.find('a.ajax').click(function(e) {
        // Don't reload page
        e.stopPropagation();
        // Don't change URL hash
        e.preventDefault();
        var href = $(this).data('href');
        var id = $(this).data('id');
        $.ajax({
            url: href,
            success: function(formContent) {
                var isCreate = href.indexOf('update_form') != -1 ? false : true;
                var action, idInput = '', button = '';
                var cancel = '<button class="btn btn-default cancel" style="margin-right:10px;">'+CANCEL_TEXT+'</button>';
                if (isCreate) {
                    action = '/'+data.option.target.substring(2)+'/create';
                    button = '<button type="submit" class="btn btn-success"><i class="fa fa-plus fa-md">&nbsp;&nbsp;</i>'+CREATE_TEXT+'</button>';
                }
                else if (!isCreate) {
                    idInput = '<input type="hidden" name="id" value="'+id+'">';
                    action = '/'+data.option.target.substring(2)+'/update';
                    button = '<button type="submit" class="btn btn-primary"><i class="fa fa-pencil fa-md">&nbsp;&nbsp;</i>'+SAVE_TEXT+'</button>';
                }
                else
                    return reloadTab(tab);

                // Add form to tab. Put content after .ajax-content to be able to
                // get back to tab original view after cancel button click
                var formWrapper = $('<div class="ajax-form" style="display:none;"><form action="'+action+'" method="post">'+formContent+'</form></div>');
                formWrapper.find('form').append(idInput+cancel+button);
                formWrapper.find('.cancel').click(function() {
                    tab.find('.ajax-form').slideUp().remove();
                    tab.find('.ajax-content').slideDown();
                });
                tab.find('.ajax-content').slideUp()
                tab.find('.ajax-content').after(formWrapper);
                tab.find('.ajax-form').slideDown();
                initForm(tab);
                ajaxForm(formWrapper.find('form'));
            },
            error: handleError
        });
    });
    // Bind each new form
    tab.find('form:not(".fieldsetform"):not(".componentFileDownloadForm")').each(function(){
        ajaxForm($(this));
    });
}

function currencyFormat(num) {
    if(num != null)
        return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ");
    else
        return "";
}

//
// TABS INIT
//
// HAS ONE
function initHasOne(tab, data) {
    var associationHref = buildAssociationHref(tab);
    // Set new content
    tab.find('.ajax-content').html(data.empty == true ? EMPTY+'<br><br>' : data.content);
    // Delete buttons from original view
    tab.find('.quicklinks').remove();

    var newButton, href= '/'+data.option.target.substring(2);
    // EMPTY: Set empty text, add create button
    if (data.empty) {
        newButton = $(CREATE_BUTTON);
        newButton.attr('data-href', href+'/create_form'+associationHref);
    }
    // NOT EMPTY: Set content, add update/delete button
    else {
        var updBtn = $(UPDATE_BUTTON);
        updBtn.attr('data-href', href+'/update_form'+associationHref+'&id='+data.data);
        updBtn.attr('data-id', data.data);

        var delForm = $(DELETE_FORM);
        delForm.attr('action', '/'+data.option.target.substring(2)+'/delete');
        delForm.find('input[name=id]').val(data.data);

        delForm.prepend(updBtn);
        newButton = $('<div class="quicklinks"></div>');
        newButton.append(delForm);
    }

    tab.find('.ajax-content').append(newButton);
}

// HAS MANY
function initHasMany(tab, data) {
    tab.find('.ajax-content').html(data.content);
    var newButton = $(CREATE_BUTTON);
    newButton.attr('data-href', '/'+data.option.target.substring(2)+'/create_form'+buildAssociationHref(tab));
    tab.find('.ajax-content').append("<br>").append(newButton);
    tab.find('table').find('.filters').remove();

    var table = tab.find('table');
    simpleTable(table);

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

    // Value formatting

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

// HAS MANY PRESET
function initHasManyPreset(tab, data) {
    // Init select2 ajax for fieldset
    var fieldsetForm = $(FIELDSET_SELECT);
    fieldsetForm.attr('action', '/'+data.sourceName+'/fieldset/'+data.option.as+'/add');
    tab.find('.ajax-content').html(fieldsetForm);

    // Select2 search for fieldset
    select2_fieldset(tab.find('select:eq(0)'), data);

    // Display list
    tab.find('.ajax-content').append(data.content);
    tab.find('table').find('.filters').remove();

    // Apply simpleTable on list
    simpleTable(tab.find('table'));

    bindFieldsetForm(tab, data);
}

// LOCAL FILE STORAGE
function initLocalFileStorage(tab, data) {
    tab.find('.ajax-content').html(data.content);
    initDropZone(tab);
    // Apply simpleTable on list
    simpleTable(tab.find('table'));
}

// PRINT
function initPrintTab(tab, data) {
    tab.find('.ajax-content').html(data.content);
    tab.find('.filters').remove();
    tab.find('table').each(function(){
        simpleTable($(this));
    });
    initForm(tab);
    initPrint();
}

// INITIALIZE
$(function() {
    // Tab click, load and bind tab content
    $(".nav-tabs > li > a").click(function() {
        if ($(this).attr('href') == '#home')
            return location.hash = 'home';
        var tab = $($(this).attr('href'));
        var id = $("input[name=sourceId]").val();
        var source = $("input[name=sourceName]").val().substring(2);
        var subentityAlias = tab.prop('id');

        // Build url. Special url for print tab
        var url = tab.data('tabtype') == 'print'
            ? '/default/print/'+source+'/'+id
            : '/'+source+'/loadtab/'+id+'/'+subentityAlias+buildAssociationHref(tab);

        // Loading icon until ajax callback
        tab.find('.ajax-content').html('<div style="width:100%;text-align:center;"><i class="fa fa-circle-o-notch fa-spin fa-3x" style="color:#ABABAB;margin-top: 100px;margin-bottom: 100px;"></i></div>');
        $.ajax({
            url: url,
            success: function(data) {
                data.sourceId = id;
                data.sourceName = source;

                // Set tab hash to URL
                location.hash = tab.attr('id');

                // Clear tab content
                tab.find('.ajax-content').html('');

                // Build tab content
                if (data.option.structureType == 'hasOne')
                    initHasOne(tab, data);
                else if (data.option.structureType == 'hasMany')
                    initHasMany(tab, data);
                else if (data.option.structureType == 'hasManyPreset')
                    initHasManyPreset(tab, data);
                else if (data.option.structureType == 'localfilestorage')
                    initLocalFileStorage(tab, data);
                else if (data.option.structureType == 'print')
                    initPrintTab(tab, data);
                else
                    console.error("Bad structureType in option");

                // Init form and td
                initForm(tab);
                // Bind tab actions
                bindTabActions(tab, data);
            },
            error: function(pa1, pa2, pa3) {
                if (pa1.status == 404)
                    return toastr.error('Unable to find '+subentityAlias);
                console.error(pa1, pa2, pa3);
                tab.find('.ajax-content').html('<i class="fa fa-exclamation-triangle fa-3x" style="color:red;margin-left: 150px; margin-top: 50px;"></i>');
            }
        });
    });

    /* Check url to go on tabs */
    var url = document.location.toString();
    if (url.match('#')) {
        $("#" + url.split('#')[1] + "-click").trigger("click");
        $("html, body").animate({ scrollTop: 0 }, "fast");
    }
});