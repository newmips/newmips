//
// UTILS
//

// Check if a string has a valid JSON syntax to parse it
function isValidJSON(string) {
    if (/^[\],:{}\s]*$/.test(string.replace(/\\["\\\/bfnrtu]/g, '@')
            .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
            .replace(/(?:^|:|,)(?:\s*\[)+/g, '')))
        return true;
    else
        return false;
}

// Server side you can:
// Show an error message: return res.status(500).send("My Error Message");
// Show multiple message: return res.status(500).send([{message: "Message One",level: "warning"}, {message: "Message Two",level: "error"}, ...]);
// You can also force the page to refresh like this: return res.status(500).send({refresh: true});
function handleError(error, par2, par3) {
    try {
        if(isValidJSON(error.responseText)){
            var errorObj = JSON.parse(error.responseText);
            if(errorObj.refresh)
                return location.reload();
            if (errorObj instanceof Array) {
                for (var i = 0; i < errorObj.length; i++)
                    toastr[errorObj[i].level](errorObj[i].message);
            }
            else
                toastr.error(error.responseText);
        } else {
            if(typeof error.responseText === "string")
                return toastr.error(error.responseText);
        }
    } catch(e) {
        if(error.statusText == "timeout"){
            toastr.error("Server timedout");
        }
        console.error(error, par2, par3);
    }
}

function firstElementFocus(tab, idx) {
    if(!idx)
        idx = 0;
    var element = $(".form-group:eq("+idx+") label:eq(0)", tab).next().focus();
    if ((element && (element.prop('disabled') == true || element.prop('readonly') == true))
    && ($(".form-group", tab).length > 0 && idx <= $(".form-group", tab).length))
        firstElementFocus(idx+1);
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

function reloadTab(tab) {
    $('#'+tab.attr('id')+'-click').click();
}

function select2_fieldset(select, data) {
    var searchField = [];
    if (data.option.usingField && data.option.usingField.length)
        for (var i = 0; i < data.option.usingField.length; i++)
            searchField.push(data.option.usingField[i].value);
    if (searchField.length == 0)
        searchField.push('id');

    select.select2({
        ajax: {
            url: '/'+data.option.target.substring(2)+'/search',
            dataType: 'json',
            method: 'POST',
            delay: 250,
            contentType: "application/json",
            data: function (params) {
                var customwhere = {};
                customwhere[data.option.foreignKey] = null;
                var ajaxdata = {
                    search: params.term,
                    page: params.page || 1,
                    searchField: searchField,
                    customwhere: customwhere
                };
                return JSON.stringify(ajaxdata);
            },
            processResults: function (answer, params) {
                var dataResults = answer.rows;
                if (!dataResults)
                    return {results: []};
                var results = [];
                for (var i = 0; i < dataResults.length; i++) {
                    var text = [];
                    for (var field in dataResults[i]) {
                        if (searchField.indexOf(field) != -1) {
                            if (dataResults[i][field] != null)
                                text.push(dataResults[i][field]);
                        }
                    }
                    text = text.join(' - ');
                    if (text == "" || text == null)
                        text = dataResults[i].id;

                    results.push({id: dataResults[i].id, text: text});
                }

                return {
                    results: results,
                    pagination: {more: answer.more}
                };
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

// Handle form submition and tab reload
function ajaxForm(form, tab) {
    form.on('submit', function(e) {
        form.find("button[type='submit']").text(LOADING_TEXT).attr("disabled", true);

        // Prevent multiple submittion (double click)
        if (form.data('submitting') === true)
            return e.preventDefault();
        form.data('submitting', true);
        if (!validateForm(form)) {
            form.data('submitting', false);
            return false;
        }
        $.ajax({
            url: $(this).attr('action')+'?ajax=true',
            method: 'post',
            data: $(this).serialize()+'&'+buildAssociationHref(tab).substring(1),
            success: function(htmlForm) {
                tab.find('.ajax-form').remove();
                tab.find('.ajax-content').show();
                reloadTab(tab);
            },
            error: handleError,
            timeout: 15000
        });
        return false;
    });
}

// function bindFieldsetForm(tab, data) {
//     tab.find('.fieldsetform').each(function() {
//         $(this).submit(function() {
//             var alias = $(this).parents('.tab-pane').attr('id');
//             var url = '/'+data.sourceName+'/fieldset/'+alias+'/remove?ajax=true';
//             var reqData = $(this).serialize();
//             reqData += '&idEntity='+data.sourceId;
//             console.log(alias);
//             console.log(url);
//             console.log(reqData);
//             alert('Fieldsetform');
//             var form = this;
//             $.ajax({
//                 url: url,
//                 method: 'post',
//                 data: reqData,
//                 success:function() {
//                     reloadTab(tab);
//                 },
//                 error: handleError
//             });
//             return false;
//         });
//     });
// }

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
    tab.find('.ajax-content').html(data.empty == true ? EMPTY+'<br><br>' : $(data.content).find("#home").length?$(data.content).find("#home"):data.content);
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
        tab.find('a:not(.status)').each(function() {
            if (typeof $(this).data('href') !== "undefined" && $(this).data('href').indexOf('/set_status/') != -1)
                $(this).addClass('ajax');
        });
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

    var sourceUrl = tab.data('asso-source').substring(2);
    var targetUrl = data.option.target.substring(2);
    var doPagination = data.option.relation == 'belongsToMany' ? false : true;

    var table = tab.find('table');
    if (!data.option.noCreateBtn) {
        var newButton = $(CREATE_BUTTON);
        newButton.attr('data-href', '/'+data.option.target.substring(2)+'/create_form'+buildAssociationHref(tab));
        tab.find('.ajax-content').append("<br>").append(newButton);

        // Define update/delete button to be used by DataList plugin
        DATALIST_BUTTONS = [{
            render: function(data2, type, row) {
                var aTag = '\
                <a class="ajax btn btn-warning" data-id="'+row['id']+'" data-href="/'+targetUrl+'/update_form'+buildAssociationHref(tab)+'&id='+row['id']+'">\
                    <i class="fa fa-pencil fa-md">&nbsp;&nbsp;</i>\
                    <span>'+UPDATE_TEXT+'</span>\
                </a>';
                return aTag;
            }
        }, {
            render: function(data2, type, row) {
                var form = '\
                <form action="/'+targetUrl+'/delete" class="ajax" method="post">\
                    <button class="btn btn-danger btn-confirm"><i class="fa fa-trash-o fa-md">&nbsp;&nbsp;</i>\
                        <span>'+DELETE_TEXT+'</span>\
                        <input name="id" value="'+row['id']+'" type="hidden"/>\
                    </button>\
                </form>';
                return form;
            }
        }];
    }

    // Set subdatalist url and subentity to table
    var tableUrl = '/'+sourceUrl+'/subdatalist?subentityAlias='+tab.data('asso-alias')+'&subentityModel='+data.option.target+'&sourceId='+tab.data('asso-flag')+'&paginate='+doPagination;
    table.data('url', tableUrl);

    // DataTable
    init_datatable('#'+table.attr('id'), doPagination, tab);
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

    var table = tab.find('table');
    table.find('.filters').remove();

    // Set subdatalist url and subentity to table
    var tableUrl = '/'+tab.data('asso-source').substring(2)+'/subdatalist?subentityAlias='+tab.data('asso-alias')+'&subentityModel='+data.option.target+'&sourceId='+tab.data('asso-flag');
    table.data('url', tableUrl);
    // Define update/delete button to be used by DataList plugin
    DATALIST_BUTTONS = [{
        render: function (data2, type, row) {
            var aTag = '\
                <a class="btn-show" href="/'+data.option.target.substring(2)+'/show?id='+row['id']+'">\
                    <button class="btn btn-primary">\
                        <i class="fa fa-desktop fa-md">&nbsp;&nbsp;</i>\
                        <span>'+SHOW_TEXT+'</span>\
                    </button>\
                </a>';
            return aTag;
        },
        searchable: false
    }, {
        render: function(data2, type, row) {
            var url = '/'+data.sourceName+'/fieldset/'+data.option.as+'/remove?ajax=true'
            var form = '\
                <form action="'+url+'" class="fieldsetform" method="post">\
                    <input type="hidden" value="'+row['id']+'" name="idRemove">\
                    <input type="hidden" value="'+data.sourceId+'" name="idEntity">\
                    <button type="submit" class="btn btn-danger btn-confirm"><i class="fa fa-times fa-md"></i>&nbsp;<span>'+REMOVE_TEXT+'</span></button>\
                </form>';
            return form;
        }
    }];

    init_datatable('#'+table.attr('id'), true, tab);

    // bindFieldsetForm(tab, data);
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
        $(this).attr('id', $(this).attr('id')+'_print');
        simpleTable($(this));
    });
    initPrint();
}

// INITIALIZE
$(function() {
    // Tab click, load and bind tab content
    $(".nav-tabs > li > a").click(function() {
        if ($(this).attr('href') == '#home')
            return location.hash = 'home';

        var tab = $($(this).attr('href'));

        // Set tab hash to URL
        location.hash = tab.attr('id');
        // Not ajax tab, don't bind anything
        if (!tab.hasClass('ajax-tab'))
            return;

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

                // Clear tab content
                tab.find('.ajax-content').html('');
                // Clear potential datalist buttons
                DATALIST_BUTTONS = [];
                // Set data-target to tab so document.delegate on a.ajax/form.ajax can use it
                tab.data('target', data.option.target);

                // Build tab content
                if (data.option.structureType == 'hasOne') {
                    initHasOne(tab, data);
                    bindStatusComment(tab);
                }
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
            },
            error: function(pa1, pa2, pa3) {
                if (pa1.status == 404)
                    return toastr.error('Unable to find '+subentityAlias);
                console.error(pa1, pa2, pa3);
                tab.find('.ajax-content').html('<div style="width:100%;text-align:center;"><i class="fa fa-exclamation-circle fa-3x" style="color:#ff3333;margin-top: 100px;margin-bottom: 100px;"></i></div>');
            }
        });
    });

    // Load a create or update form. Bind buttons (create/update)
    $(document).delegate('a.ajax','click', function(e) {
        // Don't reload page
        e.stopPropagation();
        // Don't change URL hash
        e.preventDefault();
        var element = $(this);
        var href = element.data('href') || element.attr('href');
        var id = element.data('id');
        var tab = element.parents('.ajax-tab');
        var target = tab.data('target').substring(2);
        $.ajax({
            url: href,
            success: function(formContent) {
                if (href.indexOf('/set_status/') != -1)
                    return reloadTab(tab);
                var isCreate = href.indexOf('update_form') != -1 ? false : true;
                var action, idInput = '', button = '';
                var cancel = '<button type="button" class="btn btn-default cancel" style="margin-right:10px;">'+CANCEL_TEXT+'</button>';
                var button = '<button type="submit" class="btn btn-primary"><i class="fa fa-floppy-o fa-md">&nbsp;&nbsp;</i>'+SAVE_TEXT+'</button>';
                if (isCreate)
                    action = '/'+target+'/create';
                else if (!isCreate) {
                    idInput = '<input type="hidden" name="id" value="'+id+'">';
                    action = '/'+target+'/update';
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
                ajaxForm(formWrapper.find('form'), tab);
                firstElementFocus(tab.find('.ajax-form'));
            },
            error: handleError
        });
    });

    // Bind ajax form validation and tab reload after submit (ex: delete form)
    $(document).delegate('form.ajax', 'submit', function(e) {
        if (!validateForm($(this)))
            return false;

        var tab = $(this).parents('.ajax-tab');
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

    $(document).delegate('.fieldsetform', 'submit', function() {
        var alias = $(this).parents('.tab-pane').attr('id');
        var tab = $(this).parents('.ajax-tab');
        var url = $(this).attr('action');
        var reqData = $(this).serialize();
        $.ajax({
            url: url,
            method: 'post',
            data: reqData,
            success:function() {
                console.log("FIELDSET REMOVED");
                reloadTab(tab);
            },
            error: handleError
        });
        return false;
    });

    /* Check url to go on tabs */
    var url = document.location.toString();
    if (url.match('#')) {
        $("#" + url.split('#')[1] + "-click").trigger("click");
        $("html, body").animate({ scrollTop: 0 }, "fast");
    }
});