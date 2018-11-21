(function(factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(window.jQuery);
    }
}(function($) {

    var final_transcript = '';
    var recognizing = false;
    var currentElement;

    if ('webkitSpeechRecognition' in window) {
        var recognition = new webkitSpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = function() {
            recognizing = true;
        };

        recognition.onerror = function(event) {
            console.log(event.error);
        };

        recognition.onend = function() {
            recognizing = false;
        };

        recognition.onresult = function(event) {
            var interim_transcript = '';
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                    recognition.stop();
                    $(".btn-speech").parent("button").css({
                        color: "#666"
                    });
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            final_transcript = capitalize(final_transcript);
            currentElement.invoke('editor.insertText', final_transcript);
        };
    }

    function capitalize(s) {
        return s.replace(s.substr(0, 1), function(m) {
            return m.toUpperCase();
        });
    }

    function startDictation(event) {
        final_transcript = '';
        recognition.lang = lang_user;
        recognition.start();
    }

    // Extends plugins for adding hello.
    //  - plugin is external module for customizing.
    $.extend($.summernote.plugins, {
        /**
         * @param {Object} context - context object has status of editor.
         */
        'stt': function(context) {
            var self = this;

            // ui has renders to build ui elements.
            //  - you can create a button with `ui.button`
            var ui = $.summernote.ui;

            // add hello button
            context.memo('button.stt', function() {
                // create button
                var button = ui.button({
                    contents: '<i class="fa fa-microphone btn-speech"/>',
                    tooltip: 'Speech To Text',
                    click: function() {
                        if ('webkitSpeechRecognition' in window) {
                            if (!recognizing) {
                                $(this).css({
                                    color: "red"
                                });
                                currentElement = context;
                                startDictation(event);
                            } else {
                                if($(this).css("color") == "rgb(255, 0, 0)"){
                                    recognition.stop();
                                    $(this).css({
                                        color: "#666"
                                    });
                                } else {
                                    toastr.error("Une reconnaissance vocale est déjà en cours, merci de la terminer avant d'en lancer une autre.")
                                }
                                $(this).blur();
                            }
                        } else{
                            $(this).blur();
                            toastr.error("Votre naviguateur n'est pas compatible avec la reconnaissance vocale.");
                        }
                    }
                });

                // create jQuery object from button instance.
                var $hello = button.render();
                return $hello;
            });

            // This methods will be called when editor is destroyed by $('..').summernote('destroy');
            // You should remove elements on `initialize`.
            this.destroy = function() {
                this.$panel.remove();
                this.$panel = null;
            };
        }
    });
}));