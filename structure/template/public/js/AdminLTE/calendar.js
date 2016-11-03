$(function() {
    /* initialize the external events
     -----------------------------------------------------------------*/
    function ini_events(ele) {
        ele.each(function() {
            // create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
            // it doesn't need to have a start or end
            var eventObject = {
                title: $.trim($(this).text()) // use the element's text as the event title
            };
            // store the Event Object in the DOM element so we can get to it later
            $(this).data('eventObject', eventObject);
            // make the event draggable using jQuery UI
            $(this).draggable({
                zIndex: 1070,
                revert: true, // will cause the event to go back to its
                revertDuration: 0 //  original position after the drag
            });
        });
    }
    ini_events($('#external-events div.external-event'));

    // alert($("#evenement").val());
    /* initialize the calendar
     -----------------------------------------------------------------*/
    //Date for the calendar events (dummy data)
    var date = new Date();
    var d = date.getDate(),
        m = date.getMonth(),
        y = date.getFullYear();

    // According to display language, prestation of Calendar will vary
    if (user_lang == "fr-FR") {
        var str_today = 'Aujourd\'hui';
        var str_month = 'Mois';
        var str_week = 'Semaine';
        var str_day = 'Jour';
    } else {
        var str_today = 'Today';
        var str_month = 'Month';
        var str_week = 'Week';
        var str_day = 'Day';
    }

    /* Create an event in fullCalendar and in BDD*/
    /* Parameters:
    * title
    * start
    * end
    * allDay
    * backgroundColor
    */

    function createEvent(parameters, callback){
        var reponse = {};
        $.ajax({
            url: "/timer/create_event",
            type: "POST",
            data: parameters,
            success: function(reponse) {
                reponse.success = true;
                callback(reponse);
            },
            error: function() {
                reponse.success = false;
                callback(reponse);
            }
        });
    }

    /* --------------- FULLCALENDAR --------------- */

    $('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        buttonText: { //This is to add icons to the visible buttons
            prev: "<span class='fa fa-caret-left'></span>",
            next: "<span class='fa fa-caret-right'></span>",
            today: str_today,
            month: str_month,
            week: str_week,
            day: str_day
        },
        //Random default events
        events: '/timer/list_events',
        type: 'POST',
        error: function() {
            alert('there was an error while fetching events!');
        },
        editable: false, // **** Newmips **** Modified to avoid dynamic manipulations
        droppable: true, // this allows things to be dropped onto the calendar !!!
        drop: function(date, allDay) { // this function is called when something is dropped
            // retrieve the dropped element's stored Event Object
            var originalEventObject = $(this).data('eventObject');
            // we need to copy it, so that multiple events don't have a reference to the same object
            var copiedEventObject = $.extend({}, originalEventObject);
            // assign it the date that was reported
            copiedEventObject.start = date;
            copiedEventObject.allDay = allDay;
            copiedEventObject.backgroundColor = $(this).css("background-color");
            copiedEventObject.borderColor = $(this).css("border-color");
            // render the event on the calendar
            // the last `true` argument determines if the event "sticks" (http://arshaw.com/fullcalendar/docs/event_rendering/renderEvent/)
            console.log(copiedEventObject);
            $('#calendar').fullCalendar('renderEvent', copiedEventObject, true);
            // is the "remove after drop" checkbox checked?
            if ($('#drop-remove').is(':checked')) {
                // if so, remove the element from the "Draggable Events" list
                $(this).remove();
            }

            // **** Newmips ****
            // Add event to evenement table
            // Newmips behavior is to open (and create if needed) event in application
            var parameters = {
                title: originalEventObject.title,
                start: copiedEventObject.start,
                end: copiedEventObject.end,
                allDay: copiedEventObject.allDay,
                backgroundColor: copiedEventObject.backgroundColor
            };

            createEvent(parameters, function(reponse){
                if(reponse.success){
                    copiedEventObject.url = reponse.url;
                    $('#calendar').fullCalendar('renderEvent', copiedEventObject, true);
                }
                else{
                    alert("An error occured.");
                    $("#result").html('There is error while submit');
                }
            });

        }
    });

    /* --------------- GOOGLE SYNCHRONIZE --------------- */

    for(var i=0; i<google_events.items.length; i++){
        var event = google_events.items[i];

        if(event.start.date){
            var obj = {
                title: event.summary + " - Google Event",
                start: event.start.date,
                color: '#D34836'
            }
        }
        else{
            var obj = {
                title: event.summary + " - Google Event",
                start: event.start.dateTime,
                end: event.end.dateTime,
                color: '#D34836',
                allDay: false
            }
        }
        $('#calendar').fullCalendar('renderEvent', obj, true);
    }

    /* ADDING EVENTS */
    var currColor = "#00A65A"; //Green by default

    //Color chooser button
    var colorChooser = $("#color-chooser-btn");

    $("#color-chooser > li > a").click(function(e) {
        e.preventDefault();
        //Save color
        currColor = $(this).css("color");
        //Add color effect to button
        colorChooser
            .css({
                "background-color": currColor,
                "border-color": currColor
            }).html($(this).text() + ' <span class="caret"></span>');
    });

    $("#add-new-event").click(function(e) {
        e.preventDefault();
        //Get value and make sure it is not null
        var val = $("#new-event").val();
        if (val.length == 0) {
            return;
        }
        //Create event
        var event = $("<div />");
        event.css({
            "background-color": currColor,
            "border-color": currColor,
            "color": "#fff"
        }).addClass("external-event");
        event.html(val);
        $('#external-events').prepend(event);
        //Add draggable funtionality
        ini_events(event);
        //Remove event from text input
        $("#new-event").val("");
    });
});