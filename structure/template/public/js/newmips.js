var maskMoneyPrecision = 2;
var dropzonesFieldArray = [];
var dropzonesComponentArray = [];
Dropzone.autoDiscover = false;

function select2_ajaxsearch(select) {
    var searchField = select.data('using').split(',');
    select.select2({
        ajax: {
            url: '/'+select.data('source')+'/search',
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
        },
        placeholder: SELECT_DEFAULT_TEXT
    });
}

// INIT FORM
function initForm(context) {
    if (!context)
        context = document;

    $("select.ajax", context).each(function() {
        select2_ajaxsearch($(this));
    });
    $("select:not(.ajax)", context).select2();

    /* Display color td with fa classes instead of color value */
    $("td[data-type=color]", context).each(function() {
        if ($(this).find('i').length > 0)
            return;
        var color = $(this).text();
        $(this).html('<i class="fa fa-lg fa-circle" style="color:'+color+'"></i>');
    });

    /* --------------- Initialisation des iCheck - Checkbox + RadioButton --------------- */
    $("input[type='checkbox'], input[type='radio']", context).iCheck({
        checkboxClass: 'icheckbox_flat-blue',
        radioClass: 'iradio_flat-blue',
        disabledClass: ''
    });

    /* --------------- Initialisation des Textarea --------------- */
    $("textarea:not(.regular-textarea)", context).each(function() {
        $(this).summernote({
            height: 200
        });
    });

    /* --------------- Initialisation des timepicker --------------- */
    $(".timepicker", context).timepicker({
        showInputs: false,
        showMeridian: false
    });

    /* --------------- Regex on decimal input --------------- */
    $("input[data-custom-type='decimal']", context).keyup(function(e) {
        var reg = new RegExp("^[0-9]+([\.\,][0-9]*)?$");
        while ($(this).val() != "" && !reg.test($(this).val())) {
            $(this).val($(this).val().substring(0, $(this).val().length - 1))
        }
    });

    /* --------------- Max length on input number --------------- */
    $("input[type='number']", context).keyup(function(e) {
        if (this.value.length > 10) {
            this.value = this.value.slice(0,10);
        }
    });

    /* --------------- Initialisation des DateTimepicker --------------- */
    /* --------------- Initialisation des datepicker --------------- */
    /* --------------- Initialisation des Input Maks --------------- */
    $("input[data-type='email']", context).inputmask({
        alias: "email"
    });

    /* Uncomment if you want to apply a mask on tel input */
    $("input[type='tel']", context).inputmask({mask: "## ## ## ## ##"});
    $("input[type='tel']", context).keyup(function(e) {
        if(isNaN(e.key) && e.key != " " && e.key != "_" && e.key != "Backspace" && e.key != "Shift")
            $(this).val("");
    });

    /* --------------- Initialisation des date a afficher correctement selon la langue --------------- */
    $('.simpledate-toconvert', context).each(function() {
        if (typeof $(this).html() !== "undefined" && $(this).html() != "" && $(this).html() != "Invalid date" && $(this).html() != "Invalid Date") {
            if($(this).html().indexOf("/") == -1 && $(this).html().indexOf("-") == -1){
                if (lang_user == "fr-FR")
                    $(this).html(moment(new Date($(this).html())).format("DD/MM/YYYY"));
                else
                    $(this).html(moment(new Date($(this).html())).format("YYYY-MM-DD"));
            }
        }
    });

    $('.datepicker-toconvert', context).each(function() {
        var currentVal = $(this).val();
        if (typeof currentVal !== "undefined" && currentVal != "" && currentVal != "Invalid date" && currentVal != "Invalid Date") {
            if(currentVal.indexOf("/") == -1 && currentVal.indexOf("-") == -1){
                if (lang_user == "fr-FR")
                    $(this).val(moment(new Date(currentVal)).format("DD/MM/YYYY"));
                else
                    $(this).val(moment(new Date(currentVal)).format("YYYY-MM-DD"));
            }
        } else {
            $(this).val("");
        }
    });

    $('.datetimepicker-toconvert', context).each(function() {
        var currentVal = $(this).attr("value");
        if (typeof currentVal !== "undefined" && currentVal != "" && currentVal != "Invalid date" && currentVal != "Invalid Date") {
            if(currentVal.indexOf("/") == -1 && currentVal.indexOf("-") == -1){
                if (lang_user == "fr-FR")
                    $(this).val(moment(new Date(currentVal)).format("DD/MM/YYYY HH:mm")).change();
                else
                    $(this).val(moment(new Date(currentVal)).format("YYYY-MM-DD HH:mm")).change();
            }
        } else {
            $(this).val("");
        }
    });

    $("td[data-type='date']", context).each(function() {
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

    $("td[data-type='datetime']", context).each(function() {
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

    $('img[data-type="picture"]', context).each(function() {
        var src = $(this).attr('src');
        //remove all pictures with null src value
        if (typeof src !== 'undefined' && src.split(',')[1] == '') {
            var msg = 'No image selected';
            if (lang_user == 'fr-FR')
                msg = 'Aucune image choisie';
            $(this).parent().replaceWith('<span>' + msg + '</span>');
        }
    });

    /* Show boolean with a square in datalist */

    $('td[data-type="boolean"]', context).each(function() {
        var val = $(this).html();
        if (val == 'true' || val == '1')
            $(this).html('<i class="fa fa-check-square-o fa-lg"></i>');
        else
            $(this).html('<i class="fa fa-square-o fa-lg"></i>');
    });


    /* After good format -> Date / Datetime instanciation */
    if (lang_user == "fr-FR") {
        $('.datepicker', context).datepicker({
            format: "dd/mm/yyyy",
            language: lang_user,
            autoclose: true,
            clearBtn: true
        });

        $(".datepicker", context).inputmask({
            "alias": "dd/mm/yyyy"
        });

        $('.datetimepicker', context).datetimepicker({
            format: "DD/MM/YYYY HH:mm",
            sideBySide: true
        });

        $(".datetimepicker", context).inputmask({
            mask: "1/2/y h:s",
            placeholder: "dd/mm/yyyy hh:mm",
            alias: "datetime",
            timeseparator: ":",
            hourFormat: "24"
        });
    } else {
        $('.datepicker', context).datepicker({
            format: "yyyy-mm-dd",
            language: lang_user,
            autoclose: true,
            clearBtn: true
        });

        $(".datepicker", context).inputmask({
            "alias": "yyyy-mm-dd"
        });

        $('.datetimepicker', context).datetimepicker({
            format: "YYYY-MM-DD HH:mm",
            sideBySide: true
        });

        $(".datetimepicker", context).inputmask({
            mask: "y-1-2 h:s",
            placeholder: "yyyy-mm-dd hh:mm",
            separator: "-",
            alias: "yyyy/mm/dd"
        });
    }

    /* Set default date if needed */
    $('.datepicker', context).each(function(){
        if($(this).attr("data-today") == 1)
            $(this).datepicker("setDate", "0");
    });

    $('.datetimepicker', context).each(function(){
        if($(this).attr("data-today") == 1)
            $(this).data("DateTimePicker").defaultDate(moment());
    });

    /* ----------------data-type qrcode generation -------------------------*/
    // Counter to avoid same id generation
    var ctpQrCode = 0;
    $("input[data-type='qrcode']", context).each(function() {
        if ($(this).val() != '') {
            //Update View, set attr parent id, Qrcode only work with component Id
            $(this).parent().parent().attr("id", $(this).attr('name')+ctpQrCode);
            //$(this).attr('name') = this parent id
            var qrcode = new QRCode($(this).attr('name')+ctpQrCode, {
                text: $(this).val(),
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            $(this).parent().replaceWith(qrcode);
            ctpQrCode++;
        }
    });

    var displayBarCode = function(element) {
        var jq_element = $(element);
        var id = jq_element.attr('name');
        var img = '<br><img id="' + id + '" class="img img-responsive"/>';
        var barcodeType = jq_element.attr('data-customtype');
        if (typeof barcodeType != 'undefined') {
            jq_element.parent().after(img);
            try {
                JsBarcode('#' + id, jq_element.val(), {
                    format: barcodeType,
                    lineColor: "#000",
                    width: 2,
                    height: 40,
                    displayValue: true
                });
                jq_element.parent().remove();
            } catch (e) {
                jq_element.parent().parent().find('br').remove();
                jq_element.parent().parent().find('#' + id).remove();
            }
        }
    };
    //input barcode
    $("input[data-type='barcode']", context).each(function() {
        if ($(this).attr('show') == 'true' && $(this).val() != '') {
            displayBarCode(this);
        } else {
            if ($(this).attr('data-customType') === 'code39' || $(this).attr('data-customType') === 'alpha39') {
                $(this).on('keyup', function() {
                    $(this).val($(this).val().toUpperCase());
                });
            }
        }
    });

    //input barcode
    $("input[data-type='code39'],input[data-type='alpha39']", context).each(function() {
        $(this).on('keyup', function() {
            $(this).val($(this).val().toUpperCase());
        });
    });

    //Mask for data-type currency
    $("[data-type='currency']", context).each(function() {
        $(this).maskMoney({
            thousands: ' ',
            decimal: '.',
            allowZero: true,
            suffix: '',
            precision: maskMoneyPrecision
        }).maskMoney('mask');
    });
    /* --------------- Initialisation de DROPZONE JS - FIELD --------------- */
    $('.dropzone-field', context).each(function(index) {
        var that = $(this);
        var type = that.attr('data-type');
        var dropzoneInit = new Dropzone("#" + $(this).attr("id"), {
            url: "/default/file_upload",
            autoProcessQueue: true,
            maxFilesize: 10,
            addRemoveLinks: true,
            uploadMultiple: false,
            dictDefaultMessage: "Glisser le fichier ou cliquer ici pour ajouter.",
            dictRemoveFile: "Supprimer",
            dictCancelUpload: "Annuler",
            autoDiscover: false,
            init: function() {
                var dropzoneId = that.attr('id');
                if ($('#' + dropzoneId + '_hidden').val() != '') {
                    var mockFile = {
                        name: 'dfltImg_'+$('#' + dropzoneId + '_hidden').val(),
                        type: 'mockfile',
                        default: true
                    };
                    this.files.push(mockFile);
                    this.emit('addedfile', mockFile);
                    this.emit('thumbnail', mockFile, "data:image/;base64,"+$('#' + dropzoneId + '_hidden').data('buffer'));
                }

                this.on("addedfile", function() {
                    if (this.files[1] != null) {
                        this.removeFile(this.files[1]);
                        toastr.error("Vous ne pouvez ajouter qu'un seul fichier");
                    } else if (!this.files[0].default) {
                        $("#" + that.attr("id") + "_hidden_name").val(this.files[0].name);
                        $("#" + that.attr("id") + "_hidden").val(this.files[0].name);
                    }
                });

                this.on("sending", function(file, xhr, formData) {
                    var storageType = that.attr("data-storage");
                    var dataEntity = that.attr("data-entity");
                    var dataType = that.attr("data-type") || '';
                    formData.append("storageType", storageType);
                    formData.append("dataEntity", dataEntity);
                    formData.append("dataType", dataType);
                });
                this.on("maxfilesexceeded", function() {
                    this.removeFile(this.files[1]);
                    toastr.error("Vous ne pouvez ajouter qu'un seul fichier");
                });
                this.on("error", function(file, message) {
                    this.removeFile(this.files[0]);
                    toastr.error(message);
                    $("#" + that.attr("id") + "_hidden").removeAttr('value');
                });
                this.on('removedfile', function(file) {
                    if (file.status != "error") {
                        var dropzone = this;
                        if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?'))
                            return false;
                        $.ajax({
                            url: '/default/delete_file',
                            type: 'post',
                            data: {
                                dataEntity: that.attr("data-entity"),
                                dataStorage: that.attr("data-storage"),
                                filename: $("#" + that.attr("id") + "_hidden").val()
                            },
                            success: function(success) {
                                $("#" + that.attr("id") + "_hidden").val('');
                                if (dropzone.files.length) {
                                    dropzone.removeAllFiles(true);
                                }
                            }
                        });
                    }

                });
            },
            renameFilename: function(filename) {
                if (filename.indexOf('dfltImg_') != -1)
                    return filename;
                if ($("#" + that.attr("id") + "_hidden").val() != '') {
                    var timeFile = moment().format("YYYYMMDD-HHmmss");
                    $("#" + that.attr("id") + "_hidden").val(timeFile + "_" + filename);
                    return timeFile + '_' + filename;
                }

            }
        });
        if (type == 'picture')
            dropzoneInit.options.acceptedFiles = 'image/*';

        dropzonesFieldArray.push(dropzoneInit);
    });
}

// DROPZONE
function initDropZone(context) {
    if (!context)
        context = document;


    /* File Storage Component */
    $('.dropzone_local_file_component', context).each(function(index) {
        var that = $(this);
        var dropzoneInit = new Dropzone("#" + $(this).attr("id"), {
            url: "/" + that.attr("data-component") + "/file_upload",
            autoProcessQueue: true,
            maxFilesize: 10,
            addRemoveLinks: true,
            uploadMultiple: false,
            dictDefaultMessage: "Glisser le fichier ou cliquer ici pour ajouter.",
            dictRemoveFile: "Supprimer",
            dictCancelUpload: "Annuler",
            init: function() {
                this.on("addedfile", function() {
                    if (this.files[1] != null) {
                        this.removeFile(this.files[1]);
                        toastr.error("Vous ne pouvez ajouter qu'un seul fichier");
                    } else {
                        $("#" + that.attr("id") + "_hidden_name").val(this.files[0].name);
                        $("#" + that.attr("id") + "_hidden").val(this.files[0].name);
                    }
                });
                this.on("sending", function(file, xhr, formData) {
                    var dataComponent = that.attr("data-component");
                    var dataSource = that.attr("data-source");
                    var dataSourceID = that.attr("data-sourceId");
                    formData.append("dataComponent", dataComponent);
                    formData.append("dataSource", dataSource);
                    formData.append("dataSourceID", dataSourceID);
                });
                this.on("maxfilesexceeded", function() {
                    this.removeFile(this.files[1]);
                    toastr.error("Vous ne pouvez ajouter qu'un seul fichier");
                });
                this.on("error", function(file, message) {
                    this.removeFile(this.files[0]);
                    toastr.error(message);
                    $("#" + that.attr("id") + "_hidden").removeAttr('value');
                });
            },
            renameFilename: function(filename) {
                var timeFile = moment().format("YYYYMMDD-HHmmss");
                $("#" + that.attr("id") + "_hidden").val(timeFile + "_" + filename);
                return timeFile + '_' + filename;
            }
        });

        dropzonesComponentArray[$(this).attr("data-component")] = [];
        dropzonesComponentArray[$(this).attr("data-component")].push(dropzoneInit);
    });
}

// PRINT
function initPrint() {
    /* Clear print tab component */
    $(".print-tab input").each(function() {
        $(this).prop("disabled", true);
        $(this).attr("placeholder", "-");
        $(this).css("cursor", "default");
        $(this).css("padding", "0");
        if($(this).attr("type") == "hidden")
            $(this).remove();
    });

    $(".print-tab a:not([href=''])").each(function() {
        if ($(this).find("img").length == 0) {
            if ($(this).text() == "")
                if ($(this).prev(".input-group-addon").find("i.fa").hasClass("fa-download"))
                    $(this).replaceWith("Aucun fichier");
                else
                    $(this).replaceWith("-");
            else
                $(this).replaceWith($(this).text());
        }
    });

     $(".print-tab select[multiple]").each(function() {
        if($(this).val() == null)
            $(this).replaceWith("<br>-");
    });

    $(".print-tab input[type='color']").each(function() {
        $(this).css("width", "20%");
    });

    $(".print-tab a[data-type='url']").each(function() {
        if($(this).text() == "")
            $(this).replaceWith("-");
    });

    $(".print-tab .input-group-addon").each(function() {
        $(this).remove();
    });

    $(".print-tab select").each(function() {
        $(this).replaceWith("<br><span>" + $(this).val() + "</span>");
    });

    $(".print-tab input[type='radio']:checked").each(function() {
        var formGroup = $(this).parent(".form-group");
        var label = formGroup.find("label");
        var htmlToWrite = label[0].outerHTML+"\n";
        formGroup.find("input[type='radio']").each(function(){
            if($(this).prop("checked")){
                htmlToWrite += "<br><span>" + $(this).val() + "</span>";
            }
        });
        formGroup.html(htmlToWrite);
    });

    $(".print-tab input[type='checkbox']").each(function() {
        var formGroup = $(this).parents(".form-group");
        var label = formGroup.find("label").html();
        var htmlToWrite = "<b>"+label+"</b>\n";
        formGroup.find("input[type='checkbox']").each(function(){
            if($(this).prop("checked")){
                htmlToWrite += "<br><span><i class='fa fa-check'></i></span>";
            } else {
                htmlToWrite += "<br><span><i class='fa fa-close'></i></span>";
            }
        });
        formGroup.html(htmlToWrite);
    });

    $(".print-tab textarea").each(function() {
        $(this).replaceWith("<br><span>"+$(this).val()+"</span>");
    });

    $(".print-tab button, .print-tab .btn").each(function() {
        $(this).remove();
    });

    $(".print-tab form").each(function() {
        $(this).remove();
    });

    $(".print-tab .print-remove").each(function() {
        $(this).remove();
    });
}

function validateForm(form) {
    var isValid = true;

    function isFileProcessing(){
        for (var i = 0; i < dropzonesFieldArray.length; i++)
            if (dropzonesFieldArray[i].files.length == 1)
                if (dropzonesFieldArray[i].files[0].type != 'mockfile' && (dropzonesFieldArray[i].files[0].status != 'success' || dropzonesFieldArray[i].files[0].upload.progress != 100)) {
                    console.log(dropzonesFieldArray[i].files[0]);
                    return true;
                }
        return false;
    }
    // If there are files to upload, block submition until files are uploaded
    if (isFileProcessing()) {
        toastr.warning(WAIT_UPLOAD_TEXT);
        return false;
    }

    /* On converti les dates francaises en date yyyy-mm-dd pour la BDD */
    if (lang_user == "fr-FR") {
        /* Datepicker FR convert*/
        form.find('.datepicker').each(function() {
            if ($(this).val().length > 0) {
                // Sécurité
                $(this).prop("readOnly", true);

                var date = $(this).val().split("/");
                var newDate = date[2] + "-" + date[1] + "-" + date[0];

                // Remove mask to enable to transform the date
                $(this).inputmask('remove');

                $(this).val(newDate);
            }
        });

        /* Datetimepicer FR convert */
        form.find('.datetimepicker').each(function() {
            if ($(this).val().length > 0) {
                // Sécurité
                $(this).prop("readOnly", true);

                var date = $(this).val().split("/");
                var yearDate = date[2].split(" ");
                var newDate = yearDate[0] + "-" + date[1] + "-" + date[0] + " " + yearDate[1];

                // Remove mask to enable to transform the date
                $(this).inputmask('remove');

                $(this).val(newDate);
            }
        });
    }

    /* Convert all times in UTC */
    form.find('.datetimepicker').each(function() {
        if ($(this).val().length > 0) {
            // Sécurité
            $(this).prop("readOnly", true);
            $(this).val(moment.utc(new Date($(this).val())));
        }
    });

    /* If a select multiple is empty we want to have an empty value in the req.body */
    form.find("select[multiple]").each(function() {
        if ($(this).val() == null) {
            var input = $("<input>").attr("type", "hidden").attr("name", $(this).attr("name"));
            form.append($(input));
        }
    });

    /* Converti les checkbox "on" en value boolean true/false pour insertion en BDD */
    form.find("input[type='checkbox']").each(function() {
        if ($(this).prop("checked")) {
            $(this).val(true);
        } else {
            /* Coche la checkbox afin qu'elle soit prise en compte dans le req.body */
            $(this).prop("checked", true);
            $(this).val(false);
        }
    });

    /* Vérification que les input mask EMAIL sont bien complétés jusqu'au bout */
    form.find("input[data-type='email']").each(function() {
        if ($(this).val().length > 0 && !$(this).inputmask("isComplete")) {
            $(this).css("border", "1px solid red").parent().after("<span style='color: red;'>Le champ est incomplet.</span>");
            isValid = false;
        }
    });

    /* Vérification que les input mask URL sont bien complétés jusqu'au bout */
    form.find("input[data-type='url']").each(function() {
        if ($(this).val() != '' && !$(this).inputmask("isComplete")) {
            toastr.error(" Le champ " + $(this).attr("placeholder") + " est invalide");
            isValid = false;
        }
    });

    /* Vérification des types barcode */
    form.find("input[data-type='barcode']").each(function() {
        var val = $(this).val();
        if (val != '') {
            var customType = $(this).attr('data-customtype');
            if (typeof customType != 'undefined') {
                var error = false;
                var len;
                var message = "";
                switch (customType) {
                    case 'ean8':
                        var len = 8;
                        error = val.length === len ? false : true;
                        if (error)
                            message += " Le champ " + $(this).attr("placeholder") + " doit avoir une taille égale à " + len + ".";
                        break;
                    case 'isbn':
                    case 'issn':
                    case 'ean13':
                        len = 13;
                        error = val.length === len ? false : true;
                        if (error)
                            message += "Le champ " + $(this).attr("placeholder") + " doit avoir une taille égale à " + len + ".<br>";
                        if (customType === "issn" && !val.startsWith('977')) {
                            error = true;
                            message += "Le champ " + $(this).attr("placeholder") + " doit comencer par 977.";
                        }
                        break;

                    case 'upca':
                        len = 12;
                        error = val.length === len ? false : true;
                        if (error)
                            message += " Le champ " + $(this).attr("placeholder") + " doit avoir une taille égale à " + len + ".";
                        break;
                    case 'code39':
                    case 'alpha39':
                        //                             var reg = new RegExp('\\[A-Z0-9-. $\/+]\\*', 'g');
                        if (!(/^[A-Z0-9-. $\/+]*$/).test(val)) {
                            message += " Le champ " + $(this).attr("placeholder") + " doit respècter la norme code39.";
                            error = true;
                        }
                        break;
                    case 'code128':
                        if (!(/^[\x00-\x7F]*$/).test(val)) {
                            message += " Le champ " + $(this).attr("placeholder") + " doit respècter la norme code128.";
                            error = true;
                        }
                        break;
                }
                if (error) {
                    toastr.error(message);
                    isValid = false;
                }
            }
        }
    });

    /* Vérification que les input mask TEL sont bien complétés jusqu'au bout */
    form.find("input[type='tel']").each(function() {
        if ($(this).val().length > 0 && !$(this).inputmask("isComplete")) {
            console.log("MASK INVALID")
            $(this).css("border", "1px solid red").parent().after("<span style='color: red;'>Le champ est incomplet.</span>");
            isValid = false;
        }
    });

    form.find("input[data-type='currency']").each(function() {
        //replace number of zero par maskMoneyPrecision value, default 2
        $(this).val(($(this).val().replace(/ /g, '')).replace(',00', ''));
    });

    return isValid;
}

// DOM READY LOADING
$(document).ready(function () {

    initForm();

    $('form').submit(function(e) {
        if (!validateForm($(this)))
            return false;
        return true;
    });

    // INLINE HELP
    var currentHelp, modalOpen = false;
    $(document).delegate(".inline-help",'click', function() {
        currentHelp = this;
        var entity;
        if ($(this).parents('.tab-pane').length && $(this).parents('.tab-pane').attr('id') != 'home')
            entity = $(this).parents('.tab-pane').attr('id').substring(2);
        else {
            var parts = window.location.href.split('/');
            entity = parts[parts.length-2];
        }
        var field = $(this).data('field');
        $.ajax({
            url: "/inline_help/help/"+entity+"/"+field,
            success: function(content) {
                $("#prevHelp, #nextHelp").hide();
                var totalHelp = $(".inline-help").length-1;
                var currentIdx = $(".inline-help").index(currentHelp);
                if (totalHelp - currentIdx > 0)
                    $("#nextHelp").show();
                if (currentIdx > 0)
                    $("#prevHelp").show();
                $(".modal-title").html($(currentHelp).parents('label').text());
                $(".modal-body").html(content);
                $("#inlineHelp").modal('show');
            }
        });
    });
    // Prev/next Help en ligne buttons
    $("#nextHelp, #prevHelp").click(function() {
        var count = $("#fields .inline-help").length-1;
        var current = $("#fields .inline-help").index(currentHelp);
        if ($(this).attr('id') == 'nextHelp' && count > current)
            $("#fields .inline-help").eq(current+1).click();
        else if ($(this).attr('id') == 'prevHelp' && current > 0)
            $("#fields .inline-help").eq(current-1).click();
    });
    // Handle tab and shift+tab modal navigation
    $("#inlineHelp").on('show.bs.modal', function() {
        modalOpen = true;
    });
    $("#inlineHelp").on('hide.bs.modal', function() {
        modalOpen = false;
    });
    $(document).keypress(function(e) {
        if (modalOpen == false)
            return;
        var code = e.keyCode || e.which;
        // Tabulation
        if (e.shiftKey && code == '9')
            $("#prevHelp").click();
        else if (code == '9')
            $("#nextHelp").click();
    });

    /* Save mini sidebar preference */
    $(document).on("click", ".sidebar-toggle", function(){
        if (typeof sidebarPref !== "undefined" && (sidebarPref == "true" || sidebarPref == null))
            sidebarPref = false;
        else
            sidebarPref = true;

        localStorage.setItem("newmips_mini_sidebar_preference", sidebarPref);
    });

    /* --------------- Toastr messages --------------- */
    try {
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "newestOnTop": false,
            "progressBar": true,
            "positionClass": "toast-bottom-left",
            "preventDuplicates": false,
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
        for (var i = 0; i < toastrArray.length; i++) {
            setTimeout(function(toast) {
                switch (toast.level) {
                    case "info":
                        toastr.info(toast.message);
                        break;
                    case "success":
                        toastr.success(toast.message);
                        break;
                    case "warning":
                        toastr.warning(toast.message);
                        break;
                    case "error":
                        toastr.error(toast.message);
                        break;
                }
            }(toastrArray[i]), (1000 * i));
        }
    } catch (e) {
        console.log(e);
        toastr = {
            success: function() {
                return true;
            },
            info: function() {
                return true;
            },
            error: function() {
                return true;
            },
            warning: function() {
                return true;
            }
        };
    }

    /* --------------- Breadcrumbs / sidebar --------------- */
    var url = window.location.href;
    var current_url = url.split("/");

    var mainMenu = current_url[3];
    var subMenu = current_url[4];

    var lookingForSource = url.split("&");

    if (typeof lookingForSource[2] !== "undefined") {
        var source = lookingForSource[2].split("=");
    }

    if (typeof source !== "undefined" && source[0] == "associationSource") {
        $("#" + source[1] + "_menu_item").addClass("active");
    } else {
        $("#" + mainMenu + "_menu_item").addClass("active");
        $("#" + mainMenu + "_menu_item").parents("li").addClass("active");

        $("a[href='/" + mainMenu + "/" + subMenu + "']").css("color", "#3c8dbc");
    }

    // DROPZONE SUBMIT
    /* Dropzone files managment already done ? */
    var filesComponentProceeded = false;
    $(document).on("submit", ".component-form", function(e) {
        if (!filesComponentProceeded && dropzonesComponentArray[$(this).attr("data-component")].length > 0) {
            /* If there are files to write, stop submit and do this before */
            e.preventDefault();

            /* Send dropzone file */
            for (var i = 0; i < dropzonesComponentArray[$(this).attr("data-component")].length; i++) {
                if (dropzonesComponentArray[$(this).attr("data-component")][i].files.length > 0) {
                    dropzonesComponentArray[$(this).attr("data-component")][i].processQueue();
                    (function(ibis, myform) {
                        dropzonesComponentArray[myform.attr("data-component")][i].on("complete", function(file) {
                            if (ibis == dropzonesComponentArray[myform.attr("data-component")].length - 1) {
                                filesComponentProceeded = true;
                                myform.submit();
                            }
                        });
                    })(i, $(this))
                } else {
                    if (i == dropzonesComponentArray[$(this).attr("data-component")].length - 1) {
                        filesComponentProceeded = false;
                        toastr.error("You should add a file.");
                    }
                }
            }
        }

        return true;
    });

    /* Component print button action */
    $(document).on("click", ".component-print-button", function(){
        window.print();
        return true;
    });
});