/*!
 * FullCalendar v2.9.0 Google Calendar Plugin
 * Docs & License: http://fullcalendar.io/
 * (c) 2016 Adam Shaw
 */
 var CLIENT_ID = '357750769098-8itb2nftnffkftokial8rd64qdlf7rpe.apps.googleusercontent.com';
 var holyEvents, tmpEvents, tmpRes;
 var myEvents = new Array();
 var SCOPES = ["https://www.googleapis.com/auth/calendar"];
 var when
 var resource;
 var arr = {};
 var hello = {};
 var tmpCalendarId;
 /**
  * Check if current user has authorized this application.
  */
 function checkAuth() {
   gapi.auth.authorize(
     {
       'client_id': CLIENT_ID,
       'scope': SCOPES.join(' '),
       'immediate': true
     }, handleAuthResult);
 }

 /**
  * Handle response from authorization server.
  *
  * @param {Object} authResult Authorization result.
  */
 function handleAuthResult(authResult) {
   var authorizeDiv = document.getElementById('authorize-div');
   if (authResult && !authResult.error) {
     // Hide auth UI, then load client library.
     authorizeDiv.style.display = 'none';
     loadCalendarApi();
   } else {
     // Show auth UI, allowing the user to initiate authorization by
     // clicking authorize button.
     authorizeDiv.style.display = 'inline';
   }
 }

 /**
  * Initiate auth flow in response to user clicking authorize button.
  *
  * @param {Event} event Button click event.
  */
 function handleAuthClick(event) {
   gapi.auth.authorize({
     client_id: CLIENT_ID, scope: SCOPES, immediate: false
   },handleAuthResult);
   return false;
 }

 /**
  * Load Google Calendar client library. List upcoming events
  * once client library is loaded.
  */
 function loadCalendarApi() {
   gapi.client.load('calendar', 'v3', listUpcomingEvents);

 }
 /**
  * Print the summary and start datetime/date of the next ten events in
  * the authorized user's calendar. If no events are found an
  * appropriate message is printed.
  */
 function listUpcomingEvents() {
   var request = gapi.client.calendar.events.list({
     'calendarId': 'primary',
     'timeMin': (new Date()).toISOString(),
     'showDeleted': false,
     'singleEvents': true,
     'maxResults': 50,
     'orderBy': 'startTime'

   });
   EventId = [];
   request.execute(function(resp) {
     tmpRes = resp
     console.log(resp.items)
     tmpEvents = resp.items;
     if (tmpEvents.length > 0) {
            for (i = 0; i < tmpEvents.length; i++) {
              var _entry = tmpEvents[i];
              var myEvent = new Array();
              myEvents.push({
    						id: _entry.id,
    						title: _entry.summary,
    						start: _entry.start.dateTime || _entry.start.date, // try timed. will fall back to all-day
    						end: _entry.end.dateTime || _entry.end.date, // same
    						url: "",
    						location: _entry.location,
    						description: _entry.description
    					});
            }
      } else {
      }
   });

 }

