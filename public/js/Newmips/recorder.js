/*!
 * Newmips v2.9
 * Copyright 2016
 * Licensed under GPLV3.0 https://www.gnu.org/licenses/gpl.html
 */

$(function() {
    var widget = $("<div />").css({
        position: "fixed",
        top: "150px",
        right: "0",
        background: "rgba(0, 0, 0, 0.7)",
        "border-radius": "5px 0px 0px 5px",
        padding: "10px 15px",
        "font-size": "16px",
        "z-index": "999999",
        cursor: "pointer",
        color: "#ddd"
    }).html("<i class='fa fa-gear'></i>").addClass("no-print");

    var widget_settings = $("<div />").css({
        "padding": "10px",
        position: "fixed",
        top: "130px",
        right: "-200px",
        background: "#fff",
        border: "2px solid rgba(0, 0, 0, 0.7)",
        "width": "200px",
        "z-index": "999999"
    }).addClass("no-print");
    widget_settings.append(
        "<h4 style='margin: 0 0 5px 0; border-bottom: 1px dashed #ddd; padding-bottom: 3px;'>Recorder Options</h4>" +
        "<div class='form-group no-margin'>" +
        "<div class='btn.btn-default'>" +
        "<label>" +
        "<input type='button' onclick='change_layout();'' value='Record'></input>" +
        "" +
        "" +
        "</label>" +
        "</div>" +
        "</div>"
    );
    widget_settings.append(
        "<h4 style='margin: 0 0 5px 0; border-bottom: 1px dashed #ddd; padding-bottom: 3px;'>Skins</h4>" +
        "<div class='form-group no-margin'>" +
        "<div class='.radio'>" +
        "<label>" +
        "<input name='skins' type='radio' onchange='change_skin(\"skin-black\");' /> " +
        "Black" +
        "</label>" +
        "</div>" +
        "</div>"

        +
        "<div class='form-group no-margin'>" +
        "<div class='.radio'>" +
        "<label>" +
        "<input name='skins' type='radio' onchange='change_skin(\"skin-blue\");' checked='checked'/> " +
        "Blue" +
        "</label>" +
        "</div>" +
        "</div>"
    );

    widget.click(function() {
        if (!$(this).hasClass("open")) {
            $(this).css("right", "200px");
            widget_settings.css("right", "0");
            $(this).addClass("open");
        } else {
            $(this).css("right", "0");
            widget_settings.css("right", "-200px");
            $(this).removeClass("open")
        }
    });

    $("body").append(widget);
    $("body").append(widget_settings);
});