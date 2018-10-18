var insertionHandler = {
    field: {
        displaySelector: function(label) {
            var entity = $("select[name=f_target_entity]").find('option:selected').val();
            if (!entity)
                return toastr.warning('Aucune entité n\'est ciblé');

            $.ajax({
                url: '/media/entity_tree/'+entity,
                success: function(entityTree) {
                    /* Create select  and options */
                    var fieldSelect = '<select style="float:left;" class="fieldInsertion" name="insertionSelect" data-type="field">';
                    fieldSelect += '<option value="-1">'+CHOOSE_FIELD+'</option>';
                    for (var i = 0; i < entityTree.length; i++)
                        fieldSelect += '<option value="'+entityTree[i].codename+'">'+entityTree[i].traduction+'</option>';
                    fieldSelect += '</select>';

                    $(fieldSelect).appendTo(label).css('width', '230px').select2();
                }
            });
        },
        insertValue: function(data) {
            return "{field|"+data.id+"}";
        }
    },
    group: {
        displaySelector: function(label) {
            var groupSelect = '<select style="float:left;" class="ajax form-control" data-type="group" name="insertionSelect" data-source="group" data-using="f_label"></select>';
            $(groupSelect).appendTo(label).css('width', '230px');
            select2_ajaxsearch(label.find('select'), CHOOSE_GROUP);
        },
        insertValue: function(data) {
            return "{group|"+data.text+"|"+data.id+"}";
        }
    },
    user: {
        displaySelector: function(label) {
            var groupSelect = '<select style="float:left;" class="ajax form-control" data-type="user" name="insertionSelect" data-source="user" data-using="f_login,f_email"></select>';
            $(groupSelect).appendTo(label).css('width', '230px');
            select2_ajaxsearch(label.find('select'), CHOOSE_USER);
        },
        insertValue: function(data) {
            return "{user|"+data.text+"|"+data.id+"}";
        }
    },
    user_target: {
        displaySelector: function(label) {
            var entity = $("select[name=f_target_entity]").find('option:selected').val();
            if (!entity)
                return toastr.warning('Aucune entité n\'est ciblé');

            $.ajax({
                url: '/media/user_tree/'+entity,
                success: function(userTree) {
                    /* Create select  and options */
                    var fieldSelect = '<select style="float:left;" class="emailFieldInsertion" name="insertionSelect" data-type="user_target">';
                    fieldSelect += '<option value="-1">'+CHOOSE_USER_TARGET+'</option>';
                    for (var i = 0; i < userTree.length; i++)
                        fieldSelect += '<option value="'+userTree[i].field+'">'+userTree[i].traduction+'</option>';
                    fieldSelect += '</select>';

                    $(fieldSelect).appendTo(label).css('width', '230px').select2();
                }
            });
        },
        insertValue: function(data) {
            var userPath = data.id;
            // Remove first and last char being `{` and `}`
            userPath = data.id.substring(1, data.id.length-1);
            return "{user_target|"+data.text+"|"+userPath+"}";
        }
    },
    phone_field: {
        displaySelector: function(label) {
            var entity = $("select[name=f_target_entity]").find('option:selected').val();
            if (!entity)
                return toastr.warning('Aucune entité n\'est ciblé');

            $.ajax({
                url: '/media/entity_full_tree/'+entity,
                success: function(phoneTree) {
                    /* Create select  and options */
                    var fieldSelect = '<select style="float:left;" class="phoneFieldInsertion" name="insertionSelect" data-type="phone_field">';
                    fieldSelect += '<option value="-1">'+CHOOSE_PHONE_FIELD+'</option>';
                    for (var i = 0; i < phoneTree.length; i++)
                        if (phoneTree[i].isPhone)
                            fieldSelect += '<option value="'+phoneTree[i].codename+'">'+phoneTree[i].traduction+'</option>';
                    fieldSelect += '</select>';

                    $(fieldSelect).appendTo(label).css('width', '230px').select2();
                }
            });
        },
        insertValue: function(data) {
            return "{phone_field|"+data.id+"}";
        }
    },
    email_field: {
        displaySelector: function(label) {
            var entity = $("select[name=f_target_entity]").find('option:selected').val();
            if (!entity)
                return toastr.warning('Aucune entité n\'est ciblé');

            $.ajax({
                url: '/media/entity_full_tree/'+entity,
                success: function(entityTree) {
                    /* Create select  and options */
                    var fieldSelect = '<select style="float:left;" class="emailFieldInsertion" name="insertionSelect" data-type="email_field">';
                    fieldSelect += '<option value="-1">'+CHOOSE_MAIL_FIELD+'</option>';
                    for (var i = 0; i < entityTree.length; i++)
                        if (entityTree[i].isEmail)
                            fieldSelect += '<option value="'+entityTree[i].codename+'">'+entityTree[i].traduction+'</option>';
                    fieldSelect += '</select>';

                    $(fieldSelect).appendTo(label).css('width', '230px').select2();
                }
            });
        },
        insertValue: function(data) {
            return "{field|"+data.id+"}";
        }
    }
}

$(function() {
    // Bind select generation on click
    $(".insert").click(function(e) {
        var type = $(this).data('type');
        var targetLabel = $(this).parents('label').eq(0);

        // Remove previously created selects
        targetLabel.find('select').eq(0).select2('destroy').remove();
        // Display new select depending on type
        insertionHandler[type].displaySelector(targetLabel);
    });

    // When target entity change, reload each related select2
    $("select[name=f_target_entity]").on('change', function() {
        $(".fieldInsertion, .emailFieldInsertion, .phoneFieldInsertion").each(function() {
            var label = $(this).parent('label');
            var handlerType;
            if ($(this).hasClass('emailFieldInsertion'))
                handlerType = 'email_field';
            else if ($(this).hasClass('phoneFieldInsertion'))
                handlerType = 'phone_field';
            else
                handlerType = 'field';

            $(this).select2('destroy').remove();
            insertionHandler[handlerType].displaySelector(label);
        });
    });

    // Insert value in element when option selected
    $(document).delegate('select[name=insertionSelect]','select2:selecting', function(e) {
        var data = e.params.args.data;
        var event = e.params.args.originalEvent;
        var type = $(this).data('type');

        /* Placeholder selection */
        if (data.id == "-1")
            return;

        // Get value to insert from Handler
        var insertValue = insertionHandler[type].insertValue(data);

        var targetElement = $(this).parents('.form-group').find('input, textarea').eq(0);

        // Insert if target is input
        if (targetElement.is('input')) {
            var value = targetElement.val();
            value += insertValue;
            targetElement.val(value);
        }
        // Insert if target is textarea
        else if (targetElement.is('textarea')) {
            /* Build jquery element from summernote's html */
            var rootElement = $('<div>'+targetElement.summernote('code')+'</div>');

            /* Find last element into which append text (end of textarea, before <br>) */
            var value = rootElement.find(":last-child:not(br)");

            /* Remove br appended by summernote */
            if (value.find('br:last-child'))
                value.find('br:last-child').remove();

            /* Append variable codename */
            value.append(document.createTextNode(insertValue));

            /* Set back summernote's html */
            targetElement.summernote('code', rootElement.html());
        }
        // Reset selection and close select2 dropdown
        $(this).find("option:first").prop('selected', true);
        $(this).select2('close');

        // Stop event
        event.stopPropagation();
        event.preventDefault();
        return false;
    });
});