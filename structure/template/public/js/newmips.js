var maskMoneyPrecision = 2;
var dropzonesFieldArray = [];
var dropzonesComponentArray = [];
Dropzone.autoDiscover = false;

function select2_ajaxsearch(select, placeholder) {
    if(!placeholder)
        placeholder = SELECT_DEFAULT_TEXT;

    var searchField = select.data('using').split(',');

    // Use custom url on select or build default url
    var url = select.data('href') ? select.data('href') : select.data('url') ? select.data('url') : '/' + select.data('source') + '/search';
    select.select2({
        ajax: {
            url: url,
            dataType: 'json',
            method: 'POST',
            delay: 250,
            contentType: "application/json",
            allowClear: true,
            placeholder: placeholder,
            data: function (params) {
                var ajaxdata = {
                    search: params.term,
                    page: params.page || 1,
                    searchField: searchField
                };
                // customwhere example: data-customwhere='{"myField": "myValue"}'
                // Do not work for related to many fields if the field is a foreignKey !
                if (select.data('customwhere') !== undefined){
                    // Handle this syntax: {'myField': 'myValue'}, JSON.stringify need "", no ''
                    if(typeof select.data('customwhere') === "object")
                        ajaxdata.customwhere = JSON.stringify(select.data('customwhere'));
                    else
                        ajaxdata.customwhere = JSON.stringify(JSON.parse(select.data('customwhere').replace(/'/g, '"')));
                }
                return JSON.stringify(ajaxdata);
            },
            processResults: function (answer, params) {
                var dataResults = answer.rows;
                if (!dataResults)
                    return {results: []};
                var results = [];
                if(select.attr("multiple") != "multiple" && !params.page)
                    results.push({id: "", text: placeholder});
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

// INIT FORM
function initForm(context) {
    if (!context)
        context = document;

    $("select.ajax", context).each(function () {
        // Avoid new instanciation if already in select2
        // Fix width css glitch when switching tabs
        if(typeof $(this).data("select2") === "undefined")
            select2_ajaxsearch($(this));
    });
    $("select:not(.ajax):not(.regular-select)", context).each(function () {
        if(typeof $(this).data("select2") === "undefined")
            $(this).select2();
    });

    /* --------------- Initialisation des iCheck - Checkbox + RadioButton --------------- */
    $("input[type='checkbox'], input[type='radio']", context).icheck({
        checkboxClass: 'icheckbox_flat-blue',
        radioClass: 'iradio_flat-blue',
        disabledClass: ''
    });

    /* --------------- Initialisation des Textarea --------------- */
    // `.note-codable` is a summernote hidden textarea. Filter out to avoid textarea inception
    // Add class regular-textarea to remove summernote plugin
    // Add class no-toolbar to remove summernote toolbar
    $("textarea:not(.regular-textarea):not(.note-codable)", context).each(function () {
        let toolbar = [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['view', ['fullscreen', 'codeview', 'help']],
            ['custom', ['stt']]
        ];
        if($(this).hasClass("no-toolbar")){
            toolbar = [];
        }
        $(this).summernote({
            height: 200,
            toolbar: toolbar
        });
    });

    /* --------------- Initialisation des timepicker --------------- */
    $(".timepicker", context).timepicker({
        showInputs: false,
        showMeridian: false
    });

    /* --------------- Regex on decimal input --------------- */
    var reg = new RegExp("^[0-9]+([\.\,][0-9]*)?$");
    $("input[data-custom-type='decimal']", context).keyup(function () {
        while ($(this).val() != "" && !reg.test($(this).val()))
            $(this).val($(this).val().substring(0, $(this).val().length - 1))
    });

    /* --------------- Max length on input number --------------- */
    $("input[type='number']", context).keyup(function () {
        if (typeof $(this).data("custom-type") === "undefined") {
            if (this.value.length > 10)
                this.value = this.value.slice(0, 10);
        } else if ($(this).data("custom-type") == "bigint")
            if (this.value.length > 19)
                this.value = this.value.slice(0, 19);
    });

    /* --------------- Initialisation des DatetimePicker --------------- */
    /* --------------- Initialisation des datePicker --------------- */
    /* --------------- Initialisation des Input Maks --------------- */
    $("input[data-type='email']", context).inputmask({
        alias: "email"
    });

    /* Uncomment if you want to apply a mask on tel input */
    $("input[type='tel']", context).inputmask({mask: "99 99 99 99 99"});

    /* --------------- Initialisation des date a afficher correctement selon la langue --------------- */
    $('.simpledate-toconvert', context).each(function () {
        if (typeof $(this).html() !== "undefined" && $(this).html() != "" && $(this).html() != "Invalid date" && $(this).html() != "Invalid Date") {
            if ($(this).html().indexOf("/") == -1 && $(this).html().indexOf("-") == -1) {
                if (lang_user == "fr-FR")
                    $(this).html(moment(new Date($(this).html())).format("DD/MM/YYYY"));
                else
                    $(this).html(moment(new Date($(this).html())).format("YYYY-MM-DD"));
            }
        }
    });

    $('.datepicker-toconvert', context).each(function () {
        var currentVal = $(this).val();
        if (typeof currentVal !== "undefined" && currentVal != "" && currentVal != "Invalid date" && currentVal != "Invalid Date") {
            if (currentVal.indexOf("/") == -1 && currentVal.indexOf("-") == -1) {
                if (lang_user == "fr-FR")
                    $(this).val(moment(new Date(currentVal)).format("DD/MM/YYYY"));
                else
                    $(this).val(moment(new Date(currentVal)).format("YYYY-MM-DD"));
            }
        } else {
            $(this).val("");
        }
    });

    $('.datetimepicker-toconvert', context).each(function () {
        var currentVal = $(this).attr("value");
        if (typeof currentVal !== "undefined" && currentVal != "" && currentVal != "Invalid date" && currentVal != "Invalid Date") {
            if (currentVal.indexOf("/") == -1 && currentVal.indexOf("-") == -1) {
                if (lang_user == "fr-FR")
                    $(this).val(moment(new Date(currentVal)).format("DD/MM/YYYY HH:mm")).change();
                else
                    $(this).val(moment(new Date(currentVal)).format("YYYY-MM-DD HH:mm")).change();
            }
        } else {
            $(this).val("");
        }
    });

    $('img[data-type="picture"]', context).each(function () {
        var src = $(this).attr('src');
        //remove all pictures with null src value
        if (typeof src !== 'undefined' && src.split(',')[1] == '') {
            var msg = 'No image selected';
            if (lang_user == 'fr-FR')
                msg = 'Aucune image choisie';
            $(this).parent().replaceWith('<span>' + msg + '</span>');
        }
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
            alias: "dd/mm/yyyy",
            placeholder: "jj/mm/aaaa"
        });

        $('.datetimepicker', context).datetimepicker({
            format: "DD/MM/YYYY HH:mm",
            sideBySide: true
        });

        $(".datetimepicker", context).inputmask({
            mask: "1/2/y h:s",
            placeholder: "jj/mm/aaaa hh:mm",
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
            alias: "yyyy-mm-dd"
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
    $('.datepicker', context).each(function () {
        if ($(this).attr("data-today") == 1)
            $(this).datepicker("setDate", "0");
    });

    $('.datetimepicker', context).each(function () {
        if ($(this).attr("data-today") == 1)
            $(this).data("DateTimePicker").defaultDate(moment());
    });

    /* ----------------data-type qrcode generation -------------------------*/
    // Counter to avoid same id generation
    var ctpQrCode = 0;
    $("input[data-type='qrcode']", context).each(function () {
        if ($(this).val() != '') {
            //Update View, set attr parent id, Qrcode only work with component Id
            $(this).parent().parent().attr("id", $(this).attr('name') + ctpQrCode);
            //$(this).attr('name') = this parent id
            var qrcode = new QRCode($(this).attr('name') + ctpQrCode, {
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

    var displayBarCode = function (element) {
        var jq_element = $(element);
        var id = jq_element.attr('name');
        var img = '<br><img id="' + id + '" class="img img-responsive"/>';
        var barcodeType = jq_element.attr('data-custom-type');
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
    $("input[data-type='barcode']", context).each(function () {
        if ($(this).attr('show') == 'true' && $(this).val() != '') {
            displayBarCode(this);
        } else {
            if ($(this).attr('data-custom-type') === 'code39') {
                $(this).on('keyup', function () {
                    $(this).val($(this).val().toUpperCase());
                });
            }
        }
    });

    //input barcode
    $("input[data-type='code39']", context).each(function () {
        $(this).on('keyup', function () {
            $(this).val($(this).val().toUpperCase());
        });
    });

    //Mask for data-type currency
    $("input[data-type='currency']", context).each(function () {
        var val = $(this).val();
        //Fix display maskMoney bug with number and with zero
        if (val || val != '') {
            var partsOfVal = val.split('.');
            if (partsOfVal[1] && (partsOfVal[1].length < maskMoneyPrecision)) {
                for (var i = partsOfVal[1].length; i < maskMoneyPrecision; i++)
                    val += '0';
            }
        }
        $(this).val(val);
        $(this).maskMoney({
            thousands: ' ',
            decimal: '.',
            allowZero: true,
            suffix: '',
            precision: maskMoneyPrecision
        }).maskMoney('mask');
    });

    /* Add http:// by default if missing on given url */
    $("input[type='url']", context).each(function () {
        $(this).blur(function(){
            var currentUrl = $(this).val();
            if (currentUrl != "" && currentUrl.indexOf("http://") == -1 && currentUrl.indexOf("https://") == -1) {
                if(currentUrl.indexOf("://") != -1){
                    var toKeep = currentUrl.split("://")[1];
                    $(this).val("http://"+toKeep);
                } else {
                    $(this).val("http://"+currentUrl);
                }
            }
        })
    });

    /* --------------- Initialisation de DROPZONE JS - FIELD --------------- */
    $('.dropzone-field', context).each(function (index) {
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
            dictInvalidFileType: "Vous ne pouvez pas uploader un fichier de ce type.",
            autoDiscover: false,
            thumbnailWidth: 500,
            thumbnailHeight: 500,
            init: function () {
                this.on("addedfile", function () {
                    if (this.files[1] != null) {
                        this.removeFile(this.files[1]);
                        toastr.error("Vous ne pouvez ajouter qu'un seul fichier");
                    } else if (!this.files[0].default) {
                        $("#" + that.attr("id") + "_hidden_name").val(clearString(this.files[0].name));
                        $("#" + that.attr("id") + "_hidden").val(clearString(this.files[0].name));
                    }
                });

                this.on("sending", function (file, xhr, formData) {
                    var storageType = that.attr("data-storage");
                    var dataEntity = that.attr("data-entity");
                    var dataType = that.attr("data-type") || '';
                    formData.append("storageType", storageType);
                    formData.append("dataEntity", dataEntity);
                    formData.append("dataType", dataType);
                });
                this.on("maxfilesexceeded", function () {
                    this.removeFile(this.files[1]);
                    toastr.error("Vous ne pouvez ajouter qu'un seul fichier");
                });
                this.on("error", function (file, message) {
                    this.removeFile(this.files[0]);
                    toastr.error(message);
                    $("#" + that.attr("id") + "_hidden").removeAttr('value');
                });
                this.on('removedfile', function (file) {
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
                            success: function (success) {
                                $("#" + that.attr("id") + "_hidden").val('');
                                if (dropzone.files.length) {
                                    dropzone.removeAllFiles(true);
                                }
                            }
                        });
                    }
                });
            },
            renameFilename: function (filename) {
                filename = clearString(filename);
                if (filename.indexOf("dfltImg_") != -1)
                    return filename.replace("dfltImg_", "");
                if ($("#" + that.attr("id") + "_hidden").val() != '') {
                    var timeFile = moment().format("YYYYMMDD-HHmmss");
                    $("#" + that.attr("id") + "_hidden").val(timeFile + "_" + filename);
                    return timeFile + '_' + filename;
                }

            }
        });
        if (type == 'picture')
            dropzoneInit.options.acceptedFiles = 'image/gif, image/png, image/jpeg';
        else if (type === "docx/pdf")
            dropzoneInit.options.acceptedFiles = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        var dropzoneId = $(this).attr('id') + '';
        if ($('#' + dropzoneId + '_hidden').val() != '') {
            var mockFile = {
                name: "dfltImg_" + $('#' + dropzoneId + '_hidden').val(),
                type: 'mockfile',
                default: true
            };
            dropzoneInit.files.push(mockFile);
            dropzoneInit.emit('addedfile', mockFile);
            dropzoneInit.emit('thumbnail', mockFile, "data:image/;base64," + $('#' + dropzoneId + '_hidden').data('buffer'));
            dropzoneInit.emit('complete', mockFile);
        }
        dropzoneInit.done = false;
        dropzonesFieldArray.push(dropzoneInit);
    });

    // Component address
    if (typeof context.data === "undefined" || context.data("tabtype") != "print")
        initComponentAddress();

    // Input group addons click
    $(document).on("click", ".input-group-addon", function () {
        $(this).next("input").focus();
    });

    // Label click trigger concerned input
    $(document).on("click", "div:not([data-field='']) .form-group label", function () {
        let htmlType = ["input", "textarea", "select"]
        let input;
        for (var i=0; i < htmlType.length; i++) {
            if($(this).parent().find(htmlType[i]+"[name='"+$(this).attr("for")+"']").length != 0){
                input = $(this).parent().find(htmlType[i]+"[name='"+$(this).attr("for")+"']");
                break;
            }
        }
        if(typeof input !== "undefined"){
            switch(input.attr("type")) {
                case "checkbox":
                    if(!input.prop("disabled"))
                        input.icheck("toggle");
                    break;
                default:
                    if(!input.prop("readonly"))
                        input.focus();
                    else
                        input.select();
                    break;
            }
        }
    });

    $(document).on("click", ".copy-button", function(){
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val($(this).prev("a").text()).select();
        document.execCommand("copy");
        toastr.success('<i class="fa fa-copy"></i> : '+$(this).prev("a").text()+'</i>')
        $temp.remove();
    });
}

// DROPZONE
function initDropZone(context) {
    if (!context)
        context = document;

    /* File Storage Component */
    $('.dropzone_local_file_component', context).each(function (index) {
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
            init: function () {
                this.on("addedfile", function () {
                    if (this.files[1] != null) {
                        this.removeFile(this.files[1]);
                        toastr.error("Vous ne pouvez ajouter qu'un seul fichier");
                    } else {
                        $("#" + that.attr("id") + "_hidden_name").val(clearString(this.files[0].name));
                        $("#" + that.attr("id") + "_hidden").val(clearString(this.files[0].name));
                    }
                });
                this.on("sending", function (file, xhr, formData) {
                    var dataComponent = that.attr("data-component");
                    var dataSource = that.attr("data-source");
                    var dataSourceID = that.attr("data-sourceId");
                    formData.append("dataComponent", dataComponent);
                    formData.append("dataSource", dataSource);
                    formData.append("dataSourceID", dataSourceID);
                });
                this.on("maxfilesexceeded", function () {
                    this.removeFile(this.files[1]);
                    toastr.error("Vous ne pouvez ajouter qu'un seul fichier");
                });
                this.on("success", function (file, message) {
                    $("#" + that.attr("id") + "_hidden_name").parents("form")[0].submit();
                });
                this.on("error", function (file, message) {
                    this.removeFile(this.files[0]);
                    toastr.error(message);
                    $("#" + that.attr("id") + "_hidden").removeAttr('value');
                });
            },
            renameFilename: function (filename) {
                filename = clearString(filename);
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
    $(".print-tab input").each(function () {
        $(this).prop("disabled", true);
        $(this).attr("placeholder", "-");
        $(this).css("cursor", "default");
        $(this).css("padding", "0");
        if ($(this).attr("type") == "hidden" && !$(this).hasClass("print-not-remove"))
            $(this).remove();
    });

    $(".print-tab a:not([href=''])").each(function () {
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

    $(".print-tab select[multiple]").each(function () {
        if ($(this).val() == null) {
            $(this).replaceWith("<br>-");
        } else {
            var selectContent = "<br>";
            for (var i = 0; i < $(this).val().length; i++) {
                if (i > 0)
                    selectContent += ",&nbsp;";
                selectContent += $(this).val()[i];
            }
            $(this).replaceWith(selectContent);
        }
    });

    $(".print-tab input[type='color']").each(function () {
        $(this).css("width", "20%");
    });

    $(".print-tab a[data-type='url']").each(function () {
        if ($(this).text() == "")
            $(this).replaceWith("-");
    });

    $(".print-tab input[data-type='email']").each(function () {
        $(this).parent().removeClass("input-group");
    });

    $(".print-tab .input-group-addon").each(function () {
        $(this).remove();
    });

    $(".print-tab select").each(function () {
        $(this).replaceWith("<br><span>" + $(this).val() + "</span>");
    });

    $(".print-tab input[type='radio']:checked").each(function () {
        var formGroup = $(this).parent(".form-group");
        var label = formGroup.find("label");
        var htmlToWrite = label[0].outerHTML + "\n";
        formGroup.find("input[type='radio']").each(function () {
            if ($(this).prop("checked")) {
                htmlToWrite += "<br><span>" + $(this).val() + "</span>";
            }
        });
        formGroup.html(htmlToWrite);
    });

    $(".print-tab input[type='checkbox']").each(function () {
        var formGroup = $(this).parents(".form-group");
        var label = formGroup.find("label").html();
        var htmlToWrite = "<b>" + label + "</b>\n";
        formGroup.find("input[type='checkbox']").each(function () {
            if ($(this).prop("checked")) {
                htmlToWrite += "<br><span><i class='fa fa-check'></i></span>";
            } else {
                htmlToWrite += "<br><span><i class='fa fa-close'></i></span>";
            }
        });
        formGroup.html(htmlToWrite);
    });

    $(".print-tab textarea").each(function () {
        $(this).replaceWith("<br><span>" + $(this).val() + "</span>");
    });

    $(".print-tab button, .print-tab .btn").each(function () {
        $(this).remove();
    });

    $(".print-tab form").each(function () {
        $(this).remove();
    });

    $(".print-tab .print-remove").each(function () {
        $(this).remove();
    });

    // Component address
    $(".print-tab .c_address_maps").attr("mapsid", $(".print-tab .c_address_maps").attr("mapsid") + "_print");
    $(".print-tab .c_address_maps").attr("id", $(".print-tab .c_address_maps").attr("id") + "_print");
    setTimeout(function () {
        initMapsIfComponentAddressExists($(".print-tab"));
    }, 500);
}

function validateForm(form) {
    var isValid = true;

    function isFileProcessing() {
        for (var i = 0; i < dropzonesFieldArray.length; i++){
            if (dropzonesFieldArray[i].files.length == 1){
                if (dropzonesFieldArray[i].files[0].type != 'mockfile' && (dropzonesFieldArray[i].files[0].status != 'success' || dropzonesFieldArray[i].files[0].upload.progress != 100)){
                    return true;
                }
            }
        }
        return false;
    }

    function isFileRequired() {
        for (var i = 0; i < dropzonesFieldArray.length; i++){
            if($("input#"+$(dropzonesFieldArray[i].element).attr("id")+"_hidden", form).prop("required") && $("input#"+$(dropzonesFieldArray[i].element).attr("id")+"_hidden", form).val() == ""){
                return true;
            }
        }
        for(let item in dropzonesComponentArray){
            if($("input#"+$(dropzonesComponentArray[item][0].element).attr("id")+"_hidden", form).prop("required") && $("input#"+$(dropzonesComponentArray[item][0].element).attr("id")+"_hidden", form).val() == ""){
                return true;
            }
        }
        return false;
    }
    // If there are files to upload, block submition until files are uploaded
    if (isFileProcessing()) {
        toastr.warning(WAIT_UPLOAD_TEXT);
        return false;
    }

    // Check if input required and input file is empty to pop client side rejection toastr
    if (isFileRequired()) {
        toastr.error(REQUIRED_FILE_TEXT);
        return false;
    }

    /* On converti les dates francaises en date yyyy-mm-dd pour la BDD */
    if (lang_user == "fr-FR") {
        /* Datepicker FR convert*/
        form.find('.datepicker').each(function () {
            if ($(this).val().length > 0) {
                // Sécurité
                $(this).prop("readOnly", true);

                var date = $(this).val().split("/");
                if(date.length > 1){
                    var newDate = date[2] + "-" + date[1] + "-" + date[0];

                    // Remove mask to enable to transform the date
                    $(this).inputmask('remove');
                    $(this).val(newDate);
                }
            }
        });

        /* Datetimepicer FR convert */
        form.find('.datetimepicker').each(function () {
            if ($(this).val().length > 0) {
                // Sécurité
                $(this).prop("readOnly", true);

                var date = $(this).val().split("/");
                if(date.length > 1){
                    var yearDate = date[2].split(" ");
                    var newDate = yearDate[0] + "-" + date[1] + "-" + date[0] + " " + yearDate[1];

                    // Remove mask to enable to transform the date
                    $(this).inputmask('remove');

                    $(this).val(newDate);
                }
            }
        });
    }

    /* Convert all times in UTC */
    form.find('.datetimepicker').each(function () {
        if ($(this).val().length > 0) {
            // Sécurité
            $(this).prop("readOnly", true);
            $(this).val(moment.utc(new Date($(this).val())));
        }
    });

    /* If a select multiple is empty we want to have an empty value in the req.body */
    form.find("select[multiple]").each(function () {
        if ($(this).val() == null) {
            var input = $("<input>").attr("type", "hidden").attr("name", $(this).attr("name"));
            form.append($(input));
        }
    });

    /* Converti les checkbox "on" en value boolean true/false pour insertion en BDD */
    form.find("input[type='checkbox']").each(function () {
        if(!$(this).hasClass("no-formatage")){
            if ($(this).prop("checked")) {
                $(this).val(true);
            } else {
                /* Coche la checkbox afin qu'elle soit prise en compte dans le req.body */
                $(this).prop("checked", true);
                $(this).val(false);
            }
        } else {
            // If it's a multiple checkbox, we have to set an empty value in the req.body if no checkbox are checked
            if($("input[type='checkbox'][name='"+$(this).attr("name")+"']").length > 0){
                if($("input[type='checkbox'][name='"+$(this).attr("name")+"']:enabled:checked").length == 0){
                    var input = $("<input>").attr("type", "hidden").attr("name", $(this).attr("name"));
                    form.append($(input));
                }
            }
        }
    });

    /* Vérification que les input mask EMAIL sont bien complétés jusqu'au bout */
    form.find("input[data-type='email']").each(function () {
        if ($(this).val().length > 0 && !$(this).inputmask("isComplete")) {
            $(this).css("border", "1px solid red").parent().after("<span style='color: red;'>Le champ est incomplet.</span>");
            isValid = false;
        }
    });

    /* Vérification que les input mask URL sont bien complétés jusqu'au bout */
    form.find("input[data-type='url']").each(function () {
        if ($(this).val() != '' && !$(this).inputmask("isComplete")) {
            toastr.error(" Le champ " + $(this).attr("placeholder") + " est invalide");
            isValid = false;
        }
    });

    /* Vérification des types barcode */
    form.find("input[data-type='barcode']").each(function () {
        var val = $(this).val();
        if (val != '') {
            var customType = $(this).attr('data-custom-type');
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
                    case 'code39':                         var reg = new RegExp('\\[A-Z0-9-. $\/+]\\*', 'g');
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
    form.find("input[type='tel']").each(function () {
        if ($(this).val().length > 0 && !$(this).inputmask("isComplete")) {
            $(this).css("border", "1px solid red").parent().after("<span style='color: red;'>Le champ est incomplet.</span>");
            isValid = false;
        }
    });

    form.find("input[data-type='currency']").each(function () {
        //replace number of zero par maskMoneyPrecision value, default 2
        $(this).val(($(this).val().replace(/ /g, '')).replace(',00', ''));
    });

    return isValid;
}

/* --------------- Status comment modal --------------- */
function bindStatusComment(context) {
    if(!context)
        context = document;
    $(".status", context).click(function() {
        var url = $(this).data('href');

        // No comment for this status
        if ($(this).data('comment') != true)
            return location.href = url;

        // Comment required
        // Set hidden fields values
        var hrefParts = $(this).data('href').split('/');
        $("#statusComment input[name=parentName]").val(hrefParts[hrefParts.length-5]);
        $("#statusComment input[name=parentId]").val(hrefParts[hrefParts.length-3]);
        $("#statusComment input[name=field]").val(hrefParts[hrefParts.length-2]);
        $("#statusComment input[name=statusId]").val(hrefParts[hrefParts.length-1]);

        $("#statusComment").modal('show');
    });
}

// DOM READY LOADING
$(document).ready(function () {

    initForm();
    bindStatusComment();

    /* Save mini sidebar preference */
    $(document).on("click", ".sidebar-toggle", function () {
        var sidebarNewState = "open";
        if ($("body").hasClass('sidebar-open'))
            sidebarNewState = "close";
        else if ($("body").hasClass('sidebar-collapse'))
            sidebarNewState = "open";

        localStorage.setItem("newmips_mini_sidebar_preference", sidebarNewState);
    });

    $(document).on("click", ".btn-confirm", function () {
        if(confirm(DEL_CONFIRM_TEXT))
            return true;
        return false;
    });

    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    // Avoid double clicking on dynamic button
    $(document).on("click", ".btn.btn-primary, .btn.btn-default, .btn.btn-info, .btn.btn-warning, .btn.btn-danger, .btn.btn-success", function () {
        var context = this;
        $(this).prop("readOnly", true);
        $(this).css("cursor", "wait");
        var tmpText = $(this).html();
        if($(this).hasClass("btn-confirm")){
            if(!isChrome){
                $(this).html("<i class='fa fa-spinner fa-spin'></i>");
            }
        } else {
            $(this).html("<i class='fa fa-spinner fa-spin'></i>");
        }
        setTimeout(function(){
            $(context).prop("readOnly", false);
            $(context).css("cursor", "pointer");
            $(context).html(tmpText);
        }, 1000);
    });

    // Validate any form before submit
    $('form').submit(function (e) {
        $(this).find("button[type='submit']").text(LOADING_TEXT).attr("disabled", true);
        // Prevent multiple submittion (double click)
        if ($(this).data('submitting') === true)
            return e.preventDefault();
        $(this).data('submitting', true);
        if (!validateForm($(this))) {
            $(this).data('submitting', false);
            return false;
        }
        return true;
    });

    /* --------------- Inline Help --------------- */
    var currentHelp, modalOpen = false;
    $(document).delegate(".inline-help", 'click', function () {
        currentHelp = this;
        var entity;
        if ($(this).parents('.tab-pane').length && $(this).parents('.tab-pane').attr('id') != 'home')
            entity = $(this).parents('.tab-pane').attr('id').substring(2);
        else {
            var parts = window.location.href.split('/');
            entity = parts[parts.length - 2];
        }
        var field = $(this).data('field');
        $.ajax({
            url: "/inline_help/help/" + entity + "/" + field,
            success: function (content) {
                $("#prevHelp, #nextHelp").hide();
                var totalHelp = $(".inline-help").length - 1;
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
    $("#nextHelp, #prevHelp").click(function () {
        var count = $("#fields .inline-help").length - 1;
        var current = $("#fields .inline-help").index(currentHelp);
        if ($(this).attr('id') == 'nextHelp' && count > current)
            $("#fields .inline-help").eq(current + 1).click();
        else if ($(this).attr('id') == 'prevHelp' && current > 0)
            $("#fields .inline-help").eq(current - 1).click();
    });
    // Handle tab and shift+tab modal navigation
    $("#inlineHelp").on('show.bs.modal', function () {
        modalOpen = true;
    });
    $("#inlineHelp").on('hide.bs.modal', function () {
        modalOpen = false;
    });
    $(document).keypress(function (e) {
        if (modalOpen == false)
            return;
        var code = e.keyCode || e.which;
        // Tabulation
        if (e.shiftKey && code == '9')
            $("#prevHelp").click();
        else if (code == '9')
            $("#nextHelp").click();
    });

    /* --------------- Toastr messages --------------- */
    try {
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "newestOnTop": false,
            "progressBar": true,
            "positionClass": "toast-bottom-left",
            "preventDuplicates": true,
            "onclick": null,
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": "5000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
        for (var i = 0; i < toastrArray.length; i++) {
            setTimeout(function (toast) {
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
            success: function () {
                return true;
            },
            info: function () {
                return true;
            },
            error: function () {
                return true;
            },
            warning: function () {
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
    $(document).on("submit", ".component-form", function (e) {
        if (!filesComponentProceeded && dropzonesComponentArray[$(this).attr("data-component")].length > 0) {
            /* If there are files to write, stop submit and do this before */
            e.preventDefault();

            /* Send dropzone file */
            for (var i = 0; i < dropzonesComponentArray[$(this).attr("data-component")].length; i++) {
                if (dropzonesComponentArray[$(this).attr("data-component")][i].files.length > 0) {
                    dropzonesComponentArray[$(this).attr("data-component")][i].processQueue();
                    (function (ibis, myform) {
                        dropzonesComponentArray[myform.attr("data-component")][i].on("complete", function (file) {
                            if (ibis == dropzonesComponentArray[myform.attr("data-component")].length - 1) {
                                filesComponentProceeded = true;
                                myform.submit();
                            }
                        });
                    })(i, $(this))
                } else {
                    if (i == dropzonesComponentArray[$(this).attr("data-component")].length - 1) {
                        filesComponentProceeded = false;
                        toastr.error(REQUIRED_FILE_TEXT);
                        return false;
                    }
                }
            }
        }

        return true;
    });

    /* ---------------------- Composants ---------------------- */
    /** Do not remove **/
    /** Do not remove **/

    /* Component print button action */
    $(document).on("click", ".component-print-button", function () {
        // Clear component address
        $(".print-tab .section_c_address_fields .c_address_maps").replaceWith(
                "<div style='position:relative;height:450px;overflow:hidden;'>" +
                $(".print-tab .section_c_address_fields .c_address_maps").find(".olLayerGrid").parent().html() +
                "</div>");
        window.print();
        return true;
    });
});

function initComponentAddress(context) {
    (function () {
        var componentAddressConf = {
            url: "https://api-adresse.data.gouv.fr/search/",
            query_parm: 'q',
            type: 'get', // HTTP request type
            addresses: 'features', // objet which contain list of address, if equal '.' whe take response as list,
            address_fields: 'properties', // objet name which contain attributes or '.' ,
            autocomplete_field: 'label', // field of properties, we use this field to select proposition. We can use ',' as separator to display in autocomplete more than one field value,
            enable: true // If  enable, do query and get data, else data should be to set manually by user
        };
        if (componentAddressConf.enable) {
            $('.c_address_field').on('keyup', function () {
                $(this).val($(this).val().toUpperCase());
            });
            $("#c_address_search_area", context).each(function () {
                var result;
                var fieldsToShow = componentAddressConf.autocomplete_field.split(',');
                $(this).autocomplete({
                    minLength: 1,
                    source: function (req, res) {
                        var val = $('#c_address_search_area').val();
                        var data = {limit: 10};
                        data[componentAddressConf.query_parm] = val;
                        $.ajax({
                            url: componentAddressConf.url,
                            type: componentAddressConf.type,
                            data: data,
                            dataType: 'json',
                            success: function (data) {
                                result = componentAddressConf.addresses !== '.' ? data[componentAddressConf.addresses] : data;
                                res($.map(result, function (_address) {
                                    var objet = componentAddressConf.address_fields !== '.' ? _address[componentAddressConf.address_fields] : _address;
                                    var toReturn = '';
                                    fieldsToShow.forEach(function (field) {
                                        toReturn += objet[field] + ' ';
                                    });
                                    return toReturn;
                                }));
                            }
                        });
                    },
                    select: function (e, ui) {
                        result.forEach(function (_) {
                            var toReturn = '';
                            var _address = componentAddressConf.address_fields !== '.' ? _[componentAddressConf.address_fields] : _;
                            var toReturn = '';
                            fieldsToShow.forEach(function (field) {
                                toReturn += _address[field] + ' ';
                            });
                            if (ui.item.value == toReturn) {
                                for (var key in _address) {
                                    if (_address[key] != '') //to prevent to replace default value
                                        $('input[field=' + key + ']').val((_address[key] + '').toUpperCase());
                                }
                                /** Set Lat and Long value **/
                                $('input[name=f_c_address_lat]').val(_.geometry.coordinates[1]);
                                $('input[name=f_c_address_lon]').val(_.geometry.coordinates[0]);
                                if ((!_address.street || typeof _address.street === "undefined") && _address.name)
                                    $("#f_c_address_street").val(_address.name);

                            }
                        });
                    }
                });
            });
        }
    }());
    $('#info_c_address_maps').on('click', function (e) {
        e.preventDefault();
        $.ajax({
            url: '/address_settings/info_c_address_maps_ajax',
            methode: 'GET',
            success: function (data) {
                if (data && data.message) {
                    var html = '<div class="modal fade" tabindex="-1" role="dialog">';
                    html += '<div class="modal-dialog" role="document">';
                    html += '<div class="modal-content">';
                    html += '<div class="modal-header" style="background:#3c8dbc;color:#ffffff">';
                    html += '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
                    html += '<h4 class="modal-title">Information</h4>';
                    html += '</div>';
                    html += '<div class="modal-body">';
                    html += data.message;
                    html += '</div>';
                    html += '</div>';
                    html += '</div>';
                    html += '</div>';
                    $(html).modal('show');
                }
            },
            error: function (e) {}
        });
        return false;
    });
    setTimeout(function () {
        initMapsIfComponentAddressExists(context);
    }, 500);
}

function initMapsIfComponentAddressExists(context) {
    if (!context)
        context = document;
    $('.section_c_address_fields', context).each(function () {
        var address_context = this;

        var f_c_address_lat = $(address_context).find('.f_c_address_lat').val();
        var f_c_address_lon = $(address_context).find('.f_c_address_lon').val();
        var f_c_address_enableMaps = $(address_context).find('.f_c_address_enableMaps').val();
        if (f_c_address_lat && f_c_address_lon && f_c_address_enableMaps) {
            initComponentAddressMaps(f_c_address_lat, f_c_address_lon, address_context);
        } else if ((!f_c_address_lat || !f_c_address_lon) && f_c_address_enableMaps) {
            var info = '<div class="alert bg-gray alert-dismissible " >'
                    + '<button type="button" class="close" data-dismiss="alert" aria-hidden="true" id="btnDismissInfoInvalidAddress">×</button>'
                    + '<h4><i class="icon fa fa-exclamation-triangle"></i> ' + $('#f_c_address_notValid').val() + '</h4>'
                    + '</div>';
            $('.c_address_maps', address_context).append(info);
            $('#btnDismissInfoInvalidAddress', address_context).on('click', function () {
                $('.c_address_maps', address_context).parent().remove();
                $('.c_address_fields', address_context).removeClass('col-md-6').addClass('col-md-12');
            });
        }
    });
    function initComponentAddressMaps(lat, lon, mapsContext) {
        try {
            $(mapsContext).find('.c_address_maps').each(function () {
                $(this).empty();
                var options = {
                    controls: []
                };
                if ($('.f_c_address_navigation', mapsContext).val() === 'true')
                    options.controls.push(new OpenLayers.Control.Navigation());
                if ($('.f_c_address_zoomBar', mapsContext).val() === 'true')
                    options.controls.push(new OpenLayers.Control.PanZoomBar());
                if ($('.f_c_address_mousePosition', mapsContext).val() === 'true')
                    options.controls.push(new OpenLayers.Control.MousePosition());

                var map = new OpenLayers.Map($(this).attr('mapsid'), options);
                var mapnik = new OpenLayers.Layer.OSM();
                var fromProjection = new OpenLayers.Projection("EPSG:4326");   // Transform from WGS 1984
                var toProjection = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection
                var position = new OpenLayers.LonLat(lon,lat).transform(fromProjection, toProjection);
                var zoom = 15;
                var markers = new OpenLayers.Layer.Markers("Markers");

                map.addLayer(markers);
                markers.addMarker(new OpenLayers.Marker(position));
                map.addLayer(mapnik);
                map.setCenter(position, zoom);
            });
        } catch (e) {
            console.log(e);
        }
    }
}

function clearString(string){

    // Remove space before and after
    string = string.trim();
    // Remove multipe spaces
    string = string.replace(/\s\s+/g, ' ');
    string = string.replace(/é/g, "e");
    string = string.replace(/è/g, "e");
    string = string.replace(/\ê/g, "e");
    string = string.replace(/\ë/g, "e");
    string = string.replace(/\È/g, "e");
    string = string.replace(/\É/g, "e");
    string = string.replace(/\Ê/g, "e");
    string = string.replace(/\Ë/g, "e");

    string = string.replace(/à/g, "a");
    string = string.replace(/â/g, "a");
    string = string.replace(/ä/g, "a");
    string = string.replace(/\À/g, "a");
    string = string.replace(/\Â/g, "a");
    string = string.replace(/\Ä/g, "a");

    string = string.replace(/ô/g, "o");
    string = string.replace(/ö/g, "o");

    string = string.replace(/î/g, "i");
    string = string.replace(/ï/g, "i");
    string = string.replace(/Î/g, "i");
    string = string.replace(/Ï/g, "i");

    string = string.replace(/û/g, "u");
    string = string.replace(/ù/g, "u");
    string = string.replace(/ü/g, "u");
    string = string.replace(/\Ù/g, "u");
    string = string.replace(/\Ü/g, "u");
    string = string.replace(/\Û/g, "u");

    string = string.replace(/ç/g, "c");
    string = string.replace(/ĉ/g, "c");
    string = string.replace(/\Ç/g, "c");
    string = string.replace(/\Ĉ/g, "c");

    string = string.replace(/'/g, "_");
    string = string.replace(/,/g, "_");
    string = string.replace(/ /g, "_");
    string = string.replace(/-/g, "_");
    string = string.replace(/\\/g, "_");
    string = string.replace(/!/g, "_");
    string = string.replace(/\(/g, "_");
    string = string.replace(/\)/g, "_");
    string = string.replace(/\//g, "_");
    string = string.replace(/\\/g, "_");
    string = string.replace(/\./g, "_");
    string = string.replace(/\;/g, "_");
    string = string.replace(/\?/g, "_");
    string = string.replace(/\"/g, "_");
    string = string.replace(/\&/g, "_");
    string = string.replace(/\*/g, "_");
    string = string.replace(/\$/g, "_");
    string = string.replace(/\%/g, "_");
    string = string.replace(/\£/g, "_");
    string = string.replace(/\€/g, "_");
    string = string.replace(/\µ/g, "_");
    string = string.replace(/\°/g, "_");
    string = string.replace(/\=/g, "_");
    string = string.replace(/\+/g, "_");
    string = string.replace(/\}/g, "_");
    string = string.replace(/\{/g, "_");
    string = string.replace(/\#/g, "_");
    string = string.replace(/\`/g, "_");
    string = string.replace(/\|/g, "_");
    string = string.replace(/\@/g, "_");
    string = string.replace(/\^/g, "_");
    string = string.replace(/\]/g, "_");
    string = string.replace(/\[/g, "_");
    string = string.replace(/\~/g, "_");
    string = string.replace(/\:/g, "_");
    string = string.replace(/\×/g, "_");
    string = string.replace(/\¿/g, "_");
    string = string.replace(/\¡/g, "_");
    string = string.replace(/\÷/g, "_");

    string = string.replace(String.fromCharCode(65533), "e");
    string = string.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    return string;
}