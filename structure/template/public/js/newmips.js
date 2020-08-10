var maskMoneyPrecision = 2;
var dropzonesFieldArray = [];
Dropzone.autoDiscover = false;

/* --------------- SELECT2 Ajax Loading --------------- */
function select2_ajaxsearch(select, placeholder) {
    if (!placeholder)
        placeholder = SELECT_DEFAULT_TEXT;

    var searchField = select.data('using').split(',');

    // Use custom url on select or build default url
    var url = select.data('href') ? select.data('href') : select.data('url') ? select.data('url') : '/' + select.data('source') + '/search';
    select.select2({
        placeholder: placeholder,
        allowClear: true,
        ajax: {
            url: url,
            dataType: 'json',
            method: 'POST',
            delay: 250,
            contentType: "application/json",
            data: function (params) {
                var ajaxdata = {
                    search: params.term,
                    page: params.page || 1,
                    searchField: searchField
                };
                // customwhere example: data-customwhere='{"myField": "myValue"}'
                // Do not work for related to many fields if the field is a foreignKey !
                if (select.data('customwhere') !== undefined) {
                    // Handle this syntax: {'myField': 'myValue'}, JSON.stringify need "", no ''
                    if (typeof select.data('customwhere') === "object")
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
                if (select.attr("multiple") != "multiple" && !params.page)
                    results.push({id: "nps_clear_select", text: placeholder});
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

    // Clear select if default option is chosen, do not work natively with select2
    if (select.attr("multiple") != "multiple")
        select.on('change', function () {
            if ($(this).val() == 'nps_clear_select')
                $(this).val(null).trigger('change');
        });
}

/* --------------- Initialisation HTML FORM --------------- */
function initForm(context) {
    if (!context)
        context = document;

    $("select.ajax", context).each(function () {
        // Avoid new instanciation if already in select2
        // Fix width css glitch when switching tabs
        if (typeof $(this).data("select2") === "undefined")
            select2_ajaxsearch($(this));
    });
    $("select:not(.ajax):not(.regular-select)", context).each(function () {
        if (typeof $(this).data("select2") === "undefined")
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
        if ($(this).hasClass("no-toolbar")) {
            toolbar = [];
        }
        $(this).summernote({
            height: 200,
            toolbar: toolbar,
            callbacks: {
                onPaste: function(e) {
                    // Avoid paste code from ms word or libreoffice that would break some ihm feature
                    // Only copy / paste plain text
                    var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
                    e.preventDefault();
                    setTimeout(function() {
                        document.execCommand('insertText', false, bufferText);
                    }, 10);
                }
            }
        });
    });

    /* --------------- Initialisation des timepicker --------------- */
    $(".timepicker", context).timepicker({
        showInputs: false,
        showMeridian: false
    });

    /* --------------- Regex on decimal input --------------- */
    var reg = new RegExp("^-?[0-9]+([\.\,][0-9]*)?$");
    $("input[data-custom-type='decimal']", context).keyup(function () {
        while ($(this).val() != "" && $(this).val() != "-" && !reg.test($(this).val()))
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
            // Update View, set attr parent id, Qrcode only work with component Id
            $(this).parent().parent().attr("id", $(this).attr('name') + ctpQrCode);
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
                console.error(e);
                jq_element.parent().parent().find('br').remove();
                jq_element.parent().parent().find('#' + id).remove();
            }
        }
    };

    // Input barcode
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

    // Input barcode
    $("input[data-type='code39']", context).each(function () {
        $(this).on('keyup', function () {
            $(this).val($(this).val().toUpperCase());
        });
    });

    // Mask for data-type currency
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
        $(this).blur(function () {
            var currentUrl = $(this).val();
            if (currentUrl != "" && currentUrl.indexOf("http://") == -1 && currentUrl.indexOf("https://") == -1) {
                if (currentUrl.indexOf("://") != -1) {
                    var toKeep = currentUrl.split("://")[1];
                    $(this).val("http://" + toKeep);
                } else {
                    $(this).val("http://" + currentUrl);
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
            dictRemoveFileConfirmation: "Êtes-vous sur de vouloir supprimer ce fichier ?",
            dictCancelUpload: "Annuler",
            dictInvalidFileType: "Vous ne pouvez pas uploader un fichier de ce type.",
            autoDiscover: false,
            thumbnailWidth: 500,
            thumbnailHeight: 500,
            init: function () {
                this.on("addedfile", function (file) {
                    if (this.files[1] != null) {
                        this.files[1].exceedRemove = true;
                        this.removeFile(this.files[1]);
                        toastr.error("Vous ne pouvez ajouter qu'un seul fichier");
                    }
                });

                this.on("sending", function (file, xhr, formData) {
                    formData.append("entity", that.attr("data-entity"));
                    formData.append("dataType", that.attr("data-type") || '');
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

                this.on("complete", function (file, xhr, formData) {
                    /* Add possibility to download the uploaded file in the dropzone */
                    $(file.previewTemplate).find('a.dz-remove').after(
                        '<a style="text-align: center;cursor: pointer;display: block;" href="/default/download?entity='+that.attr("data-entity")+'&f='+$("#" + that.attr("id") + "_hidden").val()+'">Télécharger</a>');
                });

                this.on("success", function (file, message) {
                    /* Only in file storage component */
                    if(that.hasClass('file-storage-dropzone')) {
                        $.ajax({
                            url: '/' + that.attr('data-entity').substring(2) + '/create',
                            type: 'POST',
                            context: this,
                            data: {
                                entity: that.attr("data-entity"),
                                associationFlag: that.attr("data-flag"),
                                associationSource: that.attr("data-source"),
                                associationForeignKey: that.attr("data-fk"),
                                associationAlias: that.attr("data-alias"),
                                associationUrl: that.attr("data-url"),
                                f_filename: $("#" + that.attr("id") + "_hidden").val()
                            },
                            complete: function() {
                                $("#table_" + that.attr('data-entity')).DataTable().ajax.reload();
                                $("#" + that.attr("id") + "_hidden").val('');
                                this.removeAllFiles();
                            }
                        });
                    }
                });

                this.on('removedfile', function (file) {
                    if (file.status != "error" && !that.hasClass('file-storage-dropzone') && !file.exceedRemove) {
                        var dropzone = this;
                        $.ajax({
                            url: '/default/delete_file',
                            type: 'post',
                            data: {
                                entity: that.attr("data-entity"),
                                filename: $("#" + that.attr("id") + "_hidden").val()
                            },
                            error: function(err) {
                                console.error(err);
                            },
                            complete: function() {
                                $("#" + that.attr("id") + "_hidden").val('');
                                $("#" + that.attr("id") + "_hidden_name").val('');
                                if (dropzone.files.length > 1) {
                                    dropzone.removeAllFiles(true);
                                }
                            }
                        });
                    }
                });
            },
            renameFile: function (file) {
                var filename = file.name;
                var value = $('#' + dropzoneId + '_hidden').val();
                if(value)
                    return value;

                var uuid = uuidv4().replace(/-/g, '');
                var filenameCleanedAndRenamed = clearString(filename);
                var timeFile = moment().format("YYYYMMDD-HHmmss");
                filenameCleanedAndRenamed = timeFile + '_' + uuid + '_' + filenameCleanedAndRenamed;
                $('#' + dropzoneId + '_hidden').val(filenameCleanedAndRenamed);
                $('#' + dropzoneId + '_hidden_name').val(filenameCleanedAndRenamed);
                return filenameCleanedAndRenamed;
            }
        });

        if (type == 'picture')
            dropzoneInit.options.acceptedFiles = 'image/gif,image/png,image/jpeg';
        else if (type === "docx/pdf")
            dropzoneInit.options.acceptedFiles = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        var dropzoneId = $(this).attr('id') + '';
        if ($('#' + dropzoneId + '_hidden').val()) {
            var mockFile = {
                name: $('#' + dropzoneId + '_hidden').val(),
                type: 'mockfile',
                default: true
            };
            dropzoneInit.files.push(mockFile);
            dropzoneInit.emit('addedfile', mockFile);
            if(typeof $('#' + dropzoneId + '_hidden').data('buffer') === undefined)
                dropzoneInit.emit('thumbnail', mockFile, "data:image/;base64," + $('#' + dropzoneId + '_hidden').data('buffer'));
            else
                dropzoneInit.emit('thumbnail', mockFile, "https://newmips.com/wp-content/uploads/2019/09/download-file.png");
            dropzoneInit.emit('thumbnail', mockFile, "data:image/;base64," + $('#' + dropzoneId + '_hidden').data('buffer'));
            dropzoneInit.emit('complete', mockFile);
        }
        dropzoneInit.done = false;
        dropzonesFieldArray.push(dropzoneInit);
    });

    // Component address
    initComponentAddress(context);

    // Input group addons click
    $(document).on("click", ".input-group-addon", function () {
        $(this).next("input").focus();
    });

    // Label click trigger concerned input
    $(document).on("click", "div:not([data-field='']) .form-group label", function () {
        let htmlType = ["input", "textarea", "select"]
        let input;
        for (var i = 0; i < htmlType.length; i++) {
            if ($(this).parent().find(htmlType[i] + "[name='" + $(this).attr("for") + "']").length != 0) {
                input = $(this).parent().find(htmlType[i] + "[name='" + $(this).attr("for") + "']");
                break;
            }
        }
        if (typeof input !== "undefined") {
            switch (input.attr("type")) {
                case "checkbox":
                    if (!input.prop("disabled"))
                        input.icheck("toggle");
                    break;
                default:
                    if (!input.prop("readonly"))
                        input.focus();
                    else
                        input.select();
                    break;
            }
        }
    });

    $(document).on("click", ".copy-button", function () {
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val($(this).prev("a").text()).select();
        document.execCommand("copy");
        toastr.success('<i class="fa fa-copy"></i> : ' + $(this).prev("a").text() + '</i>')
        $temp.remove();
    });

    // Preview file modal in show
    $(document).on('click', '.preview_file', function () {

        let downloadURL = '/default/download?entity=' + $(this).data('entity') + '&amp;f=' + encodeURIComponent($(this).data('filename'));
        $.ajax({
            url: '/default/get_file',
            type: 'GET',
            data: {entity: $(this).data('entity'), src: $(this).data('filename')},
            success: function (result) {

                var showHTML = '<p><img class="img img-responsive" src=data:image/;base64,' + result.data + ' alt=' + result.file + '/></p>';
                if(result.file.substring(result.file.length, result.file.length - 4) == '.pdf') {
                    var binaryPDF = generateFileViewer(result.data);
                    showHTML = '<iframe src=/js/plugins/pdf/web/viewer.html?file=' + encodeURIComponent(binaryPDF) + ' style="width:100%;min-height:500px !important;" allowfullscreen webkitallowfullscreen ></iframe>';
                }

                var modalHTML = '\
                <div class="modal fade" tabindex="-1" role="dialog">\
                    <div class="modal-dialog" role="document" style="width:60%;">\
                        <div class="modal-content">\
                            <div class="modal-header skin-blue-light">\
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
                                <h4 class="modal-title">' + result.file + '</h4>\
                            </div>\
                            <div class="modal-body">\
                                ' + showHTML + '\
                                <a href="' + downloadURL + '" class="btn btn-primary"><i class="fa fa-download"></i>&nbsp;&nbsp;Télécharger</a>\
                            </div>\
                            <div class="modal-footer">\
                            <button type="button" class="btn btn-danger" data-dismiss="modal">' + STR_LANGUAGE.close + '</button>\
                            </div>\
                        </div>\
                    </div>\
                </div>';

                $(modalHTML).modal('show');
            },
            error: function(err) {
                console.error(err);
            }
        });
    });
}

/* --------------- FORM validation on submit  --------------- */
function validateForm(form) {
    var isValid = true;

    function isFileProcessing() {
        for (var i = 0; i < dropzonesFieldArray.length; i++) {
            if (dropzonesFieldArray[i].files.length == 1) {
                if (dropzonesFieldArray[i].files[0].type != 'mockfile' && (dropzonesFieldArray[i].files[0].status != 'success' || dropzonesFieldArray[i].files[0].upload.progress != 100)) {
                    return true;
                }
            }
        }
        return false;
    }

    function isFileRequired() {
        for (var i = 0; i < dropzonesFieldArray.length; i++) {
            if ($("input#" + $(dropzonesFieldArray[i].element).attr("id") + "_hidden", form).prop("required") && $("input#" + $(dropzonesFieldArray[i].element).attr("id") + "_hidden", form).val() == "") {
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
                if (date.length > 1) {
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
                if (date.length > 1) {
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
    // form.find('.datetimepicker').each(function () {
    //     if ($(this).val().length > 0) {
    //         // Sécurité
    //         $(this).prop("readOnly", true);
    //         $(this).val(moment.utc(new Date($(this).val())));
    //     }
    // });

    /* If a select is empty we want to have an empty value in the req.body */
    form.find("select").each(function() {
        if ($(this).val() == null) {
            var input = $("<input>").attr("type", "hidden").attr("name", $(this).attr("name"));
            form.append($(input));
        }
    });

    var checkedFound = true;
    form.find(".relatedtomany-checkbox").each(function () {
        if ($(this).attr('required') == 'required') {
            checkedFound = false;
            $(this).find('input[type="checkbox"]').each(function () {
                if ($(this).icheck('update')[0].checked) {
                    checkedFound = true;
                    return false; // Break
                }
            });
            if (!checkedFound)
                return false;  // Break
        }
    });

    if (!checkedFound) {
        toastr.error(REQUIRED_RELATEDTOMANYCHECKBOX);
        return false;
    }

    /* Converti les checkbox "on" en value boolean true/false pour insertion en BDD */
    form.find("input[type='checkbox']").each(function () {
        if (!$(this).hasClass("no-formatage")) {
            if ($(this).prop("checked")) {
                $(this).val(true);
            } else {
                /* Coche la checkbox afin qu'elle soit prise en compte dans le req.body */
                $(this).prop("checked", true);
                $(this).val(false);
            }
        } else {
            // If it's a multiple checkbox, we have to set an empty value in the req.body if no checkbox are checked
            if ($("input[type='checkbox'][name='" + $(this).attr("name") + "']").length > 0) {
                if ($("input[type='checkbox'][name='" + $(this).attr("name") + "']:enabled:checked").length == 0) {
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
                    case 'code39':
                        var reg = new RegExp('\\[A-Z0-9-. $\/+]\\*', 'g');
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
    var telRegex = new RegExp(/^(?:(?:\+|00)33[\s.-]{0,3}(?:\(0\)[\s.-]{0,3})?|0)[1-9](?:(?:[\s.-]?\d{2}){4}|\d{2}(?:[\s.-]?\d{3}){2})$/)
    form.find("input[type='tel']").each(function () {
        if ($(this).val().length > 0 && (!$(this).inputmask("isComplete") || !telRegex.test($(this).val()))) {
            $(this).css("border", "1px solid red").parent().after("<span style='color: red;'>Le champ est incorrect.</span>");
            isValid = false;
            $([document.documentElement, document.body]).animate({
                scrollTop: $(this).offset().top
            }, 500);
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
    if (!context)
        context = document;
    $(".status", context).click(function () {
        var url = $(this).data('href');

        // No comment for this status
        if ($(this).data('comment') != true)
            return location.href = url;

        // Comment required
        // Set hidden fields values
        var hrefParts = $(this).data('href').split('/');
        $("#statusComment input[name=parentName]").val(hrefParts[hrefParts.length - 5]);
        $("#statusComment input[name=parentId]").val(hrefParts[hrefParts.length - 3]);
        $("#statusComment input[name=field]").val(hrefParts[hrefParts.length - 2]);
        $("#statusComment input[name=statusId]").val(hrefParts[hrefParts.length - 1]);

        $("#statusComment").modal('show');
    });
}

/* --------------- COMPONENT - Document Template  --------------- */
function initDocumentTemplateHelper() {

    function onClickDocumentTemplateHelper() {
        $('#document_template_helper').click(function (e) {
            e.preventDefault();
            var select = $('#document_template_select_entity').val();
            if (select)
                window.open("/document_template/readme/" + select, "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=600,height=500");
            return false;
        });
    }

    function updateDocumentTemplateSubEntities(entity) {
        if (entity) {
            $.ajax({
                url: '/document_template/entities/' + entity + '/relations',
                methode: 'GET',
                success: function (data) {
                    if (data.relations) {
                        $('#f_exclude_relations').empty();
                        data.relations.forEach(function (relation) {
                            $('#f_exclude_relations').append('<option value=' + relation.value + ' selected>' + relation.item + '</option>');
                        });
                    }
                }
            });
        }
    }

    $('#document_template_select_entity').on('change', function () {
        onClickDocumentTemplateHelper();
        updateDocumentTemplateSubEntities($(this).val());
    });

    $('#document_template_sub_entities').on('click', function (e) {
        e.preventDefault();
        $.ajax({
            url: '/document_template/help/subEntities',
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
            }
        });
        return false;
    });

    onClickDocumentTemplateHelper();
}
initDocumentTemplateHelper();

/* --------------- COMPONENT - Address  --------------- */
function initComponentAddress(context) {

    var componentAddressConf = {
        url: "https://api-adresse.data.gouv.fr/search/",
        query_parm: 'q',
        type: 'get', // HTTP request type
        addresses: 'features', // objet which contain list of address, if equal '.' whe take response as list,
        address_fields: 'properties', // objet name which contain attributes or '.' ,
        autocomplete_field: 'label', // field of properties, we use this field to select proposition. We can use ',' as separator to display in autocomplete more than one field value,
        enable: true // If  enable, do query and get data, else data should be to set manually by user
    };

    if (!componentAddressConf.enable)
        return;

    $('.address_field').on('keyup', function () {
        $(this).val($(this).val().toUpperCase());
    });

    $(".address_search_input", context).each(function () {
        var result;
        var fieldsToShow = componentAddressConf.autocomplete_field.split(',');
        var currentContext = $(this).parents('section.section_address_fields');
        $(this).autocomplete({
            minLength: 1,
            source: function (req, res) {
                var val = $('#address_search_input', currentContext).val();
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
                                $('input[field=' + key + ']', currentContext).val((_address[key] + '').toUpperCase());
                        }
                        /** Set Lat and Long value **/
                        $('input[name=f_address_lat]', currentContext).val(_.geometry.coordinates[1]);
                        $('input[name=f_address_lon]', currentContext).val(_.geometry.coordinates[0]);
                        if ((!_address.street || typeof _address.street === "undefined") && _address.name)
                            $("#f_address_street", currentContext).val(_address.name);
                    }
                });
            }
        });
    });

    $('#info_address_maps').on('click', function (e) {
        e.preventDefault();
        $.ajax({
            url: '/address_settings/info_address_maps_ajax',
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

    $('.section_address_fields', context).each(function () {
        var address_context = this;

        var f_address_lat = $(address_context).find('.f_address_lat').val();
        var f_address_lon = $(address_context).find('.f_address_lon').val();
        var f_address_enableMaps = $(address_context).find('.f_address_enableMaps').val();
        if (f_address_lat && f_address_lon && f_address_enableMaps) {
            initComponentAddressMaps(f_address_lat, f_address_lon, address_context);
        } else if ((!f_address_lat || !f_address_lon) && f_address_enableMaps) {
            var info = '<div class="alert bg-gray alert-dismissible " >'
                + '<button type="button" class="close" data-dismiss="alert" aria-hidden="true" id="btnDismissInfoInvalidAddress">×</button>'
                + '<h4><i class="icon fa fa-exclamation-triangle"></i> ' + $('#f_address_notValid').val() + '</h4>'
                + '</div>';
            $('.address_maps', address_context).append(info);
            $('#btnDismissInfoInvalidAddress', address_context).on('click', function () {
                $('.address_maps', address_context).parent().remove();
                $('.address_fields', address_context).removeClass('col-md-6').addClass('col-md-12');
            });
        }
    });
}

// Tool - Init Map on given lat / lon
function initComponentAddressMaps(lat, lon, mapsContext) {
    try {
        $(mapsContext).find('.address_maps').each(function () {
            var that = $(this);
            $(this).empty();
            var control = ol.control.defaults();
            var options = {
                controls: []
            };
            lon = parseFloat(lon);
            lat = parseFloat(lat);

            const markerSource = new ol.source.Vector();
            var markerStyle = new ol.style.Style({
                image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                    anchor: [0.5, 46],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.75,
                    src: '/img/address_map_marker.png'
                }))
            });
            var iconFeature = new ol.Feature({
                geometry: new ol.geom.Point(ol.proj.transform([lon, lat], 'EPSG:4326',
                    'EPSG:3857')),
                name: '',
                population: 4000,
                rainfall: 500
            });

            markerSource.addFeature(iconFeature);
            if ($('.f_address_zoomBar', mapsContext).val() === 'true') {
                var zoomSlider = new ol.control.ZoomSlider();
                options.controls.push(zoomSlider)
            }
            if ($('.f_address_mousePosition', mapsContext).val() === 'true') {
                var mousePositionControl = new ol.control.MousePosition({
                    coordinateFormat: ol.coordinate.createStringXY(4),
                    projection: 'EPSG:4326',
                    // comment the following two lines to have the mouse position
                    // be placed within the map.
                    className: 'custom-mouse-position',
                    // target: document.getElementById('mouse-position'),
                    undefinedHTML: '&nbsp;'
                });
                options.controls.push(mousePositionControl);
            }
            var mapConfig = {
                controls: control.extend(options.controls),
                target: that.attr('id'),
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.OSM()
                    }),
                    new ol.layer.Vector({
                        source: markerSource,
                        style: markerStyle,
                    })
                ],
                view: new ol.View({
                    center: ol.proj.fromLonLat([lon, lat]),
                    zoom: 17
                })
            };
            if ($('.f_address_navigation', mapsContext).val() === 'false') {
                mapConfig.interactions = [];
                mapConfig.controls = [];
            }
            var map = new ol.Map(mapConfig);

        });
    } catch (e) {
        console.log(e);
    }
}

/* --------------- UTILS  --------------- */
// Clear string from every special char
function clearString(string) {
    string = string.trim();
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
    string = string.replace(/\²/g, "_");
    string = string.replace(String.fromCharCode(65533), "e");
    string = string.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    string = string.toLowerCase();
    return string;
}

// Generate and open a modal
function doModal(title, content) {
    $('#tmp_text_modal').remove();
    var modal_html = '\
    <div id="tmp_text_modal" class="modal fade" tabindex="-1" role="dialog">\
        <div class="modal-dialog" role="document">\
            <div class="modal-content">\
                <div class="modal-header">\
                    <a class="close" data-dismiss="modal">×</a>\
                    <h4>' + title + '</h4>\
                </div>\
                <div class="modal-body">\
                    <p>' + content.replace(/(?:\r\n|\r|\n)/g, '<br>') + '</p>\
                </div>\
                <div class="modal-footer">\
                    <span class="btn btn-default" data-dismiss="modal">\
                        Fermer\
                    </span>\
                </div>\
            </div>\
        </div>\
    </div>';
    $("body").append(modal_html);
    $("#tmp_text_modal").modal();
}

// File viewer generation
function generateFileViewer(base64) {
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }

    var binaryData = [];
    binaryData.push(array);
    var dataPdf = window.URL.createObjectURL(new Blob(binaryData, {
        type: "application/pdf"
    }))
    return dataPdf;
}

/* --------------- DOCUMENT READY --------------- */
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
        if (confirm(DEL_CONFIRM_TEXT))
            return true;
        return false;
    });

    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    // Avoid double clicking on dynamic button
    if (!isChrome)
        $(document).on("click", ".btn.btn-primary, .btn.btn-default, .btn.btn-info, .btn.btn-warning, .btn.btn-danger, .btn.btn-success", function () {
            var context = this;
            $(this).prop("disabled", true);
            $(this).css("cursor", "wait");
            var tmpText = $(this).html();
            if (!/Edge/.test(navigator.userAgent) && !isChrome)
                $(this).html("<i class='fa fa-spinner fa-spin'></i>");
            setTimeout(function () {
                $(context).prop("disabled", false);
                $(context).css("cursor", "pointer");
                if (!/Edge/.test(navigator.userAgent) && !isChrome)
                    $(context).html(tmpText);
            }, 1000);
            return true;
        });

    // Validate any form before submit
    $('form').submit(function (e) {
        var el = $(this);
        var tmpButtontext = el.find("button[type='submit']").html();
        el.find("button[type='submit']").attr("disabled", true);
        // Prevent multiple submittion (double click)
        if (el.data('submitting') === true)
            return e.preventDefault();
        el.data('submitting', true);
        // Reset after 2 seconds, needed for document template generate form for example
        setTimeout(function(){
            el.data('submitting', false);
        }, 2000);
        if (!validateForm(el)) {
            el.find("button[type='submit']").html(tmpButtontext).attr("disabled", false).blur();
            el.data('submitting', false);
            return false;
        }
        return true;
    });

    // Splitting display in col-xs-3 related to many checkbox
    $('.relatedtomany-checkbox').each(function () {
        var checkboxes = $(this).find('wrap');
        for (var i = 0; i < checkboxes.length; i += 3) {
            checkboxes.slice(i, i + 3).wrapAll("<div class='col-xs-3' style='margin-bottom: 15px;'></div>");
        }
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

    /* ---------------------- Composants ---------------------- */
    /** Do not remove **/
    /** Do not remove **/
});