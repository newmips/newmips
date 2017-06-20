function updateInstructionCount(){
    $.ajax({
        url: '/default/update_instruction_cpt',
        method: 'get',
        success: function(data) {
            $("#cptInstructionBar").attr("aria-valuenow", data.pourcentInstruction);
            $("#cptInstructionBar").css("width", data.pourcentInstruction+"%");
            if(data.cptInstruction > 300)
                data.cptInstruction = "300+";
            $("#cptInstructionNumber").html("<b>"+data.cptInstruction+"</b>");
        }
    });
}

function fetchStatus() {
    $.ajax({
        url: '/instruction_script/status',
        success: function(data) {
            try {
                updateInstructionCount();

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
                        window.location.href = "/application/preview?id_application="+data.id_application;
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
                    $("#filename").text('Executing instructions from file "' + filename + '"');
                else if (lang == 'fr')
                    $("#filename").text('Executions des instructions du fichier "' + filename + '"');
                setTimeout(fetchStatus, 50);
            },
            error: function(err) {
                console.log(err);
            }
        });
        return false;
    });
});