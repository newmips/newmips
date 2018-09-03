$(document).ready(function() {

    function getTranslation(key, params, callback) {
        var ajaxData = {
            key: key,
            params: params,
            lang: user_lang
        };
        $.ajax({
            url: '/default/ajaxtranslate',
            type: 'POST',
            data: JSON.stringify(ajaxData),
            dataType: 'json',
            contentType: "application/json",
            context: this,
            success: function(answer) {
                callback(answer.value);
            },
            error: function(error) {
                console.log(error);
                callback(key);
            }
        });
    }

    ////////////
    // UI Editor
    ////////////
    $(document).delegate('.ge-add-row', 'click', function() {
        var newRow = $(this).parent().parent().children(".row .ui-sortable").last();
        newRow.find('.ui-sortable').remove();
        $(".ge-add-column").remove();
    });

    $(document).delegate('.ge-addRowGroup', 'click', function() {
        var newRow = $("body").find('.ui-sortable').last().parent();
        newRow.find('.ge-add-row').click();
        newRow.find('.ge-content').remove();
    });

    $("#entitySelect").select2({
        width: '100%'
    });

    $("#entitySelect").change(function() {
        $("#pages").slideUp();
        if ($(this).val()) {
            $("#pages a").data('entity', $(this).val());
            $("#pages").slideDown();
        }
    });

    var entity, page;
    $(".ui_editor_page").click(function() {
        var self = this;
        entity = $(this).data('entity');
        page = $(this).data('page');
        $.ajax({
            url: '/ui_editor/getPage/' + entity + '/' + page,
            success: function(pageHtml) {
                $("#ui_editor").html(pageHtml);
                // Remove mainControls who are not removed by modifying html
                $(".ge-mainControls").remove();

                // Enable gridEditor
                $("#ui_editor").gridEditor();
                $("#ui_editor_save").show();
                $("#ui_editor_tips").show();
                $("#ui_editor_apply_all").show();
                $("#ui_editor_apply_all_span").show();
                $(".ui_editor_page").parents('li').removeClass('active');
                $(self).parents('li').addClass('active');

                if (page == "print")
                    $("a#custom-grid-editor-print-layout").trigger("click");
            },
            error: function(err) {
                console.log(err);
                toastr.error(err.responseText);
            }
        });
    });

    $("#ui_editor_save").click(function() {
        var html = $("#ui_editor").gridEditor('getHtml');
        var currentScreenMode = $(".ge-layout-mode button span").text();
        $(this).text(loadingButtonText);
        $(this).prop("disabled", true);
        $.ajax({
            url: '/ui_editor/setPage/' + entity + '/' + page,
            method: 'post',
            data: {
                html: html,
                screenMode: currentScreenMode,
                applyAll: $("#ui_editor_apply_all").prop("checked")
            },
            context: this,
            success: function(msg) {
                $("#ui_editor_apply_all").prop("checked", false);
                toastr.success(msg);
                $(this).text(savingButtonText);
                $(this).prop("disabled", false);
            },
            error: function(err) {
                console.log(err);
                toastr.error(err.responseText);
            }
        });
    });

    /////////
    // Editor
    /////////
    var isEditorStarted = false;
    $(document).on("click", "#start-editor", function() {
        if (!isEditorStarted) {
            // Tabs display/animation need to be completely finished to instanciate the editor
            setTimeout(function() {
                $("body").append("<script src='/js/plugins/codemirror/codemirror.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/multiplex.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/simple.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/search.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/searchcursor.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/dialog.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/matchbrackets.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/closebrackets.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/foldcode.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/foldgutter.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/brace-fold.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/xml-fold.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/indent-fold.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/markdown-fold.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/comment-fold.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/trailingspace.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/closetag.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/overlay.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/fullscreen.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/simplescrollbars.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/addon/formatting.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/keymap/sublime.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/mode/xml/xml.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/mode/css/css.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/mode/javascript/javascript.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/mode/htmlmixed/htmlmixed.js' type='text/javascript' />" +
                    "<script src='/js/plugins/codemirror/mode/sql/sql.js' type='text/javascript' />" +
                    "<script type='text/javascript' src='/js/Newmips/editor.js'/>");
                isEditorStarted = true;
                $("#loadingEditorIframe").remove();
            }, 500);
        }
    });

    /////////
    // Set Logo
    /////////
    dropzoneSetLogo.on("complete", function(file, response) {
        $("form#previewForm").submit();
    });

    $(document).on("click", "#addLogo", function() {
        dropzoneSetLogo.processQueue();
    });

    $('#modalsetlogo').on('hidden.bs.modal', function() {
        $("input[name='set_logo']").val("");
        dropzoneSetLogo.removeAllFiles(true);
    });

    /////////
    // Input instruction
    /////////
    var reg = new RegExp(/[^a-zA-Z0-9àâçéèêëîïôûùüÿñ_\-\,\ \'\!]/);
    var instructionHistory = JSON.parse(localStorage.getItem("newmips_given_instruction_history_" + idApp));
    var indexInstructionSelected = instructionHistory !== null ? instructionHistory.length : 0;
    $("input#instruction").css("transition", "color 0.2s");

    $(document).on("keydown", "input#instruction", function(e) {
        if (instructionHistory != null) {
            /* UP ARROW */
            if (e.ctrlKey) {
                if (e.which == "38") {
                    $("input#instruction").css("color", "rgba(255,255,255,0)");
                    if (--indexInstructionSelected < 0)
                        indexInstructionSelected = 0;
                    setTimeout(function() {
                        $("input#instruction").val(instructionHistory[indexInstructionSelected])
                    }, 200);
                    setTimeout(function() {
                        $("input#instruction").css("color", "#555")
                    }, 300);
                }
                /* DOWN ARROW */
                else if (e.which == "40") {
                    $("input#instruction").css("color", "rgba(255,255,255,0)");
                    if (++indexInstructionSelected > instructionHistory.length - 1) {
                        indexInstructionSelected = instructionHistory.length;
                        $("input#instruction").val("");
                    } else {
                        setTimeout(function() {
                            $("input#instruction").val(instructionHistory[indexInstructionSelected])
                        }, 200);
                    }
                    setTimeout(function() {
                        $("input#instruction").css("color", "#555")
                    }, 300);
                }
            }
        }
    });

    $(document).on("submit", "form#previewForm", function(e) {
        if ($("#instruction").val() == "") {
            toastr.error("Error, empty instruction.");
            return false;
        }

        var setLogoInstructions = ["add logo", "add a logo", "set a logo", "set logo", "mettre un logo", "mettre logo", "ajouter logo", "ajouter un logo"];
        var givenInstruction = $("#instruction").val().toLowerCase().trim();
        var logoFileName = $("input[name='set_logo']").val();
        if (setLogoInstructions.indexOf(givenInstruction) != -1 && logoFileName == "") {
            // Ask to add a logo
            $('#modalsetlogo').modal();
            return false;
        } else if (setLogoInstructions.indexOf(givenInstruction) != -1 && logoFileName != "") {
            // Logo already given, now do the instruction and add the logo name in the form
            $("#instruction").val($("#instruction").val() + " " + logoFileName);
            $('#modalsetlogo').modal("toggle");
            $("input[name='set_logo']").val("");
            dropzoneSetLogo.removeAllFiles(true);
        }

        if ($("#instruction").val() != "restart server") {
            if (instructionHistory == null)
                instructionHistory = [];
            instructionHistory.push($("#instruction").val());
            localStorage.setItem("newmips_given_instruction_history_" + idApp, JSON.stringify(instructionHistory));
        }

        $("#execute_instruction").html("Loading...");
        $("#execute_instruction").prop("disabled", true);
        $("#loadingIframe").show();
        $.ajax({
            url: "/application/fastpreview",
            method: 'POST',
            data: $(this).serialize(),
            success: function(data) {
                if (data.toRedirect)
                    return window.location.href = data.url;

                // Reload iframe
                var iframe = document.getElementById("iframe");
                iframe.src = data.iframe_url;

                // Update session screen
                if (typeof data.session.project.id_project !== "undefined" && data.session.project.id_project != null)
                    $(".sessionProjectInfo").text(" " + data.session.project.id_project + " - " + data.session.project.name_project);
                else
                    $(".sessionProjectInfo").text(" " + data.session.project.noProject);
                if (typeof data.session.application.id_application !== "undefined" && data.session.application.id_application != null)
                    $(".sessionApplicationInfo").text(" " + data.session.application.id_application + " - " + data.session.application.name_application);
                else
                    $(".sessionApplicationInfo").text(" " + data.session.application.noApplication);
                if (typeof data.session.module.id_module !== "undefined" && data.session.module.id_module != null)
                    $(".sessionModuleInfo").text(" " + data.session.module.id_module + " - " + data.session.module.name_module);
                else
                    $(".sessionModuleInfo").text(" " + data.session.module.noModule);
                if (typeof data.session.data_entity.id_data_entity !== "undefined" && data.session.data_entity.id_data_entity != null)
                    $(".sessionEntityInfo").text(" " + data.session.data_entity.id_data_entity + " - " + data.session.data_entity.name_data_entity);
                else
                    $(".sessionEntityInfo").text(" " + data.session.data_entity.noEntity);

                // Keep instructionHistory up to date
                instructionHistory = JSON.parse(localStorage.getItem("newmips_given_instruction_history_" + idApp));
                indexInstructionSelected = instructionHistory !== null ? instructionHistory.length : 0;
                // User instruction
                var userItem = data.chat.items[data.chat.items.length - 2];
                $("#chat-box").append("<div class='item'><img src=\"/img/user.png\" alt=\"user image\"><p class=\"message\"><a href=\"#\" class=\"name\"><small class=\"text-muted pull-right\">" + userItem.dateEmission + "</small>" + userItem.user + "</a><span class=\"standard-writing\" style=\"display: block;\">" + userItem.content + "</span></p></div><hr>");

                // Mipsy answer
                var mipsyItem = data.chat.items[data.chat.items.length - 1];
                getTranslation(mipsyItem.content, mipsyItem.params, function(mipsyAnswer) {
                    $("#chat-box").append("<div class='animated pulse item'><img src=\"/img/avatar.png\" alt=\"user image\"><p class=\"message\"><a href=\"#\" class=\"name\"><small class=\"text-muted pull-right\">" + mipsyItem.dateEmission + "</small>" + mipsyItem.user + "</a><span class=\"standard-writing\" style=\"display: block;\">" + mipsyAnswer + "</span></p></div><hr>");

                    $("#instruction").val("");
                    $("#instruction").blur().focus();
                    $("#execute_instruction").html("Executer");
                    $("#execute_instruction").prop("disabled", false);

                    var bottomCoord = $('#chat-box')[0].scrollHeight;
                    $('#chat-box').slimScroll({
                        scrollTo: bottomCoord
                    });

                    // Update UI Editor selector with new entities
                    var defaultUISelectorText = $("#entitySelect option")[0].text;
                    $("#entitySelect").empty();
                    $("#entitySelect").append("<option default value=''>" + defaultUISelectorText + "</option>");
                    for (var i = 0; i < data.entities.length; i++) {
                        $("#entitySelect").append("<option value='" + data.entities[i].codeName + "'>" + data.entities[i].name + "</option>");
                    }

                    // Update Editor file selection
                    $("ul#sortable.sidebar-menu").empty();

                    function recursiveEditorFolders(folder) {
                        var tmpContent = "";
                        if (folder) {
                            for (var i = 0; i < folder.length; i++) {
                                var file = folder[i];
                                if (typeof file.path !== "undefined") {
                                    tmpContent += "<li><a href='#' data-path='" + file.path + "' data-filename='" + file.title + "' class='load-file'><i class='fa fa-file'></i> " + file.title + "</a></li>";
                                } else if (typeof file.under !== "undefined") {
                                    tmpContent += "<li style='display:block;' class='ui-state-default treeview'><a href='#'><i class='fa fa-folder'></i><span>" + file.title + "</span><i class='fa pull-right fa-angle-left'></i></a><ul class='treeview-menu'>";
                                    tmpContent += recursiveEditorFolders(file.under);
                                    tmpContent += "</ul></li>";
                                }
                            }
                        }
                        return tmpContent;
                    }
                    var content = recursiveEditorFolders(data.workspaceFolder);
                    $("ul#sortable.sidebar-menu").append(content);
                    $(".sidebar .treeview").tree();
                    // Reset Code Editor
                    if (typeof myEditor !== "undefined" && !data.isRestart) {
                        $("#codemirror-editor li.load-file").each(function() {
                            $(this).remove();
                        });
                        myEditor.setValue("");
                        myEditor.clearHistory();
                        myEditor.refresh();
                        myEditor.clearGutter();
                        $(".CodeMirror-code").empty();
                    }

                    // Reset UI Editor
                    if (!data.isRestart) {
                        $("#pages").slideUp();
                        entity = null;
                        page = null;
                        $("#ui_editor").html("");
                        // Enable gridEditor
                        $("#ui_editor").gridEditor();
                        // Remove mainControls who are not removed by modifying html
                        $(".ge-mainControls").remove();
                        $("#ui_editor_save").hide();
                        $("#ui_editor_tips").hide();
                        $("#ui_editor_apply_all").hide();
                        $("#ui_editor_apply_all_span").hide();
                    }

                    // Wait a little for Iframe to refresh
                    setTimeout(function() {
                        $("#loadingIframe").hide();
                    }, 300);
                });
            },
            error: function(error) {
                console.log(error);
                toastr.error("Sorry, an error occured :/");
            }
        });
        return false;
    });

    $(document).on("click", "#restart-server", function(e) {
        $("#instruction").val("restart server");
        $("form#previewForm").submit();
    });

    /////////
    // Autocomplete
    /////////
    $("#instruction").autocomplete({
        autoFocus: true,
        delay: 200,
        source: function(request, response) {
            $.getJSON('/default/completion', {
                "str": request.term
            }, response);
        },
        search: function() {
            /* !important! Fix google chrome lag/crach issues */
            $(this).data("ui-autocomplete").menu.bindings = $();
            return true;
        },
        focus: function() {
            // prevent value inserted on focus
            return false;
        },
        select: function(event, ui) {

            var ENTERKEY = 13;
            if (event.keyCode != ENTERKEY) {
                var completeVal = ui.item.value;
                // If complete value have already typed string in it, dont concat with current value
                if (completeVal.indexOf(this.value) == 0) {
                    this.value = completeVal.split("[variable]").join("").trim();
                } else {
                    // Remove the last word of already typed instruction because it is also in the completed value
                    var parts = this.value.split(' ');
                    if (parts[parts.length - 1] == " ")
                        parts.pop();
                    else {
                        compareNum = 0;
                        l = Math.min(completeVal.length, parts[parts.length - 1].length);
                        for (i = 0; i < l; i++) {
                            if (completeVal.charAt(i) == parts[parts.length - 1].charAt(i)) compareNum++;
                        }
                        if (compareNum <= completeVal.length && completeVal.substring(0, compareNum) == parts[parts.length - 1])
                            parts.pop();
                    }
                    this.value = parts.join(' ') + ' ' + completeVal.split("[variable]").join("").trim();
                }

                var TABKEY = 9;
                if (event.keyCode == TABKEY) {
                    event.preventDefault();
                    this.value = this.value + " ";
                    $('#instruction').focus();
                }
                return false;
            } else {
                event.preventDefault();
                $('#execute_instruction').click();
                return false;
            }
        }
    });

    /////////
    // Logs
    /////////
    function updateLog() {
        $.ajax({
            url: '/default/update_logs',
            success: function(data) {
                $("#logs-content").html(data);
                setTimeout(updateLog, 1000);
            },
            error: function(err) {
                console.log(err);
            }
        });
    }

    $(document).on("click", "#start-logs", function() {
        updateLog();
        $('#logs-content').slimScroll({
            start: "bottom",
            height: "800px",
            railVisible: true,
			alwaysVisible: true,
			color: '#FFF',
			size: '10px'
        });
    })
})