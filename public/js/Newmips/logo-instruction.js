/*!
 * Newmips v2.5
 * Copyright 2016
 * Licensed under GPLV3.0 https://www.gnu.org/licenses/gpl.html
 */

/* Avoid .dropzone to be automaticaly initialized */
Dropzone.autoDiscover = false;
var el = $('#modalsetlogo .dropzone-field');
var that = el;
var type = that.attr('data-type');
dropzoneSetLogo = new Dropzone("#" + el.attr("id"), {
    url: "/application/set_logo",
    autoProcessQueue: false,
    maxFilesize: 10,
    addRemoveLinks: true,
    uploadMultiple: false,
    dictDefaultMessage: "Glisser le fichier ou cliquer ici pour ajouter.",
    dictRemoveFile: "Supprimer",
    dictCancelUpload: "Annuler",
    autoDiscover: false,
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
            var storageType = that.attr("data-storage");
            var dataEntity = that.attr("data-entity");
            var dataType = that.attr("data-type") || '';
            formData.append("storageType", storageType);
            formData.append("dataEntity", dataEntity);
            formData.append("dataType", dataType);
            formData.append("idApp", idApp);
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
        if ($("#" + that.attr("id") + "_hidden").val() != '') {
            var timeFile = "logo";
            $("#" + that.attr("id") + "_hidden").val(timeFile + "_" + filename);
            return timeFile + '_' + filename;
        }

    }
});
if (type == 'picture')
    dropzoneSetLogo.options.acceptedFiles = 'image/*';
var dropzoneId = el.attr('id') + '';
if ($('#' + dropzoneId + '_hidden').val() != '') {
    var mockFile = {
        name: $('#' + dropzoneId + '_hidden').val(),
        type: 'mockfile'
    };
    dropzoneSetLogo.files.push(mockFile);
    dropzoneSetLogo.emit('addedfile', mockFile);
    dropzoneSetLogo.emit('complete', mockFile);
}
