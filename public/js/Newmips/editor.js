$(document).ready(function() {

    /* -------- Editor Initialisation -------- */
    var intro1 = "	───▄▀▀▀▄▄▄▄▄▄▄▀▀▀▄───\n" +
		        "	───█▒▒░░░░░░░░░▒▒█───\n" +
		        "	────█░░█░░░░░█░░█────\n" +
		        "	─▄▄──█░░░▀█▀░░░█──▄▄─\n" +
		        "	█░░█─▀▄░░░░░░░▄▀─█░░█\n" +
		        "	█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█\n" +
		        "	█░░╦─╦╔╗╦─╔╗╔╗╔╦╗╔╗░░█\n" +
		        "	█░░║║║╠─║─║─║║║║║╠─░░█\n" +
		        "	█░░╚╩╝╚╝╚╝╚╝╚╝╩─╩╚╝░░█\n" +
		        "	█▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█\n\n\n";

    /* Get browser chosenTheme */
    var chosenTheme = sessionStorage.getItem("newmips_editor_theme");

    if (chosenTheme == null) {
        sessionStorage.setItem("newmips_editor_theme", "default");
        chosenTheme = "default";
    } else if (chosenTheme != "default") {
        $("#select-theme").val(chosenTheme);
        $('head').append("<link href='/css/codemirror/themes/" + chosenTheme + ".css' rel='stylesheet' type='text/css'>");
    }

    var myEditor = CodeMirror(document.getElementById("codemirror-editor"), {
        value: "\n\n" + intro1 + intro2,
        theme: chosenTheme,
        keyMap: "sublime",
        extraKeys: {
            "F11": function(cm) {
                cm.setOption("fullScreen", !cm.getOption("fullScreen"));
            },
            "Esc": function(cm) {
                if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
            },
            "Ctrl-S": function(cm) {
                if (typeof $("#update-file").data("path") !== "undefined")
                    $("#update-file").trigger("click");
                else
                    toastr.error("Please select a file before saving.")
            }
        },
        lineNumbers: true,
        indentUnit: 4,
        indentWithTabs: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        showTrailingSpace: true,
        autoCloseTags: true,
        scrollbarStyle: "simple"
    });

    /* -------- Switch Editor Theme -------- */
    var selectTheme = document.getElementById("select-theme");
    $(document).on("change", "#select-theme", function() {
        var theme = $(this).val();
        $('head').append("<link href='/css/codemirror/themes/" + theme + ".css' rel='stylesheet' type='text/css'>");
        myEditor.setOption("theme", theme);
        sessionStorage.setItem("newmips_editor_theme", theme);
    });

    /* -------- Set mode depending of file extension -------- */
    CodeMirror.defineMode("dust", function(config, parserConfig) {
        var dustOverlay = {
            token: function(stream, state) {
                var ch;
                if (stream.match("{<")) {
                    while ((ch = stream.next()) != null)
                        if (ch == "}") {
                            //stream.eat("}");
                            return "dust";
                        }
                }
                if (stream.match("{/")) {
                    while ((ch = stream.next()) != null)
                        if (ch == "}") {
                            //stream.eat("}");
                            return "dust";
                        }
                }
                if (stream.match("{>")) {
                    while ((ch = stream.next()) != null)
                        if (ch == "}") {
                            //stream.eat("}");
                            return "dust";
                        }
                }
                while (stream.next() != null && !stream.match("{<", false)) {}
                return null;
            }
        };
        var mode = {
            name: "xml",
            htmlMode: true,
            matchClosing: false
        };
        return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || mode), dustOverlay);
    });

    function setMode(extension) {
        switch (extension) {
            case "css":
                myEditor.setOption("mode", "css");
                break;
            case "html":
                myEditor.setOption("mode", "htmlmixed");
                break;
            case "dust":
                myEditor.setOption("mode", "dust");
                break;
            case "js":
                myEditor.setOption("mode", "javascript");
                break;
            case "json":
                var mode = {
                    name: "javascript",
                    json: true
                };
                myEditor.setOption("mode", mode);
                break;
            case "sql":
                myEditor.setOption("mode", "sql");
                break;
            case "xml":
                myEditor.setOption("mode", "xml");
                break;
        }
    }

    /* -------- Load a file in the editor -------- */
    $(document).on("click", ".load-file", function() {

        var ajaxData = {
            path: $(this).data("path")
        }

        $.ajax({
            url: '/editor/load_file',
            type: 'POST',
            data: JSON.stringify(ajaxData),
            dataType: 'json',
            contentType: "application/json",
            context: this,
            success: function(data) {
                /* Color select file in folders */
                $(".load-file").each(function() {
                    $(this).css("color", "#777", "important");
                });
                $(this).css("color", "rgb(60, 141, 188)");

                /* Remove other active tabs */
                $("ul.nav.nav-tabs#editor-navtabs li").each(function() {
                    $(this).removeClass("active");
                });

                /* Update the save button */
                $("#update-file").attr("data-path", data.path);
                $("#update-file").removeAttr("disabled");

                /* Set good file editor mode */
                setMode(data.extension);

                if (!$("li[data-path='" + data.path + "']").length) {
                    /* Add tab */
                    var tab = "<li role='fileTab' class='load-file active' data-path='" + data.path + "'>" +
                        "<a href='#' data-toggle='tab'>" + $(this).data("filename") +
                        "  <i class='fa fa-times close-tab' aria-hidden='true'></i>" +
                        "</a></li>";
                    $("ul.nav.nav-tabs#editor-navtabs").append(tab);
                } else {
                    $("li[data-path='" + data.path + "']").addClass("active");
                }

                /* Add content in editor */
                myEditor.setValue(data.html);
            },
            error: function(error) {
                console.log(error);
                toastr.error("Sorry, an error occured :/");
            }
        });
    });

    /* -------- Update the current file -------- */
    $(document).on("click", "#update-file", function() {
        var ajaxData = {
            path: $(this).data("path"),
            content: myEditor.getValue()
        }

        $.ajax({
            url: '/editor/update_file',
            type: 'POST',
            data: JSON.stringify(ajaxData),
            dataType: 'json',
            contentType: "application/json",
            context: this,
            success: function(data) {
                toastr.success("Le fichier à bien été mis à jour !");
            },
            error: function(error) {
                console.log(error);
                toastr.error("Sorry, an error occured :/");
            }
        });
    });

    /* -------- Close tabs -------- */
    $(document).on("click", ".close-tab", function(e) {
        e.stopPropagation();
        e.preventDefault();
        $(this).parents("li").remove();
        if ($(".nav-tabs li").length == 0) {
            myEditor.setValue("\n\n" + intro1 + intro2);
        } else {
            $(".nav-tabs li").first().trigger("click");
        }
    });
});