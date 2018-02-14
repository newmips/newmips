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

function select2_ajaxsearch(select, data) {
    var searchField = data.option.usingField || ['id'];
    select.select2({
        ajax: {
            url: '/'+data.option.target.substring(2)+'/search',
            dataType: 'json',
            method: 'POST',
            delay: 250,
            contentType: "application/json",
            data: function (params) {
                var ajaxdata = {
                    search: params.term,
                    searchField: searchField
                };
                return JSON.stringify(ajaxdata);
            },
            processResults: function (dataResults, params) {
                if (!dataResults)
                    return {results: []};
                var results = [];
                for (var i = 0; i < dataResults.length; i++)
                    results.push({id: dataResults[i].id, text: dataResults[i][searchField[0].toLowerCase()]});
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

function bindTabActions(tab, data) {
    // Handle form submition and tab reload
    function ajaxForm(form) {
        form.on('submit', function(e) {
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
        e.stopPropagation();
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
    tab.find('form:not(.fieldsetform.componentFileDownloadForm)').each(function(){
        ajaxForm($(this));
    });
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
    tab.find('.ajax-content').append(newButton);
    tab.find('table').find('.filters').remove();

    simpleTable(tab.find('table'));
}

// HAS MANY PRESET
function initHasManyPreset(tab, data) {
    // Init select2 ajax for fieldset
    var fieldsetForm = $(FIELDSET_SELECT);
    fieldsetForm.attr('action', '/'+data.sourceName+'/fieldset/'+data.option.as+'/add');
    tab.find('.ajax-content').html(fieldsetForm);

    // Select2 search for fieldset
    select2_ajaxsearch(tab.find('select:eq(0)'), data);

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
        $.ajax({
            url: '/'+source+'/loadtab/'+id+'/'+subentityAlias+buildAssociationHref(tab),
            success: function(data) {
                location.hash = tab.attr('id');
                tab.find('.ajax-content').html('');
                data.sourceId = id;
                data.sourceName = source;

                // Build tab content
                if (data.option.structureType == 'hasOne')
                    initHasOne(tab, data);
                else if (data.option.structureType == 'hasMany')
                    initHasMany(tab, data);
                else if (data.option.structureType == 'hasManyPreset')
                    initHasManyPreset(tab, data);
                else if (data.option.structureType == 'localfilestorage')
                    initLocalFileStorage(tab, data);
                else
                    console.error("Bad structureType in option");

                // Bind tab actions
                bindTabActions(tab, data);
            },
            error: function(pa1, pa2, pa3) {
                if (pa1.status == 404)
                    return toastr.error('Unable to find '+subentityAlias);
                console.error(pa1, pa2, pa3);
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