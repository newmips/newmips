$(document).ready(function () {

    /* --------------- Gestion des Toastr (messages informatifs en bas à gauche) --------------- */

    var maskMoneyPrecision = 2;
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
        toastr = {success: function () {
                return true;
            }, info: function () {
                return true;
            }, error: function () {
                return true;
            }, warning: function () {
                return true;
            }};
    }

    /* --------------- Gestion des menus / sidebar --------------- */
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

    /* --------------- Initialisation des iCheck - Checkbox + RadioButton --------------- */
    $("input[type='checkbox'], input[type='radio']").iCheck({
        checkboxClass: 'icheckbox_flat-blue',
        radioClass: 'iradio_flat-blue',
        disabledClass: ''
    });

    /* --------------- Initialisation des CKEDITOR --------------- */
    $("textarea:not(.regular-textarea)").each(function () {
        CKEDITOR.replace($(this).attr("id"));
    });

    /* --------------- Initialisation des timepicker --------------- */
    $(".timepicker").timepicker({
        showInputs: false,
        showMeridian: false
    });

    /* --------------- Regex on decimal input --------------- */
    $("input[data-custom-type='decimal']").keyup(function (e) {
        var reg = new RegExp("^[0-9]+([\.\,][0-9]*)?$");
        while ($(this).val() != "" && !reg.test($(this).val())) {
            $(this).val($(this).val().substring(0, $(this).val().length - 1))
        }
    });

    /* --------------- Initialisation des DateTimepicker --------------- */
    /* --------------- Initialisation des datepicker --------------- */
    /* --------------- Initialisation des Input Maks --------------- */
    $("input[data-type='email']").inputmask({alias: "email"});

    /* Uncomment if you want to apply a mask on tel input */
    /*$("input[type='tel']").inputmask({mask: "+## # ## ## ## ##"});*/

    /* --------------- Initialisation des date a afficher correctement selon la langue --------------- */
    $('.datepicker-toconvert').each(function () {
        if ($(this).val() != "" && $(this).val() != "Invalid date" && $(this).val() != "Invalid Date") {
            if (lang_user == "fr-FR")
                $(this).val(moment(new Date($(this).val())).format("DD/MM/YYYY"));
            else
                $(this).val(moment(new Date($(this).val())).format("YYYY-MM-DD"));
        } else {
            $(this).val("");
        }
    });

    $('.datetimepicker-toconvert').each(function () {
        if ($(this).attr("value") != "" && $(this).attr("value") != "Invalid date" && $(this).attr("value") != "Invalid Date") {
            if (lang_user == "fr-FR")
                $(this).val(moment(new Date($(this).attr("value"))).format("DD/MM/YYYY HH:mm:ss")).change();
            else
                $(this).val(moment(new Date($(this).attr("value"))).format("YYYY-MM-DD HH:mm:ss")).change();
        } else {
            $(this).val("");
        }
    });

    $("td[data-type='date']").each(function () {
        if ($(this).html() != "" && $(this).html() != "Invalid date" && $(this).html() != "Invalid Date") {
            if (lang_user == "fr-FR")
                $(this).html(moment(new Date($(this).html())).format("DD/MM/YYYY"));
            else
                $(this).html(moment(new Date($(this).html())).format("YYYY-MM-DD"));
        } else {
            $(this).html("");
        }
    });


    $("td[data-type='datetime']").each(function () {
        if ($(this).html() != "" && $(this).html() != "Invalid date" && $(this).html() != "Invalid Date") {
            if (lang_user == "fr-FR")
                $(this).html(moment(new Date($(this).html())).format("DD/MM/YYYY HH:mm:ss"));
            else
                $(this).html(moment(new Date($(this).html())).format("YYYY-MM-DD HH:mm:ss"));
        } else {
            $(this).html("");
        }
    });

    $(this).find('img[data-type="picture"]').each(function () {
        var src = $(this).attr('src');
        //remove all pictures with null src value
        if (typeof src != 'undefined' && src.split(',')[1] == '') {
            var msg = 'No image selected';
            if (lang_user == 'fr-FR')
                msg = 'Aucune image choisie';
            $(this).parent().replaceWith('<span>' + msg + '</span>');
        }
    });

    /* Show boolean with a square in datalist */

    $('td[data-type="boolean"]').each(function () {
        var val = $(this).html();
        if (val == 'true' || val == '1')
            $(this).html('<i class="fa fa-check-square-o fa-lg"></i>');
        else
            $(this).html('<i class="fa fa-square-o fa-lg"></i>');
    });

    /* After good format -> Date / Datetime instanciation */

    if (lang_user == "fr-FR") {
        $('.datepicker').datepicker({
            format: "dd/mm/yyyy",
            language: lang_user,
            autoclose: true,
            clearBtn: true
        });

        $(".datepicker").inputmask({"alias": "dd/mm/yyyy"});

        $('.datetimepicker').datetimepicker({
            format: "DD/MM/YYYY HH:mm:ss",
            sideBySide: true
        });

        $(".datetimepicker").inputmask({
            mask: "1/2/y h:s:s",
            placeholder: "dd/mm/yyyy hh:mm:ss",
            alias: "datetime",
            timeseparator: ":",
            hourFormat: "24"
        });
    } else {
        $('.datepicker').datepicker({
            format: "yyyy-mm-dd",
            language: lang_user,
            autoclose: true,
            clearBtn: true
        });

        $(".datepicker").inputmask({"alias": "yyyy-mm-dd"});

        $('.datetimepicker').datetimepicker({
            format: "YYYY-MM-DD HH:mm:ss",
            sideBySide: true
        });

        $(".datetimepicker").inputmask({
            mask: "y-1-2 h:s:s",
            placeholder: "yyyy-mm-dd hh:mm:ss",
            separator: "-",
            alias: "yyyy/mm/dd"
        });
    }

    /* 1er Tentative */
    /* Decimal input, remove . and insert a , */
    /* Doesn't work at all */
    /*$("input[type='number'][step='any']").each(function(){
     $(this).keydown(function(e) {
     if(e.key == "."){
     e.key = ",";
     }*/
    /*var value = $(this).val();
     var newValue = value.replace(".", ",");
     $(this).val(newValue);*/
    /*});
     });*/

    /* 2ème Tentative */
    /* Decimal input, remove . and insert a , */
    /* Doesn't work at all */
    /*var inputDecimalValues = {};
     $("input[type='number'][step='any']").each(function(){
     $(this).keypress(function(e) {
     var nameObj = $(this).attr("name");
     
     if($(this).val() == ""){
     console.log("1");
     if(typeof inputDecimalValues[nameObj] !== "undefined"){
     console.log("11");
     var newValue = "";
     if(inputDecimalValues[nameObj].match(",.+") != null){
     console.log("12");
     newValue = inputDecimalValues[nameObj] + e.key;
     inputDecimalValues[nameObj] = newValue;
     console.log(newValue);
     $(this).val(newValue);
     }
     else{
     if(inputDecimalValues[nameObj].indexOf(",") == -1){
     console.log("13");
     inputDecimalValues[nameObj] = inputDecimalValues[nameObj] + ".";
     }
     else{
     console.log("14");
     inputDecimalValues[nameObj] = inputDecimalValues[nameObj] + e.key;
     }
     }
     }
     }
     else{
     console.log("2");
     inputDecimalValues[nameObj] = $(this).val();
     }

     console.log("FIN");
     console.log(inputDecimalValues);
     });
     });*/

    /* Avoid .dropzone to be automaticaly initialized */
    Dropzone.autoDiscover = false;

    /* --------------- Initialisation de DROPZONE JS - COMPONENT --------------- */

    var dropzonesComponentArray = [];

    /* File Storage Component */
    $('.dropzone_local_file_component').each(function (index) {
        var that = $(this);
        var dropzoneInit = new Dropzone("#" + $(this).attr("id"), {
            url: "/" + that.attr("data-component") + "/file_upload",
            autoProcessQueue: false,
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
                        $("#" + that.attr("id") + "_hidden_name").val(this.files[0].name);
                        $("#" + that.attr("id") + "_hidden").val(this.files[0].name);
                    }
                });
                this.on("sending", function (file, xhr, formData) {
                    var storageType = that.attr("data-storage");
                    var dataComponent = that.attr("data-component");
                    var dataSource = that.attr("data-source");
                    var dataSourceID = that.attr("data-sourceId");
                    formData.append("storageType", storageType);
                    formData.append("dataComponent", dataComponent);
                    formData.append("dataSource", dataSource);
                    formData.append("dataSourceID", dataSourceID);
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
            },
            renameFilename: function (filename) {
                var timeFile = moment().format("YYYYMMDD-HHmmss");
                $("#" + that.attr("id") + "_hidden").val(timeFile + "_" + filename);
                return timeFile + '_' + filename;
            }
        });

        dropzonesComponentArray[$(this).attr("data-component")] = [];
        dropzonesComponentArray[$(this).attr("data-component")].push(dropzoneInit);
    });

    /* Dropzone files managment already done ? */
    var filesComponentProceeded = false;

    /* Proceed dropzone before submit the component form */
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
                        toastr.error("You should add a file.");
                    }
                }
            }
        }

        return true;
    });
    /* ----------------data-type qrcode generation -------------------------*/


    $(this).find("input[data-type='qrcode']").each(function () {
        if ($(this).val() != '') {
            //Update View, set attr parent id, Qrcode only work with component Id
            $(this).parent().parent().attr("id", $(this).attr('name'));
            //$(this).attr('name') = this parent id
            var qrcode = new QRCode($(this).attr('name'), {
                text: $(this).val(),
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            $(this).parent().replaceWith(qrcode);
        }
    });

  var displayBarCode = function (element) {
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
    $(this).find("input[data-type='barcode']").each(function () {
        if ($(this).attr('show') == 'true' && $(this).val() != '') {
            displayBarCode(this);
        } else {
            if ($(this).attr('data-customType') === 'code39' || $(this).attr('data-customType') === 'alpha39') {
                $(this).on('keyup', function () {
                    $(this).val($(this).val().toUpperCase());
                });
            }
        }
    });

    //input barcode
    $(this).find("input[data-type='code39'],input[data-type='alpha39']").each(function () {
        $(this).on('keyup', function () {
            $(this).val($(this).val().toUpperCase());
        });
    });

    //Mask for data-type currency
    $(this).find("[data-type='currency']").each(function () {
        $(this).maskMoney({thousands: ' ', decimal: ',', allowZero: true, suffix: '', precision: maskMoneyPrecision}).maskMoney('mask');
    });
    /* --------------- Initialisation de DROPZONE JS - FIELD --------------- */
    var dropzonesFieldArray = [];

    $('.dropzone-field').each(function (index) {
        var that = $(this);
        var type = that.attr('data-type');
        var dropzoneInit = new Dropzone("#" + $(this).attr("id"), {
            url: "/default/file_upload",
            autoProcessQueue: false,
            maxFilesize: 10,
            addRemoveLinks: true,
            uploadMultiple: false,
            dictDefaultMessage: "Glisser le fichier ou cliquer ici pour ajouter.",
            dictRemoveFile: "Supprimer",
            dictCancelUpload: "Annuler",
            autoDiscover: false,
            init: function () {
                this.on("addedfile", function () {
                    if (this.files[1] != null) {
                        this.removeFile(this.files[1]);
                        toastr.error("Vous ne pouvez ajouter qu'un seul fichier");
                    } else {
                        $("#" + that.attr("id") + "_hidden_name").val(this.files[0].name);
                        $("#" + that.attr("id") + "_hidden").val(this.files[0].name);
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
                        x = confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?');
                        if (!x)
                            return false;
                        $.ajax({
                            url: '/default/delete_file',
                            type: 'post',
                            data: {dataEntity: that.attr("data-entity"),
                                dataStorage: that.attr("data-storage"),
                                filename: $("#" + that.attr("id") + "_hidden").val()},
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
                if ($("#" + that.attr("id") + "_hidden").val() != '') {
                    var timeFile = moment().format("YYYYMMDD-HHmmss");
                    $("#" + that.attr("id") + "_hidden").val(timeFile + "_" + filename);
                    return timeFile + '_' + filename;
                }

            }
        });
        if (type == 'picture')
            dropzoneInit.options.acceptedFiles = 'image/*';
        var dropzoneId = $(this).attr('id') + '';
        if ($('#' + dropzoneId + '_hidden').val() != '') {
            var mockFile = {
                name: $('#' + dropzoneId + '_hidden').val(),
                type: 'mockfile'
            };
            dropzoneInit.files.push(mockFile);
            dropzoneInit.emit('addedfile', mockFile);
            dropzoneInit.emit('complete', mockFile);
        }
        dropzonesFieldArray.push(dropzoneInit);
    });

    /* Dropzone files managment already done ? */
    var filesProceeded = false;

    $(document).on("submit", "form", function (e) {

        var thatForm = $(this);

        if (!filesProceeded && dropzonesFieldArray.length > 0) {
            /* If there are files to write, stop submit and do this before */
            e.preventDefault();

            /* Send dropzone file */
            for (var i = 0; i < dropzonesFieldArray.length; i++) {
                //prevent sent file if mockfile
                if (dropzonesFieldArray[i].files.length > 0 && dropzonesFieldArray[i].files[0].type != 'mockfile') {
                    var dropzone = dropzonesFieldArray[i];
                    dropzone.processQueue();
                    (function (ibis, myform) {
                        dropzone.on("complete", function (file, response) {
                            if (ibis == dropzonesFieldArray.length - 1) {
                                filesProceeded = true;
                                myform.submit();
                            }
                        });
                    })(i, $(this))
                } else {
                    if (i == dropzonesFieldArray.length - 1) {
                        filesProceeded = true;
                        $(this).submit();
                    }
                }
            }
        }

        /* On converti les dates francaises en date yyyy-mm-dd pour la BDD */
        if (lang_user == "fr-FR") {
            /* Datepicker FR convert*/
            $(this).find('.datepicker').each(function () {
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
            $(this).find('.datetimepicker').each(function () {
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

        /* If a select multiple is empty we want to have an empty value in the req.body */
        $(this).find("select[multiple]").each(function () {
            if ($(this).val() == null) {
                var input = $("<input>").attr("type", "hidden").attr("name", $(this).attr("name"));
                thatForm.append($(input));
            }
        });

        /* Converti les checkbox "on" en value boolean true/false pour insertion en BDD */
        $(this).find("input[type='checkbox']").each(function () {
            if ($(this).prop("checked")) {
                $(this).val(true);
            } else {
                /* Coche la checkbox afin qu'elle soit prise en compte dans le req.body */
                $(this).prop("checked", true);
                $(this).val(false);
            }
        });

        /* Vérification que les input mask EMAIL sont bien complétés jusqu'au bout */
        $(this).find("input[data-type='email']").each(function () {
            if ($(this).val().length > 0 && !$(this).inputmask("isComplete")) {
                $(this).css("border", "1px solid red").parent().after("<span style='color: red;'>Le champ est incomplet.</span>");
                e.preventDefault();
                return false;
            }
        });
        /* Vérification que les input mask URL sont bien complétés jusqu'au bout */
        $(this).find("input[data-type='url']").each(function () {
            if ($(this).val() != '' && !$(this).inputmask("isComplete")) {
                toastr.error(" Le champ " + $(this).attr("placeholder") + " est invalide");
                e.preventDefault();
                return false;
            }
        });
        /* Vérification des types barcode */
        $(this).find("input[data-type='barcode']").each(function () {
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
                        e.preventDefault();
                        return false;
                    }
                }
            }
        });
        /* Vérification que les input mask TEL sont bien complétés jusqu'au bout */
        $(this).find("input[type='tel']").each(function () {
            if ($(this).val().length > 0 && !$(this).inputmask("isComplete")) {
                $(this).css("border", "1px solid red").parent().after("<span style='color: red;'>Le champ est incomplet.</span>");
                e.preventDefault();
                return false;
            }
        });
        $(this).find("input[data-type='currency']").each(function () {
            //replace number of zero par maskMoneyPrecision value, default 2
            $(this).val(($(this).val().replace(/ /g, '')).replace(',00', ''));
        });
        return true;
    });

    /* --------------- Initialisation des select --------------- */
    $("select").select2();
});