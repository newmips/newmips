$(document).ready(function() {

    $("*").tooltip({
        disabled: true
    });

    $('.modal').on('shown.bs.modal', function() {
        $(this).find('[autofocus]').focus();
    });

    if (lang_user == "fr-FR") {
        var currentLocal = "fr";
        var ressourceName = "Utilisateurs";
        var buttonTextObj = {
            today: 'Aujourd\'hui',
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            customTimelineDay: "Timeline/Jour",
            customTimelineWeek: "Timeline/Semaine"
        };
    } else {
        var currentLocal = "en";
        var ressourceName = "Users";
        var buttonTextObj = {
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            customTimelineDay: "Timeline/Day",
            customTimelineWeek: "Timeline/Week"
        };
    }

    /* Full calendat init */
    $('#calendar').fullCalendar({
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        locale: currentLocal,
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,customTimelineDay,customTimelineWeek'
        },
        buttonIcons: {
            prev: "left-single-arrow",
            next: "right-single-arrow"
        },
        views: {
            customTimelineDay: {
                type: 'timelineDay',
                minTime: "07:00:00",
                maxTime: "19:00:00"
            },
            customTimelineWeek: {
                type: 'timelineWeek',
                slotDuration: "24:00:00"
            }
        },
        buttonText: buttonTextObj,
        navLinks: false,
        editable: true,
        eventLimit: true,
        droppable: true,
        resourceAreaWidth: "15%",
        defaultTimedEventDuration: "04:00:00",
        timezone: 'UTC',
        eventReceive: function(event) {

            /*event.end is null, so set it to start + the number of hours you want*/
            event.end = moment.utc(event.start).add(4, "h");

            /* Convert into good SQL format */
            var startDate = moment.utc(event.start).format("YYYY-MM-DD HH:mm:ss");
            var endDate = moment.utc(event.end).format("YYYY-MM-DD HH:mm:ss");

            var ajaxData = {
                title: event.title,
                allday: event.allDay,
                start: startDate,
                end: endDate,
                idCategory: event.idCategory,
                idUser: event.resourceId || null
            };

            $.ajax({
                url: '/agenda/add_event',
                type: 'POST',
                data: JSON.stringify(ajaxData),
                dataType: 'json',
                contentType: "application/json",
                context: this,
                success: function(data) {
                    /*event.url = "/agenda_event/show?id="+data.idEvent;*/
                    event.eventId = data.idEvent;
                    $('#calendar').fullCalendar('updateEvent', event);
                },
                error: function(error) {
                    console.error(error);
                }
            });
        },
        eventResize: function(event) {

            /* Convert into good SQL format */
            var startDate = moment(event.start).format("YYYY-MM-DD HH:mm:ss");
            var endDate = moment(event.end).format("YYYY-MM-DD HH:mm:ss");

            var ajaxData = {
                eventId: event.eventId,
                start: startDate,
                end: endDate
            };

            $.ajax({
                url: '/agenda/resize_event',
                type: 'POST',
                data: JSON.stringify(ajaxData),
                dataType: 'json',
                contentType: "application/json",
                context: this,
                error: function(error) {
                    console.error(error);
                }
            });
        },
        eventDrop: function(event) {
            /* Convert into good SQL format */
            var startDate = moment.utc(event.start).format("YYYY-MM-DD HH:mm:ss");
            if (event.end == null)
                event.end = moment.utc(event.start).add(4, "h");
            var endDate = moment.utc(event.end).format("YYYY-MM-DD HH:mm:ss");

            var ajaxData = {
                eventId: event.eventId,
                start: startDate,
                end: endDate,
                idUser: event.resourceId || null,
                idUsers: event.resourceIds || null
            };

            $.ajax({
                url: '/agenda/update_event_drop',
                type: 'POST',
                data: JSON.stringify(ajaxData),
                dataType: 'json',
                contentType: "application/json",
                context: this,
                error: function(error) {
                    console.error(error);
                }
            });
        },
        eventClick: function(calEvent, jsEvent, view) {
            $("#modalUpdateEventID").val(calEvent.eventId);
            $("#modalUpdateID").val(calEvent._id);
            $("#modalUpdateTitle").val(calEvent.title);
            if (calEvent.end == null)
                calEvent.end = moment.utc(calEvent.start).add(4, "h");
            if (calEvent.allDay) {
                $('#updateEventAllDayCheckbox').icheck('check');
            } else {
                $('#updateEventAllDayCheckbox').icheck('uncheck');
                $("#modalUpdateStartTime").val(moment(calEvent.start).format("HH:mm"));
                $("#modalUpdateEndTime").val(moment(calEvent.end).format("HH:mm"));
            }
            if (calEvent.idCategory != 0)
                $("#modalUpdateCategory").val(calEvent.idCategory).trigger("change");
            $('#eventUpdateModal').modal('show');
        },
        dayClick: function(date, jsEvent, view, ressources) {
            $("#modalCreateStartDate").val(date._d);
            /* Get the start hours when the user clicked in the calendar */
            $("#modalCreateStartTime").val(moment.utc(date._d).format("HH:mm"));
            /* Add 4 hours to default end time in create modal */
            $("#modalCreateEndTime").val(moment.utc(date._d).add(4, "hours").format("HH:mm"));

            $("#modalCreateUser").val(null);
            if (typeof ressources !== "undefined") {
                $("#modalCreateUser").val(ressources.id)
            }

            if ($("#modalCreateStartTime").val() == "00:00") {
                /* If start date is 00:00 then we considered that the event is all day, so check allDay checkbox */
                $('#createEventAllDayCheckbox').icheck('check');
            } else {
                $('#createEventAllDayCheckbox').icheck('uncheck');
            }
            $("#modalCreateTitle").val("");
            $("#modalCreateCategory").val("").trigger("change");
            $('#eventCreateModal').modal('show');
        },
        resourceLabelText: ressourceName,
        resources: usersRessources,
        events: calendarEvents
    });

    /* Create event modal, all day checkbox managment */
    $(document).on("ifChanged", "#createEventAllDayCheckbox", function() {
        /* Disable start & end timepicker depend allDay checkbox state */
        if ($(this).icheck('update')[0].checked) {
            $("#modalCreateStartTime").prop("disabled", true);
            $("#modalCreateEndTime").prop("disabled", true);
        } else {
            $("#modalCreateStartTime").prop("disabled", false);
            $("#modalCreateEndTime").prop("disabled", false);
        }
    });

    /* Update event modal, all day checkbox managment */
    $(document).on("ifChanged", "#updateEventAllDayCheckbox", function() {
        /* Disable start & end timepicker depend allDay checkbox state */
        if ($(this).icheck('update')[0].checked) {
            $("#modalUpdateStartTime").prop("disabled", true);
            $("#modalUpdateEndTime").prop("disabled", true);
        } else {
            $("#modalUpdateStartTime").prop("disabled", false);
            $("#modalUpdateEndTime").prop("disabled", false);
        }
    });

    $(document).on("click", "#deleteEvent", function() {
        var idEventToDelete = $("#modalUpdateEventID").val();
        var idEventCalendarToDelete = $("#modalUpdateID").val();
        $.ajax({
            url: '/agenda/delete_event',
            type: 'POST',
            data: JSON.stringify({
                id: idEventToDelete
            }),
            dataType: 'json',
            contentType: "application/json",
            context: this,
            success: function(data) {
                $("#calendar").fullCalendar('removeEvents', idEventCalendarToDelete);
                $('#eventUpdateModal').modal('hide');
            },
            error: function(error) {
                console.error(error);
            }
        });
    });

    $(document).on("click", "#updateEvent", function() {
        var idEventToUpdate = $("#modalUpdateEventID").val();
        var idEventCalendarToDelete = $("#modalUpdateID").val();

        var newTitle = $("#modalUpdateTitle").val();
        var newCategory = $("#modalUpdateCategory").val();
        var newCategoryColor = $("#modalUpdateCategory").find("option:selected").data("backgroundcolor");
        var allDay = $("#updateEventAllDayCheckbox").icheck('update')[0].checked ? true : false;

        var eventObj = $("#calendar").fullCalendar('clientEvents', idEventCalendarToDelete);

        var startDate = eventObj[0].start.format("YYYY-MM-DD HH:mm:ss").split(" ");
        var chosenTimeStart = moment($("#modalUpdateStartTime").val(), "HH:mm").format("HH:mm");
        var chosenTimeEnd = moment($("#modalUpdateEndTime").val(), "HH:mm").format("HH:mm");
        var newStartDate = startDate[0] + " " + chosenTimeStart + ":00";
        var newEndDate = startDate[0] + " " + chosenTimeEnd + ":00";

        if (!allDay && moment(newStartDate).diff(newEndDate) >= 0) {
            toastr.error("Cannot set end date same or before start date !");
            return false;
        }

        $.ajax({
            url: '/agenda/update_event',
            type: 'POST',
            data: {
                id: idEventToUpdate,
                f_title: newTitle,
                f_all_day: allDay,
                f_start_date: allDay ? startDate[0] + " 00:00:00" : newStartDate,
                f_end_date: allDay ? startDate[0] + " 00:00:00" : newEndDate,
                r_category: newCategory
            },
            context: this,
            success: function(data) {
                eventObj[0].allDay = allDay;
                eventObj[0].start = allDay ? moment.utc(startDate[0] + " 00:00:00") : moment.utc(newStartDate);
                eventObj[0].title = newTitle;
                eventObj[0].idCategory = newCategory;
                eventObj[0].backgroundColor = newCategoryColor;
                eventObj[0].borderColor = newCategoryColor;
                $('#calendar').fullCalendar('updateEvent', eventObj[0]);
                /* Little trick to set end date */
                eventObj[0].end = allDay ? moment.utc(startDate[0] + " 00:00:00") : moment.utc(newEndDate);
                $('#calendar').fullCalendar('updateEvent', eventObj[0]);
                $('#calendar').fullCalendar("refetchEvents");
                $('#eventUpdateModal').modal('hide');
            },
            error: function(error) {
                console.error(error);
            }
        });
    });

    $(document).on("click", "#createEvent", function() {

        var newTitle = $("#modalCreateTitle").val();
        var newCategory = $("#modalCreateCategory").val();
        var newCategoryColor = $("#modalCreateCategory").find("option:selected").data("backgroundcolor");
        var allDay = $("#createEventAllDayCheckbox").icheck('update')[0].checked ? true : false;

        var startDate = moment($("#modalCreateStartDate").val()).format("YYYY-MM-DD HH:mm:ss").split(" ");
        var chosenTimeStart = moment($("#modalCreateStartTime").val(), "HH:mm").format("HH:mm");
        var chosenTimeEnd = moment($("#modalCreateEndTime").val(), "HH:mm").format("HH:mm");
        var newStartDate = startDate[0] + " " + chosenTimeStart + ":00";
        var newEndDate = startDate[0] + " " + chosenTimeEnd + ":00";

        var idUser = null;
        if ($("#modalCreateUser").val() != null && $("#modalCreateUser").val() != "") {
            idUser = $("#modalCreateUser").val();
        }

        if (!allDay && moment(newStartDate).diff(newEndDate) >= 0) {
            toastr.error("Cannot set end date same or before start date !");
            return false;
        }

        var ajaxData = {
            title: newTitle,
            start: allDay ? startDate[0] + " 00:00:00" : newStartDate,
            end: allDay ? startDate[0] + " 00:00:00" : newEndDate,
            allday: allDay,
            idCategory: newCategory || null,
            idUser: idUser
        };

        $.ajax({
            url: '/agenda/add_event',
            type: 'POST',
            data: JSON.stringify(ajaxData),
            dataType: 'json',
            contentType: "application/json",
            context: this,
            success: function(data) {
                var newEvent = {
                    eventId: data.idEvent,
                    title: newTitle,
                    start: newStartDate,
                    end: newEndDate,
                    allDay: allDay,
                    backgroundColor: newCategoryColor,
                    borderColor: newCategoryColor,
                    idCategory: ajaxData.idCategory,
                    resourceId: idUser
                };
                $('#calendar').fullCalendar('renderEvent', newEvent, true);
                $('#eventCreateModal').modal('hide');
            },
            error: function(error) {
                console.error(error);
            }
        });
    });

    /* Sidebar menu highlighting */
    var url = window.location.href;
    var current_url = url.split("/");
    var mainMenu = current_url[3];
    $("a[href='/" + mainMenu + "']").css("color", "#3c8dbc");
});