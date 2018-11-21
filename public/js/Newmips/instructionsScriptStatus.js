/*!
 * Newmips v2.5
 * Copyright 2016
 * Licensed under GPLV3.0 https://www.gnu.org/licenses/gpl.html
 */

function fetchStatus() {
    $.ajax({
        url: '/instruction_script/status',
        success: function(data) {
            try {

                $("#instructionCount").text('Instructions : ' + data.doneInstruction + ' / ' + data.totalInstruction);

                var percent = (Number(data.doneInstruction) * 100 / Number(data.totalInstruction)).toFixed(0);
                var str = percent + "%";
                $("#progressbar").width(str);

                if (typeof data.text[0] !== "undefined") {
                    if (data.text[0].instruction)
                        $("#answers").html("<i>" + data.text[0].instruction + "</i>:<br><b>" + data.text[0].message + "</b><br><br>" + $("#answers").html());
                    else
                        $("#answers").html("<b>" + data.text[0].message + "</b><br><br>" + $("#answers").html());
                }
                if (!data.over)
                    setTimeout(fetchStatus, 50);
                else {
                    if (percent >= 100) {
                        window.location.href = "/application/preview?id_application="+data.id_application+"&timeout=50000";
                        /*$("#goTo").attr('href', $("#goTo").attr('href')+data.id_application);*/
                        $("#goTo").show();
                        $("#scriptSubmit").prop('disabled', false);
                        $("#goTo").prop('disabled', false);
                        $("#progressbarcontent").hide();
                    } else {
                        $("#scriptSubmit").prop('disabled', false);
                        $("#progressbarcontent").hide();
                    }
                }
            } catch (err) {
                console.log(err);
            }
        },
        error: function(err) {
            console.log(err);
            $("#scriptSubmit").prop('disabled', false);
            $("#progressbarcontent").hide();
        }
    });
}

$(function() {
    var lang = $("#lang").val();
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
                    $("#progressbarcontent").show();
                    if (lang == 'en')
                        $("#filename").text('Executing instructions from file "' + filename + '".');
                    else if (lang == 'fr')
                        $("#filename").text('Executions des instructions du fichier "' + filename + '".');
                    setTimeout(fetchStatus, 50);
                },
                error: function(err) {
                    console.log(err);
                }
            });
        } else{

            var ajaxData = {
                text: $("#createScriptTextarea").val()
            };
            $.ajax({
                url: $(this).attr('action')+"_alt",
                method: 'post',
                data: JSON.stringify(ajaxData),
                contentType: "application/json",
                processData: false,
                success: function() {
                    $("#scriptSubmit").prop('disabled', true);
                    $("#progressbarcontent").show();
                    if (lang == 'en')
                        $("#filename").text('Executing instructions from written script.');
                    else if (lang == 'fr')
                        $("#filename").text('Executions des instructions du script écrit.');
                    setTimeout(fetchStatus, 50);
                },
                error: function(err) {
                    console.log(err);
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
        $("#addScript").show();
    });

    $(document).on("click", "#addScript", function(){
        $(this).hide();
        $("#createScriptTextarea").hide();
        $("#createScriptTextarea").prop("required", false);
        $("#addScriptInput").prop("required", true);
        $("#addScriptInput").show();
        $("#createScript").show();
    });
});
