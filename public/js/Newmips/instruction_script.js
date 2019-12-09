/*!
 * Newmips v2.9
 * Copyright 2016
 * Licensed under GPLV3.0 https://www.gnu.org/licenses/gpl.html
 */

function fetchStatus() {
    $.ajax({
        url: '/instruction_script/status',
        success: function(data) {
            try {

                // Skip current update status due to internal serveur error
                if(data.skip){
                    setTimeout(fetchStatus, 500);
                    return;
                }

                $("#instructionCount").text('Instructions : ' + data.doneInstruction + ' / ' + data.totalInstruction);

                var percent = (Number(data.doneInstruction) * 100 / Number(data.totalInstruction)).toFixed(0);
                var str = percent + "%";
                $("#progressbar").width(str);

                if (typeof data.answers[0] !== "undefined") {
                    if (data.answers[0].instruction)
                        $("#answers").html("<i>" + data.answers[0].instruction + "</i>:<br><b>" + data.answers[0].message + "</b><br><br>" + $("#answers").html());
                    else
                        $("#answers").html("<b>" + data.answers[0].message + "</b><br><br>" + $("#answers").html());
                }

                if (!data.over)
                    setTimeout(fetchStatus, 500);
                else if (percent >= 100) {
                    window.location.href = "/application/preview/" + data.data.app_name + "?timeout=75000";
                    $("#goTo").show();
                    $("#scriptSubmit").prop('disabled', false);
                    $("#progressbarcontent").hide();
                } else {
                    // Wait 2 sec before let user click again on button
                    setTimeout(function() {
                        $("#scriptSubmit").prop('disabled', false);
                        $("#scriptSubmit").fadeIn();
                    }, 2000);
                    $("#progressbarcontent").hide();
                }
            } catch (err) {
                console.error(err);
            }
        },
        error: function(err) {
            console.error(err);
            $("#scriptSubmit").prop('disabled', false);
            $("#progressbarcontent").hide();
        }
    });
}

$(function() {

    // Get last written script
    var lastWrittenScript = JSON.parse(localStorage.getItem("newmips_last_written_script"));
    if(!lastWrittenScript)
        lastWrittenScript = [];

    for (var i = 0; i < lastWrittenScript.length; i++) {
        if(i == 10)
            break;
        $('#last_written_script').append('\
            <div>\
                <b>' + lastWrittenScript[i].date + '</b> - \
                <span>' + lastWrittenScript[i].content.substring(0, 60) + '... - </span>\
                <a href="#" class="use-last-script" data-index=' + i + '>&nbsp;<i class="fa fa-clipboard"></i></a>\
            </div>\
        ');
    }

    $(document).on('click', '.use-last-script', function(){
        $("#createScriptTextarea").val(lastWrittenScript[$(this).attr('data-index')].content)
    })

    $("#instructionsScript").submit(function() {
        $("#goTo").hide();

        if($("#addScript").css("display") == "none"){
            var formData = new FormData($(this)[0]);
            var filename = $(this).find('input').val();

            $.ajax({
                url: $(this).attr('action'),
                method: 'post',
                contentType: false,
                processData: false,
                data: formData,
                success: function() {
                    $("#scriptSubmit").prop('disabled', true);
                    $("#scriptSubmit").hide();
                    $("#progressbarcontent").show();
                    if (user_lang == 'en-EN')
                        $("#filename").text('Executing instructions...');
                    else if (user_lang == 'fr-FR')
                        $("#filename").text('Exécution des instructions du fichier...');
                    setTimeout(fetchStatus, 50);
                },
                error: function(err) {
                    console.error(err);
                }
            });
        } else {

            // Avoid store multiple time the same written script
            if(lastWrittenScript.length == 0 || $("#createScriptTextarea").val() != lastWrittenScript[0].content) {
                lastWrittenScript.unshift({
                    date: moment().format("DD MMM, HH:mm"),
                    content: $("#createScriptTextarea").val()
                });
                localStorage.setItem("newmips_last_written_script", JSON.stringify(lastWrittenScript));
            }

            var ajaxData = {
                template_entry: $("#template_entry").val(),
                text: $("#createScriptTextarea").val()
            };
            $.ajax({
                url: $(this).attr('action') + "_alt",
                method: 'post',
                data: JSON.stringify(ajaxData),
                contentType: "application/json",
                processData: false,
                success: function() {
                    $("#scriptSubmit").prop('disabled', true);
                    $("#progressbarcontent").show();
                    if (user_lang == 'en-EN')
                        $("#filename").text('Executing instructions...');
                    else if (user_lang == 'fr-FR')
                        $("#filename").text('Exécution des instructions....');
                    setTimeout(fetchStatus, 50);
                },
                error: function(err) {
                    console.error(err);
                }
            });
        }
        return false;
    });

    $(document).on("click", "#createScript", function(){
        $(this).hide();
        $("#addScriptInput").hide();
        $("#addScriptInput").prop("required", false);
        $("#createScriptTextarea").prop("required", true);
        $("#createScriptTextarea").show();
        $("#last_written_script").show();
        $("#addScript").show();
    });

    $(document).on("click", "#addScript", function(){
        $(this).hide();
        $("#createScriptTextarea").hide();
        $("#last_written_script").hide();
        $("#createScriptTextarea").prop("required", false);
        $("#addScriptInput").prop("required", true);
        $("#addScriptInput").show();
        $("#createScript").show();
    });
});
