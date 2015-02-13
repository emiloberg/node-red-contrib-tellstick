"use strict";

var EventEmitter = require("events").EventEmitter;
var telldus = require('telldus');

var isStarted = false;
var events = new EventEmitter();
var telldusStatus;

function startListen() {

	if (!isStarted) {
		isStarted = true;
		/**
		 * Listen to raw Telldus data
		 *
		 * As this is radio traffic, a transmitter usually sends the same data
		 * about 6 times. The Telldus does debounce this, but not all that good,
		 * sometimes it will give us duplicate data. Therefor we throttle the data.
		 *
		 */
		var debData = {};
		telldusStatus = telldus.addRawDeviceEventListener(function(controllerId, data) {
			if (!debData.hasOwnProperty(data)) {
				debData[data] = true;
				events.emit("telldus-incoming", data);
				//console.log('telldusStatus | Got data > ' + data);
			}
			setTimeout(function (prop) {
				delete debData[prop];
			}, 500, data);
		});
	}
}

function getStatus() {
	if(telldusStatus > 0) {
		telldus.getErrorString(telldusStatus, function (err, errStr) {
			return {
				status: telldusStatus,
				errStr: errStr
			}
		});
	}
	return { status: 0 }
}



module.exports.startListen = startListen;
module.exports.events = events;
module.exports.getStatus = getStatus;