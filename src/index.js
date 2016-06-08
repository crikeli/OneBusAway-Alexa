var http = require('http'),
    AlexaSkill = require('./AlexaSkill'),
    APP_ID = 'YOUR APP ID FROM AMAZON',
    OBA_KEY = 'ONEBUSAWAY API KEY HERE PLEASE';

// Defining the URL that makes the requests
var url = function(stopId) {
    return 'http://api.pugetsound.onebusaway.org/api/where/arrivals-and-departures-for-stop/1_' + stopId + '.json?key=' + OBA_KEY;
};

// Using nodes http library, I am able to get back the response from the url and parse the json body.
// I also account for any other errors.
var getJsonFromOba = function(stopId, callback) {
    http.get(url(stopId), function(res) {
        var body = '';

        res.on('data', function(data) {
            body += data;
        });

        res.on('end', function() {
            var result = JSON.parse(body);
            callback(result);
        });

    }).on('error', function(e) {
        console.log('Error: ' + e);
    });
};

// The main function where all the data manipulation between amazon ASK API and the data I am able to access from the end-point URL.
var handleNextBusRequest = function(intent, session, response) {
    // The first parameter passed through the getJson function is the value that is said by the user (busStop Id).
    getJsonFromOba(intent.slots.bus.value, function(data) {
        if (data.data.entry.arrivalsAndDepartures[0]) {
            // Accessing the number of stops the bus is away from the requested stop
            var text = data
                .data
                .entry
                .arrivalsAndDepartures[0]
                .numberOfStopsAway;
            // var ETA = data
            //     .data
            //     .entry
            //     .arrivalsAndDepartures[0]
            //     .predictedArrivalTime;
            // var right_now = new Date(ETA).getHours().getMinutes();
            // The name of the route
            var moreInfo = data
                .data
                .entry
                .arrivalsAndDepartures[0]
                .routeShortName;
            // Accesses what the trips final destination is.
            var destination = data
                .data
                .entry
                .arrivalsAndDepartures[0]
                .tripHeadsign
            var output = 'The next bus is route number ' + moreInfo + ', heading to ' + destination + '. It is currently ' + text + ' stops away.';
            // and scheduled to arrive at ' + right_now;
        } else {
            var text = 'That bus stop does not exist.'
            var output = text;
        }

        var heading = 'Next bus for stop: ' + intent.slots.bus.value;
        // This is the response that "tells" the user about the current status pertaining to the output.
        response.tell(output, heading);
    });
};

// BusSchedule becomes a function that is dependent on calling the AlexaSkill. It's parameters are; itself and the APP_ID.
var BusSchedule = function() {
    AlexaSkill.call(this, APP_ID);
};

BusSchedule.prototype = Object.create(AlexaSkill.prototype);
BusSchedule.prototype.constructor = BusSchedule;


// The Alexa Skills Kit Functions can be over ridden if need be to tailor for specific case use.
BusSchedule.prototype.eventHandlers.onLaunch = function(launchRequest, session, response) {
    // This is when they launch the skill but don't specify what they want. Prompt
    // them for their bus stop
    var output = 'Welcome to Bus Schedule. ' +
        'Say the number of a bus stop to know how far away the next bus is .';

    var reprompt = 'Which bus stop do you want to find more about?';

    response.ask(output, reprompt);

    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
};

// This intent handler has a reference to the the handleNextBusRequest.
BusSchedule.prototype.intentHandlers = {
    GetNextBusIntent: function(intent, session, response) {
        handleNextBusRequest(intent, session, response);
    },

    // This is the help intent that activates when a user gets stuck.
    HelpIntent: function(intent, session, response) {
        var speechOutput = 'Get the distance from arrival for any Seattle bus stop ID. ' +
            'Which bus stop would you like?';
        response.ask(speechOutput);
    }
};

exports.handler = function(event, context) {
    var skill = new BusSchedule();
    skill.execute(event, context);
};