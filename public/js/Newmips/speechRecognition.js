	var final_transcript = '';
	var recognizing = false;

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
				} else {
					interim_transcript += event.results[i][0].transcript;
				}
			}
			final_transcript = capitalize(final_transcript);
			$("#instruction").val(final_transcript);

		};
	}

	var two_line = /\n\n/g;
	var one_line = /\n/g;
	function linebreak(s) {
		return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
	}

	function capitalize(s) {
		return s.replace(s.substr(0,1), function(m) { return m.toUpperCase(); });
	}

	function startDictation(event) {
		if (recognizing) {
			recognition.stop();
			return;
		}
		final_transcript = '';
		recognition.lang = user_lang;
		recognition.start();
	}

	$(document).on("click", "#btn-speech", function(event){
		if ('webkitSpeechRecognition' in window)
			startDictation(event);
		else
			toastr.error("Votre naviguateur n'est pas compatible avec la reconnaissance vocale.");
	});