(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'jquery' ], factory);
	}
	else if (typeof exports === 'object') { // Node/CommonJS
		module.exports = factory(require('jquery'));
	}
	else {
		factory(jQuery);
	}
})(function($) {


var API_BASE = 'https://www.googleapis.com/calendar/v3/calendars';
var FC = $.fullCalendar;
var applyAll = FC.applyAll;


FC.sourceNormalizers.push(function(sourceOptions) {
	var googleCalendarId = sourceOptions.googleCalendarId;

	var url = sourceOptions.url;
	var match;

	// if the Google Calendar ID hasn't been explicitly defined
	if (!googleCalendarId && url) {

		// detect if the ID was specified as a single string.
		// will match calendars like "asdf1234@calendar.google.com" in addition to person email calendars.
		if (/^[^\/]+@([^\/\.]+\.)*(google|googlemail|gmail)\.com$/.test(url)) {
			googleCalendarId = url;
		}
		// try to scrape it out of a V1 or V3 API feed URL
		else if (
			(match = /^https:\/\/www.googleapis.com\/calendar\/v3\/calendars\/([^\/]*)/.exec(url)) ||
			(match = /^https?:\/\/www.google.com\/calendar\/feeds\/([^\/]*)/.exec(url))
		) {
			googleCalendarId = decodeURIComponent(match[1]);
		}

		if (googleCalendarId) {
			sourceOptions.googleCalendarId = googleCalendarId;
		}
	}


	if (googleCalendarId) { // is this a Google Calendar?

		// make each Google Calendar source uneditable by default
		if (sourceOptions.editable == null) {
			sourceOptions.editable = false;
		}

		// We want removeEventSource to work, but it won't know about the googleCalendarId primitive.
		// Shoehorn it into the url, which will function as the unique primitive. Won't cause side effects.
		// This hack is obsolete since 2.2.3, but keep it so this plugin file is compatible with old versions.
		sourceOptions.url = googleCalendarId;
	}
});


FC.sourceFetchers.push(function(sourceOptions, start, end, timezone) {
	if (sourceOptions.googleCalendarId) {
		return transformOptions(sourceOptions, start, end, timezone, this); // `this` is the calendar
	}
});


function transformOptions(sourceOptions, start, end, timezone, calendar) {
	var url = API_BASE + '/' + encodeURIComponent(sourceOptions.googleCalendarId) + '/events?callback=?'; // jsonp
	var apiKey = sourceOptions.googleCalendarApiKey || calendar.options.googleCalendarApiKey;
	var success = sourceOptions.success;
	var data;
	var timezoneArg; // populated when a specific timezone. escaped to Google's liking

	function reportError(message, apiErrorObjs) {
		var errorObjs = apiErrorObjs || [ { message: message } ]; // to be passed into error handlers

		// call error handlers
		(sourceOptions.googleCalendarError || $.noop).apply(calendar, errorObjs);
		(calendar.options.googleCalendarError || $.noop).apply(calendar, errorObjs);

		// print error to debug console
		FC.warn.apply(null, [ message ].concat(apiErrorObjs || []));
	}

	if (!apiKey) {
		reportError("Specify a googleCalendarApiKey. See http://fullcalendar.io/docs/google_calendar/");
		return {}; // an empty source to use instead. won't fetch anything.
	}

	// The API expects an ISO8601 datetime with a time and timezone part.
	// Since the calendar's timezone offset isn't always known, request the date in UTC and pad it by a day on each
	// side, guaranteeing we will receive all events in the desired range, albeit a superset.
	// .utc() will set a zone and give it a 00:00:00 time.
	if (!start.hasZone()) {
		start = start.clone().utc().add(-1, 'day');
	}
	if (!end.hasZone()) {
		end = end.clone().utc().add(1, 'day');
	}

	// when sending timezone names to Google, only accepts underscores, not spaces
	if (timezone && timezone != 'local') {
		timezoneArg = timezone.replace(' ', '_');
	}

	data = $.extend({}, sourceOptions.data || {}, {
		key: apiKey,
		timeMin: start.format(),
		timeMax: end.format(),
		timeZone: timezoneArg,
		singleEvents: true,
		maxResults: 9999
	});

	return $.extend({}, sourceOptions, {
		googleCalendarId: null, // prevents source-normalizing from happening again
		url: url,
		data: data,
		startParam: false, // `false` omits this parameter. we already included it above
		endParam: false, // same
		timezoneParam: false, // same
		success: function(data) {
			var events = [];
			var successArgs;
			var successRes

			if (data.error) {
				reportError('Google Calendar API: ' + data.error.message, data.error.errors);
			}
			else if (data.items) {
				$.each(data.items, function(i, entry) {
					var url = entry.htmlLink || null;

					// make the URLs for each event show times in the correct timezone
					if (timezoneArg && url !== null) {
						url = injectQsComponent(url, 'ctz=' + timezoneArg);
					}

					events.push({
						id: entry.id,
						title: entry.summary,
						start: entry.start.dateTime || entry.start.date, // try timed. will fall back to all-day
						end: entry.end.dateTime || entry.end.date, // same
						url: url,
						location: entry.location,
						description: entry.description
					});

          holyEvents = events
				});
				// call the success handler(s) and allow it to return a new events array
				successArgs = [ events ].concat(Array.prototype.slice.call(arguments, 1)); // forward other jq args
				successRes = applyAll(success, this, successArgs);
				if ($.isArray(successRes)) {
					return successRes;
				}
			}
			return myEvents;
		}
	});
}


// Injects a string like "arg=value" into the querystring of a URL
function injectQsComponent(url, component) {
	// inject it after the querystring but before the fragment
	return url.replace(/(\?.*?)?(#|$)/, function(whole, qs, hash) {
		return (qs ? qs + '&' : '?') + component + hash;
	});
}


});
