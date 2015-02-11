"use strict";

var EventEmitter = require("events").EventEmitter;

var isStarted = false;
var events = new EventEmitter();

function start(startedFrom) {
	if (!isStarted) {
		isStarted = true;
		console.dir('Started the Telldus. ' + startedFrom);

		/**
		 * Listen to raw Telldus data
		 *
		 * As this is radio traffic, a transmitter usually sends the same data
		 * about 6 times. The Telldus does debounce this, but not all that good,
		 * sometimes it will give us duplicate data. Therefor we throttle the data.
		 *
		 */
		var debData = {};
		var xtelldus = require('telldus');
		var listener = xtelldus.addRawDeviceEventListener(function(controllerId, data) {
			if (!debData.hasOwnProperty(data)) {
				debData[data] = true;
				events.emit("telldus-incoming", data);
			}
			setTimeout(function (prop) {
				delete debData[prop];
			}, 500, data);
		});
		
	}
}



module.exports.start = start;
module.exports.events = events;